import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Waves, 
  Radio, 
  Timer, 
  Zap, 
  Wind, 
  AudioWaveform,
  Gauge,
  Sparkles
} from "lucide-react";

interface Effect {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  params: { name: string; value: number; min: number; max: number; unit?: string }[];
  color: string;
}

interface EffectsRackProps {
  onEffectChange?: (effects: Effect[]) => void;
}

export function EffectsRack({ onEffectChange }: EffectsRackProps) {
  const [effects, setEffects] = useState<Effect[]>([
    {
      id: "distortion",
      name: "Distortion",
      icon: Zap,
      enabled: false,
      color: "#EF4444",
      params: [
        { name: "Drive", value: 0.4, min: 0, max: 1 },
        { name: "Wet", value: 0.5, min: 0, max: 1 },
        { name: "Tone", value: 0.5, min: 0, max: 1 }
      ]
    },
    {
      id: "reverb",
      name: "Reverb",
      icon: Waves,
      enabled: false,
      color: "#3B82F6",
      params: [
        { name: "Decay", value: 2.5, min: 0.1, max: 10, unit: "s" },
        { name: "Pre-Delay", value: 0.02, min: 0, max: 0.1, unit: "s" },
        { name: "Wet", value: 0.3, min: 0, max: 1 }
      ]
    },
    {
      id: "delay",
      name: "Delay",
      icon: Timer,
      enabled: false,
      color: "#8B5CF6",
      params: [
        { name: "Time", value: 0.25, min: 0.01, max: 1, unit: "s" },
        { name: "Feedback", value: 0.4, min: 0, max: 0.9 },
        { name: "Wet", value: 0.3, min: 0, max: 1 }
      ]
    },
    {
      id: "filter",
      name: "Filter",
      icon: Wind,
      enabled: false,
      color: "#10B981",
      params: [
        { name: "Frequency", value: 1000, min: 20, max: 20000, unit: "Hz" },
        { name: "Resonance", value: 1, min: 0.1, max: 20 },
        { name: "Type", value: 0, min: 0, max: 3 }
      ]
    },
    {
      id: "phaser",
      name: "Phaser",
      icon: AudioWaveform,
      enabled: false,
      color: "#F59E0B",
      params: [
        { name: "Rate", value: 0.5, min: 0.1, max: 10, unit: "Hz" },
        { name: "Depth", value: 0.8, min: 0, max: 1 },
        { name: "Wet", value: 0.5, min: 0, max: 1 }
      ]
    },
    {
      id: "chorus",
      name: "Chorus",
      icon: Radio,
      enabled: false,
      color: "#EC4899",
      params: [
        { name: "Rate", value: 1.5, min: 0.1, max: 5, unit: "Hz" },
        { name: "Depth", value: 0.7, min: 0, max: 1 },
        { name: "Wet", value: 0.5, min: 0, max: 1 }
      ]
    },
    {
      id: "compressor",
      name: "Compressor",
      icon: Gauge,
      enabled: false,
      color: "#6366F1",
      params: [
        { name: "Threshold", value: -24, min: -60, max: 0, unit: "dB" },
        { name: "Ratio", value: 4, min: 1, max: 20 },
        { name: "Attack", value: 0.003, min: 0, max: 0.1, unit: "s" }
      ]
    },
    {
      id: "bitcrusher",
      name: "Bit Crusher",
      icon: Sparkles,
      enabled: false,
      color: "#14B8A6",
      params: [
        { name: "Bits", value: 8, min: 1, max: 16 },
        { name: "Sample Rate", value: 0.5, min: 0, max: 1 },
        { name: "Wet", value: 0.5, min: 0, max: 1 }
      ]
    }
  ]);

  const toggleEffect = (effectId: string) => {
    const updated = effects.map(e => 
      e.id === effectId ? { ...e, enabled: !e.enabled } : e
    );
    setEffects(updated);
    onEffectChange?.(updated);
  };

  const updateParam = (effectId: string, paramName: string, value: number) => {
    const updated = effects.map(e => 
      e.id === effectId 
        ? { 
            ...e, 
            params: e.params.map(p => 
              p.name === paramName ? { ...p, value } : p
            )
          } 
        : e
    );
    setEffects(updated);
    onEffectChange?.(updated);
  };

  const formatValue = (value: number, unit?: string, min?: number, max?: number) => {
    if (unit === "Hz" && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit}`;
    }
    if (unit === "dB") {
      return `${value.toFixed(0)}${unit}`;
    }
    if (unit) {
      return `${value.toFixed(2)}${unit}`;
    }
    return value.toFixed(2);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-orange-500" />
          Effects Rack
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {effects.map((effect) => {
            const Icon = effect.icon;
            return (
              <div
                key={effect.id}
                className={`p-3 rounded-lg border transition-all ${
                  effect.enabled 
                    ? "border-opacity-100 bg-opacity-10" 
                    : "border-gray-700 bg-gray-800/50"
                }`}
                style={{
                  borderColor: effect.enabled ? effect.color : undefined,
                  backgroundColor: effect.enabled ? `${effect.color}10` : undefined
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon 
                      className="w-4 h-4" 
                      style={{ color: effect.enabled ? effect.color : "#6B7280" }}
                    />
                    <span className="text-sm font-medium">{effect.name}</span>
                  </div>
                  <Switch
                    checked={effect.enabled}
                    onCheckedChange={() => toggleEffect(effect.id)}
                    data-testid={`switch-${effect.id}`}
                  />
                </div>

                <div className="space-y-2">
                  {effect.params.map((param) => (
                    <div key={param.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-400">{param.name}</Label>
                        <Badge variant="outline" className="text-xs font-mono h-5 px-1">
                          {formatValue(param.value, param.unit, param.min, param.max)}
                        </Badge>
                      </div>
                      <Slider
                        value={[param.value]}
                        onValueChange={(v) => updateParam(effect.id, param.name, v[0])}
                        min={param.min}
                        max={param.max}
                        step={(param.max - param.min) / 100}
                        disabled={!effect.enabled}
                        className="w-full"
                        data-testid={`slider-${effect.id}-${param.name.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
