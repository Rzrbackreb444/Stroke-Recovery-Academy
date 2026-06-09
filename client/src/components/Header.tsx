import React from 'react';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  GraduationCap,
  Users,
  Brain,
  Heart,
  ShoppingBag,
  Bell,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * SRA Global Header — survivor-first navigation.
 * Replaces the old creator-economy header. Stroke Recovery Academy branding is gone;
 * this is the Stroke Recovery Academy across every public page.
 */
export default function GlobalHeader() {
  const [, navigate] = useLocation();

  return (
    <nav
      className="h-16 border-b border-[#E2741B]/15 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xl z-[100] font-sans shadow-sm"
      data-testid="global-header"
    >
      {/* Brand wordmark */}
      <div className="flex items-center gap-8">
        <Link href="/" data-testid="link-brand-home">
          <div className="flex flex-col leading-tight cursor-pointer group">
            <span className="text-base sm:text-lg font-black tracking-tight uppercase text-[#0D0D0D] group-hover:text-[#E2741B] transition-colors">
              Stroke Recovery Academy
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#E2741B]/80">
              By Nick Kremers · 7-Year Survivor
            </span>
          </div>
        </Link>

        {/* Primary nav (desktop) */}
        <div className="hidden lg:flex items-center gap-6 text-[11px] uppercase tracking-[0.18em] font-bold text-black/70">
          <Link
            href="/recovery/dashboard"
            className="flex items-center gap-2 hover:text-[#E2741B] transition-colors"
            data-testid="link-nav-dashboard"
          >
            <Activity className="w-3.5 h-3.5" /> Dashboard
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 hover:text-[#E2741B] transition-colors outline-none"
              data-testid="dropdown-nav-recovery"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Recovery <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-[#E2741B]/20 shadow-2xl p-2 w-60">
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/academy')}>
                Recovery Academy
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/exercises')}>
                Exercises
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/protocols')}>
                Protocols
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/center-finder')}>
                Center Finder
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/blog')}>
                Blog
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/games')}>
                Brain Games
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 hover:text-[#E2741B] transition-colors outline-none"
              data-testid="dropdown-nav-programs"
            >
              <Brain className="w-3.5 h-3.5" /> Programs <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-[#E2741B]/20 shadow-2xl p-2 w-60">
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/programs/sasquatch-method')}>
                The Sasquatch Method
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/programs/66-day-challenge')}>
                66-Day Challenge
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/programs/daily-routine')}>
                Daily Routine
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase py-3" onClick={() => navigate('/recovery/sasquatch-coach')}>
                Sasquatch Coach (AI)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/recovery/community"
            className="flex items-center gap-2 hover:text-[#E2741B] transition-colors"
            data-testid="link-nav-community"
          >
            <Users className="w-3.5 h-3.5" /> Community
          </Link>

          <Link
            href="/store"
            className="flex items-center gap-2 hover:text-[#E2741B] transition-colors"
            data-testid="link-nav-store"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Survivor Shop
          </Link>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <Badge className="hidden md:inline-flex bg-[#E2741B]/10 text-[#E2741B] border-none text-[9px] uppercase px-3 py-1 font-black tracking-widest">
          <Heart className="w-3 h-3 mr-1.5" /> Built By A Survivor
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex relative text-black/60"
          aria-label="Notifications"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
        </Button>

        <Button
          variant="default"
          size="sm"
          className="hidden sm:inline-flex bg-[#E2741B] text-black font-bold uppercase tracking-wider text-[11px] hover:bg-[#E2741B]/90"
          onClick={() => navigate('/recovery/dashboard')}
          data-testid="button-start-recovery"
        >
          Start Recovery
        </Button>

        {/* Mobile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Menu"
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border-[#E2741B]/20 shadow-2xl p-2 w-56">
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/recovery/dashboard')}>Dashboard</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/recovery/academy')}>Recovery Academy</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/recovery/exercises')}>Exercises</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/recovery/center-finder')}>Center Finder</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/programs/66-day-challenge')}>66-Day Challenge</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/recovery/community')}>Community</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/games')}>Brain Games</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-semibold py-3" onClick={() => navigate('/store')}>Survivor Shop</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
