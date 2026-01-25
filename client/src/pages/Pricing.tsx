import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GlobalHeader from "@/components/GlobalHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import { usePlatform } from "@/lib/hooks/usePlatform";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import {
  Check,
  X,
  Zap,
  Crown,
  Sparkles,
  Star,
  BookOpen,
  Music,
  Video,
  GraduationCap,
  Image,
  FileText,
  Mic,
  Users,
  Globe,
  DollarSign,
  ArrowRight,
  Loader2,
  Building2,
  Infinity,
  Clock,
  Shield,
  Award,
  TrendingUp,
  ChevronDown,
  BadgeCheck,
  Flame,
  Heart,
  Gift,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const creatorTiers = [
  {
    name: "free",
    displayName: "Free",
    description: "Try our AI creator tools",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    popular: false,
    features: [
      { name: "3 AI generations/day", included: true },
      { name: "Book Studio (basic)", included: true },
      { name: "Music Studio (30s samples)", included: true },
      { name: "Image Studio (5 images/day)", included: true },
      { name: "Marketplace access", included: true },
      { name: "Beat the Sasquatch (daily spin)", included: true },
      { name: "SEO Command Center", included: false },
      { name: "Course Studio", included: false },
      { name: "Video Studio", included: false },
      { name: "Priority generation", included: false },
      { name: "Gaming credits (500/mo)", included: false },
      { name: "Commercial license", included: false },
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
    credits: 100,
  },
  {
    name: "creator",
    displayName: "Creator",
    description: "For serious content creators",
    monthlyPrice: 2900,
    annualPrice: 24900,
    icon: Star,
    popular: false,
    features: [
      { name: "50 AI generations/day", included: true },
      { name: "Book Studio (full access)", included: true },
      { name: "Music Studio (full tracks)", included: true },
      { name: "Image Studio (50 images/day)", included: true },
      { name: "SEO Command Center (5 audits/mo)", included: true },
      { name: "Beat the Sasquatch (500 credits/mo)", included: true },
      { name: "Audiobook narration (TTS)", included: true },
      { name: "Course Studio (basic)", included: true },
      { name: "Video Studio (basic)", included: false },
      { name: "AEO Voice Search", included: false },
      { name: "Priority generation", included: false },
      { name: "Commercial license", included: true },
    ],
    cta: "Start Creating",
    ctaVariant: "default" as const,
    stripePriceIdMonthly: "price_1SiIdw51DeNrqHX5O9dDMqEj",
    stripePriceIdAnnual: "price_1SiIdw51DeNrqHX5Xv7VpaxJ",
    credits: 2500,
  },
  {
    name: "pro",
    displayName: "Pro",
    description: "Unlimited creation power",
    monthlyPrice: 7900,
    annualPrice: 69900,
    icon: Crown,
    popular: true,
    features: [
      { name: "Unlimited AI generations", included: true },
      { name: "All 6 Studios (full access)", included: true },
      { name: "SEO Command Center (unlimited)", included: true },
      { name: "AEO Voice Search Optimization", included: true },
      { name: "Beat the Sasquatch (2,000 credits/mo)", included: true },
      { name: "Priority support", included: true },
      { name: "Google Workspace Suite", included: true },
      { name: "Audiobook narration (TTS)", included: true },
      { name: "Video Studio (full access)", included: true },
      { name: "Course Studio (full access)", included: true },
      { name: "Priority generation", included: true },
      { name: "Commercial license", included: true },
    ],
    cta: "Go Pro",
    ctaVariant: "default" as const,
    stripePriceIdMonthly: "price_1SiIdx51DeNrqHX5WmiJLsLR",
    stripePriceIdAnnual: "price_1SiIdx51DeNrqHX5xxkqYYXX",
    credits: 10000,
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "For teams and agencies",
    monthlyPrice: 29900,
    annualPrice: 249900,
    icon: Building2,
    popular: false,
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Team workspace (10 seats)", included: true },
      { name: "White-label option", included: true },
      { name: "API access", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom integrations", included: true },
      { name: "SLA guarantee", included: true },
      { name: "Training sessions", included: true },
      { name: "Volume discounts", included: true },
      { name: "Priority infrastructure", included: true },
      { name: "Custom AI training", included: true },
      { name: "Invoice billing", included: true },
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    stripePriceIdMonthly: "price_1SiIdx51DeNrqHX5vc05QWXf",
    stripePriceIdAnnual: "price_1SiIdy51DeNrqHX5iP3aGHDP",
    credits: 50000,
  },
];

const studioFeatures = [
  {
    icon: BookOpen,
    title: "Book Studio",
    description: "AI ghostwriting, Google Docs editing, PDF/EPUB export",
    free: "3 chapters",
    creator: "Unlimited chapters",
    pro: "Full access + audiobook",
  },
  {
    icon: Music,
    title: "Music Studio",
    description: "Lyria AI music generation, 8 genre templates",
    free: "30s samples",
    creator: "Full tracks (2 min)",
    pro: "Unlimited + stems",
  },
  {
    icon: Image,
    title: "Image Studio",
    description: "AI image generation, editing, background removal",
    free: "5 images/day",
    creator: "50 images/day",
    pro: "Unlimited",
  },
  {
    icon: GraduationCap,
    title: "Course Studio",
    description: "Google Slides presentations, Forms quizzes",
    free: "View only",
    creator: "3 courses",
    pro: "Unlimited + analytics",
  },
  {
    icon: Video,
    title: "Video Studio",
    description: "Auto captions, overlays, viral clip detection",
    free: "Not included",
    creator: "5 videos/month",
    pro: "Unlimited",
  },
  {
    icon: Mic,
    title: "Audiobook Narration",
    description: "10 professional AI voices, multiple accents",
    free: "Not included",
    creator: "1 hour/month",
    pro: "10 hours/month",
  },
];

const apiCosts = [
  { service: "Music Generation (Lyria)", cost: "$0.06 per 30 seconds" },
  { service: "Audiobook Narration (TTS)", cost: "~$16 per million characters" },
  { service: "Google Docs/Sheets/Slides", cost: "Free (included)" },
  { service: "Image Generation", cost: "$0.02 per image" },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, absolutely. You can cancel your subscription at any time from your dashboard. Your access continues until the end of your billing period, and you keep all content you've created."
  },
  {
    question: "What's included in the free plan?",
    answer: "The free plan includes 3 AI generations per day, basic access to Book, Music, and Image studios, marketplace access, and one daily spin on Beat the Sasquatch games. It's perfect for trying out the platform."
  },
  {
    question: "How do credits work?",
    answer: "Credits are used for premium AI features and Beat the Sasquatch games. Monthly subscribers receive a credit allowance each month. Credits can also be earned through referrals, marketplace sales, or game wins (redeemable for platform services only)."
  },
  {
    question: "What's the 85/15 revenue split?",
    answer: "When you sell content on our marketplace, you keep 85% of every sale. We only take 15% to cover platform and payment processing costs. This is one of the best creator revenue shares in the industry."
  },
  {
    question: "Do I own the content I create?",
    answer: "Yes! All content you create on KreAIte belongs to you. Pro and Enterprise plans include full commercial licenses, meaning you can sell, publish, and monetize your creations however you want."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period."
  },
  {
    question: "Is there a money-back guarantee?",
    answer: "Yes! All paid plans come with a 14-day money-back guarantee. If you're not completely satisfied, contact us for a full refund, no questions asked."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), as well as Apple Pay and Google Pay. Enterprise customers can also pay via invoice."
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Self-Published Author",
    quote: "I published 3 books in 6 months using the Book Studio. The AI helped me overcome writer's block and the marketplace got me real sales.",
    avatar: "SM",
  },
  {
    name: "Marcus T.",
    role: "Music Producer",
    quote: "Lyria music generation is insane. I create background tracks for my YouTube videos in minutes instead of hours.",
    avatar: "MT",
  },
  {
    name: "Jennifer K.",
    role: "Course Creator",
    quote: "From zero to a complete online course with slides and quizzes in one weekend. The Pro plan paid for itself after my first student enrolled.",
    avatar: "JK",
  },
];

