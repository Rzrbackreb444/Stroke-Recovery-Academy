import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Sparkles,
  FileEdit,
  Pencil,
  FileCode,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NavigatorSection = 
  | 'manuscript'
  | 'characters'
  | 'world-building'
  | 'research'
  | 'notes'
  | 'images';

export type NavigatorItem = {
  id: string;
  type: 'folder' | 'document' | 'chapter' | 'character' | 'note' | 'image';
  title: string;
  section: NavigatorSection;
  parentId?: string;
  chapterIndex?: number;
  content?: string;
  icon?: typeof FileText;
};

interface FolderNode {
  id: NavigatorSection;
  label: string;
  icon: typeof Folder;
  openIcon: typeof FolderOpen;
  defaultOpen?: boolean;
  items: NavigatorItem[];
}

interface ProjectNavigatorProps {
  selectedItem: NavigatorItem | null;
  onSelectItem: (item: NavigatorItem | null) => void;
  onCreateItem?: (section: NavigatorSection, type: NavigatorItem['type']) => void;
}

export default function ProjectNavigator({
  selectedItem,
  onSelectItem,
  onCreateItem,
}: ProjectNavigatorProps) {
  const { bookOutline, brainstormIdeas, images } = useBookStudio();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['manuscript', 'characters', 'research'])
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
    .filter(idea => idea.type === 'note' || idea.type === 'goal')
    .map(idea => ({
      id: `research-${idea.id}`,
      type: 'note' as const,
      title: idea.content.split('\n')[0].slice(0, 40) || 'Research Note',
      section: 'research' as const,
      content: idea.content,
    }));

  const plotItems: NavigatorItem[] = brainstormIdeas
    .filter(idea => idea.type === 'plot' || idea.type === 'theme')
    .map(idea => ({
      id: `notes-${idea.id}`,
      type: 'note' as const,
      title: idea.content.split('\n')[0].slice(0, 40) || 'Note',
      section: 'notes' as const,
      content: idea.content,
    }));

  const imageItems: NavigatorItem[] = images.map(img => ({
    id: `img-${img.id}`,
    type: 'image' as const,
    title: img.prompt?.slice(0, 40) || 'Generated Image',
    section: 'images' as const,
  }));

  const folders: FolderNode[] = [
    {
      id: 'manuscript',
      label: 'Manuscript',
      icon: BookOpen,
      openIcon: BookOpen,
      defaultOpen: true,
      items: manuscriptItems,
    },
    {
      id: 'characters',
      label: 'Characters & Profiles',
      icon: Users,
      openIcon: Users,
      items: characterItems,
    },
    {
      id: 'world-building',
      label: 'World-Building',
      icon: Globe,
      openIcon: Globe,
      items: worldBuildingItems,
    },
    {
      id: 'research',
      label: 'Research Notes',
      icon: Search,
      openIcon: Search,
      items: researchItems,
    },
    {
      id: 'notes',
      label: 'Plot & Themes',
      icon: Lightbulb,
      openIcon: Lightbulb,
      items: plotItems,
    },
    {
      id: 'images',
      label: 'Images & Assets',
      icon: Image,
      openIcon: Image,
      items: imageItems,
    },
  ];

  const filteredFolders = searchQuery
    ? folders.map(folder => ({
        ...folder,
        items: folder.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(folder => folder.items.length > 0)
    : folders;

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-serif font-semibold text-sidebar-foreground">
            Project Files
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
            data-testid="input-search-files"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFolders.map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            const FolderIcon = isExpanded ? folder.openIcon : folder.icon;
            
            return (
              <Collapsible
                key={folder.id}
                open={isExpanded}
                onOpenChange={() => toggleFolder(folder.id)}
              >
                <div className="group flex items-center">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start gap-2 h-8 px-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent"
                      data-testid={`folder-${folder.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <FolderIcon className="w-4 h-4 text-primary/80" />
                      <span className="truncate">{folder.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {folder.items.length}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  
                  {onCreateItem && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`add-to-${folder.id}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onCreateItem(folder.id, 'note')}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          New Note
                        </DropdownMenuItem>
                        {folder.id === 'manuscript' && (
                          <DropdownMenuItem onClick={() => onCreateItem(folder.id, 'chapter')}>
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            New Chapter
                          </DropdownMenuItem>
                        )}
                        {folder.id === 'characters' && (
                          <DropdownMenuItem onClick={() => onCreateItem(folder.id, 'character')}>
                            <Users className="w-3.5 h-3.5 mr-2" />
                            New Character
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <CollapsibleContent>
                  <div className="ml-4 border-l border-sidebar-border pl-2 space-y-0.5 py-1">
                    {folder.items.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground px-2 py-1 italic">
                        No items yet
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
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                            )}
                            onClick={() => onSelectItem(item)}
                            data-testid={`item-${item.id}`}
                          >
                            <ItemIcon className={cn(
                              "w-3.5 h-3.5 shrink-0",
                              item.type === 'chapter' && item.chapterIndex !== undefined 
                                ? "text-primary/70" 
                                : "text-muted-foreground"
                            )} />
                            <span className="truncate">{item.title}</span>
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

      <div className="p-3 border-t border-sidebar-border">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Chapters:</span>
            <span className="font-medium">{manuscriptItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Characters:</span>
            <span className="font-medium">{characterItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Research Notes:</span>
            <span className="font-medium">{researchItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Images:</span>
            <span className="font-medium">{imageItems.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
