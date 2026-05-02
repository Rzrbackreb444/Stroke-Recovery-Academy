import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
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
  Loader2,
  Smartphone,
  Brain,
  Shield,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";

const studios = [
  {
    icon: Smartphone,
    title: "Mobile Writing Studio",
    description: "Thumb-friendly editor with AI inline actions, voice-to-text, and cross-device sync.",
    features: ["Swipe navigation", "Voice dictation", "Project Brain", "Multi-format export"],
    href: "/mobile-studio",
    gradient: "from-violet-500 to-purple-600",
    badge: "NEW",
  },
  {
    icon: BookOpen,
    title: "Book Studio",
    description: "Write, format, and publish books with AI assistance. From outline to Amazon in hours.",
    features: ["AI-powered writing", "Professional formatting", "Print-on-demand", "EPUB/PDF export"],
    href: "/book-studio",
    gradient: "from-[#C9941A] to-[#8B6914]",
    badge: null,
  },
  {
    icon: Music,
    title: "Music Studio",
    description: "Create professional music, voice clones, and audio content. No experience required.",
    features: ["AI music generation", "Voice cloning", "Sound effects", "Podcast editing"],
    href: "/music-studio",
    gradient: "from-pink-500 to-rose-600",
    badge: null,
  },
  {
    icon: Video,
    title: "Video Studio",
    description: "Professional video editing with AI. Auto captions, overlays, and effects.",
    features: ["Timeline editing", "Auto captions", "Text overlays", "Background removal"],
    href: "/video-studio",
    gradient: "from-red-500 to-red-600",
    badge: null,
  },
  {
    icon: GraduationCap,
    title: "Course Studio",
    description: "Build and sell online courses. AI generates curriculum, lessons, and quizzes.",
    features: ["AI curriculum", "Lesson generator", "Quiz builder", "Student analytics"],
    href: "/course-studio",
    gradient: "from-emerald-500 to-green-600",
    badge: null,
  },
  {
    icon: Image,
    title: "Image Studio",
    description: "Professional image editing with AI. Background removal, enhancement, and generation.",
    features: ["Background removal", "AI enhancement", "Image generation", "Batch editing"],
    href: "/image-studio",
    gradient: "from-cyan-500 to-blue-600",
    badge: null,
  },
];

const stats = [
  { value: "10K+", label: "Active Creators", icon: Users },
  { value: "$2M+", label: "Creator Earnings", icon: DollarSign },
  { value: "50K+", label: "Projects Created", icon: FileText },
  { value: "85%", label: "Revenue Share", icon: TrendingUp },
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Creation",
    description: "Advanced AI models help you write, compose, design, and produce professional content in minutes, not months.",
  },
  {
    icon: Shield,
    title: "85% Revenue Share",
    description: "Industry-leading creator earnings. Keep 85% of every sale through our Marketplace marketplace.",
  },
  {
    icon: Clock,
    title: "10x Faster Production",
    description: "What used to take weeks now takes hours. AI handles the heavy lifting while you focus on creativity.",
  },
  {
    icon: Globe,
    title: "Publish Everywhere",
    description: "One-click publishing to Amazon, Spotify, YouTube, and more. Your content, everywhere.",
  },
];

const testimonials = [
  {
    quote: "I went from struggling writer to published author in 3 weeks. The AI helped me organize my thoughts and the publishing tools handled everything.",
    author: "Sarah M.",
    role: "First-time Author",
    avatar: "S",
    earnings: "$4,200",
  },
  {
    quote: "I create TikTok content 10x faster now. The auto captions and viral moment detection are game-changers.",
    author: "Marcus J.",
    role: "Content Creator",
    avatar: "M",
    earnings: "$12,500",
  },
  {
    quote: "My online course went from idea to launch in 2 days. The AI curriculum builder saved me months of work.",
    author: "Dr. Lisa K.",
    role: "Course Creator",
    avatar: "L",
    earnings: "$28,000",
  },
];

