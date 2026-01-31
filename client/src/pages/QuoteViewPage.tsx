import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Quote,
  Share2,
  Heart,
  Volume2,
  Flame,
  Trophy,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import SEO from "@/components/SEO";

interface QuoteData {
  id: number;
  text: string;
  author?: string;
  projectName: string;
  brandColor: string;
  brandLogo?: string;
  isWhiteLabel: boolean;
  streak: number;
  badges: string[];
  nextQuoteTime?: string;
}

export default function QuoteViewPage() {
  const params = useParams<{ projectId: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: quoteData, isLoading, refetch } = useQuery<QuoteData>({
    queryKey: ["/api/quote-studio/public/quote", params.projectId],
  });

  const trackScanMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/quote-studio/scans`, { projectId: params.projectId });
    },
  });

  useEffect(() => {
    if (params.projectId) {
      trackScanMutation.mutate();
    }
  }, [params.projectId]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Daily Quote",
        text: quoteData?.text,
        url: window.location.href,
      });
    } else {
      setShowShareModal(true);
    }
  };

  const handleVoice = async () => {
    if (!quoteData?.text) return;
    setIsPlaying(true);
    
    try {
      const response = await fetch("/api/quote-studio/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quoteData.text }),
      });

      if (!response.ok) {
        throw new Error(`Voice API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.audioUrl && !data.useBrowserTTS) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          // Fallback to browser TTS
          const utterance = new SpeechSynthesisUtterance(quoteData.text);
          utterance.onend = () => setIsPlaying(false);
          speechSynthesis.speak(utterance);
        };
        audio.play();
      } else {
        // Use browser TTS as fallback
        const utterance = new SpeechSynthesisUtterance(quoteData.text);
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
    } catch {
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(quoteData.text);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const brandColor = quoteData?.brandColor || "#C9941A";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <Quote className="w-16 h-16 text-white/30" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Daily Quote - ${quoteData?.projectName || "SquatchQR"}`}
        description={quoteData?.text?.substring(0, 155) || "Your daily inspiration"}
      />
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: `linear-gradient(145deg, ${brandColor}15, #0D0D0D 50%, ${brandColor}10)`,
        }}
        data-testid="quote-view-page"
      >
        <header className="p-4 flex items-center justify-between">
          {quoteData?.brandLogo ? (
            <img src={quoteData.brandLogo} alt="Brand" className="h-8" />
          ) : (
            !quoteData?.isWhiteLabel && (
              <div className="flex items-center gap-2">
                <Quote className="w-6 h-6" style={{ color: brandColor }} />
                <span className="text-white font-semibold">SquatchQR</span>
              </div>
            )
          )}
          {quoteData?.streak && quoteData.streak > 0 && (
            <Badge style={{ backgroundColor: "#C9941A" }} className="gap-1">
              <Flame className="w-3 h-3" />
              {quoteData.streak} day streak
            </Badge>
          )}
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-lg w-full text-center">
            <div className="mb-8">
              <Quote className="w-12 h-12 mx-auto mb-6 opacity-40" style={{ color: brandColor }} />
              <p
                className="text-2xl md:text-3xl text-white font-serif leading-relaxed"
                style={{ fontFamily: "'Playfair Display', serif" }}
                data-testid="quote-text"
              >
                "{quoteData?.text}"
              </p>
              {quoteData?.author && (
                <p className="mt-6 text-white/60 text-lg">— {quoteData.author}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mb-8">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={() => setHasLiked(!hasLiked)}
                data-testid="button-like"
              >
                <Heart className={`w-5 h-5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={handleVoice}
                disabled={isPlaying}
                data-testid="button-voice"
              >
                <Volume2 className={`w-5 h-5 ${isPlaying ? "animate-pulse text-[#C9941A]" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>

            {quoteData?.badges && quoteData.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {quoteData.badges.map((badge, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-white/20 text-white/80 gap-1"
                  >
                    <Trophy className="w-3 h-3" style={{ color: "#C9941A" }} />
                    {badge}
                  </Badge>
                ))}
              </div>
            )}

            {quoteData?.nextQuoteTime && (
              <p className="text-white/40 text-sm">
                Next quote in: {quoteData.nextQuoteTime}
              </p>
            )}
          </div>
        </main>

        {!quoteData?.isWhiteLabel && (
          <footer className="p-6 text-center border-t border-white/10">
            <p className="text-white/40 text-sm mb-3">
              Create your own dynamic QR quotes
            </p>
            <Button
              variant="outline"
              className="border-white/20 text-white gap-2"
              onClick={() => window.open("/squatch-qr", "_blank")}
              data-testid="button-cta"
            >
              Try SquatchQR <ExternalLink className="w-4 h-4" />
            </Button>
          </footer>
        )}
      </div>
    </>
  );
}
