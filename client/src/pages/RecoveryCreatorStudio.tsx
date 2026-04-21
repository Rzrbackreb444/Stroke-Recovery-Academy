import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music, Video, BookOpen, GraduationCap, Image, ShoppingBag, Mic,
  ArrowRight, Sparkles, DollarSign, Users, Upload, Zap, Star,
  Play, PenLine, Shirt, Package, Globe
} from "lucide-react";

const studios = [
  {
    icon: Music,
    title: "Music Studio",
    subtitle: "Survivor Motivational Track",
    description: "Generate your personal warrior anthem with AI. Name it after your fight, download it, share it. Your recovery has a soundtrack.",
    href: "/music-studio",
    badge: "AI-Powered",
    badgeColor: "bg-[#C9941A]/20 text-[#C9941A]",
    accentColor: "#C9941A",
    highlight: true,
  },
  {
    icon: Video,
    title: "Video Studio",
    subtitle: "Tell Your Story",
    description: "Create recovery video content — exercise demos, survivor testimonials, motivational reels. Publish to your profile and the marketplace.",
    href: "/video-studio",
    badge: "New",
    badgeColor: "bg-blue-500/20 text-blue-400",
    accentColor: "#3b82f6",
    highlight: false,
  },
  {
    icon: BookOpen,
    title: "Book Studio",
    subtitle: "Write Your Recovery Story",
    description: "AI-assisted writing tools to help survivors write and publish their memoir, recovery guide, or exercise program. KDP-ready export.",
    href: "/book-studio",
    badge: "KDP Ready",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
    accentColor: "#10b981",
    highlight: false,
  },
  {
    icon: GraduationCap,
    title: "Course Builder",
    subtitle: "Teach What Healed You",
    description: "Package your recovery knowledge into a structured course. Therapists and survivors earn 85% on every sale through the marketplace.",
    href: "/course-studio",
    badge: "85% Revenue",
    badgeColor: "bg-purple-500/20 text-purple-400",
    accentColor: "#a855f7",
    highlight: false,
  },
  {
    icon: Image,
    title: "Image Studio",
    subtitle: "Design Your Brand",
    description: "Create your survivor brand assets — merch mockups, social graphics, recovery poster art. AI generation + full editing tools.",
    href: "/image-studio",
    badge: "AI Generate",
    badgeColor: "bg-pink-500/20 text-pink-400",
    accentColor: "#ec4899",
    highlight: false,
  },
  {
    icon: Mic,
    title: "Audiobook Factory",
    subtitle: "Voice Your Story",
    description: "Convert your written work into a professional audiobook with ElevenLabs AI voices. Publish and sell through the marketplace.",
    href: "/audiobook-factory",
    badge: "ElevenLabs",
    badgeColor: "bg-orange-500/20 text-orange-400",
    accentColor: "#f97316",
    highlight: false,
  },
];

const marketplaceCategories = [
  { icon: GraduationCap, label: "Recovery Courses" },
  { icon: BookOpen, label: "Survivor Books" },
  { icon: Music, label: "Warrior Tracks" },
  { icon: Shirt, label: "Merch & Apparel" },
  { icon: Package, label: "Recovery Kits" },
  { icon: Globe, label: "Digital Downloads" },
];

const stats = [
  { value: "85%", label: "Revenue to creators" },
  { value: "90K+", label: "Survivors in community" },
  { value: "$0", label: "To start creating" },
];

