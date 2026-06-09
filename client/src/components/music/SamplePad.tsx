import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Grid3X3, Volume2, Repeat, Upload, Sparkles } from "lucide-react";
import * as Tone from "tone";

interface Sample {
  id: string;
  name: string;
  color: string;
  url?: string;
  isPlaying: boolean;
  loop: boolean;
  volume: number;
}

const DEFAULT_SAMPLES: Sample[] = [
  { id: "kick", name: "Kick", color: "#EF4444", isPlaying: false, loop: false, volume: 80 },
  { id: "snare", name: "Snare", color: "#F59E0B", isPlaying: false, loop: false, volume: 80 },
  { id: "hihat", name: "Hi-Hat", color: "#10B981", isPlaying: false, loop: false, volume: 80 },
  { id: "clap", name: "Clap", color: "#3B82F6", isPlaying: false, loop: false, volume: 80 },
  { id: "tom", name: "Tom", color: "#8B5CF6", isPlaying: false, loop: false, volume: 80 },
  { id: "rim", name: "Rim", color: "#EC4899", isPlaying: false, loop: false, volume: 80 },
  { id: "perc1", name: "Perc 1", color: "#14B8A6", isPlaying: false, loop: false, volume: 80 },
  { id: "perc2", name: "Perc 2", color: "#F97316", isPlaying: false, loop: false, volume: 80 },
  { id: "bass", name: "Bass", color: "#6366F1", isPlaying: false, loop: true, volume: 80 },
  { id: "synth", name: "Synth", color: "#A855F7", isPlaying: false, loop: true, volume: 80 },
  { id: "pad", name: "Pad", color: "#06B6D4", isPlaying: false, loop: true, volume: 80 },
  { id: "fx", name: "FX", color: "#84CC16", isPlaying: false, loop: false, volume: 80 },
  { id: "vocal", name: "Vocal", color: "#F43F5E", isPlaying: false, loop: false, volume: 80 },
  { id: "scratch", name: "Scratch", color: "#E2741B", isPlaying: false, loop: false, volume: 80 },
  { id: "riser", name: "Riser", color: "#7C3AED", isPlaying: false, loop: false, volume: 80 },
  { id: "drop", name: "Drop", color: "#DC2626", isPlaying: false, loop: false, volume: 80 },
];

interface SamplePadProps {
  onSampleTrigger?: (sampleId: string) => void;
}

export function SamplePad({ onSampleTrigger }: SamplePadProps) {
  const [samples, setSamples] = useState<Sample[]>(DEFAULT_SAMPLES);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(80);
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const synthRef = useRef<Tone.PolySynth | null>(null);

  const initializeSynth = useCallback(async () => {
    await Tone.start();
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
  }, []);

  const triggerSample = async (sampleId: string) => {
    await initializeSynth();
    
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return;

    const notes: Record<string, string> = {
      kick: "C1",
      snare: "D2",
      hihat: "F#3",
      clap: "D3",
      tom: "G2",
      rim: "C#3",
      perc1: "A3",
      perc2: "B3",
      bass: "C2",
      synth: "C4",
      pad: "C3",
      fx: "G4",
      vocal: "E4",
      scratch: "A4",
      riser: "C5",
      drop: "C1",
    };

    if (synthRef.current) {
      const volume = Tone.gainToDb((sample.volume / 100) * (masterVolume / 100));
      synthRef.current.volume.value = volume;
      
      if (sample.loop) {
        synthRef.current.triggerAttack(notes[sampleId] || "C4");
        setSamples(prev => prev.map(s => 
          s.id === sampleId ? { ...s, isPlaying: !s.isPlaying } : s
        ));
      } else {
        synthRef.current.triggerAttackRelease(notes[sampleId] || "C4", "8n");
        setSamples(prev => prev.map(s => 
          s.id === sampleId ? { ...s, isPlaying: true } : s
        ));
        setTimeout(() => {
          setSamples(prev => prev.map(s => 
            s.id === sampleId ? { ...s, isPlaying: false } : s
          ));
        }, 200);
      }
    }

    onSampleTrigger?.(sampleId);
  };

  const toggleLoop = (sampleId: string) => {
    setSamples(prev => prev.map(s => 
      s.id === sampleId ? { ...s, loop: !s.loop } : s
    ));
  };

  const updateSampleVolume = (sampleId: string, volume: number) => {
    setSamples(prev => prev.map(s => 
      s.id === sampleId ? { ...s, volume } : s
    ));
  };

  const selectedSampleData = samples.find(s => s.id === selectedSample);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5 text-orange-500" />
            Sample Pad
          </CardTitle>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <Slider
              value={[masterVolume]}
              onValueChange={(v) => setMasterVolume(v[0])}
              min={0}
              max={100}
              className="w-20"
              data-testid="slider-pad-master"
            />
            <Badge variant="outline" className="font-mono text-xs">
              {masterVolume}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => triggerSample(sample.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedSample(selectedSample === sample.id ? null : sample.id);
              }}
              className={`
                relative aspect-square rounded-lg font-medium text-sm
                transition-all duration-100 active:scale-95
                flex flex-col items-center justify-center gap-1
                border-2
                ${sample.isPlaying 
                  ? "scale-95 brightness-125" 
                  : "hover:brightness-110"
                }
              `}
              style={{
                backgroundColor: `${sample.color}20`,
                borderColor: sample.isPlaying ? sample.color : `${sample.color}50`,
                boxShadow: sample.isPlaying ? `0 0 20px ${sample.color}50` : "none"
              }}
              data-testid={`button-sample-${sample.id}`}
            >
              <span style={{ color: sample.color }}>{sample.name}</span>
              {sample.loop && (
                <Repeat className="w-3 h-3 absolute top-1 right-1" style={{ color: sample.color }} />
              )}
              {sample.isPlaying && sample.loop && (
                <div 
                  className="absolute inset-0 rounded-lg animate-pulse"
                  style={{ backgroundColor: `${sample.color}10` }}
                />
              )}
            </button>
          ))}
        </div>

        {selectedSampleData && (
          <div 
            className="p-3 rounded-lg border space-y-3"
            style={{ 
              borderColor: `${selectedSampleData.color}50`,
              backgroundColor: `${selectedSampleData.color}10`
            }}
          >
            <div className="flex items-center justify-between">
              <Badge style={{ backgroundColor: selectedSampleData.color, color: "#000" }}>
                {selectedSampleData.name}
              </Badge>
              <Button
                size="sm"
                variant={selectedSampleData.loop ? "default" : "outline"}
                onClick={() => toggleLoop(selectedSampleData.id)}
                className="h-6"
                data-testid="button-toggle-loop"
              >
                <Repeat className="w-3 h-3 mr-1" />
                Loop
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Volume</span>
                <span>{selectedSampleData.volume}%</span>
              </div>
              <Slider
                value={[selectedSampleData.volume]}
                onValueChange={(v) => updateSampleVolume(selectedSampleData.id, v[0])}
                min={0}
                max={100}
                className="w-full"
                data-testid="slider-sample-volume"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-7">
                <Upload className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-7">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Gen
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Click to trigger - Right-click to edit
        </p>
      </CardContent>
    </Card>
  );
}
