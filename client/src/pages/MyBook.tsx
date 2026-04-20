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
  // ─── ACT I: THE STORM ────────────────────────────────────────────────────────
  {
    id: "before-stroke",
    title: "Life Before the Stroke",
    prompt: "What was your life like before the stroke? What were you doing? What were your dreams? What defined you?",
    nickExcerpt: "Before December 3, 2018, I was built like a brick wall — benching over four hundred pounds, working for my dad's laundry equipment company, thinking I was unbreakable. What I didn't say out loud: I had anxiety so bad I used caffeine and energy shots to calm myself down. I'd done three years in drug court. I was one class away from a college degree — walked the stage, got the pictures, got the presents — then found out I'd failed the final. Shame kept me from going back. Life was already rough before my brain turned on me. I just didn't know the storm hadn't started yet.",
    nickSource: "Chapter 1 — Before the Lights Flickered",
  },
  {
    id: "the-day",
    title: "The Day It Happened",
    prompt: "Walk through the day of your stroke. What do you remember? What were the first signs? Who was there?",
    nickExcerpt: "I was standing talking to a friend when my words started slurring. My left side dropped. Lisa yelled, 'You're having a stroke!' and I slurred back something like 'Nooo Iiiiaaan noooot!' I tried to stand and my left side went completely limp. I collapsed. At the hospital, they gave my family a choice: helicopter to Little Rock, or operate right there in Fort Smith because my brain was still swelling badly. Lisa was pregnant. She made the call for immediate local surgery. That decision saved my life. The surgeon pounded fifty staples into my skull to close it, joked I was so damn thick-headed he almost couldn't get through — and I felt every single one of those staples like daggers, despite the pain meds. Pure hell.",
    nickSource: "Chapter 2 — The Day the Lights Flickered Out",
  },
  {
    id: "hospital",
    title: "The ICU: What Nobody Tells You",
    prompt: "Describe your time in the ICU and hospital. Not the sanitized version — the real one. What did it look, smell, and feel like? What did they tell you?",
    nickExcerpt: "I lost about fifty pounds in that ICU — about a month on tube feedings, then pureed food that tasted like cardboard mush. It took me an hour to swallow crushed meds in applesauce because swallowing was destroyed. One night I woke up choking on the feeding tube. Lisa ripped it out — no waiting, just action — and nurses came rushing in. No blood, just chaos, and her saving my life. The catheter was a different nightmare: it crystallized inside me, and when they removed it, it bled everywhere and hurt like fire. I kept soiling myself. I'm OCD about cleanliness and the staff never did it right — only Lisa did. She was pregnant the whole time and barely left. I sang 'Oops!... I Did It Again' every single time I couldn't control it, because the doctors said I wouldn't recognize music anymore. I recognized every word. When I wasn't singing, the morphine had me convinced the staff was trying to kill me. Felt like chainsaws in my skull. They also said I'd never walk normally again. I filed that away. It had a purpose.",
    nickSource: "Chapter 3 — ICU Hell",
  },
  {
    id: "the-body",
    title: "Spasticity, Pain & What Nobody Warns You About",
    prompt: "Describe the physical reality of your recovery. The spasms, the fatigue, the daily pain, the things your body does now that it never did before. What do people not understand about living in a post-stroke body?",
    nickExcerpt: "People see me walk through a door in 2026 and think I'm fine. They don't see what it costs. Coming out of the ICU: left arm hung like wet cement, left leg dead weight, balance gone, fine motor zero, speech crumbling. Spasticity is your muscles at war with themselves — tightening when you need them loose, letting go when you need them to hold. My remaining 10% today is fine motor control in my left hand — buttoning a shirt is slower than it should be, precise grip takes more effort. Drop foot fatigue shows up when I'm tired, a slight drag I manage but don't ignore. The brain damage hit my memory hard going in. What I didn't expect: memory processing has doubled in recent breakthroughs. Year 7 and the brain is still rewiring. It doesn't stop. Neither do I.",
    nickSource: "Chapter 4 — What They Don't Put in the Charts",
  },
  // ─── ACT II: THE DARK MIDDLE ─────────────────────────────────────────────────
  {
    id: "the-anger",
    title: "The Anger Nobody Talks About",
    prompt: "Stroke survivors get angry. At the stroke. At their body. At people who say the wrong thing. At people who are healthy. Write about that anger. When did it peak? What did it look like? How did you handle it?",
    nickExcerpt: "There's a stage before acceptance that nobody puts on the recovery timeline. I call it the furnace. Everything was rage — hot, clean, completely justified. At the brain that betrayed me. At the body that used to bench four hundred pounds and now couldn't hold a cup. At every well-meaning person who said 'at least you're alive.' Alive is not the finish line. The furnace burns everything that isn't useful. If you let it, it burns you too. The trick is to aim the fire somewhere. Not at the people around you — into the reps. Into the work. Anger as fuel burns clean if you point it right.",
    nickSource: "Chapter 6 — The Furnace Phase",
  },
  {
    id: "financial-hit",
    title: "The Financial Devastation",
    prompt: "What did the stroke cost you financially? Medical bills, lost income, disability, insurance battles? This is one of the most real parts of stroke survival that books skip. Don't skip it.",
    nickExcerpt: "I was already on SSI for mental health issues before the stroke. Already on food stamps for three years. The stroke took my ability to work for a long time — two and a half years in a wheelchair, income at zero, feeling like a burden every single day. What pulled me back wasn't inspiration. It was purpose. I started a buy-sell Facebook group to help my dad's laundry company, and it exploded into a laundromat community that now sits at 78,000 members. I built that from a wheelchair. Purpose came before the money. Then a sponsor helped me off food stamps. The Academy came after that. I rebuilt every area of my life from the bottom — physically, mentally, financially. That's the arc nobody puts on the poster.",
    nickSource: "Chapter 7 — The Money Problem",
  },
  {
    id: "relationships",
    title: "How It Changed Your Relationships",
    prompt: "How did the stroke change your relationships? Your marriage or partnership, friendships, family roles? Who showed up? Who couldn't handle it? How did the dynamic shift?",
    nickExcerpt: "Here's what I've never said cleanly: I was trying to divorce Lisa when the stroke hit. I thought she was too passive. Compared her to my mother — a strong woman — and found her lacking. When she told me she was pregnant right before everything fell apart, I doubted her. Made her prove it with a doctor. That was who I was on December 2, 2018. Then she made the call that saved my life in that operating room. Stayed in the hospital barely leaving. Held the pee cup. Gave the sponge baths. Was the only one who cleaned me right because she understood my OCD. Was pregnant through all of it. Skipped meals. We're not romantic now and haven't been since before. But what she did in that hospital has no name. It's not love in the romantic sense. It's the highest form of loyalty I've ever witnessed from another human being.",
    nickSource: "Chapter 8 — Who Stays",
  },
  {
    id: "going-home",
    title: "Going Home (But It Wasn't Home Anymore)",
    prompt: "What was it like returning home? What challenges did you face immediately? How had the space itself — your house, your routines — become a different place?",
    nickExcerpt: "I came home in a wheelchair. I left that ICU having gained enough back to survive — and went straight into two and a half years of being wheelchair-bound at 325 pounds, the weight stacking while the world sat still. My dad installed a ramp, handrails, a raised toilet seat. The house I knew became an obstacle course. Bathroom autonomy was a mission. Shower instead of sponge bath — that was a goal. Every room had a lesson in it. And my cousin Kasey stayed loyal when a lot of people drifted away once the novelty wore off. Friends disappear. Family holds. You learn the difference fast when you can't stand up on your own.",
    nickSource: "Chapter 9 — Home Again, But Different",
  },
  // ─── ACT III: THE FIGHT BACK ─────────────────────────────────────────────────
  {
    id: "support-system",
    title: "The Person Who Believed When You Didn't",
    prompt: "Who helped you through this? Was there one person — therapist, family member, stranger — who believed in your recovery before you did? What did they do? What did they say?",
    nickExcerpt: "Michael was my physical therapist at Encompass Health. Tall, lanky, unassuming — you wouldn't pick him out of a lineup as the man who would change your life. He didn't baby me or promise miracles. He said: 'We're not here to survive, Nick. We're here to rebuild.' Then he handed me a baseball bat — a five-dollar Walmart bat — for balance work, and had me chasing balloons for coordination. Seemed ridiculous. Worked. He treated me like a construction project, not a patient. His belief was my first brick. Some people save your life with a decision. Some save it by believing in you before you can believe in yourself. Michael did the second thing.",
    nickSource: "Chapter 11 — Michael: My First Brick",
  },
  {
    id: "rehabilitation",
    title: "The Rehabilitation Grind",
    prompt: "Describe your rehabilitation in real detail. The exercises, the small victories, the setbacks that felt like collapse. What actually worked? What was overhyped? What did you discover by accident?",
    nickExcerpt: "Mirror therapy: watch the good side move and trick the brain into activating the bad side. Sounds like a magic trick. Activates the same neural circuits as actually moving. I discovered it in rehab and it became non-negotiable. The baseball bat for balance — Michael's invention, not any textbook's. Weight-bearing shifts. Balloon chasing. The think-flinch-exist progression from motor imagery to actual movement. S.A.S.C.H. wasn't born in a seminar — it was built from hundreds of things that failed and a handful that didn't. When you stack enough hard-won experiments, you eventually have a system. And a system beats motivation every single time, because motivation is a weather pattern. The system is the foundation.",
    nickSource: "Chapter 12 — The Rehabilitation Grind",
  },
  {
    id: "never-zero",
    title: "The Day I Invented Never Zero",
    prompt: "Was there a specific moment, a bottom-of-the-barrel day, when you made a commitment to yourself? What was the smallest action you took that kept the streak alive? What does 'Never Zero' mean to you personally?",
    nickExcerpt: "There will be a day — probably many days — when everything in you says stop. The fatigue is real. The progress is invisible. You want a zero day: a day where you did nothing, moved nothing, fought nothing. Don't. Teeth brushing with your affected hand counts. Grooming counts. One stretch counts. One breath with intention counts. A body in motion stays in motion. The signal has to stay alive. Never Zero isn't a motivational slogan — it's the principle that kept the neural pathways firing on the days I had nothing left. It's part of why I'm at 90%+ and still rising in Year 7.",
    nickSource: "Chapter 14 — The Never Zero Commitment",
  },
  {
    id: "tiktok-chapter",
    title: "TikTok Was My Medicine",
    prompt: "How did sharing your story — on social media, in a group, with a therapist, or with one person — change your recovery? Why did you decide to go public? What happened when you did?",
    nickExcerpt: "Two and a half years in, I picked up a phone and started recording. Raw footage — walking attempts, exercise progressions, flicker moments, honest struggles. No script. No production. Just: here's what it actually looks like. The drop foot work. The AFO braces. The baseball bat. The comments flooded in: 'I'm not alone.' 'This gives me hope.' 'My husband had a stroke two years ago and we've been searching for this.' 14,500 followers on TikTok — survivors who came because of the specificity, not the inspiration. What the survivors taught me that I didn't understand until they said it: what broke their isolation wasn't the motivation. It was seeing the exact thing they were fighting, shown by someone who'd been in it and kept swinging.",
    nickSource: "Chapter 16 — TikTok as Medicine",
  },
  // ─── ACT IV: THE SYSTEM ──────────────────────────────────────────────────────
  {
    id: "the-formula",
    title: "How I Built My Recovery System",
    prompt: "Did you develop your own routines, rituals, or framework for recovery? How did you figure out what to do each day? What principles guided you when you had no energy, no motivation, and no clear progress to point to?",
    nickExcerpt: "S.A.S.C.H. took years to name and about a decade to actually live. Seize where you are — no denial, just raw truth about your current state. Absorb everything around you like your life depends on it, because it does. Swing boldly — try things that feel stupid, because sometimes the stupid thing works. I swung a five-dollar baseball bat in physical therapy. I chased balloons. I watched my good arm in a mirror and told my brain it was the bad one. Combine what actually works into something repeatable. Then Hammer it every single day, whether you feel like it or not. The system beats motivation. Motivation is a mood. The system is the structure you show up to even when the mood is gone.",
    nickSource: "Chapter 18 — The S.A.S.C.H. Formula",
  },
  {
    id: "fear-of-second-stroke",
    title: "The Fear Nobody Talks About",
    prompt: "Do you fear another stroke? How has fear — of setbacks, of the future, of your own body — shaped your recovery? How do you manage it without letting it manage you?",
    nickExcerpt: "I had harsh anxiety before the stroke — so bad I used caffeine and energy shots to calm down. Looking back, that likely contributed to the hemorrhage. So I live with this now: my habits before the stroke may have caused it. Every unusual headache is a question mark. Every strange fatigue is a warning I can't tell is real or not. I've made peace with the uncertainty because I have to. Fear of the second stroke, if you let it run the show, becomes its own kind of paralysis — a different kind than the stroke gave me, but just as limiting. I use the awareness as fuel: watch what I eat, move every single day, and never give my brain a reason to doubt I'm fighting for it.",
    nickSource: "Chapter 19 — Living With the Question Mark",
  },
  // ─── ACT V: THE MISSION ──────────────────────────────────────────────────────
  {
    id: "turning-point",
    title: "The Turning Point",
    prompt: "Was there a specific moment — a breakthrough, a conversation, a result — when you knew you were going to make it? Not just survive, but actually build something from this?",
    nickExcerpt: "April 24, 2019. Nicholas Jr. took his first breath and I was in the wheelchair watching it happen. I had promised myself — before he arrived, in that hospital bed, in the furnace — that I would play catch with him using both arms. That I would be the best father. I watched him take that first breath from the chair and something shifted in the math. You stop calculating what you lost and start calculating what's possible. It wasn't inspiration. It was a target. The most important target I've ever had. Every rep since that day has had his name on it.",
    nickSource: "Chapter 21 — The Spark",
  },
  {
    id: "lessons-learned",
    title: "What the Stroke Taught You",
    prompt: "What has this experience taught you — about yourself, about other people, about time, priorities, and what actually matters? What do you know now that you wish you'd known before?",
    nickExcerpt: "That well-meaning doctor said 'you'll probably never walk normally again' and handed me the single most useful thing anyone gave me in my recovery: a target. 'Never' became my fuel. 'Never' meant: watch me. The stroke taught me that the people who show up quietly — no announcement, no social media post about how supportive they are — those are the real ones. It taught me that shame is a prison you build yourself and stay in voluntarily. It taught me that the new life isn't the consolation prize. If you do the work, it's the point. Heart still thumpin'? Life still pumpin'. You are not done.",
    nickSource: "Chapter 22 — What 'Never' Is Good For",
  },
  {
    id: "to-the-caregiver",
    title: "A Letter to the Caregiver",
    prompt: "Write directly to the people who care for stroke survivors — spouses, children, parents, friends. What do they need to hear that nobody tells them? What did they do that helped? What did they do that (without knowing it) made things harder?",
    nickExcerpt: "To Lisa. To my dad who built the ramp and installed the handrails without being asked. To Kasey who stayed when others left. To everyone who held a pee cup, skipped a meal, drove to an appointment, did the thing that needed doing when nobody was watching. This was your recovery too. A different kind — you didn't lose the same things I lost, but you lost things. Your exhaustion is real. Your grief at watching someone you love fight to do what used to be simple — that's real too. Nobody is writing recovery books for you. So let me say it plainly: what you did was the foundation. Everything I built, I built on top of what you provided. You deserve to know that.",
    nickSource: "Chapter 23 — The Caregiver's Fight",
  },
  {
    id: "message-to-survivors",
    title: "What I'd Tell You on Day One",
    prompt: "If you could go back to the hospital room — yours or someone else's — on Day 1, what would you say? What does the survivor in front of you need to hear more than anything else right now?",
    nickExcerpt: "I'm an Arkansas boy from Fort Smith. Three years of drug court. One class short of a college degree I walked the stage for and then found out I'd failed. A massive hemorrhagic stroke that took my left side completely. Two and a half years in a wheelchair at 325 pounds. A doctor who told me I'd probably never walk normally again. And I'm at 90%+ function in Year 7, still rising, still building, still swinging. If that's possible for me — with that background, with those numbers, with that prognosis — then 'never' is just a word someone said before they saw what you're capable of. Recovery isn't healing. It's construction. And you still have everything you need to build.",
    nickSource: "Foreword — The Sasquatch Battle Cry",
  },
  {
    id: "the-new-normal",
    title: "What '90%' Actually Looks Like",
    prompt: "What does your recovery look like today — honestly? Not the inspirational version, the real version. What still challenges you? What have you fully accepted? What still surprises you about the person you've become?",
    nickExcerpt: "90%+ is not a finish line. It's my current baseline and I'm still rising. Fine motor in my left hand — buttoning a shirt, precise grip — still slower than before. Drop foot fatigue shows up when I'm tired, a slight drag I manage but don't ignore. Memory processing has doubled in recent breakthroughs — the brain rewiring in Year 7, which the doctors who told me 'never' did not predict. The version of me that exists now is not the old version restored. He's a different build. Harder in certain ways. More grateful in ways I couldn't have manufactured before December 3, 2018. The new life is not the consolation prize. If you do the work, it's the point.",
    nickSource: "Chapter 24 — The New Baseline",
  },
  {
    id: "future",
    title: "The Mission: What You're Building Now",
    prompt: "What are you building now — in your recovery, your relationships, your community, your purpose? What's the 'impossible' goal you're currently pursuing? What does your life look like when you've won?",
    nickExcerpt: "StrokeRecoveryAcademy.com exists because I needed it and it didn't exist. The 66-Day Challenge exists because the research said 66 days is when a new behavior starts to become automatic — and I needed someone to hold me to it on the days I had nothing left. The Sasquatch Coach exists because recovery happens at 3am when nobody is awake. 14,500 warriors on TikTok who started following because someone told the truth about what this actually looks like. Every survivor who finishes Day 66 becomes the proof someone else needs to start Day 1. That's the mission. That's what the wheelchair was building toward. That's what I'm swinging for now.",
    nickSource: "Chapter 25 — The Mission",
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
