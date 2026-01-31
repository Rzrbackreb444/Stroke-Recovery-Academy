import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Image,
  Sparkles,
  Loader2,
  Download,
  Grid3X3,
  Film,
  RefreshCw,
  ZoomIn,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Scene {
  id: string;
  heading: string;
  description: string;
}

interface StoryboardFrame {
  id: string;
  sceneId: string;
  imageUrl: string;
  shotType: string;
  description: string;
  order: number;
}

interface StoryboardGeneratorProps {
  projectId: number;
  scenes: Scene[];
  onFrameGenerated?: (frame: StoryboardFrame) => void;
}

const SHOT_TYPES = [
  { value: "wide", label: "Wide Shot" },
  { value: "medium", label: "Medium Shot" },
  { value: "close-up", label: "Close-Up" },
  { value: "extreme-close-up", label: "Extreme Close-Up" },
  { value: "over-shoulder", label: "Over-the-Shoulder" },
  { value: "pov", label: "POV" },
  { value: "aerial", label: "Aerial/Drone" },
  { value: "low-angle", label: "Low Angle" },
  { value: "high-angle", label: "High Angle" },
];

const ART_STYLES = [
  { value: "cinematic", label: "Cinematic" },
  { value: "noir", label: "Film Noir" },
  { value: "animation", label: "Animation" },
  { value: "comic", label: "Comic Book" },
  { value: "sketch", label: "Pencil Sketch" },
  { value: "watercolor", label: "Watercolor" },
  { value: "photorealistic", label: "Photorealistic" },
];

export function StoryboardGenerator({
  projectId,
  scenes,
  onFrameGenerated
}: StoryboardGeneratorProps) {
  const { toast } = useToast();
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(scenes[0]?.id || null);
  const [artStyle, setArtStyle] = useState("cinematic");
  const [framesPerScene, setFramesPerScene] = useState(3);
  const [generatedFrames, setGeneratedFrames] = useState<StoryboardFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<StoryboardFrame | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const generateStoryboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/screenplay/${projectId}/storyboard`, {
        sceneId: selectedSceneId,
        artStyle,
        framesPerScene,
        scenes: selectedSceneId ? [scenes.find(s => s.id === selectedSceneId)] : scenes
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.frames) {
        setGeneratedFrames(data.frames);
        toast({ title: "Storyboard Generated", description: `${data.frames.length} frames created!` });
      }
    },
    onError: () => {
      toast({ title: "Generation Failed", description: "Could not generate storyboard", variant: "destructive" });
    }
  });

  const regenerateFrameMutation = useMutation({
    mutationFn: async (frameId: string) => {
      const frame = generatedFrames.find(f => f.id === frameId);
      if (!frame) throw new Error("Frame not found");
      
      const res = await apiRequest("POST", `/api/screenplay/${projectId}/storyboard/regenerate`, {
        frameId,
        sceneId: frame.sceneId,
        artStyle,
        shotType: frame.shotType
      });
      return res.json();
    },
    onSuccess: (data, frameId) => {
      setGeneratedFrames(prev => prev.map(f => f.id === frameId ? { ...f, imageUrl: data.imageUrl } : f));
      toast({ title: "Frame Regenerated", description: "New frame generated successfully!" });
    },
    onError: () => {
      toast({ title: "Regeneration Failed", description: "Could not regenerate frame", variant: "destructive" });
    }
  });

  const selectedScene = scenes.find(s => s.id === selectedSceneId);
  const sceneFrames = generatedFrames.filter(f => !selectedSceneId || f.sceneId === selectedSceneId);

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Grid3X3 className="w-5 h-5 text-orange-500" />
          Storyboard Generator
          <Badge variant="outline" className="ml-auto text-xs border-purple-500/50 text-purple-400">
            Vertex AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Scene</label>
            <Select value={selectedSceneId || "all"} onValueChange={(v) => setSelectedSceneId(v === "all" ? null : v)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-storyboard-scene">
                <SelectValue placeholder="Select scene" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Scenes</SelectItem>
                {scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id}>
                    {scene.heading}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Art Style</label>
            <Select value={artStyle} onValueChange={setArtStyle}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-art-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {ART_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Frames per Scene</label>
            <Select value={framesPerScene.toString()} onValueChange={(v) => setFramesPerScene(parseInt(v))}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-frames-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n} frames</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedScene && (
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <p className="text-sm text-zinc-300 font-medium">{selectedScene.heading}</p>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{selectedScene.description}</p>
          </div>
        )}

        {generateStoryboardMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 flex items-center gap-2">
                <Image className="w-4 h-4 animate-pulse text-purple-500" />
                Generating storyboard frames...
              </span>
              <span className="text-purple-400">Processing</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
        )}

        {sceneFrames.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{sceneFrames.length} frames generated</span>
              <Button size="sm" variant="outline" data-testid="button-export-storyboard">
                <Download className="w-3 h-3 mr-1" />
                Export PDF
              </Button>
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {sceneFrames.map((frame, idx) => (
                  <div
                    key={frame.id}
                    className={`relative flex-shrink-0 w-48 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                      selectedFrame?.id === frame.id ? "border-orange-500" : "border-zinc-700 hover:border-zinc-600"
                    }`}
                    onClick={() => {
                      setSelectedFrame(frame);
                      setCurrentFrameIndex(idx);
                    }}
                    data-testid={`storyboard-frame-${idx}`}
                  >
                    <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <div className="p-2 bg-zinc-900">
                      <Badge variant="outline" className="text-xs mb-1">{frame.shotType}</Badge>
                      <p className="text-xs text-zinc-400 line-clamp-2">{frame.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateFrameMutation.mutate(frame.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                      data-testid={`button-regenerate-frame-${idx}`}
                    >
                      <RefreshCw className={`w-3 h-3 ${regenerateFrameMutation.isPending ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {selectedFrame && (
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Frame {currentFrameIndex + 1} of {sceneFrames.length}</span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    const newIdx = Math.max(0, currentFrameIndex - 1);
                    setCurrentFrameIndex(newIdx);
                    setSelectedFrame(sceneFrames[newIdx]);
                  }}
                  disabled={currentFrameIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    const newIdx = Math.min(sceneFrames.length - 1, currentFrameIndex + 1);
                    setCurrentFrameIndex(newIdx);
                    setSelectedFrame(sceneFrames[newIdx]);
                  }}
                  disabled={currentFrameIndex === sceneFrames.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="aspect-video rounded-lg bg-zinc-800 overflow-hidden">
              {selectedFrame.imageUrl ? (
                <img src={selectedFrame.imageUrl} alt="Selected frame" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-zinc-600" />
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={() => generateStoryboardMutation.mutate()}
          disabled={generateStoryboardMutation.isPending || scenes.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          data-testid="button-generate-storyboard"
        >
          {generateStoryboardMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Storyboard...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Storyboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
