import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Volume2, 
  VolumeX,
  X, 
  Loader2, 
  Minimize2,
  Maximize2,
  Mic,
  MicOff
} from "lucide-react";
import strokeLyfeLogo from "@assets/stroked-out-sasquatch-logo.png";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  audioBase64?: string;
}

const QUICK_PROMPTS = [
  "I'm struggling today",
  "Give me motivation",
  "Explain the formula",
  "Celebrate my win",
];

interface SasquatchChatWidgetProps {
  defaultOpen?: boolean;
}

export default function SasquatchChatWidget({ defaultOpen = false }: SasquatchChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      content: "Hey warrior! I'm Nick, your Sasquatch Coach. Whether you're having a tough day or celebrating a win, I'm here for you. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [autoVoice, setAutoVoice] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      }));
      
      const response = await apiRequest("POST", "/api/coach/chat", {
        message,
        history,
        includeAudio: autoVoice,
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
      
      if (autoVoice && data.audioBase64) {
        playAudioFromBase64(data.audioBase64, newMessage.id);
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

  const playAudioFromBase64 = (base64: string, messageId: string) => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingId(messageId);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(() => {
        setIsPlaying(false);
        setPlayingId(null);
      });
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

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
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    chatMutation.mutate(prompt);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingId(null);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative group"
          data-testid="button-open-coach"
          aria-label="Open chat with Coach Nick"
        >
          <div className="w-16 h-16 rounded-full bg-[#1B4332] shadow-lg flex items-center justify-center overflow-hidden border-2 border-[#C9941A] hover:scale-110 transition-transform">
            <img 
              src={strokeLyfeLogo} 
              alt="Sasquatch Coach" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9941A] rounded-full animate-pulse" />
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#1B4332] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with Coach Nick
          </div>
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#1B4332] rounded-full shadow-lg flex items-center gap-2 px-4 py-2 border border-[#C9941A]">
          <img src={strokeLyfeLogo} alt="Coach" className="w-8 h-8" />
          <span className="text-white font-medium">Coach Nick</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/70"
            onClick={() => setIsMinimized(false)}
            data-testid="button-maximize-coach"
            aria-label="Maximize chat"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/70"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-coach-minimized"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-[380px] sm:bottom-6 sm:right-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#1B4332]/20 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D5A4A] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-[#C9941A]/50">
              <img src={strokeLyfeLogo} alt="Coach" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Coach Nick</h3>
              <p className="text-[#C9941A] text-xs">Your Sasquatch Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ${autoVoice ? 'text-[#C9941A]' : 'text-white/50'}`}
              onClick={() => {
                if (isPlaying) stopAudio();
                setAutoVoice(!autoVoice);
              }}
              aria-label={autoVoice ? "Turn voice off" : "Turn voice on"}
              data-testid="button-toggle-voice"
            >
              {autoVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white/70"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize chat"
              data-testid="button-minimize-coach"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white/70"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              data-testid="button-close-coach"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-[#1B4332] text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.role === "coach" && message.audioBase64 && (
                    <button
                      onClick={() => playAudioFromBase64(message.audioBase64!, message.id)}
                      className={`mt-2 text-xs flex items-center gap-1 ${
                        playingId === message.id ? "text-[#C9941A]" : "text-[#1B4332]/60"
                      }`}
                      aria-label="Play audio response"
                      data-testid="button-play-audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      {playingId === message.id ? "Playing..." : "Listen"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B4332]" />
                    <span className="text-sm text-gray-500">Coach is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs bg-[#1B4332]/5 hover:bg-[#1B4332]/10 text-[#1B4332] rounded-full transition-colors disabled:opacity-50"
                  data-testid={`button-quick-${prompt.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Coach Nick anything..."
              className="flex-1 bg-gray-50 border-gray-200 focus:border-[#1B4332] text-sm"
              disabled={isLoading}
              data-testid="input-coach-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-[#1B4332]"
              aria-label="Send message"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
