import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Settings, Heart, ChevronDown, Music2, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import strokeLyfeLogo from "@assets/Untitled_design_1776803832326.png";

// Shared site-header singleton — first mount wins (covers RecoveryHeader
// and GlobalHeader both), so legacy per-page header mounts are suppressed.
import { siteHeaderRegistry } from "./siteHeaderRegistry";

// Hero-funnel collapse (May 2026): Top nav reduced from 12 items to 4 destinations.
// Survivors with cognitive load can't parse 12 nav items — picking 4 forces every
// decision to be obvious. Coach (chat) and Today (dashboard with the Bonfire) are
// the two activation surfaces; Music is the paid headliner cluster; More holds the
// rest of the surface area collapsed into one dropdown.
const primaryNav = [
  { href: "/recovery/sasquatch-coach", label: "Coach" },
  { href: "/recovery/dashboard", label: "Today" },
];

// Paid music headliner — Recovery Anchor Studio (musical-mnemonic encoder
// for words/phrases stroke survivors are trying to recover) lives inside the
// Motivation Studio page. Anthem Builder generates personal recovery anthems;
// Sasquatch Radio is the curated audio stream with DJ voice intros.
const musicNav = [
  { href: "/recovery/motivation", label: "Anchor Studio", pro: true, description: "Musical-mnemonic for words your stroke took" },
  { href: "/recovery/lyrics", label: "Lyrics Studio", pro: true, description: "Grammy-grade lyric sheets from your story" },
  { href: "/recovery/anthem/build", label: "Anthem Builder", pro: false, description: "Build your personal recovery anthem" },
  { href: "/recovery/radio", label: "Sasquatch Radio", pro: false, description: "Survivor-curated stream with DJ intros" },
];

