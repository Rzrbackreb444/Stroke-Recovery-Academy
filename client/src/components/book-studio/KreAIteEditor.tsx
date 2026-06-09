import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Undo,
  Redo,
  FileText,
  Clock,
  Target,
  Sparkles,
  Loader2,
  Zap,
  Pen,
  Type,
} from "lucide-react";
import type { PolishProgress } from "@/lib/contexts/BookStudioContext";

interface KreAIteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle?: string;
  chapterNumber?: number;
  wordCount?: number;
  targetWordCount?: number;
  isGenerating?: boolean;
  onGenerateChapter?: () => void;
  onPolish?: () => void;
  polishProgress?: PolishProgress;
  minimal?: boolean;
  theme?: 'stone' | 'ink';
}

export default function KreAIteEditor({
  content,
  onContentChange,
  chapterTitle = "Untitled Chapter",
  chapterNumber = 1,
  wordCount = 0,
  targetWordCount = 3000,
  isGenerating = false,
  onGenerateChapter,
  onPolish,
  polishProgress,
  minimal = false,
  theme = 'stone',
}: KreAIteEditorProps) {
  const isDark = theme === 'ink';
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Typography,
      Placeholder.configure({ 
        placeholder: 'Begin writing your story...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({ limit: 500000 }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[60vh]',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full",
        isDark ? "bg-stone-950" : "bg-[#FFFEF9]"
      )}>
        <Loader2 className={cn(
          "h-6 w-6 animate-spin",
          isDark ? "text-amber-500" : "text-amber-600"
        )} />
      </div>
    );
  }

  const progress = Math.min((wordCount / targetWordCount) * 100, 100);

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    icon: Icon, 
    tooltip,
    testId,
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    icon: typeof Bold;
    tooltip: string;
    testId?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          data-testid={testId || `button-${tooltip.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
          className={cn(
            "h-8 w-8 p-0 rounded-lg transition-all duration-150",
            isDark 
              ? cn(
                  "text-stone-400 hover-elevate",
                  isActive && "bg-blue-500/20 text-blue-400 shadow-sm"
                )
              : cn(
                  "text-slate-500 hover-elevate",
                  isActive && "bg-blue-50 text-blue-600 shadow-sm"
                )
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );

  // Minimal Focus Mode
  if (minimal) {
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto py-16">
            <div className="mb-8">
              <Badge variant="outline" className={cn(
                "text-[10px] mb-2",
                isDark ? "border-stone-700 text-stone-500" : ""
              )}>
                Chapter {chapterNumber}
              </Badge>
              <h1 className={cn(
                "text-3xl font-serif font-bold tracking-tight",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                {chapterTitle}
              </h1>
            </div>
            <EditorContent 
              editor={editor} 
              className={cn(
                "prose max-w-none",
                isDark ? "prose-invert" : "prose-stone",
                "prose-p:text-lg prose-p:leading-[1.9] prose-p:font-serif prose-p:mb-6",
                "prose-headings:font-serif prose-headings:font-bold",
                "prose-blockquote:border-l-amber-500 prose-blockquote:italic",
                "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                "[&_.is-editor-empty:first-child::before]:text-stone-400",
                "[&_.is-editor-empty:first-child::before]:float-left",
                "[&_.is-editor-empty:first-child::before]:h-0",
                "[&_.is-editor-empty:first-child::before]:pointer-events-none",
                "[&_.is-editor-empty:first-child::before]:italic"
              )}
              data-testid="kreaite-editor-content"
            />
          </div>
        </ScrollArea>
        <div className={cn(
          "flex items-center justify-center py-2 text-[10px]",
          isDark ? "text-stone-600" : "text-stone-400"
        )}>
          {editor.storage.characterCount.words().toLocaleString()} words
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-200",
      isDark ? "bg-stone-950" : "bg-slate-50"
    )}>
      {/* ══════════════════════════════════════════════════════════════════════════════
          FORMATTING TOOLBAR - Glassmorphism Design
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex items-center gap-1 px-4 py-2.5 border-b overflow-x-auto",
        isDark 
          ? "bg-stone-900/80 border-stone-800/60" 
          : "bg-white border-slate-200/80"
      )}>
        {/* Text Formatting */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            tooltip="Bold (⌘B)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            tooltip="Italic (⌘I)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={UnderlineIcon}
            tooltip="Underline (⌘U)"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={Strikethrough}
            tooltip="Strikethrough"
          />
        </div>

        <div className={cn("w-px h-4 mx-1", isDark ? "bg-stone-800" : "bg-stone-200")} />

        {/* Headings */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={Heading1}
            tooltip="Heading 1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={Heading2}
            tooltip="Heading 2"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            icon={Heading3}
            tooltip="Heading 3"
          />
        </div>

        <div className={cn("w-px h-4 mx-1", isDark ? "bg-stone-800" : "bg-stone-200")} />

        {/* Lists */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            tooltip="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={ListOrdered}
            tooltip="Numbered List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={Quote}
            tooltip="Block Quote"
          />
        </div>

        <div className={cn("w-px h-4 mx-1", isDark ? "bg-stone-800" : "bg-stone-200")} />

        {/* Alignment */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            icon={AlignLeft}
            tooltip="Align Left"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            icon={AlignCenter}
            tooltip="Center"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            icon={AlignRight}
            tooltip="Align Right"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            icon={AlignJustify}
            tooltip="Justify"
          />
        </div>

        <div className={cn("w-px h-4 mx-1", isDark ? "bg-stone-800" : "bg-stone-200")} />

        {/* Extras */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            icon={Highlighter}
            tooltip="Highlight"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={Undo}
            tooltip="Undo"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={Redo}
            tooltip="Redo"
          />
        </div>

        {/* Right - Status */}
        <div className="ml-auto flex items-center gap-1.5">
          {isGenerating && (
            <Badge className={cn(
              "h-5 gap-1 text-[9px] font-medium rounded-full px-2",
              isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-700 border-blue-200"
            )}>
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Generating
            </Badge>
          )}
          {polishProgress?.isPolishing && (
            <Badge className={cn(
              "h-5 gap-1 text-[9px] font-medium rounded-full px-2",
              isDark ? "bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30" : "bg-amber-100 text-amber-700 border-amber-200"
            )}>
              <Sparkles className="h-2.5 w-2.5 animate-pulse" />
              {polishProgress.currentPass || 'Polishing'}
            </Badge>
          )}
          {!isGenerating && !polishProgress?.isPolishing && (
            <Badge variant="outline" className={cn(
              "h-5 gap-1 text-[9px] rounded-full px-2",
              isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            )}>
              <Zap className="h-2.5 w-2.5" />
              Ready
            </Badge>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          CHAPTER HEADER - Elegant Design with Progress
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "px-12 pt-12 pb-8 border-b",
        isDark 
          ? "bg-gradient-to-b from-stone-900/80 to-stone-950 border-stone-800/40" 
          : "bg-gradient-to-b from-white to-slate-50/50 border-slate-200/60"
      )}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className={cn(
              "text-[11px] rounded-full px-3 py-0.5 font-medium",
              isDark ? "border-stone-600 text-stone-400 bg-stone-800/50" : "bg-slate-100 border-slate-300 text-slate-600"
            )}>
              Chapter {chapterNumber}
            </Badge>
            {progress >= 100 && (
              <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30 rounded-full px-2.5 font-medium">
                Target Complete
              </Badge>
            )}
          </div>
          
          <h1 className={cn(
            "text-3xl font-bold tracking-tight mb-5 font-['Playfair_Display',_serif]",
            isDark ? "text-white" : "text-slate-900"
          )}>
            {chapterTitle}
          </h1>
          
          <div className={cn(
            "flex items-center gap-5 text-xs",
            isDark ? "text-stone-500" : "text-stone-500"
          )}>
            <span className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {wordCount.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {targetWordCount.toLocaleString()} target
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              ~{Math.ceil(wordCount / 200)} min read
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className={cn(
              "flex-1 h-1.5 rounded-full overflow-hidden",
              isDark ? "bg-stone-800" : "bg-stone-200"
            )}>
              <div 
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  progress >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={cn(
              "text-[10px] font-semibold w-10 text-right",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Generate CTA for empty chapters */}
          {wordCount === 0 && onGenerateChapter && (
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={onGenerateChapter}
                disabled={isGenerating}
                className="h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 gap-2 text-xs rounded-lg"
                data-testid="generate-chapter-inline"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pen className="h-3.5 w-3.5" />
                )}
                Generate Chapter
              </Button>
              <span className={cn(
                "text-[11px]",
                isDark ? "text-stone-600" : "text-stone-400"
              )}>or start writing manually</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          EDITOR CONTENT - Professional Writing Canvas
      ══════════════════════════════════════════════════════════════════════════════ */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-12 py-10">
          <EditorContent 
            editor={editor} 
            className={cn(
              "prose prose-lg max-w-none",
              isDark ? "prose-invert" : "",
              "[&_p]:font-['Source_Serif_4',_'Libre_Baskerville',_'Georgia',_serif]",
              "[&_p]:text-[18px] [&_p]:leading-[1.9] [&_p]:tracking-[-0.01em] [&_p]:mb-6",
              isDark ? "[&_p]:text-stone-200" : "[&_p]:text-slate-700",
              "[&_h1]:font-['Playfair_Display',_serif] [&_h1]:font-bold [&_h1]:tracking-tight",
              "[&_h2]:font-['Playfair_Display',_serif] [&_h2]:font-semibold [&_h2]:tracking-tight",
              "[&_h3]:font-['Playfair_Display',_serif] [&_h3]:font-medium",
              isDark ? "[&_h1]:text-white [&_h2]:text-stone-100 [&_h3]:text-stone-200" : "[&_h1]:text-slate-900 [&_h2]:text-slate-800 [&_h3]:text-slate-700",
              "[&_h1]:text-3xl [&_h1]:mt-12 [&_h1]:mb-6",
              "[&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-5",
              "[&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4",
              isDark 
                ? "[&_blockquote]:border-l-blue-400 [&_blockquote]:bg-blue-950/30" 
                : "[&_blockquote]:border-l-blue-500 [&_blockquote]:bg-blue-50/60",
              "[&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:italic [&_blockquote]:rounded-r-xl [&_blockquote]:my-8",
              "[&_blockquote]:font-['Source_Serif_4',_serif] [&_blockquote]:text-[17px]",
              isDark ? "[&_blockquote]:text-blue-200" : "[&_blockquote]:text-blue-900",
              isDark ? "[&_strong]:text-white" : "[&_strong]:text-slate-900",
              "[&_strong]:font-semibold",
              isDark ? "[&_em]:text-stone-300" : "[&_em]:text-slate-600",
              "[&_a]:text-blue-500 [&_a]:no-underline hover:[&_a]:underline [&_a]:font-medium",
              "[&_ul]:my-6 [&_ol]:my-6 [&_ul]:pl-6 [&_ol]:pl-6",
              isDark ? "[&_li]:text-stone-200" : "[&_li]:text-slate-700",
              "[&_li]:mb-2 [&_li]:leading-[1.8] [&_li]:font-['Source_Serif_4',_serif]",
              "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
              isDark ? "[&_.is-editor-empty:first-child::before]:text-stone-600" : "[&_.is-editor-empty:first-child::before]:text-slate-400",
              "[&_.is-editor-empty:first-child::before]:float-left",
              "[&_.is-editor-empty:first-child::before]:h-0",
              "[&_.is-editor-empty:first-child::before]:pointer-events-none",
              "[&_.is-editor-empty:first-child::before]:italic",
              "[&_.is-editor-empty:first-child::before]:font-['Source_Serif_4',_serif]",
              "[&_::selection]:bg-blue-200 dark:[&_::selection]:bg-blue-800"
            )}
            data-testid="kreaite-editor-content"
          />
        </div>
        
        {/* Bottom padding for comfortable scrolling */}
        <div className="h-32" />
      </ScrollArea>

      {/* ══════════════════════════════════════════════════════════════════════════════
          FOOTER STATUS - Character & Word Stats
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex items-center justify-between gap-4 px-6 py-2.5 border-t text-[11px] font-medium",
        isDark 
          ? "bg-stone-900/60 border-stone-800/50 text-stone-500" 
          : "bg-white border-slate-200/70 text-slate-500"
      )}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={isDark ? "text-stone-600" : "text-slate-400"}>Words:</span>
            {editor.storage.characterCount.words().toLocaleString()}
          </span>
          <span className={isDark ? "text-stone-700" : "text-slate-300"}>·</span>
          <span className="flex items-center gap-1.5">
            <span className={isDark ? "text-stone-600" : "text-slate-400"}>Characters:</span>
            {editor.storage.characterCount.characters().toLocaleString()}
          </span>
          <span className={isDark ? "text-stone-700" : "text-slate-300"}>·</span>
          <span className="flex items-center gap-1.5">
            <span className={isDark ? "text-stone-600" : "text-slate-400"}>Pages:</span>
            ~{Math.ceil(editor.storage.characterCount.words() / 250)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px]",
            isDark ? "bg-stone-800 text-stone-400" : "bg-slate-100 text-slate-500"
          )}>
            Source Serif 4
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px]",
            isDark ? "bg-stone-800 text-stone-400" : "bg-slate-100 text-slate-500"
          )}>
            18px
          </span>
        </div>
      </div>
    </div>
  );
}
