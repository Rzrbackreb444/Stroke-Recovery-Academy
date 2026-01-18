import { ReactNode, useState, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ProjectNavigator, { NavigatorItem, NavigatorSection } from "./ProjectNavigator";
import ContextPanel from "./ContextPanel";
import ToolPanel from "./ToolPanel";
import WorkspaceCanvas from "./WorkspaceCanvas";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { cn } from "@/lib/utils";
import {
  PanelLeft,
  PanelRight,
  Loader2,
  Save,
  Sparkles,
  Layers,
} from "lucide-react";

interface WorkspaceShellProps {
  children: ReactNode;
}

export default function WorkspaceShell({ children }: WorkspaceShellProps) {
  const { 
    bookOutline, 
    setCurrentStep, 
    isSaving, 
    lastSaved,
    generationProgress 
  } = useBookStudio();
  
  const [selectedItem, setSelectedItem] = useState<NavigatorItem | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'workflow' | 'files' | 'workspace'>('workflow');

  const handleSelectItem = useCallback((item: NavigatorItem | null) => {
    setSelectedItem(item);
    
    if (item?.type === 'chapter' && item.chapterIndex !== undefined) {
      setCurrentStep('build');
    }
  }, [setCurrentStep]);

  const handleCreateItem = useCallback((section: NavigatorSection, type: NavigatorItem['type']) => {
    console.log('Create item:', section, type);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", !leftPanelCollapsed && "bg-accent")}
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            data-testid="button-toggle-left-panel"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-5" />
          
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'workflow' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode('workflow')}
              data-testid="button-view-workflow"
            >
              Workflow
            </Button>
            <Button
              variant={viewMode === 'files' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode('files')}
              data-testid="button-view-files"
            >
              Files
            </Button>
            <Button
              variant={viewMode === 'workspace' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setViewMode('workspace')}
              data-testid="button-view-workspace"
            >
              <Layers className="w-3.5 h-3.5" />
              Workspace
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {bookOutline && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-serif font-medium text-foreground truncate max-w-[200px]">
                {bookOutline.title}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {bookOutline.chapters?.length || 0} ch
              </Badge>
            </div>
          )}
          
          <Separator orientation="vertical" className="h-5" />
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-3 h-3 text-green-600" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : null}
          </div>
          
          {generationProgress.isGenerating && (
            <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {generationProgress.currentChapter}/{generationProgress.totalChapters}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", !rightPanelCollapsed && "bg-accent")}
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            data-testid="button-toggle-right-panel"
          >
            <PanelRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'workspace' ? (
        <WorkspaceCanvas />
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {!leftPanelCollapsed && (
            <>
              <ResizablePanel 
                defaultSize={viewMode === 'workflow' ? 16 : 20} 
                minSize={14} 
                maxSize={28}
                className="min-w-[180px]"
              >
                {viewMode === 'workflow' ? (
                  <ToolPanel />
                ) : (
                  <ProjectNavigator
                    selectedItem={selectedItem}
                    onSelectItem={handleSelectItem}
                    onCreateItem={handleCreateItem}
                  />
                )}
              </ResizablePanel>
              
              <ResizableHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />
            </>
          )}
          
          <ResizablePanel defaultSize={leftPanelCollapsed && rightPanelCollapsed ? 100 : 64}>
            <div className="h-full overflow-hidden bg-background">
              {children}
            </div>
          </ResizablePanel>
          
          {!rightPanelCollapsed && (
            <>
              <ResizableHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />
              
              <ResizablePanel 
                defaultSize={20} 
                minSize={16} 
                maxSize={30}
                className="min-w-[200px]"
              >
                <ContextPanel
                  selectedItem={selectedItem}
                  isCollapsed={false}
                  onToggleCollapse={() => setRightPanelCollapsed(true)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      )}
    </div>
  );
}
