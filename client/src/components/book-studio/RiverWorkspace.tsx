import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import {
  PanelLeft,
  PanelRight,
  X,
  Plus,
  FileText,
  Save,
  Undo,
  Redo,
  Search,
  Settings,
  HelpCircle,
  ChevronDown,
  Cloud,
  Zap,
  BookOpen,
} from "lucide-react";

import RiverNavigator, { NavigatorItem } from "./RiverNavigator";
import RiverEditor from "./RiverEditor";
import RiverResearchPanel from "./RiverResearchPanel";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";

interface DocumentTab {
  id: string;
  title: string;
  type: 'chapter' | 'note' | 'character' | 'research';
  content: string;
  isDirty: boolean;
}

export default function RiverWorkspace() {
  const { bookOutline, manuscriptHtml, setManuscriptHtml, bookTitle } = useBookStudio();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NavigatorItem | null>(null);
  
  const [openTabs, setOpenTabs] = useState<DocumentTab[]>([
    { id: 'chapter-1', title: 'Chapter 1', type: 'chapter', content: '', isDirty: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('chapter-1');

  const chapters = bookOutline?.chapters || [];
  const currentChapter = chapters.find((_, idx) => `chapter-${idx}` === activeTabId);
  const wordCount = (manuscriptHtml || '').split(/\s+/).filter(w => w.length > 0).length;

  const handleSelectItem = useCallback((item: NavigatorItem | null) => {
    setSelectedItem(item);
    if (item && item.type === 'chapter' && item.chapterIndex !== undefined) {
      const tabId = `chapter-${item.chapterIndex}`;
      const existingTab = openTabs.find(t => t.id === tabId);
      if (!existingTab) {
        setOpenTabs(prev => [...prev, {
          id: tabId,
          title: item.title,
          type: 'chapter',
          content: chapters[item.chapterIndex]?.content || '',
          isDirty: false
        }]);
      }
      setActiveTabId(tabId);
    }
  }, [openTabs, chapters]);

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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* TOP HEADER BAR - River-style clean header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3">
        <div className="flex items-center gap-3">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {bookTitle || 'Untitled Book'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </div>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-save">
                  <Save className="h-4 w-4 text-zinc-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save (⌘S)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-undo">
                  <Undo className="h-4 w-4 text-zinc-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (⌘Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid="button-redo">
                  <Redo className="h-4 w-4 text-zinc-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Cloud className="h-3.5 w-3.5 text-green-500" />
            <span>Saved</span>
          </div>
          
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Search className="h-4 w-4 text-zinc-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4 text-zinc-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4 text-zinc-500" />
          </Button>
          
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Upgrade
          </Button>
        </div>
      </header>

      {/* DOCUMENT TABS BAR - River-style tabs */}
      <div className="flex h-10 items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-1 gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          data-testid="toggle-left-panel"
        >
          <PanelLeft className="h-4 w-4 text-zinc-500" />
        </Button>
        
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center gap-2 h-8 px-3 rounded-t-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                activeTabId === tab.id
                  ? "bg-white dark:bg-zinc-800 border-t border-x border-zinc-200 dark:border-zinc-700 -mb-px"
                  : "bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/50"
              )}
              onClick={() => setActiveTabId(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <FileText className={cn(
                "h-3.5 w-3.5 shrink-0",
                activeTabId === tab.id ? "text-blue-600" : "text-zinc-400"
              )} />
              <span className={cn(
                "text-xs truncate",
                activeTabId === tab.id ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-400"
              )}>
                {tab.title}
              </span>
              {tab.isDirty && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto"
                onClick={(e) => closeTab(tab.id, e)}
                data-testid={`close-tab-${tab.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 shrink-0"
            data-testid="button-new-tab"
          >
            <Plus className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          data-testid="toggle-right-panel"
        >
          <PanelRight className="h-4 w-4 text-zinc-500" />
        </Button>
      </div>

      {/* MAIN CONTENT AREA */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT PANEL - Project Navigator */}
        {leftPanelOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[220px]">
              <RiverNavigator
                selectedItem={selectedItem}
                onSelectItem={handleSelectItem}
              />
            </ResizablePanel>
            <ResizableHandle className="w-px bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-400 transition-colors" />
          </>
        )}

        {/* CENTER - Editor Area */}
        <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 50 : 70}>
          <RiverEditor
            content={manuscriptHtml}
            onContentChange={setManuscriptHtml}
            chapterTitle={currentChapter?.title || openTabs.find(t => t.id === activeTabId)?.title || 'Untitled'}
            wordCount={wordCount}
          />
        </ResizablePanel>

        {/* RIGHT PANEL - Research/Context */}
        {rightPanelOpen && (
          <>
            <ResizableHandle className="w-px bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-400 transition-colors" />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40} className="min-w-[280px]">
              <RiverResearchPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* BOTTOM STATUS BAR */}
      <div className="flex h-7 items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span>100% structure</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            All changes saved
          </span>
        </div>
      </div>
    </div>
  );
}
