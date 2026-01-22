import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Link as LinkIcon,
  Highlighter,
  Undo,
  Redo,
  FileText,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";

interface RiverEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle?: string;
  wordCount?: number;
}

export default function RiverEditor({
  content,
  onContentChange,
  chapterTitle = "Untitled Chapter",
  wordCount = 0,
}: RiverEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Typography,
      Placeholder.configure({ 
        placeholder: 'Start writing your chapter...' 
      }),
      CharacterCount.configure({ limit: 500000 }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    icon: Icon, 
    tooltip 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: typeof Bold;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            "h-8 w-8 p-0",
            isActive && "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* FORMATTING TOOLBAR - River-style clean toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-x-auto">
        {/* Text Style Group */}
        <div className="flex items-center gap-0.5">
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

        <Separator orientation="vertical" className="h-5 mx-1.5" />

        {/* Headings Group */}
        <div className="flex items-center gap-0.5">
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

        <Separator orientation="vertical" className="h-5 mx-1.5" />

        {/* List Group */}
        <div className="flex items-center gap-0.5">
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
            tooltip="Quote"
          />
        </div>

        <Separator orientation="vertical" className="h-5 mx-1.5" />

        {/* Additional Tools */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            icon={Highlighter}
            tooltip="Highlight"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 px-2 py-0.5 border-zinc-200 dark:border-zinc-700">
            <Sparkles className="h-3 w-3 text-blue-500" />
            AI Ready
          </Badge>
        </div>
      </div>

      {/* CHAPTER HEADER */}
      <div className="px-12 pt-8 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <h1 className="text-2xl font-serif font-semibold text-zinc-900 dark:text-zinc-100">
          {chapterTitle}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{Math.ceil(wordCount / 200)} min read
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Draft
          </span>
        </div>
      </div>

      {/* EDITOR CONTENT AREA */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-12 py-8">
          <EditorContent 
            editor={editor} 
            className="prose prose-zinc dark:prose-invert max-w-none min-h-[60vh]
              prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-base
              prose-headings:font-serif prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic
              prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100
              prose-a:text-blue-600 dark:prose-a:text-blue-400
              focus:outline-none"
            data-testid="river-editor-content"
          />
        </div>
      </ScrollArea>

      {/* BOTTOM MINI STATUS */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount.characters()} characters</span>
          <span>{editor.storage.characterCount.words()} words</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Line height: 1.8</span>
          <span>Font: Serif</span>
        </div>
      </div>
    </div>
  );
}
