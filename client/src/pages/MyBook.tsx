import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useAuth } from "@/hooks/useAuth";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Edit3, Eye, Download, Save,
  Clock, FileText, Sparkles, PenTool,
  CheckCircle, Loader2, ChevronDown, ChevronUp,
  Bold, Italic, UnderlineIcon, List, ListOrdered, Quote,
  Heading2, Undo, Redo, Flame, Target, Heart,
  Zap, Trophy, Share2, BookMarked
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  lastEdited: string;
}

interface RecoveryBook {
  id?: number;
  title: string;
  subtitle: string;
  chapters: Chapter[];
  wordCount: number;
  lastSaved: string | null;
}

const MEMOIR_PROMPTS = [
  // ─── ACT I: BEFORE & THE DAY ────────────────────────────────────────────────
  {
    id: "before-stroke",
    title: "Life Before the Stroke",
    prompt: "What was your life like before the stroke? What were you doing? What were your dreams? What defined you?",
    nickExcerpt: "One moment I was built like a brick wall — benching over four hundred pounds, working long days, feeling unbreakable. Football, basketball, baseball, gymnastics as a kid. If it took grit, I was in. I'd always been the strong one — the athlete, the protector, the worker.",
    nickSource: "Chapter 1 — The Day Everything Changes",
  },
  {
    id: "the-day",
    title: "The Day It Happened",
    prompt: "Walk through the day of your stroke. What do you remember? What were the first signs? Who was there?",
    nickExcerpt: "December 3, 2018 — the day they told me I'd never be the same. My left side stopped listening. My arm hung heavy, my leg dead weight, words crumbling on my tongue. I tried to tell myself it was exhaustion, dehydration — anything but what it was. But the truth hit like a sledgehammer: I'd had a massive hemorrhagic stroke.",
    nickSource: "Chapter 1 — The Day Everything Changes",
  },
  {
    id: "hospital",
    title: "The ICU: What Nobody Tells You",
    prompt: "Describe your time in the ICU and hospital. Not the sanitized version — the real one. What did it look, smell, and feel like? What did they tell you?",
    nickExcerpt: "The pain wasn't what broke me — it was the confusion. It felt like chainsaws buzzed behind my eyes. I even reached up once, sure I'd find steel under my scalp. Every beep of a monitor mocked me. In the ICU, I lost 50 pounds — down to tube feedings, then pureed foods that tasted like cardboard mush. And then came the humiliation.",
    nickSource: "Chapter 2 — ICU Hell",
  },
  {
    id: "the-body",
    title: "Spasticity, Pain & What Nobody Warns You About",
    prompt: "Describe the physical reality of your recovery. The spasms, the fatigue, the daily pain, the things your body does now that it never did before. What do people not understand about living in a post-stroke body?",
    nickExcerpt: "People see you walk through a door and think you're fine. They don't see what it costs. Every step is a negotiation. Spasticity is your muscles at war with themselves — tightening when you need them to release, releasing when you need them to hold. You learn to manage it. You don't learn to ignore it.",
    nickSource: "Chapter 7 — The Body Betrayal",
  },
  // ─── ACT II: THE DARK MIDDLE ─────────────────────────────────────────────────
  {
    id: "the-anger",
    title: "The Anger Nobody Talks About",
    prompt: "Stroke survivors get angry. At the stroke. At their body. At people who say the wrong thing. At people who are healthy. Write about that anger. When did it peak? What did it look like? How did you handle it?",
    nickExcerpt: "There's a stage before acceptance that nobody puts on the recovery timeline. I call it the furnace. Everything was rage — hot, clean, completely justified rage. At the brain that betrayed me. At the body that used to listen. At every well-meaning person who said 'at least you're alive.' Alive is not the finish line.",
    nickSource: "Chapter 9 — The Furnace Phase",
  },
  {
    id: "financial-hit",
    title: "The Financial Devastation",
    prompt: "What did the stroke cost you financially? Medical bills, lost income, disability, insurance battles? This is one of the most real parts of stroke survival that books skip. Don't skip it.",
    nickExcerpt: "Nobody warns you about the second stroke — the one that hits your bank account. The bills stack up faster than your recovery progress. You go from provider to patient. The paperwork alone could break you if the stroke didn't. This is part of the fight nobody puts on the inspirational poster.",
    nickSource: "Chapter 11 — The Money Problem",
  },
  {
    id: "relationships",
    title: "How It Changed Your Relationships",
    prompt: "How did the stroke change your relationships? Your marriage or partnership, friendships, family roles? Who showed up? Who couldn't handle it? How did the dynamic shift?",
    nickExcerpt: "A stroke tests every relationship in your life. Some people rise to it. Some disappear. Some say all the right things and do nothing. Some say nothing and carry you. You learn very quickly who was in your corner for the right reasons. That knowledge changes everything — who you trust, who you invest in, who you protect.",
    nickSource: "Chapter 10 — Who Stays",
  },
  {
    id: "going-home",
    title: "Going Home (But It Wasn't Home Anymore)",
    prompt: "What was it like returning home? What challenges did you face immediately? How had the space itself — your house, your routines — become a different place?",
    nickExcerpt: "Returning home with improvements — but a wheelchair. Bathroom autonomy became a mission. Bed transfers, the slow return of self-sufficiency. Showers instead of sponges. Every small thing I used to do without thinking became a battle to relearn. A body in motion stays in motion.",
    nickSource: "Chapter 15 — Home Again, But Different",
  },
  // ─── ACT III: THE FIGHT BACK ─────────────────────────────────────────────────
  {
    id: "support-system",
    title: "The Person Who Believed When You Didn't",
    prompt: "Who helped you through this? Was there one person — therapist, family member, stranger — who believed in your recovery before you did? What did they do? What did they say?",
    nickExcerpt: "Michael's appearance changed everything. I had doubts at first, but his dedication and passion were real. He believed I could walk again when nobody else did. Walking practice with support, ankle weakness, AFO braces — he pushed me through all of it. Some people save your life by believing in you.",
    nickSource: "Chapter 13 — Michael: My Unlikely Savior",
  },
  {
    id: "rehabilitation",
    title: "The Rehabilitation Grind",
    prompt: "Describe your rehabilitation in real detail. The exercises, the small victories, the setbacks that felt like collapse. What actually worked? What was overhyped? What did you discover by accident?",
    nickExcerpt: "Seize where you are — no denial, just raw truth. Absorb everything around you like your life depends on it, because it does. Swing boldly and experiment — try things that feel stupid. Combine what actually works. Then hammer it every single day. S.A.S.C.H. It sounds simple. It took me years to live it. And it saved everything.",
    nickSource: "Chapter 32 — The S.A.S.C.H. Formula",
  },
  {
    id: "never-zero",
    title: "The Day I Invented Never Zero",
    prompt: "Was there a specific moment, a bottom-of-the-barrel day, when you made a commitment to yourself? What was the smallest action you took that kept the streak alive? What does 'Never Zero' mean to you personally?",
    nickExcerpt: "There will be days when everything in you says stop. The exhaustion is real. The progress feels invisible. You'll want a zero day — a day where you did nothing, moved nothing, fought nothing. Never give yourself that day. One rep. One step. One breath counts. A body in motion stays in motion. Never Zero.",
    nickSource: "Chapter 19 — The Never Zero Commitment",
  },
  {
    id: "tiktok-chapter",
    title: "TikTok Was My Medicine",
    prompt: "How did sharing your story — on social media, in a group, with a therapist, or with one person — change your recovery? Why did you decide to go public? What happened when you did?",
    nickExcerpt: "Two and a half years of recovery. Then a new idea: TikTok as a recovery tool. Filming the journey, a new purpose found. The first video — a testimonial of survival. Exercise videos, an overwhelming response. Followers pouring in, hope ignited. Inspiration and self-motivation, a powerful combination.",
    nickSource: "Chapter 21 — The Seeds of Change",
  },
  // ─── ACT IV: THE SYSTEM ──────────────────────────────────────────────────────
  {
    id: "the-formula",
    title: "How I Built My Recovery System",
    prompt: "Did you develop your own routines, rituals, or framework for recovery? How did you figure out what to do each day? What principles guided you when you had no energy, no motivation, and no clear progress to point to?",
    nickExcerpt: "The S.A.S.C.H. Formula wasn't born in a day. It was built from hundreds of failed attempts, things that worked once and never again, and things that felt stupid until they didn't. You combine enough hard-won experiments and eventually you have a system. And a system beats motivation every single time.",
    nickSource: "Chapter 32 — The S.A.S.C.H. Formula Origin",
  },
  {
    id: "fear-of-second-stroke",
    title: "The Fear Nobody Talks About",
    prompt: "Do you fear another stroke? How has fear — of setbacks, of the future, of your own body — shaped your recovery? How do you manage it without letting it manage you?",
    nickExcerpt: "The second biggest fight after a stroke isn't physical. It's the fear that lives in the back of your head. Every headache is a question mark. Every moment of fatigue is a warning you're not sure is real. You learn to live inside uncertainty. That's not easy. But you learn to make it useful.",
    nickSource: "Chapter 24 — Living With the Unknown",
  },
  // ─── ACT V: THE MISSION ──────────────────────────────────────────────────────
  {
    id: "turning-point",
    title: "The Turning Point",
    prompt: "Was there a specific moment — a breakthrough, a conversation, a result — when you knew you were going to make it? Not just survive, but actually build something from this?",
    nickExcerpt: "There's a moment in recovery — and you'll know it when it hits — where the math changes. You stop calculating what you lost and start calculating what's possible. I don't know exactly when it happened for me. But I know I woke up one day and the fight felt different. Less desperate. More intentional.",
    nickSource: "Chapter 27 — The Math Changes",
  },
  {
    id: "lessons-learned",
    title: "What the Stroke Taught You",
    prompt: "What has this experience taught you — about yourself, about other people, about time, priorities, and what actually matters? What do you know now that you wish you'd known before?",
    nickExcerpt: "Never accept 'never' as final. Treat plateaus as launching pads. Use setbacks as fuel. Help others after breakthroughs. Prove impossible is just another word for 'watch me.' As long as that meat in your chest is still thumpin', your life is still pumpin'. Get knocked down five times, stand up six.",
    nickSource: "The Sasquatch Doctrine — Revolution Rules",
  },
  {
    id: "to-the-caregiver",
    title: "A Letter to the Caregiver",
    prompt: "Write directly to the people who care for stroke survivors — spouses, children, parents, friends. What do they need to hear that nobody tells them? What did they do that helped? What did they do that (without knowing it) made things harder?",
    nickExcerpt: "To everyone who sat in that waiting room, who slept in that hospital chair, who drove to every appointment without being asked: this was your stroke too. Just a different kind. Your exhaustion is real. Your grief is real. Your love is what made this possible. You deserve to be told that.",
    nickSource: "Chapter 16 — The Caregiver's Fight",
  },
  {
    id: "message-to-survivors",
    title: "What I'd Tell You on Day One",
    prompt: "If you could go back to the hospital room — yours or someone else's — on Day 1, what would you say? What does the survivor in front of you need to hear more than anything else right now?",
    nickExcerpt: "When that well-meaning doctor said, 'You'll probably never walk normally again,' I had two choices: Accept limitations and fade. Or use it as fuel to prove every expert wrong. I chose 2. And it changed EVERYTHING. If an Arkansas boy from Fort Smith who suffered massive brain damage and was told 'never' can do it — SO CAN YOU.",
    nickSource: "Foreword — The Sasquatch Battle Cry",
  },
  {
    id: "the-new-normal",
    title: "What '90%' Actually Looks Like",
    prompt: "What does your recovery look like today — honestly? Not the inspirational version, the real version. What still challenges you? What have you fully accepted? What still surprises you about the person you've become?",
    nickExcerpt: "90%+ isn't a finish line. It's a baseline. There are still hard days. Still things my body does that it didn't do before. Still moments where I catch myself trying to do something the old way and remembering that the old way is gone. The new way is good. It's just different. And different is something I've made my peace with.",
    nickSource: "Chapter 36 — The New Baseline",
  },
  {
    id: "future",
    title: "The Mission: What You're Building Now",
    prompt: "What are you building now — in your recovery, your relationships, your community, your purpose? What's the 'impossible' goal you're currently pursuing? What does your life look like when you've won?",
    nickExcerpt: "Seven years later, I'm better than I ever was — 90%+ function, still rising with breakthroughs, building StrokeRecoveryAcademy.com from Fort Smith, Arkansas, and inspiring 14.5K warriors on TikTok and 3.8K on Facebook. Your revolution starts NOW.",
    nickSource: "Foreword — January 2026",
  },
];

