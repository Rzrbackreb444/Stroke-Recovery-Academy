import { useState, useCallback, useEffect } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
  Package,
  Eye,
  GripVertical,
} from "lucide-react";

import KreAIteEditor from "./KreAIteEditor";
import { apiRequest } from "@/lib/queryClient";

interface DocumentTab {
  id: string;
  title: string;
  type: 'chapter' | 'character' | 'research' | 'outline';
  chapterIndex?: number;
  isDirty: boolean;
}

interface NavigatorItem {
  id: string;
  title: string;
  type: 'folder' | 'chapter' | 'character' | 'note';
  section: string;
  chapterIndex?: number;
  status?: 'draft' | 'complete' | 'reviewing';
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['manuscript', 'characters', 'research']));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRightTab, setActiveRightTab] = useState("outline");

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

  const manuscriptItems: NavigatorItem[] = chapters.map((chapter, index) => ({
    id: `chapter-${index}`,
    title: chapter.title || `Chapter ${index + 1}`,
    type: 'chapter',
    section: 'manuscript',
    chapterIndex: index,
    status: chapter.status === 'complete' ? 'complete' : 'draft',
  }));

  const characterItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'character')
    .map(idea => ({
      id: `char-${idea.id}`,
      title: idea.content.split('\n')[0].slice(0, 35) || 'Character',
      type: 'character',
      section: 'characters',
    }));

  const researchItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => ['note', 'setting', 'plot', 'theme', 'goal'].includes(idea.type))
    .map(idea => ({
      id: `note-${idea.id}`,
      title: idea.content.split('\n')[0].slice(0, 35) || 'Note',
      type: 'note',
      section: 'research',
    }));

  const folders = [
    { id: 'characters', label: 'Characters & World', icon: Users, color: 'text-blue-600', items: characterItems },
    { id: 'manuscript', label: 'Manuscript', icon: BookOpen, color: 'text-stone-700', items: manuscriptItems },
    { id: 'research', label: 'Research & Notes', icon: Lightbulb, color: 'text-amber-600', items: researchItems },
    { id: 'images', label: 'Images & Assets', icon: ImageIcon, color: 'text-rose-500', items: images.map((img, i) => ({ id: `img-${img.id}`, title: `Image ${i + 1}`, type: 'note' as const, section: 'images' })) },
  ];

  const filteredFolders = searchQuery
    ? folders.map(f => ({ ...f, items: f.items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())) }))
    : folders;

  return (
    <div className="flex flex-col h-screen bg-[#FAFAFA] text-stone-800 font-sans selection:bg-blue-100">
      
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER - Modern Flat Design with Depth
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3">
        <div className="flex items-center gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Feather className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-stone-800">
                {bookTitle || 'Untitled'}
              </span>
              <span className="text-[9px] text-stone-400 uppercase tracking-wider font-medium">
                Book Studio
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-stone-200" />
          
          {/* Quick Actions */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded" data-testid="button-save">
                  <Save className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Save (⌘S)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded" data-testid="button-undo">
                  <Undo className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded" data-testid="button-redo">
                  <Redo className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Redo</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-100">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-700">Saved</span>
          </div>

          <div className="h-5 w-px bg-stone-200" />

          <Badge variant="outline" className="h-6 bg-blue-50 border-blue-200 text-blue-700 gap-1 text-[10px] font-medium rounded">
            <Crown className="h-2.5 w-2.5" />
            {(userTier as any)?.tier || 'Free'}
          </Badge>

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-stone-500 hover:text-stone-700 rounded">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          DOCUMENT TABS - Clean Tab Bar with Depth
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex h-9 items-center border-b border-stone-200 bg-stone-50 px-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0 shrink-0 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          data-testid="toggle-left-panel"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>
        
        <div className="w-px h-4 bg-stone-200 mx-1" />
        
        <div className="flex-1 flex items-center gap-px overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center gap-1.5 h-7 px-2.5 cursor-pointer transition-all min-w-[120px] max-w-[180px] rounded-t",
                activeTabId === tab.id
                  ? "bg-white border-x border-t border-stone-200 shadow-sm -mb-px relative z-10"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              )}
              onClick={() => setActiveTabId(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <FileText className={cn(
                "h-3 w-3 shrink-0",
                activeTabId === tab.id ? "text-blue-600" : "text-stone-400"
              )} />
              <span className={cn(
                "text-[11px] truncate",
                activeTabId === tab.id ? "text-stone-800 font-medium" : ""
              )}>
                {tab.title}
              </span>
              {tab.isDirty && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto text-stone-400 hover:text-stone-600 rounded"
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
            className="h-7 w-7 p-0 shrink-0 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            data-testid="button-new-tab"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="w-px h-4 bg-stone-200 mx-1" />
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0 shrink-0 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          data-testid="toggle-right-panel"
        >
          <PanelRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Three Panel Layout with Depth
      ══════════════════════════════════════════════════════════════════════ */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* LEFT PANEL - Files Navigator */}
        {leftPanelOpen && (
          <>
            <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
              <div className="flex flex-col h-full bg-white shadow-[1px_0_3px_rgba(0,0,0,0.04)]">
                {/* Navigator Header */}
                <div className="p-2.5 border-b border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                      Files
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-stone-400 hover:text-blue-600 rounded">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Plus className="w-3.5 h-3.5" /> New Chapter
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Users className="w-3.5 h-3.5" /> New Character
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-xs">
                          <Upload className="w-3.5 h-3.5" /> Import
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 text-[11px] bg-stone-50 border-stone-200 focus:border-blue-400 focus:ring-blue-400/20 rounded"
                      data-testid="input-search-project"
                    />
                  </div>
                </div>

                {/* File Tree */}
                <ScrollArea className="flex-1">
                  <div className="p-1">
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
                              className="w-full justify-start gap-1 h-6 px-1.5 text-[11px] font-medium text-stone-700 hover:bg-stone-100 rounded"
                              data-testid={`folder-${folder.id}`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
                              )}
                              <FolderIcon className={cn("w-3.5 h-3.5 shrink-0", folder.color)} />
                              <span className="truncate">{folder.label}</span>
                              <span className="ml-auto text-[9px] text-stone-400">
                                {folder.items.length}
                              </span>
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="ml-3 pl-2.5 border-l border-stone-150 space-y-px py-0.5">
                              {folder.items.length === 0 ? (
                                <p className="text-[10px] text-stone-400 px-1.5 py-1 italic">
                                  Empty
                                </p>
                              ) : (
                                folder.items.map((item) => {
                                  const isSelected = selectedItem?.id === item.id;
                                  return (
                                    <Button
                                      key={item.id}
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-full justify-start gap-1.5 h-6 px-1.5 text-[11px] rounded",
                                        isSelected
                                          ? "bg-blue-50 text-blue-700 font-medium"
                                          : "text-stone-600 hover:bg-stone-50"
                                      )}
                                      onClick={() => handleSelectItem(item)}
                                      data-testid={`item-${item.id}`}
                                    >
                                      <FileText className={cn(
                                        "w-3 h-3 shrink-0",
                                        isSelected ? "text-blue-600" : "text-stone-400"
                                      )} />
                                      <span className="truncate">{item.title}</span>
                                      {item.status === 'complete' && (
                                        <CheckCircle2 className="ml-auto h-2.5 w-2.5 text-emerald-500 shrink-0" />
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

                {/* Stats Footer */}
                <div className="p-2.5 border-t border-stone-100 bg-stone-50/50">
                  <div className="text-[9px] text-stone-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Chapters</span>
                      <span className="font-medium text-stone-700">{chapters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Words</span>
                      <span className="font-medium text-stone-700">{totalProjectWords.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-transparent hover:bg-blue-400 transition-colors data-[resize-handle-active]:bg-blue-500">
              <div className="h-full w-px bg-stone-200" />
            </ResizableHandle>
          </>
        )}

        {/* CENTER - Editor Area */}
        <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 54 : 72}>
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
          />
        </ResizablePanel>

        {/* RIGHT PANEL - Intelligence */}
        {rightPanelOpen && (
          <>
            <ResizableHandle className="w-px bg-transparent hover:bg-blue-400 transition-colors data-[resize-handle-active]:bg-blue-500">
              <div className="h-full w-px bg-stone-200" />
            </ResizableHandle>
            <ResizablePanel defaultSize={28} minSize={20} maxSize={38}>
              <div className="flex flex-col h-full bg-white shadow-[-1px_0_3px_rgba(0,0,0,0.04)]">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                    Story Outline
                  </span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-stone-400 hover:text-blue-600 rounded">
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-2.5 mt-2 bg-stone-100 h-7 p-0.5 rounded">
                    <TabsTrigger value="outline" className="text-[10px] gap-1 h-6 rounded data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <BookMarked className="h-3 w-3" />
                      Outline
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-[10px] gap-1 h-6 rounded data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Wand2 className="h-3 w-3" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger value="market" className="text-[10px] gap-1 h-6 rounded data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <TrendingUp className="h-3 w-3" />
                      Publish
                    </TabsTrigger>
                  </TabsList>

                  {/* Outline Tab */}
                  <TabsContent value="outline" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-2.5 space-y-1.5">
                        {chapters.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                            <p className="text-xs text-stone-500">No chapters yet</p>
                            <p className="text-[10px] text-stone-400 mt-0.5">Generate your first chapter</p>
                          </div>
                        ) : (
                          chapters.map((chapter, idx) => (
                            <div
                              key={chapter.id}
                              className={cn(
                                "p-2 rounded border transition-all cursor-pointer group",
                                activeTabId === `chapter-${idx}`
                                  ? "bg-blue-50 border-blue-200 shadow-sm"
                                  : "border-stone-150 hover:border-blue-200 hover:bg-stone-50"
                              )}
                              onClick={() => handleSelectItem({ id: `chapter-${idx}`, title: chapter.title, type: 'chapter', section: 'manuscript', chapterIndex: idx, status: chapter.status === 'complete' ? 'complete' : 'draft' })}
                            >
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <span className="text-[11px] font-medium text-stone-800 leading-tight">
                                  {idx + 1}. {chapter.title}
                                </span>
                                {chapter.status === 'complete' ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-3 w-3 text-stone-300 shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                                {chapter.description || 'No description'}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-stone-400">
                                <span>{chapter.wordCount?.toLocaleString() || 0} words</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* AI Tab */}
                  <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-2.5 space-y-3">
                        {/* Generation */}
                        <div>
                          <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                            Generate
                          </h4>
                          <div className="space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => {
                                const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                if (idx !== undefined) generateChapter(idx);
                              }}
                              disabled={generationProgress.isGenerating}
                              data-testid="ai-generate-chapter"
                            >
                              <Pen className="h-3 w-3 text-blue-600" />
                              {generationProgress.isGenerating ? 'Generating...' : 'Generate Chapter'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => generateAllChapters()}
                              disabled={generationProgress.isGenerating}
                              data-testid="ai-generate-all"
                            >
                              <BookOpen className="h-3 w-3 text-violet-600" />
                              Generate All
                            </Button>
                          </div>
                        </div>

                        {/* Editing */}
                        <div>
                          <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                            Edit
                          </h4>
                          <div className="space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => {
                                const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                if (idx !== undefined) editChapter(idx, 'developmental');
                              }}
                              data-testid="ai-developmental-edit"
                            >
                              <Target className="h-3 w-3 text-blue-600" />
                              Developmental Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => {
                                const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                if (idx !== undefined) editChapter(idx, 'line');
                              }}
                              data-testid="ai-line-edit"
                            >
                              <FileEdit className="h-3 w-3 text-emerald-600" />
                              Line Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => {
                                const idx = openTabs.find(t => t.id === activeTabId)?.chapterIndex;
                                if (idx !== undefined) qualityPolish(idx);
                              }}
                              disabled={polishProgress.isPolishing}
                              data-testid="ai-quality-polish"
                            >
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              {polishProgress.isPolishing ? 'Polishing...' : 'Quality Polish'}
                            </Button>
                          </div>
                        </div>

                        {/* Images */}
                        <div>
                          <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                            Images
                          </h4>
                          <div className="space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => generateBookImage('Professional book cover art', 'photorealistic')}
                              disabled={isGeneratingImage}
                              data-testid="ai-generate-cover"
                            >
                              <ImageIcon className="h-3 w-3 text-rose-500" />
                              {isGeneratingImage ? 'Generating...' : 'Generate Cover'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Publish Tab */}
                  <TabsContent value="market" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-2.5 space-y-3">
                        {/* Marketing */}
                        <div>
                          <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                            Marketing
                          </h4>
                          <div className="space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => generateBlurb()}
                              disabled={isGeneratingBlurb}
                              data-testid="generate-blurb"
                            >
                              <MessageSquare className="h-3 w-3 text-violet-600" />
                              {isGeneratingBlurb ? 'Generating...' : 'Generate Blurbs'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              onClick={() => generateKeywords()}
                              disabled={isGeneratingKeywords}
                              data-testid="generate-keywords"
                            >
                              <Search className="h-3 w-3 text-cyan-600" />
                              {isGeneratingKeywords ? 'Generating...' : 'Amazon Keywords'}
                            </Button>
                          </div>
                        </div>

                        {/* Keywords Display */}
                        {amazonKeywords && amazonKeywords.length > 0 && (
                          <div>
                            <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                              Keywords
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {amazonKeywords.slice(0, 7).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-[9px] h-5 bg-blue-50 border-blue-200 text-blue-700 rounded">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Export */}
                        <div>
                          <h4 className="text-[9px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                            Export
                          </h4>
                          <div className="space-y-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              data-testid="export-kdp"
                            >
                              <Download className="h-3 w-3 text-orange-600" />
                              Export for KDP
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 justify-start gap-2 text-[11px] border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded"
                              data-testid="preview-kdp"
                            >
                              <Eye className="h-3 w-3 text-blue-600" />
                              Print Preview
                            </Button>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="p-2 rounded bg-gradient-to-br from-stone-50 to-blue-50/50 border border-stone-150">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <DollarSign className="h-3 w-3 text-blue-600" />
                            <span className="text-[10px] font-semibold text-stone-800">Pricing</span>
                          </div>
                          <div className="space-y-1 text-[10px] text-stone-600">
                            <div className="flex justify-between">
                              <span>Paperback</span>
                              <span className="font-medium text-blue-700">$14.99 - $19.99</span>
                            </div>
                            <div className="flex justify-between">
                              <span>eBook</span>
                              <span className="font-medium text-blue-700">$4.99 - $9.99</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Panel Footer */}
                <div className="px-2.5 py-1.5 border-t border-stone-100 bg-stone-50/50">
                  <div className="flex items-center justify-between text-[9px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5 text-blue-500" />
                      AI Ready
                    </span>
                    <span>Ch. {(openTabs.find(t => t.id === activeTabId)?.chapterIndex ?? 0) + 1}</span>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* ══════════════════════════════════════════════════════════════════════
          STATUS BAR - Clean Footer
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex h-6 items-center justify-between border-t border-stone-200 bg-white px-3 text-[9px] text-stone-500">
        <div className="flex items-center gap-3">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-stone-300">|</span>
          <span>~{Math.ceil(wordCount / 250)} pages</span>
          <span className="text-stone-300">|</span>
          <span>~{Math.ceil(wordCount / 200)} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Saved</span>
        </div>
      </div>
    </div>
  );
}
