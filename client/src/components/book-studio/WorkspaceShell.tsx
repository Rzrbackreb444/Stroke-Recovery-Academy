import React, { useState } from 'react';
import { 
  Book, 
  Settings, 
  Menu, 
  PanelLeft, 
  PanelRight, 
  Database,
  Search,
  Layout,
  FileText,
  Activity
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface WorkspaceProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function WorkspaceShell({ children, leftPanel, rightPanel }: WorkspaceProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      
      {/* --- TOP COMMAND BAR --- */}
      {/* Glassmorphism header with subtle bottom border */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl z-50">
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-orange-500">
            <Database className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-widest text-zinc-100">KREAITE</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          
          {/* Breadcrumbs - Mono for technical feel */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            <span>Project</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-300">Laundromat Doctrine</span>
            <span className="text-zinc-700">/</span>
            <span className="text-orange-400">Chapter 06</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center rounded-md bg-zinc-900/50 border border-white/5 px-2 py-1 text-[10px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
              SYSTEM OPTIMAL
           </div>
           <button className="rounded p-1.5 hover:bg-white/5 transition-colors">
              <Settings className="h-4 w-4 text-zinc-400" />
           </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE AREA --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL - PROJECT NAVIGATOR */}
        {/* Uses negative margins for smooth collapsible animations */}
        <aside 
          className={cn(
            "group relative z-40 flex flex-col border-r border-white/5 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
            leftOpen ? "w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 overflow-hidden"
          )}
        >
          <div className="flex-1 overflow-y-auto p-2">
            {leftPanel || (
              <div className="p-4 text-center text-xs text-zinc-600 font-mono">
                NO NAVIGATOR LOADED
              </div>
            )}
          </div>
          
          {/* Collapse Handle */}
           <button 
            onClick={() => setLeftOpen(!leftOpen)}
            className="absolute -right-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-xl hover:text-white hover:scale-110 transition-all"
          >
            <PanelLeft className="h-3 w-3" />
          </button>
        </aside>


        {/* CENTER STAGE - THE MANUSCRIPT FORGE */}
        <main className="flex-1 relative z-0 flex flex-col overflow-hidden bg-dot-pattern">
          
          {/* Subtle background gradient for atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-zinc-900/50 pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 lg:px-24 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {/* The "Paper" Container - Floating Effect */}
            <div className="mx-auto min-h-[800px] max-w-3xl bg-[#09090b] relative rounded-lg border border-white/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] ring-1 ring-white/5">
              {children}
            </div>
            
            {/* Bottom Padding for scrolling comfort */}
            <div className="h-32" />
          </div>

          {/* Floating Status Bar - Bottom Center */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-1.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 border-r border-white/10 pr-3">
              <FileText className="h-3 w-3 text-zinc-500" />
              <span className="text-[10px] font-mono font-medium text-zinc-300">2,405 WORDS</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-[10px] font-mono font-medium text-zinc-300">SYNC ACTIVE</span>
            </div>
          </div>
        </main>


        {/* RIGHT PANEL - INTELLIGENCE HUD */}
        <aside 
          className={cn(
            "relative z-40 flex flex-col border-l border-white/5 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
            rightOpen ? "w-80 translate-x-0 opacity-100" : "w-0 translate-x-full opacity-0 overflow-hidden"
          )}
        >
          <div className="flex h-10 items-center justify-between border-b border-white/5 px-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Intelligence HUD</span>
            <div className="flex gap-1">
               <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
               <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
               <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
             {rightPanel || (
               <div className="flex h-full flex-col items-center justify-center space-y-2 text-zinc-600">
                 <Search className="h-8 w-8 opacity-20" />
                 <span className="text-xs font-mono">AWAITING DATA LINK</span>
               </div>
             )}
          </div>

           <button 
            onClick={() => setRightOpen(!rightOpen)}
            className="absolute -left-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-xl hover:text-white hover:scale-110 transition-all"
          >
            <PanelRight className="h-3 w-3" />
          </button>
        </aside>

      </div>
    </div>
  );
}