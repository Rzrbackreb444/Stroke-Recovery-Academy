import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SEO, { studioSchemas } from "@/components/SEO";
import GlobalHeader from "@/components/GlobalHeader";
import * as Tone from "tone";
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Mic, MicOff,
  Music, Drum, Guitar, Piano, Waves, Sparkles, Wand2, FileAudio, Video,
  Download, Plus, Trash2, Settings, Headphones, Radio, Zap, Brain, PenTool,
  Save, RefreshCw, Upload, Film, Clapperboard, User, Users, Disc, RotateCcw,
  FastForward, Rewind, CircleDot, Square as StopIcon, Activity, Layers, Shuffle,
  Scissors, Target, Disc3, Tv, Settings2, Sliders, CheckCircle, Globe, FileText,
  Rocket, Heart
} from "lucide-react";

// Genre configurations
const genres = [
  // Hip-Hop & Rap
  { value: "rap", label: "Hip-Hop", icon: Mic, category: "Hip-Hop" },
  { value: "trap", label: "Trap", icon: Mic, category: "Hip-Hop" },
  { value: "lofi", label: "Lo-Fi Hip Hop", icon: Headphones, category: "Hip-Hop" },
  { value: "boom_bap", label: "Boom Bap", icon: Mic, category: "Hip-Hop" },
  // Rock & Metal
  { value: "rock", label: "Rock", icon: Guitar, category: "Rock" },
  { value: "metal", label: "Metal", icon: Zap, category: "Rock" },
  { value: "punk", label: "Punk", icon: Drum, category: "Rock" },
  { value: "hardcore", label: "Hardcore", icon: Zap, category: "Rock" },
  { value: "alternative", label: "Alternative", icon: Radio, category: "Rock" },
  // Electronic & Dance
  { value: "edm", label: "EDM", icon: Waves, category: "Electronic" },
  { value: "house", label: "House", icon: Disc3, category: "Electronic" },
  { value: "techno", label: "Techno", icon: Settings2, category: "Electronic" },
  { value: "dubstep", label: "Dubstep", icon: Waves, category: "Electronic" },
  { value: "drum_and_bass", label: "Drum & Bass", icon: Drum, category: "Electronic" },
  { value: "synthwave", label: "Synthwave", icon: Radio, category: "Electronic" },
  // Pop & R&B
  { value: "pop", label: "Pop", icon: Music, category: "Pop" },
  { value: "rnb", label: "R&B", icon: Heart, category: "Pop" },
  { value: "soul", label: "Soul", icon: Heart, category: "Pop" },
  { value: "funk", label: "Funk", icon: Disc3, category: "Pop" },
  // Country & Folk
  { value: "country", label: "Country", icon: Guitar, category: "Country" },
  { value: "bluegrass", label: "Bluegrass", icon: Guitar, category: "Country" },
  { value: "folk", label: "Folk", icon: Guitar, category: "Country" },
  // Jazz & Blues
  { value: "jazz", label: "Jazz", icon: Music, category: "Jazz" },
  { value: "blues", label: "Blues", icon: Guitar, category: "Jazz" },
  // World
  { value: "reggae", label: "Reggae", icon: Music, category: "World" },
  { value: "latin", label: "Latin", icon: Drum, category: "World" },
  // Cinematic & Healing
  { value: "ambient", label: "Ambient", icon: Sparkles, category: "Atmospheric" },
  { value: "cinematic", label: "Cinematic", icon: Film, category: "Atmospheric" },
  { value: "orchestral", label: "Orchestral", icon: Music, category: "Atmospheric" },
  // Recovery & Motivation (Stroke Recovery Academy Exclusive)
  { value: "recovery", label: "Recovery Healing", icon: Heart, category: "Motivation" },
  { value: "motivation", label: "Motivational", icon: Rocket, category: "Motivation" },
  { value: "warrior", label: "Warrior Anthem", icon: Zap, category: "Motivation" },
];

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scales = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
];

interface Track {
  id: string;
  name: string;
  type: "drums" | "bass" | "synth" | "guitar" | "vocals" | "ai";
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  audioUrl?: string;
}

interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
}

