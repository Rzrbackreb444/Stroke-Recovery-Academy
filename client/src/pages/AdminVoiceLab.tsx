import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, Mic2, Crown, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Candidate = {
  id: string;
  name: string;
  tagline: string;
  why: string;
  raspy: boolean;
};

type CandidatesResponse = {
  activeVoiceId: string;
  defaultSettings: { stability: number; similarity_boost: number; style: number; use_speaker_boost: boolean };
  candidates: Candidate[];
};

const SAMPLE_LINES = [
  "Hey Warrior — I see you. Today's not about fixing everything, it's about one rep, one breath, one win.",
  "Stroke don't get the last word, brother. We rebuild. We rewire. We rise.",
  "Listen — I been where you are. Foggy mornings, weak side, the whole thing. We'll do this together.",
  "You showed up. That counts. That's the whole game right there.",
];

export default function AdminVoiceLab() {
  const { toast } = useToast();
  const [text, setText] = useState(SAMPLE_LINES[0]);
  const [stability, setStability] = useState([0.30]);
  const [similarity, setSimilarity] = useState([0.85]);
  const [style, setStyle] = useState([0.65]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useQuery<CandidatesResponse>({
    queryKey: ["/api/admin/voice-lab/candidates"],
  });

  async function preview(voiceId: string) {
    if (loadingId) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === voiceId) {
      setPlayingId(null);
      return;
    }
    setLoadingId(voiceId);
    try {
      const res = await fetch("/api/admin/voice-lab/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: text.trim().slice(0, 600),
          voiceId,
          stability: stability[0],
          similarityBoost: similarity[0],
          style: style[0],
          useSpeakerBoost: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Preview failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setPlayingId(voiceId);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err?.message || "Try again.", variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Mic2 className="h-7 w-7 text-[#E2741B]" />
          <h1 className="text-3xl font-bold">Sasquatch Voice Lab</h1>
        </div>
        <p className="text-gray-400 mb-8 max-w-2xl">
          Audition raspy ElevenLabs voices with the actual character settings. Pick the one that sounds most
          like Sasquatch to you, then lock it in by setting <code className="px-1.5 py-0.5 bg-[#1a1a1a] rounded text-xs text-[#E2741B]">SASQUATCH_VOICE_ID</code> in your secrets.
        </p>

        {/* Sample text */}
        <Card className="bg-[#111] border-[#222] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sample line</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={600}
              rows={3}
              className="bg-[#0a0a0a] border-[#222] text-white resize-none"
              placeholder="Type what Sasquatch should say..."
              data-testid="textarea-sample"
            />
            <div className="flex flex-wrap gap-2">
              {SAMPLE_LINES.map((line, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="border-[#222] text-gray-400 hover:text-white text-xs"
                  onClick={() => setText(line)}
                  data-testid={`button-preset-${i}`}
                >
                  Sample {i + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Voice settings */}
        <Card className="bg-[#111] border-[#222] mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Character settings
              <span className="text-xs text-gray-500 font-normal">(lower stability = more rasp)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm text-gray-300">Stability</Label>
                <span className="text-sm text-[#E2741B] font-mono">{stability[0].toFixed(2)}</span>
              </div>
              <Slider value={stability} onValueChange={setStability} min={0} max={1} step={0.05} data-testid="slider-stability" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm text-gray-300">Similarity Boost</Label>
                <span className="text-sm text-[#E2741B] font-mono">{similarity[0].toFixed(2)}</span>
              </div>
              <Slider value={similarity} onValueChange={setSimilarity} min={0} max={1} step={0.05} data-testid="slider-similarity" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm text-gray-300">Style (character intensity)</Label>
                <span className="text-sm text-[#E2741B] font-mono">{style[0].toFixed(2)}</span>
              </div>
              <Slider value={style} onValueChange={setStyle} min={0} max={1} step={0.05} data-testid="slider-style" />
            </div>
          </CardContent>
        </Card>

        {/* Voice candidates */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data?.candidates.map((c) => {
              const isActive = c.id === data.activeVoiceId;
              const isLoadingThis = loadingId === c.id;
              const isPlayingThis = playingId === c.id;
              return (
                <Card
                  key={c.id}
                  className={`bg-[#111] border ${isActive ? "border-[#E2741B]" : "border-[#222]"} hover-elevate`}
                  data-testid={`card-voice-${c.name.toLowerCase()}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{c.name}</h3>
                          {c.raspy && (
                            <Badge className="bg-[#E2741B]/15 text-[#E2741B] border border-[#E2741B]/30 text-[10px] uppercase">
                              Raspy
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="bg-green-600/20 text-green-400 border border-green-700/40 text-[10px] uppercase flex items-center gap-1">
                              <Crown className="h-2.5 w-2.5" /> Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{c.tagline}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 leading-relaxed">{c.why}</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-[10px] text-gray-600 font-mono truncate flex-1">{c.id}</code>
                      <Button
                        size="sm"
                        onClick={() => preview(c.id)}
                        disabled={isLoadingThis || (loadingId !== null && loadingId !== c.id)}
                        className={isActive ? "bg-[#E2741B] text-black hover:bg-[#E2741B]/90" : "bg-[#1a1a1a] border border-[#333] hover:bg-[#222]"}
                        data-testid={`button-preview-${c.name.toLowerCase()}`}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isPlayingThis ? (
                          <><Pause className="h-3.5 w-3.5 mr-1" /> Stop</>
                        ) : (
                          <><Play className="h-3.5 w-3.5 mr-1" /> Preview</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* How to lock in */}
        <Card className="bg-[#0a1410] border-green-900/40 mt-8">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-green-400 mb-1">How to lock in your pick</p>
              <p className="text-gray-400">
                Once you've picked the voice that sounds most like Sasquatch, set{" "}
                <code className="px-1.5 py-0.5 bg-[#1a1a1a] rounded text-xs text-[#E2741B]">SASQUATCH_VOICE_ID</code>{" "}
                to that voice ID in your environment secrets and restart the app. The Coach, anthem narration, and
                voice read-throughs will all swap to it.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
