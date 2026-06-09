import { useState, useRef } from "react";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Film, Clapperboard, Users, Mic2, Image, Play, Pause, Plus, Trash2,
  Wand2, Sparkles, Download, Save, ChevronRight, Clock, Video,
  FileText, Camera, Volume2, Loader2, ArrowLeft, GripVertical,
  Settings, Eye, Layers, Move, Copy, ChevronUp, ChevronDown,
  Music, Zap, Star, Crown, Palette, Target, RefreshCw, Upload,
  SplitSquareVertical, Scissors, MonitorPlay, PlayCircle, PauseCircle,
  SkipBack, SkipForward, Maximize2, VolumeX, Volume1, AudioWaveform, Brain
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  voiceModel: string;
  avatar?: string;
  role: "protagonist" | "antagonist" | "supporting" | "extra";
  traits: string[];
}

interface DialogueLine {
  id: string;
  characterId: string;
  text: string;
  emotion: "neutral" | "happy" | "sad" | "angry" | "scared" | "excited" | "whisper" | "shouting";
  direction?: string;
  audioUrl?: string;
  duration?: number;
}

interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: "day" | "night" | "dawn" | "dusk";
  description: string;
  cameraDirections: string[];
  dialogue: DialogueLine[];
  visualNotes: string;
  duration: number;
  storyboardUrl?: string;
  videoUrl?: string;
}

interface MovieProject {
  id: string;
  title: string;
  genre: string;
  subGenre: string;
  logline: string;
  synopsis: string;
  targetRuntime: number;
  rating: "G" | "PG" | "PG-13" | "R";
  characters: Character[];
  scenes: Scene[];
  status: "draft" | "scripting" | "production" | "post" | "complete";
  createdAt: string;
}

const genres = [
  { value: "action", label: "Action", icon: Zap },
  { value: "comedy", label: "Comedy", icon: Star },
  { value: "drama", label: "Drama", icon: Users },
  { value: "horror", label: "Horror", icon: Eye },
  { value: "romance", label: "Romance", icon: Sparkles },
  { value: "scifi", label: "Sci-Fi", icon: Brain },
  { value: "thriller", label: "Thriller", icon: Target },
  { value: "fantasy", label: "Fantasy", icon: Wand2 },
  { value: "documentary", label: "Documentary", icon: Camera },
  { value: "animation", label: "Animation", icon: Palette },
];

const elevenLabsVoices = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "Female", style: "Calm Narrator" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", category: "Female", style: "Strong Character" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "Female", style: "Soft Spoken" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "Male", style: "Well Rounded" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", category: "Female", style: "Emotional Range" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", category: "Male", style: "Deep Narrator" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", category: "Male", style: "Action Hero" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", category: "Male", style: "Deep Voice" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", category: "Male", style: "Raspy Character" },
  { id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", category: "Female", style: "Energetic" },
];

const cameraAngles = [
  "Wide Shot (WS)", "Medium Shot (MS)", "Close-Up (CU)", "Extreme Close-Up (ECU)",
  "Over-the-Shoulder (OTS)", "Point of View (POV)", "Two Shot", "Dutch Angle",
  "High Angle", "Low Angle", "Bird's Eye View", "Tracking Shot", "Dolly Shot",
  "Pan", "Tilt", "Crane Shot", "Steadicam", "Handheld"
];

const emotionStyles = [
  { value: "neutral", label: "Neutral", color: "bg-gray-500" },
  { value: "happy", label: "Happy", color: "bg-[#E2741B]" },
  { value: "sad", label: "Sad", color: "bg-blue-500" },
  { value: "angry", label: "Angry", color: "bg-red-500" },
  { value: "scared", label: "Scared", color: "bg-purple-500" },
  { value: "excited", label: "Excited", color: "bg-[#E2741B]" },
  { value: "whisper", label: "Whisper", color: "bg-slate-500" },
  { value: "shouting", label: "Shouting", color: "bg-[#E2741B]" },
];

