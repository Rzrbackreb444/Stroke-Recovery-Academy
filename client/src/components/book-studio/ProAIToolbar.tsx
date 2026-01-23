import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Wand2,
  BookOpen,
  Image as ImageIcon,
  FileText,
  PenTool,
  Search,
  Tag,
  Download,
  ChevronDown,
  Layers,
  Zap,
  Edit3,
  RefreshCw,
  CheckCircle2,
  Scissors,
  Type,
  Palette,
  Copy,
  FileCheck,
  Bot,
  BrainCircuit,
  Lightbulb,
  MessageSquare,
  Users,
  Globe,
} from "lucide-react";

interface ProAIToolbarProps {
  isDark?: boolean;
  onAction?: (action: string, params?: any) => void;
  isGenerating?: boolean;
  creditBalance?: number;
  tierLevel?: 'creator' | 'author' | 'publisher';
}

type AIAction = {
  id: string;
  label: string;
  icon: typeof Sparkles;
  creditCost: number;
  description: string;
  category: 'generation' | 'editing' | 'analysis' | 'export';
};

const AI_ACTIONS: AIAction[] = [
  { id: 'generate-chapter', label: 'Generate Chapter', icon: FileText, creditCost: 50, description: 'AI-write a complete chapter from outline', category: 'generation' },
  { id: 'generate-scene', label: 'Generate Scene', icon: Layers, creditCost: 25, description: 'Write a specific scene with context', category: 'generation' },
  { id: 'generate-dialogue', label: 'Generate Dialogue', icon: MessageSquare, creditCost: 15, description: 'Create character conversations', category: 'generation' },
  { id: 'generate-character', label: 'Create Character', icon: Users, creditCost: 20, description: 'Deep character profile with voice', category: 'generation' },
  { id: 'generate-world', label: 'Build World', icon: Globe, creditCost: 30, description: 'Location, history, and culture', category: 'generation' },
  { id: 'generate-image', label: 'Generate Image', icon: ImageIcon, creditCost: 40, description: 'AI illustration or cover art', category: 'generation' },
  { id: 'edit-developmental', label: 'Developmental Edit', icon: BrainCircuit, creditCost: 35, description: 'Structure, pacing, character arcs', category: 'editing' },
  { id: 'edit-line', label: 'Line Edit', icon: PenTool, creditCost: 25, description: 'Prose quality and flow', category: 'editing' },
  { id: 'edit-copy', label: 'Copy Edit', icon: Edit3, creditCost: 20, description: 'Grammar, punctuation, consistency', category: 'editing' },
  { id: 'edit-proofread', label: 'Proofread', icon: CheckCircle2, creditCost: 15, description: 'Final polish and error check', category: 'editing' },
  { id: 'generate-blurb', label: 'Generate Blurb', icon: Type, creditCost: 10, description: 'Marketing copy and descriptions', category: 'analysis' },
  { id: 'generate-keywords', label: 'Amazon Keywords', icon: Tag, creditCost: 10, description: 'SEO-optimized KDP keywords', category: 'analysis' },
  { id: 'analyze-market', label: 'Market Analysis', icon: Search, creditCost: 25, description: 'Competitive positioning insights', category: 'analysis' },
  { id: 'export-kdp', label: 'Export for KDP', icon: Download, creditCost: 5, description: 'Print-ready PDF/ePub', category: 'export' },
];

const QUALITY_PASSES = [
  { id: 'developmental', label: 'Developmental', icon: BrainCircuit, color: 'text-[#C9941A]' },
  { id: 'line', label: 'Line Edit', icon: PenTool, color: 'text-blue-500' },
  { id: 'copy', label: 'Copy Edit', icon: Edit3, color: 'text-emerald-500' },
  { id: 'proofread', label: 'Proofread', icon: CheckCircle2, color: 'text-amber-500' },
];

