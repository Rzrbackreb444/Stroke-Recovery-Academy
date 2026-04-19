import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Settings, Heart } from "lucide-react";
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
import strokeLyfeLogo from "@assets/Stroke_Recovery_Academy_Crowned_Brain_Logo_1776589115629.png";

const navLinks = [
  { href: "/recovery/challenge", label: "66-Day Challenge" },
  { href: "/recovery/community", label: "Community" },
  { href: "/recovery/academy", label: "Academy" },
  { href: "/recovery/brain-gym", label: "Brain Gym" },
  { href: "/recovery/sasquatch-coach", label: "AI Coach" },
  { href: "/recovery/blog", label: "Blog" },
  { href: "/recovery/spotlight", label: "Spotlight" },
  { href: "/recovery/pricing", label: "Pricing" },
  { href: "/recovery/survivor-income", label: "Earn Income" },
];

export default function RecoveryHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#1e1e1e]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-32">

          {/* Logo */}
          <Link href="/recovery" data-testid="link-recovery-home">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img
                src={strokeLyfeLogo}
                alt="Stroke Recovery Academy"
                className="h-28 w-auto"
                data-testid="img-recovery-logo"
              />
              <span className="hidden sm:block text-sm font-bold text-white tracking-wide">
                Stroke Recovery Academy
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/recovery/gift">
              <Button
                size="sm"
                variant="outline"
                className="border-[#C9941A]/50 text-[#C9941A] hover:bg-[#C9941A]/10 font-semibold text-xs"
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
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
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
            <div className="pt-3 border-t border-[#1e1e1e] flex flex-col gap-2">
              <Link href="/recovery/gift">
                <Button variant="outline" className="w-full border-[#C9941A]/50 text-[#C9941A] justify-start gap-2" data-testid="mobile-button-gift">
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
