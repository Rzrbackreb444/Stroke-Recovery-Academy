import { useState, useRef, useCallback, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  GripVertical,
  FileText,
  Image,
  Users,
  Globe,
  Lightbulb,
  Search,
  Sparkles,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  Copy,
  ExternalLink,
  Edit,
  Save,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DocumentType = 
  | 'note' 
  | 'chapter' 
  | 'character' 
  | 'research' 
  | 'image' 
  | 'draft'
  | 'outline'
  | 'worldbuilding';

export interface DocumentWindowProps {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  isMinimized?: boolean;
  isPinned?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  wordCount?: number;
  lastModified?: Date;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize?: (id: string) => void;
  onPin?: (id: string) => void;
  onContentChange?: (id: string, content: string) => void;
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onFocus?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onInsertToManuscript?: (id: string, content: string) => void;
}

const TYPE_CONFIG: Record<DocumentType, { icon: typeof FileText; label: string; color: string }> = {
  note: { icon: Lightbulb, label: 'Note', color: 'text-yellow-500' },
  chapter: { icon: FileText, label: 'Chapter', color: 'text-blue-500' },
  character: { icon: Users, label: 'Character', color: 'text-[#C9941A]' },
  research: { icon: Search, label: 'Research', color: 'text-[#C9941A]' },
  image: { icon: Image, label: 'Image', color: 'text-amber-500' },
  draft: { icon: Edit, label: 'Draft', color: 'text-orange-500' },
  outline: { icon: FileText, label: 'Outline', color: 'text-cyan-500' },
  worldbuilding: { icon: Globe, label: 'World', color: 'text-emerald-500' },
};

export default function DocumentWindow({
  id,
  title,
  type,
  content,
  isMinimized = false,
  isPinned = false,
  position = { x: 100, y: 100 },
  size = { width: 400, height: 300 },
  zIndex = 10,
  wordCount,
  lastModified,
  onClose,
  onMinimize,
  onMaximize,
  onPin,
  onContentChange,
  onPositionChange,
  onFocus,
  onDuplicate,
  onDelete,
  onInsertToManuscript,
}: DocumentWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const config = TYPE_CONFIG[type];
  const TypeIcon = config.icon;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input')) return;
    
    setIsDragging(true);
    onFocus?.(id);
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, [id, onFocus]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isMaximized) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    onPositionChange?.(id, { x: Math.max(0, newX), y: Math.max(0, newY) });
  }, [isDragging, isMaximized, id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    onContentChange?.(id, editContent);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsSaving(false);
    setIsEditing(false);
  }, [id, editContent, onContentChange]);

  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized);
    onMaximize?.(id);
  }, [isMaximized, id, onMaximize]);

  const calculatedWordCount = wordCount ?? content.split(/\s+/).filter(w => w.length > 0).length;

  if (isMinimized) {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border rounded-lg shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => onMinimize(id)}
        data-testid={`minimized-doc-${id}`}
      >
        <TypeIcon className={cn("w-3.5 h-3.5", config.color)} />
        <span className="text-xs font-medium truncate max-w-[120px]">{title}</span>
        <Badge variant="outline" className="text-[9px] px-1 py-0">
          {config.label}
        </Badge>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        "absolute bg-card border rounded-lg shadow-xl overflow-hidden flex flex-col",
        "transition-shadow duration-200",
        isDragging && "shadow-2xl cursor-grabbing",
        isPinned && "ring-2 ring-primary/50"
      )}
      style={{
        left: isMaximized ? 0 : position.x,
        top: isMaximized ? 0 : position.y,
        width: isMaximized ? '100%' : size.width,
        height: isMaximized ? '100%' : size.height,
        zIndex: isMaximized ? 1000 : zIndex,
      }}
      onMouseDown={handleMouseDown}
      data-testid={`document-window-${id}`}
    >
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b bg-muted/30",
          "cursor-grab active:cursor-grabbing select-none"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
          <TypeIcon className={cn("w-4 h-4 shrink-0", config.color)} />
          <span className="font-medium text-sm truncate">{title}</span>
          {isPinned && <Pin className="w-3 h-3 text-primary" />}
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                aria-label="Document options"
                data-testid={`button-document-options-${id}`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPin?.(id)}>
                {isPinned ? <PinOff className="w-3.5 h-3.5 mr-2" /> : <Pin className="w-3.5 h-3.5 mr-2" />}
                {isPinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(id)}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {onInsertToManuscript && (
                <DropdownMenuItem onClick={() => onInsertToManuscript(id, content)}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Insert to Manuscript
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMinimize(id)}
            data-testid={`minimize-${id}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleMaximize}
            data-testid={`maximize-${id}`}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onClose(id)}
            data-testid={`close-${id}`}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {type === 'image' ? (
            <div className="flex items-center justify-center h-full">
              <img 
                src={content} 
                alt={title}
                className="max-w-full max-h-[200px] object-contain rounded-lg"
                draggable
              />
            </div>
          ) : isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[150px] resize-none text-sm"
              autoFocus
              data-testid={`edit-textarea-${id}`}
            />
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap"
              onDoubleClick={() => setIsEditing(true)}
            >
              {content || <span className="text-muted-foreground italic">Empty document. Double-click to edit.</span>}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {config.label}
          </Badge>
          <span>{calculatedWordCount} words</span>
        </div>
        
        <div className="flex items-center gap-2">
          {lastModified && (
            <span>Edited {lastModified.toLocaleTimeString()}</span>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
