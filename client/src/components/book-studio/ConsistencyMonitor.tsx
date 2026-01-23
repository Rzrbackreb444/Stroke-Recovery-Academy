import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  X,
  Eye,
  RefreshCw,
  Loader2,
  Users,
  MapPin,
  Calendar,
  Palette,
  Clock,
  Bookmark,
  FileText,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Shield,
  Target,
  Zap,
  Brain,
  BookOpen,
  Edit,
  Trash2,
  Plus,
  Filter,
} from "lucide-react";

interface ConsistencyEntry {
  id: string;
  category: 'character' | 'location' | 'timeline' | 'object' | 'plot';
  name: string;
  attribute: string;
  value: string;
  chapter: number;
  paragraph: number;
  excerpt: string;
  confidence: number;
}

interface ConsistencyConflict {
  id: string;
  category: string;
  subject: string;
  attribute: string;
  entries: ConsistencyEntry[];
  severity: 'critical' | 'warning' | 'info';
  isResolved: boolean;
  resolution?: string;
}

interface ConsistencyMonitorProps {
  manuscriptContent: string;
  chapters?: { title: string; content: string }[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToConflict?: (chapter: number, paragraph: number) => void;
}

const CATEGORY_ICONS: Record<string, typeof Users> = {
  character: Users,
  location: MapPin,
  timeline: Calendar,
  object: Bookmark,
  plot: FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
  character: 'text-blue-500',
  location: 'text-green-500',
  timeline: 'text-orange-500',
  object: 'text-[#C9941A]',
  plot: 'text-amber-600',
};

export default function ConsistencyMonitor({
  manuscriptContent,
  chapters = [],
  isOpen,
  onClose,
  onNavigateToConflict,
}: ConsistencyMonitorProps) {
  const { toast } = useToast();
  const { brainProjectId, bookOutline } = useBookStudio();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [entries, setEntries] = useState<ConsistencyEntry[]>([]);
  const [conflicts, setConflicts] = useState<ConsistencyConflict[]>([]);
  const [activeTab, setActiveTab] = useState<'conflicts' | 'database' | 'insights'>('conflicts');
  const [selectedConflict, setSelectedConflict] = useState<ConsistencyConflict | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const { data: brainMemories } = useQuery({
    queryKey: ['/api/author-brain/memories', brainProjectId],
    enabled: !!brainProjectId,
  });

  const wordCount = manuscriptContent.split(/\s+/).filter(w => w).length;
  const chapterCount = chapters.length || bookOutline?.chapters?.length || 0;

  const extractEntities = useCallback((text: string, chapterNum: number): ConsistencyEntry[] => {
    const foundEntries: ConsistencyEntry[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    paragraphs.forEach((para, paraIdx) => {
      const hairColors = para.match(/\b(blonde|brunette|redhead|black|brown|gray|grey|white|auburn|silver|golden)\s+(hair|haired|locks|curls|strands)/gi);
      if (hairColors) {
        hairColors.forEach(match => {
          const nameMatch = para.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
          if (nameMatch) {
            foundEntries.push({
              id: `entry-${Date.now()}-${Math.random()}`,
              category: 'character',
              name: nameMatch[1],
              attribute: 'hair color',
              value: match.toLowerCase(),
              chapter: chapterNum,
              paragraph: paraIdx + 1,
              excerpt: para.slice(0, 100),
              confidence: 0.85,
            });
          }
        });
      }
      
      const eyeColors = para.match(/\b(blue|green|brown|hazel|gray|grey|amber|black)\s+(eyes|eyed)/gi);
      if (eyeColors) {
        eyeColors.forEach(match => {
          const nameMatch = para.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
          if (nameMatch) {
            foundEntries.push({
              id: `entry-${Date.now()}-${Math.random()}`,
              category: 'character',
              name: nameMatch[1],
              attribute: 'eye color',
              value: match.toLowerCase(),
              chapter: chapterNum,
              paragraph: paraIdx + 1,
              excerpt: para.slice(0, 100),
              confidence: 0.9,
            });
          }
        });
      }
      
      const ageMatches = para.match(/\b(was|is|turned|nearly|almost|just)\s+(\d{1,2})\s+(years?\s+old|year-old)/gi);
      if (ageMatches) {
        ageMatches.forEach(match => {
          const nameMatch = para.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
          const ageNum = match.match(/\d+/);
          if (nameMatch && ageNum) {
            foundEntries.push({
              id: `entry-${Date.now()}-${Math.random()}`,
              category: 'character',
              name: nameMatch[1],
              attribute: 'age',
              value: ageNum[0],
              chapter: chapterNum,
              paragraph: paraIdx + 1,
              excerpt: para.slice(0, 100),
              confidence: 0.95,
            });
          }
        });
      }
      
      const timeRefs = para.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/gi);
      if (timeRefs) {
        timeRefs.forEach(match => {
          foundEntries.push({
            id: `entry-${Date.now()}-${Math.random()}`,
            category: 'timeline',
            name: 'Temporal Reference',
            attribute: 'date/time',
            value: match,
            chapter: chapterNum,
            paragraph: paraIdx + 1,
            excerpt: para.slice(0, 100),
            confidence: 0.7,
          });
        });
      }
    });
    
    return foundEntries;
  }, []);

  const detectConflicts = useCallback((allEntries: ConsistencyEntry[]): ConsistencyConflict[] => {
    const foundConflicts: ConsistencyConflict[] = [];
    const groupedBySubject: Record<string, ConsistencyEntry[]> = {};
    
    allEntries.forEach(entry => {
      const key = `${entry.category}-${entry.name}-${entry.attribute}`;
      if (!groupedBySubject[key]) {
        groupedBySubject[key] = [];
      }
      groupedBySubject[key].push(entry);
    });
    
    Object.entries(groupedBySubject).forEach(([key, groupEntries]) => {
      if (groupEntries.length > 1) {
        const uniqueValues = new Set(groupEntries.map(e => e.value.toLowerCase()));
        if (uniqueValues.size > 1) {
          const [category, name, attribute] = key.split('-');
          foundConflicts.push({
            id: `conflict-${Date.now()}-${Math.random()}`,
            category,
            subject: name,
            attribute,
            entries: groupEntries,
            severity: category === 'character' ? 'critical' : 'warning',
            isResolved: false,
          });
        }
      }
    });
    
    return foundConflicts;
  }, []);

  const scanManuscript = useMutation({
    mutationFn: async () => {
      setIsScanning(true);
      setScanProgress(0);
      
      const allChapterContent = chapters.length > 0 
        ? chapters.map(c => c.content).join('\n\n---\n\n')
        : manuscriptContent;
      
      const chapterTexts = allChapterContent.split(/---/);
      const allEntries: ConsistencyEntry[] = [];
      
      for (let i = 0; i < chapterTexts.length; i++) {
        setScanProgress(Math.round(((i + 1) / chapterTexts.length) * 100));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const chapterEntries = extractEntities(chapterTexts[i], i + 1);
        allEntries.push(...chapterEntries);
      }
      
      return allEntries;
    },
    onSuccess: (allEntries) => {
      setEntries(allEntries);
      const foundConflicts = detectConflicts(allEntries);
      setConflicts(foundConflicts);
      setIsScanning(false);
      
      toast({
        title: "Scan complete",
        description: `Found ${allEntries.length} entities and ${foundConflicts.length} potential conflicts`,
      });
    },
    onError: () => {
      setIsScanning(false);
      toast({ title: "Scan failed", variant: "destructive" });
    },
  });

  const resolveConflict = useCallback((conflictId: string, resolution: string) => {
    setConflicts(prev => prev.map(c => 
      c.id === conflictId ? { ...c, isResolved: true, resolution } : c
    ));
    setSelectedConflict(null);
    toast({ title: "Conflict resolved" });
  }, [toast]);

  const dismissConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    toast({ title: "Conflict dismissed" });
  }, [toast]);

  const toggleEntry = useCallback((id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredConflicts = useMemo(() => {
    if (filterCategory === 'all') return conflicts;
    return conflicts.filter(c => c.category === filterCategory);
  }, [conflicts, filterCategory]);

  const unresolvedConflicts = filteredConflicts.filter(c => !c.isResolved);
  const criticalCount = conflicts.filter(c => c.severity === 'critical' && !c.isResolved).length;
  const warningCount = conflicts.filter(c => c.severity === 'warning' && !c.isResolved).length;

  const groupedEntries = useMemo(() => {
    const groups: Record<string, ConsistencyEntry[]> = {};
    entries.forEach(entry => {
      const key = `${entry.category}-${entry.name}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [entries]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Recursive Consistency Monitor
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {wordCount.toLocaleString()} words
              </Badge>
              <Badge variant="outline" className="text-xs">
                {chapterCount} chapters
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                criticalCount > 0 ? "bg-red-500" : "bg-green-500"
              )} />
              <span className="text-sm">
                {criticalCount > 0 ? `${criticalCount} critical` : "No critical issues"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                warningCount > 0 ? "bg-yellow-500" : "bg-green-500"
              )} />
              <span className="text-sm">
                {warningCount > 0 ? `${warningCount} warnings` : "No warnings"}
              </span>
            </div>
          </div>
          
          <Button
            onClick={() => scanManuscript.mutate()}
            disabled={isScanning || !manuscriptContent}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning... {scanProgress}%
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scan Manuscript
              </>
            )}
          </Button>
        </div>

        {isScanning && (
          <div className="py-2">
            <Progress value={scanProgress} className="h-2" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="justify-start">
            <TabsTrigger value="conflicts" className="gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Conflicts
              {unresolvedConflicts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[9px]">
                  {unresolvedConflicts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-1">
              <Brain className="w-3.5 h-3.5" />
              Entity Database
              <Badge variant="secondary" className="ml-1 text-[9px]">
                {entries.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conflicts" className="flex-1 m-0 mt-3 overflow-hidden">
            <div className="flex h-full gap-4">
              <div className="w-48 shrink-0">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Filter by Category</p>
                <div className="space-y-1">
                  {['all', 'character', 'location', 'timeline', 'object', 'plot'].map(cat => {
                    const count = cat === 'all' 
                      ? conflicts.filter(c => !c.isResolved).length
                      : conflicts.filter(c => c.category === cat && !c.isResolved).length;
                    const Icon = cat === 'all' ? Filter : CATEGORY_ICONS[cat] || FileText;
                    
                    return (
                      <Button
                        key={cat}
                        variant={filterCategory === cat ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-between h-8 text-xs"
                        onClick={() => setFilterCategory(cat)}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className={cn("w-3.5 h-3.5", cat !== 'all' && CATEGORY_COLORS[cat])} />
                          <span className="capitalize">{cat}</span>
                        </span>
                        <Badge variant="outline" className="text-[9px]">{count}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {unresolvedConflicts.length === 0 ? (
                    <div className="text-center py-12">
                      <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <h3 className="font-medium mb-2">No Conflicts Found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {entries.length > 0 
                          ? "Your manuscript is consistent! All entities match across chapters."
                          : "Scan your manuscript to detect consistency issues."}
                      </p>
                    </div>
                  ) : (
                    unresolvedConflicts.map(conflict => {
                      const Icon = CATEGORY_ICONS[conflict.category] || FileText;
                      
                      return (
                        <Card
                          key={conflict.id}
                          className={cn(
                            "cursor-pointer hover:shadow-sm",
                            conflict.severity === 'critical' && "border-red-200 dark:border-red-900"
                          )}
                          onClick={() => setSelectedConflict(conflict)}
                        >
                          <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", CATEGORY_COLORS[conflict.category])} />
                                <span>{conflict.subject}</span>
                                <Badge variant="outline" className="text-[9px]">{conflict.attribute}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-[9px]",
                                    conflict.severity === 'critical' && "bg-red-100 text-red-700",
                                    conflict.severity === 'warning' && "bg-yellow-100 text-yellow-700",
                                  )}
                                >
                                  {conflict.severity}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissConflict(conflict.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground mb-2">
                              Found {conflict.entries.length} different values across chapters
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(conflict.entries.map(e => e.value))).map(val => (
                                <Badge key={val} variant="outline" className="text-[9px]">{val}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                              <span>Chapters: {Array.from(new Set(conflict.entries.map(e => e.chapter))).join(', ')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="database" className="flex-1 m-0 mt-3 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {Object.entries(groupedEntries).map(([key, groupEntries]) => {
                  const [category, name] = key.split('-');
                  const Icon = CATEGORY_ICONS[category] || FileText;
                  const isExpanded = expandedEntries.has(key);
                  
                  return (
                    <Card key={key}>
                      <CardHeader
                        className="p-3 cursor-pointer"
                        onClick={() => toggleEntry(key)}
                      >
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <Icon className={cn("w-4 h-4", CATEGORY_COLORS[category])} />
                            <span>{name}</span>
                            <Badge variant="secondary" className="text-[9px]">{groupEntries.length} entries</Badge>
                          </div>
                          <Badge variant="outline" className="text-[9px] capitalize">{category}</Badge>
                        </CardTitle>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="p-3 pt-0">
                          <div className="space-y-2">
                            {groupEntries.map(entry => (
                              <div key={entry.id} className="flex items-start gap-3 p-2 rounded bg-muted/30 text-xs">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{entry.attribute}:</span>
                                    <span>{entry.value}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground line-clamp-1">{entry.excerpt}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px] shrink-0">
                                  Ch. {entry.chapter}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
                
                {Object.keys(groupedEntries).length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-medium mb-2">No Entities Found</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan your manuscript to build the entity database.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 m-0 mt-3 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Characters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {Object.keys(groupedEntries).filter(k => k.startsWith('character')).length}
                    </p>
                    <p className="text-xs text-muted-foreground">unique characters tracked</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {Object.keys(groupedEntries).filter(k => k.startsWith('location')).length}
                    </p>
                    <p className="text-xs text-muted-foreground">unique locations tracked</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {entries.filter(e => e.category === 'timeline').length}
                    </p>
                    <p className="text-xs text-muted-foreground">temporal references found</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Consistency Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {entries.length > 0 
                        ? Math.round(((entries.length - conflicts.length) / entries.length) * 100) 
                        : 100}%
                    </p>
                    <p className="text-xs text-muted-foreground">across all entities</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selectedConflict && (
          <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "w-5 h-5",
                    selectedConflict.severity === 'critical' ? "text-red-500" : "text-yellow-500"
                  )} />
                  Resolve Conflict: {selectedConflict.subject}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Different values found for <strong>{selectedConflict.attribute}</strong>:
                  </p>
                  
                  <div className="space-y-2">
                    {selectedConflict.entries.map(entry => (
                      <Card key={entry.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge>{entry.value}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Chapter {entry.chapter}, Paragraph {entry.paragraph}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground italic">"{entry.excerpt}..."</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => resolveConflict(selectedConflict.id, entry.value)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Keep This
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedConflict(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => dismissConflict(selectedConflict.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Dismiss Conflict
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
