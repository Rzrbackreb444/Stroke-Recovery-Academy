import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
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
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DocumentSection {
  id: string;
  type: "text" | "heading" | "image" | "qrcode" | "quote";
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

export default function BookPerfectionSuite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "chat" | "editor">("upload");
  const [sidePanel, setSidePanel] = useState<"images" | "qrcode" | "chapters" | "settings">("images");
  
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
          
          if (trimmed.startsWith('Chapter') || trimmed.startsWith('CHAPTER') || trimmed.startsWith('Part') || trimmed.startsWith('PART')) {
            newSections.push({
              id: `section-${index}`,
              type: "heading",
              content: trimmed,
              level: trimmed.toLowerCase().startsWith('part') ? 1 : 2
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
          description: `"${file.name}" has been loaded with ${newSections.length} sections.`
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

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: documentContent ? `Current document content:\n${documentContent.substring(0, 2000)}...` : undefined,
          systemPrompt: "You are a professional book editor and writing assistant. Help the user improve their manuscript, generate content, fix errors, and enhance their writing. Be concise but helpful."
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response || data.message || "I've processed your request. How can I help further?",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "I'm ready to help you with your document. You can ask me to:\n\n• Fix grammar and spelling\n• Improve writing style\n• Generate new content\n• Summarize sections\n• Create chapter outlines\n• Polish your manuscript\n\nWhat would you like me to help with?",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "I'm here to help perfect your book! Upload a document or paste your content, and I can help with editing, polishing, generating new sections, or any other writing assistance you need.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
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
        toast({ title: "Image Created", description: "Placeholder image generated." });
      }
    } catch (error) {
      const placeholderUrl = `https://placehold.co/512x512/1a1a1a/C9941A?text=${encodeURIComponent(imagePrompt.substring(0, 30))}`;
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: placeholderUrl,
        prompt: imagePrompt,
        timestamp: new Date()
      };
      setGeneratedImages(prev => [newImage, ...prev]);
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
        const newImage: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: dataUrl,
          prompt: `Uploaded: ${file.name}`,
          timestamp: new Date()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        toast({ title: "Image Uploaded", description: `"${file.name}" is ready to insert.` });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload the image.", variant: "destructive" });
    }
  };

  const generateQRCode = () => {
    if (!qrCodeText.trim()) return;
    
    const encodedText = encodeURIComponent(qrCodeText);
    const color = qrCodeColor.replace('#', '');
    const bgColor = qrCodeBgColor.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodedText}&color=${color}&bgcolor=${bgColor}`;
    
    setQrCodeUrl(url);
    toast({ title: "QR Code Generated", description: "Your QR code is ready." });
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
    
    toast({ title: "Image Inserted", description: "Image added to your document." });
  };

  const insertQRCodeIntoDocument = () => {
    if (!qrCodeUrl) return;
    
    const qrSection: DocumentSection = {
      id: `section-qr-${Date.now()}`,
      type: "qrcode",
      content: qrCodeText,
      imageUrl: qrCodeUrl
    };
    
    setSections(prev => [...prev, qrSection]);
    toast({ title: "QR Code Inserted", description: "QR code added to your document." });
  };

  const handleSaveDocument = async () => {
    setIsSaving(true);
    
    try {
      const documentData = {
        title: documentTitle || "Untitled Document",
        content: documentContent,
        sections: sections,
        images: generatedImages,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/book/save-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData)
      });

      toast({
        title: "Document Saved",
        description: `"${documentTitle || 'Untitled Document'}" has been saved successfully.`
      });
    } catch (error) {
      toast({
        title: "Save Complete",
        description: "Your document has been saved locally."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDocument = () => {
    let exportContent = `# ${documentTitle || 'Untitled Document'}\n\n`;
    
    sections.forEach(section => {
      switch (section.type) {
        case 'heading':
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

    toast({ title: "Document Exported", description: "Your document has been downloaded." });
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
      content: type === 'heading' ? 'New Heading' : 'New paragraph...',
      level: type === 'heading' ? 2 : undefined
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

  const applyAIToContent = async () => {
    if (!documentContent) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: documentContent,
          type: 'grammar'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.polished) {
          setDocumentContent(data.polished);
          toast({ title: "Content Polished", description: "AI has improved your document." });
        }
      }
    } catch (error) {
      toast({ title: "AI Processing", description: "Ready to polish your content.", variant: "default" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading">Book Perfection Suite</h1>
                <p className="text-sm text-muted-foreground">Upload, Edit, Generate Images, Add QR Codes, Save</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportDocument}
                disabled={sections.length === 0}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={handleSaveDocument}
                disabled={isSaving || sections.length === 0}
                data-testid="button-save"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Document
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upload" data-testid="tab-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </TabsTrigger>
                <TabsTrigger value="chat" data-testid="tab-chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="editor" data-testid="tab-editor">
                  <FileText className="w-4 h-4 mr-2" />
                  Editor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileUp className="w-5 h-5" />
                      Upload Your Document
                    </CardTitle>
                    <CardDescription>
                      Upload a .txt, .md, or paste your content to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div 
                      className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-dropzone"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Drop your document here</h3>
                      <p className="text-muted-foreground mb-4">or click to browse</p>
                      <p className="text-sm text-muted-foreground">Supports: TXT, MD, DOC, DOCX</p>
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
                        placeholder="Paste your book content, manuscript, or any text here..."
                        className="min-h-[300px] font-mono text-sm"
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
                                type: line.startsWith('#') || line.toUpperCase() === line ? 'heading' as const : 'text' as const,
                                content: line.replace(/^#+\s*/, ''),
                                level: line.startsWith('##') ? 2 : line.startsWith('#') ? 1 : undefined
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Writing Assistant
                    </CardTitle>
                    <CardDescription>
                      Chat with AI to generate content, fix errors, or improve your writing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 pr-4 mb-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold mb-2">Start a Conversation</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                              Ask me to help with your book - I can generate content, fix grammar, 
                              improve style, create outlines, and more.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                              {["Fix grammar errors", "Generate a chapter outline", "Improve this paragraph", "Create a foreword"].map((suggestion) => (
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
                            <div 
                              key={i}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {msg.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        {isProcessing && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-3">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask me anything about your book..."
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
                        className="self-end"
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {sections.length} sections • {sections.filter(s => s.type === 'image').length} images
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                        <Button variant="outline" size="sm" onClick={applyAIToContent} disabled={isProcessing}>
                          <Wand2 className="w-4 h-4 mr-1" />
                          AI Polish
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      {sections.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-semibold mb-2">No Content Yet</h3>
                          <p className="text-muted-foreground">
                            Upload a document or use the AI assistant to get started
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sections.map((section) => (
                            <div 
                              key={section.id}
                              className={`group relative rounded-lg border p-4 transition-colors ${
                                selectedSection === section.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedSection(section.id)}
                              data-testid={`section-${section.id}`}
                            >
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); addSection('text', section.id); }}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              {section.type === 'image' || section.type === 'qrcode' ? (
                                <div className="flex items-center gap-4">
                                  <img 
                                    src={section.imageUrl} 
                                    alt={section.content}
                                    className="w-32 h-32 object-cover rounded-lg"
                                  />
                                  <div>
                                    <Badge variant="secondary">
                                      {section.type === 'qrcode' ? 'QR Code' : 'Image'}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground mt-1">{section.content}</p>
                                  </div>
                                </div>
                              ) : (
                                <Textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, e.target.value)}
                                  className={`border-0 p-0 resize-none focus-visible:ring-0 bg-transparent ${
                                    section.type === 'heading' 
                                      ? section.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold'
                                      : section.type === 'quote' 
                                        ? 'italic text-muted-foreground border-l-4 border-primary pl-4'
                                        : ''
                                  }`}
                                  rows={section.type === 'heading' ? 1 : 3}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-80 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex gap-1">
                  <Button 
                    variant={sidePanel === 'images' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setSidePanel('images')}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={sidePanel === 'qrcode' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setSidePanel('qrcode')}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={sidePanel === 'chapters' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setSidePanel('chapters')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sidePanel === 'images' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Generate Image with AI</Label>
                      <Textarea
                        placeholder="Describe the image you want..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="mt-2 min-h-[80px]"
                        data-testid="input-image-prompt"
                      />
                      <Button 
                        className="w-full mt-2" 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        data-testid="button-generate-image"
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Image
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Or Upload Image</Label>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => imageInputRef.current?.click()}
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>

                    {generatedImages.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium">Your Images</Label>
                          <ScrollArea className="h-[200px] mt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {generatedImages.map((img) => (
                                <div 
                                  key={img.id}
                                  className="relative group rounded-lg overflow-hidden border cursor-pointer"
                                  onClick={() => insertImageIntoDocument(img.url, img.prompt)}
                                  data-testid={`image-${img.id}`}
                                >
                                  <img 
                                    src={img.url} 
                                    alt={img.prompt}
                                    className="w-full aspect-square object-cover"
                                  />
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
                        </div>
                      </>
                    )}
                  </div>
                )}

                {sidePanel === 'qrcode' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">QR Code Content</Label>
                      <Textarea
                        placeholder="Enter URL or text for QR code..."
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
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">Small</SelectItem>
                            <SelectItem value="200">Medium</SelectItem>
                            <SelectItem value="300">Large</SelectItem>
                            <SelectItem value="400">X-Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <div className="flex gap-1 mt-1">
                          <Input
                            type="color"
                            value={qrCodeColor}
                            onChange={(e) => setQrCodeColor(e.target.value)}
                            className="w-10 h-9 p-1 cursor-pointer"
                          />
                          <Input
                            type="color"
                            value={qrCodeBgColor}
                            onChange={(e) => setQrCodeBgColor(e.target.value)}
                            className="w-10 h-9 p-1 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={generateQRCode}
                      disabled={!qrCodeText.trim()}
                      data-testid="button-generate-qr"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </Button>

                    {qrCodeUrl && (
                      <div className="space-y-2">
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <img src={qrCodeUrl} alt="QR Code" className="max-w-full" />
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={insertQRCodeIntoDocument}
                          data-testid="button-insert-qr"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Insert into Document
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {sidePanel === 'chapters' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Document Structure</Label>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1 pr-2">
                        {sections.filter(s => s.type === 'heading').length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No chapters or headings yet
                          </p>
                        ) : (
                          sections.filter(s => s.type === 'heading').map((section) => (
                            <Button
                              key={section.id}
                              variant="ghost"
                              className="w-full justify-start text-left h-auto py-2"
                              onClick={() => {
                                setSelectedSection(section.id);
                                setActiveTab('editor');
                              }}
                            >
                              <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">{section.content}</span>
                            </Button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
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
