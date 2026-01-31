import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import kreaiteLogo from "@assets/Untitled_design.zip_-_1_1769816069353.png";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

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
    : "border-[#C9941A]/10";

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${headerBg} border-b ${borderClass} shadow-sm`}
      data-testid="global-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 lg:h-18">
          <div className="flex items-center gap-8">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-2 group cursor-pointer transition-transform duration-300 hover:scale-105">
                <img 
                  src={kreaiteLogo} 
                  alt="KreAIte" 
                  className="h-10 w-auto object-contain"
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
                    <Sparkles className="w-4 h-4 text-[#C9941A] transition-transform duration-300 group-hover:scale-110" />
                    Studios
                    <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-2 bg-[#FAF8F3] dark:bg-[#1a1a1a] border-[#C9941A]/20 animate-scale-in">
                  <DropdownMenuLabel className="text-xs font-bold text-[#C9941A] uppercase tracking-wider px-2">
                    Creator Studios
                  </DropdownMenuLabel>
                  {studios.map((studio, idx) => (
                    <DropdownMenuItem 
                      key={studio.href} 
                      asChild 
                      className="cursor-pointer p-3 rounded-lg transition-all duration-200 hover:bg-[#C9941A]/5"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <Link href={studio.href} className="flex items-center gap-3 w-full group">
                        <div className="w-10 h-10 rounded-lg bg-[#C9941A]/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <studio.icon className="w-5 h-5 text-[#C9941A] transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {studio.label}
                            </span>
                            {studio.badge && (
                              <Badge className="bg-[#C9941A] text-white text-[10px] px-1.5 py-0 animate-subtle-float">
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
                  <DropdownMenuSeparator className="bg-[#C9941A]/10 my-2" />
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
                        ? "text-[#C9941A] bg-[#C9941A]/5" 
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                    data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <link.icon className={`w-4 h-4 transition-transform duration-300 ${
                      link.isHighlight ? "animate-subtle-float" : ""
                    }`} />
                    {link.label}
                    {!link.isHighlight && (
                      <div className="absolute bottom-0 left-1/2 h-0.5 bg-[#C9941A] opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-full group-hover:left-0" />
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
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#C9941A]/10 rounded-full transition-all duration-300 hover:bg-[#C9941A]/20 hover:scale-105">
                <Coins className="w-4 h-4 text-[#C9941A] transition-transform duration-300 animate-subtle-float" />
                <span className="text-sm font-bold text-[#C9941A]" data-testid="credit-balance">
                  2,500
                </span>
              </div>
            )}

            <div className="relative hidden md:flex items-center">
              {searchOpen ? (
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search studios..."
                  className="w-48 h-9 px-3 py-2 bg-[#FAF8F3] dark:bg-gray-800 border-[#C9941A]/20 focus:border-[#C9941A] animate-search-slide-out"
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
                  className="bg-[#C9941A] text-white font-semibold shadow-lg shadow-[#C9941A]/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#C9941A]/40"
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
                    <Avatar className="h-9 w-9 border-2 border-[#C9941A]/30 transition-all duration-300">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#C9941A] text-white font-bold text-sm">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-[#FAF8F3] dark:bg-[#1a1a1a] border-[#C9941A]/20 animate-scale-in">
                  <div className="px-3 py-2 mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user.firstName || "Creator"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-[#C9941A]/10" />
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-[#C9941A]/5">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-[#C9941A]/5">
                    <Link href="/author-dashboard" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Earnings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-[#C9941A]/5">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#C9941A]/10" />
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
                <SheetHeader className="p-4 border-b border-[#C9941A]/10">
                  <SheetTitle className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                    <img 
                      src={kreaiteLogo} 
                      alt="KreAIte" 
                      className="h-8 w-auto object-contain"
                    />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="p-4 space-y-6">
                  {user && (
                    <div className="flex items-center gap-3 p-3 bg-[#C9941A]/10 rounded-lg transition-all duration-300 hover:bg-[#C9941A]/20 animate-scale-in">
                      <Avatar className="h-10 w-10 border-2 border-[#C9941A]/30 transition-all duration-300">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-[#C9941A] text-white font-bold">
                          {user.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user.firstName || "Creator"}</p>
                        <div className="flex items-center gap-1 text-xs text-[#C9941A]">
                          <Coins className="w-3 h-3 animate-subtle-float" />
                          <span className="font-bold">2,500 credits</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-[#C9941A] uppercase tracking-wider mb-2">Studios</p>
                    <div className="space-y-1">
                      {studios.map((studio, idx) => (
                        <Link key={studio.href} href={studio.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-3 transition-all duration-300 hover:bg-[#C9941A]/5"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#C9941A]/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                              <studio.icon className="w-4 h-4 text-[#C9941A]" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{studio.label}</span>
                                {studio.badge && (
                                  <Badge className="bg-[#C9941A] text-white text-[10px] px-1.5 py-0 animate-subtle-float">
                                    {studio.badge}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{studio.description}</span>
                            </div>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Navigate</p>
                    <div className="space-y-1">
                      {navLinks.map((link, idx) => (
                        <Link key={link.href} href={link.href}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start gap-2 transition-all duration-300 ${
                              link.isHighlight ? "text-red-600 dark:text-red-500" : ""
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ animationDelay: `${(studios.length + idx) * 30}ms` }}
                          >
                            <link.icon className={`w-4 h-4 transition-transform duration-300 ${
                              link.isHighlight ? "animate-subtle-float" : ""
                            }`} />
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {!user && (
                    <div className="pt-4 space-y-2 animate-scale-in">
                      <Button 
                        className="w-full bg-[#C9941A] text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        Get Started
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-[#C9941A]/30 transition-all duration-300 hover:bg-[#C9941A]/5"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        Log In
                      </Button>
                    </div>
                  )}

                  {user && (
                    <div className="pt-4 border-t border-[#C9941A]/10">
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
