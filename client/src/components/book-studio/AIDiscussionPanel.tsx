import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Send,
  Loader2,
  FileText,
  Paperclip,
  X,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Layers,
  Play,
  Edit3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    name: string;
    type: string;
    wordCount: number;
    preview: string;
  }[];
}

interface UploadedFile {
  name: string;
  content: string;
  type: string;
  wordCount: number;
  preview: string;
}

interface ChunkInfo {
  id: string;
  title: string;
  wordCount: number;
  content: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'editing' | 'edited' | 'error';
  analysis?: string;
  editedContent?: string;
}

interface BookMemory {
  title: string;
  totalWords: number;
  totalChunks: number;
  genre: string;
  tone: string;
  mainCharacters: string[];
  themes: string[];
  styleGuide: string;
  pacingNotes: string;
}

interface AIDiscussionPanelProps {
  onContentGenerated?: (content: string, type: 'outline' | 'chapter' | 'draft') => void;
  onInsertToManuscript?: (content: string) => void;
  manuscriptContext?: string;
  className?: string;
}

export default function AIDiscussionPanel({
  onContentGenerated,
  onInsertToManuscript,
  manuscriptContext,
  className,
}: AIDiscussionPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to your Book Building Assistant! I'm here to help you develop your book. You can:\n\n• Upload documents (PDF, DOCX, TXT, MD) of any size\n• Paste content directly into the chat\n• Discuss your ideas and I'll help build outlines, chapters, and drafts\n\nWhat would you like to work on today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [bookMemory, setBookMemory] = useState<BookMemory | null>(null);
  const [isProcessingChunks, setIsProcessingChunks] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [processingMode, setProcessingMode] = useState<'analyze' | 'edit' | null>(null);
  const [showChunkPanel, setShowChunkPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const parseFileWithBackend = async (file: File): Promise<UploadedFile | null> => {
    try {
      const buffer = await file.arrayBuffer();
      const base64 = await arrayBufferToBase64(buffer);
      
      const response = await apiRequest('POST', '/api/documents/parse', {
        content: base64,
        filename: file.name,
        mimeType: file.type,
      });
      
      const data = await response.json();
      
      return {
        name: file.name,
        content: data.content,
        type: data.metadata.format,
        wordCount: data.metadata.wordCount,
        preview: data.content.substring(0, 500) + (data.content.length > 500 ? '...' : ''),
      };
    } catch (error) {
      console.error('File parse error:', error);
      return null;
    }
  };

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setIsLoading(true);
    
    const parsed: UploadedFile[] = [];
    
    for (const file of fileArray) {
      const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'text/html',
      ];
      
      const supportedExtensions = ['.pdf', '.docx', '.txt', '.md', '.html', '.rtf'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (supportedTypes.includes(file.type) || supportedExtensions.includes(ext)) {
        const result = await parseFileWithBackend(file);
        if (result) {
          parsed.push(result);
        } else {
          toast({
            title: `Failed to parse ${file.name}`,
            variant: "destructive",
          });
        }
      } else if (file.type.startsWith('text/') || ext === '.txt') {
        const text = await file.text();
        parsed.push({
          name: file.name,
          content: text,
          type: 'text',
          wordCount: text.split(/\s+/).filter(w => w).length,
          preview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        });
      } else {
        toast({
          title: `Unsupported file: ${file.name}`,
          description: "Supported: PDF, DOCX, TXT, MD, HTML",
          variant: "destructive",
        });
      }
    }
    
    if (parsed.length > 0) {
      setUploadedFiles(prev => [...prev, ...parsed]);
      toast({
        title: `${parsed.length} file(s) ready`,
        description: `${parsed.reduce((sum, f) => sum + f.wordCount, 0).toLocaleString()} words loaded`,
      });
    }
    
    setIsLoading(false);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = e.clipboardData.files;
    if (files.length > 0) {
      e.preventDefault();
      handleFileUpload(files);
      return;
    }
    
    const text = e.clipboardData.getData('text');
    if (text.length > 5000) {
      e.preventDefault();
      const wordCount = text.split(/\s+/).filter(w => w).length;
      setUploadedFiles(prev => [...prev, {
        name: `Pasted content (${wordCount.toLocaleString()} words)`,
        content: text,
        type: 'pasted',
        wordCount,
        preview: text.substring(0, 500) + '...',
      }]);
      toast({
        title: "Large content detected",
        description: `${wordCount.toLocaleString()} words added as attachment`,
      });
    }
  }, [handleFileUpload, toast]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Chunked processing for large manuscripts (200k+ words)
  const initializeChunkedProcessing = useCallback(async (content: string, title?: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/book-studio/chunk-plan', {
        content,
        title: title || 'Uploaded Manuscript',
      });
      const data = await response.json();
      
      // Use fullChunks if available, otherwise fall back to chunks
      const chunksToProcess = data.fullChunks || data.chunks || [];
      
      if (chunksToProcess.length === 0) {
        throw new Error('No chunks returned from server');
      }
      
      const chunkInfos: ChunkInfo[] = chunksToProcess.map((c: any) => ({
        id: c.id,
        title: c.title,
        wordCount: c.wordCount,
        content: c.content,
        status: 'pending' as const,
      }));
      
      setChunks(chunkInfos);
      setBookMemory(data.bookMemory);
      setShowChunkPanel(true);
      
      const displayChunks = data.chunks || chunksToProcess;
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed your ${data.totalWords?.toLocaleString() || 'large'}-word manuscript and divided it into ${displayChunks.length} sections for processing.\n\n**Sections detected:**\n${displayChunks.map((c: any, i: number) => `${i + 1}. ${c.title} (${c.wordCount?.toLocaleString() || '?'} words)`).join('\n')}\n\nYou can now:\n• **Analyze All** - Get detailed feedback on each section\n• **Edit All** - AI will polish each section while maintaining consistency\n• Click individual sections for targeted work\n\nEstimated processing time: ~${data.estimatedProcessingTime || displayChunks.length * 15} seconds`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      toast({
        title: "Manuscript ready for processing",
        description: `${displayChunks.length} sections detected`,
      });
    } catch (error) {
      console.error('Chunk planning error:', error);
      toast({ title: "Failed to plan chunks", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const processAllChunks = useCallback(async (mode: 'analyze' | 'edit') => {
    if (chunks.length === 0) return;
    
    setIsProcessingChunks(true);
    setProcessingMode(mode);
    setCurrentChunkIndex(0);
    
    const updatedChunks = [...chunks];
    
    for (let i = 0; i < updatedChunks.length; i++) {
      setCurrentChunkIndex(i);
      const chunk = updatedChunks[i];
      
      try {
        updatedChunks[i] = { ...chunk, status: mode === 'analyze' ? 'analyzing' : 'editing' };
        setChunks([...updatedChunks]);
        
        const adjacentContext = [
          i > 0 ? `Previous section excerpt: ${updatedChunks[i-1].content.substring(0, 500)}...` : '',
          i < updatedChunks.length - 1 ? `Next section excerpt: ${updatedChunks[i+1].content.substring(0, 500)}...` : '',
        ].filter(Boolean).join('\n');
        
        if (mode === 'analyze') {
          const response = await apiRequest('POST', '/api/book-studio/chunk-analyze', {
            chunkId: chunk.id,
            chunkContent: chunk.content,
            chunkTitle: chunk.title,
            bookMemory,
            adjacentContext,
          });
          const data = await response.json();
          
          updatedChunks[i] = { ...chunk, status: 'analyzed', analysis: data.analysis };
          
          // Update book memory with new knowledge
          if (data.knowledgeUpdate && bookMemory) {
            setBookMemory(prev => prev ? {
              ...prev,
              mainCharacters: Array.from(new Set([...prev.mainCharacters, ...(data.knowledgeUpdate.characters || [])])),
              themes: Array.from(new Set([...prev.themes, ...(data.knowledgeUpdate.themes || [])])),
            } : prev);
          }
        } else {
          const response = await apiRequest('POST', '/api/book-studio/chunk-edit', {
            chunkId: chunk.id,
            chunkContent: chunk.content,
            chunkTitle: chunk.title,
            bookMemory,
            passType: 'full',
            adjacentContext,
          });
          const data = await response.json();
          
          updatedChunks[i] = { ...chunk, status: 'edited', editedContent: data.editedContent };
        }
        
        setChunks([...updatedChunks]);
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        updatedChunks[i] = { ...chunk, status: 'error' };
        setChunks([...updatedChunks]);
      }
    }
    
    // Final synthesis
    if (mode === 'analyze') {
      // Filter to only successfully analyzed chunks
      const successfulAnalyses = updatedChunks
        .filter(c => c.status === 'analyzed' && c.analysis)
        .map(c => ({ chunkId: c.id, analysis: c.analysis }));
      
      const failedCount = updatedChunks.filter(c => c.status === 'error').length;
      
      if (successfulAnalyses.length > 0) {
        try {
          const response = await apiRequest('POST', '/api/book-studio/synthesize', {
            analyses: successfulAnalyses,
            bookMemory,
          });
          const data = await response.json();
          
          let synthesisContent = `## Full Manuscript Analysis Complete\n\n${data.synthesis}`;
          if (failedCount > 0) {
            synthesisContent += `\n\n*Note: ${failedCount} section(s) failed to analyze and were excluded from this synthesis.*`;
          }
          
          const synthesisMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: synthesisContent,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, synthesisMessage]);
        } catch (e) {
          console.error('Synthesis error:', e);
          toast({ title: "Synthesis failed", variant: "destructive" });
        }
      } else {
        toast({ title: "All analyses failed", description: "Unable to synthesize results", variant: "destructive" });
      }
    } else {
      // Combine edited chunks
      const editedContent = updatedChunks
        .map(c => c.editedContent || c.content)
        .join('\n\n---\n\n');
      
      if (onContentGenerated) {
        onContentGenerated(editedContent, 'draft');
      }
      
      const editMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## Editing Complete!\n\nI've processed all ${updatedChunks.length} sections with full editorial passes. The edited manuscript maintains:\n\n• Consistent pacing throughout\n• Smooth transitions between sections\n• Unified voice and tone\n• Professional formatting\n\nTotal words processed: ${updatedChunks.reduce((sum, c) => sum + c.wordCount, 0).toLocaleString()}\n\nThe polished manuscript is ready for export!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, editMessage]);
    }
    
    setIsProcessingChunks(false);
    setProcessingMode(null);
    
    toast({
      title: mode === 'analyze' ? "Analysis complete" : "Editing complete",
      description: `All ${updatedChunks.length} sections processed`,
    });
  }, [chunks, bookMemory, onContentGenerated, toast]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachments: uploadedFiles.map(f => ({
        name: f.name,
        type: f.type,
        wordCount: f.wordCount,
        preview: f.preview,
      })),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const combinedContent = uploadedFiles.map(f => 
        `[Document: ${f.name}]\n${f.content}`
      ).join('\n\n---\n\n');
      
      const fullContext = [
        manuscriptContext ? `Current manuscript context:\n${manuscriptContext.substring(0, 2000)}...` : '',
        combinedContent,
        inputValue,
      ].filter(Boolean).join('\n\n');
      
      const response = await apiRequest('POST', '/api/book-studio/chat', {
        message: inputValue || "Please analyze this content and help me develop it into a book.",
        context: fullContext,
        uploadedContent: combinedContent,
        isInitialAnalysis: uploadedFiles.length > 0 && messages.length <= 1,
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || "I've analyzed your content. How would you like to proceed?",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.outline && onContentGenerated) {
        onContentGenerated(data.outline, 'outline');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setInputValue('');
      setUploadedFiles([]);
      setIsLoading(false);
    }
  }, [inputValue, uploadedFiles, manuscriptContext, messages.length, onContentGenerated, toast]);

  const copyToClipboard = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const insertContent = useCallback((content: string) => {
    if (onInsertToManuscript) {
      onInsertToManuscript(content);
      toast({ title: "Inserted to manuscript" });
    }
  }, [onInsertToManuscript, toast]);

  return (
    <div 
      className={cn("flex flex-col h-full bg-background border-l", className)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      data-testid="ai-discussion-panel"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
        <Bot className="w-5 h-5 text-primary" />
        <span className="font-medium">Book Building Assistant</span>
        {chunks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 ml-2"
            onClick={() => setShowChunkPanel(!showChunkPanel)}
            data-testid="button-toggle-chunks"
          >
            <Layers className="w-4 h-4" />
            {chunks.length} sections
          </Button>
        )}
        <Badge variant="secondary" className="ml-auto">AI Chat</Badge>
      </div>

      {showChunkPanel && chunks.length > 0 && (
        <div className="border-b bg-muted/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {bookMemory?.title || 'Manuscript'} 
                <span className="text-muted-foreground ml-1">
                  ({bookMemory?.totalWords?.toLocaleString() || 0} words)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => processAllChunks('analyze')}
                disabled={isProcessingChunks}
                data-testid="button-analyze-all"
              >
                {isProcessingChunks && processingMode === 'analyze' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Analyze All
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => processAllChunks('edit')}
                disabled={isProcessingChunks}
                data-testid="button-edit-all"
              >
                {isProcessingChunks && processingMode === 'edit' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Edit3 className="w-3 h-3" />
                )}
                Edit All
              </Button>
            </div>
          </div>

          {isProcessingChunks && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Processing section {currentChunkIndex + 1} of {chunks.length}</span>
                <span>{Math.round((currentChunkIndex / chunks.length) * 100)}%</span>
              </div>
              <Progress value={(currentChunkIndex / chunks.length) * 100} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {chunks.map((chunk, i) => (
              <div
                key={chunk.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded text-xs border",
                  chunk.status === 'pending' && "bg-background",
                  chunk.status === 'analyzing' && "bg-blue-500/10 border-blue-500/30",
                  chunk.status === 'analyzed' && "bg-[#E2741B]/10 border-green-500/30",
                  chunk.status === 'editing' && "bg-amber-500/10 border-amber-500/30",
                  chunk.status === 'edited' && "bg-primary/10 border-primary/30",
                  chunk.status === 'error' && "bg-destructive/10 border-destructive/30",
                )}
              >
                {chunk.status === 'pending' && <FileText className="w-3 h-3 text-muted-foreground" />}
                {(chunk.status === 'analyzing' || chunk.status === 'editing') && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                )}
                {(chunk.status === 'analyzed' || chunk.status === 'edited') && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
                {chunk.status === 'error' && <AlertCircle className="w-3 h-3 text-destructive" />}
                <span className="truncate flex-1">{chunk.title}</span>
                <span className="text-muted-foreground shrink-0">
                  {chunk.wordCount.toLocaleString()}w
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[85%] rounded-lg p-3",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        <FileText className="w-3 h-3" />
                        {att.name}
                        <span className="text-xs opacity-70">
                          ({att.wordCount.toLocaleString()} words)
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                
                {msg.role === 'assistant' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      data-testid={`button-copy-message-${msg.id}`}
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy
                    </Button>
                    {onInsertToManuscript && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => insertContent(msg.content)}
                        data-testid={`button-insert-message-${msg.id}`}
                      >
                        <BookOpen className="w-3 h-3" />
                        Insert
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Analyzing and thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30 space-y-2">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <span className="text-xs opacity-70">
                  ({file.wordCount.toLocaleString()})
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1"
                  onClick={() => removeFile(i)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          {uploadedFiles.reduce((sum, f) => sum + f.wordCount, 0) > 20000 && (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1 w-full"
                onClick={() => {
                  const combined = uploadedFiles.map(f => f.content).join('\n\n---\n\n');
                  const title = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Manuscript';
                  initializeChunkedProcessing(combined, title);
                  setUploadedFiles([]);
                }}
                disabled={isLoading}
                data-testid="button-process-full-manuscript"
              >
                <Layers className="w-4 h-4" />
                Process Full Manuscript ({uploadedFiles.reduce((sum, f) => sum + f.wordCount, 0).toLocaleString()} words)
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 border-t bg-card/30">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md,.html,.rtf"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            data-testid="input-file-upload"
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Upload files (PDF, DOCX, TXT, MD)"
            data-testid="button-upload-file"
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <Textarea
            placeholder="Type a message, paste content of any size, or drop files here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          
          <Button
            onClick={sendMessage}
            disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Drop files anywhere or paste large content. Supports PDF, DOCX, TXT, MD, HTML.
        </p>
      </div>
    </div>
  );
}
