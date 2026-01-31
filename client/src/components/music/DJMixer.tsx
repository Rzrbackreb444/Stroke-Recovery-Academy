import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Volume2, 
  Headphones, 
  Link2, 
  Unlink2,
  Disc,
  ArrowLeftRight,
  Gauge,
  Zap
} from "lucide-react";

interface DJMixerProps {
  onCrossfadeChange?: (value: number) => void;
  onMasterVolumeChange?: (value: number) => void;
  onChannelChange?: (channel: "A" | "B", settings: ChannelSettings) => void;
}

interface ChannelSettings {
  volume: number;
  gain: number;
  low: number;
  mid: number;
  high: number;
  filter: number;
  cue: boolean;
}

export function DJMixer({ onCrossfadeChange, onMasterVolumeChange, onChannelChange }: DJMixerProps) {
  const [crossfade, setCrossfade] = useState(50);
  const [masterVolume, setMasterVolume] = useState(80);
  const [sync, setSync] = useState(false);
  
  const [channelA, setChannelA] = useState<ChannelSettings>({
    volume: 80,
    gain: 0,
    low: 0,
    mid: 0,
    high: 0,
    filter: 50,
    cue: false
  });

  const [channelB, setChannelB] = useState<ChannelSettings>({
    volume: 80,
    gain: 0,
    low: 0,
    mid: 0,
    high: 0,
    filter: 50,
    cue: false
  });

  const updateChannelA = (key: keyof ChannelSettings, value: number | boolean) => {
    const updated = { ...channelA, [key]: value };
    setChannelA(updated);
    onChannelChange?.("A", updated);
  };

  const updateChannelB = (key: keyof ChannelSettings, value: number | boolean) => {
    const updated = { ...channelB, [key]: value };
    setChannelB(updated);
    onChannelChange?.("B", updated);
  };

  const handleCrossfadeChange = (value: number) => {
    setCrossfade(value);
    onCrossfadeChange?.(value);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    onMasterVolumeChange?.(value);
  };

  const ChannelStrip = ({ 
    channel, 
    settings, 
    onUpdate, 
    color 
  }: { 
    channel: "A" | "B"; 
    settings: ChannelSettings; 
    onUpdate: (key: keyof ChannelSettings, value: number | boolean) => void;
    color: string;
  }) => (
    <div className="space-y-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="flex items-center justify-between">
        <Badge style={{ backgroundColor: color, color: "#000" }} className="font-bold">
          CH {channel}
        </Badge>
        <Button
          size="sm"
          variant={settings.cue ? "default" : "outline"}
          onClick={() => onUpdate("cue", !settings.cue)}
          className="h-6 px-2"
          data-testid={`button-cue-ch${channel}`}
        >
          <Headphones className="w-3 h-3 mr-1" />
          CUE
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Gain</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[settings.gain]}
            onValueChange={(v) => onUpdate("gain", v[0])}
            min={-12}
            max={12}
            step={0.5}
            className="flex-1"
            data-testid={`slider-gain-ch${channel}`}
          />
          <Badge variant="outline" className="w-12 justify-center font-mono text-xs">
            {settings.gain > 0 ? "+" : ""}{settings.gain.toFixed(0)}dB
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["high", "mid", "low"] as const).map((band) => (
          <div key={band} className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">{band}</Label>
            <div className="h-24 flex justify-center">
              <Slider
                value={[settings[band]]}
                onValueChange={(v) => onUpdate(band, v[0])}
                min={-12}
                max={12}
                step={0.5}
                orientation="vertical"
                className="h-full"
                data-testid={`slider-${band}-ch${channel}`}
              />
            </div>
            <div className="text-center text-xs text-gray-500">
              {settings[band] > 0 ? "+" : ""}{settings[band].toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Filter</Label>
        <Slider
          value={[settings.filter]}
          onValueChange={(v) => onUpdate("filter", v[0])}
          min={0}
          max={100}
          className="w-full"
          data-testid={`slider-filter-ch${channel}`}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>LP</span>
          <span>HP</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Volume</Label>
        <div className="h-32 flex justify-center">
          <Slider
            value={[settings.volume]}
            onValueChange={(v) => onUpdate("volume", v[0])}
            min={0}
            max={100}
            orientation="vertical"
            className="h-full"
            data-testid={`slider-volume-ch${channel}`}
          />
        </div>
        <div className="text-center">
          <Badge variant="outline" className="font-mono">
            {settings.volume}%
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Disc className="w-5 h-5 text-orange-500" />
          DJ Mixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ChannelStrip 
            channel="A" 
            settings={channelA} 
            onUpdate={updateChannelA}
            color="#C9941A"
          />
          <ChannelStrip 
            channel="B" 
            settings={channelB} 
            onUpdate={updateChannelB}
            color="#10B981"
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-orange-500" />
              <Label className="text-sm font-medium">Crossfader</Label>
            </div>
            <Button
              size="sm"
              variant={sync ? "default" : "outline"}
              onClick={() => setSync(!sync)}
              className="h-7"
              data-testid="button-sync"
            >
              {sync ? <Link2 className="w-3 h-3 mr-1" /> : <Unlink2 className="w-3 h-3 mr-1" />}
              SYNC
            </Button>
          </div>
          
          <div className="relative">
            <Slider
              value={[crossfade]}
              onValueChange={(v) => handleCrossfadeChange(v[0])}
              min={0}
              max={100}
              className="w-full"
              data-testid="slider-crossfade"
            />
            <div className="flex justify-between mt-1">
              <Badge className="bg-amber-600 text-xs">A</Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {crossfade < 50 ? `A ${100 - crossfade * 2}%` : crossfade > 50 ? `B ${(crossfade - 50) * 2}%` : "50/50"}
              </Badge>
              <Badge className="bg-emerald-600 text-xs">B</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-orange-500" />
              <Label className="text-sm font-medium">Master</Label>
            </div>
            <Badge variant="outline" className="font-mono">
              {masterVolume}%
            </Badge>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={(v) => handleMasterVolumeChange(v[0])}
            min={0}
            max={100}
            className="w-full"
            data-testid="slider-master"
          />
          
          <div className="flex gap-1 h-2 mt-2">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all ${
                  i < (masterVolume / 5)
                    ? i < 14 
                      ? "bg-green-500" 
                      : i < 17 
                        ? "bg-yellow-500" 
                        : "bg-red-500"
                    : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
