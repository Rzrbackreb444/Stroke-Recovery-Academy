import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Volume2, VolumeX, Loader2, Mic, MicOff, Flame, Sparkles, ShoppingBag, LogIn, Check } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import CrisisCard, { type CrisisResource } from "@/components/recovery/CrisisCard";
import { useAuth } from "@/hooks/useAuth";
import { safeAccentForDark } from "@/lib/personaContrast";
import { RecommendationCards } from "@/components/RecommendationCard";

interface Message {
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
  crisis?: boolean;
  crisisResources?: CrisisResource[];
  requireAuth?: boolean;
  capped?: boolean;
  cappedUsed?: number;
  cappedLimit?: number;
}

const STARTER_PROMPTS = [
  "My arm isn't improving — what should I focus on today?",
  "I'm feeling discouraged. Help me get back on track.",
  "What's one exercise I can do right now?",
  "How do I stay consistent when progress feels invisible?",
];

export default function SasquatchCoach() {
  const { user } = useAuth();
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; accentColor: string } | null }>({
    queryKey: ['/api/persona/me'],
  });
  const persona = personaData?.persona ?? null;
  const safeAccent = safeAccentForDark(persona?.accentColor);
  const buildWelcome = (name: string) =>
    `Hey ${name}. I'm Sasquatch — your round-the-clock recovery coach. I've been through what you're going through, and I'm here to push you when you need pushing and steady you when you need steadying. Heads up — I'm here for accountability and reps, not diagnosis. New symptoms or anything that feels medical go to your doctor; the daily work goes to me. What's on your mind today?`;
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: buildWelcome("warrior") },
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
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track every Blob URL we mint for parallel-fetched TTS audio so we can
  // revoke them all on unmount. Without this they'd accumulate in browser
  // memory across a long conversation.
  const blobUrlsRef = useRef<string[]>([]);

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

  // Pre-fill input from ?prompt= query param (e.g. arriving from book chapter CTAs).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pre = params.get("prompt");
      if (pre) setInput(decodeURIComponent(pre));
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          response: json.message ?? "Sign in to keep talking with Sasquatch.",
          requireAuth: true as const,
          anon: { used: json.anonLimit ?? 3, limit: json.anonLimit ?? 3 },
        };
      }
      if (res.status === 429 && json?.capped) {
        return {
          response: json.message ?? `You've hit your daily Coach message limit.`,
          capped: true as const,
          used: json.used as number,
          limit: json.limit as number,
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
      const coachMsg: Message = {
        role: "coach",
        content: data.response,
        audioBase64: data.audioBase64,
        crisis: data.crisis === true,
        crisisResources: data.crisis ? data.resources : undefined,
        requireAuth: data.requireAuth === true,
        capped: (data as any).capped === true,
        cappedUsed: (data as any).used,
        cappedLimit: (data as any).limit,
      };
      setMessages((prev) => [...prev, coachMsg]);
      if (data.anon) setAnonQuota(data.anon);
      // Never autoplay or fetch audio on crisis, sign-in-gate, or capped responses.
      if (data.crisis || data.requireAuth || (data as any).capped) return;
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
        fetch("/api/coach/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: data.response }),
        })
          .then(async (r) => (r.ok ? r.arrayBuffer() : null))
          .then((buf) => {
            if (!buf) return;
            const blob = new Blob([buf], { type: "audio/mpeg" });
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
          })
          .catch(() => {});
      }
    },
  });

  const playAudio = (base64: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
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
        setMessages((prev) => [...prev, { role: "user", content: text }]);
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
        title="Online Stroke Recovery Coach — Sasquatch AI | Stroke Recovery Academy"
        description="Get a free online stroke recovery coach built by Nick Kremers, a 7-year stroke survivor. 3 free messages, no card. 24/7 accountability — no waiting list, no insurance."
        canonical="/recovery/sasquatch-coach"
        pageType="website"
        keywords={["online stroke recovery coach", "sasquatch coach", "stroke recovery AI coach", "virtual stroke coach", "stroke rehab support online"]}
        breadcrumbs={[
          { name: "Recovery Hub", url: "/recovery" },
          { name: "Online Stroke Recovery Coach", url: "/recovery/sasquatch-coach" },
        ]}
      />
      <RecoveryHeader />

      <main className="flex flex-col flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display text-white">Online Stroke Recovery Coach</h1>
            <p className="text-sm text-gray-500 mt-0.5">Sasquatch — trained on Nick Kremers' 7-year rebuild</p>
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

        {/* Messages */}
        <div className="flex-1 space-y-4 mb-6 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
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
              ) : msg.role === "coach" && msg.capped ? (
                /* ── Premium upgrade gate ── */
                <div
                  className="max-w-[90%] flex-1 rounded-2xl overflow-hidden border border-[#E2741B]/50 bg-gradient-to-br from-[#1a1008] via-[#141008] to-[#0f0c04]"
                  data-testid="coach-upgrade-card"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-[#E2741B]" />
                      <span className="text-[10px] uppercase tracking-widest text-[#E2741B] font-bold">Daily limit reached — {msg.cappedUsed}/{msg.cappedLimit} messages used</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed mb-1">
                      You've used all your free Coach messages for today.
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                      Tomorrow you get {msg.cappedLimit} more — or go unlimited right now. Premium also unlocks daily AI accountability reports, voice cloning, and premium Campfire circles.
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                      {[
                        "Unlimited Coach messages",
                        "Daily AI report from Sasquatch",
                        "Survivor Voice Cloning",
                        "Premium Campfire circles",
                      ].map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Check className="h-3 w-3 text-[#E2741B] flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-600 mb-3">7-day free trial · $19/mo or $190/yr · Cancel anytime</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#E2741B] text-black font-bold"
                        data-testid="button-coach-start-trial"
                      >
                        <Link href="/recovery/premium">
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Start 7-day free trial
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-[#1e1e1e] text-gray-500 text-xs"
                        data-testid="button-coach-see-premium"
                      >
                        <Link href="/recovery/premium">See what's included</Link>
                      </Button>
                    </div>
                  </div>
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
                        Built by a 7-year survivor — not textbook theory, lived experience and real feedback baked in. I learned from the doctors, experimented, failed, then recovered. I'll give you the blueprint. The work is on you.
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
