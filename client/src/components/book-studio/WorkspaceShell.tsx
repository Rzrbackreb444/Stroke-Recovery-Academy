import { ReactNode, useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import ProjectNavigator, { NavigatorItem, NavigatorSection } from "./ProjectNavigator";
import IntelligenceHUD from "./IntelligenceHUD";
import ProfessionalEditor from "../ProfessionalEditor";

export default function WorkspaceShell({ children }: { children?: ReactNode }) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activePane, setActivePane] = useState<'navigator' | 'forge' | 'hud'>('forge');
  const [selectedItem, setSelectedItem] = useState<NavigatorItem | null>(null);

  // KEYBOARD SHORTCUTS FOR ZEN MODE (⌘.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        setLeftCollapsed(prev => !prev);
        setRightCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-400 overflow-hidden font-sans selection:bg-orange-500/30">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        
        {/* LEFT PANE: THE STUDIO NAVIGATOR */}
        <ResizablePanel 
          defaultSize={15} 
          collapsible={true}
          minSize={10}
          onCollapse={() => setLeftCollapsed(true)}
          onExpand={() => setLeftCollapsed(false)}
          onClick={() => setActivePane('navigator')}
          className={cn(
            "bg-[#121212] border-r border-zinc-800/50 transition-all duration-500 ease-in-out",
            activePane === 'navigator' ? "ring-1 ring-inset ring-orange-500/20" : "opacity-80",
            leftCollapsed && "min-w-[60px]"
          )}
        >
          <div className="h-full flex flex-col backdrop-blur-md">
            <ProjectNavigator 
              selectedItem={selectedItem} 
              onSelectItem={setSelectedItem}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800 hover:bg-orange-500/50 transition-colors w-[2px]" />

        {/* CENTER PANE: THE FORGE (MANUSCRIPT COMMAND) */}
        <ResizablePanel 
          defaultSize={60} 
          minSize={30} 
          onClick={() => setActivePane('forge')}
          className={cn(
            "relative bg-[#1A1A1A] transition-all duration-300",
            activePane === 'forge' && "shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
          )}
        >
          {/* PRECISION RULER OVERLAY */}
          <div className="absolute top-0 left-0 w-full h-8 bg-black/20 border-b border-zinc-800/30 flex items-center px-4 text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
            <span>Precision Mode // KDP Pre-Flight Enabled</span>
            <div className="ml-auto flex gap-4">
              <span>Gutter: 0.125"</span>
              <span>Bleed: 0.25"</span>
            </div>
          </div>

          <div className="h-full flex flex-col items-center overflow-y-auto pt-16 pb-32 px-4 sm:px-12 scrollbar-hide">
            <div className={cn(
              "w-full max-w-3xl rounded-sm transition-transform duration-700 ease-out",
              activePane === 'forge' ? "scale-100 opacity-100" : "scale-[0.98] opacity-60"
            )}>
              {children || <ProfessionalEditor />}
            </div>
          </div>

          {/* SYSTEM PULSE STATUS BAR */}
          <div className="absolute bottom-0 left-0 w-full h-10 bg-[#121212] border-t border-zinc-800/50 flex items-center px-6 text-[10px] font-mono tracking-tighter text-zinc-500">
            <div className="flex items-center gap-2 text-orange-500/80">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>DOCTRINE SYNC: 100%</span>
            </div>
            <div className="mx-auto flex gap-8">
              <span>PAGES: 412 / 200,000 WORDS</span>
              <span>HEALTH: OPTIMAL</span>
            </div>
            <div className="flex gap-4">
              <span>AUTOSAVE: SUCCESS</span>
              <span className="text-zinc-700">|</span>
              <span className="hover:text-orange-500 cursor-help">SYSTEM INFO</span>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800 hover:bg-orange-500/50 transition-colors w-[2px]" />

        {/* RIGHT PANE: INTELLIGENCE HUD */}
        <ResizablePanel 
          defaultSize={25} 
          collapsible={true}
          minSize={15}
          onCollapse={() => setRightCollapsed(true)}
          onExpand={() => setRightCollapsed(false)}
          onClick={() => setActivePane('hud')}
          className={cn(
            "bg-[#121212] border-l border-zinc-800/50 transition-all duration-500 ease-in-out",
            activePane === 'hud' ? "ring-1 ring-inset ring-orange-500/20" : "opacity-80",
            rightCollapsed && "min-w-[60px]"
          )}
        >
          <IntelligenceHUD collapsed={rightCollapsed} active={activePane === 'hud'} />
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}