import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { 
  ChevronDown,
  ArrowRight,
  X,
  Sparkles,
  Star,
} from "lucide-react";

const aiModels = [
  { name: "Sora", icon: "◉" },
  { name: "Veo", icon: "G" },
  { name: "Gemini", icon: "✦" },
  { name: "Kling", icon: "◈" },
  { name: "Seedance", icon: "▥" },
  { name: "Flux", icon: "△" },
  { name: "ElevenLabs", icon: "∥" },
];

const trustLogos = [
  { name: "Microsoft", width: "w-24" },
  { name: "Google", width: "w-20" },
  { name: "Amazon", width: "w-20" },
  { name: "Adobe", width: "w-20" },
  { name: "Spotify", width: "w-20" },
];

export default function CreatorLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D]" data-testid="page-creator-landing">
      <SEO 
        title="Stroke Recovery Academy - Create Any Content You Can Imagine"
        description="The complete AI creative platform. Generate professional books, music, videos, courses, and images. Trusted by 50M+ creators worldwide."
        canonicalUrl="https://strokerecoveryacademy.com"
        keywords="AI content creation, AI video, AI music, AI writing, creator platform"
        type="website"
      />

      {/* Announcement Banner */}
      {showBanner && (
        <div className="relative bg-[#C9941A] text-black py-2.5 px-4 text-center text-sm font-medium z-50">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>New! All the AI tools you need, organized in one toolkit</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            data-testid="button-close-banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header 
        className="fixed left-0 right-0 z-40 transition-all duration-300"
        style={{
          top: showBanner ? '40px' : '0',
          backgroundColor: scrollY > 50 ? 'rgba(13, 13, 13, 0.9)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <span 
                className="text-[#C9941A] text-2xl font-bold tracking-tight cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif" }}
                data-testid="logo"
              >
                Stroke Recovery Academy
              </span>
            </Link>

            {/* Center Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: "AI Video", href: "/video-studio" },
                { label: "AI Image", href: "/image-studio" },
                { label: "AI Music", href: "/music-studio" },
                { label: "AI Books", href: "/book-studio" },
                { label: "Courses", href: "/course-studio" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <button className="flex items-center gap-1 px-3 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors">
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </Link>
              ))}
              <span className="w-px h-5 bg-white/20 mx-2" />
              <Link href="/marketplace">
                <button className="flex items-center gap-1 px-3 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors">
                  Marketplace
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <span className="text-white/80 hover:text-white text-sm font-medium cursor-pointer hidden md:block">
                  Pricing
                </span>
              </Link>
              <Link href="/auth">
                <span className="text-white/80 hover:text-white text-sm font-medium cursor-pointer" data-testid="link-signin">
                  Sign In
                </span>
              </Link>
              <Link href="/auth">
                <Button 
                  className="bg-transparent border border-white text-white hover:bg-white hover:text-black text-sm font-medium px-5 py-2 rounded-full transition-all duration-200"
                  data-testid="button-start-free"
                >
                  Start Free Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Screen Cinematic */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/hero-cinematic.png')`,
          }}
        >
          {/* Gradient Overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/50 via-transparent to-[#0D0D0D]" />
          <div className="absolute inset-0 bg-[#0D0D0D]/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ marginTop: showBanner ? '40px' : '0' }}>
          <h1 
            className="text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.05] text-white mb-8 tracking-[-0.02em]"
            style={{ 
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontWeight: 400,
              fontStyle: 'italic',
            }}
            data-testid="hero-headline"
          >
            Create any content<br />you can imagine
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-2 font-light max-w-2xl mx-auto">
            Get cutting-edge AI image and video, voiceovers, high-quality music, and more.
          </p>
          <p className="text-base text-white/60 mb-10">
            The choice of <span className="text-white">50M+</span> creators worldwide.
          </p>

          <Link href="/auth">
            <Button 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-base font-medium px-8 py-6 h-auto rounded-full transition-all duration-200"
              data-testid="button-hero-cta"
            >
              Start Free Now
            </Button>
          </Link>
        </div>

        {/* AI Models Bar - Fixed at bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 md:gap-6 py-3 px-6 md:px-8 bg-[#1a1a1a]/80 backdrop-blur-xl rounded-full border border-white/10">
            {aiModels.map((model) => (
              <div 
                key={model.name} 
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer group"
                data-testid={`ai-model-${model.name.toLowerCase()}`}
              >
                <span className="text-sm opacity-70 group-hover:opacity-100">{model.icon}</span>
                <span className="text-sm font-medium hidden sm:inline">{model.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-16 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
            {trustLogos.map((logo) => (
              <span 
                key={logo.name} 
                className={`text-white/30 text-lg font-semibold tracking-wider ${logo.width}`}
              >
                {logo.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AI Toolkit Section */}
      <section className="py-24 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-4">
            <span className="text-[#C9941A] text-sm font-semibold uppercase tracking-wider">AI Toolkit</span>
          </div>
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl text-white text-center mb-6"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
          >
            The only organized AI platform for creators
          </h2>
          <div className="flex justify-center mb-16">
            <Link href="/dashboard">
              <Button 
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-black rounded-full px-6"
              >
                Go to Toolkit
              </Button>
            </Link>
          </div>

          {/* Featured AI Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Sora 2 Pro", desc: "Videos with sharp motion and precise prompt control", tag: null },
              { name: "Veo 3.1", desc: "Flawless audio-video sync with style control", tag: null },
              { name: "ElevenLabs v3", desc: "Dramatic voiceovers for creative control", tag: "NEW" },
              { name: "Gemini Ultra", desc: "Advanced reasoning and content generation", tag: null },
              { name: "FLUX.2 Pro", desc: "Production-grade images with sharp detail", tag: null },
              { name: "Kling 2.6 Pro", desc: "Cinematic visuals with fluid motion", tag: null },
            ].map((model, i) => (
              <div 
                key={i}
                className="group relative p-6 bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
                {model.tag && (
                  <span className="absolute top-4 right-4 text-xs font-bold text-[#C9941A] bg-[#C9941A]/10 px-2 py-1 rounded">
                    {model.tag}
                  </span>
                )}
                <h3 className="text-white font-semibold mb-2 group-hover:text-[#C9941A] transition-colors">
                  {model.name}
                </h3>
                <p className="text-white/50 text-sm">{model.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studios Section */}
      <section className="py-24 bg-gradient-to-b from-[#0D0D0D] to-[#111111]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl text-white text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
          >
            The AI Toolkit for effortless creation
          </h2>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
            Seven professional studios. One unified platform. Unlimited creative potential.
          </p>

          {/* Tab-style Studio Selector */}
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {["AI Video", "AI Image", "AI Music", "AI Books", "AI Course", "Websites"].map((tab, i) => (
              <button
                key={tab}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  i === 0 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white/70 hover:text-white border border-white/20 hover:border-white/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Featured Studio Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10">
            <div className="aspect-[21/9] bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center">
              <div className="text-center p-8">
                <h3 className="text-3xl md:text-4xl text-white font-light mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  AI Video Studio
                </h3>
                <p className="text-white/60 mb-6 max-w-xl mx-auto">
                  Generate cinematic videos powered by cutting-edge AI models including Sora, Veo, and Kling
                </p>
                <Link href="/video-studio">
                  <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6">
                    Explore AI Video
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl text-white text-center mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
            data-testid="testimonials-heading"
          >
            What Creators Are Saying
          </h2>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
            Join thousands of creators who've transformed their work with Stroke Recovery Academy
          </p>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 - Author */}
            <div 
              className="p-6 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-[#C9941A]/50 transition-all duration-300"
              data-testid="testimonial-card-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  SM
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold" data-testid="testimonial-name-1">Sarah M.</h3>
                  <p className="text-white/60 text-sm" data-testid="testimonial-title-1">Author</p>
                </div>
              </div>
              
              <p className="text-white/80 text-sm mb-4 leading-relaxed" data-testid="testimonial-quote-1">
                "I published my first book in 3 weeks instead of 6 months. The AI writing assistance and cover design tools saved me hundreds of dollars."
              </p>
              
              <div className="flex gap-1" data-testid="testimonial-rating-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9941A] text-[#C9941A]" data-testid={`star-${i}-1`} />
                ))}
              </div>
            </div>

            {/* Testimonial 2 - Music Producer */}
            <div 
              className="p-6 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-[#C9941A]/50 transition-all duration-300"
              data-testid="testimonial-card-2"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/40 to-red-500/40 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  JT
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold" data-testid="testimonial-name-2">James T.</h3>
                  <p className="text-white/60 text-sm" data-testid="testimonial-title-2">Music Producer</p>
                </div>
              </div>
              
              <p className="text-white/80 text-sm mb-4 leading-relaxed" data-testid="testimonial-quote-2">
                "Creating instrumentals is now effortless. I've generated over 200 tracks and sold them on every major platform. My income tripled."
              </p>
              
              <div className="flex gap-1" data-testid="testimonial-rating-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9941A] text-[#C9941A]" data-testid={`star-${i}-2`} />
                ))}
              </div>
            </div>

            {/* Testimonial 3 - Content Creator */}
            <div 
              className="p-6 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-[#C9941A]/50 transition-all duration-300"
              data-testid="testimonial-card-3"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-500/40 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  AC
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold" data-testid="testimonial-name-3">Alex C.</h3>
                  <p className="text-white/60 text-sm" data-testid="testimonial-title-3">Content Creator</p>
                </div>
              </div>
              
              <p className="text-white/80 text-sm mb-4 leading-relaxed" data-testid="testimonial-quote-3">
                "Built my first online course with beautiful video lessons and interactive content. It launched 5 days ago and already has 1,200 students."
              </p>
              
              <div className="flex gap-1" data-testid="testimonial-rating-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9941A] text-[#C9941A]" data-testid={`star-${i}-3`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl text-white text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
          >
            50M+ creators choose Stroke Recovery Academy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-white/60 mb-2">The complete creative AI ecosystem</p>
            </div>
            <div>
              <p className="text-white/60 mb-2">Always evolving with advanced AI models</p>
            </div>
            <div>
              <p className="text-white/60 mb-2">Built for you to create the impossible</p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Quality Stock Section */}
      <section className="py-24 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl text-white text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
          >
            High-quality marketplace
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Books", gradient: "from-amber-900/40 to-orange-900/40" },
              { name: "Music", gradient: "from-purple-900/40 to-pink-900/40" },
              { name: "Videos", gradient: "from-blue-900/40 to-cyan-900/40" },
              { name: "Courses", gradient: "from-green-900/40 to-emerald-900/40" },
            ].map((item) => (
              <Link key={item.name} href="/marketplace">
                <div className={`aspect-square rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/10 p-6 flex flex-col justify-end cursor-pointer hover:border-white/30 transition-all group`}>
                  <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                  <span className="text-white/50 text-sm group-hover:text-[#C9941A] transition-colors flex items-center gap-1">
                    Explore <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <p className="text-white/50 text-center mt-8 max-w-2xl mx-auto">
            Create and sell with the perfect content — books, music, videos, courses — with an 85% creator revenue share
          </p>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 bg-[#111111]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 
            className="text-4xl md:text-5xl text-white text-center mb-16"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
          >
            Find your perfect plan
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-[#1a1a1a] border border-white/10">
              <h3 className="text-2xl text-white font-semibold mb-4">Creators</h3>
              <p className="text-white/60 mb-6">
                Get the full AI Suite, highest-quality creative assets, or everything Stroke Recovery Academy has to offer, all covered by the right license for you.
              </p>
              <Link href="/pricing">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-black rounded-full">
                  See Plans
                </Button>
              </Link>
            </div>
            <div className="p-8 rounded-2xl bg-[#1a1a1a] border border-white/10">
              <h3 className="text-2xl text-white font-semibold mb-4">Businesses</h3>
              <p className="text-white/60 mb-6">
                Give your brand, team, or agency unlimited assets and advanced AI tools to create securely and at scale.
              </p>
              <Link href="/pricing">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-black rounded-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-[#0D0D0D] relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('/images/hero-cinematic.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-[#0D0D0D]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl text-white mb-8"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            Everything you need to<br />create without limits
          </h2>
          <Link href="/auth">
            <Button 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-base font-medium px-10 py-6 h-auto rounded-full transition-all duration-200"
              data-testid="button-final-cta"
            >
              Start Free Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-[#C9941A] font-bold text-xl">Stroke Recovery Academy</span>
            <div className="flex items-center gap-8 text-white/50 text-sm">
              <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
              <Link href="/marketplace"><span className="hover:text-white cursor-pointer">Marketplace</span></Link>
              <Link href="/about"><span className="hover:text-white cursor-pointer">About</span></Link>
              <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
              <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            </div>
            <span className="text-white/30 text-sm">© 2024 Stroke Recovery Academy. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