const MILESTONES = [
  { words: 100,   label: "First Steps",        message: "You started. That's the hardest part." },
  { words: 500,   label: "Finding Your Voice",  message: "Your story is taking shape." },
  { words: 1000,  label: "One Thousand Strong", message: "PDF export unlocked." },
  { words: 2500,  label: "Warrior's Tale",      message: "This is becoming something real." },
  { words: 5000,  label: "Short Memoir",        message: "5,000 words. You've got a story." },
  { words: 10000, label: "Half the Book",       message: "10K down. Keep hammering." },
  { words: 20000, label: "Real Manuscript",     message: "20K words — you're past the point of no return." },
  { words: 40000, label: "Published Author",    message: "KDP-ready. Book Studio is calling your name." },
];

function MemoirToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-0.5 flex-wrap p-2 border-b border-[#333] bg-[#111]">
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={`h-8 w-8 ${editor.isActive("bold") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-bold"><Bold className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={`h-8 w-8 ${editor.isActive("italic") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-italic"><Italic className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`h-8 w-8 ${editor.isActive("underline") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-underline"><UnderlineIcon className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-5 bg-[#333] mx-1" />
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`h-8 w-8 ${editor.isActive("heading") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-heading"><Heading2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`h-8 w-8 ${editor.isActive("bulletList") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-bullet-list"><List className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`h-8 w-8 ${editor.isActive("orderedList") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-ordered-list"><ListOrdered className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`h-8 w-8 ${editor.isActive("blockquote") ? "bg-[#C9941A]/20 text-[#C9941A]" : "text-gray-400"}`} data-testid="button-blockquote"><Quote className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-5 bg-[#333] mx-1" />
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="h-8 w-8 text-gray-400" data-testid="button-undo"><Undo className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="h-8 w-8 text-gray-400" data-testid="button-redo"><Redo className="h-4 w-4" /></Button>
    </div>
  );
}

function ChapterEditor({ chapterId, content, onUpdate, onSave, isSaving, prompt }: {
  chapterId: string;
  content: string;
  onUpdate: (html: string) => void;
  onSave: () => void;
  isSaving: boolean;
  prompt: typeof MEMOIR_PROMPTS[0];
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing your story here..." }),
      CharacterCount,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-gray-200 leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
    },
  });

  const wordCount = editor?.storage.characterCount?.words() || 0;

  return (
    <div className="border-t border-[#333]">
      <div className="bg-[#0D0D0D] rounded-lg mx-4 mt-4 mb-3 p-4 border border-[#C9941A]/20">
        <p className="text-[#C9941A]/80 text-sm italic mb-2">Writing Prompt:</p>
        <p className="text-gray-300 text-sm italic">"{prompt.prompt}"</p>
      </div>

      <div className="mx-4 mb-3 bg-[#111] rounded-lg border border-[#333] overflow-hidden">
        <div className="bg-[#0a0a0a] rounded-lg p-4 mx-4 mt-3 mb-3 border border-dashed border-[#333]">
          <div className="flex items-start gap-3">
            <BookMarked className="h-4 w-4 text-[#C9941A] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-[#C9941A]/70 mb-1 font-medium">How Nick wrote it — {prompt.nickSource}</p>
              <p className="text-gray-400 text-sm italic leading-relaxed">"{prompt.nickExcerpt}"</p>
            </div>
          </div>
        </div>
        <MemoirToolbar editor={editor} />
        <div data-testid={`editor-${chapterId}`}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-4">
        <span className="text-sm text-gray-500" data-testid={`text-wordcount-${chapterId}`}>
          {wordCount.toLocaleString()} words
        </span>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
            <Save className="h-3 w-3 mr-1" /> Auto-saves every 30s
          </Badge>
          <Button
            className="bg-[#C9941A] text-black"
            onClick={onSave}
            disabled={isSaving}
            data-testid={`button-save-${chapterId}`}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyBook() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"write" | "preview">("write");
  const [moodCheckin, setMoodCheckin] = useState<number | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [sessionWords, setSessionWords] = useState(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Set<string>>(new Set());
  const sessionStartWordsRef = useRef<number>(0);

  const { data: book, isLoading } = useQuery<RecoveryBook>({
    queryKey: ["/api/recovery/my-book"],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { chapterId: string; title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/recovery/my-book/chapter", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/my-book"] });
    },
    onError: () => {
      toast({ title: "Save Failed", description: "Could not save. Please try again.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (book?.chapters) {
      const contentMap: Record<string, string> = {};
      book.chapters.forEach((ch: Chapter) => {
        contentMap[ch.id] = ch.content || "";
      });
      setChapterContent(contentMap);
      sessionStartWordsRef.current = book.wordCount || 0;
    }
  }, [book]);

  const latestContentRef = useRef<Record<string, string>>({});

  const handleContentChange = useCallback((chapterId: string, html: string) => {
    setChapterContent(prev => {
      const updated = { ...prev, [chapterId]: html };
      latestContentRef.current = updated;
      return updated;
    });
    pendingSavesRef.current.add(chapterId);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const current = latestContentRef.current;
      const toSave = new Set(pendingSavesRef.current);
      pendingSavesRef.current.clear();
      toSave.forEach(id => {
        const prompt = MEMOIR_PROMPTS.find(p => p.id === id);
        if (prompt && current[id]) {
          saveMutation.mutate({ chapterId: id, title: prompt.title, content: current[id] });
        }
      });
    }, 30000);
  }, [saveMutation]);

  const handleManualSave = async (chapterId: string, title: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    pendingSavesRef.current.delete(chapterId);
    const content = chapterContent[chapterId] || "";
    await saveMutation.mutateAsync({ chapterId, title, content });
    toast({ title: "Chapter Saved", description: "Your progress has been saved." });
  };

  const countWordsInHtml = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
    return text.split(/\s+/).filter(Boolean).length;
  };

  const totalWords = Object.values(chapterContent).reduce((sum, c) => sum + countWordsInHtml(c || ""), 0);
  const chaptersStarted = Object.values(chapterContent).filter(c => c && countWordsInHtml(c) > 0).length;
  const progressPercent = (chaptersStarted / MEMOIR_PROMPTS.length) * 100;
  const currentSessionWords = Math.max(0, totalWords - sessionStartWordsRef.current);

  const currentMilestone = MILESTONES.filter(m => totalWords >= m.words).pop();
  const nextMilestone = MILESTONES.find(m => totalWords < m.words);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#C9941A] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Your Recovery Story Matters</h2>
            <p className="text-gray-400 mb-2 max-w-md mx-auto">
              Every survivor has a story worth telling. This guided memoir tool helps you
              write yours — one chapter at a time, with Nick's journey alongside you.
            </p>
            <p className="text-gray-500 text-sm mb-6">Free. Private. Yours forever.</p>
            <Link href="/api/login">
              <Button className="bg-[#C9941A] text-black font-semibold" data-testid="button-signin-mybook">
                Sign In to Start Writing
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <SEO
        title="My Recovery Story | Write Your Memoir | Stroke Recovery Academy"
        description="Write your personal stroke recovery memoir with guided prompts, Nick Kremers' excerpts alongside each chapter, rich text editing, and AI writing assistance."
        canonical="/my-book"
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 mb-2">
              <BookOpen className="h-9 w-9 text-[#C9941A]" />
              My Recovery Story
            </h1>
            <p className="text-gray-400">Your personal memoir — guided by Nick's journey</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "write" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("write")}
              className={viewMode === "write" ? "bg-[#C9941A] text-black" : "border-[#333] text-gray-400"}
              data-testid="button-write-mode"
            >
              <Edit3 className="h-4 w-4 mr-1" /> Write
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className={viewMode === "preview" ? "bg-[#C9941A] text-black" : "border-[#333] text-gray-400"}
              data-testid="button-preview-mode"
            >
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          </div>
        </div>

        {chaptersStarted === 0 && viewMode === "write" && (
          <Card className="bg-gradient-to-br from-[#C9941A]/10 to-[#1a1a1a] border-[#C9941A]/30 p-6 mb-8">
            <div className="flex items-start gap-4">
              <Sparkles className="h-8 w-8 text-[#C9941A] shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Welcome, Warrior</h3>
                <p className="text-gray-300 text-sm mb-3">
                  This is your space to write your recovery story. There are 10 guided chapters — 
                  each one comes with a writing prompt and a passage from Nick's own book to help you get started.
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  You don't need to write perfectly. You don't need to start at Chapter 1.
                  Click any chapter that speaks to you and start typing. Your work auto-saves every 30 seconds.
                </p>
                <p className="text-[#C9941A] text-sm font-medium">
                  "Your story matters. Someone out there needs to hear it." — Nick Kremers
                </p>
              </div>
            </div>
          </Card>
        )}

        {!showCheckin && viewMode === "write" && (
          <button
            onClick={() => setShowCheckin(true)}
            className="w-full mb-4 text-left"
            data-testid="button-open-checkin"
          >
            <Card className="bg-[#1a1a1a] border-[#333] p-4 hover:border-[#C9941A]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-[#C9941A]" />
                  <span className="text-sm text-gray-400">How are you feeling before you write?</span>
                </div>
                {moodCheckin !== null && (
                  <Badge className="bg-[#C9941A]/10 text-[#C9941A] border-[#C9941A]/20">
                    Mood: {moodCheckin}/10
                  </Badge>
                )}
              </div>
            </Card>
          </button>
        )}

        {showCheckin && viewMode === "write" && (
          <Card className="bg-[#1a1a1a] border-[#C9941A]/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#C9941A]" />
                Pre-Writing Check-In
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCheckin(false)} className="h-8 w-8 text-gray-400" data-testid="button-close-checkin">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Writing about recovery can bring up strong emotions. Take a second to check in with yourself.
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300">How are you feeling right now?</label>
                  <span className="text-sm font-semibold text-[#C9941A]">{moodCheckin ?? "—"}/10</span>
                </div>
                <Slider
                  value={[moodCheckin ?? 5]}
                  onValueChange={([val]) => setMoodCheckin(val)}
                  min={1} max={10} step={1}
                  className="[&_[role=slider]]:bg-[#C9941A] [&_[role=slider]]:border-[#C9941A]"
                  data-testid="slider-mood"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tough day</span>
                  <span>Feeling strong</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                No wrong answers. If you're having a hard day, that's okay — sometimes the best writing comes from the hardest moments.
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-[#1a1a1a] border-[#333] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-total-words">{totalWords.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">Total Words</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center shrink-0">
                <PenTool className="h-5 w-5 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-xl font-bold">{chaptersStarted}/{MEMOIR_PROMPTS.length}</p>
                <p className="text-gray-400 text-xs">Chapters</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-xl font-bold">{currentSessionWords}</p>
                <p className="text-gray-400 text-xs">This Session</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9941A]/20 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#C9941A]">{currentMilestone?.label || "Start Writing"}</p>
                <p className="text-gray-400 text-xs">{currentMilestone?.message || "Your first words await"}</p>
              </div>
            </div>
          </Card>
        </div>

        {nextMilestone && (
          <Card className="bg-[#1a1a1a] border-[#333] p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Next milestone: <span className="text-[#C9941A] font-medium">{nextMilestone.label}</span>
              </span>
              <span className="text-sm text-[#C9941A] font-semibold">
                {totalWords.toLocaleString()} / {nextMilestone.words.toLocaleString()}
              </span>
            </div>
            <Progress
              value={(totalWords / nextMilestone.words) * 100}
              className="h-2 bg-[#333] [&>div]:bg-gradient-to-r [&>div]:from-[#C9941A] [&>div]:to-[#E5B84C]"
            />
          </Card>
        )}

        {viewMode === "preview" ? (
          <div className="space-y-8 mb-8">
            <Card className="bg-[#1a1a1a] border-[#333] p-8">
              <h2 className="text-3xl font-bold text-center mb-2">My Recovery Story</h2>
              <p className="text-center text-gray-400 mb-8">A memoir by {user.firstName || "A Warrior"}</p>
              <Separator className="bg-[#C9941A]/30 mb-8" />
              {MEMOIR_PROMPTS.map((prompt) => {
                const content = chapterContent[prompt.id];
                const words = countWordsInHtml(content || "");
                if (words === 0) return null;
                return (
                  <div key={prompt.id} className="mb-8">
                    <h3 className="text-xl font-bold text-[#C9941A] mb-4">{prompt.title}</h3>
                    <div
                      className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: content || "" }}
                    />
                    <Separator className="bg-[#333] mt-8" />
                  </div>
                );
              })}
              {chaptersStarted === 0 && (
                <p className="text-center text-gray-500 py-12">
                  Nothing written yet. Switch to Write mode and start your first chapter.
                </p>
              )}
            </Card>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Chapters</h2>
              <p className="text-xs text-gray-500">{chaptersStarted} of {MEMOIR_PROMPTS.length} started</p>
            </div>
            <div className="space-y-3 mb-8">
              {MEMOIR_PROMPTS.map((prompt, index) => {
                const wordCount = countWordsInHtml(chapterContent[prompt.id] || "");
                const isActive = activeChapter === prompt.id;
                const hasContent = wordCount > 0;

                return (
                  <Card
                    key={prompt.id}
                    className={`bg-[#1a1a1a] border-[#333] overflow-hidden transition-all duration-300 ${isActive ? "border-[#C9941A]" : ""}`}
                    data-testid={`card-chapter-${prompt.id}`}
                  >
                    <button
                      className="w-full p-5 text-left flex items-center justify-between"
                      onClick={() => setActiveChapter(isActive ? null : prompt.id)}
                      data-testid={`button-toggle-${prompt.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${hasContent ? "bg-[#C9941A]" : "bg-[#333]"}`}>
                          {hasContent ? (
                            <CheckCircle className="h-5 w-5 text-black" />
                          ) : (
                            <span className="text-gray-400 font-semibold text-sm">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm sm:text-base">{prompt.title}</h3>
                          <p className="text-xs text-gray-500">
                            {wordCount > 0 ? `${wordCount.toLocaleString()} words` : "Not started yet"}
                          </p>
                        </div>
                      </div>
                      {isActive ? (
                        <ChevronUp className="h-5 w-5 text-[#C9941A] shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                      )}
                    </button>

                    {isActive && (
                      <ChapterEditor
                        chapterId={prompt.id}
                        content={chapterContent[prompt.id] || ""}
                        onUpdate={(html) => handleContentChange(prompt.id, html)}
                        onSave={() => handleManualSave(prompt.id, prompt.title)}
                        isSaving={saveMutation.isPending}
                        prompt={prompt}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <Card className="bg-[#1a1a1a] border-[#333] p-8 text-center mb-8">
          <Download className="h-10 w-10 text-[#C9941A] mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ready to Share Your Story?</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Export your memoir as a PDF, share an excerpt with the community,
            or take it to the Book Studio for professional publishing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" className="border-[#333] text-gray-300" disabled={totalWords < 1000} data-testid="button-export-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export PDF {totalWords < 1000 && "(1,000 words)"}
            </Button>
            <Button variant="outline" className="border-[#333] text-gray-300" disabled={totalWords < 100} data-testid="button-share-excerpt">
              <Share2 className="h-4 w-4 mr-2" />
              Share Excerpt
            </Button>
            <Link href="/book-studio">
              <Button className="bg-[#C9941A] text-black" data-testid="button-book-studio">
                <Edit3 className="h-4 w-4 mr-2" />
                Open in Book Studio
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#C9941A]/5 to-[#1a1a1a] border-[#C9941A]/20 p-6 mb-8">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8 text-[#C9941A] shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">Sasquatch Coach</h3>
              <p className="text-gray-400 text-sm">
                Stuck on a chapter? The AI writing coach can help you work through
                difficult memories, suggest what to write next, or just talk it out.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
      <SasquatchChatWidget />
    </div>
  );
}
