import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Volume2, VolumeX, Loader2, Mic, MicOff, Flame, Sparkles, ShoppingBag, LogIn, Pencil, Trash2, EyeOff, Eye, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import CrisisCard, { type CrisisResource } from "@/components/recovery/CrisisCard";
import { CoachNextStepCard } from "@/components/recovery/CoachNextStepCard";
import { useAuth } from "@/hooks/useAuth";
import { safeAccentForDark } from "@/lib/personaContrast";
import { RecommendationCards } from "@/components/RecommendationCard";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
  audioStatus?: "pending" | "available" | "unavailable";
  crisis?: boolean;
  crisisResources?: CrisisResource[];
  requireAuth?: boolean;
}

type CoachMemoryItem = {
  id: number;
  sourceType: string;
  sourceId: string;
  occurredAt: string | null;
  title: string;
  content: string;
  kind: "survivor_fact" | "saved_plan";
  included: boolean;
  isEdited: boolean;
};

type CoachMemoryPayload = {
  preferences: {
    includeCheckins: boolean;
    includeToday: boolean;
    includeJournal: boolean;
    includeGoals: boolean;
    includePlans: boolean;
  };
  items: CoachMemoryItem[];
};

type CoachSummary = {
  periodLabel: string;
  facts: CoachMemoryItem[];
  savedPlans: CoachMemoryItem[];
  observations: string[];
};

type CoachHistoryRangeDays = 7 | 30 | 90;

const STARTER_PROMPTS = [
  "My arm isn't improving — help me choose a manageable focus for today.",
  "I'm feeling discouraged. Help me get back on track.",
  "Help me choose between a guided rep, reflection, or intentional rest.",
  "How do I stay consistent when progress feels invisible?",
];

