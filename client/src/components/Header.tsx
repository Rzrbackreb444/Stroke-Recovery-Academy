import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, Globe, MessageSquare, DollarSign, 
  Settings, Bell, Zap, ShieldCheck, ChevronDown 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function EliteHeader() {
  return (
    <nav className="h-20 border-b-2 border-[#C9941A]/10 px-8 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xl z-[100] font-sans shadow-sm">
      <div className="flex items-center gap-10">
        <div className="flex flex-col leading-none group cursor-pointer" onClick={() => window.location.href='/'}>
          <span className="text-2xl font-black tracking-tighter uppercase text-[#C9941A] group-hover:text-black transition-colors">KreAIte</span>
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40">Author Intelligence OS</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-black opacity-60">
          <a href="/book-perfection-suite" className="flex items-center gap-2 hover:text-[#C9941A] transition-colors text-[#C9941A]"><Zap className="w-3.5 h-3.5" /> Book Perfection Suite</a>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 hover:text-[#C9941A] transition-colors outline-none">
              <LayoutGrid className="w-3.5 h-3.5" /> Studios <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-[#C9941A]/20 rounded-none shadow-2xl p-2 w-56">
              <DropdownMenuItem className="hover:bg-[#C9941A]/10 cursor-pointer text-[10px] font-bold uppercase py-3" onClick={() => window.location.href='/book-studio'}>Book Studio</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#C9941A]/10 cursor-pointer text-[10px] font-bold uppercase py-3" onClick={() => window.location.href='/music-studio'}>Music Studio</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#C9941A]/10 cursor-pointer text-[10px] font-bold uppercase py-3" onClick={() => window.location.href='/video-studio'}>Video Studio</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#C9941A]/10 cursor-pointer text-[10px] font-bold uppercase py-3" onClick={() => window.location.href='/course-studio'}>Course Studio</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#C9941A]/10 cursor-pointer text-[10px] font-bold uppercase py-3" onClick={() => window.location.href='/website-studio'}>Website Builder</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a href="/marketplace" className="flex items-center gap-2 hover:text-[#C9941A] transition-colors"><Globe className="w-3.5 h-3.5" /> KreAItorverse</a>
          <a href="/community" className="flex items-center gap-2 hover:text-[#C9941A] transition-colors"><MessageSquare className="w-3.5 h-3.5" /> Collective</a>
          <a href="/earnings" className="flex items-center gap-2 hover:text-[#C9941A] transition-colors"><DollarSign className="w-3.5 h-3.5" /> Revenue</a>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end border-r-2 border-[#C9941A]/10 pr-6">
          <Badge className="bg-[#C9941A]/10 text-[#C9941A] border-none text-[9px] uppercase px-4 py-1.5 font-black tracking-widest shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 mr-2" /> 85% Margin Mode
          </Badge>
          <span className="text-[9px] font-black opacity-30 mt-1.5 uppercase tracking-widest">Institutional Level v3.0</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-[#C9941A]/10 text-black/60 rounded-none"
            aria-label="Notifications"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-[#C9941A]/10 text-black/60 rounded-none" 
            onClick={() => window.location.href='/settings'}
            aria-label="Settings"
            data-testid="button-settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <div className="w-11 h-11 bg-[#1A1A1A] text-white flex items-center justify-center font-black text-xs cursor-pointer hover:bg-[#C9941A] transition-all shadow-lg">
            NK
          </div>
        </div>
      </div>
    </nav>
  );
}