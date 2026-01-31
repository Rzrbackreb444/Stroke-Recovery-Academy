import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  X, 
  LayoutDashboard,
  GraduationCap,
  Hammer,
  Dumbbell,
  Building2,
  Users,
  ChevronDown,
  Heart,
  Settings,
  LogOut,
  ArrowLeft,
  Activity,
  Brain,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import strokeLyfeLogo from "@assets/stroked-out-sasquatch-logo.png";

const navLinks = [
  { href: "/recovery", label: "HOME", icon: Heart, description: "Recovery landing page" },
  { href: "/recovery/academy", label: "COURSES", icon: GraduationCap, description: "Learn recovery techniques" },
  { href: "/recovery/dashboard", label: "PROGRESS", icon: Target, description: "Track your recovery journey" },
  { href: "/recovery/protocols", label: "PROTOCOLS", icon: Activity, description: "Recovery programs" },
  { href: "/recovery/blog", label: "BLOG", icon: BookOpen, description: "Articles & survivor stories" },
  { href: "/recovery/center-finder", label: "CENTERS", icon: Building2, description: "Find rehab centers" },
];

const quickFeatures = [
  { href: "/my-book", label: "My Book", icon: BookOpen, description: "Write your recovery story" },
  { href: "/recovery/resources", label: "Resources", icon: Building2, description: "Guides and tools" },
  { href: "/recovery/exercises", label: "Exercises", icon: Activity, description: "Daily routines" },
  { href: "/recovery/social", label: "Community", icon: Users, description: "Connect with survivors" },
];

