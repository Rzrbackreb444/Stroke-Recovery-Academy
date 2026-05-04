import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Volume2, MessageCircle, User, Loader2, Mic, MicOff, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
}

const QUICK_PROMPTS = [
  "What should I do today?",
  "I'm struggling — help",
  "Audit my last 24 hours",
  "Explain S.A.S.C.H.",
  "Tell me a comeback story",
];

const WELCOME_FRESH = "Hey. Nick here — the Stroked Out Sasquatch. What's on your mind today?";
const WELCOME_RETURNING = "Welcome back. I remember where we left off. What's the next move?";

export default function SasquatchCoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      content: WELCOME_FRESH,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const historySeededRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persistent thread — load once on mount. Anonymous users get an empty
  // array (server fails open), so the welcome line stays.
  const { data: historyData } = useQuery<{
    messages: Array<{ id: number; role: string; content: string; createdAt: string }>;
  }>({
    queryKey: ["/api/coach/history"],
    staleTime: Infinity,
  });

  useEffect(() => {
    if (historySeededRef.current) return;
    if (!historyData) return;
    historySeededRef.current = true;
    if (historyData.messages.length === 0) return;
    const seeded: Message[] = historyData.messages.map((m) => ({
      id: `srv-${m.id}`,
      role: m.role === "user" ? "user" : "coach",
      content: m.content,
    }));
    // Race-safe: if the survivor already started a new turn before history
    // resolved, leave their in-flight thread alone. Functional setState
    // reads the latest messages array even though it's not in deps.
    setMessages((prev) => {
      if (prev.length > 1) return prev;
      return [
        { id: "welcome", role: "coach", content: WELCOME_RETURNING },
        ...seeded,
      ];
    });
  }, [historyData]);

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/coach/history");
      return res.json();
    },
    onSuccess: () => {
      setMessages([{ id: "welcome", role: "coach", content: "Clean slate. What's on your mind?" }]);
      queryClient.invalidateQueries({ queryKey: ["/api/coach/history"] });
    },
  });

  const handleClear = () => {
    if (clearMutation.isPending) return;
    if (typeof window !== "undefined" && !window.confirm("Clear our entire conversation? This can't be undone.")) return;
    clearMutation.mutate();
  };

  // Probe SpeechRecognition + clean up mic / audio / blob URLs on unmount.
  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) || null;
    if (!SR) setMicUnsupported(true);
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      try { audioRef.current?.pause(); } catch {}
      audioRef.current = null;
      for (const u of blobUrlsRef.current) {
        try { URL.revokeObjectURL(u); } catch {}
      }
      blobUrlsRef.current = [];
    };
  }, []);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      
      // skipAudio: true → server returns text the instant Gemini finishes
      // and we fetch ElevenLabs in parallel below. Cuts perceived latency
      // by the full TTS round-trip (~2-3s).
      const response = await apiRequest("POST", "/api/coach/chat", {
        message,
        history,
        skipAudio: true,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "coach",
        content: data.response,
        audioBase64: data.audioBase64,
      };
      setMessages((prev) => [...prev, newMessage]);
      setIsLoading(false);
      // Auto-play in parallel for the fast path. Server's isAuthenticated
      // gate on /api/coach/speak rejects anon, so this just no-ops when
      // signed-out — that's fine, the page-level Coach is the upsell surface.
      if (!data.audioBase64 && data.response) {
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
    onError: () => {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "coach",
          content: "Sorry warrior, I hit a bump. Try again - we don't give up that easy!",
        },
      ]);
    },
  });

  const speakMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/coach/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
  });

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    chatMutation.mutate(userMessage.content);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    setInput(prompt);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    chatMutation.mutate(prompt);
  };

  const handlePlayAudio = async (message: Message) => {
    if (isPlaying && playingId === message.id) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setPlayingId(null);
      return;
    }

    setPlayingId(message.id);
    setIsPlaying(true);

    try {
      let audioUrl: string;
      
      if (message.audioBase64) {
        const byteCharacters = atob(message.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mpeg" });
        audioUrl = URL.createObjectURL(blob);
      } else {
        audioUrl = await speakMutation.mutateAsync(message.content);
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setPlayingId(null);
      };

      await audio.play();
    } catch {
      setIsPlaying(false);
      setPlayingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Push-to-talk via browser SpeechRecognition (free, on-device, instant).
  const startListening = () => {
    if (micUnsupported || isListening || isLoading) return;
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: text,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
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

  return (
    <Card
      className="w-full max-w-2xl mx-auto overflow-hidden"
      style={{ backgroundColor: "#FAF8F3" }}
      data-testid="sasquatch-coach-card"
    >
      <CardHeader className="pb-3 border-b" style={{ borderColor: "rgba(201, 148, 26, 0.2)" }}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10" style={{ backgroundColor: "#C9941A" }}>
            <AvatarFallback className="text-white font-bold text-sm">NS</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground flex items-center gap-2" data-testid="coach-title">
              <MessageCircle className="h-4 w-4" style={{ color: "#C9941A" }} />
              Sasquatch Coach
            </h3>
            <p className="text-xs text-muted-foreground">Nick Kremers · 7-year survivor · he remembers your thread</p>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={clearMutation.isPending}
              className="text-muted-foreground hover:text-destructive shrink-0"
              title="Clear conversation"
              data-testid="button-clear-history"
            >
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea
          className="h-80 p-4"
          ref={scrollRef}
          data-testid="message-list"
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                data-testid={`message-${message.id}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.role === "coach" ? (
                    <AvatarFallback
                      className="text-white font-bold text-xs"
                      style={{ backgroundColor: "#C9941A" }}
                    >
                      NS
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={`flex flex-col max-w-[75%] ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border shadow-sm"
                    }`}
                    style={
                      message.role === "coach"
                        ? { borderColor: "rgba(201, 148, 26, 0.3)" }
                        : {}
                    }
                  >
                    <p className="text-sm" data-testid={`message-content-${message.id}`}>
                      {message.content}
                    </p>
                  </div>

                  {message.role === "coach" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2"
                      onClick={() => handlePlayAudio(message)}
                      disabled={speakMutation.isPending && playingId === message.id}
                      data-testid={`play-audio-${message.id}`}
                    >
                      {speakMutation.isPending && playingId === message.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Volume2
                          className="h-3 w-3 mr-1"
                          style={{
                            color: isPlaying && playingId === message.id ? "#C9941A" : undefined,
                          }}
                        />
                      )}
                      <span className="text-xs">
                        {isPlaying && playingId === message.id ? "Playing..." : "Listen"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3" data-testid="typing-indicator">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="text-white font-bold text-xs"
                    style={{ backgroundColor: "#C9941A" }}
                  >
                    NS
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "#C9941A", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "#C9941A", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "#C9941A", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t" style={{ borderColor: "rgba(201, 148, 26, 0.2)" }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                data-testid={`quick-prompt-${prompt.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening — speak naturally..." : "Talk to your coach, or tap mic..."}
              disabled={isLoading}
              className="flex-1"
              data-testid="chat-input"
            />
            {!micUnsupported && (
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                variant={isListening ? "default" : "outline"}
                style={isListening ? { backgroundColor: "#C9941A" } : undefined}
                className={isListening ? "hover:opacity-90 animate-pulse" : "hover:opacity-90"}
                title={isListening ? "Tap to stop" : "Push to talk"}
                data-testid="mic-button"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ backgroundColor: "#C9941A" }}
              className="hover:opacity-90"
              data-testid="send-button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
