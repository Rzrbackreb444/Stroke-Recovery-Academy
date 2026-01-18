import { cn } from "@/lib/utils"
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Quote, Undo, Redo, 
  Download, Sparkles
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
    <div className="flex flex-col w-full max-w-5xl mx-auto bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-sm border border-zinc-200 overflow-hidden min-h-[90vh]">
      {/* INDUSTRIAL STUDIO TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-3 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-1 px-2 border-r border-zinc-200">
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-orange-100 text-orange-600")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-orange-100 text-orange-600")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-orange-100 text-orange-600")}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-zinc-200">
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-orange-100 text-orange-600")}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "text-orange-600")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "text-orange-600")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-zinc-200">
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().undo().run()}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().redo().run()}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
            <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-orange-700 uppercase tracking-tighter">AI Analysis Active</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase border-zinc-300">
            <Download className="h-3.5 w-3.5" /> Export KDP
          </Button>
        </div>
      </div>

      {/* THE MANUSCRIPT FORGE */}
      <div className="relative flex-1 p-16 md:p-24 overflow-y-auto bg-[#fafafa]">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/20" />
        <EditorContent 
          editor={editor} 
          className="prose prose-zinc max-w-none focus:outline-none font-serif text-xl leading-[1.8] text-zinc-900" 
        />
      </div>

      {/* STATUS HUD */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-mono font-bold text-zinc-800">
              {editor.storage.characterCount.words()} / 200,000 WORDS
            </span>
          </div>
          <div className="w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div 
              className="h-full bg-orange-500 transition-all duration-1000" 
              style={{ width: `${(editor.storage.characterCount.words() / 200000) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-[9px] font-bold border-zinc-300 px-3 py-1 text-zinc-500">
            DRAFT V1.0 // THE LAUNDROMAT DOCTRINE
          </Badge>
          <div className="flex items-center gap-1.5 text-green-600">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-widest">Cloud Sync Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
