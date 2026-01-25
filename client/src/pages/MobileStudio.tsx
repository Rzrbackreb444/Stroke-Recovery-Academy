import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Menu, ChevronLeft, ChevronRight, Plus, Trash2, Save, Cloud, CloudOff,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Sparkles, Wand2, Expand, FileText, MessageSquare, Lightbulb,
  Sun, Moon, Mic, MicOff, Settings, Download, Share2,
  BookOpen, Users, MapPin, Palette, FileQuestion, Brain,
  MoreVertical, Eye, Edit3, Type, Layers, X, Check, RefreshCw,
  ChevronUp, ChevronDown, GripVertical, Copy, Scissors, ClipboardPaste
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  lastEdited: Date;
}

interface Project {
  id: string;
  title: string;
  chapters: Chapter[];
  brain: ProjectBrain;
  settings: ProjectSettings;
  lastSaved: Date;
  cursorPosition: { chapterId: string; position: number };
}

interface ProjectBrain {
  characters: BrainItem[];
  plotNotes: BrainItem[];
  toneRules: BrainItem[];
  glossary: BrainItem[];
  worldNotes: BrainItem[];
}

interface BrainItem {
  id: string;
  title: string;
  content: string;
  category?: string;
}

interface ProjectSettings {
  theme: "light" | "dark" | "sepia" | "system";
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  chapterStyle: "modern" | "classic" | "minimal";
}

const defaultProject: Project = {
  id: `project-${Date.now()}`,
  title: "Untitled Book",
  chapters: [
    { id: "ch-1", title: "Chapter 1", content: "", order: 0, wordCount: 0, lastEdited: new Date() }
  ],
  brain: {
    characters: [],
    plotNotes: [],
    toneRules: [],
    glossary: [],
    worldNotes: []
  },
  settings: {
    theme: "light",
    fontSize: 18,
    fontFamily: "Georgia",
    lineHeight: 1.8,
    chapterStyle: "modern"
  },
  lastSaved: new Date(),
  cursorPosition: { chapterId: "ch-1", position: 0 }
};

