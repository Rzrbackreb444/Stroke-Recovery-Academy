import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
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
        <Badge variant="secondary" className="ml-auto">AI Chat</Badge>
      </div>
      
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
        <div className="px-4 py-2 border-t bg-muted/30">
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
