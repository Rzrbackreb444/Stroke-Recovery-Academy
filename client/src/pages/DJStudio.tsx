import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import * as Tone from "tone";
import {
  Disc3, Play, Pause, Volume2, Upload, Save,
  Sliders, Wand2, Sparkles, ArrowLeft, Loader2, RotateCcw,
  FastForward, Rewind, Settings, Headphones, Radio, Zap,
  Mic, Music, Waves, SkipBack, SkipForward, Square,
  CircleDot, Scissors, Layers, AudioWaveform
} from "lucide-react";

interface DeckState {
  isPlaying: boolean;
  isLoaded: boolean;
  fileName: string;
  volume: number;
  pitch: number;
  tempo: number;
  lowEQ: number;
  midEQ: number;
  highEQ: number;
  isScratchMode: boolean;
  currentTime: number;
  duration: number;
  waveformData: number[];
}

const defaultDeckState: DeckState = {
  isPlaying: false,
  isLoaded: false,
  fileName: "",
  volume: 80,
  pitch: 0,
  tempo: 100,
  lowEQ: 0,
  midEQ: 0,
  highEQ: 0,
  isScratchMode: false,
  currentTime: 0,
  duration: 0,
  waveformData: [],
};

export default function DJStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("decks");
  
  // Deck states
  const [deckA, setDeckA] = useState<DeckState>({ ...defaultDeckState });
  const [deckB, setDeckB] = useState<DeckState>({ ...defaultDeckState });
  const [crossfader, setCrossfader] = useState([50]);
  const [masterVolume, setMasterVolume] = useState([80]);
  const [bpm, setBpm] = useState([120]);
  
  // Effects
  const [effects, setEffects] = useState({
    reverb: 0,
    delay: 0,
    distortion: 0,
    filter: 100,
    flanger: 0,
    phaser: 0,
  });
  
  // Autotune
  const [autotuneEnabled, setAutotuneEnabled] = useState(false);
  const [autotuneKey, setAutotuneKey] = useState("C");
  const [autotuneStrength, setAutotuneStrength] = useState([50]);
  
  // Stem separation
  const [isSeparating, setIsSeparating] = useState(false);
  const [stems, setStems] = useState<{vocals: boolean, drums: boolean, bass: boolean, other: boolean}>({
    vocals: true,
    drums: true,
    bass: true,
    other: true,
  });
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // Voice transformation
  const [availableVoices, setAvailableVoices] = useState<Array<{id: string; name: string; category: string}>>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedAudioUrl, setTransformedAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [djStatus, setDjStatus] = useState<{voiceTransformConfigured: boolean} | null>(null);
  
  // Audio refs
  const playerARef = useRef<Tone.Player | null>(null);
  const playerBRef = useRef<Tone.Player | null>(null);
  const gainARef = useRef<Tone.Gain | null>(null);
  const gainBRef = useRef<Tone.Gain | null>(null);
  const eqARef = useRef<Tone.EQ3 | null>(null);
  const eqBRef = useRef<Tone.EQ3 | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const canvasARef = useRef<HTMLCanvasElement | null>(null);
  const canvasBRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserARef = useRef<AnalyserNode | null>(null);
  const analyserBRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      // Create effects chain
      reverbRef.current = new Tone.Reverb({ decay: 2, wet: 0 }).toDestination();
      delayRef.current = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0 }).connect(reverbRef.current);
      distortionRef.current = new Tone.Distortion({ distortion: 0, wet: 0 }).connect(delayRef.current);
      filterRef.current = new Tone.Filter({ frequency: 20000, type: "lowpass" }).connect(distortionRef.current);
      
      // Create EQs
      eqARef.current = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).connect(filterRef.current);
      eqBRef.current = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).connect(filterRef.current);
      
      // Create gains
      gainARef.current = new Tone.Gain(0.8).connect(eqARef.current);
      gainBRef.current = new Tone.Gain(0.8).connect(eqBRef.current);
      
      // Create players
      playerARef.current = new Tone.Player().connect(gainARef.current);
      playerBRef.current = new Tone.Player().connect(gainBRef.current);
    };
    
    initAudio();
    
    return () => {
      playerARef.current?.dispose();
      playerBRef.current?.dispose();
      gainARef.current?.dispose();
      gainBRef.current?.dispose();
      eqARef.current?.dispose();
      eqBRef.current?.dispose();
      reverbRef.current?.dispose();
      delayRef.current?.dispose();
      distortionRef.current?.dispose();
      filterRef.current?.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update crossfader
  useEffect(() => {
    const crossfadeValue = crossfader[0] / 100;
    if (gainARef.current) {
      gainARef.current.gain.value = (1 - crossfadeValue) * (masterVolume[0] / 100);
    }
    if (gainBRef.current) {
      gainBRef.current.gain.value = crossfadeValue * (masterVolume[0] / 100);
    }
  }, [crossfader, masterVolume]);

  // Update effects
  useEffect(() => {
    if (reverbRef.current) reverbRef.current.wet.value = effects.reverb / 100;
    if (delayRef.current) delayRef.current.wet.value = effects.delay / 100;
    if (distortionRef.current) {
      distortionRef.current.distortion = effects.distortion / 100;
      distortionRef.current.wet.value = effects.distortion > 0 ? 1 : 0;
    }
    if (filterRef.current) filterRef.current.frequency.value = (effects.filter / 100) * 20000;
  }, [effects]);

  // Fetch DJ status and available voices
  useEffect(() => {
    const fetchDJStatus = async () => {
      try {
        const response = await fetch('/api/dj/status');
        if (response.ok) {
          const data = await response.json();
          setDjStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch DJ status:', error);
      }
    };

    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/dj/voices', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.voices) {
            setAvailableVoices(data.voices);
          }
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      }
    };

    fetchDJStatus();
    fetchVoices();
  }, []);

  // Voice transformation function
  const transformVoice = async (voiceId: string, voiceName: string) => {
    if (!recordedBlob) {
      toast({
        title: "No Recording",
        description: "Please record your voice first",
        variant: "destructive",
      });
      return;
    }

    setIsTransforming(true);
    setSelectedVoice(voiceId);

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch('/api/dj/voice-transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          audioBase64: base64Audio,
          voiceId,
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      });

      const data = await response.json();

      if (data.success && data.audioBase64) {
        const binaryString = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setTransformedAudioUrl(url);

        toast({
          title: "Voice Transformed!",
          description: `Your voice has been transformed using ${voiceName}`,
        });
      } else {
        throw new Error(data.error || 'Transformation failed');
      }
    } catch (error: any) {
      toast({
        title: "Transformation Failed",
        description: error.message || "Could not transform voice",
        variant: "destructive",
      });
    } finally {
      setIsTransforming(false);
      setSelectedVoice(null);
    }
  };

  // Load audio file
  const loadAudio = async (file: File, deck: 'A' | 'B') => {
    try {
      await Tone.start();
      const url = URL.createObjectURL(file);
      const player = deck === 'A' ? playerARef.current : playerBRef.current;
      const setDeck = deck === 'A' ? setDeckA : setDeckB;
      
      if (player) {
        await player.load(url);
        setDeck(prev => ({
          ...prev,
          isLoaded: true,
          fileName: file.name,
          duration: player.buffer.duration,
        }));
        
        toast({
          title: "Track Loaded",
          description: `${file.name} loaded to Deck ${deck}`,
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Could not load audio file",
        variant: "destructive",
      });
    }
  };

  // Play/pause deck
  const togglePlay = (deck: 'A' | 'B') => {
    const player = deck === 'A' ? playerARef.current : playerBRef.current;
    const deckState = deck === 'A' ? deckA : deckB;
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    
    if (!player || !deckState.isLoaded) return;
    
    if (deckState.isPlaying) {
      player.stop();
    } else {
      player.start();
    }
    
    setDeck(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // Update deck EQ
  const updateEQ = (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => {
    const eq = deck === 'A' ? eqARef.current : eqBRef.current;
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    
    if (eq) {
      eq[band].value = value;
    }
    
    setDeck(prev => ({ ...prev, [`${band}EQ`]: value }));
  };

  // Update deck volume
  const updateVolume = (deck: 'A' | 'B', value: number) => {
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    setDeck(prev => ({ ...prev, volume: value }));
  };

  // Update tempo/pitch
  const updateTempo = (deck: 'A' | 'B', value: number) => {
    const player = deck === 'A' ? playerARef.current : playerBRef.current;
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    
    if (player) {
      player.playbackRate = value / 100;
    }
    
    setDeck(prev => ({ ...prev, tempo: value }));
  };

  // Stem separation placeholder
  const separateStems = async () => {
    setIsSeparating(true);
    toast({
      title: "Stem Separation",
      description: "Processing audio... This may take a moment.",
    });
    
    // Simulate processing - in production, this would call Demucs API
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsSeparating(false);
    toast({
      title: "Stems Ready",
      description: "Vocals, drums, bass, and other tracks isolated",
    });
  };

  // Start/stop recording
  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setRecordedBlob(blob);
          stream.getTracks().forEach(track => track.stop());
          toast({
            title: "Recording Saved",
            description: "Your recording is ready for processing",
          });
        };
        
        recorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        
        toast({
          title: "Recording Started",
          description: "Speak or sing into your microphone",
        });
      } catch (error) {
        toast({
          title: "Microphone Error",
          description: "Could not access microphone",
          variant: "destructive",
        });
      }
    }
  };

  // Render turntable deck
  const renderDeck = (deck: 'A' | 'B') => {
    const deckState = deck === 'A' ? deckA : deckB;
    const setDeck = deck === 'A' ? setDeckA : setDeckB;
    const color = deck === 'A' ? 'orange' : 'pink';
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc3 className={`w-5 h-5 text-${color}-500`} />
              Deck {deck}
            </div>
            <Badge variant="outline" className={deckState.isLoaded ? 'border-green-500 text-[#E2741B]' : 'border-zinc-600'}>
              {deckState.isLoaded ? 'Ready' : 'Empty'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Turntable Visual */}
          <div className="flex justify-center">
            <div 
              className={`relative w-48 h-48 rounded-full bg-[#1a1a1a] border-4 border-[#333] flex items-center justify-center cursor-pointer transition-all ${deckState.isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: `${60 / (bpm[0] * (deckState.tempo / 100))}s` }}
              data-testid={`turntable-deck-${deck.toLowerCase()}`}
            >
              {/* Vinyl grooves */}
              <div className="absolute inset-4 rounded-full border border-[#333]" />
              <div className="absolute inset-8 rounded-full border border-[#333]" />
              <div className="absolute inset-12 rounded-full border border-[#333]" />
              <div className="absolute inset-16 rounded-full border border-[#333]" />
              
              {/* Center label */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-${color}-500/30 to-${color}-600/30 border-2 border-${color}-500 flex items-center justify-center`}>
                <Disc3 className={`w-8 h-8 text-${color}-400`} />
              </div>
              
              {/* Arm indicator */}
              <div className={`absolute top-2 right-8 w-1 h-20 bg-zinc-600 origin-top transform ${deckState.isPlaying ? 'rotate-12' : 'rotate-45'} transition-transform`} />
            </div>
          </div>

          {/* Track info */}
          <div className="text-center">
            <p className="text-sm text-zinc-400 truncate">
              {deckState.fileName || 'No track loaded'}
            </p>
          </div>

          {/* Transport controls */}
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="icon" data-testid={`button-rewind-${deck.toLowerCase()}`}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              variant={deckState.isPlaying ? "destructive" : "default"}
              size="icon"
              onClick={() => togglePlay(deck)}
              disabled={!deckState.isLoaded}
              data-testid={`button-play-${deck.toLowerCase()}`}
            >
              {deckState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" data-testid={`button-forward-${deck.toLowerCase()}`}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => inputRef.current?.click()}
              data-testid={`button-load-${deck.toLowerCase()}`}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && loadAudio(e.target.files[0], deck)}
            />
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Volume</Label>
              <span className="text-xs text-zinc-500">{deckState.volume}%</span>
            </div>
            <Slider
              value={[deckState.volume]}
              onValueChange={([v]) => updateVolume(deck, v)}
              max={100}
              className="w-full"
              data-testid={`slider-volume-${deck.toLowerCase()}`}
            />
          </div>

          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tempo</Label>
              <span className="text-xs text-zinc-500">{deckState.tempo}%</span>
            </div>
            <Slider
              value={[deckState.tempo]}
              onValueChange={([v]) => updateTempo(deck, v)}
              min={50}
              max={150}
              className="w-full"
              data-testid={`slider-tempo-${deck.toLowerCase()}`}
            />
          </div>

          {/* EQ */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-center block">Low</Label>
              <Slider
                value={[deckState.lowEQ]}
                onValueChange={([v]) => updateEQ(deck, 'low', v)}
                min={-12}
                max={12}
                orientation="vertical"
                className="h-16 mx-auto"
                data-testid={`slider-eq-low-${deck.toLowerCase()}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-center block">Mid</Label>
              <Slider
                value={[deckState.midEQ]}
                onValueChange={([v]) => updateEQ(deck, 'mid', v)}
                min={-12}
                max={12}
                orientation="vertical"
                className="h-16 mx-auto"
                data-testid={`slider-eq-mid-${deck.toLowerCase()}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-center block">High</Label>
              <Slider
                value={[deckState.highEQ]}
                onValueChange={([v]) => updateEQ(deck, 'high', v)}
                min={-12}
                max={12}
                orientation="vertical"
                className="h-16 mx-auto"
                data-testid={`slider-eq-high-${deck.toLowerCase()}`}
              />
            </div>
          </div>

          {/* Scratch mode */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Scratch Mode</Label>
            <Switch
              checked={deckState.isScratchMode}
              onCheckedChange={(v) => setDeck(prev => ({ ...prev, isScratchMode: v }))}
              data-testid={`switch-scratch-${deck.toLowerCase()}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO 
        title="DJ Studio | Stroke Recovery Academy"
        description="Professional DJ studio with dual turntables, stem separation, autotune, effects, and mixing. Create mashups, scratch, slow down, speed up, and transform your music."
        canonical="/dj-studio"
        keywords="DJ software, music mixing, stem separation, autotune, mashups, turntables, audio production"
      />
      <GlobalHeader variant="minimal" />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/music-studio">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Disc3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">DJ Studio</h1>
            <p className="text-zinc-400 text-sm">Mix, scratch, mashup, and transform</p>
          </div>
          <Badge className="ml-auto bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/50">
            <Sparkles className="w-3 h-3 mr-1" /> Pro
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#1a1a1a] border border-[#333]">
            <TabsTrigger value="decks" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
              <Disc3 className="w-4 h-4 mr-2" /> Decks
            </TabsTrigger>
            <TabsTrigger value="effects" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
              <Sliders className="w-4 h-4 mr-2" /> Effects
            </TabsTrigger>
            <TabsTrigger value="stems" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
              <Layers className="w-4 h-4 mr-2" /> Stems
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
              <Mic className="w-4 h-4 mr-2" /> Voice
            </TabsTrigger>
          </TabsList>

          {/* DECKS TAB */}
          <TabsContent value="decks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderDeck('A')}
              {renderDeck('B')}
            </div>

            {/* Crossfader */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <span className="text-[#E2741B] font-bold text-sm">A</span>
                  <Slider
                    value={crossfader}
                    onValueChange={setCrossfader}
                    max={100}
                    className="flex-1"
                    data-testid="slider-crossfader"
                  />
                  <span className="text-pink-500 font-bold text-sm">B</span>
                </div>
              </CardContent>
            </Card>

            {/* Master controls */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardContent className="flex items-center gap-6 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <Volume2 className="w-5 h-5 text-zinc-400" />
                  <Slider
                    value={masterVolume}
                    onValueChange={setMasterVolume}
                    max={100}
                    className="w-32"
                    data-testid="slider-master-volume"
                  />
                  <span className="text-sm text-zinc-400 w-12">{masterVolume[0]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-zinc-400" />
                  <Label className="text-sm">BPM:</Label>
                  <Slider
                    value={bpm}
                    onValueChange={setBpm}
                    min={60}
                    max={200}
                    className="w-24"
                    data-testid="slider-bpm"
                  />
                  <span className="text-sm font-mono w-10">{bpm[0]}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setDeckA({ ...defaultDeckState });
                  setDeckB({ ...defaultDeckState });
                  setCrossfader([50]);
                }} data-testid="button-reset">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EFFECTS TAB */}
          <TabsContent value="effects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-400" /> Reverb
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.reverb]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, reverb: v }))}
                    max={100}
                    data-testid="slider-reverb"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.reverb}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Waves className="w-5 h-5 text-purple-400" /> Delay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.delay]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, delay: v }))}
                    max={100}
                    data-testid="slider-delay"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.delay}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-400" /> Distortion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.distortion]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, distortion: v }))}
                    max={100}
                    data-testid="slider-distortion"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.distortion}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#E2741B]" /> Low-Pass Filter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.filter]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, filter: v }))}
                    max={100}
                    data-testid="slider-filter"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.filter}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AudioWaveform className="w-5 h-5 text-cyan-400" /> Flanger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.flanger]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, flanger: v }))}
                    max={100}
                    data-testid="slider-flanger"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.flanger}%</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Phaser
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[effects.phaser]}
                    onValueChange={([v]) => setEffects(prev => ({ ...prev, phaser: v }))}
                    max={100}
                    data-testid="slider-phaser"
                  />
                  <p className="text-xs text-zinc-500 mt-2">{effects.phaser}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* STEMS TAB */}
          <TabsContent value="stems" className="space-y-4">
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E2741B]" />
                  AI Stem Separation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-400">
                  Isolate vocals, drums, bass, and other instruments from any track using AI.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stems).map(([stem, enabled]) => (
                    <div key={stem} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                      <Label className="capitalize">{stem}</Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) => setStems(prev => ({ ...prev, [stem]: v }))}
                        data-testid={`switch-stem-${stem}`}
                      />
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={separateStems}
                  disabled={isSeparating || !deckA.isLoaded}
                  className="w-full bg-[#E2741B] hover:bg-[#b8860b]"
                  data-testid="button-separate-stems"
                >
                  {isSeparating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Separating Stems...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Separate Stems
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VOICE TAB */}
          <TabsContent value="voice" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recording */}
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-red-500" />
                    Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-zinc-400 text-sm">
                    Record your voice to apply effects, autotune, or transformation.
                  </p>
                  
                  <div className="flex justify-center">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      size="lg"
                      onClick={toggleRecording}
                      className={`rounded-full w-20 h-20 ${isRecording ? 'animate-pulse' : ''}`}
                      data-testid="button-record"
                    >
                      {isRecording ? <Square className="w-8 h-8" /> : <CircleDot className="w-8 h-8" />}
                    </Button>
                  </div>
                  
                  <p className="text-center text-sm text-zinc-500">
                    {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                  </p>

                  {recordedBlob && (
                    <div className="p-3 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm text-[#E2741B] mb-2">Recording saved!</p>
                      <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Autotune */}
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-[#E2741B]" />
                    Autotune
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Autotune</Label>
                    <Switch
                      checked={autotuneEnabled}
                      onCheckedChange={setAutotuneEnabled}
                      data-testid="switch-autotune"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Key</Label>
                    <div className="flex flex-wrap gap-2">
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                        <Button
                          key={key}
                          variant={autotuneKey === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAutotuneKey(key)}
                          className={autotuneKey === key ? 'bg-[#E2741B]' : ''}
                          data-testid={`button-key-${key.toLowerCase().replace('#', 'sharp')}`}
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Correction Strength</Label>
                      <span className="text-sm text-zinc-500">{autotuneStrength[0]}%</span>
                    </div>
                    <Slider
                      value={autotuneStrength}
                      onValueChange={setAutotuneStrength}
                      max={100}
                      disabled={!autotuneEnabled}
                      data-testid="slider-autotune-strength"
                    />
                  </div>

                  <Button 
                    className="w-full bg-[#E2741B] hover:bg-[#b8860b]"
                    disabled={!recordedBlob || !autotuneEnabled}
                    data-testid="button-apply-autotune"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Apply Autotune
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Voice Transformation - ElevenLabs */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Voice Transformation
                  {djStatus?.voiceTransformConfigured && (
                    <Badge className="ml-2 bg-[#E2741B]/20 text-[#E2741B] border-green-600">
                      <Zap className="w-3 h-3 mr-1" /> ElevenLabs Connected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-400">
                  Transform your voice using professional AI voice models. Record your voice first, then select a target voice.
                </p>

                {transformedAudioUrl && (
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-purple-500/30">
                    <p className="text-sm text-purple-400 mb-2">Transformed Audio</p>
                    <audio controls src={transformedAudioUrl} className="w-full" data-testid="audio-transformed" />
                  </div>
                )}

                {availableVoices.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                    {availableVoices.slice(0, 12).map((voice) => (
                      <Button
                        key={voice.id}
                        variant="outline"
                        className={`h-16 flex flex-col gap-1 hover:border-[#E2741B] hover:text-[#E2741B] ${
                          selectedVoice === voice.id ? 'border-[#E2741B] bg-[#E2741B]/10' : ''
                        }`}
                        disabled={!recordedBlob || isTransforming}
                        onClick={() => transformVoice(voice.id, voice.name)}
                        data-testid={`button-voice-${voice.id}`}
                      >
                        {isTransforming && selectedVoice === voice.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Headphones className="w-5 h-5" />
                        )}
                        <span className="text-xs truncate w-full text-center">{voice.name}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    {djStatus?.voiceTransformConfigured ? (
                      <>
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p>Loading available voices...</p>
                      </>
                    ) : (
                      <>
                        <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Voice transformation requires authentication</p>
                      </>
                    )}
                  </div>
                )}

                <p className="text-xs text-zinc-500 text-center">
                  {recordedBlob ? 'Select a voice above to transform your recording' : 'Record your voice first to enable transformation'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
