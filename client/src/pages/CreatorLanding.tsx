import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { 
  BookOpen, 
  Music, 
  Video, 
  GraduationCap, 
  FileText,
  Image,
  Sparkles,
  Play,
  Users,
  DollarSign,
  Globe,
  Zap,
  Star,
  ArrowRight,
  Check,
  TrendingUp,
  Mic,
  Palette,
  Film,
  Brain,
  Wand2,
  AudioWaveform,
  ChevronRight,
  BadgeCheck,
  Crown,
  Layers,
  Headphones,
} from "lucide-react";

// AI Models showcased in the landing page
const aiModels = [
  { name: "ElevenLabs", icon: Mic, description: "Premium AI Voices" },
  { name: "Google Lyria", icon: AudioWaveform, description: "AI Music Generation" },
  { name: "Gemini Pro", icon: Brain, description: "Advanced AI Content" },
  { name: "OpenAI GPT-4", icon: Sparkles, description: "Creative Writing" },
  { name: "Sora", icon: Film, description: "AI Video Generation" },
  { name: "DALL-E 3", icon: Image, description: "Image Generation" },
  { name: "Whisper", icon: Headphones, description: "Speech Recognition" },
  { name: "Flux Pro", icon: Wand2, description: "Visual AI" },
];

// 7 Studios data
const studios = [
  {
    icon: BookOpen,
    title: "Book Studio",
    description: "Write, format, and publish professional books with AI. From first draft to Amazon bestseller.",
    features: ["200K+ word manuscript support", "Professional formatting", "Print-on-demand", "KDP-ready export"],
    href: "/book-studio",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  {
    icon: Music,
    title: "Music Studio",
    description: "Professional audio production with AI. Create music, voiceovers, and soundtracks.",
    features: ["Tone.js engine", "Beat Lab", "ElevenLabs voices", "8-band mastering"],
    href: "/music-studio",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  {
    icon: Video,
    title: "Video Studio",
    description: "Cinematic video editing with AI. Auto captions, effects, and professional overlays.",
    features: ["Timeline editing", "AI captions", "Text overlays", "Green screen"],
    href: "/video-studio",
    gradient: "from-red-500/20 to-rose-500/20",
    iconColor: "text-red-400",
    borderColor: "border-red-500/30",
  },
  {
    icon: GraduationCap,
    title: "Course Studio",
    description: "Build and monetize online courses. AI generates curriculum and lessons automatically.",
    features: ["AI curriculum", "Lesson generator", "Quiz builder", "Analytics"],
    href: "/course-studio",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
    borderColor: "border-green-500/30",
  },
  {
    icon: Image,
    title: "Image Studio",
    description: "Professional image editing with AI. Background removal, enhancement, and generation.",
    features: ["Remove.bg integration", "AI enhancement", "Batch editing", "Cover design"],
    href: "/image-studio",
    gradient: "from-purple-500/20 to-violet-500/20",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30",
  },
  {
    icon: FileText,
    title: "Doctrine Engine",
    description: "Transform expertise into structured content. Frameworks, guides, and methodologies.",
    features: ["Expert frameworks", "AI ghostwriting", "Brand voice", "Multi-format"],
    href: "/publishing",
    gradient: "from-cyan-500/20 to-teal-500/20",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
  },
  {
    icon: Globe,
    title: "Website Builder",
    description: "Launch professional websites instantly. Custom domains and hosting included.",
    features: ["Drag-n-drop builder", "Custom domains", "SEO tools", "Analytics"],
    href: "/website-studio",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
    borderColor: "border-pink-500/30",
  },
];

// Stats displayed
const stats = [
  { value: "50M+", label: "Creators Worldwide", icon: Users },
  { value: "$10M+", label: "Creator Earnings", icon: DollarSign },
  { value: "1M+", label: "Projects Created", icon: Layers },
  { value: "150+", label: "Countries", icon: Globe },
];

// Trust logos (major companies)
const trustBadges = [
  "Microsoft", "Adobe", "Google", "Apple", "Amazon", "Spotify",
];

// Testimonials
const testimonials = [
  {
    quote: "I went from struggling writer to published author in 3 weeks. The AI helped me organize my thoughts and the publishing tools handled everything.",
    author: "Sarah M.",
    role: "First-time Author",
    avatar: "S",
    rating: 5,
  },
  {
    quote: "The Music Studio is absolutely incredible. Professional-quality beats in minutes. I've created entire albums using just this platform.",
    author: "Marcus J.",
    role: "Music Producer",
    avatar: "M",
    rating: 5,
  },
  {
    quote: "Built my entire online course in a weekend. The AI generated my curriculum and I just refined it. Already made $15K in sales.",
    author: "Dr. Lisa K.",
    role: "Course Creator",
    avatar: "L",
    rating: 5,
  },
];

export default function CreatorLanding() {
  const [activeToolkit, setActiveToolkit] = useState("music");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Premium Dark Header */}
      <GlobalHeader variant="transparent" />
      
      <main>
        {/* ========================================= */}
        {/* HERO SECTION - Premium Cinematic Style */}
        {/* ========================================= */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Dynamic Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
            {/* Announcement Bar */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm" data-testid="badge-announcement">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80">New! All 7 AI Studios now available</span>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
            
            {/* Main Headline - Artlist.io Style */}
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white mb-6 tracking-tight leading-[1.1]"
              data-testid="text-hero-title"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
            >
              Create any content<br />
              <span className="italic">you can imagine</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
              Get cutting-edge AI for books, music, video, courses, and more.<br />
              The choice of <span className="text-white font-medium">50M+ creators</span> worldwide.
            </p>
            
            {/* CTA Button */}
            <Button 
              size="lg"
              className="px-10 py-6 text-lg font-semibold rounded-full bg-amber-400 hover:bg-amber-300 text-black transition-all duration-300 shadow-lg shadow-amber-400/20"
              data-testid="button-start-free"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Free Now
            </Button>
            
            {/* AI Models Bar */}
            <div className="mt-16 flex flex-wrap justify-center gap-6 px-4" data-testid="ai-models-bar">
              {aiModels.slice(0, 8).map((model) => (
                <div 
                  key={model.name}
                  className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors cursor-default"
                  data-testid={`ai-model-${model.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <model.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{model.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* TRUST BADGES - Major Companies */}
        {/* ========================================= */}
        <section className="py-12 border-y border-white/5 bg-white/[0.02]" data-testid="section-trust">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40">
              {trustBadges.map((brand) => (
                <span key={brand} className="text-xl font-bold text-white tracking-wider" data-testid={`trust-${brand.toLowerCase()}`}>
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* AI TOOLKIT SECTION - Tabbed Showcase */}
        {/* ========================================= */}
        <section className="py-24 relative" data-testid="section-toolkit">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-1 bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium" data-testid="badge-toolkit">
                AI Toolkit
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-4" data-testid="text-toolkit-title">
                The only organized AI platform for creators
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                All the cutting-edge AI tools you need, organized in one powerful toolkit.
              </p>
            </div>

            <Tabs value={activeToolkit} onValueChange={setActiveToolkit} className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full">
                  <TabsTrigger 
                    value="music" 
                    className="px-6 py-2 rounded-full data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                    data-testid="tab-ai-music"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    AI Music
                  </TabsTrigger>
                  <TabsTrigger 
                    value="video" 
                    className="px-6 py-2 rounded-full data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                    data-testid="tab-ai-video"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    AI Video
                  </TabsTrigger>
                  <TabsTrigger 
                    value="voice" 
                    className="px-6 py-2 rounded-full data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                    data-testid="tab-ai-voice"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    AI Voice
                  </TabsTrigger>
                  <TabsTrigger 
                    value="image" 
                    className="px-6 py-2 rounded-full data-[state=active]:bg-amber-400 data-[state=active]:text-black"
                    data-testid="tab-ai-image"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    AI Image
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="music" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 p-1">
                      <div className="rounded-xl bg-[#0a0a0a] p-8 min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Music className="w-12 h-12 text-black" />
                          </div>
                          <h4 className="text-xl font-semibold text-white mb-2">Beat Lab Pro</h4>
                          <p className="text-white/60 text-sm">Tone.js powered professional audio engine</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Drum Machine</Badge>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Synthesizers</Badge>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">8-Band EQ</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                      Professional music production with AI
                    </h3>
                    <p className="text-lg text-white/60">
                      Create studio-quality music, soundtracks, and audio content. Powered by Google Lyria and ElevenLabs for voice generation.
                    </p>
                    <div className="space-y-3">
                      {["Professional Beat Lab with drum machines & synths", "ElevenLabs AI voice generation", "8-band mastering EQ", "Export to any format"].map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-white/80">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-400" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/music-studio">
                      <Button className="mt-4 bg-amber-400 hover:bg-amber-300 text-black font-semibold px-6 gap-2" data-testid="button-explore-music">
                        Explore AI Music
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/20 p-1">
                      <div className="rounded-xl bg-[#0a0a0a] p-8 min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Video className="w-12 h-12 text-white" />
                          </div>
                          <h4 className="text-xl font-semibold text-white mb-2">Video Studio</h4>
                          <p className="text-white/60 text-sm">Cinematic video editing powered by AI</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Auto Captions</Badge>
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Timeline</Badge>
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Effects</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                      Generate cinematic videos with AI
                    </h3>
                    <p className="text-lg text-white/60">
                      Professional video editing with AI-powered features. Auto captions, effects, and seamless export to any platform.
                    </p>
                    <div className="space-y-3">
                      {["AI-powered auto captions", "Professional timeline editing", "Text overlays and effects", "Green screen removal"].map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-white/80">
                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-red-400" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/video-studio">
                      <Button className="mt-4 bg-red-500 hover:bg-red-400 text-white font-semibold px-6 gap-2" data-testid="button-explore-video">
                        Explore AI Video
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="voice" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/20 p-1">
                      <div className="rounded-xl bg-[#0a0a0a] p-8 min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                            <Mic className="w-12 h-12 text-white" />
                          </div>
                          <h4 className="text-xl font-semibold text-white mb-2">AI Voiceover</h4>
                          <p className="text-white/60 text-sm">ElevenLabs premium voice synthesis</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">50+ Voices</Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">29 Languages</Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Voice Cloning</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                      Studio-quality AI voiceovers
                    </h3>
                    <p className="text-lg text-white/60">
                      Premium AI voice generation with ElevenLabs. Available in every major language with natural-sounding delivery.
                    </p>
                    <div className="space-y-3">
                      {["ElevenLabs multilingual v2", "50+ premium voice options", "Voice cloning capability", "Adjustable style and emotion"].map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-white/80">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-purple-400" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/music-studio">
                      <Button className="mt-4 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 gap-2" data-testid="button-explore-voice">
                        Explore AI Voiceover
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 p-1">
                      <div className="rounded-xl bg-[#0a0a0a] p-8 min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Image className="w-12 h-12 text-white" />
                          </div>
                          <h4 className="text-xl font-semibold text-white mb-2">Image Studio</h4>
                          <p className="text-white/60 text-sm">Professional image editing with AI</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Remove.bg</Badge>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">AI Enhance</Badge>
                            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Generation</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                      Turn ideas into standout visuals
                    </h3>
                    <p className="text-lg text-white/60">
                      Professional image editing with AI-powered tools. Background removal, enhancement, and generation in seconds.
                    </p>
                    <div className="space-y-3">
                      {["AI background removal", "Professional enhancement", "Image generation", "Book cover design"].map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-white/80">
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-cyan-400" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/image-studio">
                      <Button className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 gap-2" data-testid="button-explore-image">
                        Explore AI Image
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ========================================= */}
        {/* WHY KREATE SECTION - Stats */}
        {/* ========================================= */}
        <section className="py-24 relative bg-gradient-to-b from-[#0a0a0a] via-amber-950/10 to-[#0a0a0a]" data-testid="section-why">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6" data-testid="text-why-title">
              50M+ creators choose KreAIte
            </h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12 text-white/60">
              <span>The complete creative AI ecosystem</span>
              <span className="hidden md:block">|</span>
              <span>Always evolving with advanced AI models</span>
              <span className="hidden md:block">|</span>
              <span>Built for you to create the impossible</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* 7 STUDIOS GRID */}
        {/* ========================================= */}
        <section className="py-24" data-testid="section-studios">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-1 bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium" data-testid="badge-studios">
                <Zap className="w-3 h-3 mr-1" />
                7 Powerful Studios
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-4" data-testid="text-studios-title">
                High-quality creator studios
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Professional tools for every creative need. Create, publish, and monetize your content.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {studios.map((studio) => (
                <Link key={studio.href} href={studio.href}>
                  <Card 
                    className={`group h-full bg-gradient-to-br ${studio.gradient} border ${studio.borderColor} hover:border-white/30 transition-all duration-300 cursor-pointer`}
                    data-testid={`card-${studio.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <CardContent className="p-6">
                      <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <studio.icon className={`w-5 h-5 ${studio.iconColor}`} />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                        {studio.title}
                      </h3>
                      
                      <p className="text-sm text-white/60 mb-4 line-clamp-2">
                        {studio.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-white/40 group-hover:text-amber-400 transition-colors text-sm">
                        Explore <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* HOW IT WORKS */}
        {/* ========================================= */}
        <section className="py-24 bg-white/[0.02] border-y border-white/5" data-testid="section-how">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4" data-testid="text-how-title">
                From Idea to Income in 3 Steps
              </h2>
              <p className="text-lg text-white/60">
                No technical skills. No expensive equipment. Just you and AI.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-400 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Create</h3>
                <p className="text-white/60">
                  Pick a studio. Tell AI what you want to create. Watch it come to life in minutes.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-400 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Publish</h3>
                <p className="text-white/60">
                  One-click publishing to marketplace, Amazon, Spotify, YouTube, or your own website.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-400 text-black font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Earn</h3>
                <p className="text-white/60">
                  Sell your creations. Keep 85% of earnings. Build passive income while you sleep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* TESTIMONIALS */}
        {/* ========================================= */}
        <section className="py-24" data-testid="section-testimonials">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4" data-testid="text-testimonials-title">
                Creators Are Winning
              </h2>
              <p className="text-lg text-white/60">
                Real people. Real results. Join the movement.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/5 border-white/10" data-testid={`testimonial-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    
                    <p className="text-white/80 mb-6">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-white">{testimonial.author}</div>
                        <div className="text-sm text-white/60">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* FINAL CTA */}
        {/* ========================================= */}
        <section className="py-24 relative" data-testid="section-cta">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/30 to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-5xl font-serif text-white mb-6" data-testid="text-cta-title">
              Everything you need to create without limits
            </h2>
            <p className="text-xl text-white/60 mb-10">
              Join thousands of creators turning their ideas into income. Start free today.
            </p>
            
            <Button 
              size="lg"
              className="px-10 py-6 text-lg font-semibold rounded-full bg-amber-400 hover:bg-amber-300 text-black transition-all duration-300 shadow-lg shadow-amber-400/20"
              data-testid="button-cta-start"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Free Now
            </Button>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