const trustBadges = [
  { icon: Shield, label: "Secure Payments" },
  { icon: Heart, label: "501(c)(3) Nonprofit" },
  { icon: Award, label: "14-Day Guarantee" },
  { icon: Users, label: "10K+ Creators" },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(true);
  const platform = usePlatform();
  const isRecovery = platform === "recovery";
  const Header = isRecovery ? RecoveryHeader : GlobalHeader;

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest('POST', '/api/checkout', { 
        priceId,
        mode: 'subscription'
      });
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Checkout Error",
        description: "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getAnnualSavings = (monthly: number, annual: number) => {
    if (monthly === 0) return 0;
    const monthlyTotal = monthly * 12;
    const savings = ((monthlyTotal - annual) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  const handleSelectPlan = (tier: typeof creatorTiers[0]) => {
    const priceId = isAnnual ? tier.stripePriceIdAnnual : tier.stripePriceIdMonthly;
    if (!priceId) {
      window.location.href = '/api/login';
      return;
    }
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    checkoutMutation.mutate(priceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-300">Save up to 28% with annual billing</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground" data-testid="heading-pricing">
              Turn Your Ideas Into
              <span className="bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text text-transparent"> Income</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4" data-testid="text-pricing-subtitle">
              The all-in-one AI platform that helps you create books, music, courses, and more.
              <span className="text-foreground font-semibold"> Keep 85% of every sale.</span>
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-400" />
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Label htmlFor="billing-toggle" className={!isAnnual ? "text-foreground font-semibold" : "text-muted-foreground"}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                data-testid="switch-billing-toggle"
              />
              <Label htmlFor="billing-toggle" className={isAnnual ? "text-foreground font-semibold" : "text-muted-foreground"}>
                Annual
              </Label>
              {isAnnual && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold" data-testid="badge-save-annual">
                  <Gift className="w-3 h-3 mr-1" />
                  Save 28%
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {trustBadges.map((badge, index) => {
                const TrustIcon = badge.icon;
                return (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrustIcon className="w-4 h-4 text-primary/70" />
                    <span>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {creatorTiers.map((tier) => {
                const TierIcon = tier.icon;
                const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
                const savings = getAnnualSavings(tier.monthlyPrice, tier.annualPrice);
                
                return (
                  <Card 
                    key={tier.name} 
                    className={`relative flex flex-col bg-zinc-900 border-zinc-800 ${tier.popular ? 'border-orange-500 ring-2 ring-orange-500/20' : ''}`}
                    data-testid={`card-tier-${tier.name}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="px-4 bg-orange-500 text-black font-bold" data-testid="badge-most-popular">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <TierIcon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl text-foreground" data-testid={`text-tier-name-${tier.name}`}>
                        {tier.displayName}
                      </CardTitle>
                      <CardDescription data-testid={`text-tier-description-${tier.name}`}>
                        {tier.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-black text-foreground" data-testid={`text-tier-price-${tier.name}`}>
                            {isAnnual && price > 0 ? formatPrice(Math.round(price / 12)) : formatPrice(price)}
                          </span>
                          {price > 0 && (
                            <span className="text-muted-foreground">
                              /month
                            </span>
                          )}
                        </div>
                        {isAnnual && price > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Billed annually ({formatPrice(price)}/year)
                          </p>
                        )}
                        {isAnnual && savings > 0 && (
                          <p className="text-sm text-green-400 mt-1 font-semibold" data-testid={`text-tier-savings-${tier.name}`}>
                            <Gift className="w-3 h-3 inline mr-1" />
                            Save {savings}% annually
                          </p>
                        )}
                        {tier.credits > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {tier.credits.toLocaleString()} credits/month included
                          </p>
                        )}
                      </div>
                      
                      <Separator className="my-4 bg-zinc-800" />
                      
                      <ul className="space-y-3">
                        {tier.features.map((feature, featureIndex) => (
                          <li 
                            key={featureIndex} 
                            className="flex items-start gap-2 text-sm"
                            data-testid={`feature-${tier.name}-${featureIndex}`}
                          >
                            {feature.included ? (
                              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                            )}
                            <span className={feature.included ? 'text-zinc-300' : 'text-zinc-600'}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className={`w-full ${tier.popular ? 'bg-orange-500 text-black' : ''}`}
                        variant={tier.popular ? "default" : tier.ctaVariant}
                        size="lg"
                        onClick={() => handleSelectPlan(tier)}
                        disabled={checkoutMutation.isPending}
                        data-testid={`button-select-${tier.name}`}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {tier.cta}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground" data-testid="heading-studio-comparison">
              Studio Features <span className="text-primary">Comparison</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              See exactly what you get with each plan across all six creative studios
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-feature-comparison">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 px-4 text-foreground font-medium">Studio</th>
                    <th className="text-center py-4 px-4 text-muted-foreground">Free</th>
                    <th className="text-center py-4 px-4 text-muted-foreground">Creator</th>
                    <th className="text-center py-4 px-4 text-primary font-bold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {studioFeatures.map((studio, index) => {
                    const StudioIcon = studio.icon;
                    return (
                      <tr key={index} className="border-b border-zinc-800/50" data-testid={`row-studio-${index}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <StudioIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{studio.title}</p>
                              <p className="text-xs text-muted-foreground">{studio.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 text-sm text-muted-foreground">{studio.free}</td>
                        <td className="text-center py-4 px-4 text-sm text-zinc-300">{studio.creator}</td>
                        <td className="text-center py-4 px-4 text-sm text-primary font-medium">{studio.pro}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground" data-testid="heading-api-costs">
              Transparent <span className="text-primary">API Costs</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              We use enterprise-grade Google Cloud APIs. Here's exactly what powers your creations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apiCosts.map((item, index) => (
                <Card key={index} className="bg-zinc-900 border-zinc-800" data-testid={`card-api-cost-${index}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">{item.service}</span>
                    </div>
                    <Badge variant="outline" className="border text-primary">
                      {item.cost}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Creator-First Revenue Share</h3>
                  <p className="text-muted-foreground">
                    When you sell on our marketplace, you keep <span className="text-primary font-bold">85%</span> of every sale. 
                    We only take 15% to cover platform costs. Your creativity, your earnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
                <Star className="w-3 h-3 mr-1" />
                Creator Success Stories
              </Badge>
              <h2 className="text-3xl font-bold text-foreground" data-testid="heading-testimonials">
                Trusted by <span className="text-primary">10,000+ Creators</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-zinc-900/50 border-zinc-800" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Powered by <span className="text-primary">Enterprise AI</span>
              </h3>
              <div className="flex flex-wrap justify-center gap-8 opacity-60">
                <div className="flex items-center gap-2 text-foreground">
                  <Globe className="w-5 h-5" />
                  <span>Google Cloud</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="w-5 h-5" />
                  <span>Vertex AI</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Music className="w-5 h-5" />
                  <span>Lyria Music</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Mic className="w-5 h-5" />
                  <span>Cloud TTS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-zinc-900/30">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground" data-testid="heading-faq">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
              <p className="text-muted-foreground mt-2">
                Everything you need to know about KreAIte
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-zinc-800" data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-foreground hover:text-primary text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-b from-background to-zinc-900/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Join 10,000+ creators earning with AI</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Turn Ideas Into Income</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start free. No credit card required. Upgrade when you're ready to scale.
              Your creativity deserves a platform that pays.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-orange-500 text-black font-bold gap-2"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-start-free-bottom"
              >
                Start Creating Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Link href="/games">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                  data-testid="button-play-games"
                >
                  <Sparkles className="w-5 h-5" />
                  Play Beat the Sasquatch
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span>85% revenue share on sales</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span>Supporting Stroke Lyfe Inc 501(c)(3)</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
