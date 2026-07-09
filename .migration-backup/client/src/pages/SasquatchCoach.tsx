import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send, Volume2, VolumeX, Loader2, Mic, MicOff, Flame, Sparkles,
  ShoppingBag, LogIn, Check, ArrowLeft, TrendingUp, Zap, Users,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import RecoverySEO from "@/components/RecoverySEO";
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

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-4 ml-1 shrink-0">
      {[3, 6, 2, 8, 4].map((base, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full transition-all duration-150"
          style={{
            background: active ? "#C06B3E" : "rgba(192,107,62,0.3)",
            height: active ? `${base + 2}px` : "3px",
            animation: active ? `waveBar 0.7s ease-in-out ${i * 0.1}s infinite alternate` : undefined,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

export default function SasquatchCoach() {
  const { user } = useAuth();
  const { data: personaData } = useQuery<{ persona: { name: string; creed: string; accentColor: string } | null }>({
    queryKey: ["/api/persona/me"],
  });
  const persona = personaData?.persona ?? null;
  const safeAccent = safeAccentForDark(persona?.accentColor);

  const { data: dashData } = useQuery<any>({
    queryKey: ["/api/recovery/dashboard"],
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const buildWelcome = (name: string) =>
    `Hey ${name}. I'm Sasquatch — your round-the-clock recovery coach. I've been through what you're going through, and I'm here to push you when you need pushing and steady you when you need steadying. Heads up — I'm here for accountability and reps, not diagnosis. New symptoms or anything that feels medical go to your doctor; the daily work goes to me. What's on your mind today?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: buildWelcome("warrior") },
  ]);

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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [anonQuota, setAnonQuota] = useState<{ used: number; limit: number } | null>(null);
  const [freeQuota, setFreeQuota] = useState<{ used: number; limit: number } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [thinkingLong, setThinkingLong] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) setMicUnsupported(true);
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      try { audioRef.current?.pause(); } catch {}
      audioRef.current = null;
      setIsPlayingAudio(false);
      for (const u of blobUrlsRef.current) {
        try { URL.revokeObjectURL(u); } catch {}
      }
      blobUrlsRef.current = [];
    };
  }, []);

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
      if (!res.ok) throw new Error(json?.message || `${res.status}`);
      return json as {
        response: string;
        audioBase64?: string;
        crisis?: boolean;
        resources?: CrisisResource[];
        anon?: { used: number; limit: number } | null;
        requireAuth?: boolean;
      };
    },
    onError: (err: Error) => {
      setLastError(err.message || "Something went wrong");
    },
    onSuccess: (data) => {
      setLastError(null);
      setLastFailedInput(null);
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
      const q = (data as any).quota as { used: number; limit: number; premium: boolean } | undefined;
      if (q && !q.premium) setFreeQuota({ used: q.used, limit: q.limit });
      if (data.crisis || data.requireAuth || (data as any).capped) return;
      if (data.audioBase64 && audioEnabled) {
        playAudio(data.audioBase64);
        return;
      }
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
            setIsPlayingAudio(true);
            const cleanup = () => {
              setIsPlayingAudio(false);
              try { URL.revokeObjectURL(url); } catch {}
              blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== url);
            };
            audio.onended = cleanup;
            audio.onerror = cleanup;
            audio.play().catch(() => { setIsPlayingAudio(false); });
          })
          .catch(() => {});
      }
    },
  });

  useEffect(() => {
    if (chatMutation.isPending) {
      setThinkingLong(false);
      thinkingTimerRef.current = setTimeout(() => setThinkingLong(true), 8000);
    } else {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      setThinkingLong(false);
    }
    return () => {
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    };
  }, [chatMutation.isPending]);

  const playAudio = (base64: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setLastError(null);
    setLastFailedInput(text);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chatMutation.mutate(text);
  };

  const handleRetry = () => {
    if (!lastFailedInput || chatMutation.isPending) return;
    setLastError(null);
    chatMutation.mutate(lastFailedInput);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarter = (prompt: string) => {
    setLastError(null);
    setLastFailedInput(prompt);
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    chatMutation.mutate(prompt);
  };

  const startListening = () => {
    if (micUnsupported || isListening || chatMutation.isPending) return;
    if (!user && anonQuota && anonQuota.used >= anonQuota.limit) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    recognition.onerror = () => setIsListening(false);
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
    try { recognition.start(); } catch { setIsListening(false); }
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  };

  const streak = dashData?.streak?.currentStreak ?? 0;
  const totalDays = dashData?.streak?.totalActiveDays ?? 0;
  const lastWin = dashData?.todayCheckin?.winsToday ?? null;
  const personaName = persona?.name || (user as any)?.firstName || (user as any)?.displayName || "Warrior";
  const noUserMessages = messages.filter((m) => m.role === "user").length === 0;

  const isCapped = messages.some((m) => m.capped);
  const anonBlocked = !user && !!anonQuota && anonQuota.used >= anonQuota.limit;
  const inputDisabled = chatMutation.isPending || isCapped || anonBlocked;
  const remaining = freeQuota ? freeQuota.limit - freeQuota.used : null;
  const nearLimit = remaining !== null && remaining <= 1 && remaining > 0;

  return (
    <div className="flex flex-col overflow-hidden" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0F0D0B" }}>
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

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0 z-10"
        style={{ background: "#1A1410", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/recovery/dashboard"
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "rgba(255,255,255,0.3)" }}
            data-testid="link-coach-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#C06B3E] flex items-center justify-center shrink-0">
            <Flame className="h-4 w-4 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] font-bold leading-none">
              Sasquatch Coach
            </p>
            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
              trained on Nick Kremers' 7-year rebuild
            </p>
          </div>
          <WaveformBars active={isPlayingAudio} />
        </div>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors shrink-0"
          style={{
            color: audioEnabled ? "#C06B3E" : "rgba(255,255,255,0.3)",
            background: audioEnabled ? "rgba(192,107,62,0.12)" : "transparent",
          }}
          data-testid="button-toggle-audio"
        >
          {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{audioEnabled ? "Voice on" : "Voice off"}</span>
        </button>
      </header>

      {/* ── Body: chat + context panel ─────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${i}`}
              >
                {/* Coach avatar */}
                {msg.role === "coach" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border"
                    style={{ background: "rgba(192,107,62,0.15)", borderColor: "rgba(192,107,62,0.3)" }}
                  >
                    <Flame className="h-3.5 w-3.5 text-[#C06B3E]" />
                  </div>
                )}

                {/* Message content */}
                {msg.role === "coach" && msg.crisis && msg.crisisResources ? (
                  <div className="max-w-[90%] flex-1">
                    <CrisisCard message={msg.content} resources={msg.crisisResources} />
                  </div>
                ) : msg.role === "coach" && msg.capped ? (
                  <div
                    className="max-w-[90%] flex-1 rounded-2xl overflow-hidden border"
                    style={{ background: "linear-gradient(135deg,#2A1F14,#1A1410)", borderColor: "rgba(192,107,62,0.35)" }}
                    data-testid="coach-upgrade-card"
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-[#C06B3E]" />
                        <span className="text-[10px] uppercase tracking-widest text-[#C06B3E] font-bold">
                          Daily limit — {msg.cappedUsed}/{msg.cappedLimit} messages used
                        </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed mb-1">
                        You've used all your free Coach messages for today.
                      </p>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Tomorrow you get {msg.cappedLimit} more — or go unlimited right now.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {["Unlimited Coach messages", "Daily AI report from Sasquatch", "Survivor Voice Cloning", "Premium Campfire circles"].map((f) => (
                          <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                            <Check className="h-3 w-3 text-[#C06B3E] shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>7-day free trial · $19/mo or $190/yr · Cancel anytime</p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" className="bg-[#C06B3E] text-black font-bold" data-testid="button-coach-start-trial">
                          <Link href="/recovery/premium">
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Start 7-day free trial
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="text-xs border-white/10 text-white/50" data-testid="button-coach-see-premium">
                          <Link href="/recovery/premium">See what's included</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : msg.role === "coach" && msg.requireAuth ? (
                  <div
                    className="max-w-[90%] flex-1 rounded-2xl border p-4"
                    style={{ background: "linear-gradient(135deg,#2A1F14,#1A1410)", borderColor: "rgba(192,107,62,0.35)" }}
                    data-testid="coach-signin-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border" style={{ background: "rgba(192,107,62,0.15)", borderColor: "rgba(192,107,62,0.4)" }}>
                        <LogIn className="h-4 w-4 text-[#C06B3E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 leading-relaxed mb-3">{msg.content}</p>
                        <p className="text-xs italic leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Built by a 7-year survivor — not textbook theory, lived experience baked in.
                        </p>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Sign in unlocks <span className="text-[#C06B3E] font-semibold">Sasquatch's voice replies</span>, <span className="text-[#C06B3E] font-semibold">push-to-talk</span>, and <span className="text-[#C06B3E] font-semibold">unlimited turns</span>.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" className="bg-[#C06B3E] text-black font-semibold" data-testid="button-coach-signin">
                            <a href="/api/login">
                              <LogIn className="h-3.5 w-3.5 mr-1.5" />
                              Sign in free
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="border-white/10 text-white/50" data-testid="button-coach-premium">
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
                        ? "rounded-tr-sm text-black font-medium"
                        : "rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "#C06B3E", color: "#000" }
                        : { background: "#2A2118", color: "rgba(253,251,247,0.9)", border: "1px solid rgba(255,255,255,0.06)" }
                    }
                  >
                    {msg.content}
                    {msg.role === "coach" && msg.audioBase64 && audioEnabled && (
                      <button
                        className="mt-2 flex items-center gap-1 text-xs opacity-50 hover:opacity-90 transition-opacity"
                        style={{ color: "#C06B3E" }}
                        onClick={() => playAudio(msg.audioBase64!)}
                        data-testid={`button-replay-audio-${i}`}
                      >
                        <Volume2 className="h-3 w-3" /> Replay
                      </button>
                    )}
                  </div>
                )}

                {/* User avatar */}
                {msg.role === "user" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold border"
                    style={{
                      background: "rgba(192,107,62,0.15)",
                      borderColor: persona ? `${safeAccent}55` : "rgba(192,107,62,0.3)",
                      color: persona ? safeAccent : "#C06B3E",
                    }}
                    data-testid="avatar-coach-user"
                  >
                    {(persona?.name?.[0] || (user as any)?.firstName?.[0] || "Y").toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex flex-col gap-2" data-testid="coach-typing">
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border" style={{ background: "rgba(192,107,62,0.15)", borderColor: "rgba(192,107,62,0.3)" }}>
                    <Flame className="h-3.5 w-3.5 text-[#C06B3E]" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "#2A2118", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#C06B3E]/60 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
                {thinkingLong && (
                  <div className="flex gap-3 justify-start" data-testid="coach-thinking-long">
                    <div className="w-8 h-8 shrink-0" />
                    <p className="text-xs italic px-1" style={{ color: "rgba(192,107,62,0.55)" }}>
                      Still on it — stroke recovery takes patience too.
                    </p>
                  </div>
                )}
              </div>
            )}
            {!chatMutation.isPending && lastError && (
              <div className="flex gap-3 justify-start" data-testid="coach-error">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border" style={{ background: "rgba(192,107,62,0.1)", borderColor: "rgba(192,107,62,0.2)" }}>
                  <Flame className="h-3.5 w-3.5 text-[#C06B3E]/50" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3" style={{ background: "#2A2118", border: "1px solid rgba(255,80,80,0.15)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Something went wrong. Try again.
                  </p>
                  {lastFailedInput && (
                    <button
                      onClick={handleRetry}
                      className="text-xs font-semibold underline shrink-0"
                      style={{ color: "#C06B3E" }}
                      data-testid="button-coach-retry"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Starter prompts — shown before first user message */}
          {noUserMessages && (
            <div className="px-4 sm:px-6 pb-3 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#C06B3E] mb-2">Jump straight to action</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { href: "/recovery/today", icon: Flame, label: "What should I do today?", sub: "Open The Bonfire", testId: "coach-quick-today" },
                    { href: "/recovery/motivation", icon: Sparkles, label: "I need a fire-up", sub: "Motivation Studio", testId: "coach-quick-motivation" },
                    { href: "/recovery/shop", icon: ShoppingBag, label: "Gear that helped me", sub: "Survivor Shop", testId: "coach-quick-shop" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md border text-left transition-colors hover-elevate"
                      style={{ borderColor: "rgba(192,107,62,0.25)", background: "rgba(192,107,62,0.04)" }}
                      data-testid={item.testId}
                    >
                      <item.icon className="h-4 w-4 text-[#C06B3E] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "rgba(253,251,247,0.85)" }}>{item.label}</p>
                        <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{item.sub}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleStarter(prompt)}
                    disabled={chatMutation.isPending}
                    className="text-left px-4 py-3 rounded-xl border text-sm transition-all disabled:opacity-40"
                    style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}
                    data-testid={`starter-prompt-${prompt.slice(0, 20).replace(/\s/g, "-")}`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div>
                <RecommendationCards surface="coach" />
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="border-t px-4 sm:px-6 py-3 shrink-0" style={{ background: "#1A1410", borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  isCapped
                    ? "Daily limit reached — upgrade for unlimited →"
                    : anonBlocked
                    ? "Sign in to keep talking with Sasquatch..."
                    : isListening
                    ? "Listening — speak naturally..."
                    : "Tell the coach what's going on, or tap the mic..."
                }
                className="resize-none min-h-[48px] max-h-32 text-sm border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "rgba(253,251,247,0.9)",
                  caretColor: "#C06B3E",
                }}
                rows={1}
                disabled={inputDisabled}
                data-testid="input-chat-message"
              />
              {!micUnsupported && (
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={inputDisabled}
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  className={isListening ? "bg-[#C06B3E] text-black shrink-0 animate-pulse" : "shrink-0 border-white/10 text-white/40"}
                  title={isListening ? "Tap to stop" : "Push to talk"}
                  data-testid="button-mic-toggle"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={!input.trim() || inputDisabled}
                size="icon"
                className="bg-[#C06B3E] text-black shrink-0 disabled:opacity-30"
                data-testid="button-send-message"
              >
                {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              {!user ? (
                <p className="text-xs" style={{ color: "rgba(192,107,62,0.65)" }} data-testid="text-anon-quota">
                  {anonQuota
                    ? `${anonQuota.limit - anonQuota.used} of ${anonQuota.limit} free messages left.`
                    : "3 free messages — no sign-up needed."}{" "}
                  <a href="/api/login" className="underline" data-testid="link-anon-signin">Sign in free</a> for voice + more.
                </p>
              ) : freeQuota && !isCapped ? (
                <p className={`text-xs ${nearLimit ? "text-[#C06B3E]" : ""}` } style={nearLimit ? undefined : { color: "rgba(255,255,255,0.25)" }} data-testid="text-free-quota">
                  {nearLimit ? (
                    <><span className="font-semibold">1 free message left today.</span>{" "}<Link href="/recovery/premium" className="underline">Upgrade →</Link></>
                  ) : (
                    <>{freeQuota.limit - freeQuota.used} of {freeQuota.limit} free messages today.{" "}<Link href="/recovery/premium" className="underline" style={{ color: "rgba(192,107,62,0.5)" }}>Go unlimited →</Link></>
                  )}
                </p>
              ) : isCapped ? (
                <p className="text-xs">
                  <Link href="/recovery/premium" className="text-[#C06B3E] font-semibold underline" data-testid="link-capped-upgrade">
                    Start 7-day free trial — unlock unlimited Coach →
                  </Link>
                </p>
              ) : (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Not a substitute for medical advice.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── "Sasquatch Knows" context panel ────────────────────────── */}
        <aside
          className="hidden xl:flex w-72 flex-col border-l overflow-y-auto shrink-0"
          style={{ background: "#141210", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C06B3E] font-bold mb-5">Sasquatch Knows</p>

            {user ? (
              <>
                {/* Identity */}
                <div className="mb-5">
                  <p className="text-lg font-bold text-white/90 leading-tight">{personaName}</p>
                  {persona?.creed && (
                    <p className="text-xs italic mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                      "{persona.creed}"
                    </p>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Streak</p>
                    <p className="text-2xl font-bold text-[#C06B3E] leading-none">{streak}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>days</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Active days</p>
                    <p className="text-2xl font-bold leading-none" style={{ color: "rgba(255,255,255,0.6)" }}>{totalDays}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>total</p>
                  </div>
                </div>

                {/* Last win */}
                {lastWin && (
                  <div className="rounded-lg p-3 mb-5" style={{ background: "rgba(255,255,255,0.04)", borderLeft: "2px solid rgba(192,107,62,0.4)" }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Today's win</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(253,251,247,0.75)" }}>"{lastWin}"</p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t mb-4" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

                {/* Quick nav */}
                <div className="space-y-1">
                  {[
                    { href: "/recovery/dashboard", Icon: TrendingUp, label: "Dashboard" },
                    { href: "/recovery/today", Icon: Zap, label: "Daily reps" },
                    { href: "/recovery/community", Icon: Users, label: "Your squad" },
                    { href: "/recovery/premium", Icon: Sparkles, label: "Premium" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors hover-elevate"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <item.Icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                      <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#C06B3E]/15 flex items-center justify-center mx-auto mb-3">
                  <Flame className="h-5 w-5 text-[#C06B3E]" />
                </div>
                <p className="text-sm mb-1 font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Sign in so Sasquatch knows who you are.
                </p>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Your streak, wins, and profile give Sasquatch the context to coach you right.
                </p>
                <a
                  href="/api/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C06B3E] text-black text-xs font-semibold"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in free
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
