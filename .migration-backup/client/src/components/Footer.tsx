import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Mail,
  GraduationCap,
  Activity,
  Brain,
  Building2,
  BookOpen,
  Heart,
  Target,
  FileText,
  Gift,
  Users,
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "react-icons/si";
const sasquatchLogo = "/sasquatch-logo.webp";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = useMutation({
    mutationFn: async (emailAddress: string) => {
      return await apiRequest("POST", "/api/newsletter/subscribe", { email: emailAddress });
    },
    onSuccess: () => {
      toast({ title: "You're in.", description: "Welcome to the recovery revolution." });
      setEmail("");
    },
    onError: (err: any) => {
      toast({
        title: "Could not subscribe",
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    subscribe.mutate(trimmed);
  };

  const recoveryLinks = [
    { label: "Recovery Academy", href: "/recovery/academy", icon: GraduationCap },
    { label: "Exercises", href: "/recovery/exercises", icon: Activity },
    { label: "Protocols", href: "/recovery/protocols", icon: Brain },
    { label: "Center Finder", href: "/recovery/center-finder", icon: Building2 },
    { label: "Recovery Blog", href: "/blog", icon: BookOpen },
    { label: "My Book", href: "/my-book", icon: FileText },
  ];

  const communityLinks = [
    { label: "Dashboard", href: "/recovery/dashboard", icon: Target },
    { label: "Community", href: "/recovery/community", icon: Users },
    { label: "Resources", href: "/recovery/resources", icon: BookOpen },
    { label: "Sasquatch Coach", href: "/recovery/sasquatch-coach", icon: Brain },
    { label: "Gift a Survivor", href: "/recovery/gift", icon: Gift },
  ];

  const whoItsForLinks = [
    { label: "For Survivors", href: "/for/stroke-survivors" },
    { label: "For Caregivers", href: "/for/caregivers" },
    { label: "For Young Survivors", href: "/for/young-stroke-survivors" },
    { label: "For Spouses", href: "/for/spouses" },
    { label: "For Therapists", href: "/for/therapists" },
  ];

  const programsLinks = [
    { label: "The Sasquatch Method", href: "/programs/sasquatch-method" },
    { label: "66-Day Challenge", href: "/programs/66-day-challenge" },
    { label: "Daily Routine", href: "/programs/daily-routine" },
  ];

  const learnLinks = [
    { label: "Neuroplasticity", href: "/learn/neuroplasticity-after-stroke" },
    { label: "Hemiparesis Recovery", href: "/learn/hemiparesis-recovery" },
    { label: "Exercises at Home", href: "/learn/stroke-recovery-exercises-at-home" },
    { label: "Aphasia Recovery", href: "/learn/aphasia-recovery" },
    { label: "Depression After Stroke", href: "/learn/depression-after-stroke" },
    { label: "Recovery Timeline", href: "/learn/stroke-recovery-timeline" },
    { label: "Recovery Blog", href: "/blog" },
  ];

  const companyLinks = [
    { label: "About Nick", href: "/recovery/about-nick" },
    { label: "Stroke Lyfe Inc. (Nonprofit)", href: "/recovery/strokelyfe-org" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/recovery/about-nick" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
    { label: "Refund Policy", href: "/legal/refund-policy" },
    { label: "Privacy Controls & Account Delete", href: "/settings/privacy" },
  ];

  return (
    <footer className="bg-[#FDFBF7] border-t border-[#E2C2A4]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={sasquatchLogo}
                alt="Stroked-Out Sasquatch"
                className="h-48 w-auto"
                data-testid="img-footer-logo"
              />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
              From 0% to 90% Recovery
            </p>
            <p className="text-[#78716C] mb-6 leading-relaxed text-sm">
              The world's most comprehensive stroke recovery platform — built by a survivor,
              for survivors. Evidence-based methods, AI coaching, and a community of 50,000+
              warriors refusing to accept limitations.
            </p>
            <div className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
                Join the Recovery Revolution
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubscribe();
                    }
                  }}
                  disabled={subscribe.isPending}
                  className="flex-1 border-[#E2C2A4]/30 bg-white text-[#1C1917] placeholder:text-[#A8A29E] focus:border-gold"
                  data-testid="input-newsletter-email"
                />
                <Button
                  className="bg-gold text-black font-semibold flex-shrink-0"
                  data-testid="button-newsletter-subscribe"
                  onClick={handleSubscribe}
                  disabled={subscribe.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {subscribe.isPending ? "Joining..." : "Join"}
                </Button>
              </div>
            </div>
          </div>

          {/* Recovery links */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gold">
              Recovery
            </h3>
            <ul className="space-y-2">
              {recoveryLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-gold transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gold">
              Community
            </h3>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-gold transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Who it's for */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gold">
              Who It's For
            </h3>
            <ul className="space-y-2">
              {whoItsForLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors block text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gold">
              Programs
            </h3>
            <ul className="space-y-2">
              {programsLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors block text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-bold mb-4 mt-6 text-sm uppercase tracking-wide text-gold">
              Learn
            </h3>
            <ul className="space-y-2">
              {learnLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors block text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-gold">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#78716C] hover:text-[#1C1917] transition-colors block text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal links — Medical Disclaimer + Refund Policy + Account/Privacy */}
        <div className="border-t border-[#E2C2A4]/30 pt-6 pb-2">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-[#78716C] hover:text-gold transition-colors"
                  data-testid={`footer-legal-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="tel:988"
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                data-testid="footer-legal-crisis-988"
              >
                Crisis Support: Call/Text 988
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-[#E2C2A4]/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="text-sm text-[#A8A29E]">
                © {currentYear} Stroke Recovery Academy. All rights reserved.
              </div>
              <a
                href="mailto:nick@strokerecoveryacademy.com"
                className="text-sm text-[#A8A29E] hover:text-[#1C1917] transition-colors flex items-center gap-1"
                data-testid="link-contact-email"
              >
                <Mail className="h-3 w-3" />
                nick@strokerecoveryacademy.com
              </a>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://twitter.com/strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                aria-label="Follow on X (Twitter)"
                data-testid="social-link-x"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                aria-label="Follow on TikTok"
                data-testid="social-link-tiktok"
              >
                <SiTiktok className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                aria-label="Follow on Instagram"
                data-testid="social-link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com/@strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-[#A8A29E] hover:text-[#1C1917] transition-colors"
                aria-label="Subscribe on YouTube"
                data-testid="social-link-youtube"
              >
                <SiYoutube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E2C2A4]/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={sasquatchLogo}
                  alt="Stroked-Out Sasquatch"
                  className="h-44 w-auto opacity-90"
                />
                <div>
                  <p className="text-xs font-semibold text-[#78716C]">Stroke Lyfe Inc.</p>
                  <p className="text-xs text-[#A8A29E]">501(c)(3) Nonprofit · Rebuild. Rewire. Rise.</p>
                </div>
              </div>
              <Link href="/recovery/gift">
                <button className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-xs font-semibold px-4 py-2 rounded-md hover:bg-gold/20 transition-colors" data-testid="footer-button-gift">
                  <Gift className="h-3.5 w-3.5" />
                  Gift a Survivor Access — from $47
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Prominent medical disclaimer — always visible, never tiny */}
        <div className="border-t-2 border-gold/40 bg-[#F5F0EB] mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-3 mb-3">
              <Heart className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-gold uppercase tracking-wider mb-1">
                  Important — Please Read
                </p>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  <strong className="text-[#1C1917]">This is not medical advice.</strong> Nick Kremers
                  is a stroke survivor sharing lived experience — not a doctor, neurologist, or
                  licensed therapist. Everything on this site is for informational and motivational
                  purposes only. It is <strong className="text-[#1C1917]">not a substitute</strong> for
                  professional medical advice, diagnosis, treatment, or supervised rehabilitation.
                  Individual results vary dramatically.{" "}
                  <strong className="text-[#1C1917]">
                    Always consult your physician, neurologist, or licensed therapist before
                    starting, stopping, or modifying any exercise, supplement, medication, or
                    rehabilitation program.
                  </strong>
                </p>
                <p className="text-sm text-[#78716C] leading-relaxed mt-3">
                  <strong className="text-[#1C1917]">If you experience new stroke symptoms</strong> —
                  sudden weakness, vision changes, severe headache, slurred speech, or chest pain —
                  call <a href="tel:911" className="text-gold underline font-bold">911</a>{" "}
                  immediately.{" "}
                  <strong className="text-[#1C1917]">If you are in mental-health crisis</strong>, call
                  or text{" "}
                  <a href="tel:988" className="text-gold underline font-bold">988</a>{" "}
                  (U.S. Suicide &amp; Crisis Lifeline) any time, day or night.
                </p>
              </div>
            </div>
            <p className="text-xs text-[#A8A29E] text-center mt-4">
              &copy; {currentYear} Stroke Recovery Academy · Built by a survivor, for survivors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
