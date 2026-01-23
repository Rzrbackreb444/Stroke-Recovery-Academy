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
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    icon: typeof Bold;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-7 w-7 p-0 rounded-md",
            isDark 
              ? cn(
                  "text-stone-500 hover:text-stone-200 hover:bg-stone-800",
                  isActive && "bg-amber-500/20 text-amber-400"
                )
              : cn(
                  "text-stone-500 hover:text-stone-800 hover:bg-stone-100",
                  isActive && "bg-amber-100 text-amber-800"
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
      "flex flex-col h-full transition-colors duration-300",
      isDark ? "bg-stone-950" : "bg-[#FFFEF9]"
    )}>
      {/* ══════════════════════════════════════════════════════════════════════════════
          FORMATTING TOOLBAR - Glassmorphism Design
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex items-center gap-0.5 px-3 py-1.5 border-b backdrop-blur-xl overflow-x-auto",
        isDark 
          ? "bg-stone-900/50 border-stone-800/50" 
          : "bg-white/80 border-stone-200/50"
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
              isDark ? "bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30" : "bg-amber-100 text-amber-700 border-amber-200"
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
        "px-12 pt-10 pb-6 border-b",
        isDark 
          ? "bg-gradient-to-b from-stone-900/50 to-stone-950 border-stone-800/30" 
          : "bg-gradient-to-b from-white to-[#FFFEF9] border-stone-100"
      )}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={cn(
              "text-[10px] rounded-full px-2.5",
              isDark ? "border-stone-700 text-stone-400" : "bg-amber-50 border-amber-200 text-amber-700"
            )}>
              Chapter {chapterNumber}
            </Badge>
            {progress >= 100 && (
              <Badge className="text-[9px] bg-emerald-500/20 text-emerald-500 border-emerald-500/30 rounded-full px-2">
                Target Complete
              </Badge>
            )}
          </div>
          
          <h1 className={cn(
            "text-2xl font-bold tracking-tight mb-4 font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
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
              "prose max-w-none",
              isDark ? "prose-invert" : "prose-stone",
              "prose-p:leading-[1.85] prose-p:text-[16px] prose-p:font-serif prose-p:mb-5",
              isDark ? "prose-p:text-stone-300" : "prose-p:text-stone-700",
              "prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight",
              isDark ? "prose-headings:text-stone-100" : "prose-headings:text-stone-900",
              "prose-h1:text-2xl prose-h1:mt-10 prose-h1:mb-5",
              "prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4",
              "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3",
              isDark 
                ? "prose-blockquote:border-l-amber-500 prose-blockquote:bg-stone-800/50" 
                : "prose-blockquote:border-l-amber-400 prose-blockquote:bg-amber-50/50",
              "prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:italic prose-blockquote:rounded-r-lg",
              isDark ? "prose-blockquote:text-stone-400" : "prose-blockquote:text-stone-600",
              isDark ? "prose-strong:text-stone-100" : "prose-strong:text-stone-900",
              "prose-strong:font-semibold",
              isDark ? "prose-em:text-stone-300" : "prose-em:text-stone-700",
              "prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline",
              "prose-ul:my-4 prose-ol:my-4",
              isDark ? "prose-li:text-stone-300" : "prose-li:text-stone-700",
              "prose-li:mb-1",
              "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
              isDark ? "[&_.is-editor-empty:first-child::before]:text-stone-700" : "[&_.is-editor-empty:first-child::before]:text-stone-400",
              "[&_.is-editor-empty:first-child::before]:float-left",
              "[&_.is-editor-empty:first-child::before]:h-0",
              "[&_.is-editor-empty:first-child::before]:pointer-events-none",
              "[&_.is-editor-empty:first-child::before]:italic",
              "[&_.is-editor-empty:first-child::before]:font-serif"
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
        "flex items-center justify-between px-4 py-1.5 border-t text-[10px]",
        isDark 
          ? "bg-stone-900/50 border-stone-800/50 text-stone-600" 
          : "bg-white/80 border-stone-200/50 text-stone-500"
      )}>
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount.characters().toLocaleString()} characters</span>
          <span className={isDark ? "text-stone-800" : "text-stone-300"}>|</span>
          <span>{editor.storage.characterCount.words().toLocaleString()} words</span>
          <span className={isDark ? "text-stone-800" : "text-stone-300"}>|</span>
          <span>~{Math.ceil(editor.storage.characterCount.words() / 250)} pages</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Serif • 16px • 1.85 line height</span>
        </div>
      </div>
    </div>
  );
}
