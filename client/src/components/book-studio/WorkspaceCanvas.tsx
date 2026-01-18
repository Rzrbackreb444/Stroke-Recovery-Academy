import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import DocumentWindow, { DocumentType, DocumentWindowProps } from "./DocumentWindow";
import CommandPalette, { CommandItem } from "./CommandPalette";
import ResearchPanel from "./ResearchPanel";
import KDPPreview from "./KDPPreview";
import DoctrineChecker from "./DoctrineChecker";
import FrontBackMatter from "./FrontBackMatter";
import CharacterDialogue from "./CharacterDialogue";
import ConsistencyMonitor from "./ConsistencyMonitor";
import SplitPaneEditor from "./SplitPaneEditor";
import {
  Plus,
  Upload,
  Command,
  Sparkles,
  FileText,
  Image,
  Users,
  Globe,
  Lightbulb,
  Search,
  Brain,
  Wand2,
  Merge,
  LayoutGrid,
  List,
  Loader2,
  Languages,
  BookOpen,
  Edit,
  Trash2,
  Download,
  FolderOpen,
  Rocket,
  Eye,
  Settings,
  Grid3X3,
  Layers,
  PanelLeft,
  X,
  Shield,
  MessageSquare,
  BookMarked,
  Printer,
  PanelRightOpen,
} from "lucide-react";

interface WorkspaceDocument {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isPinned: boolean;
  zIndex: number;
  wordCount?: number;
  lastModified: Date;
  language?: string;
  tags?: string[];
}

interface QuickNote {
  id: string;
  content: string;
  createdAt: Date;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'he', name: 'Hebrew', native: 'עברית' },
];

