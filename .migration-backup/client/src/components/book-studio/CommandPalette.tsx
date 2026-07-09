import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Plus,
  Sparkles,
  Image,
  Users,
  Globe,
  Lightbulb,
  Rocket,
  BookOpen,
  Wand2,
  Upload,
  Download,
  Trash2,
  Copy,
  Edit,
  Eye,
  Brain,
  Merge,
  LayoutGrid,
  Command,
  ArrowRight,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: typeof FileText;
  category: 'create' | 'navigate' | 'ai' | 'file' | 'view' | 'edit';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  recentDocuments?: Array<{ id: string; title: string; type: string }>;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  create: { label: 'Create', icon: Plus },
  navigate: { label: 'Navigate', icon: ArrowRight },
  ai: { label: 'AI Actions', icon: Sparkles },
  file: { label: 'File', icon: FileText },
  view: { label: 'View', icon: Eye },
  edit: { label: 'Edit', icon: Edit },
};

export default function CommandPalette({
  isOpen,
  onClose,
  commands,
  recentDocuments = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.category.includes(lowerQuery)
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const flatList = useMemo(() => {
    const items: (CommandItem | { type: 'separator'; category: string })[] = [];
    Object.entries(groupedCommands).forEach(([category, cmds]) => {
      items.push({ type: 'separator', category });
      items.push(...cmds);
    });
    return items;
  }, [groupedCommands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatList[selectedIndex];
      if (selected && 'action' in selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatList, selectedIndex, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <VisuallyHidden>
          <DialogTitle>Command Palette</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Command className="w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground/60"
            autoFocus
            data-testid="command-input"
          />
          <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
            ESC
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {!query && recentDocuments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  <FileText className="w-3 h-3" />
                  Recent Documents
                </div>
                {recentDocuments.slice(0, 5).map((doc, i) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent/50"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{doc.title}</span>
                    <Badge variant="outline" className="text-[9px]">{doc.type}</Badge>
                  </div>
                ))}
              </div>
            )}

            {Object.entries(groupedCommands).map(([category, cmds]) => {
              const categoryConfig = CATEGORY_LABELS[category];
              const CategoryIcon = categoryConfig?.icon || FileText;
              
              return (
                <div key={category} className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    <CategoryIcon className="w-3 h-3" />
                    {categoryConfig?.label || category}
                  </div>
                  
                  {cmds.map((cmd, i) => {
                    const globalIndex = flatList.findIndex(item => 
                      'id' in item && item.id === cmd.id
                    );
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <div
                        key={cmd.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        )}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        data-testid={`command-${cmd.id}`}
                      >
                        <cmd.icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.title}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <Badge variant="outline" className="text-[9px] px-1.5 shrink-0">
                            {cmd.shortcut}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {filteredCommands.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commands found for "{query}"</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[9px]">Enter</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI-powered workspace
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
