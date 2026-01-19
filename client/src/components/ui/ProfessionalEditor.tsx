import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { 
  Bold, Italic, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, 
  Highlighter, Quote, Undo, Redo, 
  Download, Sparkles, Wand2, FileText,
  MoreVertical, CheckCircle2, Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from "@/lib/utils"

export default function ProfessionalEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h2>Chapter 6: The Softmount Protocol</h2>
      <p>The vibration was the first thing you noticed. Not the noise—the noise you could ignore. But the vibration of a forty-pound hardmount washer spinning at 100 G-force was something you felt in your teeth.</p>
      <p>My grandfather, Jerry, used to say that a laundromat was a living thing. "If the machines aren't shaking," he'd tell me, pointing a grease-stained finger at the row of Dexters, "then the money isn't moving."</p>
      <blockquote>
        <strong>DOCTRINE PRINCIPLE #4:</strong><br/>
        "Stability is an illusion. Your business is either growing or decaying. There is no standing still."
      </blockquote>
      <p>I looked at the lease agreement on the table. Ten years. Two five-year options. A personal guarantee that would take my house if I failed.</p>
      <p>I picked up the pen.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-zinc max-w-none focus:outline-none font-serif text-lg leading-loose text-zinc-800 min-h-[800px] selection:bg-orange-200',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="relative flex flex-col w-full h-full">
      
      {/* --- FLOATING COMMAND DECK --- */}
      {/* A floating glass bar that sits above the content */}
      <div className="sticky top-6 z-50 mx-auto mb-8 flex items-center gap-1 rounded-full border border-zinc-200/60 bg-white/80 p-1.5 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.01] hover:shadow-2xl hover:border-orange-500/20 w-fit">
        
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5 px-1">
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100 hover:text-orange-600", editor.isActive('bold') && "bg-orange-50 text-orange-600 shadow-sm")}>
            <Bold className="h-4 w-4" strokeWidth={2.5} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100 hover:text-orange-600", editor.isActive('italic') && "bg-orange-50 text-orange-600 shadow-sm")}>
            <Italic className="h-4 w-4" strokeWidth={2.5} />
          </Button>
           <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100 hover:text-orange-600", editor.isActive('strike') && "bg-orange-50 text-orange-600 shadow-sm")}>
            <Highlighter className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        {/* Structure Group */}
        <div className="flex items-center gap-0.5 px-1">
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100", editor.isActive('heading', { level: 2 }) && "bg-zinc-100 text-zinc-900")}>
            <span className="font-serif font-black text-xs">H2</span>
          </Button>
           <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100", editor.isActive('bulletList') && "bg-zinc-100 text-zinc-900")}>
            <List className="h-4 w-4" strokeWidth={2.5} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("h-8 w-8 rounded-full hover:bg-zinc-100", editor.isActive('blockquote') && "bg-zinc-100 text-zinc-900")}>
            <Quote className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-300 mx-1" />

        {/* AI & Actions Group */}
        <div className="flex items-center gap-1 pl-1">
           <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full bg-orange-50 px-3 text-[10px] font-bold uppercase tracking-wide text-orange-600 hover:bg-orange-100 hover:text-orange-700 transition-colors">
            <Sparkles className="h-3 w-3 animate-pulse" />
            AI Edit
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* --- THE PAPER SURFACE --- */}
      <div className="flex-1 px-8 pb-32">
        <EditorContent editor={editor} />
      </div>

       {/* --- LIVE TELEMETRY FOOTER --- */}
       {/* Anchored to the bottom of the "paper" container, not the screen */}
       <div className="sticky bottom-0 mt-auto flex items-center justify-between border-t border-zinc-100 bg-white/95 px-6 py-2 backdrop-blur-sm text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Cloud className="h-3 w-3" />
              <span className="font-bold">Saved</span>
            </div>
            <div className="h-3 w-[1px] bg-zinc-200" />
            <span>{editor.storage.characterCount.words()} Words</span>
            <span>{editor.storage.characterCount.characters()} Chars</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-300">Readability:</span>
            <Badge variant="outline" className="border-zinc-200 bg-zinc-50 px-1.5 py-0 text-[9px] font-bold text-zinc-600 rounded-sm">
              GRADE 8
            </Badge>
          </div>

       </div>

    </div>
  )
}