export default function RecoveryCreatorStudio() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 max-w-5xl mx-auto text-center">
        <Badge className="mb-5 bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30 text-xs font-semibold tracking-widest uppercase">
          Survivor Creator Studio
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
          Your Recovery Is a{" "}
          <span className="text-[#C9941A]">Story Worth Selling</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          Create music, videos, courses, and books from your survival. Publish to the Stroke Recovery Marketplace. Keep 85% of every sale.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/music-studio">
            <Button className="bg-[#C9941A] text-black font-bold px-6 gap-2">
              <Music className="h-4 w-4" />
              Make My Warrior Track
            </Button>
          </Link>
          <Link href="/recovery/marketplace">
            <Button variant="outline" className="border-[#333] text-white gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-[#1a1a1a] py-5 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-[#C9941A]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Studios grid */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Choose Your Studio</h2>
            <p className="text-gray-500 text-sm mt-1">Every tool you need to create, publish, and earn</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studios.map((studio) => {
              const Icon = studio.icon;
              return (
                <Link key={studio.title} href={studio.href}>
                  <Card
                    className={`bg-[#1a1a1a] border-[#2a2a2a] p-5 cursor-pointer hover-elevate transition-all h-full flex flex-col gap-3 ${
                      studio.highlight ? "border-[#C9941A]/40 ring-1 ring-[#C9941A]/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${studio.accentColor}18` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: studio.accentColor }} />
                      </div>
                      <Badge className={`text-xs font-semibold shrink-0 ${studio.badgeColor}`}>
                        {studio.badge}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{studio.title}</div>
                      <div className="text-xs text-[#C9941A] font-medium mt-0.5">{studio.subtitle}</div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed flex-1">{studio.description}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: studio.accentColor }}>
                      Open Studio <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Marketplace section */}
      <section className="py-14 px-4 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30 text-xs font-semibold tracking-widest uppercase">
                Survivor Marketplace
              </Badge>
              <h2 className="text-3xl font-extrabold mb-4">
                Sell to 90,000+<br />
                <span className="text-[#C9941A]">Survivors & Caregivers</span>
              </h2>
              <p className="text-gray-400 mb-6">
                The Stroke Recovery Marketplace is the only place where survivors can buy from survivors.
                Courses, books, music, merch — you keep 85 cents of every dollar.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {marketplaceCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.label} className="flex items-center gap-2 text-sm text-gray-300">
                      <Icon className="h-4 w-4 text-[#C9941A] shrink-0" />
                      {cat.label}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/recovery/marketplace">
                  <Button className="bg-[#C9941A] text-black font-bold gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/sell-books">
                  <Button variant="outline" className="border-[#333] text-white gap-2">
                    <Upload className="h-4 w-4" />
                    Start Selling
                  </Button>
                </Link>
              </div>
            </div>

            {/* Revenue card */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#C9941A]/15 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#C9941A]" />
                </div>
                <div>
                  <div className="font-bold text-white">Revenue Split</div>
                  <div className="text-xs text-gray-500">Industry-leading creator share</div>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">You earn</span>
                    <span className="text-[#C9941A] font-bold">85%</span>
                  </div>
                  <div className="h-2 bg-[#0D0D0D] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9941A] rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Platform fee</span>
                    <span className="text-gray-500 font-medium">15%</span>
                  </div>
                  <div className="h-2 bg-[#0D0D0D] rounded-full overflow-hidden">
                    <div className="h-full bg-[#333] rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>
              </div>
              <div className="border-t border-[#2a2a2a] pt-4 space-y-2">
                {[
                  { label: "Instant Stripe payouts", icon: Zap },
                  { label: "No listing fees", icon: Star },
                  { label: "Keep 100% of your audience", icon: Users },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-300">
                    <Icon className="h-3.5 w-3.5 text-[#C9941A]" />
                    {label}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-3">
            Your Story Is the <span className="text-[#C9941A]">Product</span>
          </h2>
          <p className="text-gray-400 mb-8">
            Survivors who share their experience help thousands of others recover. Start creating today — it costs nothing.
          </p>
          <Link href="/music-studio">
            <Button className="bg-[#C9941A] text-black font-bold px-8 py-3 text-base gap-2">
              <Sparkles className="h-4 w-4" />
              Start With My Warrior Track
            </Button>
          </Link>
          <p className="text-xs text-gray-600 mt-3">Free to create. Subscription to publish and sell.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
