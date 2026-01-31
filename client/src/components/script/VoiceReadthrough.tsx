import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
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
  Play,
  Pause,
  Square,
  Volume2,
  Mic,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  AudioWaveform,
  User
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  description: string;
  arc: string;
  voiceId?: string;
}

interface VoiceReadthroughProps {
  projectId: number;
  characters: Character[];
  dialogue: Record<string, string>;
  scenes: Array<{ id: string; heading: string; description: string }>;
  onCharacterVoiceUpdate?: (characterId: string, voiceId: string) => void;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  preview_url?: string;
}

export function VoiceReadthrough({
  projectId,
  characters,
  dialogue,
  scenes,
  onCharacterVoiceUpdate
}: VoiceReadthroughProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handlePlay = () => {
    if (audioRef.current && generatedAudio) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = volume / 100;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentLine(0);
    }
  };

  const { data: voices = [], isLoading: voicesLoading } = useQuery<ElevenLabsVoice[]>({
    queryKey: ["/api/elevenlabs/voices"],
  });

  const generateReadthroughMutation = useMutation({
    mutationFn: async (sceneId?: string) => {
      const res = await apiRequest("POST", `/api/screenplay/${projectId}/voice-readthrough`, {
        sceneId,
        characters: characters.map(c => ({ id: c.id, name: c.name, voiceId: c.voiceId })),
        speed: playbackSpeed
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        setGeneratedAudio(data.audioUrl);
        toast({ title: "Read-through Generated", description: "Your AI voice read-through is ready!" });
      }
    },
    onError: () => {
      toast({ title: "Generation Failed", description: "Could not generate voice read-through", variant: "destructive" });
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cloneTargetCharacter, setCloneTargetCharacter] = useState<string | null>(null);

  const cloneVoiceMutation = useMutation({
    mutationFn: async ({ characterId, audioFile }: { characterId: string; audioFile: File }) => {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("characterId", characterId);
      formData.append("name", characters.find(c => c.id === characterId)?.name || "Character");
      
      const res = await fetch(`/api/elevenlabs/clone-voice`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Clone failed");
      return res.json();
    },
    onSuccess: (data, variables) => {
      onCharacterVoiceUpdate?.(variables.characterId, data.voiceId);
      queryClient.invalidateQueries({ queryKey: ["/api/elevenlabs/voices"] });
      toast({ title: "Voice Cloned", description: "Character voice has been cloned successfully!" });
      setCloneTargetCharacter(null);
    },
    onError: () => {
      toast({ title: "Clone Failed", description: "Could not clone voice", variant: "destructive" });
      setCloneTargetCharacter(null);
    }
  });

  const handleCloneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && cloneTargetCharacter) {
      cloneVoiceMutation.mutate({ characterId: cloneTargetCharacter, audioFile: file });
    }
  };

  const initiateClone = (characterId: string) => {
    setCloneTargetCharacter(characterId);
    fileInputRef.current?.click();
  };

  const handleGenerateAndPlay = () => {
    if (generatedAudio) {
      handlePlay();
    } else {
      generateReadthroughMutation.mutate(selectedSceneId || undefined);
    }
  };

  const getSceneDialogueLines = (sceneId: string) => {
    const sceneDialogue = dialogue[sceneId] || "";
    return sceneDialogue.split("\n").filter(line => line.trim());
  };

  const totalLines = selectedSceneId 
    ? getSceneDialogueLines(selectedSceneId).length 
    : Object.values(dialogue).join("\n").split("\n").filter(l => l.trim()).length;

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Mic className="w-5 h-5 text-orange-500" />
          Voice Read-through
          <Badge variant="outline" className="ml-auto text-xs border-orange-500/50 text-orange-400">
            ElevenLabs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm text-zinc-400">Scene Selection</label>
            <Select value={selectedSceneId || "all"} onValueChange={(v) => setSelectedSceneId(v === "all" ? null : v)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700" data-testid="select-scene-readthrough">
                <SelectValue placeholder="Select scene" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">Full Script</SelectItem>
                {scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id}>
                    {scene.heading}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Playback Speed</label>
              <Badge variant="outline" className="text-xs">{playbackSpeed}x</Badge>
            </div>
            <Slider
              value={[playbackSpeed]}
              onValueChange={(v) => handleSpeedChange(v[0])}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
              data-testid="slider-speed"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">Character Voice Assignments</span>
            <Button size="sm" variant="ghost" className="text-xs" data-testid="button-auto-assign">
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-assign
            </Button>
          </div>
          
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {characters.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Add characters in the Characters tab to assign voices
                </p>
              ) : (
                characters.map((character) => (
                  <div key={character.id} className="flex items-center gap-2 p-2 rounded bg-zinc-800/50">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm flex-1 truncate">{character.name}</span>
                    <Select
                      value={character.voiceId || ""}
                      onValueChange={(voiceId) => onCharacterVoiceUpdate?.(character.id, voiceId)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs bg-zinc-900 border-zinc-700" data-testid={`select-voice-${character.id}`}>
                        <SelectValue placeholder="Voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {voicesLoading ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : (
                          voices.map((voice) => (
                            <SelectItem key={voice.voice_id} value={voice.voice_id}>
                              {voice.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => initiateClone(character.id)}
                      disabled={cloneVoiceMutation.isPending}
                      data-testid={`button-clone-voice-${character.id}`}
                    >
                      <Mic className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleCloneFileChange}
            className="hidden"
          />
        </div>

        {generateReadthroughMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400 flex items-center gap-2">
                <AudioWaveform className="w-4 h-4 animate-pulse text-orange-500" />
                Generating voice read-through...
              </span>
              <span className="text-orange-400">Processing</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        )}

        {generatedAudio && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
            <audio 
              ref={audioRef}
              className="hidden" 
              src={generatedAudio}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => { setIsPlaying(false); setCurrentLine(0); }}
              data-testid="audio-readthrough"
            />
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={isPlaying ? "default" : "outline"}
                onClick={isPlaying ? handlePause : handlePlay}
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleStop}
                data-testid="button-stop"
              >
                <Square className="w-4 h-4" />
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <Slider
                  value={[volume]}
                  onValueChange={(v) => handleVolumeChange(v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                  data-testid="slider-volume"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={() => generateReadthroughMutation.mutate(selectedSceneId || undefined)}
            disabled={generateReadthroughMutation.isPending || characters.length === 0}
            className="flex-1 bg-orange-500"
            data-testid="button-generate-readthrough"
          >
            {generateReadthroughMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : generatedAudio ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Generate Read-through
              </>
            )}
          </Button>
          
          {generatedAudio && (
            <Button variant="outline" data-testid="button-download-audio">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-zinc-500 text-center">
          AI voices powered by ElevenLabs. Each character speaks with their assigned voice.
        </p>
      </CardContent>
    </Card>
  );
}
