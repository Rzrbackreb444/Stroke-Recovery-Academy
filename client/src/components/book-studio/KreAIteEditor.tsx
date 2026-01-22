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
}: KreAIteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Typography,
      Placeholder.configure({ 
        placeholder: 'Start writing your chapter...',
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
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
            "h-7 w-7 p-0 rounded text-stone-500 hover:text-blue-600 hover:bg-blue-50",
            isActive && "bg-blue-100 text-blue-700"
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ══════════════════════════════════════════════════════════════════════
          FORMATTING TOOLBAR - Modern Clean
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-stone-150 bg-stone-50/50 overflow-x-auto">
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

        <div className="w-px h-4 bg-stone-200 mx-1" />

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

        <div className="w-px h-4 bg-stone-200 mx-1" />

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

        <div className="w-px h-4 bg-stone-200 mx-1" />

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

        <div className="w-px h-4 bg-stone-200 mx-1" />

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
            <Badge className="h-5 bg-blue-100 text-blue-700 border-blue-200 gap-1 text-[9px] font-medium rounded">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Generating
            </Badge>
          )}
          {polishProgress?.isPolishing && (
            <Badge className="h-5 bg-violet-100 text-violet-700 border-violet-200 gap-1 text-[9px] font-medium rounded">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" />
              {polishProgress.currentPass || 'Polishing'}
            </Badge>
          )}
          {!isGenerating && !polishProgress?.isPolishing && (
            <Badge variant="outline" className="h-5 bg-emerald-50 border-emerald-200 text-emerald-700 gap-1 text-[9px] rounded">
              <Zap className="h-2.5 w-2.5" />
              Ready
            </Badge>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CHAPTER HEADER - Clean & Modern
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-12 pt-8 pb-5 bg-gradient-to-b from-stone-50/80 to-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant="outline" className="text-[9px] h-5 bg-blue-50 border-blue-200 text-blue-700 rounded">
              Chapter {chapterNumber}
            </Badge>
            {progress >= 100 && (
              <Badge variant="outline" className="text-[9px] h-5 bg-emerald-50 border-emerald-200 text-emerald-700 rounded">
                Complete
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-3">
            {chapterTitle}
          </h1>
          
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {wordCount.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {targetWordCount.toLocaleString()} target
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{Math.ceil(wordCount / 200)} min
            </span>
          </div>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  progress >= 100 ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-stone-500 w-8 text-right">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Generate CTA */}
          {wordCount === 0 && onGenerateChapter && (
            <div className="mt-5 flex items-center gap-2">
              <Button
                onClick={onGenerateChapter}
                disabled={isGenerating}
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-1.5 text-xs rounded"
                data-testid="generate-chapter-inline"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pen className="h-3.5 w-3.5" />
                )}
                Generate Chapter
              </Button>
              <span className="text-[10px] text-stone-400">or start writing</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          EDITOR - Writing Canvas
      ══════════════════════════════════════════════════════════════════════ */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-12 py-8">
          <EditorContent 
            editor={editor} 
            className="prose prose-stone max-w-none
              prose-p:text-stone-700 prose-p:leading-relaxed prose-p:text-[15px] prose-p:mb-4
              prose-headings:text-stone-900 prose-headings:font-semibold
              prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
              prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-stone-600 prose-blockquote:rounded-r
              prose-strong:text-stone-900 prose-strong:font-semibold
              prose-em:text-stone-700
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-ul:my-3 prose-ol:my-3
              prose-li:text-stone-700 prose-li:mb-0.5
              [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] 
              [&_.is-editor-empty:first-child::before]:text-stone-400 
              [&_.is-editor-empty:first-child::before]:float-left 
              [&_.is-editor-empty:first-child::before]:h-0 
              [&_.is-editor-empty:first-child::before]:pointer-events-none 
              [&_.is-editor-empty:first-child::before]:italic"
            data-testid="kreaite-editor-content"
          />
        </div>
        
        <div className="h-24" />
      </ScrollArea>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER - Stats
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-stone-150 bg-stone-50/50 text-[9px] text-stone-500">
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount.characters().toLocaleString()} chars</span>
          <span className="text-stone-300">|</span>
          <span>{editor.storage.characterCount.words().toLocaleString()} words</span>
          <span className="text-stone-300">|</span>
          <span>~{Math.ceil(editor.storage.characterCount.words() / 250)} pages</span>
        </div>
        <span>Line Height: 1.6</span>
      </div>
    </div>
  );
}
