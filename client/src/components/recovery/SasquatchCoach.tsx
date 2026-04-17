import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { Send, Volume2, MessageCircle, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
}

const QUICK_PROMPTS = [
  "I'm struggling today",
  "Give me motivation",
  "Explain S.A.S.C.H.",
  "I need tough love",
  "Celebrate my win",
];

export default function SasquatchCoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      content: "Hey warrior! I'm Nick, your Sasquatch Coach. Whether you're having a tough day or celebrating a win, I'm here. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      
      const response = await apiRequest("POST", "/api/coach/chat", {
        message,
        history,
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
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2" data-testid="coach-title">
              <MessageCircle className="h-4 w-4" style={{ color: "#C9941A" }} />
              Sasquatch Coach
            </h3>
            <p className="text-xs text-muted-foreground">Your AI Recovery Companion</p>
          </div>
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
              placeholder="Talk to your coach..."
              disabled={isLoading}
              className="flex-1"
              data-testid="chat-input"
            />
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
