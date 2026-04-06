import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Volume2, VolumeX, Loader2, Mic } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
}

const STARTER_PROMPTS = [
  "My arm isn't improving — what should I focus on today?",
  "I'm feeling discouraged. Help me get back on track.",
  "What's one exercise I can do right now?",
  "How do I stay consistent when progress feels invisible?",
];

export default function SasquatchCoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      content:
        "Hey warrior. I'm Sasquatch — your round-the-clock recovery coach. I've been through what you're going through, and I'm here to push you when you need pushing and steady you when you need steadying. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      const data = await apiRequest("POST", "/api/coach/chat", { message, history });
      return data as { response: string; audioBase64?: string };
    },
    onSuccess: (data) => {
      const coachMsg: Message = {
        role: "coach",
        content: data.response,
        audioBase64: data.audioBase64,
      };
      setMessages((prev) => [...prev, coachMsg]);
      if (audioEnabled && data.audioBase64) {
        playAudio(data.audioBase64);
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
            <h1 className="text-2xl font-black text-white">Sasquatch Coach</h1>
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
                <Volume2 className="h-4 w-4 text-[#C9941A]" />
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
                <div className="w-8 h-8 rounded-full bg-[#C9941A]/10 border border-[#C9941A]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mic className="h-3.5 w-3.5 text-[#C9941A]" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#C9941A] text-black font-medium rounded-tr-sm"
                    : "bg-[#111] text-gray-200 border border-[#1e1e1e] rounded-tl-sm"
                }`}
              >
                {msg.content}
                {msg.role === "coach" && msg.audioBase64 && audioEnabled && (
                  <button
                    className="mt-2 flex items-center gap-1 text-xs text-[#C9941A] opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => playAudio(msg.audioBase64!)}
                    data-testid={`button-replay-audio-${i}`}
                  >
                    <Volume2 className="h-3 w-3" /> Replay
                  </button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white">
                  {(user as any)?.firstName?.[0] || "Y"}
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start" data-testid="coach-typing">
              <div className="w-8 h-8 rounded-full bg-[#C9941A]/10 border border-[#C9941A]/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Mic className="h-3.5 w-3.5 text-[#C9941A]" />
              </div>
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-[#C9941A]/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#C9941A]/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#C9941A]/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts — only shown before first user message */}
        {messages.filter((m) => m.role === "user").length === 0 && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleStarter(prompt)}
                disabled={chatMutation.isPending}
                className="text-left px-4 py-3 rounded-xl border border-[#1e1e1e] text-sm text-gray-400 hover:text-white hover:border-[#C9941A]/40 transition-colors bg-[#0a0a0a] disabled:opacity-40"
                data-testid={`starter-prompt-${prompt.slice(0, 20).replace(/\s/g, "-")}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tell the coach what's going on..."
            className="resize-none bg-[#111] border-[#1e1e1e] text-white placeholder:text-gray-600 focus-visible:ring-[#C9941A]/30 focus-visible:border-[#C9941A]/40 min-h-[52px] max-h-32"
            rows={1}
            disabled={chatMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-[#C9941A] text-black hover:bg-[#b8841a] flex-shrink-0"
            data-testid="button-send-message"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-gray-600 mt-3">
          Sasquatch Coach is an AI trained on Nick's recovery methodology — not a substitute for medical advice.
        </p>
      </main>
      <Footer />
    </div>
  );
}
