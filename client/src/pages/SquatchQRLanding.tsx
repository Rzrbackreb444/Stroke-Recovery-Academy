import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import {
  Sparkles,
  RotateCcw,
  BarChart3,
  Volume2,
  Trophy,
  Palette,
  Package,
  BookOpen,
  Users,
  Heart,
  ArrowRight,
  Play,
  Check,
  QrCode,
  Zap,
  Star,
  Quote,
  ChevronRight,
} from "lucide-react";

const FOREST_GREEN = "#1B4332";
const GOLD = "#C9941A";
const DARK_BASE = "#0D0D0D";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Quotes",
    description: "Generate industry-specific content in any tone with advanced AI",
  },
  {
    icon: RotateCcw,
    title: "Daily Rotation",
    description: "Fresh inspiration every day, automatically delivered",
  },
  {
    icon: BarChart3,
    title: "Scan Analytics",
    description: "Track engagement, location, device data in real-time",
  },
  {
    icon: Volume2,
    title: "Voice Delivery",
    description: "Listen to quotes via text-to-speech for accessibility",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Streaks, badges, rewards for daily engagement",
  },
  {
    icon: Palette,
    title: "White Label",
    description: "Your brand, your domain, your complete experience",
  },
];

const tones = [
  {
    name: "Tough Love",
    quote: "Stop making excuses. Your future self is watching.",
    color: "#DC2626",
  },
  {
    name: "Gentle",
    quote: "Every small step forward is still progress.",
    color: "#10B981",
  },
  {
    name: "Recovery Warrior",
    quote: "You survived the storm. Now own the sunshine.",
    color: "#8B5CF6",
  },
  {
    name: "Daily Ritual",
    quote: "Morning protocol: 3 deep breaths, set one intention, move.",
    color: "#F59E0B",
  },
  {
    name: "Mindfulness",
    quote: "This moment is enough. You are enough.",
    color: "#06B6D4",
  },
  {
    name: "Professional",
    quote: "Excellence is not an act, but a habit.",
    color: "#6366F1",
  },
];

const useCases = [
  {
    icon: Package,
    title: "Product Packaging",
    description: "Supplements, food products, merchandise — add daily value to every purchase",
    examples: ["Vitamin bottles", "Protein bags", "Wellness products"],
  },
  {
    icon: BookOpen,
    title: "Authors & Books",
    description: "Engage readers daily long after they've finished your book",
    examples: ["Self-help books", "Journals", "Workbooks"],
  },
  {
    icon: Users,
    title: "Coaches & Consultants",
    description: "Keep clients engaged between sessions with daily touchpoints",
    examples: ["Life coaches", "Business mentors", "Fitness trainers"],
  },
  {
    icon: Heart,
    title: "Recovery Programs",
    description: "Support stroke survivors, addiction recovery, and wellness journeys",
    examples: ["Rehab centers", "Support groups", "Therapy practices"],
  },
];

