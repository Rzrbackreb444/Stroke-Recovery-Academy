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
import sasquatchLogo from "@assets/Untitled_design_1776789083877.png";
import strokeLyfeLogo from "@assets/Untitled_design_1776789083877.png";

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
    { label: "Recovery Blog", href: "/recovery/blog", icon: BookOpen },
    { label: "My Book", href: "/my-book", icon: FileText },
  ];

  const communityLinks = [
    { label: "Dashboard", href: "/recovery/dashboard", icon: Target },
    { label: "Community", href: "/recovery/community", icon: Users },
    { label: "Resources", href: "/recovery/resources", icon: BookOpen },
    { label: "Sasquatch Coach", href: "/recovery/sasquatch-coach", icon: Brain },
    { label: "Gift a Survivor", href: "/recovery/gift", icon: Gift },
  ];

  const companyLinks = [
    { label: "About Nick", href: "/recovery/about-nick" },
    { label: "Stroke Lyfe Inc. (Nonprofit)", href: "/recovery/strokelyfe-org" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/recovery/about-nick" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="bg-[#080808] border-t border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={sasquatchLogo}
                alt="Stroke Recovery Academy"
                className="h-48 w-auto"
                data-testid="img-footer-logo"
              />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9941A] mb-2">
              From 0% to 90% Recovery
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              The world's most comprehensive stroke recovery platform — built by a survivor,
              for survivors. Evidence-based methods, AI coaching, and a community of 50,000+
              warriors refusing to accept limitations.
            </p>
            <div className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-wide text-gray-300">
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
                  className="flex-1 border-[#333] bg-[#111] text-white placeholder:text-gray-500 focus:border-[#C9941A]"
                  data-testid="input-newsletter-email"
                />
                <Button
                  className="bg-[#C9941A] text-black font-semibold flex-shrink-0"
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
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-[#C9941A]">
              Recovery
            </h3>
            <ul className="space-y-2">
              {recoveryLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#C9941A] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-[#C9941A]">
              Community
            </h3>
            <ul className="space-y-2">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#C9941A] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-[#C9941A]">
              Company
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors block text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="text-sm text-gray-500">
                © {currentYear} Stroke Recovery Academy. All rights reserved.
              </div>
              <a
                href="mailto:nick@strokerecoveryacademy.com"
                className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
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
                className="p-2 rounded-md text-gray-500 hover:text-white transition-colors"
                aria-label="Follow on X (Twitter)"
                data-testid="social-link-x"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-500 hover:text-white transition-colors"
                aria-label="Follow on TikTok"
                data-testid="social-link-tiktok"
              >
                <SiTiktok className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com/strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-500 hover:text-white transition-colors"
                aria-label="Follow on Instagram"
                data-testid="social-link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com/@strokedoutsasquatch"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-500 hover:text-white transition-colors"
                aria-label="Subscribe on YouTube"
                data-testid="social-link-youtube"
              >
                <SiYoutube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={strokeLyfeLogo}
                  alt="Stroke Lyfe Inc."
                  className="h-44 w-auto opacity-90"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-400">Stroke Lyfe Inc.</p>
                  <p className="text-xs text-gray-500">501(c)(3) Nonprofit · Rebuild. Rewire. Rise.</p>
                </div>
              </div>
              <Link href="/recovery/gift">
                <button className="flex items-center gap-2 bg-[#C9941A]/10 border border-[#C9941A]/30 text-[#C9941A] text-xs font-semibold px-4 py-2 rounded-md hover:bg-[#C9941A]/20 transition-colors" data-testid="footer-button-gift">
                  <Gift className="h-3.5 w-3.5" />
                  Gift a Survivor Access — from $47
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Prominent medical disclaimer — always visible, never tiny */}
        <div className="border-t-2 border-[#C9941A]/40 bg-[#1a1a1a] mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-3 mb-3">
              <Heart className="h-5 w-5 text-[#C9941A] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-[#C9941A] uppercase tracking-wider mb-1">
                  Important — Please Read
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">This is not medical advice.</strong> Nick Kremers
                  is a stroke survivor sharing lived experience — not a doctor, neurologist, or
                  licensed therapist. Everything on this site is for informational and motivational
                  purposes only. It is <strong className="text-white">not a substitute</strong> for
                  professional medical advice, diagnosis, treatment, or supervised rehabilitation.
                  Individual results vary dramatically.{" "}
                  <strong className="text-white">
                    Always consult your physician, neurologist, or licensed therapist before
                    starting, stopping, or modifying any exercise, supplement, medication, or
                    rehabilitation program.
                  </strong>
                </p>
                <p className="text-sm text-gray-300 leading-relaxed mt-3">
                  <strong className="text-white">If you experience new stroke symptoms</strong> —
                  sudden weakness, vision changes, severe headache, slurred speech, or chest pain —
                  call <a href="tel:911" className="text-[#C9941A] underline font-bold">911</a>{" "}
                  immediately.{" "}
                  <strong className="text-white">If you are in mental-health crisis</strong>, call
                  or text{" "}
                  <a href="tel:988" className="text-[#C9941A] underline font-bold">988</a>{" "}
                  (U.S. Suicide &amp; Crisis Lifeline) any time, day or night.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Powered by KremersX · &copy; {currentYear} Stroke Recovery Academy
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