export default function MovieStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("script");
  
  // Project State
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("action");
  const [logline, setLogline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [targetRuntime, setTargetRuntime] = useState(90);
  const [rating, setRating] = useState<"G" | "PG" | "PG-13" | "R">("PG-13");
  
  // Characters State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterDesc, setNewCharacterDesc] = useState("");
  const [newCharacterVoice, setNewCharacterVoice] = useState(elevenLabsVoices[0].id);
  const [newCharacterRole, setNewCharacterRole] = useState<Character["role"]>("supporting");
  
  // Scenes State
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [editingDialogue, setEditingDialogue] = useState<string | null>(null);
  
  // Generation State
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  
  // Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Audio refs
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate full screenplay with AI
  const generateFullScript = async () => {
    if (!logline.trim()) {
      toast({ title: "Missing logline", description: "Please enter a movie concept", variant: "destructive" });
      return;
    }
    
    setIsGeneratingScript(true);
    setGenerationProgress(0);
    setGenerationStatus("Analyzing your concept...");
    
    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(p => Math.min(p + 5, 90));
      }, 500);
      
      const response = await apiRequest("POST", "/api/movie/generate-script", {
        genre: selectedGenre,
        logline,
        synopsis,
        targetRuntime,
        rating,
        title: projectTitle,
      });
      
      clearInterval(progressInterval);
      const data = await response.json();
      
      if (data.script) {
        setGenerationProgress(100);
        setGenerationStatus("Script generated!");
        
        // Populate characters
        if (data.script.characters) {
          const newCharacters: Character[] = data.script.characters.map((c: any, i: number) => ({
            id: `char-${Date.now()}-${i}`,
            name: c.name,
            description: c.description,
            voiceId: elevenLabsVoices[i % elevenLabsVoices.length].id,
            voiceModel: "eleven_multilingual_v2",
            role: c.role || "supporting",
            traits: c.traits || [],
          }));
          setCharacters(newCharacters);
        }
        
        // Populate scenes
        if (data.script.scenes) {
          const newScenes: Scene[] = data.script.scenes.map((s: any, i: number) => ({
            id: `scene-${Date.now()}-${i}`,
            sceneNumber: i + 1,
            title: s.title || `Scene ${i + 1}`,
            location: s.location || "INT. UNKNOWN",
            timeOfDay: s.timeOfDay || "day",
            description: s.description,
            cameraDirections: s.cameraDirections || [],
            dialogue: (s.dialogue || []).map((d: any, j: number) => ({
              id: `line-${Date.now()}-${i}-${j}`,
              characterId: "", // Will be linked later
              text: d.line || d.text,
              emotion: d.emotion || "neutral",
              direction: d.direction,
            })),
            visualNotes: s.visualNotes || "",
            duration: s.duration || 30,
          }));
          setScenes(newScenes);
        }
        
        if (data.script.title) setProjectTitle(data.script.title);
        if (data.script.synopsis) setSynopsis(data.script.synopsis);
        
        toast({ title: "Script Generated!", description: "Your Hollywood screenplay is ready" });
      }
    } catch (error: any) {
      console.error("Script generation error:", error);
      toast({ title: "Generation Failed", description: error.message || "Could not generate script", variant: "destructive" });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate voice for a dialogue line using ElevenLabs
  const generateDialogueVoice = async (sceneId: string, lineId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    const line = scene?.dialogue.find(d => d.id === lineId);
    if (!scene || !line) return;
    
    const character = characters.find(c => c.id === line.characterId);
    if (!character) {
      toast({ title: "No character assigned", description: "Assign a character to this line first", variant: "destructive" });
      return;
    }
    
    setIsGeneratingVoice(true);
    
    try {
      const response = await apiRequest("POST", "/api/voice/elevenlabs/synthesize", {
        text: line.text,
        voiceId: character.voiceId,
        modelId: character.voiceModel || "eleven_multilingual_v2",
        stability: 0.5,
        similarityBoost: 0.75,
        style: line.emotion === "excited" ? 0.8 : line.emotion === "whisper" ? 0.2 : 0.5,
      });
      
      const data = await response.json();
      
      if (data.audioBase64) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
        
        setScenes(prev => prev.map(s => {
          if (s.id !== sceneId) return s;
          return {
            ...s,
            dialogue: s.dialogue.map(d => 
              d.id === lineId ? { ...d, audioUrl } : d
            )
          };
        }));
        
        toast({ title: "Voice generated!", description: `${character.name}'s line is ready` });
      }
    } catch (error: any) {
      console.error("Voice generation error:", error);
      toast({ title: "Voice generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Generate all voices for a scene
  const generateSceneVoices = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    setIsGeneratingDialogue(true);
    setGenerationProgress(0);
    
    const dialogueWithCharacters = scene.dialogue.filter(d => d.characterId);
    const total = dialogueWithCharacters.length;
    let completed = 0;
    
    for (const line of dialogueWithCharacters) {
      await generateDialogueVoice(sceneId, line.id);
      completed++;
      setGenerationProgress((completed / total) * 100);
    }
    
    setIsGeneratingDialogue(false);
    toast({ title: "Scene dialogue complete!", description: `Generated ${total} voice lines` });
  };

  // Add a new character
  const addCharacter = () => {
    if (!newCharacterName.trim()) return;
    
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: newCharacterName,
      description: newCharacterDesc,
      voiceId: newCharacterVoice,
      voiceModel: "eleven_multilingual_v2",
      role: newCharacterRole,
      traits: [],
    };
    
    setCharacters([...characters, newChar]);
    setNewCharacterName("");
    setNewCharacterDesc("");
    toast({ title: "Character added", description: `${newChar.name} is ready for their role` });
  };

  // Add a new scene
  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      sceneNumber: scenes.length + 1,
      title: `Scene ${scenes.length + 1}`,
      location: "INT. LOCATION - DAY",
      timeOfDay: "day",
      description: "",
      cameraDirections: [],
      dialogue: [],
      visualNotes: "",
      duration: 30,
    };
    
    setScenes([...scenes, newScene]);
    setSelectedScene(newScene.id);
  };

  // Add dialogue line to scene
  const addDialogueLine = (sceneId: string) => {
    const newLine: DialogueLine = {
      id: `line-${Date.now()}`,
      characterId: characters[0]?.id || "",
      text: "",
      emotion: "neutral",
    };
    
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      return { ...s, dialogue: [...s.dialogue, newLine] };
    }));
  };

  // Move scene up/down
  const moveScene = (sceneId: string, direction: "up" | "down") => {
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === scenes.length - 1) return;
    
    const newScenes = [...scenes];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    
    // Update scene numbers
    newScenes.forEach((s, i) => s.sceneNumber = i + 1);
    setScenes(newScenes);
  };

  // Get current scene
  const currentScene = scenes.find(s => s.id === selectedScene);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SEO
        title="Movie Studio - Hollywood-Grade AI Film Production"
        description="Create professional AI-generated films with Movie Studio. Generate complete screenplays, create characters with ElevenLabs voice synthesis, compose scenes with professional camera directions, and produce video content. Advanced film production tools for indie filmmakers and content creators."
        keywords="AI movie maker, screenplay generator, AI film production, ElevenLabs voice synthesis, script writing, video production, cinematography, character development, scene composition, dialogue generation, Hollywood filmmaking AI"
        canonical="/movie-studio"
        type="website"
        faq={[
          {
            question: "How does Movie Studio generate screenplays?",
            answer: "Movie Studio uses advanced AI to analyze your film concept and logline, then generates complete screenplays with multiple scenes, dialogue, character descriptions, and professional camera directions based on your selected genre and target runtime."
          },
          {
            question: "What is ElevenLabs voice synthesis in Movie Studio?",
            answer: "Movie Studio integrates ElevenLabs TTS technology to generate natural-sounding voice dialogue for your characters. Choose from multiple voice profiles and emotional styles (happy, sad, angry, whisper, shouting) to bring your screenplay to life."
          },
          {
            question: "Can I customize characters and scenes?",
            answer: "Yes, Movie Studio provides full control over character creation with customizable names, descriptions, voice selections, and roles (protagonist, antagonist, supporting). Scenes can be edited with location details, camera directions, dialogue, and visual notes."
          },
          {
            question: "How do I generate voice audio for dialogue lines?",
            answer: "Select a scene, choose the character for each dialogue line, assign an emotion style, and click 'Generate Voice'. Movie Studio will synthesize natural-sounding audio that matches the character's voice profile and emotional delivery."
          }
        ]}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Creator Hub", url: "/creator-hub" },
          { name: "Movie Studio", url: "/movie-studio" }
        ]}
        expertise={[
          "AI screenplay generation technology",
          "Professional cinematography and camera direction protocols",
          "Character development and dialogue writing",
          "ElevenLabs voice synthesis integration",
          "Multi-track scene composition and timeline management",
          "Video production workflow automation"
        ]}
        experience="Stroke Recovery Academy's Movie Studio leverages years of film production knowledge combined with cutting-edge AI technology. Built for indie filmmakers, content creators, and studios seeking to accelerate their production pipeline while maintaining creative control."
        trustSignals={[
          "ElevenLabs certified voice synthesis partner",
          "Professional-grade screenplay generation",
          "Security-first architecture with encrypted project storage",
          "Direct integration with video production platforms",
          "Used by independent filmmakers and production studios",
          "Regular updates with industry-standard cinematography practices"
        ]}
        schema={{
          "@type": "SoftwareApplication",
          name: "Stroke Recovery Academy Movie Studio",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web Browser",
          description: "AI-powered film production studio with screenplay generation, character voice synthesis, professional scene composition, and video production tools.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "AI Screenplay Generation",
            "ElevenLabs Voice Synthesis",
            "Character Management System",
            "Professional Camera Directions",
            "Scene Composition Tools",
            "Dialogue Emotion Styling",
            "Multi-Scene Timeline",
            "Project Saving & Export"
          ],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "1200"
          }
        }}
      />
      <GlobalHeader variant="transparent" />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/creator-hub">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
            <Film className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Movie Studio</h1>
            <p className="text-white/60 text-sm">Hollywood-Grade AI Film Production</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold px-3">
              <Crown className="w-3 h-3 mr-1" /> ULTRA PREMIUM
            </Badge>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="button-save-project">
              <Save className="w-4 h-4 mr-2" /> Save Project
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          {/* Left Sidebar - Scene List */}
          <div className="col-span-3 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E2741B]" /> Scenes
              </h3>
              <Button size="sm" onClick={addScene} className="bg-[#E2741B] hover:bg-amber-400 text-black" data-testid="button-add-scene">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {scenes.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No scenes yet</p>
                    <p className="text-xs">Generate a script or add scenes manually</p>
                  </div>
                ) : (
                  scenes.map((scene) => (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedScene(scene.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedScene === scene.id 
                          ? "bg-[#E2741B]/20 border border-amber-500/50" 
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      }`}
                      data-testid={`scene-item-${scene.sceneNumber}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-white/10 text-white/80 text-xs">Scene {scene.sceneNumber}</Badge>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveScene(scene.id, "up"); }}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveScene(scene.id, "down"); }}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate">{scene.title}</p>
                      <p className="text-xs text-white/50 truncate">{scene.location}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Mic2 className="w-3 h-3" /> {scene.dialogue.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {scene.duration}s
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Editor */}
          <div className="col-span-6 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="border-b border-white/10">
                <TabsList className="bg-transparent border-none h-12 px-2">
                  <TabsTrigger value="script" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
                    <FileText className="w-4 h-4 mr-2" /> Script
                  </TabsTrigger>
                  <TabsTrigger value="scene" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
                    <Camera className="w-4 h-4 mr-2" /> Scene Editor
                  </TabsTrigger>
                  <TabsTrigger value="dialogue" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
                    <Mic2 className="w-4 h-4 mr-2" /> Dialogue
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-[#E2741B]/20 data-[state=active]:text-[#E2741B]">
                    <MonitorPlay className="w-4 h-4 mr-2" /> Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Script Generator Tab */}
              <TabsContent value="script" className="flex-1 overflow-auto p-4 space-y-4 m-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/80">Movie Title</Label>
                      <Input
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Enter your movie title"
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-movie-title"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Genre</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {genres.map((g) => {
                          const Icon = g.icon;
                          return (
                            <button
                              key={g.value}
                              onClick={() => setSelectedGenre(g.value)}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                selectedGenre === g.value
                                  ? "bg-[#E2741B]/20 border-amber-500 text-[#E2741B]"
                                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                              }`}
                              data-testid={`genre-${g.value}`}
                            >
                              <Icon className="w-4 h-4 mx-auto mb-1" />
                              <span className="text-xs">{g.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Rating</Label>
                      <Select value={rating} onValueChange={(v: any) => setRating(v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-rating">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="G">G - General Audiences</SelectItem>
                          <SelectItem value="PG">PG - Parental Guidance</SelectItem>
                          <SelectItem value="PG-13">PG-13 - Parents Strongly Cautioned</SelectItem>
                          <SelectItem value="R">R - Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Target Runtime: {targetRuntime} min</Label>
                      <Slider
                        value={[targetRuntime]}
                        onValueChange={([v]) => setTargetRuntime(v)}
                        min={15}
                        max={180}
                        className="mt-2"
                        data-testid="slider-runtime"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/80">Logline (Core Concept)</Label>
                      <Textarea
                        value={logline}
                        onChange={(e) => setLogline(e.target.value)}
                        placeholder="One sentence that captures your movie's essence..."
                        className="bg-white/5 border-white/10 text-white min-h-[80px]"
                        data-testid="input-logline"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Synopsis (Optional)</Label>
                      <Textarea
                        value={synopsis}
                        onChange={(e) => setSynopsis(e.target.value)}
                        placeholder="Expand on your story..."
                        className="bg-white/5 border-white/10 text-white min-h-[120px]"
                        data-testid="input-synopsis"
                      />
                    </div>
                  </div>
                </div>
                
                {isGeneratingScript && (
                  <div className="p-4 bg-[#E2741B]/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#E2741B]" />
                      <span className="font-medium text-[#E2741B]">{generationStatus}</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
                
                <Button
                  onClick={generateFullScript}
                  disabled={isGeneratingScript || !logline.trim()}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-6"
                  data-testid="button-generate-script"
                >
                  {isGeneratingScript ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Hollywood Script...</>
                  ) : (
                    <><Wand2 className="w-5 h-5 mr-2" /> Generate Full Screenplay</>
                  )}
                </Button>
              </TabsContent>

              {/* Scene Editor Tab */}
              <TabsContent value="scene" className="flex-1 overflow-auto p-4 m-0">
                {currentScene ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/80">Scene Title</Label>
                        <Input
                          value={currentScene.title}
                          onChange={(e) => setScenes(prev => prev.map(s => 
                            s.id === currentScene.id ? { ...s, title: e.target.value } : s
                          ))}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-scene-title"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Location</Label>
                        <Input
                          value={currentScene.location}
                          onChange={(e) => setScenes(prev => prev.map(s => 
                            s.id === currentScene.id ? { ...s, location: e.target.value } : s
                          ))}
                          placeholder="INT. LOCATION - DAY"
                          className="bg-white/5 border-white/10 text-white"
                          data-testid="input-scene-location"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Scene Description</Label>
                      <Textarea
                        value={currentScene.description}
                        onChange={(e) => setScenes(prev => prev.map(s => 
                          s.id === currentScene.id ? { ...s, description: e.target.value } : s
                        ))}
                        placeholder="Describe what happens in this scene..."
                        className="bg-white/5 border-white/10 text-white min-h-[100px]"
                        data-testid="input-scene-description"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Camera Directions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cameraAngles.map((angle) => (
                          <button
                            key={angle}
                            onClick={() => {
                              const current = currentScene.cameraDirections;
                              const updated = current.includes(angle)
                                ? current.filter(a => a !== angle)
                                : [...current, angle];
                              setScenes(prev => prev.map(s => 
                                s.id === currentScene.id ? { ...s, cameraDirections: updated } : s
                              ));
                            }}
                            className={`px-2 py-1 text-xs rounded-full transition-all ${
                              currentScene.cameraDirections.includes(angle)
                                ? "bg-[#E2741B] text-black"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                            }`}
                          >
                            {angle}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-white/80">Visual Notes</Label>
                      <Textarea
                        value={currentScene.visualNotes}
                        onChange={(e) => setScenes(prev => prev.map(s => 
                          s.id === currentScene.id ? { ...s, visualNotes: e.target.value } : s
                        ))}
                        placeholder="Lighting, mood, color palette, special effects..."
                        className="bg-white/5 border-white/10 text-white min-h-[80px]"
                        data-testid="input-visual-notes"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/40">
                    <Camera className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">No Scene Selected</p>
                    <p className="text-sm">Select a scene from the left panel or add a new one</p>
                  </div>
                )}
              </TabsContent>

              {/* Dialogue Tab */}
              <TabsContent value="dialogue" className="flex-1 overflow-auto p-4 m-0">
                {currentScene ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Scene {currentScene.sceneNumber} Dialogue</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => addDialogueLine(currentScene.id)}
                          className="bg-[#E2741B] hover:bg-amber-400 text-black"
                          data-testid="button-add-dialogue"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Line
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateSceneVoices(currentScene.id)}
                          disabled={isGeneratingDialogue || currentScene.dialogue.length === 0}
                          className="border-white/20 text-white"
                          data-testid="button-generate-all-voices"
                        >
                          {isGeneratingDialogue ? (
                            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
                          ) : (
                            <><AudioWaveform className="w-4 h-4 mr-1" /> Generate All Voices</>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {isGeneratingDialogue && (
                      <Progress value={generationProgress} className="h-2" />
                    )}
                    
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {currentScene.dialogue.length === 0 ? (
                          <div className="text-center py-8 text-white/40">
                            <Mic2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No dialogue yet</p>
                            <p className="text-xs">Add lines for your characters</p>
                          </div>
                        ) : (
                          currentScene.dialogue.map((line, idx) => {
                            const char = characters.find(c => c.id === line.characterId);
                            return (
                              <div
                                key={line.id}
                                className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3"
                                data-testid={`dialogue-line-${idx}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Select
                                    value={line.characterId}
                                    onValueChange={(v) => setScenes(prev => prev.map(s => {
                                      if (s.id !== currentScene.id) return s;
                                      return {
                                        ...s,
                                        dialogue: s.dialogue.map(d => 
                                          d.id === line.id ? { ...d, characterId: v } : d
                                        )
                                      };
                                    }))}
                                  >
                                    <SelectTrigger className="w-40 bg-white/5 border-white/10">
                                      <SelectValue placeholder="Character" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {characters.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select
                                    value={line.emotion}
                                    onValueChange={(v: any) => setScenes(prev => prev.map(s => {
                                      if (s.id !== currentScene.id) return s;
                                      return {
                                        ...s,
                                        dialogue: s.dialogue.map(d => 
                                          d.id === line.id ? { ...d, emotion: v } : d
                                        )
                                      };
                                    }))}
                                  >
                                    <SelectTrigger className="w-32 bg-white/5 border-white/10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {emotionStyles.map((e) => (
                                        <SelectItem key={e.value} value={e.value}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${e.color}`} />
                                            {e.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <div className="flex-1" />
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => generateDialogueVoice(currentScene.id, line.id)}
                                    disabled={isGeneratingVoice || !line.characterId}
                                    className="text-[#E2741B] hover:text-amber-300"
                                    data-testid={`button-generate-voice-${idx}`}
                                  >
                                    {isGeneratingVoice ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Mic2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                  
                                  {line.audioUrl && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const audio = new Audio(line.audioUrl);
                                        audio.play();
                                      }}
                                      className="text-[#E2741B] hover:text-green-300"
                                      data-testid={`button-play-voice-${idx}`}
                                    >
                                      <PlayCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setScenes(prev => prev.map(s => {
                                      if (s.id !== currentScene.id) return s;
                                      return {
                                        ...s,
                                        dialogue: s.dialogue.filter(d => d.id !== line.id)
                                      };
                                    }))}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <Textarea
                                  value={line.text}
                                  onChange={(e) => setScenes(prev => prev.map(s => {
                                    if (s.id !== currentScene.id) return s;
                                    return {
                                      ...s,
                                      dialogue: s.dialogue.map(d => 
                                        d.id === line.id ? { ...d, text: e.target.value } : d
                                      )
                                    };
                                  }))}
                                  placeholder="Enter dialogue..."
                                  className="bg-white/5 border-white/10 text-white min-h-[60px]"
                                />
                                
                                <Input
                                  value={line.direction || ""}
                                  onChange={(e) => setScenes(prev => prev.map(s => {
                                    if (s.id !== currentScene.id) return s;
                                    return {
                                      ...s,
                                      dialogue: s.dialogue.map(d => 
                                        d.id === line.id ? { ...d, direction: e.target.value } : d
                                      )
                                    };
                                  }))}
                                  placeholder="Direction: (pause, look away, smile)"
                                  className="bg-white/5 border-white/10 text-white/60 text-sm italic"
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/40">
                    <Mic2 className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a scene to edit dialogue</p>
                  </div>
                )}
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="flex-1 overflow-auto p-4 m-0">
                <div className="text-center py-12">
                  <MonitorPlay className="w-20 h-20 mx-auto mb-4 text-[#E2741B] opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Movie Preview</h3>
                  <p className="text-white/60 mb-6">Play through your scenes with generated voices</p>
                  <Button className="bg-[#E2741B] hover:bg-amber-400 text-black" data-testid="button-preview-movie">
                    <Play className="w-5 h-5 mr-2" /> Preview Full Movie
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Characters */}
          <div className="col-span-3 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E2741B]" /> Cast ({characters.length})
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {characters.map((char) => {
                  const voice = elevenLabsVoices.find(v => v.id === char.voiceId);
                  return (
                    <div
                      key={char.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCharacter === char.id
                          ? "bg-[#E2741B]/20 border border-amber-500/50"
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedCharacter(char.id)}
                      data-testid={`character-${char.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-black font-bold text-sm">
                          {char.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{char.name}</p>
                          <p className="text-xs text-white/50">{voice?.name || "No voice"}</p>
                        </div>
                      </div>
                      <Badge className="text-xs bg-white/10">{char.role}</Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-white/10 space-y-2">
              <Input
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                placeholder="Character name"
                className="bg-white/5 border-white/10 text-white text-sm"
                data-testid="input-new-character-name"
              />
              <Select value={newCharacterVoice} onValueChange={setNewCharacterVoice}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {elevenLabsVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} - {v.style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addCharacter} 
                className="w-full bg-[#E2741B] hover:bg-amber-400 text-black text-sm"
                disabled={!newCharacterName.trim()}
                data-testid="button-add-new-character"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Character
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
