import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Folder,
  Users,
  Globe,
  BookOpen,
  Lightbulb,
  Search,
  Image,
  Plus,
  MoreHorizontal,
  FileEdit,
  Pencil,
  Package,
  Settings,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type NavigatorSection = 
  | 'manuscript'
  | 'characters'
  | 'world-building'
  | 'research'
  | 'editing'
  | 'marketing';

export type NavigatorItem = {
  id: string;
  type: 'folder' | 'document' | 'chapter' | 'character' | 'note' | 'image';
  title: string;
  section: NavigatorSection;
  parentId?: string;
  chapterIndex?: number;
  content?: string;
  icon?: typeof FileText;
  status?: 'draft' | 'complete' | 'reviewing';
};

interface FolderNode {
  id: NavigatorSection;
  label: string;
  icon: typeof Folder;
  openIcon: typeof FolderOpen;
  color: string;
  items: NavigatorItem[];
}

interface RiverNavigatorProps {
  selectedItem: NavigatorItem | null;
  onSelectItem: (item: NavigatorItem | null) => void;
  onCreateItem?: (section: NavigatorSection, type: NavigatorItem['type']) => void;
}

export default function RiverNavigator({
  selectedItem,
  onSelectItem,
  onCreateItem,
}: RiverNavigatorProps) {
  const { bookOutline, brainstormIdeas, images } = useBookStudio();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['manuscript', 'characters', 'research', 'world-building'])
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const manuscriptItems: NavigatorItem[] = bookOutline?.chapters?.map((chapter, index) => ({
    id: `chapter-${index}`,
    type: 'chapter' as const,
    title: chapter.title || `Chapter ${index + 1}`,
    section: 'manuscript' as const,
    chapterIndex: index,
    status: chapter.status === 'complete' ? 'complete' : 'draft',
    icon: chapter.status === 'complete' ? FileEdit : FileText,
  })) || [];

  const characterItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'character')
    .map(idea => ({
      id: `char-${idea.id}`,
      type: 'character' as const,
      title: idea.content.split('\n')[0].slice(0, 40) || 'Unnamed Character',
      section: 'characters' as const,
      content: idea.content,
    }));

  const worldBuildingItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'setting')
    .map(idea => ({
      id: `world-${idea.id}`,
      type: 'note' as const,
      title: idea.content.split('\n')[0].slice(0, 40) || 'Setting',
      section: 'world-building' as const,
      content: idea.content,
    }));

  const researchItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'note' || idea.type === 'goal' || idea.type === 'plot' || idea.type === 'theme')
    .map(idea => ({
      id: `research-${idea.id}`,
      type: 'note' as const,
      title: idea.content.split('\n')[0].slice(0, 40) || 'Research Note',
      section: 'research' as const,
      content: idea.content,
    }));

  const folders: FolderNode[] = [
    {
      id: 'characters',
      label: 'Characters & World-Building',
      icon: Users,
      openIcon: Users,
      color: 'text-[#C9941A]',
      items: [...characterItems, ...worldBuildingItems],
    },
    {
      id: 'editing',
      label: 'Editing & Revisions',
      icon: Pencil,
      openIcon: Pencil,
      color: 'text-amber-500',
      items: [],
    },
    {
      id: 'manuscript',
      label: 'Manuscript',
      icon: BookOpen,
      openIcon: BookOpen,
      color: 'text-blue-500',
      items: manuscriptItems,
    },
    {
      id: 'marketing',
      label: 'Marketing & Publishing',
      icon: Package,
      openIcon: Package,
      color: 'text-[#C9941A]',
      items: [],
    },
    {
      id: 'research',
      label: 'Research',
      icon: Search,
      openIcon: Search,
      color: 'text-cyan-500',
      items: researchItems,
    },
  ];

  const filteredFolders = searchQuery
    ? folders.map(folder => ({
        ...folder,
        items: folder.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(folder => folder.items.length > 0 || folder.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders;

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#1a1a1a]/50 border-r border-zinc-200 dark:border-[#333]">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-[#333]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Files
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                aria-label="File options"
                data-testid="button-file-options"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                New Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-white dark:bg-[#1a1a1a] border-zinc-200 dark:border-[#333]"
            data-testid="input-search-navigator"
          />
        </div>
      </div>

      {/* Tree View */}
      <ScrollArea className="flex-1">
        <div className="p-1.5">
          {filteredFolders.map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            const FolderIcon = folder.icon;
            
            return (
              <Collapsible
                key={folder.id}
                open={isExpanded}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <div className="group">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-1.5 h-7 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-[#1a1a1a]"
                      data-testid={`folder-${folder.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      )}
                      <FolderIcon className={cn("w-4 h-4 shrink-0", folder.color)} />
                      <span className="truncate">{folder.label}</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="ml-3 pl-3 border-l border-zinc-200 dark:border-[#333] space-y-0.5 py-0.5">
                    {folder.items.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 px-2 py-1.5 italic">
                        No items
                      </p>
                    ) : (
                      folder.items.map((item) => {
                        const isSelected = selectedItem?.id === item.id;
                        const ItemIcon = item.icon || FileText;
                        
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start gap-2 h-7 px-2 text-xs",
                              isSelected
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#1a1a1a]"
                            )}
                            onClick={() => onSelectItem(item)}
                            data-testid={`item-${item.id}`}
                          >
                            <ItemIcon className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              isSelected ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"
                            )} />
                            <span className="truncate">{item.title}</span>
                            {item.status === 'complete' && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C9941A] shrink-0" />
                            )}
                          </Button>
                        );
                      })
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-zinc-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
        <div className="text-[10px] text-zinc-500 space-y-0.5">
          <div className="flex justify-between">
            <span>Total chapters</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{manuscriptItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Characters</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{characterItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Research notes</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{researchItems.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
