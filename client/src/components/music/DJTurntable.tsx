import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, RotateCcw, Volume2, VolumeX } from "lucide-react";
import * as Tone from "tone";

interface DJTurntableProps {
  deckId: "A" | "B";
  audioUrl?: string;
  onBpmChange?: (bpm: number) => void;
  onVolumeChange?: (volume: number) => void;
  accentColor?: string;
}

export function DJTurntable({ 
  deckId, 
  audioUrl, 
  onBpmChange, 
  onVolumeChange,
  accentColor = deckId === "A" ? "#C9941A" : "#10B981"
}: DJTurntableProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const playerRef = useRef<Tone.Player | null>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (audioUrl) {
      const player = new Tone.Player({
        url: audioUrl,
        onload: () => {
          setIsLoaded(true);
          if (player.buffer) {
            setDuration(player.buffer.duration);
          }
        }
      }).toDestination();
      playerRef.current = player;

      return () => {
        player.dispose();
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = isMuted ? -Infinity : Tone.gainToDb(volume / 100);
    }
    onVolumeChange?.(isMuted ? 0 : volume);
  }, [volume, isMuted, onVolumeChange]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate = 1 + (pitch / 100);
      const adjustedBpm = Math.round(120 * (1 + pitch / 100));
      setBpm(adjustedBpm);
      onBpmChange?.(adjustedBpm);
    }
  }, [pitch, onBpmChange]);

  const animateVinyl = useCallback(() => {
    if (isPlaying) {
      rotationRef.current += 2;
      setRotation(rotationRef.current);
      animationRef.current = requestAnimationFrame(animateVinyl);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animateVinyl);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animateVinyl]);

  const togglePlay = async () => {
    await Tone.start();
    if (playerRef.current && isLoaded) {
      if (isPlaying) {
        playerRef.current.stop();
      } else {
        playerRef.current.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCue = () => {
    if (playerRef.current && isLoaded) {
      playerRef.current.stop();
      playerRef.current.seek(0);
      setCurrentTime(0);
      setIsPlaying(false);
      rotationRef.current = 0;
      setRotation(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Badge 
          className="text-lg font-bold px-3 py-1"
          style={{ backgroundColor: accentColor, color: "#000" }}
        >
          DECK {deckId}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-sm">
            {bpm} BPM
          </Badge>
        </div>
      </div>

      <div className="relative mx-auto w-48 h-48 mb-4">
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-950 border-4 border-gray-700 shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isPlaying ? "none" : "transform 0.3s ease-out"
          }}
        >
          <div className="absolute inset-4 rounded-full bg-black border border-gray-600">
            <div 
              className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <div className="w-3 h-3 rounded-full bg-black" />
            </div>
            
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-0.5 bg-gray-700 origin-left"
                style={{
                  width: "35%",
                  transform: `rotate(${i * 45}deg) translateY(-50%)`
                }}
              />
            ))}
          </div>
          
          <div 
            className="absolute top-2 left-1/2 w-2 h-2 rounded-full -ml-1"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <div 
          className="absolute -right-2 top-1/2 -mt-6 w-4 h-12 rounded-sm"
          style={{ 
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}50`
          }}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleCue}
            disabled={!isLoaded}
            className="border-gray-700"
            data-testid={`button-cue-${deckId}`}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
            disabled={!isLoaded}
            className="w-12 h-12"
            style={{ backgroundColor: accentColor }}
            data-testid={`button-play-${deckId}`}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsMuted(!isMuted)}
            className="border-gray-700"
            data-testid={`button-mute-${deckId}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>PITCH</span>
            <span className={pitch >= 0 ? "text-green-400" : "text-red-400"}>
              {pitch >= 0 ? "+" : ""}{pitch.toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[pitch]}
            onValueChange={(v) => setPitch(v[0])}
            min={-8}
            max={8}
            step={0.1}
            className="w-full"
            data-testid={`slider-pitch-${deckId}`}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>VOLUME</span>
            <span>{volume}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
            data-testid={`slider-volume-${deckId}`}
          />
        </div>
      </div>

      {!audioUrl && (
        <div className="mt-4 p-3 rounded-md bg-gray-800/50 border border-dashed border-gray-700 text-center">
          <p className="text-sm text-gray-400">Drop a track here or select from library</p>
        </div>
      )}
    </div>
  );
}
