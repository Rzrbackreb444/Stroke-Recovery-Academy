import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Globe,
  Search,
  Lightbulb,
  Image as ImageIcon,
  Plus,
  MoreHorizontal,
  Settings,
  Save,
  Undo,
  Redo,
  PanelLeft,
  PanelRight,
  X,
  Sparkles,
  Wand2,
  Target,
  MessageSquare,
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Crown,
  Download,
  Upload,
  Palette,
  BookMarked,
  Feather,
  Library,
  Pen,
  FileEdit,
  Loader2,
  Check,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Eye,
  Activity,
  BarChart3,
  Gauge,
  Heart,
  AlertTriangle,
  Shield,
  Compass,
  Map,
  Network,
  GitBranch,
  Layers,
  Box,
  Command,
  Keyboard,
  Moon,
  Sun,
  Monitor,
  Link2,
  Unlink,
  Hash,
  AtSign,
  Quote,
  Type,
  AlignLeft,
  Maximize2,
  Minimize2,
  Share2,
  ExternalLink,
  Info,
  HelpCircle,
  Star,
  Award,
  Flame,
  Timer,
  Calendar,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  ShoppingCart,
  Package,
  CreditCard,
  PieChart,
  LineChart,
  AreaChart,
} from "lucide-react";

import KreAIteEditor from "./KreAIteEditor";
import { apiRequest } from "@/lib/queryClient";

interface DocumentTab {
  id: string;
  title: string;
  type: 'chapter' | 'character' | 'research' | 'outline' | 'worldbuilding';
  chapterIndex?: number;
  isDirty: boolean;
}

interface NavigatorItem {
  id: string;
  title: string;
  type: 'folder' | 'chapter' | 'character' | 'note' | 'location' | 'timeline' | 'theme';
  section: string;
  chapterIndex?: number;
  status?: 'draft' | 'complete' | 'reviewing';
  connections?: number;
  icon?: typeof FileText;
}

interface AnalyticsData {
  consistencyScore: number;
  paceScore: number;
  emotionalResonance: number;
  voiceConsistency: number;
  plotCoherence: number;
  doctrineAlignment: number;
  readabilityGrade: number;
  marketFit: number;
}

interface MarketInsight {
  category: string;
  averagePrice: number;
  topKeywords: string[];
  competitorCount: number;
  demandScore: number;
  yourPosition: 'above' | 'below' | 'competitive';
}

