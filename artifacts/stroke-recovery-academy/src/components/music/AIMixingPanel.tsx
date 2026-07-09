import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Wand2,
  Music,
  Volume2,
  Gauge,
  Zap,
  AudioWaveform,
  Loader2,
  Download,
  Play,
  RefreshCw,
  Mic,
  Radio,
  Drum
} from "lucide-react";

interface AIMixingPanelProps {
  onTrackGenerated?: (audioUrl: string) => void;
}

const AI_ACTIONS = [
  { id: "enhance", name: "Enhance Audio", icon: Sparkles, description: "AI-powered audio enhancement and clarity" },
  { id: "master", name: "Auto Master", icon: Gauge, description: "Professional mastering with AI" },
  { id: "stem_separate", name: "Stem Separation", icon: AudioWaveform, description: "Separate vocals, drums, bass, other" },
  { id: "noise_reduce", name: "Noise Reduction", icon: Volume2, description: "Remove background noise intelligently" },
  { id: "beat_match", name: "Beat Match", icon: Drum, description: "Auto-sync BPM between tracks" },
  { id: "key_detect", name: "Key Detection", icon: Music, description: "Detect musical key and suggest harmonics" },
  { id: "vocal_remove", name: "Vocal Remover", icon: Mic, description: "Extract or remove vocals from track" },
  { id: "remix", name: "AI Remix", icon: RefreshCw, description: "Generate remix variations with AI" },
];

const GENRES = [
  "hip-hop", "trap", "lofi", "edm", "house", "techno", "dubstep", 
  "pop", "rock", "jazz", "ambient", "cinematic", "funk", "soul",
  "drum_and_bass", "synthwave", "reggae", "latin", "classical"
];

const MOODS = [
  "energetic", "chill", "dark", "uplifting", "aggressive", "peaceful",
  "emotional", "epic", "mysterious", "happy", "melancholic", "powerful"
];

export function AIMixingPanel({ onTrackGenerated }: AIMixingPanelProps) {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("hip-hop");
  const [mood, setMood] = useState("energetic");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("C");
  const [duration, setDuration] = useState(30);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/music/ai-generate", {
        prompt: prompt || `${mood} ${genre} instrumental`,
        genre,
        mood,
        bpm,
        key,
        duration
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        setGeneratedAudio(data.audioUrl);
        onTrackGenerated?.(data.audioUrl);
        toast({ 
          title: "Track Generated", 
          description: "Your AI-generated track is ready!" 
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Failed to generate music",
        variant: "destructive" 
      });
    }
  });

  const enhanceMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await apiRequest("POST", "/api/music/ai-enhance", {
        action,
        settings: { genre, bpm, key }
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Enhancement Applied", 
        description: data.message || "Audio enhanced successfully!" 
      });
    },
    onError: () => {
      toast({ 
        title: "Enhancement Failed", 
        description: "Could not apply enhancement",
        variant: "destructive" 
      });
    }
  });

  const handleActionClick = (actionId: string) => {
    setSelectedAction(selectedAction === actionId ? null : actionId);
    if (actionId !== selectedAction) {
      enhanceMutation.mutate(actionId);
    }
  };

  const isLoading = generateMutation.isPending || enhanceMutation.isPending;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="w-5 h-5 text-orange-500" />
          AI Music Studio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AI_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isSelected = selectedAction === action.id;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                disabled={isLoading}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${isSelected 
                    ? "border-orange-500 bg-orange-500/10" 
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                  }
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
                data-testid={`button-ai-${action.id}`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-orange-500" : "text-gray-400"}`} />
                <p className="text-sm font-medium">{action.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{action.description}</p>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">AI Music Generator</h3>
            <Badge variant="outline" className="ml-auto text-xs">Powered by Lyria</Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Describe Your Track</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Epic cinematic orchestral piece with building tension, dramatic strings, and powerful brass..."
                className="bg-gray-800 border-gray-700 min-h-[80px]"
                data-testid="textarea-ai-prompt"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-gray-800 border-gray-700" data-testid="select-genre">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">
                        {g.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-gray-800 border-gray-700" data-testid="select-mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Key</Label>
                <Select value={key} onValueChange={setKey}>
                  <SelectTrigger className="bg-gray-800 border-gray-700" data-testid="select-key">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">BPM</Label>
                  <Badge variant="outline" className="text-xs font-mono">{bpm}</Badge>
                </div>
                <Slider
                  value={[bpm]}
                  onValueChange={(v) => setBpm(v[0])}
                  min={60}
                  max={180}
                  step={1}
                  className="w-full"
                  data-testid="slider-bpm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Track
                  </>
                )}
              </Button>
            </div>

            {generateMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Creating your track...</span>
                  <span className="text-orange-500">~30 seconds</span>
                </div>
                <Progress value={33} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {generatedAudio && (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-green-500" />
                <span className="font-medium">Generated Track Ready</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                {duration}s
              </Badge>
            </div>
            
            <audio 
              controls 
              className="w-full" 
              src={generatedAudio}
              data-testid="audio-generated"
            />
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" data-testid="button-play-generated">
                <Play className="w-3 h-3 mr-1" />
                Load to Deck A
              </Button>
              <Button size="sm" variant="outline" className="flex-1" data-testid="button-download">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