const steps = [
  {
    number: "01",
    title: "Create",
    description: "Choose your industry, select a tone, and generate quotes with AI. Customize or upload your own content.",
  },
  {
    number: "02",
    title: "Design",
    description: "Upload your brand image, customize QR style, colors, and frame. Make it uniquely yours.",
  },
  {
    number: "03",
    title: "Deploy",
    description: "Download your QR code, print it anywhere, and watch engagement grow daily with real-time analytics.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying it out",
    features: ["1 project", "50 quotes", "Basic analytics", "Standard QR styles"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators and small brands",
    features: ["10 projects", "Unlimited quotes", "Full analytics", "Voice delivery", "Custom QR colors", "Priority email support"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    description: "For growing businesses",
    features: ["Unlimited projects", "White-label branding", "Team collaboration", "Advanced analytics", "Custom domains", "Priority support"],
    cta: "Start Business",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For large organizations",
    features: ["Everything in Business", "Custom domain", "API access", "Dedicated support", "SLA guarantee", "Custom integrations"],
    cta: "Contact Sales",
    popular: false,
  },
];

const testimonials = [
  {
    quote: "SquatchQR transformed how we engage with our supplement customers. Daily quotes on our vitamin bottles increased repeat purchases by 34%.",
    author: "Sarah Chen",
    role: "Founder, VitaGlow Supplements",
    avatar: "SC",
  },
  {
    quote: "As a recovery coach, I needed a way to stay connected with clients between sessions. SquatchQR gives them daily motivation that keeps them on track.",
    author: "Marcus Johnson",
    role: "Certified Recovery Coach",
    avatar: "MJ",
  },
  {
    quote: "My self-help book now has a QR code on the back cover. Readers scan daily and I've built an engaged community of 15,000+ daily scanners.",
    author: "Dr. Emily Winters",
    role: "Bestselling Author",
    avatar: "EW",
  },
];

const trustLogos = ["Wellness Brands", "Publishers", "Coaches", "Healthcare", "Fitness"];

export default function SquatchQRLanding() {
  const [selectedTone, setSelectedTone] = useState(0);
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK_BASE }} data-testid="page-squatchqr-landing">
      <SEO
        title="SquatchQR - Dynamic QR Codes for Daily Transformation"
        description="Deliver rotating quotes, rituals, and inspiration through scannable QR codes on your products, books, and packaging. The Daily Ritual Delivery System."
        canonicalUrl="/squatch-qr"
        keywords="dynamic QR codes, rotating quotes, daily inspiration, product engagement, QR analytics, white label QR"
        type="website"
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="section-hero">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 20% 20%, ${FOREST_GREEN}40 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, ${FOREST_GREEN}30 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, ${GOLD}10 0%, transparent 70%),
                linear-gradient(180deg, ${DARK_BASE} 0%, ${DARK_BASE} 100%)
              `,
            }}
          />
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L30 25 L25 15 Z' fill='%231B4332' fill-opacity='0.1'/%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: `${FOREST_GREEN}30`, border: `1px solid ${FOREST_GREEN}50` }}>
            <QrCode className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-sm font-medium text-white/90">The Daily Ritual Delivery System</span>
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
            data-testid="hero-headline"
          >
            Dynamic QR Codes That Spark
            <br />
            <span style={{ color: GOLD }}>Daily Transformation</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-4 max-w-3xl mx-auto">
            Deliver rotating quotes, rituals, and inspiration through scannable codes on your products, books, and packaging.
          </p>
          <p className="text-base text-white/50 mb-10">
            Scan. Transform. Thrive.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button
                className="px-8 py-6 h-auto text-base font-semibold rounded-full"
                style={{ backgroundColor: GOLD, color: DARK_BASE, border: `2px solid ${GOLD}` }}
                data-testid="button-start-free"
              >
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="px-8 py-6 h-auto text-base font-medium rounded-full border-white/30 text-white backdrop-blur-sm"
              data-testid="button-watch-demo"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Floating QR Preview */}
          <div className="mt-16 relative">
            <div
              className="inline-block p-8 rounded-3xl"
              style={{
                backgroundColor: `${FOREST_GREEN}20`,
                border: `1px solid ${FOREST_GREEN}40`,
                boxShadow: `0 0 60px ${FOREST_GREEN}30`,
              }}
            >
              <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-2xl flex items-center justify-center relative">
                <QrCode className="w-32 h-32 md:w-44 md:h-44" style={{ color: FOREST_GREEN }} />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: GOLD }}>
                  Scan for today's quote
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Logo Bar */}
      <section className="py-16 border-t border-white/10" style={{ backgroundColor: DARK_BASE }} data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/50 text-sm uppercase tracking-wider mb-8">Trusted by wellness brands, authors, and coaches</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustLogos.map((logo) => (
              <span key={logo} className="text-white/30 text-lg font-semibold tracking-wider">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24" style={{ backgroundColor: `${FOREST_GREEN}08` }} data-testid="section-features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              Everything you need to deliver daily value
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Powerful tools to create, customize, and track dynamic QR experiences that keep your audience engaged.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-white/10 hover-elevate"
                style={{ backgroundColor: `${DARK_BASE}` }}
                data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${FOREST_GREEN}30` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tone Selector Showcase */}
      <section className="py-24" style={{ backgroundColor: DARK_BASE }} data-testid="section-tones">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              Tone Library
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              One message, infinite voices
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Choose the perfect tone for your audience. From tough love to gentle encouragement.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Tone Buttons */}
            <div className="flex flex-wrap gap-3">
              {tones.map((tone, index) => (
                <button
                  key={tone.name}
                  onClick={() => setSelectedTone(index)}
                  className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedTone === index ? "text-white scale-105" : "text-white/60 hover:text-white/80"
                  }`}
                  style={{
                    backgroundColor: selectedTone === index ? tone.color : "transparent",
                    border: `1px solid ${selectedTone === index ? tone.color : "rgba(255,255,255,0.2)"}`,
                  }}
                  data-testid={`tone-button-${tone.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {tone.name}
                </button>
              ))}
            </div>

            {/* Quote Preview */}
            <div
              className="relative p-8 md:p-12 rounded-3xl"
              style={{
                backgroundColor: `${tones[selectedTone].color}15`,
                border: `1px solid ${tones[selectedTone].color}40`,
              }}
            >
              <Quote className="w-12 h-12 mb-6 opacity-40" style={{ color: tones[selectedTone].color }} />
              <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed mb-6" data-testid="quote-preview">
                "{tones[selectedTone].quote}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tones[selectedTone].color }} />
                <span className="text-sm text-white/50">{tones[selectedTone].name} tone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24" style={{ backgroundColor: `${FOREST_GREEN}08` }} data-testid="section-use-cases">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              Use Cases
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              Built for every industry
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              From product packaging to books, coaches to recovery programs — SquatchQR adapts to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <Card
                key={useCase.title}
                className="border-white/10 hover-elevate overflow-hidden"
                style={{ backgroundColor: DARK_BASE }}
                data-testid={`usecase-${useCase.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${FOREST_GREEN}30` }}
                    >
                      <useCase.icon className="w-7 h-7" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{useCase.title}</h3>
                      <p className="text-white/60 mb-4">{useCase.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {useCase.examples.map((example) => (
                          <span
                            key={example}
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${FOREST_GREEN}20`, color: "rgba(255,255,255,0.7)" }}
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24" style={{ backgroundColor: DARK_BASE }} data-testid="section-how-it-works">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              Three steps to daily engagement
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative" data-testid={`step-${step.number}`}>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent" />
                )}
                <div
                  className="text-6xl font-bold mb-6"
                  style={{ color: `${FOREST_GREEN}40` }}
                >
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-white/60 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/auth">
              <Button
                className="px-8 py-6 h-auto text-base font-semibold rounded-full"
                style={{ backgroundColor: GOLD, color: DARK_BASE }}
                data-testid="button-get-started"
              >
                Get Started in Minutes
                <Zap className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" style={{ backgroundColor: `${FOREST_GREEN}08` }} data-testid="section-pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative border-white/10 hover-elevate ${plan.popular ? "ring-2" : ""}`}
                style={{
                  backgroundColor: DARK_BASE,
                  ...(plan.popular && { ringColor: GOLD }),
                }}
                data-testid={`pricing-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: GOLD, color: DARK_BASE }}
                  >
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/50">{plan.period}</span>
                  </div>
                  <p className="text-white/50 text-sm mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      style={plan.popular ? { backgroundColor: GOLD, color: DARK_BASE } : {}}
                      data-testid={`button-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24" style={{ backgroundColor: DARK_BASE }} data-testid="section-testimonials">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-6">
              Loved by creators worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.author}
                className="border-white/10"
                style={{ backgroundColor: `${FOREST_GREEN}10` }}
                data-testid={`testimonial-${testimonial.author.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" style={{ color: GOLD }} />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: FOREST_GREEN, color: "white" }}
                    >
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-white/50 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${DARK_BASE} 0%, ${FOREST_GREEN}30 100%)`,
        }}
        data-testid="section-cta-footer"
      >
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Daily Engagement?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of brands delivering daily value through dynamic QR codes.
          </p>

          {/* Email Capture */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-12">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40"
              data-testid="input-email"
            />
            <Button
              className="h-12 px-6"
              style={{ backgroundColor: GOLD, color: DARK_BASE }}
              data-testid="button-subscribe"
            >
              Get Updates
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <Link href="/pricing">
              <span className="text-white/50 hover:text-white cursor-pointer" data-testid="link-pricing">
                Pricing
              </span>
            </Link>
            <Link href="#features">
              <span className="text-white/50 hover:text-white cursor-pointer" data-testid="link-features">
                Features
              </span>
            </Link>
            <span className="text-white/50 hover:text-white cursor-pointer" data-testid="link-api-docs">
              API Docs
            </span>
            <span className="text-white/50 hover:text-white cursor-pointer" data-testid="link-support">
              Support
            </span>
          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-white/30 text-sm">
              © 2025 SquatchQR. All rights reserved. Scan. Transform. Thrive.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
