import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Settings, Heart, ChevronDown, Crown, Sparkles, Check, Flame, Users, BookOpen, ShoppingCart } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import sraEmblem from "@assets/sra-emblem.png";

// Shared site-header singleton — first mount wins (covers RecoveryHeader
// and GlobalHeader both), so legacy per-page header mounts are suppressed.
import { siteHeaderRegistry } from "./siteHeaderRegistry";

// Accountability-focused primary nav (May 2026 refocus pass): every primary
// slot is now a daily-action surface. Coach = the conversation. Today = the
// daily funnel. Never Zero = the streak-protection check-in (THE moat).
// Bonfire = the survivor accountability buddy. Music demoted to a column
// inside the More megamenu — survivors who want it can still reach it in
// two clicks, but it no longer competes for primary attention with the
// daily reps that actually move recovery.
const primaryNav: { href: string; label: string; icon?: typeof Flame }[] = [
  { href: "/recovery/sasquatch-coach", label: "Coach" },
  { href: "/recovery/journey", label: "Today" },
  { href: "/recovery/never-zero", label: "Never Zero", icon: Flame },
  { href: "/recovery/buddy", label: "Bonfire", icon: Users },
  { href: "/book", label: "Book", icon: BookOpen },
  { href: "/recovery/store", label: "Store", icon: ShoppingCart },
];

