import { cn } from "@/lib/utils"
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, 
  Unlink, Image as ImageIcon, Table as TableIcon, Plus, Minus, Trash2, 
  Columns, Rows, Highlighter, Palette, Type, Subscript as SubscriptIcon, 
  Superscript as SuperscriptIcon, CheckSquare, Maximize2, Minimize2, 
  Search, Replace, X, FileText, Printer, Download, Sparkles, RotateCcw, Copy 
} from 'lucide-react';

export default function ProfessionalEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Typography,
      Placeholder.configure({ 
        placeholder: 'Start forging your 200,000 word manuscript...' 
      }),
      CharacterCount.configure({ limit: 200000 }),
      Highlight,
      Link,
      Image,
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: '',
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col w-full bg-white shadow-2xl rounded-sm border border-zinc-200 overflow-hidden min-h-[85vh]">
      {/* TOOLBAR ZONE */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
        <Button 
          variant="ghost" size="sm" 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-zinc-200 text-orange-600")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" size="sm" 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-zinc-200 text-orange-600")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button 
          variant="ghost" size="sm" 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-zinc-200 text-orange-600")}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <div className="ml-auto flex items-center gap-2 px-3 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
          <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
          <span>AI Refine Enabled</span>
        </div>
      </div>

      {/* WRITING ZONE */}
      <div className="relative flex-1 p-12 md:p-20 overflow-y-auto bg-[#fafafa]">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/10" />
        <EditorContent 
          editor={editor} 
          className="prose prose-zinc max-w-none focus:outline-none font-serif text-lg leading-relaxed text-zinc-900" 
        />
      </div>

      {/* HUD ZONE */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-t border-zinc-200 text-[10px] font-mono text-zinc-500 uppercase">
        <span>Words: {editor.storage.characterCount.words()}</span>
        <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-600">
          KDP: 6x9 Print Ready
        </Badge>
      </div>
    </div>
  );
}