// "More" — everything that used to live in the top nav and the old Resources dropdown,
// now consolidated into a single overflow menu so the hero-funnel surface stays clean.
const resourcesNav = [
  { href: "/recovery/academy", label: "Learn" },
  { href: "/recovery/challenge", label: "66-Day Challenge" },
  { href: "/recovery/exercises", label: "Exercises" },
  { href: "/recovery/routine", label: "Daily Routine" },
  { href: "/recovery/community", label: "Community" },
  { href: "/recovery/brain-gym", label: "Brain Gym" },
  { href: "/recovery/blog", label: "Blog" },
  { href: "/recovery/spotlight", label: "Spotlight" },
  { href: "/recovery/survivor-income", label: "Earn Income" },
  { href: "/groups", label: "Groups" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/recovery/pricing", label: "Pricing" },
];

export default function RecoveryHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!siteHeaderRegistry.mounted) {
      siteHeaderRegistry.mounted = true;
      setIsPrimary(true);
      return () => { siteHeaderRegistry.mounted = false; };
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setResourcesOpen(false);
    setMusicOpen(false);
  }, [location]);

  if (!isPrimary) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#1e1e1e]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">

          {/* Logo — 3× scale, dominant on every viewport including mobile */}
          <Link href="/recovery" data-testid="link-recovery-home">
            <div className="flex items-center cursor-pointer">
              <img
                src={strokeLyfeLogo}
                alt="Stroke Recovery Academy"
                style={{ height: "144px", width: "auto", flexShrink: 0 }}
                data-testid="img-recovery-logo"
              />
            </div>
          </Link>

          {/* Desktop nav — 5 primary + Resources dropdown */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {primaryNav.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    location === link.href
                      ? "text-[#C9941A]"
                      : "text-gray-400 hover:text-white"
                  }`}
                  data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </button>
              </Link>
            ))}

            {/* Music dropdown — paid headliner (Anchor Studio) gets a PRO badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg transition-colors"
                  data-testid="nav-music"
                >
                  <Music2 className="h-3.5 w-3.5 mr-1 text-[#C9941A]" />
                  Music <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#111] border-[#222] min-w-[280px]">
                {musicNav.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={`cursor-pointer flex flex-col items-start gap-0.5 py-2 ${location === link.href ? "text-[#C9941A]" : "text-gray-300"}`}
                      data-testid={`nav-music-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {link.label}
                        {link.pro && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30">
                            <Crown className="h-2.5 w-2.5" /> Pro
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">{link.description}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Resources dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg transition-colors"
                  data-testid="nav-resources"
                >
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#111] border-[#222] min-w-[160px]">
                {resourcesNav.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={`cursor-pointer text-sm ${location === link.href ? "text-[#C9941A]" : "text-gray-300"}`}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/recovery/gift">
              <Button
                size="sm"
                variant="outline"
                className="border-[#C9941A]/50 text-[#C9941A] font-semibold text-xs"
                data-testid="button-nav-gift"
              >
                <Heart className="w-3.5 h-3.5 mr-1.5" />
                Gift a Survivor
              </Button>
            </Link>
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="dropdown-user">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#C9941A]/20 text-[#C9941A] text-xs font-bold">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white font-medium">
                      {user.firstName || "My Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#111] border-[#222]">
                  <div className="px-3 py-2 border-b border-[#222]">
                    <p className="text-sm font-semibold text-white">{user.firstName || "Survivor"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/recovery/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-[#C9941A]" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2 text-gray-400" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#222]" />
                  <DropdownMenuItem
                    className="cursor-pointer text-gray-400"
                    onClick={() => (window.location.href = "/api/logout")}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white text-sm"
                  onClick={() => (window.location.href = "/recovery/login")}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-[#C9941A] text-black font-semibold text-sm px-5"
                  onClick={() => (window.location.href = "/recovery/login?tab=signup")}
                  data-testid="button-join"
                >
                  Start Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-400"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#1e1e1e] bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* 5 primary links */}
            {primaryNav.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location === link.href
                      ? "text-[#C9941A] bg-[#C9941A]/5"
                      : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.label}
                </button>
              </Link>
            ))}
            {/* Music — collapsible (paid headliner gets PRO badge) */}
            <div>
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-[#1a1a1a] flex items-center justify-between transition-colors"
                onClick={() => setMusicOpen((v) => !v)}
                data-testid="mobile-nav-music"
              >
                <span className="flex items-center gap-2">
                  <Music2 className="h-3.5 w-3.5 text-[#C9941A]" />
                  Music
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${musicOpen ? "rotate-180" : ""}`} />
              </button>
              {musicOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  {musicNav.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                          location === link.href
                            ? "text-[#C9941A]"
                            : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                        }`}
                        data-testid={`mobile-nav-music-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {link.label}
                        {link.pro && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-[#C9941A]/15 text-[#C9941A] border border-[#C9941A]/30">
                            <Crown className="h-2.5 w-2.5" /> Pro
                          </span>
                        )}
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {/* Resources — collapsible like desktop dropdown */}
            <div>
              <button
                className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-[#1a1a1a] flex items-center justify-between transition-colors"
                onClick={() => setResourcesOpen((v) => !v)}
                data-testid="mobile-nav-resources"
              >
                More
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
              </button>
              {resourcesOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  {resourcesNav.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          location === link.href
                            ? "text-[#C9941A]"
                            : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                        }`}
                        data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {link.label}
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-[#1e1e1e] flex flex-col gap-2">
              <Link href="/recovery/gift">
                <Button
                  variant="outline"
                  className="w-full border-[#C9941A]/50 text-[#C9941A] justify-start gap-2"
                  data-testid="mobile-button-gift"
                >
                  <Heart className="h-4 w-4" />
                  Gift a Survivor
                </Button>
              </Link>
              {user ? (
                <>
                  <Link href="/recovery/dashboard">
                    <Button variant="outline" className="w-full border-[#333] text-white justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4 text-[#C9941A]" />
                      My Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-400 gap-2"
                    onClick={() => (window.location.href = "/api/logout")}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-[#C9941A] text-black font-semibold"
                  onClick={() => (window.location.href = "/recovery/login?tab=signup")}
                  data-testid="mobile-button-join"
                >
                  Start Free
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
