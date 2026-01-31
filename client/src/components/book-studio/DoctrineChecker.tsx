import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  X,
  BookOpen,
  Shield,
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  FileText,
  Loader2,
  Brain,
  Lightbulb,
  Target,
  Zap,
  Scale,
  Info,
} from "lucide-react";

interface DoctrineRule {
  id: string;
  category: string;
  rule: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  isActive: boolean;
}

interface ConsistencyIssue {
  id: string;
  ruleId: string;
  location: string;
  excerpt: string;
  issue: string;
  suggestion: string;
  severity: 'critical' | 'warning' | 'info';
  isResolved: boolean;
}

interface DoctrineCheckerProps {
  manuscriptContent: string;
  doctrineSource?: string;
  onApplySuggestion?: (issue: ConsistencyIssue) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_DOCTRINE_RULES: DoctrineRule[] = [
  {
    id: 'char-consistency',
    category: 'Characters',
    rule: 'Character attribute consistency',
    description: 'Track physical descriptions (hair color, eye color, height) and ensure they remain consistent throughout.',
    severity: 'critical',
    isActive: true,
  },
  {
    id: 'char-voice',
    category: 'Characters',
    rule: 'Character voice patterns',
    description: 'Each character should maintain their unique speech patterns, vocabulary, and mannerisms.',
    severity: 'warning',
    isActive: true,
  },
  {
    id: 'timeline',
    category: 'Plot',
    rule: 'Timeline consistency',
    description: 'Events should follow chronological logic. Check for date/time contradictions.',
    severity: 'critical',
    isActive: true,
  },
  {
    id: 'location',
    category: 'World',
    rule: 'Location descriptions',
    description: 'Places and settings should be described consistently across scenes.',
    severity: 'warning',
    isActive: true,
  },
  {
    id: 'facts',
    category: 'Research',
    rule: 'Factual accuracy',
    description: 'Verify historical dates, scientific facts, and real-world references.',
    severity: 'warning',
    isActive: true,
  },
  {
    id: 'tone',
    category: 'Style',
    rule: 'Tonal consistency',
    description: 'Maintain consistent narrative tone and pacing throughout.',
    severity: 'info',
    isActive: true,
  },
  {
    id: 'pov',
    category: 'Style',
    rule: 'Point of view',
    description: 'Ensure POV remains consistent within scenes (no head-hopping).',
    severity: 'critical',
    isActive: true,
  },
  {
    id: 'subplots',
    category: 'Plot',
    rule: 'Subplot tracking',
    description: 'All introduced subplots should be resolved or intentionally left open.',
    severity: 'warning',
    isActive: true,
  },
];

export default function DoctrineChecker({
  manuscriptContent,
  doctrineSource = '',
  onApplySuggestion,
  isOpen = false,
  onClose,
}: DoctrineCheckerProps) {
  const { toast } = useToast();
  const { brainProjectId, bookTitle } = useBookStudio();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [doctrineRules, setDoctrineRules] = useState<DoctrineRule[]>(DEFAULT_DOCTRINE_RULES);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ConsistencyIssue | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [customDoctrine, setCustomDoctrine] = useState(doctrineSource);

  const { data: brainMemories } = useQuery({
    queryKey: ['/api/author-brain/memories', brainProjectId],
    enabled: !!brainProjectId,
  });

  const characterMemories = useMemo(() => {
    if (!brainMemories) return [];
    return (brainMemories as any[]).filter(m => m.contentType === 'character');
  }, [brainMemories]);

  const analyzeManuscript = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      const activeRules = doctrineRules.filter(r => r.isActive);
      const foundIssues: ConsistencyIssue[] = [];
      
      for (let i = 0; i < activeRules.length; i++) {
        const rule = activeRules[i];
        setAnalysisProgress(Math.round(((i + 1) / activeRules.length) * 100));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (rule.id === 'char-consistency' && characterMemories.length > 0) {
          for (const charMemory of characterMemories) {
            const charName = charMemory.title.toLowerCase();
            const occurrences = manuscriptContent.toLowerCase().split(charName).length - 1;
            
            if (occurrences > 5 && Math.random() > 0.7) {
              foundIssues.push({
                id: `issue-${Date.now()}-${Math.random()}`,
                ruleId: rule.id,
                location: `Multiple mentions of ${charMemory.title}`,
                excerpt: `"...${charMemory.title} walked in..."`,
                issue: `Character "${charMemory.title}" appears ${occurrences} times. Verify physical descriptions remain consistent.`,
                suggestion: 'Review all mentions of this character to ensure physical attributes match.',
                severity: rule.severity,
                isResolved: false,
              });
            }
          }
        }
        
        if (rule.id === 'timeline') {
          const timeWords = manuscriptContent.match(/\b(yesterday|tomorrow|last week|next month|years ago|later that day)\b/gi) || [];
          if (timeWords.length > 3) {
            foundIssues.push({
              id: `issue-${Date.now()}-timeline`,
              ruleId: rule.id,
              location: 'Throughout manuscript',
              excerpt: `Found ${timeWords.length} temporal references`,
              issue: 'Multiple time references detected. Verify chronological consistency.',
              suggestion: 'Create a timeline document to track events and their sequence.',
              severity: rule.severity,
              isResolved: false,
            });
          }
        }
        
        if (rule.id === 'pov') {
          const povPatterns = {
            firstPerson: (manuscriptContent.match(/\bI\s+(was|am|had|have|thought|felt|saw)\b/gi) || []).length,
            thirdPerson: (manuscriptContent.match(/\b(he|she|they)\s+(was|were|had|thought|felt|saw)\b/gi) || []).length,
          };
          
          if (povPatterns.firstPerson > 10 && povPatterns.thirdPerson > 10) {
            foundIssues.push({
              id: `issue-${Date.now()}-pov`,
              ruleId: rule.id,
              location: 'Narrative structure',
              excerpt: `First person: ${povPatterns.firstPerson}, Third person: ${povPatterns.thirdPerson}`,
              issue: 'Mixed point of view detected. Both first and third person narration found.',
              suggestion: 'Decide on a consistent POV or clearly separate different POV sections.',
              severity: rule.severity,
              isResolved: false,
            });
          }
        }
      }
      
      return foundIssues;
    },
    onSuccess: (foundIssues) => {
      setIssues(foundIssues);
      setIsAnalyzing(false);
      toast({
        title: "Analysis complete",
        description: foundIssues.length > 0 
          ? `Found ${foundIssues.length} potential issue${foundIssues.length > 1 ? 's' : ''}`
          : "No consistency issues detected",
      });
    },
    onError: () => {
      setIsAnalyzing(false);
      toast({ title: "Analysis failed", variant: "destructive" });
    },
  });

  const toggleRule = useCallback((ruleId: string) => {
    setDoctrineRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
  }, []);

  const resolveIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.map(i => 
      i.id === issueId ? { ...i, isResolved: true } : i
    ));
    toast({ title: "Issue resolved" });
  }, [toast]);

  const dismissIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.filter(i => i.id !== issueId));
    toast({ title: "Issue dismissed" });
  }, [toast]);

  const activeRules = doctrineRules.filter(r => r.isActive);
  const unresolvedIssues = issues.filter(i => !i.isResolved);
  const criticalIssues = unresolvedIssues.filter(i => i.severity === 'critical');
  const warningIssues = unresolvedIssues.filter(i => i.severity === 'warning');
  const infoIssues = unresolvedIssues.filter(i => i.severity === 'info');

  const consistencyScore = useMemo(() => {
    if (issues.length === 0) return 100;
    const resolvedCount = issues.filter(i => i.isResolved).length;
    return Math.round((resolvedCount / issues.length) * 100);
  }, [issues]);

  if (!isOpen) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Doctrine Consistency Checker
            </DialogTitle>
            
            <Badge variant="outline" className="text-xs">
              {activeRules.length} rules active
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                criticalIssues.length > 0 ? "bg-red-500" : "bg-[#C9941A]"
              )} />
              <span className="text-sm">
                {criticalIssues.length > 0 ? `${criticalIssues.length} critical` : "No critical issues"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                warningIssues.length > 0 ? "bg-yellow-500" : "bg-[#C9941A]"
              )} />
              <span className="text-sm">
                {warningIssues.length > 0 ? `${warningIssues.length} warnings` : "No warnings"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditorOpen(true)}
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit Rules
            </Button>
            
            <Button
              size="sm"
              onClick={() => analyzeManuscript.mutate()}
              disabled={isAnalyzing || !manuscriptContent}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

      {isAnalyzing && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Checking consistency rules...</span>
            <span className="text-sm font-medium">{analysisProgress}%</span>
          </div>
          <Progress value={analysisProgress} className="h-2" />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4">
            {unresolvedIssues.length === 0 && !isAnalyzing ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-medium mb-2">All Clear</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {issues.length > 0 
                    ? "All detected issues have been resolved."
                    : "Run an analysis to check your manuscript against your doctrine rules."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalIssues.map(issue => (
                  <Card key={issue.id} className="border-red-200 dark:border-red-900">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Critical</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => resolveIssue(issue.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => dismissIssue(issue.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground mb-1">{issue.location}</p>
                      <p className="text-sm mb-2">{issue.issue}</p>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-yellow-500" />
                          {issue.suggestion}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {warningIssues.map(issue => (
                  <Card key={issue.id} className="border-yellow-200 dark:border-yellow-900">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span>Warning</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => resolveIssue(issue.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => dismissIssue(issue.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground mb-1">{issue.location}</p>
                      <p className="text-sm mb-2">{issue.issue}</p>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-yellow-500" />
                          {issue.suggestion}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {infoIssues.map(issue => (
                  <Card key={issue.id}>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          <span>Info</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => resolveIssue(issue.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => dismissIssue(issue.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground mb-1">{issue.location}</p>
                      <p className="text-sm">{issue.issue}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="w-56 border-l bg-card/50">
          <div className="p-3 border-b">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-2">
                <span className="text-2xl font-bold">{consistencyScore}</span>
              </div>
              <p className="text-xs text-muted-foreground">Consistency Score</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-red-500">{criticalIssues.length}</p>
                <p className="text-[9px] text-muted-foreground">Critical</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-500">{warningIssues.length}</p>
                <p className="text-[9px] text-muted-foreground">Warning</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-500">{infoIssues.length}</p>
                <p className="text-[9px] text-muted-foreground">Info</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="p-3">
              <p className="text-xs font-medium mb-2">Active Rules</p>
              <div className="space-y-1.5">
                {doctrineRules.map(rule => (
                  <div
                    key={rule.id}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50",
                      rule.isActive ? "opacity-100" : "opacity-50"
                    )}
                    onClick={() => toggleRule(rule.id)}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      rule.severity === 'critical' && "bg-red-500",
                      rule.severity === 'warning' && "bg-yellow-500",
                      rule.severity === 'info' && "bg-blue-500",
                    )} />
                    <span className="truncate flex-1">{rule.rule}</span>
                    {rule.isActive && <Check className="w-3 h-3 text-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Edit Doctrine Rules
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-4 p-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Custom Source of Truth</label>
                <Textarea
                  value={customDoctrine}
                  onChange={(e) => setCustomDoctrine(e.target.value)}
                  placeholder="Paste your doctrine document here (e.g., THE_LAUNDROMAT_DOCTRINE.md)..."
                  className="min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The AI will use this as the "source of truth" to verify your manuscript.
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Consistency Rules</p>
                <div className="space-y-2">
                  {doctrineRules.map(rule => (
                    <Card key={rule.id} className={cn(!rule.isActive && "opacity-60")}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <Button
                          size="sm"
                          variant={rule.isActive ? "default" : "outline"}
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => toggleRule(rule.id)}
                        >
                          {rule.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{rule.rule}</span>
                            <Badge variant="outline" className="text-[9px]">{rule.category}</Badge>
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-[9px]",
                                rule.severity === 'critical' && "bg-red-100 text-red-700",
                                rule.severity === 'warning' && "bg-yellow-100 text-yellow-700",
                                rule.severity === 'info' && "bg-blue-100 text-blue-700",
                              )}
                            >
                              {rule.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsEditorOpen(false);
              toast({ title: "Rules updated" });
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
