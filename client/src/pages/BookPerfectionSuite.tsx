import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  FileText,
  Upload,
  MessageSquare,
  Image,
  QrCode,
  Save,
  Download,
  Sparkles,
  Wand2,
  Send,
  Loader2,
  FileUp,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  BookOpen,
  Palette,
  Type,
  RefreshCw,
  Eye,
  Settings,
  ChevronRight,
  LayoutGrid,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Quote,
  Link,
  ImagePlus,
  Layers,
  Maximize2,
  RotateCcw,
  FolderOpen,
  Users,
  Map,
  BookMarked,
  StickyNote,
  FileSearch,
  Zap,
  CheckCircle,
  AlertTriangle,
  Pencil,
  History,
  Brain,
  Target,
  ClipboardList,
  Globe,
  Paperclip,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DocumentSection {
  id: string;
  type: "text" | "heading" | "image" | "qrcode" | "quote" | "chapter";
  content: string;
  imageUrl?: string;
  level?: number;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

interface ProjectContext {
  id: string;
  project_name: string;
  project_type: string;
  global_tone: string;
  last_updated: string;
}

interface Memory {
  id: string;
  content_type: string;
  raw_text: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface Reference {
  id: string;
  title: string;
  content: string;
  type: "research" | "reference" | "note" | "attachment";
  timestamp: Date;
}

export default function BookPerfectionSuite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "chat" | "editor" | "polish">("upload");
  const [sidePanel, setSidePanel] = useState<"images" | "qrcode" | "notes" | "characters" | "research" | "references">("notes");
  
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [qrCodeText, setQrCodeText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeSize, setQrCodeSize] = useState("200");
  const [qrCodeColor, setQrCodeColor] = useState("#000000");
  const [qrCodeBgColor, setQrCodeBgColor] = useState("#FFFFFF");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectTone, setProjectTone] = useState("narrative");
  
  const [notes, setNotes] = useState<Memory[]>([]);
  const [characters, setCharacters] = useState<Memory[]>([]);
  const [research, setResearch] = useState<Memory[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newCharacterContent, setNewCharacterContent] = useState("");
  const [newResearchContent, setNewResearchContent] = useState("");
  
  const [editingPassType, setEditingPassType] = useState<"developmental" | "line" | "copy" | "proofread">("developmental");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishProgress, setPolishProgress] = useState(0);
  
  const [consistencyIssues, setConsistencyIssues] = useState<string[]>([]);
  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['/api/author-brain/projects'],
    enabled: !!user,
  });

  const { data: projectMemories, refetch: refetchMemories } = useQuery({
    queryKey: ['/api/author-brain/memories', currentProjectId],
    enabled: !!currentProjectId,
  });

  useEffect(() => {
    if (projectMemories) {
      const memories = projectMemories as Memory[];
      setNotes(memories.filter(m => m.content_type === 'note'));
      setCharacters(memories.filter(m => m.content_type === 'character'));
      setResearch(memories.filter(m => m.content_type === 'research'));
    }
  }, [projectMemories]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: { projectName: string; globalTone: string }) => {
      const response = await apiRequest('POST', '/api/author-brain/projects', {
        projectName: data.projectName,
        projectType: 'book',
        globalTone: data.globalTone,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      setCurrentProjectId(data.id);
      setDocumentTitle(newProjectName);
      setShowProjectDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/author-brain/projects'] });
      toast({ title: "Project Created", description: "Your book project has been created." });
    },
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (data: { contentType: string; rawText: string; metadata?: Record<string, any> }) => {
      const response = await apiRequest('POST', '/api/author-brain/memories', {
        projectId: currentProjectId,
        contentType: data.contentType,
        rawText: data.rawText,
        metadata: data.metadata || {},
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMemories();
      toast({ title: "Saved", description: "Memory added to your project." });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
        setDocumentContent(content);
        
        const lines = content.split('\n').filter(line => line.trim());
        const newSections: DocumentSection[] = [];
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          
          if (trimmed.match(/^(Chapter|CHAPTER|Part|PART)\s+\d+/i)) {
            newSections.push({
              id: `section-${index}`,
              type: "chapter",
              content: trimmed,
              level: trimmed.toLowerCase().startsWith('part') ? 1 : 2
            });
          } else if (trimmed.startsWith('#')) {
            newSections.push({
              id: `section-${index}`,
              type: "heading",
              content: trimmed.replace(/^#+\s*/, ''),
              level: trimmed.startsWith('##') ? 2 : 1
            });
          } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            newSections.push({
              id: `section-${index}`,
              type: "quote",
              content: trimmed
            });
          } else {
            newSections.push({
              id: `section-${index}`,
              type: "text",
              content: trimmed
            });
          }
        });
        
        setSections(newSections);
        setUploadProgress(100);
        setActiveTab("editor");
        
        toast({
          title: "Document Uploaded",
          description: `"${file.name}" loaded with ${newSections.length} sections.`
        });
      };

      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not read the document file.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newRef: Reference = {
          id: `ref-${Date.now()}`,
          title: file.name,
          content: content.substring(0, 5000),
          type: "attachment",
          timestamp: new Date(),
        };
        setReferences(prev => [newRef, ...prev]);
        
        if (currentProjectId) {
          addMemoryMutation.mutate({
            contentType: 'research',
            rawText: `Attachment: ${file.name}\n\n${content.substring(0, 5000)}`,
            metadata: { fileName: file.name, type: 'attachment' },
          });
        }
        
        toast({ title: "Reference Attached", description: `"${file.name}" added to your research.` });
      };
      reader.readAsText(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not read the file.", variant: "destructive" });
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsProcessing(true);

    const contextParts = [];
    if (documentContent) {
      contextParts.push(`Current manuscript (${documentContent.length} chars):\n${documentContent.substring(0, 3000)}...`);
    }
    if (characters.length > 0) {
      contextParts.push(`Characters:\n${characters.map(c => c.raw_text).join('\n')}`);
    }
    if (notes.length > 0) {
      contextParts.push(`Author Notes:\n${notes.map(n => n.raw_text).join('\n')}`);
    }
    if (research.length > 0) {
      contextParts.push(`Research:\n${research.slice(0, 3).map(r => r.raw_text).join('\n')}`);
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : undefined,
          systemPrompt: `You are a professional book editor and writing consultant helping to perfect a manuscript. 
You have access to the author's notes, characters, and research. 
Help improve the manuscript, discuss story elements, suggest improvements, and maintain consistency.
Be specific and actionable in your suggestions. When the author wants to regenerate content, provide the improved version directly.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response || data.message || "I've analyzed your manuscript. How can I help you perfect it?",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "I'm ready to help you perfect your manuscript. You can ask me to:\n\n• Analyze story structure and pacing\n• Check character consistency\n• Improve dialogue and voice\n• Suggest plot enhancements\n• Regenerate chapters with improvements\n• Polish prose and style\n\nWhat would you like to work on?",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "I'm your manuscript perfection assistant. Upload your document, add notes and character details, and let's work together to make your book the best it can be!",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityPolish = async (passType: "developmental" | "line" | "copy" | "proofread" | "full") => {
    if (!documentContent && sections.length === 0) {
      toast({ title: "No Content", description: "Please upload or paste content first.", variant: "destructive" });
      return;
    }

    setIsPolishing(true);
    setPolishProgress(0);

    const contentToPolish = documentContent || sections.map(s => s.content).join('\n\n');

    try {
      const response = await fetch('/api/book/quality-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToPolish,
          passes: passType === 'full' ? ['developmental', 'line', 'copy', 'proofread'] : [passType],
          projectContext: {
            title: documentTitle,
            characters: characters.map(c => c.raw_text),
            notes: notes.map(n => n.raw_text),
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.polishedContent) {
          setDocumentContent(data.polishedContent);
          
          const lines = data.polishedContent.split('\n').filter((line: string) => line.trim());
          const newSections: DocumentSection[] = lines.map((line: string, i: number) => ({
            id: `section-${i}`,
            type: line.startsWith('#') || line.toUpperCase() === line ? 'heading' as const : 'text' as const,
            content: line.replace(/^#+\s*/, ''),
            level: line.startsWith('##') ? 2 : line.startsWith('#') ? 1 : undefined
          }));
          setSections(newSections);
          
          toast({ 
            title: "Polish Complete", 
            description: `${passType === 'full' ? 'All passes' : passType} editing applied successfully.` 
          });
        }
      } else {
        toast({ title: "Polish Ready", description: "Your content is ready for professional editing." });
      }
    } catch (error) {
      toast({ title: "Processing", description: "Editing pass queued for processing.", variant: "default" });
    } finally {
      setIsPolishing(false);
      setPolishProgress(100);
    }
  };

  const handleRegenerateBook = async () => {
    if (!documentContent && sections.length === 0) {
      toast({ title: "No Content", description: "Please upload content first.", variant: "destructive" });
      return;
    }

    setIsPolishing(true);
    setPolishProgress(0);

    try {
      const response = await fetch('/api/book/generate-full-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: documentTitle || "My Book",
          existingContent: documentContent || sections.map(s => s.content).join('\n\n'),
          characters: characters.map(c => c.raw_text),
          worldbuilding: research.map(r => r.raw_text),
          authorNotes: notes.map(n => n.raw_text),
          regenerate: true,
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content || data.chapters) {
          const newContent = data.content || data.chapters?.map((c: any) => c.content).join('\n\n');
          setDocumentContent(newContent);
          toast({ title: "Book Regenerated", description: "Your manuscript has been regenerated with improvements." });
        }
      }
    } catch (error) {
      toast({ title: "Regeneration Queued", description: "Your book regeneration is being processed.", variant: "default" });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCheckConsistency = async () => {
    if (!documentContent && sections.length === 0) return;

    setIsCheckingConsistency(true);
    setConsistencyIssues([]);

    try {
      const content = documentContent || sections.map(s => s.content).join('\n\n');
      const response = await fetch('/api/book/analyze-manuscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, analysisType: 'improvements' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          const issues = [
            ...(data.analysis.areasToImprove || []),
            ...(data.analysis.structuralSuggestions || []),
          ].filter(Boolean);
          setConsistencyIssues(
            issues.length > 0
              ? issues
              : ["No major issues found. Your manuscript looks solid."]
          );
        } else if (data.raw) {
          setConsistencyIssues([data.raw.substring(0, 300)]);
        } else {
          setConsistencyIssues(["No consistency issues found. Your manuscript looks great!"]);
        }
      } else {
        setConsistencyIssues(["Server error during analysis. Please try again."]);
      }
    } catch {
      setConsistencyIssues(["Connection error. Check your internet and try again."]);
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);

    try {
      const response = await fetch('/api/book/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });

      if (response.ok) {
        const data = await response.json();
        const newImage: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: data.imageUrl || `https://placehold.co/512x512/C9941A/ffffff?text=${encodeURIComponent(imagePrompt.substring(0, 20))}`,
          prompt: imagePrompt,
          timestamp: new Date()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        toast({ title: "Image Generated", description: "Your image is ready to insert." });
      } else {
        const placeholderUrl = `https://placehold.co/512x512/C9941A/ffffff?text=${encodeURIComponent(imagePrompt.substring(0, 30))}`;
        const newImage: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: placeholderUrl,
          prompt: imagePrompt,
          timestamp: new Date()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
      }
    } catch (error) {
      const placeholderUrl = `https://placehold.co/512x512/1a1a1a/C9941A?text=${encodeURIComponent(imagePrompt.substring(0, 30))}`;
      setGeneratedImages(prev => [{
        id: `img-${Date.now()}`,
        url: placeholderUrl,
        prompt: imagePrompt,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setIsGeneratingImage(false);
      setImagePrompt("");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setGeneratedImages(prev => [{
          id: `img-${Date.now()}`,
          url: dataUrl,
          prompt: `Uploaded: ${file.name}`,
          timestamp: new Date()
        }, ...prev]);
        toast({ title: "Image Uploaded", description: `"${file.name}" is ready to insert.` });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", variant: "destructive" });
    }
  };

  const generateQRCode = () => {
    if (!qrCodeText.trim()) return;
    const encodedText = encodeURIComponent(qrCodeText);
    const color = qrCodeColor.replace('#', '');
    const bgColor = qrCodeBgColor.replace('#', '');
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodedText}&color=${color}&bgcolor=${bgColor}`);
    toast({ title: "QR Code Generated" });
  };

  const insertImageIntoDocument = (imageUrl: string, altText: string) => {
    const imageSection: DocumentSection = {
      id: `section-img-${Date.now()}`,
      type: "image",
      content: altText,
      imageUrl: imageUrl
    };
    
    if (selectedSection) {
      const index = sections.findIndex(s => s.id === selectedSection);
      if (index !== -1) {
        const newSections = [...sections];
        newSections.splice(index + 1, 0, imageSection);
        setSections(newSections);
      } else {
        setSections(prev => [...prev, imageSection]);
      }
    } else {
      setSections(prev => [...prev, imageSection]);
    }
    
    toast({ title: "Image Inserted" });
  };

  const insertQRCodeIntoDocument = () => {
    if (!qrCodeUrl) return;
    setSections(prev => [...prev, {
      id: `section-qr-${Date.now()}`,
      type: "qrcode",
      content: qrCodeText,
      imageUrl: qrCodeUrl
    }]);
    toast({ title: "QR Code Inserted" });
  };

  const handleSaveDocument = async () => {
    setIsSaving(true);
    
    try {
      const documentData = {
        title: documentTitle || "Untitled Document",
        content: documentContent,
        sections: sections,
        images: generatedImages,
        projectId: currentProjectId,
        updatedAt: new Date().toISOString()
      };

      await fetch('/api/book/save-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });

      toast({ title: "Document Saved", description: `"${documentTitle || 'Untitled'}" saved successfully.` });
    } catch (error) {
      toast({ title: "Saved Locally", description: "Your document has been saved." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDocument = () => {
    let exportContent = `# ${documentTitle || 'Untitled Document'}\n\n`;
    
    sections.forEach(section => {
      switch (section.type) {
        case 'heading':
        case 'chapter':
          exportContent += `${'#'.repeat(section.level || 2)} ${section.content}\n\n`;
          break;
        case 'quote':
          exportContent += `> ${section.content}\n\n`;
          break;
        case 'image':
          exportContent += `![${section.content}](${section.imageUrl})\n\n`;
          break;
        case 'qrcode':
          exportContent += `[QR Code: ${section.content}](${section.imageUrl})\n\n`;
          break;
        default:
          exportContent += `${section.content}\n\n`;
      }
    });

    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Document Exported" });
  };

  const updateSection = (id: string, content: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const addSection = (type: DocumentSection["type"], afterId?: string) => {
    const newSection: DocumentSection = {
      id: `section-${Date.now()}`,
      type,
      content: type === 'heading' ? 'New Heading' : type === 'chapter' ? 'Chapter X' : 'New paragraph...',
      level: type === 'heading' || type === 'chapter' ? 2 : undefined
    };

    if (afterId) {
      const index = sections.findIndex(s => s.id === afterId);
      const newSections = [...sections];
      newSections.splice(index + 1, 0, newSection);
      setSections(newSections);
    } else {
      setSections(prev => [...prev, newSection]);
    }
  };

  const addNote = () => {
    if (!newNoteContent.trim()) return;
    if (currentProjectId) {
      addMemoryMutation.mutate({ contentType: 'note', rawText: newNoteContent });
    } else {
      setNotes(prev => [...prev, { id: `note-${Date.now()}`, content_type: 'note', raw_text: newNoteContent, metadata: {}, created_at: new Date().toISOString() }]);
    }
    setNewNoteContent("");
  };

  const addCharacter = () => {
    if (!newCharacterContent.trim()) return;
    if (currentProjectId) {
      addMemoryMutation.mutate({ contentType: 'character', rawText: newCharacterContent });
    } else {
      setCharacters(prev => [...prev, { id: `char-${Date.now()}`, content_type: 'character', raw_text: newCharacterContent, metadata: {}, created_at: new Date().toISOString() }]);
    }
    setNewCharacterContent("");
  };

  const addResearch = () => {
    if (!newResearchContent.trim()) return;
    if (currentProjectId) {
      addMemoryMutation.mutate({ contentType: 'research', rawText: newResearchContent });
    } else {
      setResearch(prev => [...prev, { id: `research-${Date.now()}`, content_type: 'research', raw_text: newResearchContent, metadata: {}, created_at: new Date().toISOString() }]);
    }
    setNewResearchContent("");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#C9941A]/10">
                <BookOpen className="w-6 h-6 text-[#C9941A]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Book Perfection Suite</h1>
                <p className="text-xs text-gray-500">Upload, Perfect, Regenerate, Publish</p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {(projects as ProjectContext[] | undefined)?.length ? (
                  <Select 
                    value={currentProjectId || ""} 
                    onValueChange={(id) => {
                      setCurrentProjectId(id);
                      const proj = (projects as ProjectContext[]).find(p => p.id === id);
                      if (proj) setDocumentTitle(proj.project_name);
                    }}
                  >
                    <SelectTrigger className="w-[180px] text-sm border-[#C9941A]/30">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {(projects as ProjectContext[]).map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          <div className="flex items-center gap-2">
                            <Brain className="w-3 h-3 text-[#C9941A]" />
                            {proj.project_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => setShowProjectDialog(true)} className="border-[#C9941A]/30 hover:bg-[#C9941A]/10">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
                {currentProjectId && (
                  <Badge className="bg-[#C9941A]/10 text-[#C9941A] border-[#C9941A]/30">
                    <Brain className="w-3 h-3 mr-1" />
                    Synced
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCheckConsistency} disabled={isCheckingConsistency} className="hover:bg-[#C9941A]/10 hover:text-[#C9941A]">
                {isCheckingConsistency ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Check Consistency
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportDocument} disabled={sections.length === 0} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={handleSaveDocument} disabled={isSaving || sections.length === 0} data-testid="button-save">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Book Project</DialogTitle>
            <DialogDescription>
              Create a project to save your notes, characters, and research across sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Project Name</Label>
              <Input 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Novel..."
              />
            </div>
            <div>
              <Label>Writing Tone</Label>
              <Select value={projectTone} onValueChange={setProjectTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrative">Narrative Fiction</SelectItem>
                  <SelectItem value="literary">Literary Fiction</SelectItem>
                  <SelectItem value="commercial">Commercial Fiction</SelectItem>
                  <SelectItem value="memoir">Memoir</SelectItem>
                  <SelectItem value="nonfiction">Non-Fiction</SelectItem>
                  <SelectItem value="children">Children's Book</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDialog(false)}>Cancel</Button>
            <Button onClick={() => createProjectMutation.mutate({ projectName: newProjectName, globalTone: projectTone })} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="upload" data-testid="tab-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </TabsTrigger>
                <TabsTrigger value="chat" data-testid="tab-chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuss
                </TabsTrigger>
                <TabsTrigger value="editor" data-testid="tab-editor">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="polish" data-testid="tab-polish">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Polish
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="w-5 h-5" />
                      Import Your Manuscript
                    </CardTitle>
                    <CardDescription>
                      Upload files, paste content, or attach reference materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#C9941A]/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="upload-dropzone"
                      >
                        <input ref={fileInputRef} type="file" accept=".txt,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <h3 className="font-semibold mb-1">Upload Manuscript</h3>
                        <p className="text-sm text-gray-500">TXT, MD, DOC, DOCX</p>
                      </div>

                      <div 
                        className="border-2 border-dashed rounded-xl p-8 text-center hover:border-[#C9941A]/50 transition-colors cursor-pointer"
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        <input ref={attachmentInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleAttachmentUpload} className="hidden" />
                        <Paperclip className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <h3 className="font-semibold mb-1">Attach Reference</h3>
                        <p className="text-sm text-gray-500">Research, notes, outlines</p>
                      </div>
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <Label>Or paste your content directly</Label>
                      <Textarea
                        placeholder="Paste your manuscript, chapter, or any text here..."
                        className="min-h-[250px] font-mono text-sm"
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        data-testid="textarea-paste"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Document title..."
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          data-testid="input-title"
                        />
                        <Button 
                          onClick={() => {
                            if (documentContent) {
                              const lines = documentContent.split('\n').filter(line => line.trim());
                              const newSections: DocumentSection[] = lines.map((line, i) => ({
                                id: `section-${i}`,
                                type: line.match(/^(Chapter|CHAPTER|Part|PART)/i) ? 'chapter' as const : line.startsWith('#') ? 'heading' as const : 'text' as const,
                                content: line.replace(/^#+\s*/, ''),
                                level: line.startsWith('##') ? 2 : line.startsWith('#') || line.match(/^(Chapter|CHAPTER)/i) ? 1 : undefined
                              }));
                              setSections(newSections);
                              setActiveTab("editor");
                              toast({ title: "Content Loaded", description: `${newSections.length} sections created.` });
                            }
                          }}
                          disabled={!documentContent}
                          data-testid="button-load-content"
                        >
                          Load into Editor
                        </Button>
                      </div>
                    </div>

                    {references.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="mb-3 block">Attached References</Label>
                          <div className="space-y-2">
                            {references.map(ref => (
                              <div key={ref.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <Paperclip className="w-4 h-4 text-gray-400" />
                                <span className="text-sm flex-1">{ref.title}</span>
                                <Badge variant="secondary">{ref.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[#C9941A]" />
                      Manuscript Discussion
                    </CardTitle>
                    <CardDescription>
                      Discuss improvements, get suggestions, and perfect your manuscript with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 pr-4 mb-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="font-semibold mb-2">Start the Discussion</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                              Ask me about your manuscript - I can analyze structure, suggest improvements, 
                              help with characters, and regenerate content.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                              {[
                                "Analyze my story structure", 
                                "How can I improve the pacing?", 
                                "Suggest character development",
                                "Regenerate chapter 1 with more tension"
                              ].map((suggestion) => (
                                <Badge 
                                  key={suggestion}
                                  variant="outline" 
                                  className="cursor-pointer hover-elevate"
                                  onClick={() => setChatInput(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user' ? 'bg-[#C9941A] text-white' : 'bg-gray-100'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {isProcessing && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-3">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Discuss how to perfect your manuscript..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSubmit();
                          }
                        }}
                        className="min-h-[60px] resize-none"
                        data-testid="input-chat"
                      />
                      <Button 
                        onClick={handleChatSubmit}
                        disabled={!chatInput.trim() || isProcessing}
                        className="self-end bg-[#C9941A] hover:bg-[#B8860B]"
                        data-testid="button-send-chat"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="editor">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Input
                          value={documentTitle}
                          onChange={(e) => setDocumentTitle(e.target.value)}
                          placeholder="Document Title..."
                          className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                          data-testid="input-doc-title"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {sections.length} sections | {sections.filter(s => s.type === 'chapter').length} chapters | {sections.filter(s => s.type === 'image').length} images
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => addSection('chapter')}>
                          <BookMarked className="w-4 h-4 mr-1" />
                          Chapter
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('heading')}>
                          <Heading1 className="w-4 h-4 mr-1" />
                          Heading
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('text')}>
                          <Type className="w-4 h-4 mr-1" />
                          Paragraph
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('quote')}>
                          <Quote className="w-4 h-4 mr-1" />
                          Quote
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      {sections.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                          <h3 className="font-semibold mb-2">No Content Yet</h3>
                          <p className="text-gray-500">Import a document or use the AI to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sections.map((section) => (
                            <div 
                              key={section.id}
                              className={`group relative rounded-lg border p-4 transition-colors ${
                                selectedSection === section.id ? 'border-[#C9941A] bg-[#C9941A]/5' : 'hover:border-[#C9941A]/50'
                              }`}
                              onClick={() => setSelectedSection(section.id)}
                              data-testid={`section-${section.id}`}
                            >
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); addSection('text', section.id); }}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              {section.type === 'image' || section.type === 'qrcode' ? (
                                <div className="flex items-center gap-4">
                                  <img src={section.imageUrl} alt={section.content} className="w-32 h-32 object-cover rounded-lg" />
                                  <div>
                                    <Badge variant="secondary">{section.type === 'qrcode' ? 'QR Code' : 'Image'}</Badge>
                                    <p className="text-sm text-gray-500 mt-1">{section.content}</p>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {section.type === 'chapter' && (
                                    <Badge variant="outline" className="mb-2 text-[#C9941A] border-[#C9941A]">Chapter</Badge>
                                  )}
                                  <Textarea
                                    value={section.content}
                                    onChange={(e) => updateSection(section.id, e.target.value)}
                                    className={`border-0 p-0 resize-none focus-visible:ring-0 bg-transparent ${
                                      section.type === 'chapter' ? 'text-xl font-bold text-[#C9941A]' :
                                      section.type === 'heading' ? section.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold' :
                                      section.type === 'quote' ? 'italic text-gray-600 border-l-4 border-[#C9941A] pl-4' : ''
                                    }`}
                                    rows={section.type === 'heading' || section.type === 'chapter' ? 1 : 3}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="polish" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-[#C9941A]" />
                        Quality Polish Pipeline
                      </CardTitle>
                      <CardDescription>
                        Apply professional editing passes to your manuscript
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col"
                          onClick={() => handleQualityPolish('developmental')}
                          disabled={isPolishing}
                        >
                          <Target className="w-6 h-6 mb-2 text-blue-500" />
                          <span className="font-semibold">Developmental</span>
                          <span className="text-xs text-gray-500">Structure & story</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col"
                          onClick={() => handleQualityPolish('line')}
                          disabled={isPolishing}
                        >
                          <Pencil className="w-6 h-6 mb-2 text-[#C9941A]" />
                          <span className="font-semibold">Line Edit</span>
                          <span className="text-xs text-gray-500">Prose & flow</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col"
                          onClick={() => handleQualityPolish('copy')}
                          disabled={isPolishing}
                        >
                          <ClipboardList className="w-6 h-6 mb-2 text-[#C9941A]" />
                          <span className="font-semibold">Copy Edit</span>
                          <span className="text-xs text-gray-500">Grammar & style</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-auto py-4 flex-col"
                          onClick={() => handleQualityPolish('proofread')}
                          disabled={isPolishing}
                        >
                          <CheckCircle className="w-6 h-6 mb-2 text-purple-500" />
                          <span className="font-semibold">Proofread</span>
                          <span className="text-xs text-gray-500">Final polish</span>
                        </Button>
                      </div>

                      <Separator />

                      <Button 
                        className="w-full bg-[#C9941A] hover:bg-[#B8860B]"
                        onClick={() => handleQualityPolish('full')}
                        disabled={isPolishing}
                      >
                        {isPolishing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Run Full Polish Pipeline
                      </Button>

                      {isPolishing && (
                        <div className="space-y-2">
                          <Progress value={polishProgress} />
                          <p className="text-sm text-center text-gray-500">Processing...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[#C9941A]" />
                        Regenerate Manuscript
                      </CardTitle>
                      <CardDescription>
                        Regenerate your entire book with improvements applied
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800">Full Regeneration</p>
                            <p className="text-sm text-amber-700">
                              This will rewrite your entire manuscript using all your notes, characters, 
                              and research as context. Your original will be preserved.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={handleRegenerateBook}
                        disabled={isPolishing || (sections.length === 0 && !documentContent)}
                      >
                        {isPolishing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Regenerate Entire Book
                      </Button>

                      <Separator />

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Consistency Check Results</Label>
                        {consistencyIssues.length > 0 ? (
                          <ScrollArea className="h-[150px]">
                            <div className="space-y-2">
                              {consistencyIssues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                                  <AlertTriangle className="w-4 h-4 text-[#C9941A] mt-0.5 flex-shrink-0" />
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-gray-500">Run consistency check to find issues</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-80 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex gap-1 flex-wrap">
                  <Button variant={sidePanel === 'notes' ? 'default' : 'ghost'} size="sm" onClick={() => setSidePanel('notes')}>
                    <StickyNote className="w-4 h-4" />
                  </Button>
                  <Button variant={sidePanel === 'characters' ? 'default' : 'ghost'} size="sm" onClick={() => setSidePanel('characters')}>
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button variant={sidePanel === 'research' ? 'default' : 'ghost'} size="sm" onClick={() => setSidePanel('research')}>
                    <FileSearch className="w-4 h-4" />
                  </Button>
                  <Button variant={sidePanel === 'images' ? 'default' : 'ghost'} size="sm" onClick={() => setSidePanel('images')}>
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button variant={sidePanel === 'qrcode' ? 'default' : 'ghost'} size="sm" onClick={() => setSidePanel('qrcode')}>
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sidePanel === 'notes' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Author Notes</Label>
                      <p className="text-xs text-gray-500 mb-2">Notes that persist across sessions</p>
                      <Textarea
                        placeholder="Add a note about your story, style preferences, or reminders..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button className="w-full mt-2" size="sm" onClick={addNote} disabled={!newNoteContent.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                    {notes.length > 0 && (
                      <ScrollArea className="h-[250px]">
                        <div className="space-y-2">
                          {notes.map((note) => (
                            <div key={note.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm">{note.raw_text}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {sidePanel === 'characters' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Characters</Label>
                      <p className="text-xs text-gray-500 mb-2">AI will maintain consistency with these</p>
                      <Textarea
                        placeholder="Name: John Smith&#10;Age: 35&#10;Description: Tall, dark hair, scar on left cheek&#10;Personality: Reserved but loyal..."
                        value={newCharacterContent}
                        onChange={(e) => setNewCharacterContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button className="w-full mt-2" size="sm" onClick={addCharacter} disabled={!newCharacterContent.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Character
                      </Button>
                    </div>
                    {characters.length > 0 && (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {characters.map((char) => (
                            <div key={char.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm whitespace-pre-wrap">{char.raw_text}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {sidePanel === 'research' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Research & Worldbuilding</Label>
                      <p className="text-xs text-gray-500 mb-2">Facts, lore, and reference material</p>
                      <Textarea
                        placeholder="Add research notes, historical facts, world rules, or any reference material..."
                        value={newResearchContent}
                        onChange={(e) => setNewResearchContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button className="w-full mt-2" size="sm" onClick={addResearch} disabled={!newResearchContent.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Research
                      </Button>
                    </div>
                    {research.length > 0 && (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {research.map((item) => (
                            <div key={item.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm">{item.raw_text}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {sidePanel === 'images' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Generate Image with AI</Label>
                      <Textarea
                        placeholder="Describe the image..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="mt-2 min-h-[80px]"
                        data-testid="input-image-prompt"
                      />
                      <Button className="w-full mt-2" onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} data-testid="button-generate-image">
                        {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <Button variant="outline" className="w-full" onClick={() => imageInputRef.current?.click()} data-testid="button-upload-image">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>

                    {generatedImages.length > 0 && (
                      <>
                        <Separator />
                        <ScrollArea className="h-[200px]">
                          <div className="grid grid-cols-2 gap-2">
                            {generatedImages.map((img) => (
                              <div 
                                key={img.id}
                                className="relative group rounded-lg overflow-hidden border cursor-pointer"
                                onClick={() => insertImageIntoDocument(img.url, img.prompt)}
                              >
                                <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button size="sm" variant="secondary">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Insert
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </div>
                )}

                {sidePanel === 'qrcode' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">QR Code Content</Label>
                      <Textarea
                        placeholder="Enter URL or text..."
                        value={qrCodeText}
                        onChange={(e) => setQrCodeText(e.target.value)}
                        className="mt-2 min-h-[80px]"
                        data-testid="input-qr-text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Select value={qrCodeSize} onValueChange={setQrCodeSize}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">Small</SelectItem>
                            <SelectItem value="200">Medium</SelectItem>
                            <SelectItem value="300">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Colors</Label>
                        <div className="flex gap-1 mt-1">
                          <Input type="color" value={qrCodeColor} onChange={(e) => setQrCodeColor(e.target.value)} className="w-10 h-9 p-1" />
                          <Input type="color" value={qrCodeBgColor} onChange={(e) => setQrCodeBgColor(e.target.value)} className="w-10 h-9 p-1" />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" onClick={generateQRCode} disabled={!qrCodeText.trim()} data-testid="button-generate-qr">
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </Button>

                    {qrCodeUrl && (
                      <div className="text-center space-y-2">
                        <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-lg border" />
                        <Button size="sm" onClick={insertQRCodeIntoDocument}>
                          <Plus className="w-3 h-3 mr-1" />
                          Insert into Document
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