export default function CreatorHome() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]" data-testid="loading-state">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#C9941A] to-[#8B6914] flex items-center justify-center animate-pulse">
            <span className="text-black font-black text-xl">K</span>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-[#C9941A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <GlobalHeader variant="transparent" />
      
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9941A]/10 via-transparent to-[#C9941A]/5" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#C9941A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C9941A]/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-6 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6">
              Create.{" "}
              <span className="bg-gradient-to-r from-[#C9941A] to-[#8B6914] bg-clip-text text-transparent">
                Publish.
              </span>{" "}
              Earn.
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              The ultimate AI creator platform. Write books, compose music, create courses, and earn{" "}
              <span className="font-bold text-[#C9941A]">85% revenue</span> from everything you create.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black font-bold text-lg px-8 py-6 shadow-xl shadow-[#C9941A]/25 group"
                onClick={() => window.location.href = "/api/login"}
                data-testid="cta-get-started"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-[#333] hover:border-[#C9941A] hover:bg-[#C9941A]/10 text-white font-semibold text-lg px-8 py-6"
                onClick={() => window.location.href = "/pricing"}
                data-testid="cta-view-pricing"
              >
                View Pricing
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4">
              7 Professional Studios
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Everything You Need to{" "}
              <span className="text-[#C9941A]">Create & Sell</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional tools that help you create, publish, and monetize your content across every medium.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studios.map((studio, index) => (
              <Link key={index} href={studio.href}>
                <Card className="group h-full bg-[#1a1a1a] border border-[#333] hover:border-[#C9941A]/50 hover:shadow-xl hover:shadow-[#C9941A]/10 transition-all duration-300 cursor-pointer overflow-hidden" data-testid={`card-${studio.title.toLowerCase().replace(/\s/g, '-')}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${studio.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <studio.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-white group-hover:text-[#C9941A] transition-colors">
                            {studio.title}
                          </h3>
                          {studio.badge && (
                            <Badge className="bg-[#C9941A] text-black text-[10px]">
                              {studio.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {studio.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {studio.features.map((feature, i) => (
                        <Badge key={i} variant="secondary" className="bg-[#0D0D0D] text-gray-300 border border-[#333] text-xs font-medium">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center text-[#C9941A] font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Studio
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4">
                Why Stroke Recovery Academy
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                The Creator Platform Built for{" "}
                <span className="text-[#C9941A]">Earning</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                We believe creators deserve more. That's why we offer industry-leading revenue share, 
                professional tools, and AI that actually helps you create faster.
              </p>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C9941A]/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-[#C9941A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9941A]/20 to-[#C9941A]/5 rounded-3xl transform rotate-3" />
              <Card className="relative bg-[#1a1a1a] border border-[#333] shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-[#C9941A]/20 text-[#C9941A] px-4 py-2 rounded-full font-bold text-sm mb-4">
                      <Award className="w-4 h-4" />
                      Creator Success Story
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">$28,000</h3>
                    <p className="text-gray-400">Earned in first 3 months</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-[#333] rounded-lg">
                      <span className="text-gray-400">Books Published</span>
                      <span className="font-bold text-white">4</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-[#333] rounded-lg">
                      <span className="text-gray-400">Courses Created</span>
                      <span className="font-bold text-white">2</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-[#333] rounded-lg">
                      <span className="text-gray-400">Revenue Share</span>
                      <span className="font-bold text-[#C9941A]">85%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#C9941A]/20 border border-[#C9941A]/30 rounded-lg">
                      <span className="font-semibold text-white">Total Payout</span>
                      <span className="font-black text-[#C9941A] text-xl">$23,800</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-4">
              Creator Stories
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Loved by <span className="text-[#C9941A]">10,000+ Creators</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-[#1a1a1a] border border-[#333] shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#C9941A] text-[#C9941A]" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#C9941A] text-black flex items-center justify-center font-bold text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testimonial.author}</p>
                        <p className="text-sm text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#C9941A] text-lg">{testimonial.earnings}</p>
                      <p className="text-xs text-gray-400">Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[#0D0D0D] to-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-6 px-4 py-1.5">
            <Zap className="w-4 h-4 mr-2" />
            Start Free Today
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to Start <span className="text-[#C9941A]">Creating</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who are building their businesses with Stroke Recovery Academy. 
            Start with 100 free credits, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black font-bold text-lg px-10 py-6 shadow-xl shadow-[#C9941A]/25"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-[#333] text-white hover:border-[#C9941A] hover:bg-[#C9941A]/10 font-semibold text-lg px-10 py-6"
              onClick={() => window.location.href = "/pricing"}
            >
              View Plans
            </Button>
          </div>
          <p className="mt-6 text-gray-400 text-sm">
            No credit card required. 100 free credits to start.
          </p>
        </div>
      </section>

      <Footer />
      <SasquatchChatWidget />
    </div>
  );
}
