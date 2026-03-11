import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
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
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "react-icons/si";
import sasquatchLogo from "@assets/stroked-out-sasquatch-logo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
    { label: "Community", href: "/recovery/social", icon: Heart },
    { label: "Resources", href: "/recovery/resources", icon: BookOpen },
    { label: "Sasquatch Coach", href: "/recovery/sasquatch-coach", icon: Brain },
  ];

  const companyLinks = [
    { label: "About Nick", href: "/recovery/about-nick" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
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
                className="h-12 w-auto"
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
                  className="flex-1 border-[#333] bg-[#111] text-white placeholder:text-gray-600 focus:border-[#C9941A]"
                  data-testid="input-newsletter-email"
                />
                <Button
                  className="bg-[#C9941A] text-black font-semibold flex-shrink-0"
                  data-testid="button-newsletter-subscribe"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Join
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#C9941A] transition-colors" />
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm group"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <link.icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#C9941A] transition-colors" />
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
                <li key={link.href}>
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

          <div className="text-center mt-6">
            <p className="text-xs text-gray-600">
              Powered by KremersX · Always consult your healthcare provider before starting any recovery program.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
