import { useState, useEffect, useRef } from "react";

// Shared site-header singleton — suppresses duplicate headers (GlobalHeader
// or RecoveryHeader). First-mounted header wins; all others render null.
import { siteHeaderRegistry } from "./siteHeaderRegistry";
import { Link as WouterLink } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import sraLogo from "@assets/global-logo-opt.webp";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Menu, 
  X, 
  BookOpen, 
  Music, 
  Video, 
  GraduationCap,
  FileText,
  ChevronDown,
  Sparkles,
  Store,
  Users,
  DollarSign,
  Image,
  Zap,
  Crown,
  Settings,
  LogOut,
  User,
  Coins,
  Bot,
  Bell,
  Search,
  LayoutDashboard,
  PenTool,
  Globe,
  Smartphone,
  Home,
  ChevronRight,
  Film,
  BookMarked,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const studios = [
  { href: "/mobile-studio", label: "Mobile Writing Studio", icon: Smartphone, description: "Thumb-friendly mobile editor", badge: "NEW", enabled: true },
  { href: "/book-studio", label: "Book Studio", icon: BookOpen, description: "Write & publish books with AI", badge: null, enabled: true },
  { href: "/music-studio", label: "Music Studio", icon: Music, description: "Create AI music & audio", badge: null, enabled: true },
  { href: "/video-studio", label: "Video Studio", icon: Video, description: "Professional video editing", badge: null, enabled: true },
  { href: "/course-studio", label: "Course Studio", icon: GraduationCap, description: "Build online courses", badge: null, enabled: true },
  { href: "/image-studio", label: "Image Studio", icon: Image, description: "AI images & editing", badge: null, enabled: true },
  { href: "/publishing", label: "Doctrine Engine", icon: FileText, description: "Structure your expertise", badge: null, enabled: true },
  { href: "/movie-studio", label: "Movie Studio", icon: Film, description: "Create cinematic content", badge: null, enabled: true },
  { href: "/website-studio", label: "Website Studio", icon: Globe, description: "Build professional websites", badge: null, enabled: true },
];

const quickTools = [
  { href: "/quick-create", label: "Quick Create", icon: Zap, description: "1-click magic tools" },
  { href: "/ai-consultant", label: "AI Consultant", icon: Bot, description: "Train AI on your content" },
  { href: "/doc-hub", label: "Doc Hub", icon: FileText, description: "Import & merge documents" },
];

const navLinks = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/community", label: "Community", icon: Users },
  { href: "/academy", label: "Recovery Academy", icon: BookMarked, isHighlight: true },
  { href: "/pricing", label: "Pricing", icon: Crown },
];

interface GlobalHeaderProps {
  variant?: "default" | "minimal" | "transparent";
}