export default function ProAIToolbar({ 
  isDark = false, 
  onAction, 
  isGenerating = false,
  creditBalance = 500,
  tierLevel = 'author'
}: ProAIToolbarProps) {
  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  const handleAction = (actionId: string, params?: any) => {
    onAction?.(actionId, params);
  };

  const groupedActions = {
    generation: AI_ACTIONS.filter(a => a.category === 'generation'),
    editing: AI_ACTIONS.filter(a => a.category === 'editing'),
    analysis: AI_ACTIONS.filter(a => a.category === 'analysis'),
    export: AI_ACTIONS.filter(a => a.category === 'export'),
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 border-b",
      isDark 
        ? "bg-stone-950/80 border-stone-800/50 backdrop-blur-xl" 
        : "bg-white/80 border-[#C9941A]/10 backdrop-blur-xl"
    )}>
      {/* AI Generation Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            className={cn(
              "gap-2 h-8 px-3 text-xs font-semibold rounded-sm",
              isDark 
                ? "text-stone-300 hover:bg-stone-800/50 hover:text-[#C9941A]" 
                : "text-[#1A1A1A]/70 hover:bg-[#C9941A]/10 hover:text-[#C9941A]"
            )}
            data-testid="dropdown-ai-generate"
          >
            <Sparkles className="h-4 w-4 text-[#C9941A]" />
            <span>AI Generate</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className={cn(
            "w-64",
            isDark ? "bg-stone-900 border-stone-800" : "bg-white border-[#C9941A]/20"
          )}
        >
          <DropdownMenuLabel className="text-[9px] uppercase tracking-wider opacity-50">
            Content Generation
          </DropdownMenuLabel>
          {groupedActions.generation.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="gap-2 text-xs cursor-pointer"
              >
                <Icon className="h-4 w-4 text-[#C9941A]" />
                <div className="flex-1">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-[10px] opacity-50">{action.description}</div>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  {action.creditCost}
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className={cn("h-5", isDark ? "bg-stone-800" : "bg-[#C9941A]/20")} />

      {/* Quality Polish Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            className={cn(
              "gap-2 h-8 px-3 text-xs font-semibold rounded-sm",
              isDark 
                ? "text-stone-300 hover:bg-stone-800/50 hover:text-[#C9941A]" 
                : "text-[#1A1A1A]/70 hover:bg-[#C9941A]/10 hover:text-[#C9941A]"
            )}
            data-testid="dropdown-quality-polish"
          >
            <Wand2 className="h-4 w-4 text-[#C9941A]" />
            <span>Quality Polish</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className={cn(
            "w-56",
            isDark ? "bg-stone-900 border-stone-800" : "bg-white border-[#C9941A]/20"
          )}
        >
          <DropdownMenuLabel className="text-[9px] uppercase tracking-wider opacity-50">
            4-Pass Quality System
          </DropdownMenuLabel>
          {QUALITY_PASSES.map((pass) => {
            const Icon = pass.icon;
            const action = groupedActions.editing.find(a => a.id === `edit-${pass.id}`);
            return (
              <DropdownMenuItem
                key={pass.id}
                onClick={() => handleAction(`edit-${pass.id}`)}
                className="gap-2 text-xs cursor-pointer"
              >
                <Icon className={cn("h-4 w-4", pass.color)} />
                <div className="flex-1">{pass.label}</div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  {action?.creditCost || 0}
                </Badge>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleAction('polish-all')}
            className="gap-2 text-xs cursor-pointer font-semibold"
          >
            <RefreshCw className="h-4 w-4 text-[#C9941A]" />
            <span>Run All 4 Passes</span>
            <Badge className="bg-[#C9941A] text-white text-[9px]">95</Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className={cn("h-5", isDark ? "bg-stone-800" : "bg-[#C9941A]/20")} />

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm",
                isDark ? "text-stone-400 hover:text-emerald-400" : "text-[#1A1A1A]/50 hover:text-emerald-600"
              )}
              onClick={() => handleAction('generate-blurb')}
              data-testid="button-generate-blurb"
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Generate Blurb (10 credits)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm",
                isDark ? "text-stone-400 hover:text-blue-400" : "text-[#1A1A1A]/50 hover:text-blue-600"
              )}
              onClick={() => handleAction('generate-keywords')}
              data-testid="button-generate-keywords"
            >
              <Tag className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Amazon Keywords (10 credits)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-sm",
                isDark ? "text-stone-400 hover:text-rose-400" : "text-[#1A1A1A]/50 hover:text-rose-600"
              )}
              onClick={() => handleAction('generate-image')}
              data-testid="button-generate-image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Generate Image (40 credits)
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className={cn("h-5", isDark ? "bg-stone-800" : "bg-[#C9941A]/20")} />

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 h-8 px-3 text-xs font-semibold rounded-sm",
              isDark 
                ? "text-stone-300 hover:bg-stone-800/50" 
                : "text-[#1A1A1A]/70 hover:bg-[#C9941A]/10"
            )}
            data-testid="dropdown-export"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start"
          className={cn(
            "w-48",
            isDark ? "bg-stone-900 border-stone-800" : "bg-white border-[#C9941A]/20"
          )}
        >
          <DropdownMenuItem onClick={() => handleAction('export-pdf')} className="gap-2 text-xs">
            <FileCheck className="h-4 w-4 text-red-500" /> PDF (Print-Ready)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('export-epub')} className="gap-2 text-xs">
            <BookOpen className="h-4 w-4 text-blue-500" /> ePub (eBook)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('export-docx')} className="gap-2 text-xs">
            <FileText className="h-4 w-4 text-indigo-500" /> DOCX (Word)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('export-kdp')} className="gap-2 text-xs font-semibold">
            <Zap className="h-4 w-4 text-[#C9941A]" /> KDP Package
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Credit Display */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-sm",
        isDark ? "bg-stone-800/50" : "bg-[#C9941A]/5"
      )}>
        <Zap className="h-3.5 w-3.5 text-[#C9941A]" />
        <span className={cn(
          "text-xs font-mono font-semibold",
          isDark ? "text-stone-300" : "text-[#1A1A1A]"
        )}>
          {creditBalance.toLocaleString()}
        </span>
        <span className={cn(
          "text-[9px] uppercase tracking-wider",
          isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
        )}>
          credits
        </span>
      </div>

      {/* Tier Badge */}
      <Badge 
        variant="outline" 
        className={cn(
          "text-[9px] uppercase tracking-wider font-bold",
          tierLevel === 'publisher' 
            ? "border-[#C9941A] text-[#C9941A] bg-[#C9941A]/10"
            : tierLevel === 'author'
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : isDark ? "border-stone-700 text-stone-500" : "border-[#C9941A]/30 text-[#1A1A1A]/50"
        )}
      >
        {tierLevel}
      </Badge>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#C9941A] border-t-transparent rounded-full animate-spin" />
          <span className={cn(
            "text-[10px] uppercase tracking-wider",
            isDark ? "text-stone-500" : "text-[#1A1A1A]/50"
          )}>
            Processing...
          </span>
        </div>
      )}
    </div>
  );
}