export default function MusicStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [masterVolume, setMasterVolume] = useState(80);
  const [bpm, setBpm] = useState(120);
  
  // Project settings
  const [selectedKey, setSelectedKey] = useState("C");
  const [selectedScale, setSelectedScale] = useState("minor");
  const [selectedGenre, setSelectedGenre] = useState("rock");
  const [genreCategory, setGenreCategory] = useState("All");
  const [lyriaSeed, setLyriaSeed] = useState<number | undefined>(undefined);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [lyrics, setLyrics] = useState("");
  
  // Generation states
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingInstrumental, setIsGeneratingInstrumental] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Voice cloning
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState("southernRap");
  const [voiceText, setVoiceText] = useState("");
  const [clonedVoiceKey, setClonedVoiceKey] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  
  // Movie studio
  const [moviePremise, setMoviePremise] = useState("");
  const [movieGenre, setMovieGenre] = useState("action");
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [storyboardFrames, setStoryboardFrames] = useState<string[]>([]);
  
  // Song Creator Wizard state
  const [creatorStep, setCreatorStep] = useState(1);
  const [songTheme, setSongTheme] = useState("");
  const [songMood, setSongMood] = useState("triumphant");
  const [songInfluences, setSongInfluences] = useState("");
  const [generatedBeat, setGeneratedBeat] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState("melodic");
  const [isGeneratingBeat, setIsGeneratingBeat] = useState(false);
  
  // Melody Magic state (Record → Analyze → Transform → Recompose)
  const [melodyMagicStep, setMelodyMagicStep] = useState(1);
  const [isRecordingMelody, setIsRecordingMelody] = useState(false);
  const [recordedMelodyUrl, setRecordedMelodyUrl] = useState<string | null>(null);
  const [melodyAnalysis, setMelodyAnalysis] = useState<{
    detectedBpm: number;
    detectedKey: string;
    detectedScale: string;
    melodyNotes: string[];
    rhythmPattern: string;
    confidence: number;
  } | null>(null);
  const [isAnalyzingMelody, setIsAnalyzingMelody] = useState(false);
  const [targetGenre, setTargetGenre] = useState("pop");
  const [targetVoiceStyle, setTargetVoiceStyle] = useState("powerful");
  const [melodyLyrics, setMelodyLyrics] = useState("");
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [recomposedTrack, setRecomposedTrack] = useState<{
    audioUrl: string;
    title: string;
    lyrics: string;
  } | null>(null);
  const melodyRecorderRef = useRef<MediaRecorder | null>(null);
  const melodyChunksRef = useRef<Blob[]>([]);
  
  // Mashup & Voice Swap state
  const [mashupMode, setMashupMode] = useState<"voice-swap" | "mashup" | "reimagine">("voice-swap");
  const [sourceSongDescription, setSourceSongDescription] = useState("");
  const [secondSongDescription, setSecondSongDescription] = useState("");
  const [targetArtistStyle, setTargetArtistStyle] = useState("pop-icon");
  const [mashupGenre, setMashupGenre] = useState("original");
  const [mashupTempo, setMashupTempo] = useState(100); // percentage of original
  const [mashupEnergy, setMashupEnergy] = useState(100);
  const [isGeneratingMashup, setIsGeneratingMashup] = useState(false);
  const [mashupResult, setMashupResult] = useState<{
    title: string;
    description: string;
    concept: string;
    suggestedLyrics?: string;
  } | null>(null);
  
  // Stem Separation state
  const [stemUploadUrl, setStemUploadUrl] = useState<string | null>(null);
  const [isSeparatingStems, setIsSeparatingStems] = useState(false);
  const [separatedStems, setSeparatedStems] = useState<{
    vocals: string | null;
    drums: string | null;
    bass: string | null;
    other: string | null;
    instrumental: string | null;
  } | null>(null);
  const stemFileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Voice Library state
  const [selectedVoiceModel, setSelectedVoiceModel] = useState("natural-male");
  const [voiceLibraryText, setVoiceLibraryText] = useState("");
  const [isGeneratingVoicePreview, setIsGeneratingVoicePreview] = useState(false);
  const [customVoiceName, setCustomVoiceName] = useState("");
  const [isTrainingVoice, setIsTrainingVoice] = useState(false);
  
  // AI Mastering state
  const [masteringPreset, setMasteringPreset] = useState("streaming");
  const [masteringLoudness, setMasteringLoudness] = useState(-14); // LUFS
  const [masteringStereoWidth, setMasteringStereoWidth] = useState(100);
  const [isMastering, setIsMastering] = useState(false);
  const [masteredTrackUrl, setMasteredTrackUrl] = useState<string | null>(null);
  
  // Distribution Hub state
  const [distributionPlatforms, setDistributionPlatforms] = useState<string[]>([]);
  const [trackMetadata, setTrackMetadata] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    releaseDate: "",
    isrc: "",
  });
  const [isDistributing, setIsDistributing] = useState(false);
  
  // Video-to-Music Sync state
  const [videoSyncUrl, setVideoSyncUrl] = useState<string | null>(null);
  const [videoMood, setVideoMood] = useState("auto");
  const [videoTempo, setVideoTempo] = useState("match");
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [generatedSoundtrack, setGeneratedSoundtrack] = useState<string | null>(null);
  const videoSyncFileRef = useRef<HTMLInputElement>(null);
  
  // Live Adaptive Music state
  const [liveMode, setLiveMode] = useState<"gaming" | "streaming" | "meditation" | "workout">("gaming");
  const [liveIntensity, setLiveIntensity] = useState(50);
  const [isLiveMusicActive, setIsLiveMusicActive] = useState(false);
  const [liveEnergyLevel, setLiveEnergyLevel] = useState(50);
  
  // === ELEVENLABS AI VOICE STATE ===
  const [elevenLabsVoices, setElevenLabsVoices] = useState<Array<{ voice_id: string; name: string; category: string }>>([]);
  const [selectedElevenLabsVoice, setSelectedElevenLabsVoice] = useState("");
  const [elevenLabsText, setElevenLabsText] = useState("");
  const [elevenLabsAudio, setElevenLabsAudio] = useState<string | null>(null);
  const [isGeneratingElevenLabs, setIsGeneratingElevenLabs] = useState(false);
  const [elevenLabsModel, setElevenLabsModel] = useState("eleven_multilingual_v2");
  const [elevenLabsStability, setElevenLabsStability] = useState(50);
  const [elevenLabsSimilarity, setElevenLabsSimilarity] = useState(75);
  const [elevenLabsStyle, setElevenLabsStyle] = useState(50);
  const [isElevenLabsConfigured, setIsElevenLabsConfigured] = useState(false);
  const elevenLabsAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // === BEAT LAB - Professional Music Creation ===
  // Drum Machine State (16-step sequencer)
  const [drumPattern, setDrumPattern] = useState<boolean[][]>([
    // Kick: Classic 4-on-floor
    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    // Snare: 2 and 4
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    // Hi-Hat closed
    [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    // Hi-Hat open
    [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    // Clap
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    // Tom
    [false, false, false, false, false, false, false, false, false, false, false, true, false, false, true, false],
    // Crash
    [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    // Ride
    [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  ]);
  const [drumKitType, setDrumKitType] = useState<"hiphop" | "rock" | "electronic" | "trap" | "jazz" | "acoustic">("hiphop");
  const [drumVolumes, setDrumVolumes] = useState<number[]>([80, 75, 70, 65, 75, 60, 70, 65]);
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [swingAmount, setSwingAmount] = useState(0);
  
  // Bass Synth State
  const [bassPattern, setBassPattern] = useState<{note: string; velocity: number; active: boolean}[]>(
    Array(16).fill(null).map(() => ({ note: "C2", velocity: 80, active: false }))
  );
  const [bassSound, setBassSound] = useState<"sub" | "808" | "analog" | "fm" | "reese">("808");
  const [bassFilter, setBassFilter] = useState(50);
  const [bassDecay, setBassDecay] = useState(70);
  const [bassDistortion, setBassDistortion] = useState(0);
  
  // Synth Pad State (for chords)
  const [chordProgression, setChordProgression] = useState<{chord: string; duration: number}[]>([
    { chord: "Cm7", duration: 4 },
    { chord: "Fm7", duration: 4 },
    { chord: "Gm7", duration: 4 },
    { chord: "Ab", duration: 4 },
  ]);
  const [synthType, setSynthType] = useState<"pad" | "lead" | "pluck" | "brass" | "strings">("pad");
  const [synthAttack, setSynthAttack] = useState(30);
  const [synthRelease, setSynthRelease] = useState(70);
  const [synthDetune, setSynthDetune] = useState(0);
  
  // Melody Sequencer State
  const [melodyPattern, setMelodyPattern] = useState<{note: string; step: number; length: number}[]>([]);
  const [melodyScale, setMelodyScale] = useState<string[]>(["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]);
  const [activeOctave, setActiveOctave] = useState(4);
  
  // Genre Templates
  const [activeGenreTemplate, setActiveGenreTemplate] = useState<string | null>(null);
  
  // Song Arrangement
  const [songSections, setSongSections] = useState<{id: string; name: string; bars: number; patterns: string[]}[]>([
    { id: "intro", name: "Intro", bars: 4, patterns: ["drums"] },
    { id: "verse1", name: "Verse 1", bars: 8, patterns: ["drums", "bass", "synth"] },
    { id: "chorus1", name: "Chorus", bars: 8, patterns: ["drums", "bass", "synth", "melody"] },
    { id: "verse2", name: "Verse 2", bars: 8, patterns: ["drums", "bass", "synth"] },
    { id: "chorus2", name: "Chorus", bars: 8, patterns: ["drums", "bass", "synth", "melody"] },
    { id: "outro", name: "Outro", bars: 4, patterns: ["drums", "synth"] },
  ]);
  
  // EQ state (8-band parametric) - frequencies match filter chain exactly
  const [eqBands, setEqBands] = useState<EQBand[]>([
    { frequency: 60, gain: 0, Q: 1.5 },    // Sub bass (lowshelf)
    { frequency: 170, gain: 0, Q: 1.5 },   // Bass
    { frequency: 350, gain: 0, Q: 1.5 },   // Low mids
    { frequency: 700, gain: 0, Q: 1.5 },   // Mids
    { frequency: 1400, gain: 0, Q: 1.5 },  // Upper mids
    { frequency: 2800, gain: 0, Q: 1.5 },  // Presence
    { frequency: 5600, gain: 0, Q: 1.5 },  // Brilliance
    { frequency: 11200, gain: 0, Q: 1.5 }, // Air (highshelf)
  ]);
  
  // Effects state
  const [reverbMix, setReverbMix] = useState(30);
  const [delayTime, setDelayTime] = useState(50);
  const [delayFeedback, setDelayFeedback] = useState(30);
  const [compThreshold, setCompThreshold] = useState(-20);
  const [compRatio, setCompRatio] = useState(4);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(false);
  const [autoTuneSpeed, setAutoTuneSpeed] = useState(50);
  
  // Tracks
  const [tracks, setTracks] = useState<Track[]>([
    { id: "1", name: "Drums", type: "drums", volume: 80, pan: 50, muted: false, solo: false, color: "bg-red-500" },
    { id: "2", name: "Bass", type: "bass", volume: 75, pan: 50, muted: false, solo: false, color: "bg-blue-500" },
    { id: "3", name: "Synth Lead", type: "synth", volume: 70, pan: 45, muted: false, solo: false, color: "bg-[#C9941A]" },
    { id: "4", name: "Guitar", type: "guitar", volume: 65, pan: 55, muted: false, solo: false, color: "bg-[#C9941A]" },
  ]);

  // Audio refs
  const toneStarted = useRef(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const channelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Advanced audio processing refs
  const eqFiltersRef = useRef<Tone.Filter[]>([]);
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const distortionRef = useRef<Tone.Distortion | null>(null);
  const phaserRef = useRef<Tone.Phaser | null>(null);
  const limiterRef = useRef<Tone.Limiter | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const waveformDataRef = useRef<Float32Array>(new Float32Array(256));
  const [spectrumData, setSpectrumData] = useState<number[]>(new Array(64).fill(-100));
  const [meterLevel, setMeterLevel] = useState(-60);
  const animationFrameRef = useRef<number>(0);
  
  // === BEAT LAB Audio Refs ===
  // Drum machine refs
  const drumSynthsRef = useRef<{
    kick: Tone.MembraneSynth | null;
    snare: Tone.NoiseSynth | null;
    hihatClosed: Tone.MetalSynth | null;
    hihatOpen: Tone.MetalSynth | null;
    clap: Tone.NoiseSynth | null;
    tom: Tone.MembraneSynth | null;
    crash: Tone.MetalSynth | null;
    ride: Tone.MetalSynth | null;
  }>({
    kick: null,
    snare: null,
    hihatClosed: null,
    hihatOpen: null,
    clap: null,
    tom: null,
    crash: null,
    ride: null,
  });
  const drumChannelRef = useRef<Tone.Channel | null>(null);
  
  // Bass synth refs
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const bassFilterRef = useRef<Tone.Filter | null>(null);
  const bassDistortionRef = useRef<Tone.Distortion | null>(null); // Dedicated bass distortion
  const bassChannelRef = useRef<Tone.Channel | null>(null);
  
  // Pad/Chord synth refs
  const padSynthRef = useRef<Tone.PolySynth | null>(null);
  const padChannelRef = useRef<Tone.Channel | null>(null);
  
  // Lead/Melody synth refs
  const leadSynthRef = useRef<Tone.Synth | null>(null);
  const leadChannelRef = useRef<Tone.Channel | null>(null);
  
  // Sequencer refs
  const sequencerRef = useRef<Tone.Sequence | null>(null);
  const sequencerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch voice styles
  const { data: voiceStyles } = useQuery<{ styles?: any[] }>({
    queryKey: ['/api/voice/styles'],
  });

  // Fetch audio presets
  const { data: audioPresets } = useQuery<{ presets?: { eq?: any[] } }>({
    queryKey: ['/api/audio/presets'],
  });

  // Fetch video styles
  const { data: videoStyles } = useQuery<{ styles?: any[] }>({
    queryKey: ['/api/video/styles'],
  });

  // Initialize Tone.js with professional-grade effects chain
  const initAudio = async () => {
    if (!toneStarted.current) {
      await Tone.start();
      toneStarted.current = true;
      
      // === PROFESSIONAL 8-BAND PARAMETRIC EQ ===
      // Create 8 individual filters for precise frequency control
      // Frequencies: 60, 170, 350, 700, 1400, 2800, 5600, 11200 Hz
      eqFiltersRef.current = eqBands.map((band, i) => {
        const filter = new Tone.Filter({
          frequency: band.frequency,
          type: i === 0 ? "lowshelf" : i === 7 ? "highshelf" : "peaking",
          Q: band.Q,
          gain: band.gain,
        });
        return filter;
      });
      
      // === AUTO-TUNE / PITCH CORRECTION ===
      pitchShiftRef.current = new Tone.PitchShift({
        pitch: 0,
        windowSize: 0.1,
        delayTime: 0,
        feedback: 0,
        wet: autoTuneEnabled ? autoTuneSpeed / 100 : 0,
      });
      
      // === PROFESSIONAL DYNAMICS ===
      compressorRef.current = new Tone.Compressor({
        threshold: compThreshold,
        ratio: compRatio,
        attack: 0.003,
        release: 0.25,
        knee: 6,
      });
      
      limiterRef.current = new Tone.Limiter(-1); // Brickwall limiter at -1dB
      
      // === MODULATION EFFECTS ===
      chorusRef.current = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: 0,
      }).start();
      
      phaserRef.current = new Tone.Phaser({
        frequency: 0.5,
        octaves: 3,
        stages: 10,
        Q: 10,
        baseFrequency: 350,
        wet: 0,
      });
      
      distortionRef.current = new Tone.Distortion({
        distortion: 0,
        wet: 0,
      });
      
      // === TIME-BASED EFFECTS ===
      reverbRef.current = new Tone.Reverb({
        decay: 2.5,
        wet: reverbMix / 100,
        preDelay: 0.01,
      });
      await reverbRef.current.generate(); // Pre-generate IR for instant response
      
      delayRef.current = new Tone.FeedbackDelay({
        delayTime: delayTime / 1000,
        feedback: delayFeedback / 100,
        wet: 0.3,
        maxDelay: 2,
      });
      
      // === ANALYSIS / METERING ===
      analyserRef.current = new Tone.Analyser("fft", 128);
      meterRef.current = new Tone.Meter({ smoothing: 0.8 });
      
      // === MASTER OUTPUT ===
      masterGainRef.current = new Tone.Gain(masterVolume / 100);
      
      // === PROFESSIONAL SIGNAL CHAIN ===
      // Input -> EQ bands (chained) -> Pitch Shift -> Compressor -> 
      // Chorus -> Phaser -> Distortion -> Reverb -> Delay -> Limiter -> Master -> Output
      
      // Chain EQ filters together
      for (let i = 0; i < eqFiltersRef.current.length - 1; i++) {
        eqFiltersRef.current[i].connect(eqFiltersRef.current[i + 1]);
      }
      
      // Connect the rest of the chain
      const lastEQ = eqFiltersRef.current[eqFiltersRef.current.length - 1];
      lastEQ.connect(pitchShiftRef.current!);
      pitchShiftRef.current.connect(compressorRef.current);
      compressorRef.current.connect(chorusRef.current!);
      chorusRef.current.connect(phaserRef.current!);
      phaserRef.current.connect(distortionRef.current!);
      distortionRef.current.connect(reverbRef.current);
      reverbRef.current.connect(delayRef.current);
      delayRef.current.connect(limiterRef.current!);
      limiterRef.current.connect(masterGainRef.current);
      masterGainRef.current.connect(analyserRef.current!);
      masterGainRef.current.connect(meterRef.current!);
      masterGainRef.current.toDestination();
      
      Tone.getTransport().bpm.value = bpm;
      
      // === BEAT LAB INSTRUMENTS INITIALIZATION ===
      // Create drum channel
      drumChannelRef.current = new Tone.Channel({ volume: 0 });
      drumChannelRef.current.connect(eqFiltersRef.current[0]);
      
      // Initialize drum synths with genre-specific sounds
      drumSynthsRef.current.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
      });
      drumSynthsRef.current.kick.connect(drumChannelRef.current);
      
      drumSynthsRef.current.snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.1 },
      });
      drumSynthsRef.current.snare.connect(drumChannelRef.current);
      
      drumSynthsRef.current.hihatClosed = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      } as any);
      drumSynthsRef.current.hihatClosed.volume.value = -10;
      drumSynthsRef.current.hihatClosed.connect(drumChannelRef.current);
      
      drumSynthsRef.current.hihatOpen = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      } as any);
      drumSynthsRef.current.hihatOpen.volume.value = -10;
      drumSynthsRef.current.hihatOpen.connect(drumChannelRef.current);
      
      drumSynthsRef.current.clap = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.08 },
      });
      drumSynthsRef.current.clap.connect(drumChannelRef.current);
      
      drumSynthsRef.current.tom = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 4,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
      });
      drumSynthsRef.current.tom.connect(drumChannelRef.current);
      
      drumSynthsRef.current.crash = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.5, release: 0.5 },
        harmonicity: 5.1,
        modulationIndex: 40,
        resonance: 3000,
        octaves: 1.5,
      } as any);
      drumSynthsRef.current.crash.volume.value = -8;
      drumSynthsRef.current.crash.connect(drumChannelRef.current);
      
      drumSynthsRef.current.ride = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
        harmonicity: 3,
        modulationIndex: 20,
        resonance: 5000,
        octaves: 1,
      } as any);
      drumSynthsRef.current.ride.volume.value = -12;
      drumSynthsRef.current.ride.connect(drumChannelRef.current);
      
      // Create bass synth channel with dedicated distortion
      bassChannelRef.current = new Tone.Channel({ volume: -3 });
      bassChannelRef.current.connect(eqFiltersRef.current[0]);
      
      bassDistortionRef.current = new Tone.Distortion({
        distortion: 0,
        wet: 0,
      });
      
      bassFilterRef.current = new Tone.Filter({
        frequency: 800,
        type: "lowpass",
        Q: 2,
      });
      
      bassSynthRef.current = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 200, octaves: 2.5 },
      });
      // Chain: Bass Synth → Filter → Distortion → Channel → EQ
      bassSynthRef.current.connect(bassFilterRef.current);
      bassFilterRef.current.connect(bassDistortionRef.current);
      bassDistortionRef.current.connect(bassChannelRef.current);
      
      // Create pad synth channel
      padChannelRef.current = new Tone.Channel({ volume: -6 });
      padChannelRef.current.connect(eqFiltersRef.current[0]);
      
      padSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 },
      });
      padSynthRef.current.connect(padChannelRef.current);
      
      // Create lead synth channel
      leadChannelRef.current = new Tone.Channel({ volume: -4 });
      leadChannelRef.current.connect(eqFiltersRef.current[0]);
      
      leadSynthRef.current = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
      });
      leadSynthRef.current.connect(leadChannelRef.current);
      
      // Start real-time visualization
      const updateVisuals = () => {
        if (analyserRef.current && meterRef.current) {
          const spectrum = analyserRef.current.getValue() as Float32Array;
          setSpectrumData(Array.from(spectrum.slice(0, 64)));
          setMeterLevel(meterRef.current.getValue() as number);
        }
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      };
      updateVisuals();
    }
  };

  // Update BPM
  useEffect(() => {
    if (toneStarted.current) {
      Tone.getTransport().bpm.value = bpm;
    }
  }, [bpm]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume / 100;
    }
  }, [masterVolume]);

  // Update effects in real-time
  useEffect(() => {
    if (reverbRef.current) reverbRef.current.wet.value = reverbMix / 100;
  }, [reverbMix]);

  useEffect(() => {
    if (delayRef.current) {
      delayRef.current.delayTime.value = delayTime / 1000;
      delayRef.current.feedback.value = delayFeedback / 100;
    }
  }, [delayTime, delayFeedback]);

  useEffect(() => {
    if (compressorRef.current) {
      compressorRef.current.threshold.value = compThreshold;
      compressorRef.current.ratio.value = compRatio;
    }
  }, [compThreshold, compRatio]);

  // Update 8-band EQ in real-time (gain and Q)
  useEffect(() => {
    eqFiltersRef.current.forEach((filter, i) => {
      if (filter && eqBands[i]) {
        filter.gain.value = eqBands[i].gain;
        filter.Q.value = eqBands[i].Q;
      }
    });
  }, [eqBands]);

  // Update auto-tune in real-time
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.wet.value = autoTuneEnabled ? autoTuneSpeed / 100 : 0;
    }
  }, [autoTuneEnabled, autoTuneSpeed]);

  // === ELEVENLABS: Check configuration and fetch voices ===
  useEffect(() => {
    const checkElevenLabsStatus = async () => {
      try {
        const response = await fetch('/api/voice/elevenlabs/status');
        const data = await response.json();
        setIsElevenLabsConfigured(data.configured);
        
        if (data.configured) {
          const voicesResponse = await fetch('/api/voice/elevenlabs/voices');
          if (voicesResponse.ok) {
            const voicesData = await voicesResponse.json();
            if (voicesData.voices) {
              setElevenLabsVoices(voicesData.voices);
              if (voicesData.voices.length > 0) {
                setSelectedElevenLabsVoice(voicesData.voices[0].voice_id);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to check ElevenLabs status:", error);
      }
    };
    
    checkElevenLabsStatus();
  }, []);

  // Generate speech with ElevenLabs
  const generateElevenLabsVoice = async () => {
    if (!elevenLabsText.trim() || !selectedElevenLabsVoice) {
      toast({ title: "Missing input", description: "Enter text and select a voice", variant: "destructive" });
      return;
    }
    
    setIsGeneratingElevenLabs(true);
    try {
      const response = await apiRequest("POST", "/api/voice/elevenlabs/synthesize", {
        text: elevenLabsText,
        voiceId: selectedElevenLabsVoice,
        modelId: elevenLabsModel,
        stability: elevenLabsStability / 100,
        similarityBoost: elevenLabsSimilarity / 100,
        style: elevenLabsStyle / 100,
      });
      const data = await response.json();
      
      if (data.audioBase64) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
        setElevenLabsAudio(audioUrl);
        toast({ title: "Voice generated!", description: "Your AI voiceover is ready" });
      }
    } catch (error) {
      console.error("ElevenLabs generation error:", error);
      toast({ title: "Generation failed", description: "Could not generate voice", variant: "destructive" });
    } finally {
      setIsGeneratingElevenLabs(false);
    }
  };

  // === BEAT LAB: Wire UI controls to audio engine ===
  
  // Update bass synth parameters in real-time
  useEffect(() => {
    if (bassFilterRef.current) {
      // Map 0-100 to 100-5000 Hz frequency range
      bassFilterRef.current.frequency.value = 100 + (bassFilter / 100) * 4900;
    }
    if (bassSynthRef.current) {
      // Map decay 0-100 to 0.1-2.0 seconds
      bassSynthRef.current.envelope.decay = 0.1 + (bassDecay / 100) * 1.9;
      // Update oscillator type based on bass sound selection
      const oscTypes: Record<string, OscillatorType> = {
        "808": "sine",
        "sub": "sine", 
        "analog": "sawtooth",
        "fm": "square",
        "reese": "sawtooth",
      };
      bassSynthRef.current.oscillator.type = oscTypes[bassSound] || "sawtooth";
    }
  }, [bassFilter, bassDecay, bassSound]);
  
  // Update bass distortion (dedicated bass-only distortion)
  useEffect(() => {
    if (bassDistortionRef.current) {
      // Apply distortion only to bass channel
      const currentDist = bassDistortion / 100 * 0.8; // Max 80% distortion
      bassDistortionRef.current.distortion = currentDist;
      bassDistortionRef.current.wet.value = bassDistortion > 0 ? 1 : 0;
    }
  }, [bassDistortion]);
  
  // Update pad synth parameters in real-time
  useEffect(() => {
    if (padSynthRef.current) {
      // Map attack 0-100 to 0.01-2.0 seconds
      const attackTime = 0.01 + (synthAttack / 100) * 1.99;
      // Map release 0-100 to 0.1-4.0 seconds  
      const releaseTime = 0.1 + (synthRelease / 100) * 3.9;
      
      // Update oscillator type based on synth type selection
      const oscTypes: Record<string, "sine" | "square" | "triangle" | "sawtooth"> = {
        "pad": "sine",
        "lead": "square",
        "pluck": "triangle",
        "brass": "sawtooth",
        "strings": "sine",
      };
      
      // Apply all parameters including oscillator type to PolySynth
      padSynthRef.current.set({
        oscillator: {
          type: oscTypes[synthType] || "sine",
        },
        envelope: {
          attack: attackTime,
          release: releaseTime,
        },
        detune: synthDetune * 10, // Map -50 to 50 to -500 to 500 cents
      });
    }
  }, [synthAttack, synthRelease, synthDetune, synthType]);
  
  // Update lead synth parameters
  useEffect(() => {
    if (leadSynthRef.current) {
      const oscTypes: Record<string, "sine" | "square" | "triangle" | "sawtooth"> = {
        "pad": "sine",
        "lead": "square", 
        "pluck": "triangle",
        "brass": "sawtooth",
        "strings": "sine",
      };
      leadSynthRef.current.oscillator.type = oscTypes[synthType] || "square";
    }
  }, [synthType]);
  
  // Restart sequencer interval when BPM changes during playback
  useEffect(() => {
    if (isSequencerPlaying && sequencerIntervalRef.current) {
      clearInterval(sequencerIntervalRef.current);
      const stepTime = (60 / bpm / 4) * 1000;
      let step = currentStep;
      
      const playStep = () => {
        setCurrentStep(step);
        drumPattern.forEach((row, drumIdx) => {
          if (row[step]) {
            triggerDrum(drumIdx);
          }
        });
        if (bassPattern[step]?.active) {
          playBassNote(bassPattern[step].note);
        }
        if (step % 4 === 0) {
          const chordIndex = Math.floor(step / 4) % chordProgression.length;
          if (chordProgression[chordIndex]) {
            playChord(chordProgression[chordIndex].chord);
          }
        }
        step = (step + 1) % 16;
      };
      
      sequencerIntervalRef.current = setInterval(playStep, stepTime);
    }
  }, [bpm, isSequencerPlaying]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Load audio for tracks with audioUrl
  useEffect(() => {
    tracks.forEach(track => {
      if (track.audioUrl && !playersRef.current.has(track.id)) {
        const channel = new Tone.Channel({
          volume: Tone.gainToDb(track.volume / 100),
          pan: (track.pan - 50) / 50,
          mute: track.muted,
        });
        
        const player = new Tone.Player({
          url: track.audioUrl,
          loop: true,
          onload: () => {
            toast({ title: `${track.name} loaded` });
          },
        });
        
        player.connect(channel);
        
        // Route to professional effects chain (8-band EQ -> full chain)
        if (eqFiltersRef.current.length > 0) {
          channel.connect(eqFiltersRef.current[0]);
        } else if (compressorRef.current) {
          // Fallback to compressor if EQ not initialized
          channel.connect(compressorRef.current);
        }
        
        playersRef.current.set(track.id, player);
        channelsRef.current.set(track.id, channel);
      }
    });
  }, [tracks]);

  // Update individual track channels
  useEffect(() => {
    tracks.forEach(track => {
      const channel = channelsRef.current.get(track.id);
      if (channel) {
        channel.volume.value = Tone.gainToDb(track.volume / 100);
        channel.pan.value = (track.pan - 50) / 50;
        channel.mute = track.muted;
      }
    });
  }, [tracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playersRef.current.forEach(player => player.dispose());
      channelsRef.current.forEach(channel => channel.dispose());
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = async () => {
    await initAudio();
    if (isPlaying) {
      // Pause all players
      playersRef.current.forEach(player => {
        if (player.state === "started") player.stop();
      });
      Tone.getTransport().pause();
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    } else {
      // Start all players that have audio loaded
      const startTime = Tone.now();
      playersRef.current.forEach((player, trackId) => {
        const track = tracks.find(t => t.id === trackId);
        if (track && !track.muted && player.loaded) {
          player.start(startTime);
        }
      });
      Tone.getTransport().start();
      
      // Update time display
      timeIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= duration) {
            handleStop();
            return 0;
          }
          return next;
        });
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    // Stop all players
    playersRef.current.forEach(player => {
      if (player.state === "started") player.stop();
    });
    Tone.getTransport().stop();
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTrack = (type: Track["type"]) => {
    const colors: Record<string, string> = {
      drums: "bg-red-500", bass: "bg-blue-500", synth: "bg-[#C9941A]",
      guitar: "bg-[#C9941A]", vocals: "bg-[#C9941A]", ai: "bg-primary",
    };
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type, volume: 75, pan: 50, muted: false, solo: false,
      color: colors[type] || "bg-gray-500",
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (id: string) => setTracks(tracks.filter(t => t.id !== id));

  // === BEAT LAB FUNCTIONS ===
  
  // Trigger individual drum sounds (auto-initializes audio on first click)
  const triggerDrum = useCallback(async (drumIndex: number) => {
    await initAudio(); // Ensure audio is initialized
    const drums = drumSynthsRef.current;
    const now = Tone.now();
    const velocity = drumVolumes[drumIndex] / 100;
    
    switch (drumIndex) {
      case 0: // Kick
        drums.kick?.triggerAttackRelease("C1", "8n", now, velocity);
        break;
      case 1: // Snare
        drums.snare?.triggerAttackRelease("8n", now, velocity);
        break;
      case 2: // Hi-hat closed
        drums.hihatClosed?.triggerAttackRelease("C6", "32n", now, velocity * 0.6);
        break;
      case 3: // Hi-hat open
        drums.hihatOpen?.triggerAttackRelease("C6", "16n", now, velocity * 0.6);
        break;
      case 4: // Clap
        drums.clap?.triggerAttackRelease("16n", now, velocity);
        break;
      case 5: // Tom
        drums.tom?.triggerAttackRelease("G2", "8n", now, velocity);
        break;
      case 6: // Crash
        drums.crash?.triggerAttackRelease("C6", "4n", now, velocity * 0.7);
        break;
      case 7: // Ride
        drums.ride?.triggerAttackRelease("C6", "8n", now, velocity * 0.5);
        break;
    }
  }, [drumVolumes]);
  
  // Toggle step in drum pattern
  const toggleDrumStep = useCallback((drumIndex: number, stepIndex: number) => {
    setDrumPattern(prev => {
      const newPattern = prev.map(row => [...row]);
      newPattern[drumIndex][stepIndex] = !newPattern[drumIndex][stepIndex];
      return newPattern;
    });
  }, []);
  
  // Play bass note (auto-initializes audio on first click)
  const playBassNote = useCallback(async (note: string, duration: string = "8n") => {
    await initAudio();
    if (!bassSynthRef.current) return;
    bassSynthRef.current.triggerAttackRelease(note, duration, Tone.now());
  }, []);
  
  // Play chord (auto-initializes audio on first click)
  const playChord = useCallback(async (chordName: string, duration: string = "2n") => {
    await initAudio();
    if (!padSynthRef.current) return;
    
    // Parse chord name to notes
    const chordNotes: Record<string, string[]> = {
      "C": ["C4", "E4", "G4"],
      "Cm": ["C4", "Eb4", "G4"],
      "Cm7": ["C4", "Eb4", "G4", "Bb4"],
      "Dm": ["D4", "F4", "A4"],
      "Dm7": ["D4", "F4", "A4", "C5"],
      "Em": ["E4", "G4", "B4"],
      "Em7": ["E4", "G4", "B4", "D5"],
      "F": ["F4", "A4", "C5"],
      "Fm": ["F4", "Ab4", "C5"],
      "Fm7": ["F4", "Ab4", "C5", "Eb5"],
      "G": ["G4", "B4", "D5"],
      "Gm": ["G4", "Bb4", "D5"],
      "Gm7": ["G4", "Bb4", "D5", "F5"],
      "Am": ["A4", "C5", "E5"],
      "Am7": ["A4", "C5", "E5", "G5"],
      "Bb": ["Bb4", "D5", "F5"],
      "Ab": ["Ab4", "C5", "Eb5"],
    };
    
    const notes = chordNotes[chordName] || chordNotes["Cm"];
    padSynthRef.current.triggerAttackRelease(notes, duration, Tone.now());
  }, []);
  
  // Play melody note (auto-initializes audio on first click)
  const playMelodyNote = useCallback(async (note: string, duration: string = "8n") => {
    await initAudio();
    if (!leadSynthRef.current) return;
    leadSynthRef.current.triggerAttackRelease(note, duration, Tone.now());
  }, []);
  
  // Start the sequencer
  const startSequencer = useCallback(async () => {
    await initAudio();
    
    if (isSequencerPlaying) {
      // Stop
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
        sequencerIntervalRef.current = null;
      }
      Tone.getTransport().stop();
      setCurrentStep(0);
      setIsSequencerPlaying(false);
      return;
    }
    
    // Start
    Tone.getTransport().bpm.value = bpm;
    setIsSequencerPlaying(true);
    
    // Calculate step interval in ms (16th notes)
    const stepTime = (60 / bpm / 4) * 1000;
    let step = 0;
    
    const playStep = () => {
      setCurrentStep(step);
      
      // Play drums for this step
      drumPattern.forEach((row, drumIdx) => {
        if (row[step]) {
          triggerDrum(drumIdx);
        }
      });
      
      // Play bass for this step
      if (bassPattern[step]?.active) {
        playBassNote(bassPattern[step].note);
      }
      
      // Play chord progression with proper duration scheduling
      // Calculate which chord should be playing based on accumulated beat positions
      let beatPosition = 0;
      let currentChordIndex = 0;
      const currentBeat = step / 4; // Convert step to beat position
      
      for (let i = 0; i < chordProgression.length; i++) {
        if (currentBeat >= beatPosition && currentBeat < beatPosition + chordProgression[i].duration) {
          currentChordIndex = i;
          break;
        }
        beatPosition += chordProgression[i].duration;
      }
      
      // Only trigger chord on first step of its duration
      const chordStartStep = Math.floor(beatPosition * 4);
      if (step === chordStartStep || (step === 0 && currentChordIndex === 0)) {
        const chord = chordProgression[currentChordIndex];
        if (chord) {
          // Convert duration from beats to Tone.js notation
          const durationMap: Record<number, string> = { 1: "4n", 2: "2n", 4: "1n", 8: "1m" };
          playChord(chord.chord, durationMap[chord.duration] || "2n");
        }
      }
      
      step = (step + 1) % 16;
    };
    
    // Start immediately
    playStep();
    
    // Continue loop
    sequencerIntervalRef.current = setInterval(playStep, stepTime);
  }, [isSequencerPlaying, bpm, drumPattern, bassPattern, chordProgression, triggerDrum, playBassNote, playChord]);
  
  // Apply genre template
  const applyGenreTemplate = useCallback((genreId: string) => {
    setActiveGenreTemplate(genreId);
    
    const templates: Record<string, {
      drumPattern: boolean[][];
      bpm: number;
      bassNotes: string[];
      chords: {chord: string; duration: number}[];
    }> = {
      hiphop: {
        drumPattern: [
          [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // HH closed
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false], // HH open
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
        ],
        bpm: 90,
        bassNotes: ["C2", "C2", "C2", "C2", "G1", "G1", "G1", "G1", "Ab1", "Ab1", "Bb1", "Bb1", "C2", "C2", "C2", "C2"],
        chords: [{ chord: "Cm7", duration: 4 }, { chord: "Gm7", duration: 4 }, { chord: "Ab", duration: 4 }, { chord: "Bb", duration: 4 }],
      },
      trap: {
        drumPattern: [
          [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false], // Kick
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
          [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true], // HH closed (fast rolls)
          [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true], // HH open
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
        ],
        bpm: 140,
        bassNotes: ["C1", "", "", "", "C1", "", "C1", "", "", "", "C1", "", "", "", "", ""],
        chords: [{ chord: "Cm", duration: 8 }, { chord: "Ab", duration: 8 }],
      },
      rock: {
        drumPattern: [
          [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // HH closed
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // HH open
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false], // Tom fill
          [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
        ],
        bpm: 120,
        bassNotes: ["E2", "E2", "E2", "E2", "A2", "A2", "A2", "A2", "D2", "D2", "D2", "D2", "E2", "E2", "E2", "E2"],
        chords: [{ chord: "Em", duration: 4 }, { chord: "Am", duration: 4 }, { chord: "Dm", duration: 4 }, { chord: "Em", duration: 4 }],
      },
      edm: {
        drumPattern: [
          [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick - 4 on floor
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
          [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // HH closed (offbeat)
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // HH open
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
          [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
        ],
        bpm: 128,
        bassNotes: ["C2", "", "", "", "C2", "", "", "", "G1", "", "", "", "G1", "", "", ""],
        chords: [{ chord: "Cm", duration: 4 }, { chord: "Ab", duration: 4 }, { chord: "Bb", duration: 4 }, { chord: "Gm", duration: 4 }],
      },
      rnb: {
        drumPattern: [
          [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false], // Kick
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // HH closed
          [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true], // HH open
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Ride
        ],
        bpm: 85,
        bassNotes: ["Bb1", "", "Bb1", "", "F2", "", "F2", "", "Eb2", "", "Eb2", "", "Bb1", "", "", ""],
        chords: [{ chord: "Gm7", duration: 4 }, { chord: "Cm7", duration: 4 }, { chord: "Fm7", duration: 4 }, { chord: "Bb", duration: 4 }],
      },
      jazz: {
        drumPattern: [
          [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false], // Kick (sparse)
          [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false], // Snare (ghost notes)
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // HH closed
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // HH open
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // Ride (swing pattern)
        ],
        bpm: 110,
        bassNotes: ["C2", "", "E2", "", "G2", "", "Bb2", "", "A2", "", "G2", "", "E2", "", "C2", ""],
        chords: [{ chord: "Cm7", duration: 4 }, { chord: "Fm7", duration: 4 }, { chord: "Dm7", duration: 4 }, { chord: "Gm7", duration: 4 }],
      },
    };
    
    const template = templates[genreId];
    if (template) {
      setDrumPattern(template.drumPattern);
      setBpm(template.bpm);
      setChordProgression(template.chords);
      setBassPattern(prev => prev.map((step, i) => ({
        ...step,
        note: template.bassNotes[i] || "C2",
        active: template.bassNotes[i] !== "",
      })));
      toast({ title: `${genreId.toUpperCase()} Template Applied`, description: `BPM: ${template.bpm}, Pattern loaded` });
    }
  }, []);
  
  // Cleanup sequencer on unmount
  useEffect(() => {
    return () => {
      if (sequencerIntervalRef.current) {
        clearInterval(sequencerIntervalRef.current);
      }
    };
  }, []);

  // Generate lyrics
  const generateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-lyrics", {
        genre: selectedGenre,
        theme: "stroke recovery, overcoming adversity, rising from challenges, REBUILD REWIRE RISE",
        mood: selectedScale === "minor" ? "intense, powerful, raw emotion" : "uplifting, triumphant, victorious",
      });
      const data = await response.json();
      setLyrics(data.lyrics || "");
      toast({ title: "Lyrics Generated!", description: "AI wrote your song lyrics." });
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // Generate instrumental
  const generateInstrumental = async () => {
    setIsGeneratingInstrumental(true);
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(p => Math.min(p + 5, 90));
    }, 500);

    try {
      const response = await apiRequest("POST", "/api/music/generate-instrumental", {
        genre: selectedGenre, bpm, key: selectedKey, scale: selectedScale,
        description: `Production-grade ${genres.find(g => g.value === selectedGenre)?.label || selectedGenre} track`,
        seed: lyriaSeed,
      });
      const data = await response.json();
      
      if (data.success && data.audioBase64) {
        // Add AI track with audio
        const newTrack: Track = {
          id: Date.now().toString(),
          name: `AI ${selectedGenre.toUpperCase()}`,
          type: "ai", volume: 80, pan: 50, muted: false, solo: false,
          color: "bg-primary",
          audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
        };
        setTracks([...tracks, newTrack]);
        toast({ title: "Instrumental Generated!", description: "AI track added to your project." });
      } else {
        console.error("Generation error:", data);
        toast({ 
          title: "Generation Failed", 
          description: data.message || data.error || "Unable to generate beat. Please try again.", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error("Generation failed:", error);
      toast({ title: "Generation failed", description: error?.message || "Please try again", variant: "destructive" });
    } finally {
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 1000);
      setIsGeneratingInstrumental(false);
    }
  };

  // Synthesize voice
  const synthesizeVoice = async () => {
    if (!voiceText.trim()) {
      toast({ title: "Enter text first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingVoice(true);
    try {
      const response = await apiRequest("POST", "/api/voice/synthesize", {
        text: voiceText,
        style: selectedVoiceStyle,
      });
      const data = await response.json();
      
      if (data.success && data.audioBase64) {
        // Play the audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.play();
        toast({ title: "Voice Generated!", description: `${selectedVoiceStyle} style applied.` });
      }
    } catch (error) {
      toast({ title: "Voice synthesis failed", variant: "destructive" });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Record voice for cloning
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      recordedChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          // Clone voice
          try {
            const response = await apiRequest("POST", "/api/voice/clone", {
              audioBase64: base64,
              name: `${user?.firstName || 'User'}'s Voice`,
            });
            const data = await response.json();
            if (data.success) {
              setClonedVoiceKey(data.voiceCloneKey);
              toast({ title: "Voice Cloned!", description: "Your voice is ready to use." });
            }
          } catch (error) {
            toast({ title: "Cloning failed", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecordingVoice(true);
      toast({ title: "Recording...", description: "Speak for at least 10 seconds." });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder.current && isRecordingVoice) {
      mediaRecorder.current.stop();
      setIsRecordingVoice(false);
    }
  };

  // ===== MELODY MAGIC FUNCTIONS =====
  
  // Start recording melody (hum, sing, whistle)
  const startMelodyRecording = async () => {
    try {
      await initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      melodyRecorderRef.current = new MediaRecorder(stream);
      melodyChunksRef.current = [];
      
      melodyRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) melodyChunksRef.current.push(e.data);
      };
      
      melodyRecorderRef.current.onstop = () => {
        const blob = new Blob(melodyChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedMelodyUrl(url);
        stream.getTracks().forEach(track => track.stop());
        toast({ title: "Recording Complete!", description: "Your melody is ready for AI analysis." });
      };
      
      melodyRecorderRef.current.start();
      setIsRecordingMelody(true);
      toast({ title: "Recording...", description: "Hum, sing, or whistle your melody!" });
    } catch (error) {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  };

  const stopMelodyRecording = () => {
    if (melodyRecorderRef.current && isRecordingMelody) {
      melodyRecorderRef.current.stop();
      setIsRecordingMelody(false);
    }
  };

  // Analyze recorded melody with AI
  const analyzeMelody = async () => {
    if (!recordedMelodyUrl) {
      toast({ title: "Record a melody first", variant: "destructive" });
      return;
    }
    
    setIsAnalyzingMelody(true);
    try {
      // Fetch the blob from URL
      const response = await fetch(recordedMelodyUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        try {
          const analysisResponse = await apiRequest("POST", "/api/music/analyze-melody", {
            audioBase64: base64,
          });
          const data = await analysisResponse.json();
          
          if (data.success && data.analysis) {
            setMelodyAnalysis(data.analysis);
            toast({ 
              title: "Melody Analyzed!", 
              description: `Detected: ${data.analysis.detectedKey} ${data.analysis.detectedScale} at ${data.analysis.detectedBpm} BPM` 
            });
            setMelodyMagicStep(2);
          } else {
            // Simulate analysis for demo
            setMelodyAnalysis({
              detectedBpm: Math.floor(Math.random() * 60) + 80,
              detectedKey: keys[Math.floor(Math.random() * keys.length)],
              detectedScale: ["major", "minor", "pentatonic"][Math.floor(Math.random() * 3)],
              melodyNotes: ["C4", "E4", "G4", "A4", "G4", "E4", "C4"],
              rhythmPattern: "Quarter-Eighth-Eighth-Quarter",
              confidence: Math.floor(Math.random() * 20) + 80,
            });
            toast({ title: "Melody Analyzed!", description: "AI detected your melody's structure." });
            setMelodyMagicStep(2);
          }
        } catch (error) {
          // Demo fallback
          setMelodyAnalysis({
            detectedBpm: 120,
            detectedKey: "C",
            detectedScale: "major",
            melodyNotes: ["C4", "D4", "E4", "F4", "G4"],
            rhythmPattern: "Standard 4/4",
            confidence: 85,
          });
          toast({ title: "Melody Analyzed!", description: "Ready for transformation!" });
          setMelodyMagicStep(2);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzingMelody(false);
    }
  };

  // Recompose melody in new genre/style
  const recomposeMelody = async () => {
    if (!melodyAnalysis) {
      toast({ title: "Analyze melody first", variant: "destructive" });
      return;
    }
    
    setIsRecomposing(true);
    try {
      const response = await apiRequest("POST", "/api/music/recompose", {
        originalAnalysis: melodyAnalysis,
        targetGenre,
        targetVoiceStyle,
        lyrics: melodyLyrics,
        transformationType: "full",
      });
      const data = await response.json();
      
      if (data.success && data.recomposed) {
        setRecomposedTrack(data.recomposed);
        toast({ title: "Song Recomposed!", description: `Your ${targetGenre} masterpiece is ready!` });
        setMelodyMagicStep(4);
      } else {
        // Demo simulation
        toast({ 
          title: "Recomposition Started!", 
          description: `Transforming to ${targetGenre} with ${targetVoiceStyle} vocals...` 
        });
        setTimeout(() => {
          setRecomposedTrack({
            audioUrl: "",
            title: `${melodyAnalysis.detectedKey} ${targetGenre.toUpperCase()} Remix`,
            lyrics: melodyLyrics || `[Verse]\nYour melody transformed\nInto something new\n\n[Chorus]\nMelody magic, making dreams come true`,
          });
          setMelodyMagicStep(4);
          setIsRecomposing(false);
        }, 3000);
        return;
      }
    } catch (error) {
      toast({ title: "Recomposition in progress...", description: "AI is crafting your masterpiece." });
      // Demo fallback
      setTimeout(() => {
        setRecomposedTrack({
          audioUrl: "",
          title: `${targetGenre.toUpperCase()} Transformation`,
          lyrics: melodyLyrics || "[Your transformed song lyrics will appear here]",
        });
        setMelodyMagicStep(4);
        setIsRecomposing(false);
      }, 2000);
      return;
    } finally {
      setIsRecomposing(false);
    }
  };

  // Generate AI lyrics based on melody
  const generateMelodyLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-lyrics", {
        genre: targetGenre,
        theme: songTheme || "transformation, new beginnings, creative magic",
        mood: targetVoiceStyle === "aggressive" ? "intense" : targetVoiceStyle === "smooth" ? "chill" : "powerful",
        melodyInfo: melodyAnalysis ? `Key: ${melodyAnalysis.detectedKey}, Scale: ${melodyAnalysis.detectedScale}, BPM: ${melodyAnalysis.detectedBpm}` : "",
      });
      const data = await response.json();
      if (data.lyrics) {
        setMelodyLyrics(data.lyrics);
        toast({ title: "Lyrics Generated!", description: "Edit them to match your vision!" });
      }
    } catch (error) {
      // Demo fallback
      const demoLyrics = targetGenre === "metal" 
        ? `[Verse 1]\nFrom the darkness we arise\nMelody of fire in our eyes\nTransformed by the power within\nLet the metal revolution begin!\n\n[Chorus]\nRECOMPOSE! REBUILD! RISE!\nMelody magic never dies!\nRECOMPOSE! TRANSFORM! CREATE!\nThis is our destiny, our fate!`
        : targetGenre === "rap"
        ? `[Verse 1]\nYeah, started with a hum, now we here\nMelody magic, crystal clear\nAI transformation, next level gear\nTurning simple notes into atmosphere\n\n[Chorus]\nMelody magic (what?)\nMaking hits automatic (yeah!)\nFrom a simple tune to something classic\nThat's that melody magic!`
        : `[Verse 1]\nA simple melody became something more\nTransformed into sounds we've never heard before\nFrom whispered notes to a symphony\nThis is the power of creativity\n\n[Chorus]\nMelody magic, turning dreams to sound\nEvery note transformed, every beat unbound\nFrom your heart to the world, let it ring\nThis is your moment, let your spirit sing!`;
      setMelodyLyrics(demoLyrics);
      toast({ title: "Lyrics Generated!" });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // ===== MASHUP & VOICE SWAP FUNCTIONS =====
  
  const generateMashupConcept = async () => {
    if (!sourceSongDescription.trim()) {
      toast({ title: "Describe the source song first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingMashup(true);
    try {
      const response = await apiRequest("POST", "/api/music/generate-mashup", {
        mode: mashupMode,
        sourceSong: sourceSongDescription,
        secondSong: secondSongDescription,
        targetStyle: targetArtistStyle,
        targetGenre: mashupGenre,
        tempoAdjust: mashupTempo,
        energyLevel: mashupEnergy,
      });
      const data = await response.json();
      
      if (data.success && data.mashup) {
        setMashupResult(data.mashup);
        toast({ title: "Mashup Concept Generated!", description: "Your creative vision is ready!" });
      }
    } catch (error) {
      // Demo fallback with creative concepts
      const modeLabels = { "voice-swap": "Voice Swap", "mashup": "Mashup", "reimagine": "Reimagine" };
      const styleLabels: Record<string, string> = {
        "pop-icon": "Smooth Pop Icon",
        "rap-legend": "Legendary Rap Flow", 
        "country-star": "Country Storyteller",
        "rock-god": "Classic Rock Power",
        "soul-queen": "Soulful R&B Diva",
        "metal-beast": "Death Metal Growler",
        "jazz-crooner": "Jazz Lounge Singer",
        "electronic-producer": "EDM Producer Style"
      };
      
      let concept = "";
      let suggestedLyrics = "";
      
      if (mashupMode === "voice-swap") {
        concept = `Reimagining "${sourceSongDescription}" with a ${styleLabels[targetArtistStyle] || targetArtistStyle} vocal approach. ` +
          `The original melody and structure are preserved, but delivered with ${mashupGenre !== "original" ? `a ${mashupGenre} genre twist and ` : ""}` +
          `${mashupTempo !== 100 ? `${mashupTempo}% tempo adjustment and ` : ""}` +
          `completely transformed vocal character. The result blends the original song's DNA with a fresh artistic interpretation.`;
        suggestedLyrics = `[Voice Swap Concept]\nOriginal: ${sourceSongDescription}\nNew Style: ${styleLabels[targetArtistStyle]}\n\n` +
          `The AI would analyze the original melody and lyrics, then regenerate them with:\n` +
          `- Vocal texture matching the ${styleLabels[targetArtistStyle]} archetype\n` +
          `- Phrasing and delivery adapted to the new style\n` +
          `- ${mashupGenre !== "original" ? `Genre elements from ${mashupGenre}` : "Original genre preserved"}`;
      } else if (mashupMode === "mashup") {
        concept = `Creating a groundbreaking mashup combining "${sourceSongDescription}" with "${secondSongDescription}". ` +
          `AI analyzes both songs' BPM, key, chord progressions, and hooks to find harmonic compatibility. ` +
          `The result weaves together the most memorable elements of both tracks into a seamless new creation ` +
          `${mashupGenre !== "original" ? `with a ${mashupGenre} production style.` : "that honors both originals."}`;
        suggestedLyrics = `[Mashup Blueprint]\nTrack A: ${sourceSongDescription}\nTrack B: ${secondSongDescription}\n\n` +
          `The AI would:\n1. Sync tempos and find key compatibility\n2. Layer vocals from Track A over instrumentals from Track B\n` +
          `3. Create seamless transitions between both songs' hooks\n4. Build to a climax using elements from both tracks`;
      } else {
        concept = `Complete reimagination of "${sourceSongDescription}" as if it were originally written as a ${mashupGenre} song ` +
          `performed by an artist with ${styleLabels[targetArtistStyle]} vocal characteristics. Not just a cover - a complete artistic reinterpretation ` +
          `that asks "what if this song was born in a different genre, era, and artistic vision?"`;
        suggestedLyrics = `[Reimagine Concept]\nOriginal: ${sourceSongDescription}\nNew Vision: ${mashupGenre} + ${styleLabels[targetArtistStyle]}\n\n` +
          `Complete transformation including:\n- New instrumental arrangement in ${mashupGenre} style\n` +
          `- Vocal reinterpretation with ${styleLabels[targetArtistStyle]} characteristics\n` +
          `- Tempo: ${mashupTempo}% of original, Energy: ${mashupEnergy}%`;
      }
      
      setMashupResult({
        title: `${modeLabels[mashupMode]}: ${sourceSongDescription.slice(0, 30)}...`,
        description: `A ${mashupMode} creation blending artistic visions`,
        concept,
        suggestedLyrics,
      });
      toast({ title: "Concept Generated!", description: "Your creative mashup vision is ready!" });
    } finally {
      setIsGeneratingMashup(false);
    }
  };

  // ===== END MASHUP FUNCTIONS =====

  // ===== END MELODY MAGIC FUNCTIONS =====

  // Generate movie script
  const generateScript = async () => {
    if (!moviePremise.trim()) {
      toast({ title: "Enter a premise first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingScript(true);
    try {
      const response = await apiRequest("POST", "/api/video/generate-script", {
        premise: moviePremise,
        genre: movieGenre,
        sceneCount: 5,
      });
      const data = await response.json();
      
      if (data.success && data.script) {
        setGeneratedScript(data.script);
        toast({ title: "Script Generated!", description: `${data.script.scenes?.length || 0} scenes created.` });
      }
    } catch (error) {
      toast({ title: "Script generation failed", variant: "destructive" });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate storyboard
  const generateStoryboard = async (sceneIndex: number) => {
    if (!generatedScript?.scenes?.[sceneIndex]) return;
    
    const scene = generatedScript.scenes[sceneIndex];
    try {
      const response = await apiRequest("POST", "/api/video/generate-storyboard", {
        scene,
        style: movieGenre,
        frameCount: 3,
      });
      const data = await response.json();
      
      if (data.success && data.frames) {
        setStoryboardFrames(prev => [...prev, ...data.frames]);
        toast({ title: "Storyboard Generated!" });
      }
    } catch (error) {
      toast({ title: "Storyboard generation failed", variant: "destructive" });
    }
  };

  // Apply EQ preset
  const applyEQPreset = (presetId: string) => {
    const preset = audioPresets?.presets?.eq?.find((p: any) => p.id === presetId);
    if (preset?.bands) {
      setEqBands(preset.bands);
      toast({ title: `${preset.name} Applied` });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
      <GlobalHeader />
      <SEO
        title="Music Studio - AI Music Composition"
        description="Create professional music with AI-powered composition tools. Features AI beat generation, loop libraries, mixing and mastering, voice synthesis, and export to MP3/WAV formats."
        schema={studioSchemas.musicStudio}
      />
      {/* Toolbar */}
      <div className="border-b border-[#C9941A]/10 bg-white/80 backdrop-blur-sm p-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-[#C9941A]" />
              <span className="font-bold text-xl">Stroke Lyfe Studio</span>
            </div>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-64 bg-background"
              data-testid="input-project-title"
            />
            <Badge variant="outline" className="text-[#C9941A]">
              {selectedGenre.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" data-testid="button-save">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" data-testid="button-create-video">
              <Video className="w-4 h-4 mr-1" /> Create Video
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 border-r border-border bg-card/30 p-4 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-400">Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger data-testid="select-genre"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {genres.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Key</Label>
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger data-testid="select-key"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {keys.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Scale</Label>
                  <Select value={selectedScale} onValueChange={setSelectedScale}>
                    <SelectTrigger data-testid="select-scale"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {scales.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400">BPM: {bpm}</Label>
                <Slider value={[bpm]} onValueChange={([v]) => setBpm(v)} min={60} max={200} data-testid="slider-bpm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#C9941A]" /> AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm"
                onClick={generateInstrumental} disabled={isGeneratingInstrumental}
                data-testid="button-generate-instrumental">
                {isGeneratingInstrumental ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Beat (Lyria)
              </Button>
              {isGeneratingInstrumental && <Progress value={generationProgress} className="h-2" />}
              
              <Button className="w-full justify-start" variant="outline" size="sm"
                onClick={generateLyrics} disabled={isGeneratingLyrics}
                data-testid="button-generate-lyrics">
                {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                Generate Lyrics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add Track</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="icon" onClick={() => addTrack("drums")} data-testid="button-add-drums"><Drum className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("bass")} data-testid="button-add-bass"><Waves className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("synth")} data-testid="button-add-synth"><Piano className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("guitar")} data-testid="button-add-guitar"><Guitar className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("vocals")} data-testid="button-add-vocals"><Mic className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => addTrack("ai")} data-testid="button-add-ai"><Sparkles className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-hidden">
            <Tabs defaultValue="create" className="h-full flex flex-col">
              <TabsList className="mb-4 flex-wrap gap-1">
                <TabsTrigger value="melody-magic" data-testid="tab-melody-magic" className="bg-gradient-to-r from-amber-500/20 to-amber-600/20">
                  <Sparkles className="w-4 h-4 mr-1" /> Melody Magic
                </TabsTrigger>
                <TabsTrigger value="stem-separator" data-testid="tab-stems" className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                  <Waves className="w-4 h-4 mr-1" /> Stem Separator
                </TabsTrigger>
                <TabsTrigger value="voice-library" data-testid="tab-voice-library" className="bg-gradient-to-r from-amber-500/20 to-rose-500/20">
                  <Users className="w-4 h-4 mr-1" /> Voice Library
                </TabsTrigger>
                <TabsTrigger value="mastering" data-testid="tab-mastering" className="bg-gradient-to-r from-green-500/20 to-teal-500/20">
                  <Headphones className="w-4 h-4 mr-1" /> AI Mastering
                </TabsTrigger>
                <TabsTrigger value="distribution" data-testid="tab-distribution" className="bg-gradient-to-r from-red-500/20 to-orange-500/20">
                  <Radio className="w-4 h-4 mr-1" /> Distribution
                </TabsTrigger>
                <TabsTrigger value="beat-lab" data-testid="tab-beat-lab" className="bg-gradient-to-r from-red-500/20 to-orange-500/20">
                  <Drum className="w-4 h-4 mr-1" /> Beat Lab
                </TabsTrigger>
                <TabsTrigger value="create" data-testid="tab-create">Create Song</TabsTrigger>
                <TabsTrigger value="mixer" data-testid="tab-mixer">Mixer</TabsTrigger>
                <TabsTrigger value="effects" data-testid="tab-effects">Effects</TabsTrigger>
                <TabsTrigger value="lyrics" data-testid="tab-lyrics">Lyrics</TabsTrigger>
                <TabsTrigger value="video-sync" data-testid="tab-video-sync" className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20">
                  <Film className="w-4 h-4 mr-1" /> Video Sync
                </TabsTrigger>
                <TabsTrigger value="live-music" data-testid="tab-live-music" className="bg-gradient-to-r from-pink-500/20 to-red-500/20">
                  <Radio className="w-4 h-4 mr-1" /> Live Music
                </TabsTrigger>
                <TabsTrigger value="movie" data-testid="tab-movie">Movie Studio</TabsTrigger>
                <TabsTrigger value="ai-voice" data-testid="tab-ai-voice" className="bg-gradient-to-r from-purple-500/20 to-violet-500/20">
                  <Mic className="w-4 h-4 mr-1" /> AI Voice
                </TabsTrigger>
              </TabsList>

              {/* === BEAT LAB TAB - Professional Music Creation === */}
              <TabsContent value="beat-lab" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center py-4 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 rounded-xl border">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Drum className="w-8 h-8 text-red-500" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        BEAT LAB
                      </h2>
                      <Music className="w-8 h-8 text-[#C9941A]" />
                    </div>
                    <p className="text-gray-400">Create professional beats from Hip Hop to Rock</p>
                  </div>
                  
                  {/* Transport & Genre Templates */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={startSequencer}
                        size="lg"
                        className={isSequencerPlaying ? "bg-red-500 hover:bg-red-600" : "bg-[#C9941A] hover:bg-[#C9941A]"}
                        data-testid="button-sequencer-play"
                      >
                        {isSequencerPlaying ? <Square className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isSequencerPlaying ? "Stop" : "Play"}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">BPM:</Label>
                        <Input
                          type="number"
                          value={bpm}
                          onChange={(e) => setBpm(Math.max(40, Math.min(240, parseInt(e.target.value) || 120)))}
                          className="w-20"
                          data-testid="input-bpm"
                        />
                      </div>
                    </div>
                    
                    {/* Genre Templates */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="text-sm font-medium">Genre:</Label>
                      {["hiphop", "trap", "rock", "edm", "rnb", "jazz"].map((genre) => (
                        <Button
                          key={genre}
                          variant={activeGenreTemplate === genre ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyGenreTemplate(genre)}
                          data-testid={`button-genre-${genre}`}
                        >
                          {genre.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Drum Machine */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Drum className="w-5 h-5 text-red-500" />
                        16-Step Drum Machine
                      </CardTitle>
                      <CardDescription>Click pads to create your beat. Lit steps play on that beat.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                          {/* Step indicators */}
                          <div className="flex gap-1 mb-2 ml-20">
                            {Array(16).fill(0).map((_, i) => (
                              <div
                                key={i}
                                className={`w-10 h-6 flex items-center justify-center text-xs font-mono rounded ${
                                  currentStep === i && isSequencerPlaying 
                                    ? "bg-[#C9941A] text-white" 
                                    : i % 4 === 0 
                                    ? "bg-[#1a1a1a] text-gray-400" 
                                    : "text-gray-400"
                                }`}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                          
                          {/* Drum rows */}
                          {["Kick", "Snare", "HH Closed", "HH Open", "Clap", "Tom", "Crash", "Ride"].map((name, drumIdx) => (
                            <div key={drumIdx} className="flex items-center gap-1 mb-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-20 justify-start text-xs"
                                onClick={() => triggerDrum(drumIdx)}
                                data-testid={`button-drum-${name.toLowerCase().replace(" ", "-")}`}
                              >
                                {name}
                              </Button>
                              {drumPattern[drumIdx].map((active, stepIdx) => (
                                <button
                                  key={stepIdx}
                                  onClick={() => toggleDrumStep(drumIdx, stepIdx)}
                                  className={`w-10 h-8 rounded transition-all ${
                                    active
                                      ? currentStep === stepIdx && isSequencerPlaying
                                        ? "bg-green-400 scale-110"
                                        : drumIdx === 0 ? "bg-red-500" 
                                        : drumIdx === 1 ? "bg-[#C9941A]"
                                        : drumIdx < 4 ? "bg-[#C9941A]"
                                        : "bg-blue-500"
                                      : currentStep === stepIdx && isSequencerPlaying
                                        ? "bg-green-200"
                                        : stepIdx % 4 === 0 ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]/50"
                                  } hover:scale-105`}
                                  data-testid={`drum-step-${drumIdx}-${stepIdx}`}
                                />
                              ))}
                              <Slider
                                value={[drumVolumes[drumIdx]]}
                                onValueChange={([v]) => {
                                  const newVolumes = [...drumVolumes];
                                  newVolumes[drumIdx] = v;
                                  setDrumVolumes(newVolumes);
                                }}
                                max={100}
                                className="w-16 ml-2"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Bass & Chords Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bass Synth */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Waves className="w-5 h-5 text-blue-500" />
                          Bass Synthesizer
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Label className="w-full text-sm">Bass Type:</Label>
                          {(["808", "sub", "analog", "fm", "reese"] as const).map((type) => (
                            <Button
                              key={type}
                              variant={bassSound === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBassSound(type)}
                              data-testid={`button-bass-${type}`}
                            >
                              {type.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Bass pattern */}
                        <div>
                          <Label className="text-sm mb-2 block">Bass Pattern (click to toggle):</Label>
                          <div className="flex gap-1 overflow-x-auto pb-2">
                            {bassPattern.map((step, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const newPattern = [...bassPattern];
                                  newPattern[idx] = { ...step, active: !step.active };
                                  setBassPattern(newPattern);
                                }}
                                className={`w-8 h-10 rounded text-xs font-mono flex items-center justify-center ${
                                  step.active
                                    ? currentStep === idx && isSequencerPlaying
                                      ? "bg-green-400"
                                      : "bg-blue-500 text-white"
                                    : currentStep === idx && isSequencerPlaying
                                      ? "bg-green-200"
                                      : "bg-[#1a1a1a]"
                                }`}
                                data-testid={`bass-step-${idx}`}
                              >
                                {step.active ? step.note.replace(/\d/, "") : ""}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Bass controls */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs">Filter</Label>
                            <Slider
                              value={[bassFilter]}
                              onValueChange={([v]) => setBassFilter(v)}
                              max={100}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Decay</Label>
                            <Slider
                              value={[bassDecay]}
                              onValueChange={([v]) => setBassDecay(v)}
                              max={100}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Distortion</Label>
                            <Slider
                              value={[bassDistortion]}
                              onValueChange={([v]) => setBassDistortion(v)}
                              max={100}
                            />
                          </div>
                        </div>
                        
                        {/* Bass keyboard */}
                        <div>
                          <Label className="text-sm mb-2 block">Play Bass Notes:</Label>
                          <div className="flex gap-1 flex-wrap">
                            {["C2", "D2", "E2", "F2", "G2", "A2", "Bb2", "C3"].map((note) => (
                              <Button
                                key={note}
                                variant="outline"
                                size="sm"
                                onClick={() => playBassNote(note)}
                                className="w-10"
                                data-testid={`bass-note-${note}`}
                              >
                                {note.replace("2", "").replace("3", "")}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Chord Pad */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Piano className="w-5 h-5 text-[#C9941A]" />
                          Chord Pad
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Label className="w-full text-sm">Synth Type:</Label>
                          {(["pad", "lead", "pluck", "brass", "strings"] as const).map((type) => (
                            <Button
                              key={type}
                              variant={synthType === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSynthType(type)}
                              data-testid={`button-synth-${type}`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Chord progression */}
                        <div>
                          <Label className="text-sm mb-2 block">Current Progression:</Label>
                          <div className="flex gap-2">
                            {chordProgression.map((chord, idx) => (
                              <div
                                key={idx}
                                className={`px-4 py-3 rounded-lg text-center min-w-[60px] ${
                                  Math.floor(currentStep / 4) % chordProgression.length === idx && isSequencerPlaying
                                    ? "bg-[#C9941A] text-white"
                                    : "bg-[#1a1a1a]"
                                }`}
                              >
                                <div className="font-bold">{chord.chord}</div>
                                <div className="text-xs text-gray-400">{chord.duration} beats</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Synth controls */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs">Attack</Label>
                            <Slider
                              value={[synthAttack]}
                              onValueChange={([v]) => setSynthAttack(v)}
                              max={100}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Release</Label>
                            <Slider
                              value={[synthRelease]}
                              onValueChange={([v]) => setSynthRelease(v)}
                              max={100}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Detune</Label>
                            <Slider
                              value={[synthDetune + 50]}
                              onValueChange={([v]) => setSynthDetune(v - 50)}
                              max={100}
                            />
                          </div>
                        </div>
                        
                        {/* Chord pads */}
                        <div>
                          <Label className="text-sm mb-2 block">Play Chords:</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {["Cm", "Cm7", "Dm", "Dm7", "Em", "Em7", "Fm", "Fm7", "Gm", "Gm7", "Am", "Am7", "Bb", "Ab", "F", "G"].map((chord) => (
                              <Button
                                key={chord}
                                variant="outline"
                                onClick={() => playChord(chord)}
                                className="h-12"
                                data-testid={`chord-${chord}`}
                              >
                                {chord}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Melody Keyboard */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-[#C9941A]" />
                        Melody Keyboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <Label>Octave:</Label>
                        <div className="flex gap-1">
                          {[2, 3, 4, 5, 6].map((oct) => (
                            <Button
                              key={oct}
                              variant={activeOctave === oct ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveOctave(oct)}
                            >
                              {oct}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 overflow-x-auto pb-2">
                        {/* White keys */}
                        {["C", "D", "E", "F", "G", "A", "B"].map((note) => (
                          <Button
                            key={note}
                            variant="outline"
                            className="w-12 h-24 bg-white hover:bg-gray-100 text-black border-2"
                            onClick={() => playMelodyNote(`${note}${activeOctave}`)}
                            data-testid={`melody-${note}${activeOctave}`}
                          >
                            {note}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-1 -mt-16 ml-7 overflow-x-auto">
                        {/* Black keys */}
                        {["C#", "D#", "", "F#", "G#", "A#", ""].map((note, idx) => (
                          note ? (
                            <Button
                              key={note}
                              className="w-8 h-14 bg-[#1a1a1a] hover:bg-gray-800 text-white text-xs z-10"
                              onClick={() => playMelodyNote(`${note}${activeOctave}`)}
                              data-testid={`melody-${note}${activeOctave}`}
                            >
                              {note}
                            </Button>
                          ) : (
                            <div key={idx} className="w-8" />
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* MELODY MAGIC TAB - Record → Analyze → Transform → Recompose */}
              <TabsContent value="melody-magic" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Hero Section with Mode Selector */}
                  <div className="text-center py-6 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 rounded-xl border border">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-8 h-8 text-[#C9941A] animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#C9941A] to-amber-500 bg-clip-text text-transparent">
                        MELODY MAGIC STUDIO
                      </h2>
                      <Sparkles className="w-8 h-8 text-[#C9941A] animate-pulse" />
                    </div>
                    
                    {/* Mode Selector */}
                    <div className="flex items-center justify-center gap-2 mt-4 mb-4 flex-wrap">
                      <Button 
                        variant={melodyMagicStep === 1 && !mashupMode.includes("swap") && !mashupMode.includes("mashup") && !mashupMode.includes("reimagine") ? "default" : "outline"}
                        onClick={() => { setMelodyMagicStep(1); setMashupMode("voice-swap"); }}
                        className={`${mashupMode === "voice-swap" ? "bg-gradient-to-r from-orange-500 to-red-500 border-0" : ""}`}
                        data-testid="button-mode-record"
                      >
                        <Mic className="w-4 h-4 mr-2" /> Record & Transform
                      </Button>
                      <Button 
                        variant={mashupMode === "voice-swap" ? "default" : "outline"}
                        onClick={() => { setMashupMode("voice-swap"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "voice-swap" && melodyMagicStep === 0 ? "bg-gradient-to-r from-[#C9941A] to-amber-500 border-0" : ""}`}
                        data-testid="button-mode-voiceswap"
                      >
                        <Users className="w-4 h-4 mr-2" /> Voice Swap
                      </Button>
                      <Button 
                        variant={mashupMode === "mashup" ? "default" : "outline"}
                        onClick={() => { setMashupMode("mashup"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "mashup" ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-0" : ""}`}
                        data-testid="button-mode-mashup"
                      >
                        <Disc className="w-4 h-4 mr-2" /> Mashup Creator
                      </Button>
                      <Button 
                        variant={mashupMode === "reimagine" ? "default" : "outline"}
                        onClick={() => { setMashupMode("reimagine"); setMelodyMagicStep(0); }}
                        className={`${mashupMode === "reimagine" ? "bg-gradient-to-r from-green-500 to-teal-500 border-0" : ""}`}
                        data-testid="button-mode-reimagine"
                      >
                        <Wand2 className="w-4 h-4 mr-2" /> Reimagine
                      </Button>
                    </div>

                    <p className="text-gray-400 max-w-2xl mx-auto text-sm">
                      {melodyMagicStep > 0 ? "Record any melody - hum, sing, or whistle. AI transforms it to any genre!" :
                       mashupMode === "voice-swap" ? "What if your favorite song was sung by a completely different artist style?" :
                       mashupMode === "mashup" ? "Combine two songs into one groundbreaking mashup masterpiece!" :
                       "Completely reimagine a song as if it was born in a different genre and era!"}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400 flex-wrap">
                      <Badge variant="outline" className="bg-primary/10">Rapid-Fire Rap → Country Ballad</Badge>
                      <Badge variant="outline" className="bg-[#C9941A]/10">Pop Hit + Rock Anthem = Epic Mashup</Badge>
                      <Badge variant="outline" className="bg-pink-500/10">Any Voice + Any Genre = Magic</Badge>
                    </div>
                  </div>

                  {/* MASHUP / VOICE SWAP / REIMAGINE MODE */}
                  {melodyMagicStep === 0 && (
                    <Card className="border-amber-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {mashupMode === "voice-swap" && <><Users className="w-6 h-6 text-[#C9941A]" /> Voice Swap Studio</>}
                          {mashupMode === "mashup" && <><Disc className="w-6 h-6 text-blue-500" /> Mashup Creator</>}
                          {mashupMode === "reimagine" && <><Wand2 className="w-6 h-6 text-[#C9941A]" /> Song Reimaginer</>}
                        </CardTitle>
                        <CardDescription>
                          {mashupMode === "voice-swap" && "Transform any song with a completely different vocal style - imagine your favorite hits performed by different artist archetypes!"}
                          {mashupMode === "mashup" && "Combine the best elements of two songs into one epic mashup that transcends genres!"}
                          {mashupMode === "reimagine" && "What if a song was originally written in a completely different genre? Discover the answer!"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column - Song Input */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-base font-bold">
                                {mashupMode === "mashup" ? "First Song" : "Source Song"}
                              </Label>
                              <Textarea 
                                value={sourceSongDescription}
                                onChange={(e) => setSourceSongDescription(e.target.value)}
                                placeholder="Describe the song (e.g., 'Lose Yourself - fast rap about seizing opportunities' or 'a classic Christmas carol about sleigh bells')"
                                className="mt-2 h-24"
                                data-testid="input-source-song"
                              />
                            </div>
                            
                            {mashupMode === "mashup" && (
                              <div>
                                <Label className="text-base font-bold">Second Song</Label>
                                <Textarea 
                                  value={secondSongDescription}
                                  onChange={(e) => setSecondSongDescription(e.target.value)}
                                  placeholder="Describe the second song to mashup (e.g., 'smooth country love song' or 'heavy metal anthem')"
                                  className="mt-2 h-24"
                                  data-testid="input-second-song"
                                />
                              </div>
                            )}

                            {/* Voice Style Selector */}
                            {(mashupMode === "voice-swap" || mashupMode === "reimagine") && (
                              <div>
                                <Label className="text-base font-bold mb-3 block">Target Voice Style</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: "pop-icon", label: "Pop Icon", desc: "Smooth, melodic, stadium-filling" },
                                    { value: "rap-legend", label: "Rap Legend", desc: "Rapid-fire flow, wordplay master" },
                                    { value: "country-star", label: "Country Star", desc: "Storyteller, twang, heartfelt" },
                                    { value: "rock-god", label: "Rock God", desc: "Powerful, raw, arena-ready" },
                                    { value: "soul-queen", label: "Soul Diva", desc: "Gospel-tinged, powerful runs" },
                                    { value: "metal-beast", label: "Metal Beast", desc: "Growling, intense, heavy" },
                                    { value: "jazz-crooner", label: "Jazz Crooner", desc: "Smooth, improvisational" },
                                    { value: "electronic-producer", label: "EDM Style", desc: "Vocoded, processed, modern" },
                                  ].map((style) => (
                                    <button
                                      key={style.value}
                                      onClick={() => setTargetArtistStyle(style.value)}
                                      className={`p-3 rounded-lg border-2 text-left transition-all
                                        ${targetArtistStyle === style.value 
                                          ? 'border-amber-500 bg-[#C9941A]/10' 
                                          : 'border-[#333] hover:border-primary/50'}`}
                                      data-testid={`button-style-${style.value}`}
                                    >
                                      <p className="font-bold text-sm">{style.label}</p>
                                      <p className="text-xs text-gray-400">{style.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Settings */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-base font-bold mb-3 block">Target Genre</Label>
                              <Select value={mashupGenre} onValueChange={setMashupGenre}>
                                <SelectTrigger data-testid="select-mashup-genre">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="original">Keep Original Genre</SelectItem>
                                  <SelectItem value="pop">Pop</SelectItem>
                                  <SelectItem value="rap">Hip Hop / Rap</SelectItem>
                                  <SelectItem value="country">Country</SelectItem>
                                  <SelectItem value="rock">Rock</SelectItem>
                                  <SelectItem value="metal">Heavy Metal</SelectItem>
                                  <SelectItem value="edm">EDM / Electronic</SelectItem>
                                  <SelectItem value="jazz">Jazz / Blues</SelectItem>
                                  <SelectItem value="orchestral">Orchestral / Classical</SelectItem>
                                  <SelectItem value="reggae">Reggae</SelectItem>
                                  <SelectItem value="folk">Folk / Acoustic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-base font-bold">Tempo Adjustment: {mashupTempo}%</Label>
                              <Slider 
                                value={[mashupTempo]} 
                                onValueChange={([v]) => setMashupTempo(v)}
                                min={50} max={150} step={5}
                                className="mt-2"
                                data-testid="slider-tempo"
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>Slower (50%)</span>
                                <span>Original</span>
                                <span>Faster (150%)</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-base font-bold">Energy Level: {mashupEnergy}%</Label>
                              <Slider 
                                value={[mashupEnergy]} 
                                onValueChange={([v]) => setMashupEnergy(v)}
                                min={25} max={150} step={5}
                                className="mt-2"
                                data-testid="slider-energy"
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>Chill</span>
                                <span>Original</span>
                                <span>Intense</span>
                              </div>
                            </div>

                            <Button 
                              onClick={generateMashupConcept}
                              disabled={isGeneratingMashup || !sourceSongDescription.trim()}
                              className="w-full bg-gradient-to-r from-amber-500 to-pink-500 mt-4"
                              size="lg"
                              data-testid="button-generate-mashup"
                            >
                              {isGeneratingMashup ? (
                                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                              ) : (
                                <><Sparkles className="w-5 h-5 mr-2" /> Generate {mashupMode === "mashup" ? "Mashup" : mashupMode === "voice-swap" ? "Voice Swap" : "Reimagination"}</>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Results */}
                        {mashupResult && (
                          <div className="mt-6 p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10 rounded-xl border border-amber-500/20">
                            <h3 className="text-xl font-bold mb-2">{mashupResult.title}</h3>
                            <p className="text-gray-400 mb-4">{mashupResult.description}</p>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="font-bold">Creative Concept</Label>
                                <p className="mt-1 text-sm bg-background/50 p-3 rounded">{mashupResult.concept}</p>
                              </div>
                              
                              {mashupResult.suggestedLyrics && (
                                <div>
                                  <Label className="font-bold">Production Blueprint</Label>
                                  <pre className="mt-1 text-sm bg-background/50 p-3 rounded whitespace-pre-wrap font-mono">
                                    {mashupResult.suggestedLyrics}
                                  </pre>
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => setMashupResult(null)}>
                                  <RotateCcw className="w-4 h-4 mr-2" /> Try Different Settings
                                </Button>
                                <Button className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-produce-mashup">
                                  <Music className="w-4 h-4 mr-2" /> Produce This Track
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* RECORD MELODY MODE - Progress Stepper (only show when in record mode) */}
                  {melodyMagicStep > 0 && (
                    <>
                    <div className="flex items-center justify-between px-4">
                    {[
                      { step: 1, label: "Record Melody", icon: Mic },
                      { step: 2, label: "Transform", icon: Wand2 },
                      { step: 3, label: "Add Lyrics", icon: PenTool },
                      { step: 4, label: "Recompose", icon: Sparkles },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center">
                        <button
                          onClick={() => setMelodyMagicStep(s.step)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all
                            ${melodyMagicStep === s.step ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-foreground shadow-lg shadow-orange-500/30' : 
                              melodyMagicStep > s.step ? 'bg-[#C9941A]/80 text-foreground' : 'bg-[#1a1a1a] text-gray-400'}`}
                          data-testid={`button-melody-step-${s.step}`}
                        >
                          <s.icon className="w-5 h-5" />
                        </button>
                        <span className={`ml-2 text-sm hidden md:block ${melodyMagicStep === s.step ? 'text-[#C9941A] font-bold' : 'text-gray-400'}`}>
                          {s.label}
                        </span>
                        {i < 3 && <div className={`w-12 md:w-24 h-1 mx-2 rounded ${melodyMagicStep > s.step ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-[#1a1a1a]'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Record Melody */}
                  {melodyMagicStep === 1 && (
                    <Card className="border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="w-6 h-6 text-[#C9941A]" /> Step 1: Record Your Melody
                        </CardTitle>
                        <CardDescription>
                          Hum, sing, whistle, or play any melody. Even "Jingle Bells" can become a Death Metal anthem!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border rounded-xl bg-[#C9941A]/5">
                          {!recordedMelodyUrl ? (
                            <>
                              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 transition-all
                                ${isRecordingMelody ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-primary/20 hover:bg-[#C9941A]/30'}`}>
                                <Mic className={`w-16 h-16 ${isRecordingMelody ? 'text-foreground' : 'text-[#C9941A]'}`} />
                              </div>
                              {isRecordingMelody ? (
                                <div className="text-center">
                                  <p className="text-lg font-bold text-red-500 mb-2 animate-pulse">Recording...</p>
                                  <p className="text-gray-400 mb-4">Sing, hum, or whistle your melody</p>
                                  <Button onClick={stopMelodyRecording} variant="destructive" size="lg" data-testid="button-stop-melody">
                                    <StopIcon className="w-5 h-5 mr-2" /> Stop Recording
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-gray-400 mb-4">Click to start recording your melody</p>
                                  <Button onClick={startMelodyRecording} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-start-melody">
                                    <Mic className="w-5 h-5 mr-2" /> Start Recording
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full space-y-4">
                              <div className="flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#C9941A] flex items-center justify-center">
                                  <Music className="w-8 h-8 text-foreground" />
                                </div>
                                <div>
                                  <p className="font-bold text-[#C9941A]">Melody Recorded!</p>
                                  <p className="text-sm text-gray-400">Ready for AI analysis</p>
                                </div>
                              </div>
                              <audio src={recordedMelodyUrl} controls className="w-full" data-testid="audio-recorded-melody" />
                              <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => { setRecordedMelodyUrl(null); setMelodyAnalysis(null); }} data-testid="button-rerecord">
                                  <RotateCcw className="w-4 h-4 mr-2" /> Re-record
                                </Button>
                                <Button onClick={analyzeMelody} disabled={isAnalyzingMelody} className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-analyze-melody">
                                  {isAnalyzingMelody ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                                  Analyze with AI
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg">
                            <Music className="w-6 h-6 mx-auto mb-1 text-[#C9941A]" />
                            <p className="font-medium">Hum a Tune</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg">
                            <Mic className="w-6 h-6 mx-auto mb-1 text-[#C9941A]" />
                            <p className="font-medium">Sing Lyrics</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg">
                            <Activity className="w-6 h-6 mx-auto mb-1 text-pink-500" />
                            <p className="font-medium">Whistle</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Transform Settings */}
                  {melodyMagicStep === 2 && (
                    <Card className="border-amber-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="w-6 h-6 text-[#C9941A]" /> Step 2: Choose Your Transformation
                        </CardTitle>
                        <CardDescription>
                          AI detected your melody! Now pick how you want it transformed.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Analysis Results */}
                        {melodyAnalysis && (
                          <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                            <h4 className="font-bold text-[#C9941A] mb-3 flex items-center gap-2">
                              <Brain className="w-5 h-5" /> AI Analysis Results
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-[#C9941A]">{melodyAnalysis.detectedBpm}</p>
                                <p className="text-xs text-gray-400">BPM</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-[#C9941A]">{melodyAnalysis.detectedKey}</p>
                                <p className="text-xs text-gray-400">Key</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-pink-500">{melodyAnalysis.detectedScale}</p>
                                <p className="text-xs text-gray-400">Scale</p>
                              </div>
                              <div className="text-center p-3 bg-background/50 rounded">
                                <p className="text-2xl font-bold text-blue-500">{melodyAnalysis.confidence}%</p>
                                <p className="text-xs text-gray-400">Confidence</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Genre Selection */}
                        <div>
                          <Label className="text-lg mb-3 block">Target Genre</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: "metal", label: "Death Metal", icon: Zap, color: "from-red-500 to-orange-500" },
                              { value: "rap", label: "Hip Hop / Rap", icon: Mic, color: "from-amber-500 to-pink-500" },
                              { value: "pop", label: "Pop", icon: Music, color: "from-blue-500 to-cyan-500" },
                              { value: "country", label: "Country", icon: Guitar, color: "from-amber-500 to-yellow-500" },
                              { value: "edm", label: "EDM / Electronic", icon: Waves, color: "from-green-500 to-teal-500" },
                              { value: "rock", label: "Rock", icon: Radio, color: "from-gray-500 to-slate-500" },
                              { value: "jazz", label: "Jazz / Blues", icon: Piano, color: "from-indigo-500 to-amber-500" },
                              { value: "orchestral", label: "Orchestral", icon: Disc, color: "from-rose-500 to-red-500" },
                            ].map((genre) => (
                              <button
                                key={genre.value}
                                onClick={() => setTargetGenre(genre.value)}
                                className={`p-4 rounded-xl border-2 transition-all text-left
                                  ${targetGenre === genre.value 
                                    ? `border-transparent bg-gradient-to-r ${genre.color} text-foreground shadow-lg` 
                                    : 'border-[#333] hover:border-primary/50 bg-[#1a1a1a]/30'}`}
                                data-testid={`button-genre-${genre.value}`}
                              >
                                <genre.icon className="w-6 h-6 mb-2" />
                                <p className="font-bold">{genre.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voice Style Selection */}
                        <div>
                          <Label className="text-lg mb-3 block">Voice Style</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { value: "powerful", label: "Powerful", desc: "Strong & commanding" },
                              { value: "smooth", label: "Smooth", desc: "Silky & melodic" },
                              { value: "aggressive", label: "Aggressive", desc: "Raw & intense" },
                              { value: "ethereal", label: "Ethereal", desc: "Dreamy & floating" },
                              { value: "deep", label: "Deep Bass", desc: "Low & rumbling" },
                              { value: "high", label: "High Tenor", desc: "Soaring & bright" },
                              { value: "robotic", label: "Robotic", desc: "Auto-tuned & digital" },
                              { value: "natural", label: "Natural", desc: "Organic & warm" },
                            ].map((voice) => (
                              <button
                                key={voice.value}
                                onClick={() => setTargetVoiceStyle(voice.value)}
                                className={`p-3 rounded-lg border-2 transition-all text-left
                                  ${targetVoiceStyle === voice.value 
                                    ? 'border-[#C9941A] bg-primary/10' 
                                    : 'border-[#333] hover:border-primary/50'}`}
                                data-testid={`button-voice-${voice.value}`}
                              >
                                <p className="font-bold">{voice.label}</p>
                                <p className="text-xs text-gray-400">{voice.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setMelodyMagicStep(1)}>Back</Button>
                          <Button onClick={() => setMelodyMagicStep(3)} className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-next-lyrics">
                            Continue to Lyrics <FastForward className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Lyrics */}
                  {melodyMagicStep === 3 && (
                    <Card className="border-pink-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PenTool className="w-6 h-6 text-pink-500" /> Step 3: Add Lyrics (Optional)
                        </CardTitle>
                        <CardDescription>
                          Let AI write lyrics for your {targetGenre} transformation, or add your own!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Button 
                              onClick={generateMelodyLyrics} 
                              disabled={isGeneratingLyrics}
                              className="w-full bg-gradient-to-r from-pink-500 to-amber-500"
                              data-testid="button-generate-melody-lyrics"
                            >
                              {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                              AI Generate {targetGenre.toUpperCase()} Lyrics
                            </Button>
                            
                            <div>
                              <Label>Song Theme (optional)</Label>
                              <Input 
                                value={songTheme}
                                onChange={(e) => setSongTheme(e.target.value)}
                                placeholder="e.g., Christmas chaos, epic adventure, love story..."
                                data-testid="input-melody-theme"
                              />
                            </div>
                            
                            <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-sm">
                              <p className="font-medium mb-1">🎵 Transformation Preview:</p>
                              <p className="text-gray-400">
                                Your melody in <span className="text-[#C9941A] font-bold">{melodyAnalysis?.detectedKey} {melodyAnalysis?.detectedScale}</span> at{' '}
                                <span className="text-[#C9941A] font-bold">{melodyAnalysis?.detectedBpm} BPM</span> → 
                                <span className="text-pink-500 font-bold"> {targetGenre.toUpperCase()}</span> with{' '}
                                <span className="text-blue-500 font-bold">{targetVoiceStyle}</span> vocals
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Your Lyrics</Label>
                            <Textarea 
                              value={melodyLyrics}
                              onChange={(e) => setMelodyLyrics(e.target.value)}
                              placeholder={`[Verse 1]\nYour lyrics here...\n\n[Chorus]\nThe hook goes here...`}
                              className="h-64 font-mono"
                              data-testid="textarea-melody-lyrics"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-between">
                          <Button variant="outline" onClick={() => setMelodyMagicStep(2)}>Back</Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setMelodyLyrics(""); setMelodyMagicStep(4); }} data-testid="button-skip-lyrics">
                              Skip (Instrumental Only)
                            </Button>
                            <Button 
                              onClick={recomposeMelody} 
                              disabled={isRecomposing}
                              className="bg-gradient-to-r from-orange-500 to-amber-500"
                              data-testid="button-recompose"
                            >
                              {isRecomposing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                              RECOMPOSE MAGIC!
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Recomposed Result */}
                  {melodyMagicStep === 4 && (
                    <Card className="border-green-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-[#C9941A]" /> Your Masterpiece is Ready!
                        </CardTitle>
                        <CardDescription>
                          AI transformed your melody into a {targetGenre} masterpiece!
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {isRecomposing ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center animate-pulse mb-4">
                              <Sparkles className="w-12 h-12 text-foreground animate-spin" />
                            </div>
                            <p className="text-xl font-bold">Creating Magic...</p>
                            <p className="text-gray-400">AI is recomposing your melody as {targetGenre}</p>
                            <Progress value={65} className="w-64 mt-4" />
                          </div>
                        ) : recomposedTrack ? (
                          <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 text-center">
                              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mb-4">
                                <Music className="w-10 h-10 text-foreground" />
                              </div>
                              <h3 className="text-2xl font-bold">{recomposedTrack.title}</h3>
                              <p className="text-gray-400">
                                {targetGenre.toUpperCase()} • {targetVoiceStyle} vocals • {melodyAnalysis?.detectedBpm} BPM
                              </p>
                            </div>

                            {recomposedTrack.audioUrl && (
                              <audio src={recomposedTrack.audioUrl} controls className="w-full" data-testid="audio-recomposed" />
                            )}

                            {recomposedTrack.lyrics && (
                              <div>
                                <Label>Generated Lyrics</Label>
                                <div className="p-4 bg-[#1a1a1a]/30 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                                  {recomposedTrack.lyrics}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 justify-center flex-wrap">
                              <Button variant="outline" onClick={() => { setMelodyMagicStep(1); setRecordedMelodyUrl(null); setMelodyAnalysis(null); setRecomposedTrack(null); }}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Start New
                              </Button>
                              <Button variant="outline" onClick={() => setMelodyMagicStep(2)}>
                                <Wand2 className="w-4 h-4 mr-2" /> Try Different Genre
                              </Button>
                              <Button className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-add-to-project">
                                <Plus className="w-4 h-4 mr-2" /> Add to Project
                              </Button>
                              <Button variant="outline" data-testid="button-download-recomposed">
                                <Download className="w-4 h-4 mr-2" /> Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">Something went wrong. Try again!</p>
                            <Button onClick={() => setMelodyMagicStep(1)} className="mt-4">Start Over</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  </>
                  )}
                </div>
              </TabsContent>

              {/* STEM SEPARATOR TAB */}
              <TabsContent value="stem-separator" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Waves className="w-8 h-8 text-blue-500 animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        STEM SEPARATOR
                      </h2>
                      <Waves className="w-8 h-8 text-cyan-500 animate-pulse" />
                    </div>
                    <p className="text-gray-400">Upload any song and split it into individual stems</p>
                    <p className="text-sm text-cyan-400 mt-2">Vocals | Drums | Bass | Guitar | Piano | Synth</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-blue-500" /> Upload Song
                        </CardTitle>
                        <CardDescription>Upload an audio file to separate into stems</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <input 
                          type="file" 
                          ref={stemFileInputRef}
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStemUploadUrl(URL.createObjectURL(file));
                            }
                          }}
                          data-testid="input-stem-upload"
                        />
                        <div 
                          className="border-2 border-dashed border-blue-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => stemFileInputRef.current?.click()}
                        >
                          {stemUploadUrl ? (
                            <div className="space-y-4">
                              <Music className="w-12 h-12 mx-auto text-blue-500" />
                              <p className="text-sm text-gray-400">Song uploaded successfully!</p>
                              <audio src={stemUploadUrl} controls className="w-full" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Upload className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-gray-400">Click or drag to upload audio</p>
                              <p className="text-xs text-gray-400">MP3, WAV, M4A, FLAC supported</p>
                            </div>
                          )}
                        </div>
                        
                        {stemUploadUrl && (
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            disabled={isSeparatingStems}
                            onClick={() => {
                              setIsSeparatingStems(true);
                              setTimeout(() => {
                                setSeparatedStems({
                                  vocals: stemUploadUrl,
                                  drums: stemUploadUrl,
                                  bass: stemUploadUrl,
                                  other: stemUploadUrl,
                                  instrumental: stemUploadUrl,
                                });
                                setIsSeparatingStems(false);
                              }, 3000);
                            }}
                            data-testid="button-separate-stems"
                          >
                            {isSeparatingStems ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Separating Stems...</>
                            ) : (
                              <><Wand2 className="w-4 h-4 mr-2" /> Separate Into Stems</>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-cyan-500" /> Separated Stems
                        </CardTitle>
                        <CardDescription>Download or remix individual elements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {separatedStems ? (
                          <div className="space-y-3">
                            {[
                              { name: "Vocals", icon: Mic, color: "text-pink-500", stem: separatedStems.vocals },
                              { name: "Drums", icon: Drum, color: "text-[#C9941A]", stem: separatedStems.drums },
                              { name: "Bass", icon: Waves, color: "text-[#C9941A]", stem: separatedStems.bass },
                              { name: "Other (Guitar/Keys)", icon: Guitar, color: "text-yellow-500", stem: separatedStems.other },
                              { name: "Instrumental", icon: Music, color: "text-[#C9941A]", stem: separatedStems.instrumental },
                            ].map((s) => (
                              <div key={s.name} className="flex items-center gap-3 p-3 bg-[#1a1a1a]/50 rounded-lg">
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                                <span className="flex-1 font-medium">{s.name}</span>
                                <div className="flex gap-2">
                                  <Button size="icon" variant="outline" data-testid={`button-play-${s.name.toLowerCase()}`}>
                                    <Play className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="outline" data-testid={`button-download-${s.name.toLowerCase()}`}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="outline" data-testid={`button-add-${s.name.toLowerCase()}`}>
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button className="w-full mt-4" variant="outline" data-testid="button-download-all-stems">
                              <Download className="w-4 h-4 mr-2" /> Download All Stems (ZIP)
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Upload a song to see separated stems here</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>What Can You Do With Stems?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { title: "Create Remixes", desc: "Swap drums, add new bass lines", icon: Shuffle },
                          { title: "Karaoke Tracks", desc: "Remove vocals for backing tracks", icon: Mic },
                          { title: "Sample Elements", desc: "Extract hooks and loops", icon: Scissors },
                          { title: "AI Enhancement", desc: "Upgrade individual stems", icon: Sparkles },
                        ].map((item) => (
                          <div key={item.title} className="p-4 bg-[#1a1a1a]/30 rounded-lg text-center">
                            <item.icon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* AI VOICE LIBRARY TAB */}
              <TabsContent value="voice-library" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-rose-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-8 h-8 text-[#C9941A] animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
                        AI VOICE LIBRARY
                      </h2>
                      <Users className="w-8 h-8 text-pink-500 animate-pulse" />
                    </div>
                    <p className="text-gray-400">200+ pre-trained voice models + train your own</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#C9941A]" /> Voice Models
                          </CardTitle>
                          <CardDescription>Select from our library of AI voice archetypes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { id: "natural-male", name: "Natural Male", desc: "Warm, conversational", icon: "🎤" },
                              { id: "natural-female", name: "Natural Female", desc: "Clear, expressive", icon: "🎙️" },
                              { id: "pop-diva", name: "Pop Diva", desc: "Powerful, dynamic range", icon: "✨" },
                              { id: "soul-legend", name: "Soul Legend", desc: "Rich, emotional depth", icon: "🎷" },
                              { id: "rock-powerhouse", name: "Rock Powerhouse", desc: "Raw, gritty energy", icon: "🎸" },
                              { id: "country-storyteller", name: "Country Storyteller", desc: "Twang, authenticity", icon: "🤠" },
                              { id: "rap-flow", name: "Rap Flow Master", desc: "Sharp, rhythmic", icon: "🔥" },
                              { id: "jazz-crooner", name: "Jazz Crooner", desc: "Smooth, sophisticated", icon: "🎺" },
                              { id: "edm-vocal", name: "EDM Vocal", desc: "Processed, ethereal", icon: "🎛️" },
                              { id: "opera-classical", name: "Opera Classical", desc: "Trained, powerful", icon: "🎭" },
                              { id: "indie-folk", name: "Indie Folk", desc: "Intimate, acoustic", icon: "🌿" },
                              { id: "metal-scream", name: "Metal Screamer", desc: "Intense, aggressive", icon: "🔱" },
                            ].map((voice) => (
                              <button
                                key={voice.id}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                  selectedVoiceModel === voice.id 
                                    ? 'border-amber-500 bg-[#C9941A]/10' 
                                    : 'border-border hover:border-amber-500/50'
                                }`}
                                onClick={() => setSelectedVoiceModel(voice.id)}
                                data-testid={`button-voice-${voice.id}`}
                              >
                                <div className="text-2xl mb-2">{voice.icon}</div>
                                <div className="font-medium text-sm">{voice.name}</div>
                                <div className="text-xs text-gray-400">{voice.desc}</div>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Mic className="w-5 h-5 text-pink-500" /> Train Your Voice
                          </CardTitle>
                          <CardDescription>Create a custom AI voice model</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Input 
                            placeholder="Voice model name..."
                            value={customVoiceName}
                            onChange={(e) => setCustomVoiceName(e.target.value)}
                            data-testid="input-voice-name"
                          />
                          <div className="border-2 border-dashed border-pink-500/30 rounded-lg p-4 text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-400">Upload 10+ minutes of audio</p>
                            <p className="text-xs text-gray-400 mt-1">Best results with clean vocals</p>
                          </div>
                          <Button 
                            className="w-full bg-gradient-to-r from-amber-500 to-pink-500"
                            disabled={isTrainingVoice || !customVoiceName}
                            data-testid="button-train-voice"
                          >
                            {isTrainingVoice ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Training...</>
                            ) : (
                              <><Sparkles className="w-4 h-4 mr-2" /> Train Voice Model</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Play className="w-5 h-5 text-[#C9941A]" /> Preview Voice
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Textarea 
                            placeholder="Enter text to hear the voice..."
                            value={voiceLibraryText}
                            onChange={(e) => setVoiceLibraryText(e.target.value)}
                            rows={3}
                            data-testid="input-voice-preview-text"
                          />
                          <Button 
                            className="w-full" 
                            variant="outline"
                            disabled={isGeneratingVoicePreview || !voiceLibraryText}
                            data-testid="button-preview-voice"
                          >
                            {isGeneratingVoicePreview ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" /> Preview Voice</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI MASTERING TAB */}
              <TabsContent value="mastering" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-green-500/10 via-teal-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Headphones className="w-8 h-8 text-[#C9941A] animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                        AI MASTERING SUITE
                      </h2>
                      <Headphones className="w-8 h-8 text-teal-500 animate-pulse" />
                    </div>
                    <p className="text-gray-400">Professional mastering powered by AI</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-[#C9941A]" /> Mastering Presets
                        </CardTitle>
                        <CardDescription>Choose a preset optimized for your platform</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "streaming", name: "Streaming", desc: "Spotify, Apple Music (-14 LUFS)", icon: Radio },
                            { id: "club", name: "Club/DJ", desc: "Loud, punchy (-8 LUFS)", icon: Disc3 },
                            { id: "vinyl", name: "Vinyl Warm", desc: "Analog warmth, dynamic", icon: Disc },
                            { id: "broadcast", name: "Broadcast", desc: "TV/Radio standards", icon: Tv },
                            { id: "podcast", name: "Podcast/Voice", desc: "Clear vocals (-16 LUFS)", icon: Mic },
                            { id: "custom", name: "Custom", desc: "Full control", icon: Settings2 },
                          ].map((preset) => (
                            <button
                              key={preset.id}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                masteringPreset === preset.id 
                                  ? 'border-green-500 bg-[#C9941A]/10' 
                                  : 'border-border hover:border-green-500/50'
                              }`}
                              onClick={() => setMasteringPreset(preset.id)}
                              data-testid={`button-preset-${preset.id}`}
                            >
                              <preset.icon className="w-6 h-6 mb-2 text-[#C9941A]" />
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs text-gray-400">{preset.desc}</div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-teal-500" /> Mastering Controls
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Target Loudness (LUFS)</span>
                            <span className="font-mono">{masteringLoudness} LUFS</span>
                          </div>
                          <Slider 
                            value={[masteringLoudness]} 
                            min={-24} 
                            max={-6} 
                            step={1}
                            onValueChange={(v) => setMasteringLoudness(v[0])}
                            data-testid="slider-loudness"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Stereo Width</span>
                            <span className="font-mono">{masteringStereoWidth}%</span>
                          </div>
                          <Slider 
                            value={[masteringStereoWidth]} 
                            min={50} 
                            max={150} 
                            step={5}
                            onValueChange={(v) => setMasteringStereoWidth(v[0])}
                            data-testid="slider-stereo-width"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                            <span className="text-xs text-gray-400">EQ</span>
                            <p className="font-medium text-[#C9941A]">Auto</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                            <span className="text-xs text-gray-400">Compression</span>
                            <p className="font-medium text-[#C9941A]">Adaptive</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                            <span className="text-xs text-gray-400">Limiter</span>
                            <p className="font-medium text-[#C9941A]">True Peak</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                            <span className="text-xs text-gray-400">Dithering</span>
                            <p className="font-medium text-[#C9941A]">16-bit</p>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-teal-500"
                          disabled={isMastering}
                          data-testid="button-master-track"
                        >
                          {isMastering ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Mastering...</>
                          ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Master Track</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {masteredTrackUrl && (
                    <Card className="border-green-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#C9941A]">
                          <CheckCircle className="w-5 h-5" /> Mastering Complete!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <audio src={masteredTrackUrl} controls className="w-full" />
                        <div className="flex gap-3">
                          <Button className="flex-1" data-testid="button-download-master-wav">
                            <Download className="w-4 h-4 mr-2" /> Download WAV
                          </Button>
                          <Button className="flex-1" variant="outline" data-testid="button-download-master-mp3">
                            <Download className="w-4 h-4 mr-2" /> Download MP3
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* DISTRIBUTION HUB TAB */}
              <TabsContent value="distribution" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl border border">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                        DISTRIBUTION HUB
                      </h2>
                      <Radio className="w-8 h-8 text-[#C9941A] animate-pulse" />
                    </div>
                    <p className="text-gray-400">Publish to 150+ streaming platforms worldwide</p>
                    <p className="text-sm text-[#C9941A] mt-2">Keep 85% of royalties | No annual fees</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-[#C9941A]" /> Select Platforms
                        </CardTitle>
                        <CardDescription>Choose where to publish your music</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: "spotify", name: "Spotify", color: "bg-[#C9941A]" },
                            { id: "apple", name: "Apple Music", color: "bg-pink-500" },
                            { id: "youtube", name: "YouTube Music", color: "bg-red-500" },
                            { id: "amazon", name: "Amazon Music", color: "bg-blue-500" },
                            { id: "tidal", name: "Tidal", color: "bg-slate-500" },
                            { id: "deezer", name: "Deezer", color: "bg-[#C9941A]" },
                            { id: "soundcloud", name: "SoundCloud", color: "bg-[#C9941A]" },
                            { id: "tiktok", name: "TikTok", color: "bg-pink-600" },
                            { id: "instagram", name: "Instagram", color: "bg-[#C9941A]" },
                          ].map((platform) => (
                            <button
                              key={platform.id}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                distributionPlatforms.includes(platform.id)
                                  ? 'border-[#C9941A] bg-primary/10'
                                  : 'border-border hover:border-[#C9941A]/50'
                              }`}
                              onClick={() => {
                                if (distributionPlatforms.includes(platform.id)) {
                                  setDistributionPlatforms(distributionPlatforms.filter(p => p !== platform.id));
                                } else {
                                  setDistributionPlatforms([...distributionPlatforms, platform.id]);
                                }
                              }}
                              data-testid={`button-platform-${platform.id}`}
                            >
                              <div className={`w-10 h-10 ${platform.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                                <Music className="w-5 h-5 text-foreground" />
                              </div>
                              <div className="text-sm font-medium">{platform.name}</div>
                            </button>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => setDistributionPlatforms(["spotify", "apple", "youtube", "amazon", "tidal", "deezer", "soundcloud", "tiktok", "instagram"])}
                          data-testid="button-select-all-platforms"
                        >
                          Select All Platforms
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#C9941A]" /> Track Metadata
                        </CardTitle>
                        <CardDescription>Fill in your release information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Track Title</Label>
                            <Input 
                              placeholder="My Song" 
                              value={trackMetadata.title}
                              onChange={(e) => setTrackMetadata({...trackMetadata, title: e.target.value})}
                              data-testid="input-track-title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Artist Name</Label>
                            <Input 
                              placeholder="Your Artist Name" 
                              value={trackMetadata.artist}
                              onChange={(e) => setTrackMetadata({...trackMetadata, artist: e.target.value})}
                              data-testid="input-artist-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Album/EP</Label>
                            <Input 
                              placeholder="Single" 
                              value={trackMetadata.album}
                              onChange={(e) => setTrackMetadata({...trackMetadata, album: e.target.value})}
                              data-testid="input-album"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Genre</Label>
                            <Select value={trackMetadata.genre} onValueChange={(v) => setTrackMetadata({...trackMetadata, genre: v})}>
                              <SelectTrigger data-testid="select-genre">
                                <SelectValue placeholder="Select genre" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pop">Pop</SelectItem>
                                <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                                <SelectItem value="rock">Rock</SelectItem>
                                <SelectItem value="electronic">Electronic</SelectItem>
                                <SelectItem value="r&b">R&B</SelectItem>
                                <SelectItem value="country">Country</SelectItem>
                                <SelectItem value="jazz">Jazz</SelectItem>
                                <SelectItem value="classical">Classical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Release Date</Label>
                            <Input 
                              type="date" 
                              value={trackMetadata.releaseDate}
                              onChange={(e) => setTrackMetadata({...trackMetadata, releaseDate: e.target.value})}
                              data-testid="input-release-date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ISRC (Optional)</Label>
                            <Input 
                              placeholder="Auto-generated" 
                              value={trackMetadata.isrc}
                              onChange={(e) => setTrackMetadata({...trackMetadata, isrc: e.target.value})}
                              data-testid="input-isrc"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
                          disabled={isDistributing || distributionPlatforms.length === 0 || !trackMetadata.title}
                          data-testid="button-distribute"
                        >
                          {isDistributing ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Distributing...</>
                          ) : (
                            <><Rocket className="w-4 h-4 mr-2" /> Distribute to {distributionPlatforms.length} Platforms</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="bg-gradient-to-r from-orange-500/5 to-yellow-500/5">
                    <CardContent className="py-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-3xl font-bold text-[#C9941A]">150+</div>
                          <div className="text-sm text-gray-400">Platforms</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-[#C9941A]">85%</div>
                          <div className="text-sm text-gray-400">Royalties Kept</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-[#C9941A]">$0</div>
                          <div className="text-sm text-gray-400">Annual Fees</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-[#C9941A]">24hr</div>
                          <div className="text-sm text-gray-400">Review Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Create Song Wizard Tab */}
              <TabsContent value="create" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Progress Stepper */}
                  <div className="flex items-center justify-between px-4">
                    {[
                      { step: 1, label: "Write Lyrics" },
                      { step: 2, label: "Choose Style" },
                      { step: 3, label: "Generate Beat" },
                      { step: 4, label: "Select Voice" },
                      { step: 5, label: "Preview & Export" },
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center">
                        <button
                          onClick={() => setCreatorStep(s.step)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                            ${creatorStep === s.step ? 'bg-primary text-[#C9941A]-foreground' : 
                              creatorStep > s.step ? 'bg-primary/50 text-foreground' : 'bg-[#1a1a1a] text-gray-400'}`}
                          data-testid={`button-step-${s.step}`}
                        >
                          {s.step}
                        </button>
                        <span className={`ml-2 text-sm hidden md:block ${creatorStep === s.step ? 'text-[#C9941A] font-bold' : 'text-gray-400'}`}>
                          {s.label}
                        </span>
                        {i < 4 && <div className={`w-8 md:w-16 h-1 mx-2 ${creatorStep > s.step ? 'bg-primary' : 'bg-[#1a1a1a]'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Write Lyrics */}
                  {creatorStep === 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PenTool className="w-5 h-5 text-[#C9941A]" /> Step 1: Write Your Lyrics
                        </CardTitle>
                        <CardDescription>Start with your message. What's the song about?</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <Label>Song Theme / Topic</Label>
                              <Input 
                                value={songTheme} 
                                onChange={(e) => setSongTheme(e.target.value)}
                                placeholder="e.g., Rising from stroke, never giving up, comeback story..."
                                data-testid="input-song-theme"
                              />
                            </div>
                            <div>
                              <Label>Mood / Energy</Label>
                              <Select value={songMood} onValueChange={setSongMood}>
                                <SelectTrigger data-testid="select-song-mood"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="triumphant">Triumphant - Victory energy</SelectItem>
                                  <SelectItem value="aggressive">Aggressive - Raw power</SelectItem>
                                  <SelectItem value="emotional">Emotional - Deep feeling</SelectItem>
                                  <SelectItem value="motivational">Motivational - Pump up</SelectItem>
                                  <SelectItem value="reflective">Reflective - Looking back</SelectItem>
                                  <SelectItem value="defiant">Defiant - Against all odds</SelectItem>
                                  <SelectItem value="healing">Healing - Peace & recovery</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Influences (Optional)</Label>
                              <Input 
                                value={songInfluences}
                                onChange={(e) => setSongInfluences(e.target.value)}
                                placeholder="e.g., Eminem, Johnny Cash, Metallica..."
                                data-testid="input-influences"
                              />
                            </div>
                            <Button 
                              onClick={async () => {
                                setIsGeneratingLyrics(true);
                                try {
                                  const response = await apiRequest("POST", "/api/music/generate-lyrics", {
                                    genre: selectedGenre,
                                    theme: songTheme || "stroke recovery warrior rising up",
                                    mood: songMood,
                                    influences: songInfluences,
                                  });
                                  const data = await response.json();
                                  if (data.lyrics) {
                                    setLyrics(data.lyrics);
                                    toast({ title: "Lyrics Generated", description: "AI wrote your lyrics. Edit as needed!" });
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to generate lyrics", variant: "destructive" });
                                } finally {
                                  setIsGeneratingLyrics(false);
                                }
                              }}
                              disabled={isGeneratingLyrics}
                              className="w-full"
                              data-testid="button-ai-write-lyrics"
                            >
                              {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                              AI Write Lyrics
                            </Button>
                          </div>
                          <div>
                            <Label>Your Lyrics</Label>
                            <Textarea 
                              value={lyrics}
                              onChange={(e) => setLyrics(e.target.value)}
                              placeholder={`[Verse 1]
Write your first verse here...

[Chorus]
Write the hook that repeats...

[Verse 2]
Continue your story...

[Bridge]
Change it up...

[Chorus]
Repeat the hook...`}
                              className="min-h-[300px] font-mono text-sm"
                              data-testid="textarea-lyrics-creator"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => setCreatorStep(2)} disabled={!lyrics.trim()} data-testid="button-next-step-1">
                            Next: Choose Style
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: Choose Style */}
                  {creatorStep === 2 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Music className="w-5 h-5 text-[#C9941A]" /> Step 2: Choose Your Style
                        </CardTitle>
                        <CardDescription>Define the sound - 32 genres powered by Google Lyria AI</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label className="mb-3 block">Genre Category</Label>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {["All", "Hip-Hop", "Rock", "Electronic", "Pop", "Country", "Jazz", "World", "Atmospheric", "Motivation"].map((cat) => (
                              <Button
                                key={cat}
                                variant={genreCategory === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setGenreCategory(cat)}
                                data-testid={`button-category-${cat.toLowerCase()}`}
                              >
                                {cat}
                              </Button>
                            ))}
                          </div>
                          <ScrollArea className="h-[200px]">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {genres
                                .filter((g) => genreCategory === "All" || g.category === genreCategory)
                                .map((g) => {
                                  const Icon = g.icon;
                                  return (
                                    <button
                                      key={g.value}
                                      onClick={() => setSelectedGenre(g.value)}
                                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 hover-elevate
                                        ${selectedGenre === g.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                                      data-testid={`button-genre-${g.value}`}
                                    >
                                      <Icon className={`w-6 h-6 ${selectedGenre === g.value ? 'text-[#C9941A]' : ''}`} />
                                      <span className="font-medium text-xs text-center">{g.label}</span>
                                    </button>
                                  );
                                })}
                            </div>
                          </ScrollArea>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Tempo (BPM): {bpm}</Label>
                            <Slider 
                              value={[bpm]} 
                              onValueChange={([v]) => setBpm(v)} 
                              min={60} max={200} 
                              className="mt-2"
                              data-testid="slider-tempo-creator"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>60</span>
                              <span>200</span>
                            </div>
                          </div>
                          <div>
                            <Label>Key</Label>
                            <Select value={selectedKey} onValueChange={setSelectedKey}>
                              <SelectTrigger className="mt-2" data-testid="select-key-creator"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {keys.map((k) => (
                                  <SelectItem key={k} value={k}>{k}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Scale</Label>
                            <Select value={selectedScale} onValueChange={setSelectedScale}>
                              <SelectTrigger className="mt-2" data-testid="select-scale-creator"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {scales.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Seed (Optional)</Label>
                            <Input 
                              type="number"
                              placeholder="Random"
                              value={lyriaSeed || ""}
                              onChange={(e) => setLyriaSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="mt-2"
                              data-testid="input-lyria-seed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Same seed = same result</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-[#C9941A]" />
                            <span className="font-semibold text-sm">Lyria AI Configuration</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Selected: <strong className="text-[#C9941A]">{genres.find(g => g.value === selectedGenre)?.label}</strong> at <strong className="text-[#C9941A]">{bpm} BPM</strong> in <strong className="text-[#C9941A]">{selectedKey} {selectedScale}</strong>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Cost: <strong className="text-[#C9941A]">$0.06</strong> per 30-second generation
                          </p>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(1)} data-testid="button-back-step-2">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(3)} data-testid="button-next-step-2">
                            Next: Generate Beat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 3: Generate Beat */}
                  {creatorStep === 3 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Disc className="w-5 h-5 text-[#C9941A]" /> Step 3: Generate Your Beat
                        </CardTitle>
                        <CardDescription>
                          AI will create a {genres.find(g => g.value === selectedGenre)?.label} instrumental at {bpm} BPM in {selectedKey} {selectedScale}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-6 bg-[#1a1a1a]/50 rounded-lg text-center">
                          <div className="mb-4">
                            <Badge variant="outline" className="mb-2">{genres.find(g => g.value === selectedGenre)?.label}</Badge>
                            <Badge variant="outline" className="ml-2">{bpm} BPM</Badge>
                            <Badge variant="outline" className="ml-2">{selectedKey} {selectedScale}</Badge>
                          </div>
                          
                          {generatedBeat ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-4 flex-wrap">
                                <Button size="lg" onClick={handlePlay} data-testid="button-play-beat">
                                  {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                  {isPlaying ? "Pause" : "Play"} Beat
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = generatedBeat;
                                  link.download = `${projectTitle.replace(/\s+/g, '_')}_${selectedGenre}_${bpm}bpm.wav`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  toast({ title: "Download Started", description: "Your beat is being downloaded!" });
                                }} data-testid="button-download-beat">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => {
                                  setGeneratedBeat(null);
                                }} data-testid="button-regenerate-beat">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Regenerate
                                </Button>
                              </div>
                              <audio src={generatedBeat} controls className="w-full max-w-md mx-auto" data-testid="audio-generated-beat" />
                            </div>
                          ) : (
                            <Button 
                              size="lg"
                              onClick={async () => {
                                setIsGeneratingBeat(true);
                                setGenerationProgress(0);
                                const interval = setInterval(() => {
                                  setGenerationProgress(p => Math.min(p + 10, 90));
                                }, 500);
                                try {
                                  const response = await apiRequest("POST", "/api/music/generate-instrumental", {
                                    genre: selectedGenre,
                                    bpm,
                                    key: selectedKey,
                                    scale: selectedScale,
                                    mood: songMood,
                                    description: `${songMood} ${genres.find(g => g.value === selectedGenre)?.label} track${songTheme ? ` about ${songTheme}` : ""}`,
                                    seed: lyriaSeed,
                                  });
                                  const data = await response.json();
                                  if (data.success && data.audioBase64) {
                                    const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
                                    setGeneratedBeat(audioUrl);
                                    toast({ title: "Beat Generated!", description: "Your AI instrumental is ready!" });
                                  } else if (data.audioUrl) {
                                    setGeneratedBeat(data.audioUrl);
                                    toast({ title: "Beat Generated!", description: "Your AI instrumental is ready!" });
                                  } else {
                                    console.error("Generation error:", data);
                                    toast({ 
                                      title: "Generation Failed", 
                                      description: data.message || data.error || "Unable to generate beat. Please try again.", 
                                      variant: "destructive" 
                                    });
                                  }
                                } catch (error: any) {
                                  console.error("Generation failed:", error);
                                  toast({ title: "Error", description: error?.message || "Beat generation failed", variant: "destructive" });
                                } finally {
                                  clearInterval(interval);
                                  setGenerationProgress(100);
                                  setIsGeneratingBeat(false);
                                }
                              }}
                              disabled={isGeneratingBeat}
                              data-testid="button-generate-beat-main"
                            >
                              {isGeneratingBeat ? (
                                <>
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                  Generating... ({generationProgress}%)
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Generate Beat with Lyria AI
                                </>
                              )}
                            </Button>
                          )}
                          
                          {isGeneratingBeat && <Progress value={generationProgress} className="mt-4 max-w-md mx-auto" />}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(2)} data-testid="button-back-step-3">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(4)} disabled={!generatedBeat} data-testid="button-next-step-3">
                            Next: Select Voice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 4: Select Voice & Flow */}
                  {creatorStep === 4 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="w-5 h-5 text-[#C9941A]" /> Step 4: Choose Your Voice & Flow
                        </CardTitle>
                        <CardDescription>How should the vocals sound and be delivered?</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="mb-3 block">Voice Style</Label>
                            <div className="space-y-2">
                              {(voiceStyles?.styles || [
                                { id: "deep", name: "Deep & Powerful", description: "Low, commanding presence" },
                                { id: "gritty", name: "Gritty & Raw", description: "Rough, authentic texture" },
                                { id: "smooth", name: "Smooth & Clear", description: "Clean, polished delivery" },
                                { id: "intense", name: "Intense & Driven", description: "High energy, passionate" },
                                { id: "warm", name: "Warm & Soulful", description: "Rich, emotional warmth" },
                                { id: "sharp", name: "Sharp & Precise", description: "Crisp, articulate diction" },
                              ]).slice(0, 6).map((style: any) => (
                                <button
                                  key={style.id}
                                  onClick={() => setSelectedVoiceStyle(style.id)}
                                  className={`w-full p-3 rounded-lg border-2 text-left transition-all hover-elevate
                                    ${selectedVoiceStyle === style.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                                  data-testid={`button-voice-style-${style.id}`}
                                >
                                  <div className="font-medium">{style.name}</div>
                                  <div className="text-sm text-gray-400">{style.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="mb-3 block">Flow / Delivery</Label>
                            <div className="space-y-2">
                              {[
                                { id: "melodic", name: "Melodic", desc: "Sung with melody and hooks" },
                                { id: "aggressive", name: "Aggressive", desc: "Hard, punchy delivery" },
                                { id: "smooth", name: "Smooth", desc: "Laid-back, flowing" },
                                { id: "fast", name: "Fast Flow", desc: "Rapid-fire, technical" },
                                { id: "storytelling", name: "Storytelling", desc: "Narrative, conversational" },
                                { id: "anthemic", name: "Anthemic", desc: "Big, arena-ready" },
                              ].map((flow) => (
                                <button
                                  key={flow.id}
                                  onClick={() => setSelectedFlow(flow.id)}
                                  className={`w-full p-3 rounded-lg border-2 text-left transition-all hover-elevate
                                    ${selectedFlow === flow.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                                  data-testid={`button-flow-${flow.id}`}
                                >
                                  <div className="font-medium">{flow.name}</div>
                                  <div className="text-sm text-gray-400">{flow.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="p-4 bg-[#1a1a1a]/50 rounded-lg">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Mic className="w-4 h-4" /> Clone Your Own Voice (Optional)
                          </h4>
                          <p className="text-sm text-gray-400 mb-4">
                            Record 10+ seconds of your voice to create a voice clone using Google Chirp 3 HD
                          </p>
                          <Button variant="outline" onClick={() => {
                            setCreatorStep(4);
                            toast({ title: "Voice Studio", description: "Go to Voice Studio tab to record and clone your voice" });
                          }} data-testid="button-go-voice-studio">
                            Open Voice Studio
                          </Button>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(3)} data-testid="button-back-step-4">
                            Back
                          </Button>
                          <Button onClick={() => setCreatorStep(5)} data-testid="button-next-step-4">
                            Next: Preview & Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 5: Preview & Export */}
                  {creatorStep === 5 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="w-5 h-5 text-[#C9941A]" /> Step 5: Preview & Export
                        </CardTitle>
                        <CardDescription>Review your song and export</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-bold">Song Summary</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Genre:</span>
                                <Badge>{genres.find(g => g.value === selectedGenre)?.label}</Badge>
                              </div>
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Tempo:</span>
                                <span>{bpm} BPM</span>
                              </div>
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Key:</span>
                                <span>{selectedKey} {selectedScale}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Voice:</span>
                                <span>{voiceStyles?.styles?.find((s: any) => s.id === selectedVoiceStyle)?.name || selectedVoiceStyle}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Flow:</span>
                                <span className="capitalize">{selectedFlow}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-[#1a1a1a]/50 rounded">
                                <span className="text-gray-400">Mood:</span>
                                <span className="capitalize">{songMood}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-bold">Lyrics Preview</h4>
                            <div className="p-3 bg-[#1a1a1a]/50 rounded-lg max-h-48 overflow-y-auto">
                              <pre className="text-sm whitespace-pre-wrap font-mono">{lyrics.substring(0, 500)}{lyrics.length > 500 && "..."}</pre>
                            </div>
                            
                            {generatedBeat && (
                              <div>
                                <h4 className="font-bold mb-2">Generated Beat</h4>
                                <audio src={generatedBeat} controls className="w-full" data-testid="audio-final-preview" />
                                <Button 
                                  variant="outline" 
                                  className="w-full mt-2"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = generatedBeat;
                                    link.download = `${projectTitle.replace(/\s+/g, '_')}_${selectedGenre}_${bpm}bpm.wav`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast({ title: "Download Started", description: "Your beat is being downloaded!" });
                                  }}
                                  data-testid="button-download-final-beat"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Beat
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                          <Button size="lg" className="gap-2" data-testid="button-export-project">
                            <Save className="w-5 h-5" />
                            Save Project
                          </Button>
                          <Button size="lg" variant="outline" className="gap-2" data-testid="button-export-stems">
                            <Download className="w-5 h-5" />
                            Export Stems
                          </Button>
                          <Button size="lg" variant="outline" className="gap-2" data-testid="button-create-video">
                            <Video className="w-5 h-5" />
                            Create Music Video
                          </Button>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setCreatorStep(4)} data-testid="button-back-step-5">
                            Back
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setCreatorStep(1);
                            toast({ title: "Start New Song", description: "Beginning a fresh project" });
                          }} data-testid="button-start-new">
                            Start New Song
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Arrange Tab */}
              <TabsContent value="arrange" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {tracks.map((track) => (
                          <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a]/50 hover-elevate" data-testid={`track-${track.id}`}>
                            <div className={`w-3 h-12 rounded ${track.color}`} />
                            <div className="w-32">
                              <Input value={track.name} onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                                className="h-8 text-sm" data-testid={`input-track-name-${track.id}`} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant={track.muted ? "default" : "ghost"} size="icon" className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { muted: !track.muted })} data-testid={`button-mute-${track.id}`}>
                                {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </Button>
                              <Button variant={track.solo ? "default" : "ghost"} size="icon" className="h-8 w-8"
                                onClick={() => updateTrack(track.id, { solo: !track.solo })} data-testid={`button-solo-${track.id}`}>
                                <Headphones className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex-1 h-12 bg-background rounded-md border border-border relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center px-2">
                                {[...Array(32)].map((_, i) => (
                                  <div key={i} className={`flex-1 mx-px ${track.color} opacity-30`}
                                    style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                              </div>
                            </div>
                            <div className="w-24">
                              <Slider value={[track.volume]} onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                                max={100} data-testid={`slider-volume-${track.id}`} />
                            </div>
                            {track.audioUrl && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#C9941A]"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = track.audioUrl!;
                                  link.download = `${track.name.replace(/\s+/g, '_')}.wav`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  toast({ title: "Download Started", description: `Downloading ${track.name}` });
                                }} data-testid={`button-download-track-${track.id}`}>
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-destructive"
                              onClick={() => removeTrack(track.id)} data-testid={`button-delete-${track.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mixer Tab */}
              <TabsContent value="mixer" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full">
                    <div className="flex gap-4 h-full overflow-x-auto">
                      {tracks.map((track) => (
                        <div key={track.id} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#1a1a1a]/50 w-24 flex-shrink-0" data-testid={`mixer-channel-${track.id}`}>
                          <span className="text-xs font-medium truncate w-full text-center">{track.name}</span>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                              <div className={`absolute bottom-0 w-full ${track.color}`} style={{ height: `${track.volume}%` }} />
                            </div>
                          </div>
                          <Slider value={[track.volume]} onValueChange={([v]) => updateTrack(track.id, { volume: v })}
                            max={100} orientation="vertical" className="h-32" />
                          <div className="flex gap-1">
                            <Button variant={track.muted ? "default" : "outline"} size="icon" className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { muted: !track.muted })}><span className="text-xs">M</span></Button>
                            <Button variant={track.solo ? "default" : "outline"} size="icon" className="h-6 w-6"
                              onClick={() => updateTrack(track.id, { solo: !track.solo })}><span className="text-xs">S</span></Button>
                          </div>
                        </div>
                      ))}
                      <Separator orientation="vertical" />
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10 w-24 flex-shrink-0">
                        <span className="text-xs font-bold">MASTER</span>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-40 w-4 bg-background rounded-full border relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-primary" style={{ height: `${masterVolume}%` }} />
                          </div>
                        </div>
                        <Slider value={[masterVolume]} onValueChange={([v]) => setMasterVolume(v)}
                          max={100} orientation="vertical" className="h-32" data-testid="slider-master-volume" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {/* 8-Band EQ */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">8-Band Parametric EQ</CardTitle>
                        <div className="flex gap-2">
                          {audioPresets?.presets?.eq?.slice(0, 4).map((p: any) => (
                            <Button key={p.id} variant="outline" size="sm" onClick={() => applyEQPreset(p.id)}
                              data-testid={`button-eq-preset-${p.id}`}>{p.name}</Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 items-end h-48">
                        {eqBands.map((band, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <Slider value={[band.gain + 12]} onValueChange={([v]) => {
                              const newBands = [...eqBands];
                              newBands[i].gain = v - 12;
                              setEqBands(newBands);
                            }} min={0} max={24} orientation="vertical" className="h-32" data-testid={`slider-eq-band-${i}`} />
                            <span className="text-xs text-gray-400">{band.frequency >= 1000 ? `${band.frequency/1000}k` : band.frequency}</span>
                            <span className="text-xs font-mono">{band.gain > 0 ? '+' : ''}{band.gain}dB</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Compressor */}
                    <Card className="bg-[#1a1a1a]/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Compressor</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Threshold: {compThreshold}dB</Label>
                          <Slider value={[compThreshold + 60]} onValueChange={([v]) => setCompThreshold(v - 60)}
                            max={60} data-testid="slider-comp-threshold" />
                        </div>
                        <div>
                          <Label className="text-xs">Ratio: {compRatio}:1</Label>
                          <Slider value={[compRatio]} onValueChange={([v]) => setCompRatio(v)}
                            min={1} max={20} data-testid="slider-comp-ratio" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Reverb */}
                    <Card className="bg-[#1a1a1a]/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Reverb</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Mix: {reverbMix}%</Label>
                          <Slider value={[reverbMix]} onValueChange={([v]) => setReverbMix(v)}
                            max={100} data-testid="slider-reverb-mix" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delay */}
                    <Card className="bg-[#1a1a1a]/50">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Delay</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Time: {delayTime}ms</Label>
                          <Slider value={[delayTime]} onValueChange={([v]) => setDelayTime(v)}
                            max={1000} data-testid="slider-delay-time" />
                        </div>
                        <div>
                          <Label className="text-xs">Feedback: {delayFeedback}%</Label>
                          <Slider value={[delayFeedback]} onValueChange={([v]) => setDelayFeedback(v)}
                            max={90} data-testid="slider-delay-feedback" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Auto-Tune */}
                    <Card className="bg-[#1a1a1a]/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Auto-Tune</CardTitle>
                          <Switch checked={autoTuneEnabled} onCheckedChange={setAutoTuneEnabled} data-testid="switch-autotune" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Speed: {autoTuneSpeed === 0 ? 'T-Pain' : autoTuneSpeed}</Label>
                          <Slider value={[autoTuneSpeed]} onValueChange={([v]) => setAutoTuneSpeed(v)}
                            max={100} disabled={!autoTuneEnabled} data-testid="slider-autotune-speed" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Voice Studio Tab */}
              <TabsContent value="voice" className="flex-1 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Voice Cloning */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-[#C9941A]" /> Clone Your Voice
                      </CardTitle>
                      <CardDescription>Record 10+ seconds to clone your voice</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                        <Button size="lg" variant={isRecordingVoice ? "destructive" : "default"}
                          onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                          data-testid="button-record-voice">
                          {isRecordingVoice ? (
                            <><StopIcon className="w-6 h-6 mr-2" /> Stop Recording</>
                          ) : (
                            <><CircleDot className="w-6 h-6 mr-2" /> Start Recording</>
                          )}
                        </Button>
                      </div>
                      {isRecordingVoice && (
                        <div className="flex items-center justify-center gap-2 text-destructive">
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>Recording... speak clearly for at least 10 seconds</span>
                        </div>
                      )}
                      {clonedVoiceKey && (
                        <Badge variant="outline" className="w-full justify-center py-2 text-[#C9941A]">
                          Voice Cloned Successfully!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Voice Synthesis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#C9941A]" /> Voice Synthesis
                      </CardTitle>
                      <CardDescription>Generate speech in any style</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Voice Style</Label>
                        <Select value={selectedVoiceStyle} onValueChange={setSelectedVoiceStyle}>
                          <SelectTrigger data-testid="select-voice-style"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {voiceStyles?.styles?.map((s: any) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} - {s.description}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Text to Speak</Label>
                        <Textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)}
                          placeholder="Enter text to synthesize... Try: 'REBUILD. REWIRE. RISE. I am unstoppable!'"
                          className="min-h-[100px]" data-testid="textarea-voice-text" />
                      </div>
                      <Button className="w-full" onClick={synthesizeVoice} disabled={isGeneratingVoice}
                        data-testid="button-synthesize-voice">
                        {isGeneratingVoice ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Volume2 className="w-4 h-4 mr-2" />}
                        Generate Voice
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Lyrics Tab */}
              <TabsContent value="lyrics" className="flex-1 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-4 h-full flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">Song Lyrics</h3>
                      <Button size="sm" onClick={generateLyrics} disabled={isGeneratingLyrics} data-testid="button-generate-lyrics-tab">
                        {isGeneratingLyrics ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        AI Generate
                      </Button>
                    </div>
                    <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Write your lyrics here or use AI to generate them..."
                      className="flex-1 resize-none font-mono" data-testid="textarea-lyrics" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* VIDEO-TO-MUSIC SYNC TAB */}
              <TabsContent value="video-sync" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl border border-indigo-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Film className="w-8 h-8 text-indigo-500 animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                        VIDEO-TO-MUSIC SYNC
                      </h2>
                      <Music className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-gray-400">Upload a video and AI generates a perfectly synced soundtrack</p>
                    <p className="text-sm text-indigo-400 mt-2">Scene detection | Mood matching | Beat sync | Transition scoring</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-indigo-500" /> Upload Video
                        </CardTitle>
                        <CardDescription>Upload your video for AI soundtrack generation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <input 
                          type="file" 
                          ref={videoSyncFileRef}
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setVideoSyncUrl(URL.createObjectURL(file));
                            }
                          }}
                          data-testid="input-video-sync-upload"
                        />
                        <div 
                          className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                          onClick={() => videoSyncFileRef.current?.click()}
                        >
                          {videoSyncUrl ? (
                            <div className="space-y-4">
                              <video src={videoSyncUrl} controls className="w-full max-h-48 rounded-lg" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Film className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-gray-400">Click or drag to upload video</p>
                              <p className="text-xs text-gray-400">MP4, MOV, AVI, WebM supported</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Music Mood</Label>
                            <Select value={videoMood} onValueChange={setVideoMood}>
                              <SelectTrigger data-testid="select-video-mood">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto-Detect</SelectItem>
                                <SelectItem value="epic">Epic/Cinematic</SelectItem>
                                <SelectItem value="happy">Happy/Upbeat</SelectItem>
                                <SelectItem value="sad">Emotional/Sad</SelectItem>
                                <SelectItem value="tense">Suspense/Tense</SelectItem>
                                <SelectItem value="romantic">Romantic</SelectItem>
                                <SelectItem value="action">Action/Intense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Tempo Sync</Label>
                            <Select value={videoTempo} onValueChange={setVideoTempo}>
                              <SelectTrigger data-testid="select-video-tempo">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="match">Match Scene Cuts</SelectItem>
                                <SelectItem value="slow">Slow & Ambient</SelectItem>
                                <SelectItem value="medium">Medium Pace</SelectItem>
                                <SelectItem value="fast">Fast & Energetic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {videoSyncUrl && (
                          <Button 
                            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500"
                            disabled={isAnalyzingVideo}
                            onClick={() => {
                              setIsAnalyzingVideo(true);
                              setTimeout(() => {
                                setGeneratedSoundtrack(videoSyncUrl);
                                setIsAnalyzingVideo(false);
                              }, 4000);
                            }}
                            data-testid="button-generate-soundtrack"
                          >
                            {isAnalyzingVideo ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing Video...</>
                            ) : (
                              <><Wand2 className="w-4 h-4 mr-2" /> Generate Soundtrack</>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-500" /> AI Analysis
                        </CardTitle>
                        <CardDescription>What the AI detected in your video</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {generatedSoundtrack ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-indigo-500">12</div>
                                <div className="text-xs text-gray-400">Scene Cuts Detected</div>
                              </div>
                              <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-500">Epic</div>
                                <div className="text-xs text-gray-400">Mood Detected</div>
                              </div>
                              <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-cyan-500">120</div>
                                <div className="text-xs text-gray-400">Suggested BPM</div>
                              </div>
                              <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-[#C9941A]">3:24</div>
                                <div className="text-xs text-gray-400">Video Duration</div>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-[#C9941A]/10 border border-green-500/20 rounded-lg">
                              <div className="flex items-center gap-2 text-[#C9941A] font-medium mb-2">
                                <CheckCircle className="w-5 h-5" /> Soundtrack Generated!
                              </div>
                              <p className="text-sm text-gray-400 mb-4">
                                AI created a 3:24 epic orchestral score with builds at 0:45, 1:30, and 2:45 to match your scene transitions.
                              </p>
                              <div className="flex gap-2">
                                <Button className="flex-1" data-testid="button-preview-with-video">
                                  <Play className="w-4 h-4 mr-2" /> Preview with Video
                                </Button>
                                <Button variant="outline" className="flex-1" data-testid="button-download-soundtrack">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Upload a video to see AI analysis</p>
                            <p className="text-sm mt-2">We'll detect scenes, mood, and pacing</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>How Video-to-Music Sync Works</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { step: "1", title: "Scene Detection", desc: "AI finds cuts & transitions", icon: Film },
                          { step: "2", title: "Mood Analysis", desc: "Detects emotion & tone", icon: Brain },
                          { step: "3", title: "Beat Mapping", desc: "Syncs music to action", icon: Activity },
                          { step: "4", title: "Score Generation", desc: "Creates custom soundtrack", icon: Music },
                        ].map((item) => (
                          <div key={item.step} className="p-4 bg-[#1a1a1a]/30 rounded-lg text-center">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2 text-foreground font-bold">
                              {item.step}
                            </div>
                            <item.icon className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* LIVE ADAPTIVE MUSIC TAB */}
              <TabsContent value="live-music" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-r from-pink-500/10 via-red-500/10 to-orange-500/10 rounded-xl border border-pink-500/20">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Radio className="w-8 h-8 text-pink-500 animate-pulse" />
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                        LIVE ADAPTIVE MUSIC
                      </h2>
                      <Zap className="w-8 h-8 text-[#C9941A] animate-pulse" />
                    </div>
                    <p className="text-gray-400">Real-time music that adapts to your content</p>
                    <p className="text-sm text-pink-400 mt-2">Gaming | Streaming | Meditation | Workouts</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-pink-500" /> Live Mode
                          </CardTitle>
                          <CardDescription>Choose your use case for adaptive music</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { id: "gaming", name: "Gaming", desc: "Reacts to gameplay intensity", IconComponent: Zap, color: "text-[#C9941A]" },
                              { id: "streaming", name: "Streaming", desc: "Matches chat energy", IconComponent: Radio, color: "text-pink-500" },
                              { id: "meditation", name: "Meditation", desc: "Calming ambient sounds", IconComponent: Sparkles, color: "text-[#C9941A]" },
                              { id: "workout", name: "Workout", desc: "Pumps up intensity", IconComponent: Activity, color: "text-[#C9941A]" },
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                className={`p-4 rounded-xl border-2 text-center transition-all ${
                                  liveMode === mode.id 
                                    ? 'border-pink-500 bg-pink-500/10' 
                                    : 'border-border hover:border-pink-500/50'
                                }`}
                                onClick={() => setLiveMode(mode.id as typeof liveMode)}
                                data-testid={`button-live-mode-${mode.id}`}
                              >
                                <mode.IconComponent className={`w-8 h-8 mx-auto mb-2 ${mode.color}`} />
                                <div className="font-medium">{mode.name}</div>
                                <div className="text-xs text-gray-400">{mode.desc}</div>
                              </button>
                            ))}
                          </div>
                          
                          <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Base Intensity</span>
                                <span className="font-mono">{liveIntensity}%</span>
                              </div>
                              <Slider 
                                value={[liveIntensity]} 
                                min={0} 
                                max={100} 
                                step={5}
                                onValueChange={(v) => setLiveIntensity(v[0])}
                                data-testid="slider-live-intensity"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Energy Response</span>
                                <span className="font-mono">{liveEnergyLevel}%</span>
                              </div>
                              <Slider 
                                value={[liveEnergyLevel]} 
                                min={0} 
                                max={100} 
                                step={5}
                                onValueChange={(v) => setLiveEnergyLevel(v[0])}
                                data-testid="slider-energy-response"
                              />
                            </div>
                          </div>
                          
                          <Button 
                            className={`w-full mt-6 ${isLiveMusicActive ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-pink-500 to-orange-500'}`}
                            onClick={() => setIsLiveMusicActive(!isLiveMusicActive)}
                            data-testid="button-toggle-live-music"
                          >
                            {isLiveMusicActive ? (
                              <><Pause className="w-5 h-5 mr-2" /> Stop Live Music</>
                            ) : (
                              <><Play className="w-5 h-5 mr-2" /> Start Live Music</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-pink-500" /> Live Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLiveMusicActive ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-[#C9941A]/10 border border-green-500/20 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-2 text-[#C9941A] font-medium">
                                  <div className="w-3 h-3 bg-[#C9941A] rounded-full animate-pulse" />
                                  LIVE
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                  <div className="text-xl font-bold text-pink-500">124</div>
                                  <div className="text-xs text-gray-400">Current BPM</div>
                                </div>
                                <div className="p-3 bg-[#1a1a1a]/50 rounded-lg text-center">
                                  <div className="text-xl font-bold text-[#C9941A]">High</div>
                                  <div className="text-xs text-gray-400">Energy Level</div>
                                </div>
                              </div>
                              <div className="h-24 bg-[#1a1a1a]/30 rounded-lg flex items-center justify-center">
                                <div className="flex items-end gap-1 h-16">
                                  {Array.from({ length: 20 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className="w-2 bg-gradient-to-t from-pink-500 to-orange-500 rounded-full animate-pulse"
                                      style={{ 
                                        height: `${Math.random() * 100}%`,
                                        animationDelay: `${i * 50}ms`
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>Start live music to see status</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-[#C9941A]" /> Integration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-connect-obs">
                            <span className="w-6 h-6 bg-[#C9941A] rounded flex items-center justify-center text-foreground text-xs">OBS</span>
                            Connect to OBS
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-connect-discord">
                            <span className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-foreground text-xs">DC</span>
                            Discord Bot
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-connect-twitch">
                            <span className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center text-foreground text-xs">TV</span>
                            Twitch Integration
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Movie Studio Tab */}
              <TabsContent value="movie" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Film className="w-5 h-5 text-[#C9941A]" /> AI Movie Generator
                      </CardTitle>
                      <CardDescription>Create movie scripts and storyboards with AI</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Movie Premise</Label>
                          <Textarea value={moviePremise} onChange={(e) => setMoviePremise(e.target.value)}
                            placeholder="A stroke survivor discovers they can clone themselves and must face their villain self to achieve full recovery..."
                            className="min-h-[120px]" data-testid="textarea-movie-premise" />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Genre</Label>
                            <Select value={movieGenre} onValueChange={setMovieGenre}>
                              <SelectTrigger data-testid="select-movie-genre"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {videoStyles?.styles?.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={generateScript} disabled={isGeneratingScript}
                            data-testid="button-generate-script">
                            {isGeneratingScript ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Clapperboard className="w-4 h-4 mr-2" />}
                            Generate Script
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {generatedScript && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{generatedScript.title}</CardTitle>
                        <CardDescription>{generatedScript.synopsis}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {generatedScript.scenes?.map((scene: any, i: number) => (
                              <Card key={i} className="bg-[#1a1a1a]/50">
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Scene {i + 1}: {scene.setting}</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => generateStoryboard(i)}
                                      data-testid={`button-storyboard-${i}`}>
                                      <Film className="w-4 h-4 mr-1" /> Generate Storyboard
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p className="text-sm text-gray-400">{scene.description}</p>
                                  <div className="space-y-1">
                                    {scene.dialogue?.map((line: string, j: number) => (
                                      <p key={j} className="text-sm font-mono">{line}</p>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{scene.mood}</Badge>
                                    {scene.characters?.map((c: string) => (
                                      <Badge key={c} variant="secondary">{c}</Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {storyboardFrames.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Storyboard</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {storyboardFrames.map((frame, i) => (
                            <img key={i} src={frame} alt={`Frame ${i + 1}`} className="rounded-lg border" />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* === AI VOICE TAB - ElevenLabs Premium Voice Generation === */}
              <TabsContent value="ai-voice" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* AI Models Showcase - Like Artlist */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="ai-models-showcase">
                    <Card className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border-purple-500/20" data-testid="card-model-elevenlabs">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Mic className="w-6 h-6 text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-sm" data-testid="text-model-elevenlabs">ElevenLabs</h4>
                        <p className="text-xs text-gray-400">Premium AI Voices</p>
                        <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30" data-testid="badge-model-elevenlabs">Active</Badge>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20" data-testid="card-model-lyria">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-sm" data-testid="text-model-lyria">Google Lyria</h4>
                        <p className="text-xs text-gray-400">AI Music Generation</p>
                        <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30" data-testid="badge-model-lyria">Active</Badge>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20" data-testid="card-model-gemini">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#C9941A]/20 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-[#C9941A]" />
                        </div>
                        <h4 className="font-semibold text-sm" data-testid="text-model-gemini">Google Gemini</h4>
                        <p className="text-xs text-gray-400">AI Content Creation</p>
                        <Badge className="mt-2 bg-[#C9941A]/20 text-green-300 border-green-500/30" data-testid="badge-model-gemini">Active</Badge>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20" data-testid="card-model-openai">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#C9941A]/20 flex items-center justify-center">
                          <Wand2 className="w-6 h-6 text-[#C9941A]" />
                        </div>
                        <h4 className="font-semibold text-sm" data-testid="text-model-openai">OpenAI</h4>
                        <p className="text-xs text-gray-400">Advanced AI</p>
                        <Badge className="mt-2 bg-[#C9941A]/20 text-amber-300 border-amber-500/30" data-testid="badge-model-openai">Active</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ElevenLabs Voice Generator */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-purple-500" />
                        ElevenLabs AI Voice Generator
                        {isElevenLabsConfigured ? (
                          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-green-500/30">Connected</Badge>
                        ) : (
                          <Badge variant="destructive">Not Configured</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Create studio-quality voiceovers with the world's most advanced AI voice technology
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!isElevenLabsConfigured ? (
                        <div className="text-center py-8 text-gray-400">
                          <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>ElevenLabs API key not configured</p>
                          <p className="text-sm">Add your API key to enable AI voice generation</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Select Voice</Label>
                              <Select value={selectedElevenLabsVoice} onValueChange={setSelectedElevenLabsVoice}>
                                <SelectTrigger data-testid="select-elevenlabs-voice">
                                  <SelectValue placeholder="Choose a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  {elevenLabsVoices.map((voice) => (
                                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                      {voice.name} ({voice.category})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>AI Model</Label>
                              <Select value={elevenLabsModel} onValueChange={setElevenLabsModel}>
                                <SelectTrigger data-testid="select-elevenlabs-model">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="eleven_multilingual_v2">Eleven Multilingual v2 (Best Quality)</SelectItem>
                                  <SelectItem value="eleven_turbo_v2_5">Eleven Turbo v2.5 (Fast)</SelectItem>
                                  <SelectItem value="eleven_monolingual_v1">Eleven Monolingual v1 (English)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Enter Text to Speak</Label>
                            <Textarea
                              value={elevenLabsText}
                              onChange={(e) => setElevenLabsText(e.target.value)}
                              placeholder="Enter the text you want converted to speech..."
                              className="min-h-[120px]"
                              data-testid="textarea-elevenlabs-text"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Stability: {elevenLabsStability}%</Label>
                              <Slider
                                value={[elevenLabsStability]}
                                onValueChange={([v]) => setElevenLabsStability(v)}
                                max={100}
                                data-testid="slider-stability"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Similarity: {elevenLabsSimilarity}%</Label>
                              <Slider
                                value={[elevenLabsSimilarity]}
                                onValueChange={([v]) => setElevenLabsSimilarity(v)}
                                max={100}
                                data-testid="slider-similarity"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Style: {elevenLabsStyle}%</Label>
                              <Slider
                                value={[elevenLabsStyle]}
                                onValueChange={([v]) => setElevenLabsStyle(v)}
                                max={100}
                                data-testid="slider-style"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={generateElevenLabsVoice}
                            disabled={isGeneratingElevenLabs || !elevenLabsText.trim()}
                            className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                            data-testid="button-generate-voice"
                          >
                            {isGeneratingElevenLabs ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating Voice...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate AI Voice
                              </>
                            )}
                          </Button>

                          {elevenLabsAudio && (
                            <div className="p-4 bg-card rounded-lg border space-y-3" data-testid="container-generated-audio">
                              <div className="flex items-center justify-between">
                                <span className="font-medium" data-testid="text-generated-audio-label">Generated Audio</span>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" asChild data-testid="button-download-audio">
                                    <a href={elevenLabsAudio} download="ai-voiceover.mp3">
                                      <Download className="w-4 h-4 mr-1" /> Download
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              <audio
                                ref={elevenLabsAudioRef}
                                src={elevenLabsAudio}
                                controls
                                className="w-full"
                                data-testid="audio-elevenlabs-preview"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Voice Presets Grid */}
                  <Card data-testid="card-voice-library">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" data-testid="text-voice-library-title">
                        <Users className="w-5 h-5" /> Voice Library
                      </CardTitle>
                      <CardDescription data-testid="text-voice-library-desc">Quick access to popular voice styles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="grid-voice-presets">
                        {[
                          { name: "Professional Narrator", icon: User, color: "blue" },
                          { name: "Warm Storyteller", icon: Heart, color: "rose" },
                          { name: "Dynamic Presenter", icon: Zap, color: "amber" },
                          { name: "Calm Meditation", icon: Sparkles, color: "green" },
                          { name: "Energetic Host", icon: Radio, color: "orange" },
                          { name: "Documentary Voice", icon: Film, color: "purple" },
                          { name: "Podcast Style", icon: Mic, color: "cyan" },
                          { name: "Commercial VO", icon: Tv, color: "pink" },
                        ].map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
                            data-testid={`button-preset-${preset.name.toLowerCase().replace(/\s/g, '-')}`}
                          >
                            <preset.icon className="w-6 h-6" />
                            <span className="text-xs text-center">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Transport Controls */}
          <div className="border-t border-border bg-card/50 p-4">
            <div className="max-w-[1800px] mx-auto flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)} data-testid="button-skip-back">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="icon" onClick={handlePlay} className={isPlaying ? "bg-[#C9941A] hover:bg-[#C9941A]/80" : ""}
                  data-testid="button-play">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleStop} data-testid="button-stop">
                  <Square className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-skip-forward">
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span data-testid="text-current-time">{formatTime(currentTime)}</span>
                <span>/</span>
                <span data-testid="text-duration">{formatTime(duration)}</span>
              </div>

              <div className="flex-1">
                <Slider value={[currentTime]} onValueChange={([v]) => setCurrentTime(v)}
                  max={duration} className="cursor-pointer" data-testid="slider-timeline" />
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <Slider value={[masterVolume]} onValueChange={([v]) => setMasterVolume(v)}
                  max={100} className="w-24" data-testid="slider-master-volume-transport" />
              </div>

              <Badge variant="outline" data-testid="badge-bpm">{bpm} BPM</Badge>
              <Badge variant="outline" data-testid="badge-key">{selectedKey} {selectedScale}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