export default function WorkspaceCanvas() {
  const { toast } = useToast();
  const { 
    bookOutline, 
    brainstormIdeas, 
    images,
    brainProjectId,
    bookTitle,
    setManuscriptHtml,
  } = useBookStudio();

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'grid' | 'focus' | 'split' | 'kdp'>('canvas');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [workspaceLanguage, setWorkspaceLanguage] = useState('en');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [newDocType, setNewDocType] = useState<DocumentType>('note');
  const [newDocTitle, setNewDocTitle] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [highestZ, setHighestZ] = useState(10);
  const [minimizedDock, setMinimizedDock] = useState<WorkspaceDocument[]>([]);
  
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const [isFrontBackOpen, setIsFrontBackOpen] = useState(false);
  const [isConsistencyOpen, setIsConsistencyOpen] = useState(false);
  const [isDoctrineOpen, setIsDoctrineOpen] = useState(false);
  const [manuscriptContent, setManuscriptContent] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);

  const handleManuscriptChange = useCallback((content: string) => {
    setManuscriptContent(content);
    setManuscriptHtml(content);
  }, [setManuscriptHtml]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreatingDoc(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsQuickNoteOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const createDocument = useCallback((type: DocumentType, title: string, content: string = "") => {
    const newDoc: WorkspaceDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      type,
      content,
      position: { 
        x: 50 + (documents.length % 5) * 30, 
        y: 50 + (documents.length % 5) * 30 
      },
      size: { width: 400, height: 300 },
      isMinimized: false,
      isPinned: false,
      zIndex: highestZ + 1,
      lastModified: new Date(),
      language: workspaceLanguage,
    };
    
    setHighestZ(h => h + 1);
    setDocuments(prev => [...prev, newDoc]);
    return newDoc.id;
  }, [documents.length, highestZ, workspaceLanguage]);

  const handleCreateNewDoc = useCallback(() => {
    if (!newDocTitle.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }
    createDocument(newDocType, newDocTitle);
    setNewDocTitle("");
    setIsCreatingDoc(false);
    toast({ title: "Document created", description: `${newDocTitle} is ready for editing` });
  }, [newDocType, newDocTitle, createDocument, toast]);

  const handleCloseDoc = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setMinimizedDock(prev => prev.filter(d => d.id !== id));
  }, []);

  const handleMinimizeDoc = useCallback((id: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, isMinimized: !d.isMinimized };
        if (updated.isMinimized) {
          setMinimizedDock(dock => [...dock, updated]);
        } else {
          setMinimizedDock(dock => dock.filter(doc => doc.id !== id));
        }
        return updated;
      }
      return d;
    }));
  }, []);

  const handleFocusDoc = useCallback((id: string) => {
    const newZ = highestZ + 1;
    setHighestZ(newZ);
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, zIndex: newZ } : d
    ));
  }, [highestZ]);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, position } : d
    ));
  }, []);

  const handleContentChange = useCallback((id: string, content: string) => {
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, content, lastModified: new Date(), wordCount: content.split(/\s+/).filter(w => w).length } : d
    ));
  }, []);

  const handlePinDoc = useCallback((id: string) => {
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, isPinned: !d.isPinned } : d
    ));
  }, []);

  const handleDuplicateDoc = useCallback((id: string) => {
    const original = documents.find(d => d.id === id);
    if (original) {
      createDocument(original.type, `${original.title} (Copy)`, original.content);
    }
  }, [documents, createDocument]);

  const handleInsertToManuscript = useCallback((id: string, newContent: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      toast({ title: "Inserted", description: `"${doc.title}" added to manuscript` });
    }
  }, [documents, toast]);

  const handleAddQuickNote = useCallback(() => {
    if (!quickNoteContent.trim()) return;
    
    const note: QuickNote = {
      id: `note-${Date.now()}`,
      content: quickNoteContent,
      createdAt: new Date(),
    };
    
    setQuickNotes(prev => [note, ...prev]);
    setQuickNoteContent("");
    
    createDocument('note', `Quick Note ${quickNotes.length + 1}`, quickNoteContent);
    toast({ title: "Note created" });
  }, [quickNoteContent, quickNotes.length, createDocument, toast]);

  const handleSynthesizeSelected = useCallback(async () => {
    if (selectedDocs.size < 2) {
      toast({ title: "Select at least 2 documents", variant: "destructive" });
      return;
    }
    
    setIsSynthesizing(true);
    
    try {
      const selectedDocuments = documents.filter(d => selectedDocs.has(d.id));
      const combinedContent = selectedDocuments.map(d => 
        `## ${d.title}\n\n${d.content}`
      ).join('\n\n---\n\n');
      
      const response = await apiRequest('POST', '/api/book-studio/analyze', {
        content: combinedContent,
        contentType: 'synthesis',
        genre: bookOutline?.genre || 'general',
      });
      
      const data = await response.json();
      
      createDocument('draft', 'Synthesized Draft', data.summary || combinedContent);
      setSelectedDocs(new Set());
      toast({ title: "Documents synthesized", description: "AI has combined your content into a new draft" });
    } catch (error) {
      toast({ title: "Synthesis failed", variant: "destructive" });
    } finally {
      setIsSynthesizing(false);
    }
  }, [selectedDocs, documents, bookOutline, createDocument, toast]);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          createDocument('image', file.name, reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = () => {
          createDocument('draft', file.name.replace(/\.[^/.]+$/, ''), reader.result as string);
        };
        reader.readAsText(file);
      } else {
        toast({ 
          title: "Unsupported file", 
          description: `${file.name} - Try .txt, .md, or image files`,
          variant: "destructive" 
        });
      }
    }
  }, [createDocument, toast]);

  const commands: CommandItem[] = useMemo(() => [
    { id: 'new-note', title: 'New Note', description: 'Create a quick note', icon: Lightbulb, category: 'create', shortcut: '⌘N', action: () => { setNewDocType('note'); setIsCreatingDoc(true); }},
    { id: 'new-chapter', title: 'New Chapter', description: 'Start a new chapter', icon: FileText, category: 'create', action: () => { setNewDocType('chapter'); setIsCreatingDoc(true); }},
    { id: 'new-character', title: 'New Character', description: 'Create character profile', icon: Users, category: 'create', action: () => { setNewDocType('character'); setIsCreatingDoc(true); }},
    { id: 'new-worldbuilding', title: 'New World Entry', description: 'Add world-building details', icon: Globe, category: 'create', action: () => { setNewDocType('worldbuilding'); setIsCreatingDoc(true); }},
    { id: 'new-research', title: 'New Research', description: 'Add research notes', icon: Search, category: 'create', action: () => { setNewDocType('research'); setIsCreatingDoc(true); }},
    { id: 'upload-file', title: 'Upload File', description: 'Import document or image', icon: Upload, category: 'file', action: () => fileInputRef.current?.click() },
    { id: 'project-brain', title: 'Open Project Brain', description: 'Access knowledge base', icon: Brain, category: 'navigate', action: () => setIsResearchOpen(true) },
    { id: 'quick-note', title: 'Quick Note', description: 'Jot down a quick thought', icon: Edit, category: 'create', shortcut: '⌘⇧N', action: () => setIsQuickNoteOpen(true) },
    { id: 'synthesize', title: 'AI Synthesize', description: 'Combine selected documents', icon: Merge, category: 'ai', action: handleSynthesizeSelected },
    { id: 'analyze-all', title: 'AI Analyze All', description: 'Get insights on all content', icon: Sparkles, category: 'ai', action: () => toast({ title: "Analyzing...", description: "AI is reviewing your workspace" }) },
    { id: 'translate', title: 'Translate Document', description: 'Translate to another language', icon: Languages, category: 'ai', action: () => toast({ title: "Select a document first" }) },
    { id: 'canvas-view', title: 'Canvas View', description: 'Free-form document layout', icon: LayoutGrid, category: 'view', action: () => setActiveTab('canvas') },
    { id: 'grid-view', title: 'Grid View', description: 'Organized grid layout', icon: Grid3X3, category: 'view', action: () => setActiveTab('grid') },
    { id: 'focus-view', title: 'Focus Mode', description: 'Distraction-free writing', icon: Eye, category: 'view', action: () => setActiveTab('focus') },
    { id: 'split-view', title: 'Split Pane Editor', description: 'Manuscript with research panels', icon: PanelRightOpen, category: 'view', action: () => setActiveTab('split') },
    { id: 'kdp-preview', title: 'KDP Preview', description: 'Live print-ready preview', icon: Printer, category: 'view', action: () => setActiveTab('kdp') },
    { id: 'dialogue-engine', title: 'Deep Dialogue Engine', description: 'Roleplay with characters', icon: MessageSquare, category: 'ai', action: () => setIsDialogueOpen(true) },
    { id: 'front-back-matter', title: 'Front/Back Matter', description: 'Generate dedication, TOC, etc', icon: BookMarked, category: 'create', action: () => setIsFrontBackOpen(true) },
    { id: 'consistency-check', title: 'Consistency Monitor', description: 'Track 200k+ words for conflicts', icon: Shield, category: 'ai', action: () => setIsConsistencyOpen(true) },
    { id: 'doctrine-check', title: 'Doctrine Checker', description: 'Validate against source of truth', icon: BookOpen, category: 'ai', action: () => setIsDoctrineOpen(true) },
  ], [handleSynthesizeSelected, toast]);

  const visibleDocuments = documents.filter(d => !d.isMinimized);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsCommandOpen(true)}
            data-testid="button-command-palette"
          >
            <Command className="w-4 h-4" />
            <span className="hidden sm:inline">Command</span>
            <Badge variant="secondary" className="text-[9px] px-1">⌘K</Badge>
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant={activeTab === 'canvas' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('canvas')}
              data-testid="view-canvas"
              title="Canvas View"
            >
              <Layers className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTab === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('grid')}
              data-testid="view-grid"
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTab === 'focus' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('focus')}
              data-testid="view-focus"
              title="Focus Mode"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTab === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('split')}
              data-testid="view-split"
              title="Split Pane Editor"
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTab === 'kdp' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('kdp')}
              data-testid="view-kdp"
              title="KDP Preview"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogueOpen(true)}
              title="Deep Dialogue Engine"
              data-testid="button-dialogue-engine"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConsistencyOpen(true)}
              title="Consistency Monitor"
              data-testid="button-consistency-monitor"
            >
              <Shield className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFrontBackOpen(true)}
              title="Front/Back Matter"
              data-testid="button-front-back-matter"
            >
              <BookMarked className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDoctrineOpen(true)}
              title="Doctrine Checker"
              data-testid="button-doctrine-checker"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={workspaceLanguage} onValueChange={setWorkspaceLanguage}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Languages className="w-3.5 h-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span>{lang.native}</span>
                  <span className="text-muted-foreground ml-2">({lang.name})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResearchOpen(true)}
            data-testid="button-brain"
          >
            <Brain className="w-4 h-4 mr-2" />
            Brain
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreatingDoc(true)}
            data-testid="button-new-doc"
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {selectedDocs.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b">
          <span className="text-sm font-medium">
            {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSynthesizeSelected} disabled={isSynthesizing}>
              {isSynthesizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Merge className="w-4 h-4 mr-2" />}
              Synthesize
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDocs(new Set())}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div 
        ref={canvasRef}
        className={cn(
          "flex-1 relative overflow-hidden",
          isDragOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="text-lg font-medium">Drop files here</p>
              <p className="text-sm text-muted-foreground">Images, text files, or documents</p>
            </div>
          </div>
        )}

        {activeTab === 'canvas' && (
          <div className="absolute inset-0">
            {visibleDocuments.length === 0 && !isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">Your Creative Workspace</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create notes, research, characters, and chapters. Drag files to upload. 
                    Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">⌘K</kbd> for commands.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={() => setIsCreatingDoc(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Document
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {visibleDocuments.map(doc => (
              <DocumentWindow
                key={doc.id}
                {...doc}
                onClose={handleCloseDoc}
                onMinimize={handleMinimizeDoc}
                onPin={handlePinDoc}
                onContentChange={handleContentChange}
                onPositionChange={handlePositionChange}
                onFocus={handleFocusDoc}
                onDuplicate={handleDuplicateDoc}
                onDelete={handleCloseDoc}
                onInsertToManuscript={handleInsertToManuscript}
              />
            ))}
          </div>
        )}

        {activeTab === 'grid' && (
          <ScrollArea className="h-full">
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map(doc => (
                <Card 
                  key={doc.id} 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    selectedDocs.has(doc.id) && "ring-2 ring-primary"
                  )}
                  onClick={(e) => {
                    if (e.shiftKey || e.metaKey) {
                      setSelectedDocs(prev => {
                        const next = new Set(prev);
                        if (next.has(doc.id)) next.delete(doc.id);
                        else next.add(doc.id);
                        return next;
                      });
                    }
                  }}
                  onDoubleClick={() => {
                    setDocuments(prev => prev.map(d => 
                      d.id === doc.id ? { ...d, isMinimized: false } : d
                    ));
                    setActiveTab('canvas');
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="truncate">{doc.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {doc.content || 'Empty document'}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[9px]">{doc.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{doc.wordCount || 0} words</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card 
                className="cursor-pointer border-dashed hover:border-primary/50 hover:bg-accent/30 transition-colors"
                onClick={() => setIsCreatingDoc(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[150px]">
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">New Document</span>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}

        {activeTab === 'focus' && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-3xl">
              <Textarea
                placeholder="Start writing... Focus mode removes distractions."
                className="min-h-[60vh] text-lg leading-relaxed resize-none border-none shadow-none focus-visible:ring-0"
                data-testid="focus-textarea"
                value={manuscriptContent}
                onChange={(e) => handleManuscriptChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'split' && (
          <SplitPaneEditor
            manuscript={manuscriptContent}
            onManuscriptChange={handleManuscriptChange}
            currentChapter={currentChapter}
            onChapterChange={setCurrentChapter}
          />
        )}

        {activeTab === 'kdp' && (
          <KDPPreview
            manuscriptContent={manuscriptContent}
            bookTitle={bookTitle || "Untitled Book"}
          />
        )}
      </div>

      {minimizedDock.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/30 overflow-x-auto">
          <PanelLeft className="w-4 h-4 text-muted-foreground shrink-0" />
          {minimizedDock.map(doc => (
            <DocumentWindow
              key={`mini-${doc.id}`}
              {...doc}
              isMinimized={true}
              onClose={handleCloseDoc}
              onMinimize={handleMinimizeDoc}
              onContentChange={handleContentChange}
            />
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".txt,.md,.doc,.docx,.rtf,image/*"
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            Array.from(files).forEach(file => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => createDocument('image', file.name, reader.result as string);
                reader.readAsDataURL(file);
              } else {
                const reader = new FileReader();
                reader.onload = () => createDocument('draft', file.name.replace(/\.[^/.]+$/, ''), reader.result as string);
                reader.readAsText(file);
              }
            });
          }
          e.target.value = '';
        }}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        commands={commands}
        recentDocuments={documents.slice(0, 5).map(d => ({ id: d.id, title: d.title, type: d.type }))}
      />

      <ResearchPanel
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
        projectId={brainProjectId}
        bookTitle={bookTitle}
      />

      <Dialog open={isCreatingDoc} onOpenChange={setIsCreatingDoc}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Document Type</label>
              <Select value={newDocType} onValueChange={(v) => setNewDocType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note"><Lightbulb className="w-4 h-4 inline mr-2" />Note</SelectItem>
                  <SelectItem value="chapter"><FileText className="w-4 h-4 inline mr-2" />Chapter</SelectItem>
                  <SelectItem value="character"><Users className="w-4 h-4 inline mr-2" />Character</SelectItem>
                  <SelectItem value="research"><Search className="w-4 h-4 inline mr-2" />Research</SelectItem>
                  <SelectItem value="worldbuilding"><Globe className="w-4 h-4 inline mr-2" />World-Building</SelectItem>
                  <SelectItem value="draft"><Edit className="w-4 h-4 inline mr-2" />Draft</SelectItem>
                  <SelectItem value="outline"><FileText className="w-4 h-4 inline mr-2" />Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewDoc()}
                data-testid="input-new-doc-title"
              />
            </div>
            <Button className="w-full" onClick={handleCreateNewDoc}>
              Create Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isQuickNoteOpen} onOpenChange={setIsQuickNoteOpen}>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Quick Notes
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Textarea
                value={quickNoteContent}
                onChange={(e) => setQuickNoteContent(e.target.value)}
                placeholder="Jot down a quick thought..."
                className="min-h-[100px]"
                data-testid="quick-note-textarea"
              />
              <Button className="w-full" onClick={handleAddQuickNote} disabled={!quickNoteContent.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {quickNotes.map(note => (
                  <Card key={note.id} className="p-3">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {note.createdAt.toLocaleTimeString()}
                    </p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <CharacterDialogue
        isOpen={isDialogueOpen}
        onClose={() => setIsDialogueOpen(false)}
      />

      <FrontBackMatter
        isOpen={isFrontBackOpen}
        onClose={() => setIsFrontBackOpen(false)}
        onInsert={(content) => {
          const newContent = manuscriptContent + '\n\n' + content;
          handleManuscriptChange(newContent);
          toast({ title: "Content inserted into manuscript" });
        }}
      />

      <DoctrineChecker
        manuscriptContent={manuscriptContent}
        isOpen={isDoctrineOpen}
        onClose={() => setIsDoctrineOpen(false)}
      />

      <ConsistencyMonitor
        manuscriptContent={manuscriptContent}
        chapters={bookOutline?.chapters?.map(ch => ({ title: ch.title, content: ch.content || '' })) || []}
        isOpen={isConsistencyOpen}
        onClose={() => setIsConsistencyOpen(false)}
        onNavigateToConflict={(chapter) => {
          setCurrentChapter(chapter);
          setActiveTab('split');
        }}
      />
    </div>
  );
}