export default function SasquatchCoach() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; accentColor: string } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;
  const safeAccent = safeAccentForDark(persona?.accentColor);
  const buildWelcome = (name: string) =>
    `Hey ${name}. I'm Sasquatch — your recovery accountability companion. I've been through a stroke too, and I'm here to help you reflect, plan, and find a manageable next step. Heads up — I'm not a clinician and I don't diagnose or treat. New symptoms or anything medical belongs with your healthcare team; I can help you prepare questions for them. What's on your mind today?`;
  const messageIdRef = useRef(0);
  const nextMessageId = () => `coach-message-${++messageIdRef.current}`;
  const [messages, setMessages] = useState<Message[]>([
    { id: "coach-welcome", role: "coach", content: buildWelcome("warrior") },
  ]);

  // When persona resolves after first paint, swap the welcome line in-place
  // (only if the user hasn't started chatting yet).
  useEffect(() => {
    if (!persona) return;
    setMessages((prev) => {
      if (prev.length !== 1) return prev;
      const first = prev[0];
      if (first.role !== "coach") return prev;
      const personalized = buildWelcome(persona.name);
      if (first.content === personalized) return prev;
      return [{ ...first, content: personalized }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.name]);
  const [input, setInput] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  // Anonymous-quota hint shown subtly under the input. null = unknown
  // (haven't sent yet), { used, limit } = "X of Y free messages used".
  const [anonQuota, setAnonQuota] = useState<{ used: number; limit: number } | null>(null);
  // Push-to-talk state (browser SpeechRecognition — free, on-device, instant).
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryRangeDays, setSummaryRangeDays] = useState<CoachHistoryRangeDays>(7);
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [memoryDraft, setMemoryDraft] = useState<{ title: string; content: string }>({ title: "", content: "" });
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track every Blob URL we mint for parallel-fetched TTS audio so we can
  // revoke them all on unmount. Without this they'd accumulate in browser
  // memory across a long conversation.
  const blobUrlsRef = useRef<string[]>([]);

  const memoryQuery = useQuery<CoachMemoryPayload>({
    queryKey: ["/api/coach/memory"],
    enabled: !!user,
  });
  const summaryQuery = useQuery<CoachSummary>({
    queryKey: ["/api/coach/memory/summary", { rangeDays: summaryRangeDays }],
    enabled: !!user && summaryOpen,
  });
  const memoryMutation = useMutation({
    mutationFn: async (request: {
      method: "PATCH" | "DELETE";
      url: string;
      body?: Record<string, unknown>;
    }) => {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.body ? { "Content-Type": "application/json" } : undefined,
        credentials: "include",
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.message || "Could not update Coach memory");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/memory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach/memory/summary"] });
      setEditingMemoryId(null);
    },
  });

  const updateMemoryPreferences = (key: keyof CoachMemoryPayload["preferences"], value: boolean) => {
    memoryMutation.mutate({
      method: "PATCH",
      url: "/api/coach/memory/preferences",
      body: { [key]: value },
    });
  };

  const startMemoryEdit = (item: CoachMemoryItem) => {
    setEditingMemoryId(item.id);
    setMemoryDraft({ title: item.title, content: item.content });
  };

  const sourceLabels: Record<string, string> = {
    checkin: "Daily check-in",
    today: "Today feedback",
    journal: "Journal",
    goal: "Recovery goal",
    plan: "Saved plan",
  };

  // Probe for SpeechRecognition once on mount, and clean up an in-flight
  // recognition + any orphan Blob URLs on unmount so the browser's "mic in
  // use" indicator and the audio Blobs don't leak across navigations.
  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) setMicUnsupported(true);
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
      try {
        audioRef.current?.pause();
      } catch {}
      audioRef.current = null;
      for (const u of blobUrlsRef.current) {
        try { URL.revokeObjectURL(u); } catch {}
      }
      blobUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setAudioStatus = (messageId: string, audioStatus: Message["audioStatus"]) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? { ...message, audioStatus } : message)),
    );
  };

  const playAudio = (base64: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  // Voice is a convenience layered on top of the durable text reply. A retry
  // only requests audio for the existing message; it must never call chat again
  // or create a duplicate Coach turn.
  const requestCoachAudio = async (messageId: string, text: string) => {
    setAudioStatus(messageId, "pending");
    try {
      const response = await fetch("/api/coach/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("Audio unavailable");
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength) throw new Error("Audio unavailable");

      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      const cleanup = () => {
        try { URL.revokeObjectURL(url); } catch {}
        blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url);
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;
      setAudioStatus(messageId, "available");
    } catch {
      setAudioStatus(messageId, "unavailable");
    }
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      // Direct fetch (not apiRequest) so we can read the body on 401 — the
      // anonymous gate returns 401 { requireAuth: true } which we render
      // inline as a sign-in card, not as a thrown error.
      // skipAudio: true — server returns text the instant Gemini finishes
      // and we fetch the ElevenLabs voice in parallel via /api/coach/speak
      // below. Drops perceived latency by the full TTS round-trip.
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, history, skipAudio: true }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (res.status === 401 && json?.requireAuth) {
        return {
          response: (json.message ?? "Sign in to keep talking with Sasquatch.") as string,
          requireAuth: true,
          anon: { used: (json.anonLimit ?? 3) as number, limit: (json.anonLimit ?? 3) as number },
        } as {
          response: string;
          audioBase64?: string;
          crisis?: boolean;
          resources?: CrisisResource[];
          anon?: { used: number; limit: number } | null;
          requireAuth?: boolean;
        };
      }
      if (!res.ok) {
        throw new Error(json?.message || `${res.status}`);
      }
      return json as {
        response: string;
        audioBase64?: string;
        crisis?: boolean;
        resources?: CrisisResource[];
        anon?: { used: number; limit: number } | null;
        requireAuth?: boolean;
      };
    },
    onSuccess: (data) => {
      const messageId = nextMessageId();
      const canRequestAudio = !data.crisis && !data.requireAuth && !!audioEnabled && !!user;
      const coachMsg: Message = {
        id: messageId,
        role: "coach",
        content: data.response,
        audioBase64: data.audioBase64,
        audioStatus: data.audioBase64
          ? "available"
          : canRequestAudio
          ? "pending"
          : undefined,
        crisis: data.crisis === true,
        crisisResources: data.crisis ? data.resources : undefined,
        requireAuth: data.requireAuth === true,
      };
      setMessages((prev) => [...prev, coachMsg]);
      if (data.anon) setAnonQuota(data.anon);
      // Never autoplay or fetch audio on crisis or sign-in-gate responses.
      if (data.crisis || data.requireAuth) return;
      // Inline audio (legacy path) → just play.
      if (data.audioBase64 && audioEnabled) {
        playAudio(data.audioBase64);
        return;
      }
      // Fast-path: text already on screen, kick off TTS in parallel and
      // play it as soon as it lands. We deliberately don't try to stash
      // the URL back onto the message for "Replay" — by the time the TTS
      // resolves the user may have sent another turn and any index/id we
      // recorded would race. The "Replay" affordance only renders when
      // the server returned base64 inline (legacy/non-fast path).
      // Voice is signed-in only (server enforces via isAuthenticated on
      // /api/coach/speak); no point firing for anon users.
      if (audioEnabled && user) {
        void requestCoachAudio(messageId, data.response);
      }
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: text }]);
    setInput("");
    chatMutation.mutate(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarter = (prompt: string) => {
    setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: prompt }]);
    chatMutation.mutate(prompt);
  };

  // Push-to-talk: tap to start, tap again to stop. On `result` we drop
  // the transcript into the input box and auto-send so the survivor
  // doesn't have to reach for the keyboard. All STT runs on-device via
  // the browser's SpeechRecognition — no audio leaves the laptop.
  const startListening = () => {
    if (micUnsupported || isListening || chatMutation.isPending) return;
    if (!user && anonQuota && anonQuota.used >= anonQuota.limit) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setInput((finalTranscript + interim).trim());
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text) {
        setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: text }]);
        setInput("");
        chatMutation.mutate(text);
      }
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      <RecoverySEO
        title="Sasquatch Coach — Your 24/7 AI Stroke Recovery Companion | Stroke Recovery Academy"
        description="Meet Sasquatch — a 24/7 AI recovery coach trained on Nick Kremers' method. Accountability-focused, always available, built for stroke warriors who refuse to quit."
        canonical="/recovery/sasquatch-coach"
        pageType="website"
        keywords={["sasquatch coach", "stroke recovery AI coach", "recovery accountability coach", "stroke rehab support"]}
        breadcrumbs={[
          { name: "Recovery Hub", url: "/recovery" },
          { name: "Sasquatch Coach", url: "/recovery/sasquatch-coach" },
        ]}
      />
      <RecoveryHeader />

      <main className="flex flex-col flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display text-white">Sasquatch Coach</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your 24/7 recovery accountability partner</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-[#1e1e1e] hover:border-[#333] transition-colors"
              data-testid="button-toggle-audio"
              title={audioEnabled ? "Mute voice" : "Enable voice"}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4 text-[#E2741B]" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{audioEnabled ? "Voice on" : "Voice off"}</span>
            </button>
          </div>
        </div>

        <CoachNextStepCard
          signedIn={!!user}
          onPrompt={(prompt) => {
            setInput(prompt);
            requestAnimationFrame(() => textareaRef.current?.focus());
          }}
        />

        {user && (
          <section
            className="mb-6 rounded-xl border border-[#2a2621] bg-[#111] p-4"
            aria-labelledby="coach-memory-heading"
            data-testid="section-coach-memory"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2741B]">
                  Survivor-controlled memory
                </p>
                <h2 id="coach-memory-heading" className="text-lg font-semibold text-white">
                  Give Coach continuity — on your terms
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-400">
                  Coach only uses sources you turn on here. Journal and check-in details can be personal health information, so they stay off until you explicitly approve them.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#E2741B]/40 text-[#E2741B] hover:bg-[#E2741B]/10"
                onClick={() => setSummaryOpen((open) => !open)}
                data-testid="button-coach-memory-summary"
              >
                {summaryOpen ? "Hide recovery summary" : "Review recovery history"}
              </Button>
            </div>

            {memoryQuery.isLoading ? (
              <p className="mt-4 text-xs text-gray-500">Loading your memory controls…</p>
            ) : memoryQuery.isError ? (
              <p className="mt-4 text-xs text-amber-300">Coach memory is unavailable right now. Your chat still works normally.</p>
            ) : memoryQuery.data ? (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="coach-memory-preferences">
                  {([
                    ["includeCheckins", "Daily check-ins", "Mood, energy, pain, effort, and words you entered"],
                    ["includeToday", "Today feedback", "Your own reactions to suggested recovery reps"],
                    ["includeJournal", "Private journal", "Journal words from the selected range — explicit consent required"],
                    ["includeGoals", "Recovery goals", "Goals you saved, including their current status"],
                    ["includePlans", "Saved plans", "The latest plan summary and focus areas"],
                  ] as const).map(([key, label, description]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#24211d] bg-[#0d0d0d] p-3 hover:border-[#E2741B]/30"
                    >
                      <input
                        type="checkbox"
                        checked={memoryQuery.data!.preferences[key]}
                        onChange={(event) => updateMemoryPreferences(key, event.target.checked)}
                        disabled={memoryMutation.isPending}
                        className="mt-0.5 accent-[#E2741B]"
                        data-testid={`checkbox-coach-memory-${key}`}
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-200">{label}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {summaryOpen && (
                  <div className="mt-4 rounded-lg border border-[#E2741B]/25 bg-[#17130f] p-4" data-testid="card-coach-history-summary">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E2741B]">
                        Coach recovery summary · {summaryQuery.data?.periodLabel ?? `Last ${summaryRangeDays} days`}
                      </p>
                      <label className="flex items-center gap-2 text-xs text-gray-400" htmlFor="coach-summary-range">
                        Review range
                        <select
                          id="coach-summary-range"
                          value={summaryRangeDays}
                          onChange={(event) => setSummaryRangeDays(Number(event.target.value) as CoachHistoryRangeDays)}
                          className="rounded border border-[#3a2b20] bg-[#0d0d0d] px-2 py-1.5 text-xs text-gray-200"
                          data-testid="select-coach-summary-range"
                        >
                          <option value={7}>Last 7 days</option>
                          <option value={30}>Last 30 days</option>
                          <option value={90}>Last 90 days</option>
                        </select>
                      </label>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      This review uses only the source types you approved above. Survivor-entered facts, saved plans, and Coach observations stay separate.
                    </p>
                    {summaryQuery.isLoading ? (
                      <p className="mt-3 text-sm text-gray-400">Putting together only the approved pieces…</p>
                    ) : summaryQuery.isError ? (
                      <p className="mt-3 text-sm text-amber-300">I couldn’t prepare that summary. Nothing outside your approved sources was used.</p>
                    ) : summaryQuery.data ? (
                      <div className="mt-3 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Survivor-entered facts</p>
                          {summaryQuery.data.facts.length ? (
                            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-200">
                              {summaryQuery.data.facts.map((item) => (
                                <li key={`summary-fact-${item.id}`}>• {item.content}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-gray-500">No approved survivor-entered facts in this range.</p>
                          )}
                        </div>
                        {summaryQuery.data.savedPlans.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Saved plans</p>
                            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-200">
                              {summaryQuery.data.savedPlans.map((item) => (
                                <li key={`summary-plan-${item.id}`}>• {item.content}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#E2741B]">Coach observations · patterns, not facts</p>
                          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-300">
                            {summaryQuery.data.observations.map((observation) => (
                              <li key={observation}>• {observation}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">What Coach remembers</p>
                    <p className="text-[11px] text-gray-600">{memoryQuery.data.items.length} item{memoryQuery.data.items.length === 1 ? "" : "s"}</p>
                  </div>
                  {memoryQuery.data.items.length ? (
                    <div className="mt-2 space-y-2">
                      {memoryQuery.data.items.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-lg border p-3 ${item.included ? "border-[#24211d] bg-[#0d0d0d]" : "border-dashed border-[#333] bg-[#101010] opacity-60"}`}
                          data-testid={`coach-memory-item-${item.id}`}
                        >
                          {editingMemoryId === item.id ? (
                            <div className="space-y-2">
                              <input
                                value={memoryDraft.title}
                                onChange={(event) => setMemoryDraft((draft) => ({ ...draft, title: event.target.value }))}
                                className="w-full rounded border border-[#333] bg-[#0b0b0b] px-2 py-1.5 text-sm text-white"
                                aria-label="Memory title"
                              />
                              <Textarea
                                value={memoryDraft.content}
                                onChange={(event) => setMemoryDraft((draft) => ({ ...draft, content: event.target.value }))}
                                className="min-h-[70px] border-[#333] bg-[#0b0b0b] text-sm text-white"
                                aria-label="Memory content"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[#E2741B] text-black hover:bg-[#c96112]"
                                  disabled={memoryMutation.isPending}
                                  onClick={() => memoryMutation.mutate({
                                    method: "PATCH",
                                    url: `/api/coach/memory/items/${item.id}`,
                                    body: memoryDraft,
                                  })}
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" /> Save
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="border-[#333] text-gray-300" onClick={() => setEditingMemoryId(null)}>
                                  <X className="mr-1 h-3.5 w-3.5" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{item.title}</p>
                                  <p className="mt-1 text-xs leading-relaxed text-gray-400">{item.content}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-600">
                                    {sourceLabels[item.sourceType] ?? item.sourceType}{item.isEdited ? " · edited by you" : ""}{item.included ? "" : " · excluded from Coach"}
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <button type="button" onClick={() => startMemoryEdit(item)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white" aria-label={`Edit ${item.title}`}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => memoryMutation.mutate({
                                      method: "PATCH",
                                      url: `/api/coach/memory/items/${item.id}`,
                                      body: { included: !item.included },
                                    })}
                                    className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white"
                                    aria-label={item.included ? `Exclude ${item.title}` : `Include ${item.title}`}
                                  >
                                    {item.included ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm("Delete this memory item? The original entry will not be deleted.")) {
                                        memoryMutation.mutate({
                                          method: "DELETE",
                                          url: `/api/coach/memory/items/${item.id}`,
                                        });
                                      }
                                    }}
                                    className="rounded p-1.5 text-gray-500 hover:bg-red-950/50 hover:text-red-300"
                                    aria-label={`Delete ${item.title}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 rounded-lg border border-dashed border-[#2a2621] p-3 text-sm text-gray-500">
                      Turn on a source above to approve recovery history for Coach.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 mb-6 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${msg.role}-${i}`}
            >
              {msg.role === "coach" && (
                <div className="w-8 h-8 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mic className="h-3.5 w-3.5 text-[#E2741B]" />
                </div>
              )}
              {msg.role === "coach" && msg.crisis && msg.crisisResources ? (
                <div className="max-w-[90%] flex-1">
                  <CrisisCard message={msg.content} resources={msg.crisisResources} />
                </div>
              ) : msg.role === "coach" && msg.requireAuth ? (
                <div
                  className="max-w-[90%] flex-1 rounded-2xl border border-[#E2741B]/40 bg-gradient-to-br from-[#1a1410] to-[#0f0c08] p-4"
                  data-testid="coach-signin-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/40 flex items-center justify-center flex-shrink-0">
                      <LogIn className="h-4 w-4 text-[#E2741B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-relaxed mb-3">
                        {msg.content}
                      </p>
                      <p className="text-xs italic text-gray-400 leading-relaxed mb-3">
                        Built from one survivor's lived experience and feedback — not clinical care or a promise about your outcome. I'll help you reflect and choose a manageable next step; your healthcare team guides medical decisions.
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        Sign in unlocks <span className="text-[#E2741B] font-semibold">Sasquatch's actual voice replies</span>, <span className="text-[#E2741B] font-semibold">push-to-talk</span> so you can speak instead of type, <span className="text-[#E2741B] font-semibold">unlimited Coach turns</span>, and a thread that resumes where you left off. 7 days free, then cancel anytime — no card needed to start.
                      </p>
                      <p className="text-xs italic text-[#E2741B]/80 mb-3">
                        Sasquatch has your back. Heart still thumpin', life's still pumpin'.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="bg-[#E2741B] hover:bg-[#E2741B] text-black font-semibold"
                          data-testid="button-coach-signin"
                        >
                          <a href="/api/login">
                            <LogIn className="h-3.5 w-3.5 mr-1.5" />
                            Sign in free
                          </a>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-[#E2741B]/40 text-[#E2741B] hover:bg-[#E2741B]/10"
                          data-testid="button-coach-premium"
                        >
                          <Link href="/recovery/premium">
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            See Premium
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#E2741B] text-black font-medium rounded-tr-sm"
                      : "bg-[#111] text-gray-200 border border-[#1e1e1e] rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "coach" && msg.audioBase64 && audioEnabled && (
                    <button
                      className="mt-2 flex items-center gap-1 text-xs text-[#E2741B] opacity-60 hover:opacity-100 transition-opacity"
                      onClick={() => playAudio(msg.audioBase64!)}
                      data-testid={`button-replay-audio-${i}`}
                    >
                      <Volume2 className="h-3 w-3" /> Replay
                    </button>
                  )}
                   {msg.role === "coach" && msg.audioStatus === "unavailable" && (
                     <div
                       className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#2a2a2a] pt-2 text-xs text-gray-400"
                       role="status"
                       data-testid={`coach-audio-unavailable-${i}`}
                     >
                       <span>Voice audio is unavailable right now. Your text response is still here.</span>
                       <button
                         type="button"
                         className="font-medium text-[#E2741B] hover:text-[#f08a35] underline-offset-2 hover:underline"
                         onClick={() => void requestCoachAudio(msg.id, msg.content)}
                         data-testid={`button-retry-audio-${i}`}
                       >
                         Retry voice
                       </button>
                     </div>
                   )}
                </div>
              )}
              {msg.role === "user" && (
                <div
                  className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold border"
                  style={{
                    color: persona ? safeAccent : "#FFFFFF",
                    borderColor: persona ? `${safeAccent}55` : "#333",
                  }}
                  data-testid="avatar-coach-user"
                >
                  {(persona?.name?.[0] || (user as any)?.firstName?.[0] || "Y").toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start" data-testid="coach-typing">
              <div className="w-8 h-8 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Mic className="h-3.5 w-3.5 text-[#E2741B]" />
              </div>
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-[#E2741B]/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#E2741B]/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#E2741B]/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions + starter prompts — only shown before first user message */}
        {messages.filter((m) => m.role === "user").length === 0 && (
          <>
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#E2741B] mb-2">Jump straight to action</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href="/recovery/today"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-[#E2741B]/30 bg-[#1a1610] hover-elevate text-left"
                  data-testid="coach-quick-today"
                >
                  <Flame className="h-4 w-4 text-[#E2741B] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">What should I do today?</p>
                    <p className="text-[11px] text-gray-400 truncate">Open The Bonfire</p>
                  </div>
                </Link>
                <Link
                  href="/recovery/motivation"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-[#E2741B]/30 bg-[#1a1610] hover-elevate text-left"
                  data-testid="coach-quick-motivation"
                >
                  <Sparkles className="h-4 w-4 text-[#E2741B] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">I need a fire-up</p>
                    <p className="text-[11px] text-gray-400 truncate">Motivation Studio</p>
                  </div>
                </Link>
                <Link
                  href="/recovery/shop"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-[#E2741B]/30 bg-[#1a1610] hover-elevate text-left"
                  data-testid="coach-quick-shop"
                >
                  <ShoppingBag className="h-4 w-4 text-[#E2741B] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">Gear that helped me</p>
                    <p className="text-[11px] text-gray-400 truncate">Survivor Shop</p>
                  </div>
                </Link>
              </div>
            </div>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleStarter(prompt)}
                disabled={chatMutation.isPending}
                className="text-left px-4 py-3 rounded-xl border border-[#1e1e1e] text-sm text-gray-400 hover:text-white hover:border-[#E2741B]/40 transition-colors bg-[#0a0a0a] disabled:opacity-40"
                data-testid={`starter-prompt-${prompt.slice(0, 20).replace(/\s/g, "-")}`}
              >
                {prompt}
              </button>
            ))}
          </div>
          {/* Further reading — Gemini-curated Nick quote + deep link.
              Sits after the primary "Quick actions" + starter prompts so
              it never competes with them as a primary CTA. */}
          <div className="mb-4">
            <RecommendationCards surface="coach" />
          </div>
          </>
        )}

        {/* Input */}
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              !user && anonQuota && anonQuota.used >= anonQuota.limit
                ? "Sign in to keep talking with Sasquatch..."
                : isListening
                ? "Listening — speak naturally, tap mic to stop..."
                : "Tell the coach what's going on, or tap the mic to talk..."
            }
            className="resize-none bg-[#111] border-[#1e1e1e] text-white placeholder:text-gray-600 focus-visible:ring-[#E2741B]/30 focus-visible:border-[#E2741B]/40 min-h-[52px] max-h-32"
            rows={1}
            disabled={chatMutation.isPending || (!user && !!anonQuota && anonQuota.used >= anonQuota.limit)}
            data-testid="input-chat-message"
          />
          {!micUnsupported && (
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={
                chatMutation.isPending ||
                (!user && !!anonQuota && anonQuota.used >= anonQuota.limit)
              }
              variant={isListening ? "default" : "outline"}
              className={
                isListening
                  ? "bg-[#E2741B] text-black hover:bg-[#b8841a] flex-shrink-0 animate-pulse"
                  : "border-[#1e1e1e] text-[#E2741B] hover:bg-[#E2741B]/10 flex-shrink-0"
              }
              title={isListening ? "Tap to stop" : "Push to talk"}
              data-testid="button-mic-toggle"
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending || (!user && !!anonQuota && anonQuota.used >= anonQuota.limit)}
            className="bg-[#E2741B] text-black hover:bg-[#b8841a] flex-shrink-0"
            data-testid="button-send-message"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!user && anonQuota && anonQuota.used < anonQuota.limit && (
          <p
            className="text-xs text-center text-[#E2741B]/70 mt-2"
            data-testid="text-anon-quota"
          >
            {anonQuota.limit - anonQuota.used} of {anonQuota.limit} free Coach messages left.{" "}
            <a href="/api/login" className="underline hover:text-[#E2741B]" data-testid="link-anon-signin">
              Sign in free
            </a>{" "}
            for Sasquatch's voice + push-to-talk + unlimited turns.
          </p>
        )}
        <p className="text-xs text-center text-gray-600 mt-3">
          Sasquatch Coach is an AI trained on Nick's recovery methodology — not a substitute for medical advice.
        </p>
      </main>
      <Footer />
    </div>
  );
}
