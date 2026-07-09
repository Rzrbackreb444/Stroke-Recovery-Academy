import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Users,
  Globe,
  FileText,
  Lightbulb,
  Sparkles,
  Trash2,
  Edit,
  Save,
  X,
  Brain,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Memory {
  id: string;
  content_type: string;
  raw_text: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  bookTitle?: string;
}

const CONTENT_TYPES = [
  { value: 'character', label: 'Character', icon: Users, description: 'Character profiles and arcs' },
  { value: 'lore', label: 'World-Building', icon: Globe, description: 'Settings, history, rules' },
  { value: 'research', label: 'Research', icon: Search, description: 'Facts, sources, references' },
  { value: 'plot', label: 'Plot Notes', icon: FileText, description: 'Story beats and structure' },
  { value: 'style', label: 'Style Guide', icon: Sparkles, description: 'Voice, tone, conventions' },
  { value: 'note', label: 'General Note', icon: Lightbulb, description: 'Ideas and reminders' },
];

export default function ResearchPanel({
  isOpen,
  onClose,
  projectId,
  bookTitle,
}: ResearchPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newMemory, setNewMemory] = useState({
    contentType: 'note',
    rawText: '',
    title: '',
  });

  const { data: memories = [], isLoading } = useQuery<Memory[]>({
    queryKey: ['/api/author-brain/memories', projectId, activeTab],
    queryFn: async () => {
      if (!projectId) return [];
      const contentType = activeTab !== 'all' ? activeTab : undefined;
      const url = contentType 
        ? `/api/author-brain/memories?projectId=${projectId}&contentType=${contentType}`
        : `/api/author-brain/memories?projectId=${projectId}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch memories');
      return res.json();
    },
    enabled: !!projectId && isOpen,
  });

  const { data: searchResults = [] } = useQuery<Memory[]>({
    queryKey: ['/api/author-brain/search', projectId, searchQuery],
    queryFn: async () => {
      if (!projectId || !searchQuery || searchQuery.length < 2) return [];
      const url = `/api/author-brain/search?projectId=${projectId}&query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    enabled: !!projectId && searchQuery.length >= 2,
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (data: { projectId: string; contentType: string; rawText: string; metadata?: any }) => {
      return apiRequest('POST', '/api/author-brain/memories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/author-brain/memories'] });
      setIsAddingNew(false);
      setNewMemory({ contentType: 'note', rawText: '', title: '' });
      toast({ title: "Memory saved", description: "Your note has been added to the project brain." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save memory", variant: "destructive" });
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      return apiRequest('DELETE', `/api/author-brain/memories/${memoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/author-brain/memories'] });
      toast({ title: "Memory deleted" });
    },
  });

  const handleSaveMemory = () => {
    if (!projectId || !newMemory.rawText.trim()) {
      toast({ title: "Error", description: "Please enter some content", variant: "destructive" });
      return;
    }
    
    const fullText = newMemory.title 
      ? `${newMemory.title}\n\n${newMemory.rawText}`
      : newMemory.rawText;
    
    addMemoryMutation.mutate({
      projectId,
      contentType: newMemory.contentType,
      rawText: fullText,
      metadata: { title: newMemory.title },
    });
  };

  const displayMemories = searchQuery.length >= 2 ? searchResults : memories;

  const getTypeIcon = (type: string) => {
    const found = CONTENT_TYPES.find(t => t.value === type);
    return found?.icon || FileText;
  };

  const getTypeLabel = (type: string) => {
    const found = CONTENT_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  if (!projectId) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-[500px] sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Project Brain
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No project selected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create or select a book project to start building your knowledge base.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[500px] sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Project Brain
          </SheetTitle>
          <SheetDescription>
            {bookTitle || 'Your book'}'s knowledge base. Add characters, research, world-building, and notes.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-memories"
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            data-testid="button-add-memory"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Memory
          </Button>
        </div>

        {isAddingNew && (
          <Card className="mx-4 mt-4 bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Memory
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsAddingNew(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Select
                value={newMemory.contentType}
                onValueChange={(v) => setNewMemory(prev => ({ ...prev, contentType: v }))}
              >
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Title (optional)"
                value={newMemory.title}
                onChange={(e) => setNewMemory(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-memory-title"
              />
              
              <Textarea
                placeholder="Write your note, character description, research, etc..."
                value={newMemory.rawText}
                onChange={(e) => setNewMemory(prev => ({ ...prev, rawText: e.target.value }))}
                className="min-h-[120px] resize-none"
                data-testid="textarea-memory-content"
              />
              
              <Button 
                className="w-full" 
                onClick={handleSaveMemory}
                disabled={addMemoryMutation.isPending || !newMemory.rawText.trim()}
                data-testid="button-save-memory"
              >
                {addMemoryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Memory
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="character" className="text-xs" data-testid="tab-characters">
              <Users className="w-3 h-3 mr-1" />
              Chars
            </TabsTrigger>
            <TabsTrigger value="lore" className="text-xs" data-testid="tab-lore">
              <Globe className="w-3 h-3 mr-1" />
              World
            </TabsTrigger>
            <TabsTrigger value="research" className="text-xs" data-testid="tab-research">
              <Search className="w-3 h-3 mr-1" />
              Notes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value={activeTab} className="mt-0 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : displayMemories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No matching memories found' : 'No memories yet'}
                  </p>
                  <p className="text-xs mt-1">
                    {searchQuery ? 'Try a different search term' : 'Add your first memory to get started'}
                  </p>
                </div>
              ) : (
                displayMemories.map((memory) => {
                  const TypeIcon = getTypeIcon(memory.content_type);
                  const lines = memory.raw_text.split('\n');
                  const title = memory.metadata?.title || lines[0]?.slice(0, 60) || 'Untitled';
                  const preview = lines.slice(memory.metadata?.title ? 0 : 1).join(' ').slice(0, 150);
                  
                  return (
                    <Card 
                      key={memory.id} 
                      className="bg-card/50 hover:bg-card/80 transition-colors"
                      data-testid={`memory-card-${memory.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="w-4 h-4 text-primary shrink-0" />
                              <Badge variant="outline" className="text-[10px]">
                                {getTypeLabel(memory.content_type)}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {title}
                            </h4>
                            {preview && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {preview}...
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {new Date(memory.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMemoryMutation.mutate(memory.id)}
                            data-testid={`delete-memory-${memory.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              {memories.length} memories stored
            </span>
            <span>AI uses this context when writing</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
