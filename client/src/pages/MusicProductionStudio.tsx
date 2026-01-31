import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Music, 
  Disc, 
  Sliders, 
  AudioWaveform, 
  Sparkles, 
  Library,
  Grid3X3,
  Settings,
  Save,
  Share2,
  Download,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { Link } from "wouter";

import { DJTurntable } from "@/components/music/DJTurntable";
import { DJMixer } from "@/components/music/DJMixer";
import { Equalizer } from "@/components/music/Equalizer";
import { EffectsRack } from "@/components/music/EffectsRack";
import { WaveformVisualizer } from "@/components/music/WaveformVisualizer";
import { SamplePad } from "@/components/music/SamplePad";
import { AIMixingPanel } from "@/components/music/AIMixingPanel";
import { TrackLibrary } from "@/components/music/TrackLibrary";

export default function MusicProductionStudio() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"dj" | "production" | "ai">("dj");
  const [deckATrack, setDeckATrack] = useState<string | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTrackSelect = (track: any, deck: "A" | "B") => {
    if (deck === "A") {
      setDeckATrack(track.previewUrl || track.url);
    } else {
      setDeckBTrack(track.previewUrl || track.url);
    }
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Music Production Studio</h1>
                <p className="text-xs text-gray-400">Create, Mix, Master with AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden md:flex">
              <Sparkles className="w-3 h-3 mr-1 text-orange-500" />
              AI Powered
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
              disabled={isSaving}
              data-testid="button-save"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden md:inline ml-2">Save</span>
            </Button>
            
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Export</span>
            </Button>
            
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" data-testid="button-share">
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline ml-2">Publish</span>
            </Button>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex gap-1 bg-gray-900 p-1 rounded-lg w-fit">
            <Button
              size="sm"
              variant={activeView === "dj" ? "default" : "ghost"}
              onClick={() => setActiveView("dj")}
              className={activeView === "dj" ? "bg-orange-500" : ""}
              data-testid="button-view-dj"
            >
              <Disc className="w-4 h-4 mr-2" />
              DJ Mode
            </Button>
            <Button
              size="sm"
              variant={activeView === "production" ? "default" : "ghost"}
              onClick={() => setActiveView("production")}
              className={activeView === "production" ? "bg-orange-500" : ""}
              data-testid="button-view-production"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Production
            </Button>
            <Button
              size="sm"
              variant={activeView === "ai" ? "default" : "ghost"}
              onClick={() => setActiveView("ai")}
              className={activeView === "ai" ? "bg-orange-500" : ""}
              data-testid="button-view-ai"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Studio
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4">
        {activeView === "dj" && (
          <div className="space-y-4">
            <WaveformVisualizer isPlaying={true} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DJTurntable deckId="A" audioUrl={deckATrack || undefined} />
              <DJMixer />
              <DJTurntable deckId="B" audioUrl={deckBTrack || undefined} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TrackLibrary onTrackSelect={handleTrackSelect} />
              <SamplePad />
            </div>
          </div>
        )}

        {activeView === "production" && (
          <div className="space-y-4">
            <WaveformVisualizer isPlaying={true} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Equalizer />
              <EffectsRack />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <TrackLibrary onTrackSelect={handleTrackSelect} />
              </div>
              <SamplePad />
            </div>
          </div>
        )}

        {activeView === "ai" && (
          <div className="space-y-4">
            <AIMixingPanel 
              onTrackGenerated={(url) => {
                setDeckATrack(url);
              }} 
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TrackLibrary onTrackSelect={handleTrackSelect} />
              <div className="space-y-4">
                <Equalizer />
                <EffectsRack />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-[#0a0a0a]/95 backdrop-blur p-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600">A</Badge>
              <span className="text-sm text-gray-400 truncate max-w-32">
                {deckATrack ? "Track Loaded" : "No Track"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600">B</Badge>
              <span className="text-sm text-gray-400 truncate max-w-32">
                {deckBTrack ? "Track Loaded" : "No Track"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AudioWaveform className="w-4 h-4" />
            <span>48kHz / 24-bit</span>
            <span className="mx-2">|</span>
            <span>Latency: 10ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
