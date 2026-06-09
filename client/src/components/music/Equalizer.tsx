import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AudioLines, RotateCcw, Waves } from "lucide-react";

interface EQBand {
  frequency: number;
  gain: number;
  q: number;
  label: string;
}

interface EqualizerProps {
  onEQChange?: (bands: EQBand[]) => void;
}

const PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0],
  bass_boost: [6, 5, 3, 1, 0, 0, 0, 0],
  treble_boost: [0, 0, 0, 0, 1, 3, 5, 6],
  vocal: [-2, -1, 0, 2, 4, 3, 1, 0],
  electronic: [4, 3, 0, -2, 0, 2, 4, 5],
  rock: [4, 3, 1, 0, -1, 2, 4, 5],
  jazz: [3, 2, 0, 1, -1, 0, 2, 3],
  acoustic: [3, 2, 1, 0, 1, 2, 3, 2],
  loudness: [5, 4, 1, 0, 0, 1, 4, 5],
  deep: [5, 4, 2, 0, -1, -2, -1, 0]
};

export function Equalizer({ onEQChange }: EqualizerProps) {
  const [enabled, setEnabled] = useState(true);
  const [bands, setBands] = useState<EQBand[]>([
    { frequency: 32, gain: 0, q: 1, label: "32" },
    { frequency: 64, gain: 0, q: 1, label: "64" },
    { frequency: 125, gain: 0, q: 1, label: "125" },
    { frequency: 250, gain: 0, q: 1, label: "250" },
    { frequency: 500, gain: 0, q: 1, label: "500" },
    { frequency: 1000, gain: 0, q: 1, label: "1K" },
    { frequency: 2000, gain: 0, q: 1, label: "2K" },
    { frequency: 4000, gain: 0, q: 1, label: "4K" },
    { frequency: 8000, gain: 0, q: 1, label: "8K" },
    { frequency: 16000, gain: 0, q: 1, label: "16K" }
  ]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("flat");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCurve();
  }, [bands, enabled]);

  const drawCurve = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!enabled) {
      ctx.strokeStyle = "#6B7280";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#E2741B");
    gradient.addColorStop(0.5, "#F59E0B");
    gradient.addColorStop(1, "#EF4444");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points: [number, number][] = bands.map((band, i) => {
      const x = (i / (bands.length - 1)) * width;
      const y = midY - (band.gain / 12) * (height / 2 - 10);
      return [x, y];
    });

    ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev[0] + curr[0]) / 2;
      ctx.quadraticCurveTo(prev[0], prev[1], cpX, (prev[1] + curr[1]) / 2);
    }
    ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
    ctx.stroke();

    points.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = bands[i].gain !== 0 ? "#E2741B" : "#6B7280";
      ctx.fill();
    });
  };

  const updateBand = (index: number, gain: number) => {
    const updated = bands.map((band, i) => 
      i === index ? { ...band, gain } : band
    );
    setBands(updated);
    setSelectedPreset(null);
    onEQChange?.(updated);
  };

  const applyPreset = (presetName: string) => {
    const presetValues = PRESETS[presetName as keyof typeof PRESETS];
    if (!presetValues) return;

    const paddedValues = [...presetValues];
    while (paddedValues.length < bands.length) {
      paddedValues.push(0);
    }

    const updated = bands.map((band, i) => ({
      ...band,
      gain: paddedValues[i] || 0
    }));
    setBands(updated);
    setSelectedPreset(presetName);
    onEQChange?.(updated);
  };

  const reset = () => {
    applyPreset("flat");
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AudioLines className="w-5 h-5 text-orange-500" />
            10-Band Equalizer
          </CardTitle>
          <div className="flex items-center gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              data-testid="switch-eq-enabled"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
              data-testid="button-eq-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {Object.keys(PRESETS).map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={selectedPreset === preset ? "default" : "outline"}
              onClick={() => applyPreset(preset)}
              className="text-xs capitalize"
              data-testid={`button-preset-${preset}`}
            >
              {preset.replace("_", " ")}
            </Button>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          className="w-full h-24 rounded-md bg-gray-950"
        />

        <div className="flex items-end justify-between gap-1 h-48">
          {bands.map((band, index) => (
            <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1">
              <Badge 
                variant="outline" 
                className={`text-xs font-mono px-1 h-5 ${
                  band.gain !== 0 ? "border-orange-500 text-orange-400" : ""
                }`}
              >
                {band.gain > 0 ? "+" : ""}{band.gain.toFixed(0)}
              </Badge>
              
              <div className="h-32 flex items-center">
                <Slider
                  value={[band.gain]}
                  onValueChange={(v) => updateBand(index, v[0])}
                  min={-12}
                  max={12}
                  step={0.5}
                  orientation="vertical"
                  disabled={!enabled}
                  className="h-full"
                  data-testid={`slider-eq-${band.label}`}
                />
              </div>
              
              <span className="text-xs text-gray-400">{band.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Waves className="w-3 h-3" /> Low
          </span>
          <span>Mid</span>
          <span className="flex items-center gap-1">
            High <Waves className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