export default function RecoveryHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#C9941A]/30 shadow-lg shadow-black/50" 
        : "bg-[#0D0D0D] border-b border-[#333]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/creator-landing" data-testid="link-back-kreate">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#C9941A] gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">KreAIte</span>
              </Button>
            </Link>
            
            <Link href="/recovery" data-testid="link-recovery-home">
              <div className="flex items-center gap-3 hover-elevate active-elevate-2 px-3 py-1 rounded-lg cursor-pointer transition-all duration-300 group">
                <img 
                  src={strokeLyfeLogo} 
                  alt="Stroke Recovery Academy" 
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(201,148,26,0.6)]"
                  data-testid="img-recovery-logo"
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-[#C9941A] to-[#C9941A] bg-clip-text text-transparent transition-all duration-300">
                    STROKE RECOVERY ACADEMY
                  </div>
                  <div className="text-[10px] font-semibold text-[#C9941A]/70 uppercase tracking-wider">
                    Your Path to Recovery
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-bold text-xs tracking-wider text-white gap-1 text-gray-300 transition-colors duration-300"
                  data-testid="dropdown-features"
                >
                  <Sparkles className="w-4 h-4 text-[#C9941A] transition-all duration-300 group-hover:animate-spin" />
                  FEATURES
                  <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-gradient-to-b from-zinc-900 to-black border border-[#C9941A]/40 backdrop-blur-md shadow-2xl shadow-black/40 animate-in fade-in-50 duration-200">
                {quickFeatures.map((feature) => (
                  <DropdownMenuItem key={feature.href} asChild>
                    <Link href={feature.href}>
                      <div className="flex items-start gap-3 py-2 px-1 cursor-pointer w-full hover-elevate rounded-lg transition-all duration-200" data-testid={`link-feature-${feature.label.toLowerCase().replace(" ", "-")}`}>
                        <feature.icon className="w-5 h-5 text-[#C9941A] mt-0.5 transition-transform duration-300 group-hover:scale-110" />
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm">
                            {feature.label}
                          </div>
                          <div className="text-xs text-gray-400">{feature.description}</div>
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.map((link) => (
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`link-${link.label.toLowerCase()}`}
                    className="font-bold text-xs tracking-wider gap-1 text-[#C9941A] text-gray-300 hover:bg-red-500/10 transition-all duration-300 rounded-lg"
                  >
                    <link.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    {link.label}
                  </Button>
                </a>
              ) : (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid={`link-${link.label.toLowerCase()}`}
                    className={`font-bold text-xs tracking-wider gap-1 rounded-lg transition-all duration-300 ${
                      location === link.href 
                        ? "text-[#C9941A] bg-[#C9941A]/20 border border-red-500/30" 
                        : "text-gray-300 text-gray-300 hover-elevate hover:border hover:border-red-500/20"
                    }`}
                  >
                    <link.icon className="w-4 h-4 transition-transform duration-300" />
                    {link.label}
                  </Button>
                </Link>
              )
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-red-500/30 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover-elevate transition-colors duration-300 rounded-lg" data-testid="dropdown-user">
                    <Avatar className="h-7 w-7 border-2 border-red-500/50 transition-all duration-300 hover:border-red-500">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#C9941A]/30 text-[#C9941A] text-xs font-bold">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-gray-400 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gradient-to-b from-zinc-900 to-black border border-[#C9941A]/40 backdrop-blur-md shadow-2xl shadow-black/40">
                  <div className="px-3 py-2 border-b border-[#C9941A]/30">
                    <div className="font-bold text-white">{user.firstName || 'Survivor'}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                    <Badge variant="outline" className="mt-2 text-[10px] border-red-500/50 text-[#C9941A] bg-[#C9941A]/10">
                      <Heart className="w-3 h-3 mr-1" />
                      Recovery Member
                    </Badge>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/recovery/dashboard" className="cursor-pointer hover-elevate transition-colors duration-200">
                      <LayoutDashboard className="w-4 h-4 mr-2 text-[#C9941A]" />
                      My Progress
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer hover-elevate transition-colors duration-200">
                      <Settings className="w-4 h-4 mr-2 text-[#C9941A]" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-red-700/20" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-[#C9941A] focus:text-[#C9941A] hover:bg-[#C9941A]/20 transition-colors duration-200"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                data-testid="button-join"
                onClick={() => window.location.href = '/api/login'}
                className="font-bold text-xs tracking-wider bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-[#C9941A] transition-all duration-300 rounded-lg shadow-lg shadow-red-600/50 hover:shadow-xl hover:shadow-red-600/70 border border-red-500/50 hover:border-red-400/80"
              >
                JOIN RECOVERY
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white text-gray-300 hover-elevate transition-all duration-300 rounded-lg"
            data-testid="button-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 transition-transform duration-300 rotate-90" /> : <Menu className="h-5 w-5 transition-transform duration-300" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-[#C9941A]/30 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-[#C9941A]/10 rounded-lg border border-red-500/20 transition-all duration-300">
                <Avatar className="h-10 w-10 border-2 border-red-500/50">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-[#C9941A]/30 text-[#C9941A] font-bold">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-white">{user.firstName || 'Survivor'}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>
            )}
            
            <Link href="/creator-landing">
              <Button
                variant="ghost"
                className="w-full justify-start text-[#C9941A] hover:text-red-300 hover-elevate gap-3 mb-2 transition-all duration-300 rounded-lg font-semibold"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-link-back"
              >
                <ArrowLeft className="w-5 h-5 transition-transform duration-300 -rotate-90 group-hover:rotate-0" />
                Back to KreAIte
              </Button>
            </Link>
            
            <div className="border-t border-[#C9941A]/30 my-2" />
            <div className="text-xs font-black text-[#C9941A] uppercase tracking-wider px-3 py-2">
              Recovery Navigation
            </div>
            
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 transition-all duration-300 rounded-lg ${
                    location === link.href 
                      ? "bg-[#C9941A]/20 border border-red-500/30 text-[#C9941A]" 
                      : "hover-elevate text-gray-300 text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase()}`}
                >
                  <link.icon className="w-5 h-5 text-[#C9941A] transition-transform duration-300" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{link.label}</div>
                    <div className="text-[10px] text-gray-400">{link.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
            
            <div className="pt-2 space-y-2 border-t border-[#C9941A]/30 mt-2">
              {user ? (
                <>
                  <Link href="/settings">
                    <Button
                      variant="outline"
                      className="w-full border-red-500/30 text-[#C9941A] hover-elevate hover:text-red-300 transition-all duration-300 rounded-lg font-semibold gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/40 text-[#C9941A] hover:bg-[#C9941A]/20 hover:text-red-300 transition-all duration-300 rounded-lg font-semibold gap-2"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-[#C9941A] transition-all duration-300 rounded-lg font-bold shadow-lg shadow-red-600/50 hover:shadow-xl hover:shadow-red-600/70 border border-red-500/50"
                  data-testid="mobile-button-join"
                  onClick={() => window.location.href = '/api/login'}
                >
                  JOIN RECOVERY
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