// "More" — grouped megamenu. Four columns now (Practice / Connect / Music /
// Earn) ordered by recovery progression. Music joined the megamenu in the
// accountability refocus pass — still discoverable, no longer dominant.
const resourcesGroups: { title: string; items: { href: string; label: string; pro?: boolean }[] }[] = [
  {
    title: "Practice",
    items: [
      { href: "/recovery/academy", label: "Learn" },
      { href: "/recovery/exercises", label: "Exercises" },
      { href: "/recovery/routine", label: "Daily Routine" },
      { href: "/recovery/brain-gym", label: "Brain Gym" },
      { href: "/recovery/challenge", label: "66-Day Challenge" },
    ],
  },
  {
    title: "Connect",
    items: [
      { href: "/recovery/community", label: "Community" },
      { href: "/recovery/campfire", label: "Campfire (Live)" },
      { href: "/recovery/spotlight", label: "Spotlight" },
      { href: "/groups", label: "Groups" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Music",
    items: [
      { href: "/recovery/motivation", label: "Anchor Studio", pro: true },
      { href: "/recovery/lyrics", label: "Lyrics Studio", pro: true },
      { href: "/recovery/anthem/build", label: "Anthem Builder" },
      { href: "/recovery/radio", label: "Sasquatch Radio" },
    ],
  },
  {
    title: "Write",
    items: [
      { href: "/book-studio", label: "Book Editor" },
      { href: "/book-perfection-suite", label: "Book Polish" },
      { href: "/puzzle-studio", label: "Puzzle Studio" },
    ],
  },
  {
    title: "Earn",
    items: [
      { href: "/recovery/survivor-income", label: "Earn Income" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/recovery/pricing", label: "Pricing" },
    ],
  },
];

export default function RecoveryHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
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
        <div className="flex items-center justify-between gap-4 py-2">

          {/* Logo — 3× scale, dominant on every viewport including mobile */}
          <Link href="/recovery" data-testid="link-recovery-home" className="min-w-0">
            <div className="flex items-center gap-3 cursor-pointer min-w-0">
              <img
                src={sraEmblem}
                alt="Stroke Recovery Academy"
                className="h-12 w-auto sm:h-14"
                style={{ flexShrink: 0 }}
                data-testid="img-recovery-logo"
              />
              <div className="hidden 2xl:flex flex-col leading-none min-w-0">
                <span className="font-bold tracking-tight text-white text-xl truncate">
                  Stroke Recovery Academy
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                  Rebuild · Rewire · Rise
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop nav — 4 accountability-focused primary + More megamenu */}
          <nav className="hidden xl:flex items-center gap-0.5 shrink-0" aria-label="Main navigation">
            {primaryNav.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      location === link.href
                        ? "text-gold"
                        : "text-gray-400 hover:text-white"
                    }`}
                    data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 text-gold" />}
                    {link.label}
                  </button>
                </Link>
              );
            })}

            {/* Resources megamenu — Practice / Connect / Music / Earn */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg transition-colors"
                  data-testid="nav-resources"
                >
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#111] border-[#222] p-3 w-[680px]">
                <div className="grid grid-cols-4 gap-4">
                  {resourcesGroups.map((group) => (
                    <div key={group.title}>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gold/80 px-2 pb-1.5 mb-1 border-b border-[#222]">
                        {group.title}
                      </div>
                      <div className="flex flex-col">
                        {group.items.map((link) => (
                          <DropdownMenuItem key={link.href} asChild>
                            <Link
                              href={link.href}
                              className={`px-2 py-1.5 text-sm rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                                location === link.href ? "text-gold" : "text-gray-300"
                              }`}
                              data-testid={`nav-more-${link.label.toLowerCase().replace(/\s|\(|\)/g, "-")}`}
                            >
                              <span className="truncate">{link.label}</span>
                              {link.pro && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0 text-[9px] font-bold uppercase tracking-wide rounded bg-gold/15 text-gold border border-gold/30">
                                  <Crown className="h-2 w-2" /> Pro
                                </span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right actions */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {/* Premium nav — always visible, never blocking. Hover popover
                gives a 4-line free vs premium snapshot. One click → /recovery/premium. */}
            <HoverCard openDelay={120} closeDelay={120}>
              <HoverCardTrigger asChild>
                <Link href="/recovery/premium">
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gold hover:text-amber-300 rounded-lg transition-colors whitespace-nowrap"
                    data-testid="nav-premium"
                  >
                    <Sparkles className="h-4 w-4" />
                    Premium
                  </button>
                </Link>
              </HoverCardTrigger>
              <HoverCardContent className="bg-[#111] border-[#222] w-72 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-gold" />
                  <div className="font-bold text-white text-sm">Sasquatch Premium</div>
                  <span className="text-xs text-stone-500 ml-auto">7 days free</span>
                </div>
                <ul className="space-y-1.5 mb-3 text-xs text-stone-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    Unlimited Coach (free: 25/day)
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    Unlimited Recovery Anchors (free: 3/mo)
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    Voice Cloning included
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    Premium Campfire circles with Nick
                  </li>
                </ul>
                <Link href="/recovery/premium">
                  <Button size="sm" className="w-full bg-gold text-black font-semibold" data-testid="nav-premium-cta">
                    See Premium
                  </Button>
                </Link>
              </HoverCardContent>
            </HoverCard>
            <Link href="/recovery/gift">
              <Button
                size="sm"
                variant="outline"
                className="border-gold/50 text-gold font-semibold text-xs"
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
                      <AvatarFallback className="bg-gold/20 text-gold text-xs font-bold">
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
                      <LayoutDashboard className="w-4 h-4 mr-2 text-gold" />
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
                  className="bg-gold text-black font-semibold text-sm px-5"
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
            className="xl:hidden text-gray-400"
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
        <div className="xl:hidden border-t border-[#1e1e1e] bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* 4 accountability-focused primary links */}
            {primaryNav.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                      location === link.href
                        ? "text-gold bg-gold/5"
                        : "text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                    }`}
                    data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 text-gold" />}
                    {link.label}
                  </button>
                </Link>
              );
            })}
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
                <div className="pl-4 mt-1 space-y-3">
                  {resourcesGroups.map((group) => (
                    <div key={group.title}>
                      <div className="px-4 text-[11px] font-bold uppercase tracking-wider text-gold/80 mb-1">
                        {group.title}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((link) => (
                          <Link key={link.href} href={link.href}>
                            <button
                              className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                location === link.href
                                  ? "text-gold"
                                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                              }`}
                              data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s|\(|\)/g, "-")}`}
                            >
                              {link.label}
                              {link.pro && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0 text-[9px] font-bold uppercase tracking-wide rounded bg-gold/15 text-gold border border-gold/30">
                                  <Crown className="h-2 w-2" /> Pro
                                </span>
                              )}
                            </button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-[#1e1e1e] flex flex-col gap-2">
              <Link href="/recovery/gift">
                <Button
                  variant="outline"
                  className="w-full border-gold/50 text-gold justify-start gap-2"
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
                      <LayoutDashboard className="h-4 w-4 text-gold" />
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
                  className="w-full bg-gold text-black font-semibold"
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