export default function MobileStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const recognitionRef = useRef<any>(null);

  const [project, setProject] = useState<Project>(() => {
    const saved = localStorage.getItem("kreAIte_currentProject");
    return saved ? JSON.parse(saved) : defaultProject;
  });

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [showBrainPanel, setShowBrainPanel] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [brainTab, setBrainTab] = useState("characters");
  const [newBrainItem, setNewBrainItem] = useState({ title: "", content: "" });

  const currentChapter = project.chapters[currentChapterIndex] || project.chapters[0];
  const isDarkMode = project.settings.theme === "dark";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      saveToLocalStorage();
    }, 5000);
    return () => clearInterval(timer);
  }, [project]);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem("kreAIte_currentProject", JSON.stringify({
      ...project,
      lastSaved: new Date()
    }));
    setLastSaveTime(new Date());
  }, [project]);

  const updateChapterContent = (content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(w => w).length;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) => 
        i === currentChapterIndex 
          ? { ...ch, content, wordCount, lastEdited: new Date() }
          : ch
      )
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentChapterIndex < project.chapters.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
        toast({ title: project.chapters[currentChapterIndex + 1].title });
      } else if (diff < 0 && currentChapterIndex > 0) {
        setCurrentChapterIndex(prev => prev - 1);
        toast({ title: project.chapters[currentChapterIndex - 1].title });
      }
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: `Chapter ${project.chapters.length + 1}`,
      content: "",
      order: project.chapters.length,
      wordCount: 0,
      lastEdited: new Date()
    };
    setProject(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
    setCurrentChapterIndex(project.chapters.length);
    setShowChapterDrawer(false);
  };

  const deleteChapter = (id: string) => {
    if (project.chapters.length <= 1) {
      toast({ title: "Cannot delete", description: "You need at least one chapter", variant: "destructive" });
      return;
    }
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== id)
    }));
    if (currentChapterIndex >= project.chapters.length - 1) {
      setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1));
    }
  };

  const updateChapterTitle = (id: string, title: string) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ch.id === id ? { ...ch, title } : ch)
    }));
  };

  const toggleTheme = () => {
    setProject(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === "dark" ? "light" : "dark"
      }
    }));
  };

  const executeAIAction = async (action: string) => {
    setAiLoading(true);
    setShowAIMenu(false);
    
    const textToProcess = selectedText || currentChapter.content.slice(-500);
    
    if (!textToProcess.trim()) {
      toast({ title: "No text", description: "Write something first to use AI actions", variant: "destructive" });
      setAiLoading(false);
      return;
    }
    
    try {
      const response = await apiRequest("POST", "/api/ai/inline-action", {
        action,
        text: textToProcess,
        context: {
          chapterTitle: currentChapter.title,
          projectTitle: project.title,
          characters: project.brain.characters.map(c => c.title),
          toneRules: project.brain.toneRules.map(t => t.content)
        }
      });

      const data = await response.json();
      if (data.result) {
        if (selectedText) {
          const newContent = currentChapter.content.replace(selectedText, data.result);
          updateChapterContent(newContent);
        } else {
          updateChapterContent(currentChapter.content + "\n\n" + data.result);
        }
        toast({ title: "AI Complete", description: `${action} applied successfully` });
      } else {
        throw new Error("No result returned");
      }
    } catch (error: any) {
      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        toast({ title: "Sign in required", description: "Please sign in to use AI features", variant: "destructive" });
      } else {
        toast({ title: "AI Error", description: "Failed to process AI action. Try again.", variant: "destructive" });
      }
    } finally {
      setAiLoading(false);
      setSelectedText("");
    }
  };

  const addBrainItem = (category: keyof ProjectBrain) => {
    if (!newBrainItem.title.trim()) return;
    
    const item: BrainItem = {
      id: `brain-${Date.now()}`,
      title: newBrainItem.title,
      content: newBrainItem.content,
      category
    };

    setProject(prev => ({
      ...prev,
      brain: {
        ...prev.brain,
        [category]: [...prev.brain[category], item]
      }
    }));
    setNewBrainItem({ title: "", content: "" });
    toast({ title: "Added", description: `${newBrainItem.title} saved to Project Brain` });
  };

  const deleteBrainItem = (category: keyof ProjectBrain, id: string) => {
    setProject(prev => ({
      ...prev,
      brain: {
        ...prev.brain,
        [category]: prev.brain[category].filter(item => item.id !== id)
      }
    }));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      setShowAIMenu(true);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Not Supported", description: "Voice input not available in this browser", variant: "destructive" });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      updateChapterContent(currentChapter.content + " " + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    
    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      toast({ title: "Voice Error", variant: "destructive" });
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const getTotalWordCount = () => {
    return project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  };

  const themeClasses = isDarkMode 
    ? "bg-gray-900 text-gray-100" 
    : "bg-[#FAF8F3] text-gray-900";

  const editorThemeClasses = isDarkMode
    ? "bg-gray-800 text-gray-100 placeholder:text-gray-500"
    : "bg-white text-gray-900 placeholder:text-gray-400";

  return (
    <div className={`min-h-screen ${themeClasses} flex flex-col`}>
      <header className={`sticky top-0 z-50 border-b ${isDarkMode ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"} backdrop-blur-sm`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Sheet open={showChapterDrawer} onOpenChange={setShowChapterDrawer}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-chapter-drawer">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={`w-[300px] ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
                <SheetHeader>
                  <SheetTitle className={isDarkMode ? "text-white" : ""}>Chapters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Input
                    value={project.title}
                    onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
                    className={`font-semibold text-lg mb-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
                    placeholder="Book Title"
                    data-testid="input-book-title"
                  />
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-1 pr-4">
                      {project.chapters.map((chapter, index) => (
                        <div
                          key={chapter.id}
                          className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                            index === currentChapterIndex
                              ? isDarkMode ? "bg-[#C9941A]/20 text-[#C9941A]" : "bg-[#C9941A]/10 text-[#C9941A]"
                              : isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setCurrentChapterIndex(index);
                            setShowChapterDrawer(false);
                          }}
                          data-testid={`chapter-item-${index}`}
                        >
                          <GripVertical className="w-4 h-4 opacity-40" />
                          <div className="flex-1 min-w-0">
                            <Input
                              value={chapter.title}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateChapterTitle(chapter.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`border-0 p-0 h-auto font-medium bg-transparent ${isDarkMode ? "text-inherit" : ""}`}
                            />
                            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {chapter.wordCount} words
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChapter(chapter.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button 
                    onClick={addChapter} 
                    className="w-full mt-4 bg-[#C9941A] hover:bg-[#B8860B] text-white"
                    data-testid="button-add-chapter"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chapter
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex flex-col">
              <span className={`text-sm font-semibold truncate max-w-[120px] sm:max-w-[200px] ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {currentChapter.title}
              </span>
              <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {currentChapter.wordCount} words
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge variant="outline" className={`text-xs ${isOnline ? "text-green-600 border-green-600" : "text-orange-500 border-orange-500"}`}>
              {isOnline ? <Cloud className="w-3 h-3 mr-1" /> : <CloudOff className="w-3 h-3 mr-1" />}
              {isOnline ? "Synced" : "Offline"}
            </Badge>
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Sheet open={showBrainPanel} onOpenChange={setShowBrainPanel}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-brain-panel">
                  <Brain className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={`w-[320px] ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
                <SheetHeader>
                  <SheetTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Brain className="w-5 h-5 text-[#C9941A]" />
                    Project Brain
                  </SheetTitle>
                </SheetHeader>
                
                <Tabs value={brainTab} onValueChange={setBrainTab} className="mt-4">
                  <TabsList className={`grid grid-cols-5 ${isDarkMode ? "bg-gray-800" : ""}`}>
                    <TabsTrigger value="characters" className="text-xs p-1">
                      <Users className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="plotNotes" className="text-xs p-1">
                      <FileText className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="toneRules" className="text-xs p-1">
                      <Palette className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="glossary" className="text-xs p-1">
                      <BookOpen className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="worldNotes" className="text-xs p-1">
                      <MapPin className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>

                  {(["characters", "plotNotes", "toneRules", "glossary", "worldNotes"] as const).map((category) => (
                    <TabsContent key={category} value={category} className="mt-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Input
                            placeholder="Title"
                            value={newBrainItem.title}
                            onChange={(e) => setNewBrainItem(prev => ({ ...prev, title: e.target.value }))}
                            className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}
                          />
                          <Textarea
                            placeholder="Details..."
                            value={newBrainItem.content}
                            onChange={(e) => setNewBrainItem(prev => ({ ...prev, content: e.target.value }))}
                            className={`min-h-[80px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
                          />
                          <Button 
                            onClick={() => addBrainItem(category)} 
                            className="w-full bg-[#C9941A] hover:bg-[#B8860B]"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add {category === "characters" ? "Character" : category === "plotNotes" ? "Note" : category === "toneRules" ? "Rule" : category === "glossary" ? "Term" : "Location"}
                          </Button>
                        </div>
                        
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2 pr-2">
                            {project.brain[category].map((item) => (
                              <Card key={item.id} className={`p-3 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className={`font-medium text-sm ${isDarkMode ? "text-white" : ""}`}>{item.title}</h4>
                                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{item.content}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteBrainItem(category, item.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                            {project.brain[category].length === 0 && (
                              <p className={`text-center text-sm py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                No items yet
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <DropdownMenuItem onClick={saveToLocalStorage}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Now
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main 
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none z-10 -translate-y-1/2">
          {currentChapterIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className={`pointer-events-auto rounded-full ${isDarkMode ? "bg-gray-800/80" : "bg-white/80"} shadow-lg`}
              onClick={() => setCurrentChapterIndex(prev => prev - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div />
          {currentChapterIndex < project.chapters.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className={`pointer-events-auto rounded-full ${isDarkMode ? "bg-gray-800/80" : "bg-white/80"} shadow-lg`}
              onClick={() => setCurrentChapterIndex(prev => prev + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="h-full p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
          <Textarea
            ref={editorRef}
            value={currentChapter.content}
            onChange={(e) => updateChapterContent(e.target.value)}
            onSelect={handleTextSelection}
            placeholder="Start writing your story..."
            className={`w-full h-[calc(100vh-180px)] resize-none border-0 focus-visible:ring-0 text-lg leading-relaxed ${editorThemeClasses}`}
            style={{
              fontSize: `${project.settings.fontSize}px`,
              fontFamily: project.settings.fontFamily,
              lineHeight: project.settings.lineHeight
            }}
            data-testid="editor-textarea"
          />
        </div>
      </main>

      <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all ${showFormatToolbar ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <Card className={`flex items-center gap-1 p-2 shadow-xl ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Bold className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Italic className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Underline className="w-4 h-4" /></Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><Heading1 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Heading2 className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Quote className="w-4 h-4" /></Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><List className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ListOrdered className="w-4 h-4" /></Button>
        </Card>
      </div>

      <Dialog open={showAIMenu} onOpenChange={setShowAIMenu}>
        <DialogContent className={`max-w-xs mx-auto ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
              <Sparkles className="w-5 h-5 text-[#C9941A]" />
              AI Actions
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "continue", icon: Edit3, label: "Continue" },
              { id: "rewrite", icon: RefreshCw, label: "Rewrite" },
              { id: "expand", icon: Expand, label: "Expand" },
              { id: "summarize", icon: FileText, label: "Summarize" },
              { id: "fix-tone", icon: Palette, label: "Fix Tone" },
              { id: "dialogue", icon: MessageSquare, label: "Dialogue" },
              { id: "ideas", icon: Lightbulb, label: "Ideas" },
            ].map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className={`flex items-center gap-2 justify-start ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : ""}`}
                onClick={() => executeAIAction(action.id)}
                disabled={aiLoading}
              >
                <action.icon className="w-4 h-4 text-[#C9941A]" />
                {action.label}
              </Button>
            ))}
          </div>
          {selectedText && (
            <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Selected: "{selectedText.substring(0, 50)}..."
            </p>
          )}
        </DialogContent>
      </Dialog>

      <footer className={`fixed bottom-0 left-0 right-0 border-t ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} safe-area-inset-bottom`}>
        <div className="flex items-center justify-around py-2 px-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowFormatToolbar(!showFormatToolbar)}
            className={showFormatToolbar ? "text-[#C9941A]" : ""}
          >
            <Type className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAIMenu(true)}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#C9941A]" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleVoiceRecording}
            className={isRecording ? "text-red-500" : ""}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => setShowBrainPanel(true)}>
            <Brain className="w-5 h-5" />
          </Button>
          
          <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {getTotalWordCount()} words
          </div>
        </div>
      </footer>
    </div>
  );
}
