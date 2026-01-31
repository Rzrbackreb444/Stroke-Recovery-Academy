import { useState, useCallback, ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import ProAIToolbar from "./ProAIToolbar";
import {
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  BookOpen,
  Zap,
  Settings,
  User,
  Database,
  Activity,
  FileText,
} from "lucide-react";

interface WorkspaceShellProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  manuscriptTitle?: string;
  onAIAction?: (action: string, params?: any) => void;
  isGenerating?: boolean;
}

export function WorkspaceShell({ 
  children, 
  leftPanel,
  rightPanel,
  manuscriptTitle = "Untitled Manuscript",
  onAIAction,
  isGenerating = false,
}: WorkspaceShellProps) {
  const { bookOutline } = useBookStudio();
  const creditBalance = 500; // Default credit balance - would come from user account
  const [isDark, setIsDark] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  const totalWords = bookOutline?.chapters?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0;

  // Focus Mode - Clean distraction-free view
  if (isFocusMode) {
    return (
      <div className={cn(
        "h-screen w-full flex flex-col transition-colors duration-500 font-serif",
        isDark ? "bg-stone-950 text-stone-200" : "bg-[#FAF8F3] text-[#1A1A1A]"
      )}>
        {/* Minimal Focus Header */}
        <header className={cn(
          "h-10 flex items-center justify-between px-6 border-b transition-colors",
          isDark ? "border-stone-800/30 bg-stone-950" : "border-[#C9941A]/10 bg-[#FAF8F3]"
        )}>
          <span className={cn(
            "text-xs font-medium",
            isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
          )}>
            {manuscriptTitle}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7"
              data-testid="button-toggle-theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFocusMode}
              className="h-7 gap-1.5 text-xs"
              data-testid="button-exit-focus"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              Exit Focus
            </Button>
          </div>
        </header>

        {/* Clean Editor Area */}
        <ScrollArea className="flex-1">
          <main className={cn(
            "max-w-3xl mx-auto py-16 px-8 min-h-full",
            isDark ? "text-stone-200" : "text-[#1A1A1A]"
          )}>
            {children}
          </main>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen w-full flex flex-col transition-colors duration-300 font-serif overflow-hidden",
      isDark ? "bg-stone-950 text-stone-200" : "bg-[#FAF8F3] text-[#1A1A1A]"
    )}>
      {/* Professional Command Bar */}
      <header className={cn(
        "h-14 flex items-center justify-between px-6 border-b z-50 shrink-0",
        isDark 
          ? "bg-stone-950/80 backdrop-blur-xl border-stone-800/50" 
          : "bg-white/80 backdrop-blur-xl border-[#C9941A]/20"
      )}>
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[#C9941A] font-black text-lg tracking-tighter uppercase">
              KreAIte
            </span>
            <span className={cn(
              "text-[8px] uppercase tracking-[0.3em]",
              isDark ? "text-stone-600" : "text-[#1A1A1A]/30"
            )}>
              Author Intelligence OS
            </span>
          </div>
          <div className={cn(
            "h-6 w-px",
            isDark ? "bg-stone-800" : "bg-[#C9941A]/20"
          )} />
          <div className="flex items-center gap-2">
            <BookOpen className={cn("h-4 w-4", isDark ? "text-stone-500" : "text-[#1A1A1A]/30")} />
            <h1 className={cn(
              "text-sm font-medium",
              isDark ? "text-stone-300" : "text-[#1A1A1A]/70"
            )}>
              {manuscriptTitle}
            </h1>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Focus Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFocusMode}
                className={cn(
                  "h-8 w-8 rounded-sm",
                  isDark ? "text-stone-400 hover:text-stone-200" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                )}
                data-testid="button-focus-mode"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Focus Mode</TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(
                  "h-8 w-8 rounded-sm",
                  isDark ? "text-stone-400 hover:text-amber-400" : "text-[#1A1A1A]/50 hover:text-[#C9941A]"
                )}
                data-testid="button-toggle-theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isDark ? 'Stone Theme' : 'Ink Theme'}</TooltipContent>
          </Tooltip>

          <div className={cn(
            "h-6 w-px",
            isDark ? "bg-stone-800" : "bg-[#C9941A]/20"
          )} />

          {/* Tier Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-sm",
            isDark ? "bg-stone-900/50" : "bg-[#C9941A]/5"
          )}>
            <Zap className="h-3.5 w-3.5 text-[#C9941A]" />
            <span className={cn(
              "text-xs font-mono font-semibold",
              isDark ? "text-stone-300" : "text-[#1A1A1A]"
            )}>
              {creditBalance?.toLocaleString() || '500'}
            </span>
            <Badge 
              variant="outline" 
              className="text-[8px] uppercase tracking-wider border-[#C9941A]/30 text-[#C9941A]"
            >
              Pro
            </Badge>
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-sm",
              isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
            )}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
            )}
            data-testid="button-profile"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* AI Toolbar */}
      <ProAIToolbar 
        isDark={isDark} 
        onAction={onAIAction}
        isGenerating={isGenerating}
        creditBalance={creditBalance || 500}
        tierLevel="author"
      />

      {/* Main Workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel: Knowledge Codex Navigator */}
        {leftPanelOpen && (
          <>
            <ResizablePanel 
              defaultSize={18} 
              minSize={15} 
              maxSize={30}
              className={cn(
                "border-r transition-colors relative",
                isDark 
                  ? "bg-stone-950/50 backdrop-blur-sm border-stone-800/50" 
                  : "bg-white/40 backdrop-blur-sm border-[#C9941A]/10"
              )}
            >
              {leftPanel || (
                <div className="flex items-center justify-center h-full">
                  <p className={cn(
                    "text-xs font-mono",
                    isDark ? "text-stone-600" : "text-[#1A1A1A]/30"
                  )}>
                    NO NAVIGATOR LOADED
                  </p>
                </div>
              )}

              {/* Collapse Button */}
              <button 
                onClick={() => setLeftPanelOpen(false)}
                className={cn(
                  "absolute -right-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition-all",
                  isDark 
                    ? "border-stone-700 bg-stone-900 text-stone-400 hover:text-white hover:scale-110" 
                    : "border-[#C9941A]/30 bg-white text-[#1A1A1A]/50 hover:text-[#C9941A] hover:scale-110"
                )}
                data-testid="button-collapse-left"
              >
                <PanelLeftClose className="h-3 w-3" />
              </button>
            </ResizablePanel>
            <ResizableHandle 
              withHandle 
              className={cn(
                isDark ? "bg-stone-800/30" : "bg-[#C9941A]/10"
              )} 
            />
          </>
        )}

        {/* Panel Toggle - Left (Collapsed State) */}
        {!leftPanelOpen && (
          <div className={cn(
            "w-10 flex flex-col items-center pt-4 border-r relative",
            isDark 
              ? "bg-stone-950/50 border-stone-800/50" 
              : "bg-white/40 border-[#C9941A]/10"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelOpen(true)}
              className="h-8 w-8"
              data-testid="button-expand-left"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Center: Main Editor Laboratory */}
        <ResizablePanel defaultSize={!leftPanelOpen || !rightPanelOpen ? 65 : 57}>
          <div className="h-full flex flex-col relative">
            {/* Panel Controls */}
            <div className={cn(
              "flex items-center justify-between px-4 py-2 border-b shrink-0",
              isDark ? "border-stone-800/30" : "border-[#C9941A]/10"
            )}>
              {leftPanelOpen ? (
                <div className="w-7" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftPanelOpen(true)}
                  className="h-7 w-7"
                  data-testid="button-toggle-left"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <span className={cn(
                "text-[10px] uppercase tracking-widest font-bold",
                isDark ? "text-stone-600" : "text-[#1A1A1A]/30"
              )}>
                The Laboratory
              </span>
              {rightPanelOpen ? (
                <div className="w-7" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelOpen(true)}
                  className="h-7 w-7"
                  data-testid="button-toggle-right"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Editor Area */}
            <ScrollArea className={cn(
              "flex-1",
              isDark ? "bg-stone-950/20" : "bg-white/20"
            )}>
              {/* Subtle background gradient */}
              <div className={cn(
                "absolute inset-0 pointer-events-none",
                isDark 
                  ? "bg-gradient-to-b from-stone-950 via-stone-950/90 to-stone-900/50" 
                  : "bg-gradient-to-b from-[#FAF8F3] via-[#FAF8F3]/90 to-white/50"
              )} />

              <main className={cn(
                "max-w-4xl mx-auto py-12 px-8 min-h-full shadow-2xl my-8 rounded-sm relative",
                isDark 
                  ? "bg-stone-950 border border-stone-800/50" 
                  : "bg-white border border-[#C9941A]/5"
              )}>
                {children}
              </main>

              {/* Bottom padding */}
              <div className="h-32" />
            </ScrollArea>

            {/* Floating Status Bar */}
            <div className={cn(
              "absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border px-4 py-1.5 shadow-2xl backdrop-blur-md",
              isDark 
                ? "border-stone-800 bg-stone-900/80" 
                : "border-[#C9941A]/20 bg-white/80"
            )}>
              <div className="flex items-center gap-2 border-r pr-3">
                <FileText className={cn("h-3 w-3", isDark ? "text-stone-500" : "text-[#1A1A1A]/40")} />
                <span className={cn(
                  "text-[10px] font-mono font-medium",
                  isDark ? "text-stone-300" : "text-[#1A1A1A]/70"
                )}>
                  {totalWords.toLocaleString()} WORDS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-[#C9941A]" />
                <span className={cn(
                  "text-[10px] font-mono font-medium",
                  isDark ? "text-stone-300" : "text-[#1A1A1A]/70"
                )}>
                  SYNC ACTIVE
                </span>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel: Intelligence HUD */}
        {rightPanelOpen && (
          <>
            <ResizableHandle 
              withHandle 
              className={cn(
                isDark ? "bg-stone-800/30" : "bg-[#C9941A]/10"
              )} 
            />
            <ResizablePanel 
              defaultSize={25} 
              minSize={20} 
              maxSize={35}
              className={cn(
                "border-l transition-colors relative",
                isDark 
                  ? "bg-stone-950/50 backdrop-blur-sm border-stone-800/50" 
                  : "bg-white/40 backdrop-blur-sm border-[#C9941A]/10"
              )}
            >
              {rightPanel || (
                <div className="flex items-center justify-center h-full">
                  <p className={cn(
                    "text-xs font-mono",
                    isDark ? "text-stone-600" : "text-[#1A1A1A]/30"
                  )}>
                    AWAITING DATA LINK
                  </p>
                </div>
              )}

              {/* Collapse Button */}
              <button 
                onClick={() => setRightPanelOpen(false)}
                className={cn(
                  "absolute -left-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition-all",
                  isDark 
                    ? "border-stone-700 bg-stone-900 text-stone-400 hover:text-white hover:scale-110" 
                    : "border-[#C9941A]/30 bg-white text-[#1A1A1A]/50 hover:text-[#C9941A] hover:scale-110"
                )}
                data-testid="button-collapse-right"
              >
                <PanelRightClose className="h-3 w-3" />
              </button>
            </ResizablePanel>
          </>
        )}

        {/* Panel Toggle - Right (Collapsed State) */}
        {!rightPanelOpen && (
          <div className={cn(
            "w-10 flex flex-col items-center pt-4 border-l relative",
            isDark 
              ? "bg-stone-950/50 border-stone-800/50" 
              : "bg-white/40 border-[#C9941A]/10"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(true)}
              className="h-8 w-8"
              data-testid="button-expand-right"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </ResizablePanelGroup>

      {/* Status Bar */}
      <footer className={cn(
        "h-7 flex items-center justify-between px-4 border-t text-[10px] shrink-0",
        isDark 
          ? "bg-stone-950/80 border-stone-800/50 text-stone-500" 
          : "bg-white/80 border-[#C9941A]/10 text-[#1A1A1A]/40"
      )}>
        <div className="flex items-center gap-4">
          <span>Autosaved</span>
          <span>•</span>
          <span>Last edit: just now</span>
        </div>
        <div className="flex items-center gap-4">
          <span>85% Margin Mode</span>
          <span>•</span>
          <span className="uppercase tracking-wider font-semibold">KreAIte v3.0</span>
        </div>
      </footer>
    </div>
  );
}

export default WorkspaceShell;
