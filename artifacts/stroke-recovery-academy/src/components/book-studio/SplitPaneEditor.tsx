import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  PanelLeft,
  PanelRight,
  FileText,
  Users,
  Globe,
  Search,
  BookOpen,
  Sparkles,
  Brain,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  MoreVertical,
  Plus,
  Edit3,
  Trash2,
  Pin,
  Copy,
  Download,
  Upload,
  Lightbulb,
  Map,
  Clock,
  MessageSquare,
  Wand2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: string[];
  backstory: string;
  speechPattern?: string;
}

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
}

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  chapter?: number;
  type: 'setup' | 'conflict' | 'climax' | 'resolution';
}

interface SplitPaneEditorProps {
  manuscriptContent: string;
  onManuscriptChange: (content: string) => void;
  currentChapter?: number;
  onChapterChange?: (chapter: number) => void;
}

export default function SplitPaneEditor({
  manuscriptContent,
  onManuscriptChange,
  currentChapter = 1,
  onChapterChange,
}: SplitPaneEditorProps) {
  const { toast } = useToast();
  const {
    bookOutline,
    brainProjectId,
    bookTitle,
  } = useBookStudio();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'chapters' | 'outline'>('chapters');
  const [rightTab, setRightTab] = useState<'research' | 'characters' | 'worldbuilding'>('research');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Nicholas Kremers', role: 'Protagonist', description: 'Stroke survivor and recovery expert', traits: ['Determined', 'Resilient', 'Empathetic'], backstory: 'Experienced a severe stroke and dedicated his life to helping others recover.', speechPattern: 'Direct, encouraging, uses medical terminology naturally' },
  ]);
  
  const [researchNotes, setResearchNotes] = useState<ResearchNote[]>([
    { id: '1', title: 'Neuroplasticity Research', content: 'The brain can rewire itself after stroke through consistent therapy and exercise.', tags: ['medical', 'recovery'], createdAt: new Date() },
    { id: '2', title: 'Recovery Timeline', content: 'Most significant recovery happens in first 3-6 months, but improvements can continue for years.', tags: ['timeline', 'recovery'], createdAt: new Date() },
  ]);

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const { data: brainMemories } = useQuery({
    queryKey: ['/api/author-brain/memories', brainProjectId],
    enabled: !!brainProjectId,
  });

  const characterMemories = useMemo(() => {
    if (!brainMemories) return [];
    return (brainMemories as any[]).filter(m => m.contentType === 'character');
  }, [brainMemories]);

  const researchMemories = useMemo(() => {
    if (!brainMemories) return [];
    return (brainMemories as any[]).filter(m => m.contentType === 'research' || m.contentType === 'lore');
  }, [brainMemories]);

  const chapters = bookOutline?.chapters || [];
  const currentChapterData = chapters[currentChapter - 1];

  const handleInsertReference = useCallback((text: string) => {
    const insertion = `\n\n[Reference: ${text}]\n\n`;
    onManuscriptChange(manuscriptContent + insertion);
    toast({ title: "Reference inserted" });
  }, [manuscriptContent, onManuscriptChange, toast]);

  const handleInsertCharacterNote = useCallback((character: Character) => {
    const insertion = `\n\n<!-- Character Note: ${character.name} - ${character.description} -->\n\n`;
    onManuscriptChange(manuscriptContent + insertion);
    toast({ title: `${character.name} reference inserted` });
  }, [manuscriptContent, onManuscriptChange, toast]);

  const addCharacter = useCallback(() => {
    if (!newCharacterName.trim()) return;
    
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: newCharacterName,
      role: 'Supporting',
      description: '',
      traits: [],
      backstory: '',
    };
    
    setCharacters(prev => [...prev, newChar]);
    setNewCharacterName("");
    setIsAddingCharacter(false);
    setSelectedCharacter(newChar);
    toast({ title: "Character added" });
  }, [newCharacterName, toast]);

  const addResearchNote = useCallback(() => {
    if (!newNoteTitle.trim()) return;
    
    const newNote: ResearchNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle,
      content: '',
      tags: [],
      createdAt: new Date(),
    };
    
    setResearchNotes(prev => [...prev, newNote]);
    setNewNoteTitle("");
    setIsAddingNote(false);
    setSelectedNote(newNote);
    toast({ title: "Note added" });
  }, [newNoteTitle, toast]);

  const wordCount = (manuscriptContent || '').split(/\s+/).filter(w => w).length;

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            data-testid="toggle-left-panel"
          >
            {leftPanelOpen ? <PanelLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          
          <Badge variant="outline" className="text-xs">
            Chapter {currentChapter}
          </Badge>
          
          {currentChapterData && (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {currentChapterData.title}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {wordCount.toLocaleString()} words
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            data-testid="toggle-right-panel"
          >
            {rightPanelOpen ? <PanelRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {leftPanelOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[180px]">
              <div className="h-full flex flex-col border-r">
                <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b px-2 h-9">
                    <TabsTrigger value="chapters" className="text-xs gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Chapters
                    </TabsTrigger>
                    <TabsTrigger value="outline" className="text-xs gap-1">
                      <Map className="w-3.5 h-3.5" />
                      Outline
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chapters" className="flex-1 m-0">
                    <ScrollArea className="h-full">
                      <div className="p-2 space-y-1">
                        {chapters.map((chapter, idx) => (
                          <Button
                            key={idx}
                            variant={currentChapter === idx + 1 ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => onChapterChange?.(idx + 1)}
                          >
                            <span className="truncate">{idx + 1}. {chapter.title}</span>
                          </Button>
                        ))}
                        
                        {chapters.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No chapters yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="outline" className="flex-1 m-0">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-3">
                        {bookOutline ? (
                          <>
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Title</h4>
                              <p className="text-sm font-medium">{bookOutline.title}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Genre</h4>
                              <Badge variant="outline" className="text-xs">{bookOutline.genre}</Badge>
                            </div>
                            {bookOutline.chapters && bookOutline.chapters.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">Chapters</h4>
                                <p className="text-xs text-muted-foreground">{bookOutline.chapters.length} chapters</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No outline yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
            
            <ResizableHandle className="w-1 bg-border hover:bg-primary/20" />
          </>
        )}

        <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 60 : 80}>
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-6">
                <Textarea
                  value={manuscriptContent}
                  onChange={(e) => onManuscriptChange(e.target.value)}
                  placeholder="Start writing your manuscript..."
                  className="min-h-[70vh] text-base leading-relaxed resize-none border-none shadow-none focus-visible:ring-0 font-serif"
                  data-testid="manuscript-editor"
                />
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        {rightPanelOpen && (
          <>
            <ResizableHandle className="w-1 bg-border hover:bg-primary/20" />
            
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="min-w-[200px]">
              <div className="h-full flex flex-col border-l">
                <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)} className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b px-2 h-9">
                    <TabsTrigger value="research" className="text-xs gap-1">
                      <Search className="w-3.5 h-3.5" />
                      Research
                    </TabsTrigger>
                    <TabsTrigger value="characters" className="text-xs gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Characters
                    </TabsTrigger>
                    <TabsTrigger value="worldbuilding" className="text-xs gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      World
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="research" className="flex-1 m-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="p-2 border-b">
                        {isAddingNote ? (
                          <div className="flex gap-1">
                            <Input
                              value={newNoteTitle}
                              onChange={(e) => setNewNoteTitle(e.target.value)}
                              placeholder="Note title..."
                              className="h-7 text-xs"
                              onKeyDown={(e) => e.key === 'Enter' && addResearchNote()}
                            />
                            <Button size="sm" className="h-7 px-2" onClick={addResearchNote}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setIsAddingNote(false)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setIsAddingNote(true)}>
                            <Plus className="w-3 h-3 mr-1" />
                            Add Note
                          </Button>
                        )}
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-2">
                          {researchNotes.map(note => (
                            <Card
                              key={note.id}
                              className={cn(
                                "cursor-pointer hover:shadow-sm transition-shadow",
                                selectedNote?.id === note.id && "ring-1 ring-primary"
                              )}
                              onClick={() => setSelectedNote(note)}
                            >
                              <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs flex items-center justify-between">
                                  <span className="truncate">{note.title}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInsertReference(note.content);
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{note.content}</p>
                                <div className="flex gap-1 mt-2">
                                  {note.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0">{tag}</Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {researchMemories.map((memory: any) => (
                            <Card key={memory.id} className="cursor-pointer hover:shadow-sm">
                              <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-primary" />
                                  <span className="truncate">{memory.title}</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{memory.content}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="characters" className="flex-1 m-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="p-2 border-b">
                        {isAddingCharacter ? (
                          <div className="flex gap-1">
                            <Input
                              value={newCharacterName}
                              onChange={(e) => setNewCharacterName(e.target.value)}
                              placeholder="Character name..."
                              className="h-7 text-xs"
                              onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
                            />
                            <Button size="sm" className="h-7 px-2" onClick={addCharacter}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setIsAddingCharacter(false)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setIsAddingCharacter(true)}>
                            <Plus className="w-3 h-3 mr-1" />
                            Add Character
                          </Button>
                        )}
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-2">
                          {characters.map(character => (
                            <Card
                              key={character.id}
                              className={cn(
                                "cursor-pointer hover:shadow-sm transition-shadow",
                                selectedCharacter?.id === character.id && "ring-1 ring-primary"
                              )}
                              onClick={() => setSelectedCharacter(character)}
                            >
                              <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs flex items-center justify-between">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-primary" />
                                    {character.name}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInsertCharacterNote(character);
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <Badge variant="outline" className="text-[8px] mb-1">{character.role}</Badge>
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{character.description}</p>
                                {character.traits.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {character.traits.slice(0, 3).map(trait => (
                                      <Badge key={trait} variant="secondary" className="text-[8px] px-1 py-0">{trait}</Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          
                          {characterMemories.map((memory: any) => (
                            <Card key={memory.id} className="cursor-pointer hover:shadow-sm">
                              <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-primary" />
                                  <span className="truncate">{memory.title}</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{memory.content}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="worldbuilding" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-3">
                        <div className="text-center py-8">
                          <Globe className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground mb-3">Build your world</p>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Location
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
