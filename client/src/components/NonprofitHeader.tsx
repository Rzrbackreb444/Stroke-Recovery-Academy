import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Heart,
  Gift,
  GraduationCap,
  Users,
  Menu,
  X,
  User,
  LogOut,
  Target,
  Home,
  BookOpen,
  Phone,
  ShoppingBag,
  Bell,
} from "lucide-react";
import strokeLyfeLogo from "@assets/Stroke_Recovery_Academy_Crowned_Brain_Logo_1776589115629.png";

const navLinks = [
  { href: "/strokelyfe", label: "HOME", icon: Home },
  { href: "/recovery/academy", label: "ACADEMY", icon: GraduationCap },
  { href: "/store", label: "STORE", icon: ShoppingBag },
  { href: "/recovery/community", label: "COMMUNITY", icon: Users },
  { href: "/recovery/reminders", label: "REMINDERS", icon: Bell },
  { href: "/recovery/gift", label: "GIFT A SURVIVOR", icon: Gift },
];

export default function NonprofitHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  const scrollToDonate = () => {
    const donateSection = document.getElementById('donate');
    if (donateSection) {
      donateSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToScholarships = () => {
    const scholarshipSection = document.getElementById('scholarships');
    if (scholarshipSection) {
      scholarshipSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#C9941A] border-b border-[#C9941A]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/strokelyfe" className="flex items-center gap-3">
            <img 
              src={strokeLyfeLogo} 
              alt="Stroke Lyfe" 
              className="h-40 w-auto"
              data-testid="img-nonprofit-logo"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-white font-serif">Stroke Lyfe</span>
              <span className="text-xs text-[#C9941A] block -mt-1">501(c)(3) Nonprofit</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white/80 hover:text-white hover:bg-white/10 ${
                    location === link.href ? "bg-white/10 text-white" : ""
                  }`}
                  data-testid={`link-${link.label.toLowerCase().replace(' ', '-')}`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/recovery/gift">
              <Button
                size="sm"
                variant="outline"
                className="hidden md:flex border-white/40 text-white hover:bg-white/10"
                data-testid="button-header-scholarship"
              >
                <Gift className="w-4 h-4 mr-2" />
                Gift a Survivor
              </Button>
            </Link>
            
            <Button
              size="sm"
              className="bg-white text-[#C9941A] font-bold hover:bg-white/90"
              onClick={scrollToDonate}
              data-testid="button-header-donate"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate
            </Button>

            {!isLoading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#C9941A] text-white text-xs">
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.firstName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/recovery/dashboard">
                      <Target className="w-4 h-4 mr-2" />
                      My Recovery
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recovery/academy">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Academy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!isLoading && !user && (
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-[#C9941A] border-[#C9941A]/20">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={strokeLyfeLogo} alt="Stroke Lyfe" className="h-40 w-auto" />
                    <div>
                      <span className="text-lg font-bold text-white">Stroke Lyfe</span>
                      <span className="text-xs text-[#C9941A] block">501(c)(3) Nonprofit</span>
                    </div>
                  </div>
                  
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-white/80 hover:text-white hover:bg-white/10 ${
                          location === link.href ? "bg-white/10 text-white" : ""
                        }`}
                      >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                  
                  <div className="border-t border-[#C9941A]/20 pt-4 mt-2">
                    <Button
                      className="w-full bg-[#C9941A] hover:bg-[#B8860B] text-white mb-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        scrollToDonate();
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                    </Button>
                    <Link href="/recovery/gift" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-white/40 text-white hover:bg-white/10"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Gift a Survivor
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