export default function GlobalHeader({ variant = "default" }: GlobalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [studiosHovered, setStudiosHovered] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const headerBg = variant === "transparent" && !scrolled
    ? "bg-transparent"
    : "bg-[#FAF8F3]/90 dark:bg-[#1a1a1a]/90 backdrop-blur-2xl";

  const borderClass = variant === "transparent" && !scrolled
    ? "border-transparent"
    : "border-gold/10";

  if (!isPrimary) return null;

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${headerBg} border-b ${borderClass} shadow-sm`}
      data-testid="global-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-32">
          <div className="flex items-center gap-8">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-300 hover:scale-105">
                <img
                  src={sraLogo}
                  alt="Stroke Recovery Academy"
                  className="h-28 w-auto object-contain"
                />
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <DropdownMenu onOpenChange={setStudiosHovered}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`font-semibold text-sm text-gray-700 dark:text-gray-300 gap-1.5 transition-all duration-300 ${
                      studiosHovered ? 'animate-studios-glow' : ''
                    }`}
                    data-testid="dropdown-studios"
                  >
                    <Sparkles className="w-4 h-4 text-gold transition-transform duration-300 group-hover:scale-110" />
                    Studios
                    <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-2 bg-[#FAF8F3] dark:bg-[#1a1a1a] border-gold/20 animate-scale-in">
                  <DropdownMenuLabel className="text-xs font-bold text-gold uppercase tracking-wider px-2">
                    Creator Studios
                  </DropdownMenuLabel>
                  {studios.map((studio, idx) => (
                    <DropdownMenuItem 
                      key={studio.href} 
                      asChild 
                      className="cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-gold/5"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <Link href={studio.href} className="flex items-center gap-3 w-full group">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <studio.icon className="w-5 h-5 text-gold transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {studio.label}
                            </span>
                            {studio.badge && (
                              <Badge className="bg-gold text-white text-[10px] px-1.5 py-0 animate-subtle-float">
                                {studio.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {studio.description}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-gold/10 my-2" />
                  <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                    Quick Tools
                  </DropdownMenuLabel>
                  {quickTools.map((tool, idx) => (
                    <DropdownMenuItem 
                      key={tool.href} 
                      asChild 
                      className="cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ animationDelay: `${(studios.length + idx) * 30}ms` }}
                    >
                      <Link href={tool.href} className="flex items-center gap-3 w-full group">
                        <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <tool.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                            {tool.label}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`font-semibold text-sm gap-1.5 transition-all duration-300 relative group ${
                      link.isHighlight
                        ? "text-red-600 dark:text-red-500"
                        : location === link.href 
                        ? "text-gold bg-gold/5" 
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                    data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <link.icon className={`w-4 h-4 transition-transform duration-300 ${
                      link.isHighlight ? "animate-subtle-float" : ""
                    }`} />
                    {link.label}
                    {!link.isHighlight && (
                      <div className="absolute bottom-0 left-1/2 h-0.5 bg-gold opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-full group-hover:left-0" />
                    )}
                    {link.isHighlight && (
                      <div className="animate-accent-glow rounded-md px-2 py-1" />
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && <CreditBalancePill />}

            <div className="relative hidden md:flex items-center">
              {searchOpen ? (
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search studios..."
                  className="w-48 h-9 px-3 py-2 bg-[#FAF8F3] dark:bg-gray-800 border-gold/20 focus:border-gold animate-search-slide-out"
                  onBlur={() => setSearchOpen(false)}
                  data-testid="input-search"
                />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-110"
                  onClick={() => setSearchOpen(true)}
                  data-testid="button-search"
                >
                  <Search className="w-5 h-5 transition-transform duration-300" />
                </Button>
              )}
            </div>

            {user && <PowerPointsBell />}

            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden md:flex text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-110"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5 transition-transform duration-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            )}

            {!isLoading && !user ? (
              <div className="flex items-center gap-2 animate-scale-in">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex font-semibold text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-login"
                >
                  Log In
                </Button>
                <Button 
                  size="sm"
                  className="bg-gold text-white font-semibold shadow-lg shadow-gold/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-gold/40"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-signup"
                >
                  Get Started
                </Button>
              </div>
            ) : user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 transition-all duration-300 hover:scale-110" data-testid="user-menu">
                    <Avatar className="h-9 w-9 border-2 border-gold/30 transition-all duration-300">
                      <AvatarImage src={(user as any).avatarUrl || user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gold text-white font-bold text-sm">
                        {((user as any).displayName || user.firstName)?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-[#FAF8F3] dark:bg-[#1a1a1a] border-gold/20 animate-scale-in">
                  <div className="px-3 py-2 mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {(user as any).displayName || user.firstName || "Creator"}
                    </p>
                    {(user as any).username && (
                      <p className="text-xs text-gold/70">@{(user as any).username}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-gold/10" />
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-gold/5">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-gold/5">
                    <Link href="/author-dashboard" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Earnings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-gold/5">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gold/10" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-500/20"
                    onClick={() => window.location.href = "/api/logout"}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden transition-all duration-300 hover:scale-110"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-6 h-6 transition-transform duration-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#FAF8F3] dark:bg-[#1a1a1a] p-0 animate-menu-slide-in">
                <SheetHeader className="p-4 border-b border-gold/10">
                  <SheetTitle className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                    <img
                      src={sraLogo}
                      alt="Stroke Recovery Academy"
                      className="h-24 w-auto object-contain"
                    />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="p-4 space-y-4">
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-gold/10 rounded-lg transition-all duration-300 hover:bg-gold/20 animate-scale-in">
                      <Avatar className="h-10 w-10 border-2 border-gold/30 transition-all duration-300">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gold text-white font-bold">
                          {user.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user.firstName || "Creator"}</p>
                        <div className="flex items-center gap-1 text-xs text-gold">
                          <Coins className="w-3 h-3 animate-subtle-float" />
                          <span className="font-bold">2,500 credits</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile nav — 1:1 mirror of desktop top-level items */}
                  <div className="space-y-1">
                    <details className="group">
                      <summary className="flex items-center gap-2 w-full cursor-pointer list-none px-3 py-2.5 rounded-md font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gold/5 transition-colors">
                        <Sparkles className="w-4 h-4 text-gold" />
                        Studios
                        <ChevronDown className="w-4 h-4 ml-auto transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="pl-4 mt-1 space-y-1 border-l-2 border-gold/15">
                        {studios.map((studio) => (
                          <Link key={studio.href} href={studio.href}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 text-sm"
                              onClick={() => setMobileMenuOpen(false)}
                              data-testid={`mobile-studio-${studio.href.replace('/', '')}`}
                            >
                              <studio.icon className="w-4 h-4 text-gold" />
                              {studio.label}
                              {studio.badge && (
                                <Badge className="bg-gold text-white text-[10px] px-1.5 py-0 ml-auto">
                                  {studio.badge}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        ))}
                        {quickTools.map((tool) => (
                          <Link key={tool.href} href={tool.href}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <tool.icon className="w-4 h-4" />
                              {tool.label}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </details>
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start gap-2 font-semibold text-sm transition-colors ${
                            link.isHighlight ? "text-red-600 dark:text-red-500" : "text-gray-700 dark:text-gray-300"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`mobile-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  {!user && (
                    <div className="pt-4 space-y-2 animate-scale-in">
                      <Button 
                        className="w-full bg-gold text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        Get Started
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-gold/30 transition-all duration-300 hover:bg-gold/5"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        Log In
                      </Button>
                    </div>
                  )}

                  {user && (
                    <div className="pt-4 border-t border-gold/10">
                      <Button 
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 transition-all duration-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                        onClick={() => window.location.href = "/api/logout"}
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

interface CreditBalanceData {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

function CreditBalancePill() {
  const { data, isLoading } = useQuery<CreditBalanceData>({
    queryKey: ["/api/credits/balance"],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const total = data?.total ?? 0;
  const isOut = !isLoading && total <= 0;
  const isLow = !isLoading && total > 0 && total < 25;
  const formatted = total >= 1000 ? `${(total / 1000).toFixed(total >= 10000 ? 0 : 1)}k` : total.toLocaleString();

  const pillStyle = isOut
    ? "bg-red-500/15 hover:bg-red-500/25 border border-red-500/40"
    : isLow
      ? "bg-gold/20 hover:bg-gold/30 border border-gold/50 animate-pulse"
      : "bg-gold/10 hover:bg-gold/20";
  const textColor = isOut ? "text-red-400" : "text-gold";

  return (
    <WouterLink
      href="/pricing"
      className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105 ${pillStyle}`}
      data-testid="link-credit-balance"
      aria-label={isOut ? "Out of credits — upgrade" : `${total} credits available`}
    >
      <Coins className={`w-4 h-4 ${textColor} transition-transform duration-300`} />
      <span className={`text-sm font-bold ${textColor}`} data-testid="credit-balance">
        {isLoading ? "…" : formatted}
      </span>
      {isOut && <span className="text-xs font-semibold text-red-400">· Upgrade</span>}
      {isLow && !isOut && <span className="text-xs font-semibold text-gold">· Low</span>}
    </WouterLink>
  );
}

function PowerPointsBell() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/power-points/unread-count"],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const count = data?.count ?? 0;
  return (
    <WouterLink
      href="/power-points/inbox"
      className="relative hidden md:inline-flex items-center justify-center h-9 w-9 rounded-md text-gold hover-elevate"
      data-testid="link-power-points"
      aria-label={count > 0 ? `${count} unread Power Points` : "Power Points"}
    >
      <Zap className="w-5 h-5" />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-black text-[10px] font-bold leading-[18px] text-center"
          data-testid="badge-power-unread"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </WouterLink>
  );
}
