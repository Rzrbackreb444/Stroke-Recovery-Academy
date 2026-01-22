import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  Lightbulb,
  Brain,
  Plus,
  BookOpen,
  MapPin,
  Users,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  MessageSquare,
  ListChecks,
} from "lucide-react";

interface OutlineItem {
  id: string;
  title: string;
  type: 'section' | 'item';
  children?: OutlineItem[];
  completed?: boolean;
}

export default function RiverResearchPanel() {
  const { bookOutline, brainstormIdeas } = useBookStudio();
  const [activeTab, setActiveTab] = useState("outline");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['section-1', 'section-2']));
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const mockOutline: OutlineItem[] = [
    {
      id: 'section-1',
      title: 'Book Outline Development and Review',
      type: 'section',
      children: [
        { id: 'item-1-1', title: 'Characterization elements and features', type: 'item', completed: true },
        { id: 'item-1-2', title: 'Emotional and narrative implications for Maya\'s journey', type: 'item', completed: true },
        { id: 'item-1-3', title: 'Authentic details to include in writing dominant stories, narratives, emotions', type: 'item' },
      ]
    },
    {
      id: 'section-2',
      title: 'Portland Landmarks & Architecture',
      type: 'section',
      children: [
        { id: 'item-2-1', title: 'Downtown Portland geography and key districts', type: 'item', completed: true },
        { id: 'item-2-2', title: 'Detailed information about Oregon Historical Society Research Library', type: 'item' },
        { id: 'item-2-3', title: 'Portland\'s October weather and atmosphere', type: 'item' },
        { id: 'item-2-4', title: 'Comprehensive sensory details (visual, auditory, tactile)', type: 'item' },
        { id: 'item-2-5', title: 'Navigation details from Union Station to archives', type: 'item' },
        { id: 'item-2-6', title: 'Atmospheric mood that supports the narrative', type: 'item' },
      ]
    },
    {
      id: 'section-3',
      title: 'Amtrak Train Travel Experience',
      type: 'section',
      children: [
        { id: 'item-3-1', title: 'Coast Starlight route overview and train features', type: 'item' },
        { id: 'item-3-2', title: 'Union Station arrival procedures', type: 'item' },
        { id: 'item-3-3', title: 'Physical and emotional impact of sleep deprivation on Maya', type: 'item' },
        { id: 'item-3-4', title: 'Elusive\'s melancholia tone and transition emotions', type: 'item' },
      ]
    },
  ];

  const researchNotes = brainstormIdeas.filter(idea => 
    idea.type === 'note' || idea.type === 'goal' || idea.type === 'plot'
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Story Guide</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Plus className="h-4 w-4 text-zinc-500" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
            data-testid="input-search-research"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-3 h-8 bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="outline" className="text-[11px] gap-1" data-testid="tab-outline">
            <ListChecks className="h-3 w-3" />
            Outline
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-[11px] gap-1" data-testid="tab-notes">
            <Lightbulb className="h-3 w-3" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-[11px] gap-1" data-testid="tab-ai">
            <Sparkles className="h-3 w-3" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* Outline Tab */}
        <TabsContent value="outline" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {mockOutline.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                const completedCount = section.children?.filter(c => c.completed).length || 0;
                const totalCount = section.children?.length || 0;
                
                return (
                  <Collapsible
                    key={section.id}
                    open={isExpanded}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-1.5 h-auto py-2 px-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        data-testid={`section-${section.id}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-tight">
                            {section.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {completedCount}/{totalCount} items
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="ml-4 pl-3 border-l border-zinc-200 dark:border-zinc-700 space-y-0.5 py-1">
                        {section.children?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group"
                            data-testid={`item-${item.id}`}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0 mt-0.5 group-hover:text-zinc-400" />
                            )}
                            <span className={cn(
                              "text-xs leading-relaxed",
                              item.completed 
                                ? "text-zinc-500 dark:text-zinc-500" 
                                : "text-zinc-700 dark:text-zinc-300"
                            )}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {researchNotes.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-500">No notes yet</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Add notes to help guide your writing</p>
                </div>
              ) : (
                researchNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                    data-testid={`note-${note.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        {note.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="text-[9px] text-zinc-400 mt-2">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-xs gap-1.5 mt-2 border-dashed"
                data-testid="button-add-note"
              >
                <Plus className="h-3 w-3" />
                Add Note
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center py-6">
                <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Writing Assistant</h3>
                <p className="text-xs text-zinc-500 mt-1">Get help with your writing</p>
              </div>

              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs justify-start gap-2"
                  data-testid="ai-expand-scene"
                >
                  <Target className="h-3.5 w-3.5 text-blue-500" />
                  Expand this scene
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs justify-start gap-2"
                  data-testid="ai-improve-dialogue"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                  Improve dialogue
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs justify-start gap-2"
                  data-testid="ai-add-description"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  Add sensory details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-9 text-xs justify-start gap-2"
                  data-testid="ai-character-voice"
                >
                  <Users className="h-3.5 w-3.5 text-purple-500" />
                  Check character voice
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-blue-500" />
            Context ready
          </span>
          <span>Chapter 1</span>
        </div>
      </div>
    </div>
  );
}