export default function KreAIteStudio() {
  const { toast } = useToast();
  const {
    bookOutline,
    bookTitle,
    manuscriptHtml,
    setManuscriptHtml,
    brainstormIdeas,
    images,
    generateChapter,
    generateAllChapters,
    generationProgress,
    qualityPolish,
    polishProgress,
    editChapter,
    generateBookImage,
    isGeneratingImage,
    generateBlurb,
    isGeneratingBlurb,
    generateKeywords,
    isGeneratingKeywords,
    marketingBlurbs,
    amazonKeywords,
  } = useBookStudio();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NavigatorItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['manuscript', 'codex', 'research']));
  const [searchQuery, setSearchQuery] = useState("");
  const [rightPanelMode, setRightPanelMode] = useState<'intelligence' | 'market' | 'assets'>('intelligence');
  const [focusMode, setFocusMode] = useState(false);
  const [theme, setTheme] = useState<'stone' | 'ink'>('stone');

  const [openTabs, setOpenTabs] = useState<DocumentTab[]>([
    { id: 'chapter-0', title: 'Chapter 1', type: 'chapter', chapterIndex: 0, isDirty: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('chapter-0');

  const { data: userTier } = useQuery({
    queryKey: ['/api/user/subscription'],
    retry: false,
  });

  const chapters = bookOutline?.chapters || [];
  const currentChapter = chapters.find((_, idx) => `chapter-${idx}` === activeTabId);
  const wordCount = (manuscriptHtml || '').split(/\s+/).filter(w => w.length > 0).length;
  const totalProjectWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  // Simulated real-time analytics (would connect to AI backend)
  const analytics: AnalyticsData = useMemo(() => ({
    consistencyScore: 87,
    paceScore: 72,
    emotionalResonance: 91,
    voiceConsistency: 84,
    plotCoherence: 78,
    doctrineAlignment: 95,
    readabilityGrade: 8.2,
    marketFit: 82,
  }), [manuscriptHtml]);

  const marketInsight: MarketInsight = useMemo(() => ({
    category: 'Business & Money',
    averagePrice: 14.99,
    topKeywords: ['entrepreneurship', 'passive income', 'small business'],
    competitorCount: 2847,
    demandScore: 78,
    yourPosition: 'competitive',
  }), []);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  }, []);

  const handleSelectItem = useCallback((item: NavigatorItem) => {
    setSelectedItem(item);
    if (item.type === 'chapter' && item.chapterIndex !== undefined) {
      const tabId = `chapter-${item.chapterIndex}`;
      if (!openTabs.find(t => t.id === tabId)) {
        setOpenTabs(prev => [...prev, {
          id: tabId,
          title: item.title,
          type: 'chapter',
          chapterIndex: item.chapterIndex,
          isDirty: false
        }]);
      }
      setActiveTabId(tabId);
    }
  }, [openTabs]);

  const closeTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  // Build the Codex Navigator structure
  const manuscriptItems: NavigatorItem[] = chapters.map((chapter, index) => ({
    id: `chapter-${index}`,
    title: chapter.title || `Chapter ${index + 1}`,
    type: 'chapter',
    section: 'manuscript',
    chapterIndex: index,
    status: chapter.status === 'complete' ? 'complete' : 'draft',
    icon: FileText,
  }));

  const characterItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'character')
    .map(idea => ({
      id: `char-${idea.id}`,
      title: idea.content.split('\n')[0].slice(0, 30) || 'Character',
      type: 'character',
      section: 'codex',
      connections: Math.floor(Math.random() * 8) + 1,
      icon: Users,
    }));

  const worldItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'setting')
    .map(idea => ({
      id: `world-${idea.id}`,
      title: idea.content.split('\n')[0].slice(0, 30) || 'Location',
      type: 'location',
      section: 'codex',
      connections: Math.floor(Math.random() * 5) + 1,
      icon: Globe,
    }));

  const researchItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => ['note', 'plot', 'theme', 'goal'].includes(idea.type))
    .map(idea => ({
      id: `note-${idea.id}`,
      title: idea.content.split('\n')[0].slice(0, 30) || 'Note',
      type: 'note',
      section: 'research',
      icon: Lightbulb,
    }));

  const codexFolders = [
    { id: 'manuscript', label: 'Manuscript', icon: BookOpen, items: manuscriptItems, color: 'text-amber-500' },
    { id: 'codex', label: 'Story Codex', icon: Library, items: [...characterItems, ...worldItems], color: 'text-[#C9941A]', 
      subfolders: [
        { id: 'characters', label: 'Characters', icon: Users, items: characterItems },
        { id: 'world', label: 'World & Locations', icon: Globe, items: worldItems },
        { id: 'timeline', label: 'Timeline', icon: Clock, items: [] },
        { id: 'themes', label: 'Themes & Motifs', icon: Compass, items: [] },
      ]
    },
    { id: 'research', label: 'Research Vault', icon: Lightbulb, items: researchItems, color: 'text-emerald-500' },
    { id: 'assets', label: 'Visual Assets', icon: ImageIcon, items: images.map((img, i): NavigatorItem => ({ id: `img-${img.id}`, title: `Image ${i + 1}`, type: 'note', section: 'assets', icon: ImageIcon })), color: 'text-rose-500' },
  ];

  const filteredFolders = searchQuery
    ? codexFolders.map(f => ({ ...f, items: f.items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())) }))
    : codexFolders;

  const isDark = theme === 'ink';

  if (focusMode) {
    return (
      <div className={cn(
        "h-screen flex flex-col transition-colors duration-500",
        isDark ? "bg-stone-950 text-stone-100" : "bg-[#FFFEF9] text-stone-900"
      )}>
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusMode(false)}
            className="h-8 gap-2 text-xs bg-black/10 backdrop-blur-xl"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            Exit Focus
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl px-8">
            <KreAIteEditor
              content={currentChapter?.content || manuscriptHtml || ''}
              onContentChange={setManuscriptHtml}
              chapterTitle={currentChapter?.title || 'Untitled Chapter'}
              chapterNumber={currentChapter?.number || 1}
              wordCount={wordCount}
              targetWordCount={currentChapter?.targetWordCount || 3000}
              isGenerating={generationProgress.isGenerating}
              polishProgress={polishProgress}
              minimal={true}
              theme={theme}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen font-sans selection:bg-amber-200/40 transition-colors duration-300",
      isDark ? "bg-stone-950 text-stone-100" : "bg-[#FAFAF8] text-stone-900"
    )}>
      
      {/* ══════════════════════════════════════════════════════════════════════════════
          COMMAND BAR - Glassmorphism Header with Neural Activity
      ══════════════════════════════════════════════════════════════════════════════ */}
      <header className={cn(
        "flex h-14 shrink-0 items-center justify-between px-4 border-b backdrop-blur-2xl",
        isDark 
          ? "bg-stone-900/70 border-stone-800/50" 
          : "bg-white/70 border-stone-200/50 shadow-sm shadow-stone-200/20"
      )}>
        <div className="flex items-center gap-4">
          {/* Neural Brand Mark */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden",
              "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500",
              "shadow-lg shadow-amber-500/25"
            )}>
              <Feather className="h-4.5 w-4.5 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-semibold tracking-tight",
                isDark ? "text-stone-100" : "text-stone-800"
              )}>
                {bookTitle || 'Untitled Manuscript'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={cn(
                  "text-[10px] uppercase tracking-wider font-medium",
                  isDark ? "text-stone-500" : "text-stone-400"
                )}>
                  Neural Active • {totalProjectWords.toLocaleString()} words
                </span>
              </div>
            </div>
          </div>

          <div className={cn("h-6 w-px", isDark ? "bg-stone-800" : "bg-stone-200")} />
          
          {/* Quick Commands */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                )} data-testid="button-save" aria-label="Save project">
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Save Project (⌘S)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                )} data-testid="button-undo" aria-label="Undo">
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                  "h-8 w-8 p-0 rounded-lg",
                  isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                )} data-testid="button-redo" aria-label="Redo">
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Redo</TooltipContent>
            </Tooltip>
            
            <div className={cn("h-5 w-px mx-1", isDark ? "bg-stone-800" : "bg-stone-200")} />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg",
                    isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  )}
                  onClick={() => setFocusMode(true)}
                  data-testid="button-focus"
                  aria-label="Focus mode"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Focus Mode (F11)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg",
                    isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  )} 
                  data-testid="button-command"
                  aria-label="Command palette"
                >
                  <Command className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Command Palette (⌘K)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Side - Status & Controls */}
        <div className="flex items-center gap-3">
          {/* Live Analytics Badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            isDark 
              ? "bg-stone-800/50 border-stone-700/50" 
              : "bg-white/80 border-stone-200/80"
          )}>
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className={cn(
              "text-[10px] font-medium",
              isDark ? "text-stone-300" : "text-stone-600"
            )}>
              Consistency: {analytics.consistencyScore}%
            </span>
          </div>

          <div className={cn("h-6 w-px", isDark ? "bg-stone-800" : "bg-stone-200")} />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-lg",
              isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            )}
            onClick={() => setTheme(isDark ? 'stone' : 'ink')}
            data-testid="button-theme-toggle"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Tier Badge */}
          <Badge className={cn(
            "gap-1.5 text-[10px] font-medium rounded-full px-2.5",
            "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30"
          )}>
            <Crown className="h-3 w-3" />
            {(userTier as any)?.tier || 'Creator'}
          </Badge>

          <Button variant="ghost" size="sm" className={cn(
            "h-8 w-8 p-0 rounded-lg",
            isDark ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          )} data-testid="button-settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════════
          DOCUMENT TABS - Elevated Tab System
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex h-10 items-center border-b px-1.5",
        isDark ? "bg-stone-900/50 border-stone-800/50" : "bg-stone-50/80 border-stone-200/50"
      )}>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 w-7 p-0 shrink-0 rounded-md",
            isDark ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          )}
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          data-testid="toggle-left-panel"
          aria-label="Toggle left panel"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>
        
        <div className={cn("w-px h-4 mx-1.5", isDark ? "bg-stone-800" : "bg-stone-200")} />
        
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center gap-1.5 h-7 px-3 cursor-pointer transition-all min-w-[130px] max-w-[200px] rounded-md",
                activeTabId === tab.id
                  ? isDark 
                    ? "bg-stone-800 text-stone-100 shadow-sm" 
                    : "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                  : isDark
                    ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              )}
              onClick={() => setActiveTabId(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <FileText className={cn(
                "h-3 w-3 shrink-0",
                activeTabId === tab.id 
                  ? "text-amber-500" 
                  : isDark ? "text-stone-600" : "text-stone-400"
              )} />
              <span className="text-[11px] truncate font-medium">
                {tab.title}
              </span>
              {tab.isDirty && (
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto rounded",
                  isDark ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"
                )}
                onClick={(e) => closeTab(tab.id, e)}
                data-testid={`close-tab-${tab.id}`}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 w-7 p-0 shrink-0 rounded-md",
              isDark ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800" : "text-stone-400 hover:text-amber-600 hover:bg-amber-50"
            )}
            data-testid="button-new-tab"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className={cn("w-px h-4 mx-1.5", isDark ? "bg-stone-800" : "bg-stone-200")} />
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 w-7 p-0 shrink-0 rounded-md",
            isDark ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800" : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          )}
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          data-testid="toggle-right-panel"
          aria-label="Toggle right panel"
        >
          <PanelRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          MAIN WORKSPACE - Three Panel Neural Layout
      ══════════════════════════════════════════════════════════════════════════════ */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* ═══════════════════════════════════════════════════════════════════════════
            LEFT PANEL - The Codex Navigator
        ═══════════════════════════════════════════════════════════════════════════ */}
        {leftPanelOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={16} maxSize={30}>
              <div className={cn(
                "flex flex-col h-full border-r",
                isDark 
                  ? "bg-stone-900/30 border-stone-800/50" 
                  : "bg-white/50 border-stone-200/50 shadow-[1px_0_12px_rgba(0,0,0,0.03)]"
              )}>
                {/* Codex Header */}
                <div className={cn(
                  "p-3 border-b",
                  isDark ? "border-stone-800/50" : "border-stone-100"
                )}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-amber-500" />
                      <span className={cn(
                        "text-[11px] font-semibold uppercase tracking-wide",
                        isDark ? "text-stone-400" : "text-stone-500"
                      )}>
                        Knowledge Codex
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn(
                          "h-6 w-6 p-0 rounded-md",
                          isDark ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"
                        )}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={cn(
                        "w-48",
                        isDark ? "bg-stone-900 border-stone-800" : ""
                      )}>
                        <DropdownMenuLabel className="text-[10px] text-stone-500 uppercase">Create New</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2 text-xs">
                          <FileText className="w-3.5 h-3.5" /> Chapter
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Users className="w-3.5 h-3.5" /> Character
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Globe className="w-3.5 h-3.5" /> Location
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Clock className="w-3.5 h-3.5" /> Timeline Event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Upload className="w-3.5 h-3.5" /> Import Document
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Neural Search */}
                  <div className="relative">
                    <Search className={cn(
                      "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5",
                      isDark ? "text-stone-600" : "text-stone-400"
                    )} />
                    <Input
                      placeholder="Search codex..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        "pl-8 h-8 text-xs rounded-lg",
                        isDark 
                          ? "bg-stone-800/50 border-stone-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-stone-200 placeholder:text-stone-600" 
                          : "bg-stone-50 border-stone-200 focus:border-amber-400 focus:ring-amber-400/20"
                      )}
                      data-testid="input-search-codex"
                    />
                  </div>
                </div>

                {/* Codex Tree */}
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {filteredFolders.map((folder) => {
                      const isExpanded = expandedFolders.has(folder.id);
                      const FolderIcon = folder.icon;
                      
                      return (
                        <Collapsible
                          key={folder.id}
                          open={isExpanded}
                          onOpenChange={() => toggleFolder(folder.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start gap-1.5 h-7 px-2 text-xs font-medium rounded-md",
                                isDark 
                                  ? "text-stone-300 hover:bg-stone-800/50" 
                                  : "text-stone-700 hover:bg-stone-100"
                              )}
                              data-testid={`folder-${folder.id}`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              )}
                              <FolderIcon className={cn("w-4 h-4 shrink-0", folder.color)} />
                              <span className="truncate">{folder.label}</span>
                              <Badge variant="outline" className={cn(
                                "ml-auto h-4 px-1.5 text-[9px]",
                                isDark ? "border-stone-700 text-stone-500" : "border-stone-200 text-stone-400"
                              )}>
                                {folder.items.length}
                              </Badge>
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className={cn(
                              "ml-4 pl-3 border-l space-y-0.5 py-1",
                              isDark ? "border-stone-800" : "border-stone-200"
                            )}>
                              {folder.items.length === 0 ? (
                                <p className={cn(
                                  "text-[10px] px-2 py-2 italic",
                                  isDark ? "text-stone-600" : "text-stone-400"
                                )}>
                                  No items yet
                                </p>
                              ) : (
                                folder.items.map((item) => {
                                  const isSelected = selectedItem?.id === item.id;
                                  const ItemIcon = item.icon || FileText;
                                  return (
                                    <Button
                                      key={item.id}
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-full justify-start gap-2 h-7 px-2 text-xs rounded-md",
                                        isSelected
                                          ? isDark 
                                            ? "bg-amber-500/20 text-amber-300" 
                                            : "bg-amber-100 text-amber-900"
                                          : isDark 
                                            ? "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200" 
                                            : "text-stone-600 hover:bg-stone-100"
                                      )}
                                      onClick={() => handleSelectItem(item)}
                                      data-testid={`item-${item.id}`}
                                    >
                                      <ItemIcon className={cn(
                                        "w-3.5 h-3.5 shrink-0",
                                        isSelected 
                                          ? "text-amber-500" 
                                          : isDark ? "text-stone-600" : "text-stone-400"
                                      )} />
                                      <span className="truncate">{item.title}</span>
                                      {item.connections && item.connections > 0 && (
                                        <div className={cn(
                                          "ml-auto flex items-center gap-0.5 text-[9px]",
                                          isDark ? "text-stone-600" : "text-stone-400"
                                        )}>
                                          <Link2 className="h-2.5 w-2.5" />
                                          {item.connections}
                                        </div>
                                      )}
                                      {item.status === 'complete' && (
                                        <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-500 shrink-0" />
                                      )}
                                    </Button>
                                  );
                                })
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Codex Footer - Project Intelligence */}
                <div className={cn(
                  "p-3 border-t",
                  isDark ? "border-stone-800/50 bg-stone-900/50" : "border-stone-100 bg-stone-50/50"
                )}>
                  <div className={cn(
                    "text-[10px] space-y-1.5",
                    isDark ? "text-stone-500" : "text-stone-500"
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        Chapters
                      </span>
                      <span className={cn("font-medium", isDark ? "text-stone-300" : "text-stone-700")}>{chapters.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        Characters
                      </span>
                      <span className={cn("font-medium", isDark ? "text-stone-300" : "text-stone-700")}>{characterItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <Type className="h-3 w-3" />
                        Words
                      </span>
                      <span className={cn("font-medium", isDark ? "text-stone-300" : "text-stone-700")}>{totalProjectWords.toLocaleString()}</span>
                    </div>
                    <Separator className={cn("my-2", isDark ? "bg-stone-800" : "bg-stone-200")} />
                    <div className="flex justify-between items-center">
                      <span>Est. Pages</span>
                      <span className={cn("font-medium", isDark ? "text-stone-300" : "text-stone-700")}>{Math.ceil(totalProjectWords / 250)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle className={cn(
              "w-0.5 transition-colors",
              isDark ? "bg-stone-800 hover:bg-amber-500/50" : "bg-stone-200 hover:bg-amber-400"
            )} />
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            CENTER PANEL - The Writing Canvas
        ═══════════════════════════════════════════════════════════════════════════ */}
        <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 48 : 68}>
          <KreAIteEditor
            content={currentChapter?.content || manuscriptHtml || ''}
            onContentChange={setManuscriptHtml}
            chapterTitle={currentChapter?.title || 'Untitled Chapter'}
            chapterNumber={currentChapter?.number || 1}
            wordCount={wordCount}
            targetWordCount={currentChapter?.targetWordCount || 3000}
            isGenerating={generationProgress.isGenerating}
            onGenerateChapter={() => {
              const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
              if (idx !== undefined) generateChapter(idx);
            }}
            onPolish={() => {
              const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
              if (idx !== undefined) qualityPolish(idx);
            }}
            polishProgress={polishProgress}
            theme={theme}
          />
        </ResizablePanel>

        {/* ═══════════════════════════════════════════════════════════════════════════
            RIGHT PANEL - Intelligence HUD
        ═══════════════════════════════════════════════════════════════════════════ */}
        {rightPanelOpen && (
          <>
            <ResizableHandle className={cn(
              "w-0.5 transition-colors",
              isDark ? "bg-stone-800 hover:bg-amber-500/50" : "bg-stone-200 hover:bg-amber-400"
            )} />
            <ResizablePanel defaultSize={32} minSize={24} maxSize={42}>
              <div className={cn(
                "flex flex-col h-full border-l",
                isDark 
                  ? "bg-stone-900/30 border-stone-800/50" 
                  : "bg-white/50 border-stone-200/50 shadow-[-1px_0_12px_rgba(0,0,0,0.03)]"
              )}>
                {/* HUD Header with Mode Selector */}
                <div className={cn(
                  "p-3 border-b",
                  isDark ? "border-stone-800/50" : "border-stone-100"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-[#C9941A]" />
                      <span className={cn(
                        "text-[11px] font-semibold uppercase tracking-wide",
                        isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                      )}>
                        Intelligence HUD
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { mode: 'intelligence', icon: Activity, label: 'Analytics' },
                        { mode: 'market', icon: TrendingUp, label: 'Market' },
                        { mode: 'assets', icon: Wand2, label: 'AI Tools' },
                      ].map(({ mode, icon: Icon, label }) => (
                        <Tooltip key={mode}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-6 w-6 p-0 rounded-md",
                                rightPanelMode === mode
                                  ? isDark 
                                    ? "bg-[#C9941A]/20 text-[#C9941A]" 
                                    : "bg-[#C9941A]/10 text-[#C9941A]"
                                  : isDark 
                                    ? "text-stone-500 hover:text-stone-300 hover:bg-stone-800" 
                                    : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 hover:bg-[#C9941A]/5"
                              )}
                              onClick={() => setRightPanelMode(mode as any)}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>

                {/* HUD Content Area */}
                <ScrollArea className="flex-1">
                  <div className="p-3">
                    
                    {/* ═══════════════════════════════════════════════════════════════
                        INTELLIGENCE MODE - Real-time Analytics
                    ═══════════════════════════════════════════════════════════════ */}
                    {rightPanelMode === 'intelligence' && (
                      <div className="space-y-4">
                        {/* Consistency Score Card */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-gradient-to-br from-white to-stone-50 border-stone-200"
                        )}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#C9941A] to-amber-600 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className={cn(
                                  "text-xs font-semibold",
                                  isDark ? "text-stone-200" : "text-stone-800"
                                )}>Narrative Consistency</h4>
                                <p className={cn(
                                  "text-[10px]",
                                  isDark ? "text-stone-500" : "text-stone-500"
                                )}>Real-time analysis</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-2xl font-bold",
                                analytics.consistencyScore >= 80 ? "text-emerald-500" : 
                                analytics.consistencyScore >= 60 ? "text-amber-500" : "text-rose-500"
                              )}>{analytics.consistencyScore}</span>
                              <span className={cn(
                                "text-xs",
                                isDark ? "text-stone-500" : "text-stone-400"
                              )}>/100</span>
                            </div>
                          </div>
                          <Progress value={analytics.consistencyScore} className="h-1.5" />
                        </div>

                        {/* Detailed Analytics Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Pacing', value: analytics.paceScore, icon: Timer, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Emotion', value: analytics.emotionalResonance, icon: Heart, color: 'from-rose-500 to-pink-500' },
                            { label: 'Voice', value: analytics.voiceConsistency, icon: MessageSquare, color: 'from-amber-500 to-orange-500' },
                            { label: 'Plot', value: analytics.plotCoherence, icon: GitBranch, color: 'from-emerald-500 to-teal-500' },
                          ].map((metric) => (
                            <div 
                              key={metric.label}
                              className={cn(
                                "p-2.5 rounded-lg border",
                                isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-white border-stone-150"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={cn(
                                  "h-5 w-5 rounded flex items-center justify-center bg-gradient-to-br",
                                  metric.color
                                )}>
                                  <metric.icon className="h-2.5 w-2.5 text-white" />
                                </div>
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  isDark ? "text-stone-400" : "text-stone-600"
                                )}>{metric.label}</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className={cn(
                                  "text-lg font-bold",
                                  isDark ? "text-stone-200" : "text-stone-800"
                                )}>{metric.value}</span>
                                <span className={cn(
                                  "text-[9px]",
                                  isDark ? "text-stone-600" : "text-stone-400"
                                )}>%</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Doctrine Alignment */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-amber-500" />
                            <span className={cn(
                              "text-xs font-semibold",
                              isDark ? "text-stone-200" : "text-stone-800"
                            )}>Doctrine Alignment</span>
                            <Badge className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-600 border-0">
                              {analytics.doctrineAlignment}% aligned
                            </Badge>
                          </div>
                          <p className={cn(
                            "text-[10px] leading-relaxed",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            Your content aligns with your established expertise and core principles. 
                            No drift detected from your professional doctrine.
                          </p>
                        </div>

                        {/* Active Alerts */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Active Alerts</h4>
                          <div className="space-y-1.5">
                            <div className={cn(
                              "flex items-start gap-2 p-2 rounded-lg border",
                              isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                            )}>
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <div>
                                <p className={cn(
                                  "text-[11px] font-medium",
                                  isDark ? "text-amber-400" : "text-amber-800"
                                )}>Character voice shift detected</p>
                                <p className={cn(
                                  "text-[10px]",
                                  isDark ? "text-amber-500/70" : "text-amber-600"
                                )}>Marcus sounds more cheerful than his established gruff tone in Ch. 3</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chapter Outline Quick View */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Chapter Progress</h4>
                          <div className="space-y-1.5">
                            {chapters.slice(0, 5).map((chapter, idx) => (
                              <div 
                                key={chapter.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer",
                                  activeTabId === `chapter-${idx}`
                                    ? isDark ? "bg-amber-500/20" : "bg-amber-100"
                                    : isDark ? "hover:bg-stone-800/50" : "hover:bg-stone-100"
                                )}
                                onClick={() => handleSelectItem({ 
                                  id: `chapter-${idx}`, 
                                  title: chapter.title, 
                                  type: 'chapter', 
                                  section: 'manuscript', 
                                  chapterIndex: idx,
                                  status: chapter.status === 'complete' ? 'complete' : 'draft'
                                })}
                              >
                                {chapter.status === 'complete' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    isDark ? "text-stone-600" : "text-stone-300"
                                  )} />
                                )}
                                <span className={cn(
                                  "text-[11px] truncate flex-1",
                                  isDark ? "text-stone-300" : "text-stone-700"
                                )}>{idx + 1}. {chapter.title}</span>
                                <span className={cn(
                                  "text-[9px]",
                                  isDark ? "text-stone-600" : "text-stone-400"
                                )}>{chapter.wordCount?.toLocaleString() || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
                        MARKET MODE - Market Pulse & Monetization
                    ═══════════════════════════════════════════════════════════════ */}
                    {rightPanelMode === 'market' && (
                      <div className="space-y-4">
                        {/* Market Fit Score */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className={cn(
                                  "text-xs font-semibold",
                                  isDark ? "text-stone-200" : "text-stone-800"
                                )}>Market Fit Score</h4>
                                <p className={cn(
                                  "text-[10px]",
                                  isDark ? "text-stone-500" : "text-stone-500"
                                )}>{marketInsight.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-emerald-500">{analytics.marketFit}</span>
                              <span className={cn(
                                "text-xs",
                                isDark ? "text-stone-500" : "text-stone-400"
                              )}>/100</span>
                            </div>
                          </div>
                          <Progress value={analytics.marketFit} className="h-1.5" />
                        </div>

                        {/* Category Insights */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-white border-stone-200"
                        )}>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-3",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Category Intelligence</h4>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className={cn(
                                "text-[11px]",
                                isDark ? "text-stone-400" : "text-stone-600"
                              )}>Competition Level</span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "text-[11px] font-semibold",
                                  isDark ? "text-stone-200" : "text-stone-800"
                                )}>{marketInsight.competitorCount.toLocaleString()}</span>
                                <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                  High
                                </Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={cn(
                                "text-[11px]",
                                isDark ? "text-stone-400" : "text-stone-600"
                              )}>Demand Score</span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "text-[11px] font-semibold",
                                  isDark ? "text-stone-200" : "text-stone-800"
                                )}>{marketInsight.demandScore}%</span>
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={cn(
                                "text-[11px]",
                                isDark ? "text-stone-400" : "text-stone-600"
                              )}>Avg. Price Point</span>
                              <span className={cn(
                                "text-[11px] font-semibold",
                                isDark ? "text-stone-200" : "text-stone-800"
                              )}>${marketInsight.averagePrice}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trending Keywords */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Top Category Keywords</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {marketInsight.topKeywords.map((keyword, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  isDark ? "bg-stone-800 border-stone-700 text-stone-300" : "bg-stone-50 border-stone-200"
                                )}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Pricing Strategy */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-stone-800/30 border-stone-700/50" : "bg-gradient-to-br from-[#FAF8F3] to-amber-50 border-[#C9941A]/20"
                        )}>
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-[#C9941A]" />
                            <h4 className={cn(
                              "text-xs font-semibold",
                              isDark ? "text-stone-200" : "text-stone-800"
                            )}>Recommended Pricing</h4>
                          </div>
                          <div className="space-y-2">
                            {[
                              { format: 'eBook', low: 4.99, high: 9.99, optimal: 6.99 },
                              { format: 'Paperback', low: 12.99, high: 19.99, optimal: 15.99 },
                              { format: 'Hardcover', low: 24.99, high: 34.99, optimal: 28.99 },
                            ].map((price) => (
                              <div key={price.format} className="flex items-center justify-between">
                                <span className={cn(
                                  "text-[11px]",
                                  isDark ? "text-stone-400" : "text-stone-600"
                                )}>{price.format}</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[10px]",
                                    isDark ? "text-stone-600" : "text-stone-400"
                                  )}>${price.low} - ${price.high}</span>
                                  <Badge className="text-[9px] bg-[#C9941A]/20 text-[#C9941A] border-0">
                                    ${price.optimal}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className={cn(
                            "text-[9px] mt-2 italic",
                            isDark ? "text-stone-600" : "text-stone-500"
                          )}>
                            Based on {totalProjectWords.toLocaleString()} words and market analysis
                          </p>
                        </div>

                        {/* Marketing Actions */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Marketing Tools</h4>
                          <div className="space-y-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => generateBlurb()}
                              disabled={isGeneratingBlurb}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-[#C9941A]" />
                              {isGeneratingBlurb ? 'Generating...' : 'Generate Blurbs'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => generateKeywords()}
                              disabled={isGeneratingKeywords}
                            >
                              <Search className="h-3.5 w-3.5 text-cyan-500" />
                              {isGeneratingKeywords ? 'Generating...' : 'Amazon Keywords'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-500" />
                              KDP Print Preview
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                            >
                              <Download className="h-3.5 w-3.5 text-orange-500" />
                              Export for KDP
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════
                        AI TOOLS MODE - Generation & Editing
                    ═══════════════════════════════════════════════════════════════ */}
                    {rightPanelMode === 'assets' && (
                      <div className="space-y-4">
                        {/* Content Generation */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Content Generation</h4>
                          <div className="space-y-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-9 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => {
                                const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                if (idx !== undefined) generateChapter(idx);
                              }}
                              disabled={generationProgress.isGenerating}
                            >
                              <Pen className="h-3.5 w-3.5 text-blue-500" />
                              {generationProgress.isGenerating ? 'Generating...' : 'Generate This Chapter'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-9 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => generateAllChapters()}
                              disabled={generationProgress.isGenerating}
                            >
                              <BookOpen className="h-3.5 w-3.5 text-[#C9941A]" />
                              Generate All Chapters
                            </Button>
                          </div>
                        </div>

                        {/* Professional Editing */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Professional Editing</h4>
                          <div className="space-y-1.5">
                            {[
                              { label: 'Developmental Edit', type: 'developmental', icon: Target, color: 'text-blue-500' },
                              { label: 'Line Edit', type: 'line', icon: FileEdit, color: 'text-emerald-500' },
                              { label: 'Copy Edit', type: 'copy', icon: Check, color: 'text-teal-500' },
                              { label: 'Proofread', type: 'proofread', icon: Eye, color: 'text-cyan-500' },
                            ].map((edit) => (
                              <Button 
                                key={edit.type}
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                  "w-full h-8 justify-start gap-2 text-[11px]",
                                  isDark ? "border-stone-700 hover:bg-stone-800" : ""
                                )}
                                onClick={() => {
                                  const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                  if (idx !== undefined) editChapter(idx, edit.type as any);
                                }}
                              >
                                <edit.icon className={cn("h-3.5 w-3.5", edit.color)} />
                                {edit.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Quality Polish */}
                        <div className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <h4 className={cn(
                              "text-xs font-semibold",
                              isDark ? "text-amber-400" : "text-amber-800"
                            )}>Quality Polish (4-Pass)</h4>
                          </div>
                          <p className={cn(
                            "text-[10px] mb-3",
                            isDark ? "text-amber-500/70" : "text-amber-700"
                          )}>
                            Runs all four editing passes automatically: developmental, line, copy, and proofread.
                          </p>
                          <Button 
                            className="w-full h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                            onClick={() => {
                              const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                              if (idx !== undefined) qualityPolish(idx);
                            }}
                            disabled={polishProgress.isPolishing}
                          >
                            {polishProgress.isPolishing ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                {polishProgress.currentPass || 'Polishing'}...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                Run Quality Polish
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Visual Assets */}
                        <div>
                          <h4 className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide mb-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>Visual Assets</h4>
                          <div className="space-y-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => generateBookImage('Professional book cover', 'photorealistic')}
                              disabled={isGeneratingImage}
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-rose-500" />
                              {isGeneratingImage ? 'Generating...' : 'Generate Cover Art'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={cn(
                                "w-full h-8 justify-start gap-2 text-[11px]",
                                isDark ? "border-stone-700 hover:bg-stone-800" : ""
                              )}
                              onClick={() => generateBookImage('Chapter illustration', 'illustration')}
                              disabled={isGeneratingImage}
                            >
                              <Palette className="h-3.5 w-3.5 text-indigo-500" />
                              Generate Illustration
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* HUD Footer */}
                <div className={cn(
                  "px-3 py-2 border-t",
                  isDark ? "border-stone-800/50 bg-stone-900/50" : "border-stone-100 bg-stone-50/50"
                )}>
                  <div className={cn(
                    "flex items-center justify-between text-[9px]",
                    isDark ? "text-stone-600" : "text-stone-400"
                  )}>
                    <span className="flex items-center gap-1.5">
                      <Brain className="h-3 w-3 text-[#C9941A]" />
                      Neural Engine Active
                    </span>
                    <span>Ch. {(openTabs.find(t => t.id === activeTabId)?.chapterIndex ?? 0) + 1}</span>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* ══════════════════════════════════════════════════════════════════════════════
          STATUS BAR - Professional Footer with Live Stats
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex h-7 items-center justify-between border-t px-4 text-[10px]",
        isDark 
          ? "bg-stone-900/70 border-stone-800/50 text-stone-500" 
          : "bg-white/70 border-stone-200/50 text-stone-500"
      )}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Type className="h-3 w-3" />
            {wordCount.toLocaleString()} words
          </span>
          <span className={isDark ? "text-stone-700" : "text-stone-300"}>|</span>
          <span>~{Math.ceil(wordCount / 250)} pages</span>
          <span className={isDark ? "text-stone-700" : "text-stone-300"}>|</span>
          <span>~{Math.ceil(wordCount / 200)} min read</span>
          <span className={isDark ? "text-stone-700" : "text-stone-300"}>|</span>
          <span>Grade {analytics.readabilityGrade}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-emerald-500" />
            Consistency {analytics.consistencyScore}%
          </span>
          <span className={isDark ? "text-stone-700" : "text-stone-300"}>|</span>
          <span className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Saved
          </span>
        </div>
      </div>
    </div>
  );
}
