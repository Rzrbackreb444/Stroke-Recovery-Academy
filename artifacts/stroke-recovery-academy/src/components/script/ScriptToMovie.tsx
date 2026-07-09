import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
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
  Film,
  Clapperboard,
  Sparkles,
  Loader2,
  ArrowRight,
  Video,
  Clock,
  Settings,
  Wand2,
  Volume2
} from "lucide-react";

interface Scene {
  id: string;
  heading: string;
  description: string;
}

interface Character {
  id: string;
  name: string;
  voiceId?: string;
}

interface ScriptToMovieProps {
  projectId: number;
  projectTitle: string;
  scenes: Scene[];
  characters: Character[];
  dialogue: Record<string, string>;
}

const VIDEO_STYLES = [
  { value: "cinematic", label: "Cinematic", description: "Professional film-quality visuals" },
  { value: "animation", label: "Animation", description: "Animated 3D/2D style" },
  { value: "documentary", label: "Documentary", description: "Real-world documentary feel" },
  { value: "music-video", label: "Music Video", description: "Fast cuts, stylized visuals" },
  { value: "commercial", label: "Commercial", description: "Clean, polished advertising style" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Widescreen)" },
  { value: "21:9", label: "21:9 (Cinematic)" },
  { value: "4:3", label: "4:3 (Classic)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "9:16", label: "9:16 (Vertical)" },
];

export function ScriptToMovie({
  projectId,
  projectTitle,
  scenes,
  characters,
  dialogue
}: ScriptToMovieProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [includeVoiceover, setIncludeVoiceover] = useState(true);
  const [includeSoundtrack, setIncludeSoundtrack] = useState(true);

  useEffect(() => {
    setSelectedScenes(scenes.map(s => s.id));
  }, [scenes]);

  const createMovieProjectMutation = useMutation({
    mutationFn: async () => {
      const selectedSceneData = scenes.filter(s => selectedScenes.includes(s.id));
      const sceneDialogues = selectedScenes.reduce((acc, sceneId) => {
        if (dialogue[sceneId]) {
          acc[sceneId] = dialogue[sceneId];
        }
        return acc;
      }, {} as Record<string, string>);

      const res = await apiRequest("POST", `/api/movie/from-script`, {
        screenplayProjectId: projectId,
        title: projectTitle,
        scenes: selectedSceneData,
        characters,
        dialogue: sceneDialogues,
        settings: {
          videoStyle,
          aspectRatio,
          includeVoiceover,
          includeSoundtrack
        }
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Movie Project Created", 
        description: "Redirecting to Movie Studio..." 
      });
      setTimeout(() => {
        setLocation(`/movie-studio?project=${data.projectId}`);
      }, 1000);
    },
    onError: () => {
      toast({ 
        title: "Creation Failed", 
        description: "Could not create movie project", 
        variant: "destructive" 
      });
    }
  });

  const toggleScene = (sceneId: string) => {
    setSelectedScenes(prev => 
      prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  const estimatedDuration = selectedScenes.length * 30;

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clapperboard className="w-5 h-5 text-orange-500" />
          Script to Movie
          <Badge variant="outline" className="ml-auto text-xs border-blue-500/50 text-blue-400">
            Movie Studio
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-400">
          Transform your screenplay into a video project with AI-generated visuals, 
          voiceovers, and soundtrack.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Select Scenes to Convert</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs"
              onClick={() => setSelectedScenes(selectedScenes.length === scenes.length ? [] : scenes.map(s => s.id))}
            >
              {selectedScenes.length === scenes.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {scenes.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Add scenes in the Scenes tab first
                </p>
              ) : (
                scenes.map((scene, idx) => (
                  <div 
                    key={scene.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      selectedScenes.includes(scene.id) 
                        ? "border-orange-500/50 bg-orange-500/5" 
                        : "border-zinc-800 bg-zinc-900/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedScenes.includes(scene.id)}
                      onCheckedChange={() => toggleScene(scene.id)}
                      data-testid={`checkbox-scene-${idx}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{scene.heading}</p>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{scene.description}</p>
                      {dialogue[scene.id] && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          <Volume2 className="w-3 h-3 mr-1" />
                          Has dialogue
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Video Style</label>
            <Select value={videoStyle} onValueChange={setVideoStyle}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-video-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {VIDEO_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div>
                      <span>{style.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Aspect Ratio</label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-aspect-ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <Checkbox
              id="voiceover"
              checked={includeVoiceover}
              onCheckedChange={(checked) => setIncludeVoiceover(!!checked)}
              data-testid="checkbox-voiceover"
            />
            <label htmlFor="voiceover" className="flex-1 cursor-pointer">
              <span className="text-sm">Include AI Voiceover</span>
              <p className="text-xs text-zinc-500">Character dialogue with ElevenLabs voices</p>
            </label>
            <Badge variant="outline" className="text-xs">ElevenLabs</Badge>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <Checkbox
              id="soundtrack"
              checked={includeSoundtrack}
              onCheckedChange={(checked) => setIncludeSoundtrack(!!checked)}
              data-testid="checkbox-soundtrack"
            />
            <label htmlFor="soundtrack" className="flex-1 cursor-pointer">
              <span className="text-sm">Generate AI Soundtrack</span>
              <p className="text-xs text-zinc-500">Background music matching scene mood</p>
            </label>
            <Badge variant="outline" className="text-xs">Lyria</Badge>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Project Summary</span>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
              {selectedScenes.length} scenes
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. duration: ~{Math.ceil(estimatedDuration / 60)} min
            </div>
            <div className="flex items-center gap-1">
              <Film className="w-3 h-3" />
              Style: {VIDEO_STYLES.find(s => s.value === videoStyle)?.label}
            </div>
          </div>
        </div>

        {createMovieProjectMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Creating movie project...</span>
              <span className="text-orange-400">Processing</span>
            </div>
            <Progress value={50} className="h-2" />
          </div>
        )}

        <Button
          onClick={() => createMovieProjectMutation.mutate()}
          disabled={createMovieProjectMutation.isPending || selectedScenes.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          data-testid="button-create-movie"
        >
          {createMovieProjectMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Movie Project...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Create Movie Project
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-zinc-500 text-center">
          Opens in Movie Studio with pre-configured scenes, dialogue, and settings
        </p>
      </CardContent>
    </Card>
  );
}
