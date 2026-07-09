import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import {
  ArrowRight, Check, Clock, Users, MessageCircle, Video,
  Star, ShieldCheck, Zap, Calendar, ChevronDown, ChevronUp,
  Loader2,
} from "lucide-react";
import nickPortrait from "@assets/nick-portrait-opt.webp";

const SESSION_FEATURES = [
  "60-minute private Zoom with Nick",
  "Pre-session intake form reviewed in advance",
  "Custom protocol built live — your deficits, your goals",
  "Recording sent to you within 24 hours",
  "30-day follow-up message included",
];

const INTENSIVE_FEATURES = [
  "Everything in a single session",
  "Bi-weekly 60-min Zoom calls with Nick",
  "Direct message access between sessions",
  "Progress reviewed every 2 weeks — protocol adjusted",
  "Accountability pod placement with other intensive clients",
  "Cancel anytime — no hoops",
];

const FAQ = [
  {
    q: "Is this therapy or medical advice?",
    a: "No. Nick is a stroke survivor coaching from lived experience — not a licensed therapist, physician, or clinician. Everything shared is his personal account of what worked in his own 7-year recovery. Always coordinate with your healthcare team.",
  },
  {
    q: "Who is this right for?",
    a: "Survivors who've hit a plateau and need someone who's been there. Caregivers trying to understand what the survivor is going through. Anyone who wants more than an AI — they want the person who built it.",
  },
  {
    q: "What if I can't do Zoom because of my deficits?",
    a: "We work with you. If typing is hard, Nick can do most of the talking. If video is disorienting, audio-only is fine. If you need a caregiver on the call, bring them.",
  },
  {
    q: "What's the refund policy?",
    a: "Cancel a session with 24 hours notice for a full refund. Inside 24 hours, the session is credited toward a future session (never lost). Monthly intensive refunds are prorated — if it's not working in month one, you get money back.",
  },
  {
    q: "Do I need a platform subscription first?",
    a: "No — but the sessions go deeper if you're already using the platform. Nick can pull your actual progress data, journal patterns, and Coach history to inform the session in real time.",
  },
];

type CoachingOption = "session" | "intensive";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#2A2421]/15 last:border-0">
      <button
        className="w-full text-left flex items-start justify-between gap-4 py-5"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        data-testid={`faq-toggle-${q.slice(0, 20).replace(/\s/g, "-")}`}
      >
        <span className="font-semibold text-[#1C1917] text-base leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-[#C06B3E] shrink-0 mt-0.5" />
          : <ChevronDown className="w-5 h-5 text-[#78716C] shrink-0 mt-0.5" />}
      </button>
      {open && (
        <p className="text-[#5C534D] pb-5 leading-relaxed text-sm">{a}</p>
      )}
    </div>
  );
}

export default function CoachingWithNick() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<CoachingOption>("session");

  const checkoutMutation = useMutation({
    mutationFn: async (option: CoachingOption) => {
      const res = await apiRequest("POST", "/api/coaching/checkout", {
        option,
        returnUrl: window.location.origin + "/recovery/coaching-with-nick?success=1",
      });
      return res.json() as Promise<{ url?: string; message?: string }>;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Something went wrong", description: data.message ?? "Try again.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Checkout unavailable", description: "Reach out to nick@strokerecoveryacademy.com directly.", variant: "destructive" });
    },
  });

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const success = params.get("success") === "1";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <RecoverySEO
        title="1-on-1 Coaching with Nick Kremers — Stroke Recovery Academy"
        description="Book a private coaching session with Nick Kremers — 7-year stroke survivor who went from 0% to 90% function. Real protocols. Real accountability. Survivor-to-survivor."
        canonical="/recovery/coaching-with-nick"
      />

      {success && (
        <div className="bg-green-700 text-white text-center py-3 px-4 text-sm font-medium">
          Booking confirmed. Nick will reach out within 24 hours to schedule your session.
        </div>
      )}

      {/* Hero */}
      <section className="bg-[#1A1412] pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C06B3E]/20 border border-[#C06B3E]/30 mb-8">
            <Video className="w-3.5 h-3.5 text-[#C06B3E]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C06B3E]">Private Coaching</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display text-[#FDFBF7] text-4xl md:text-6xl leading-[0.92] mb-6">
                Work directly<br />
                <span className="italic font-serif text-[#C06B3E]">with Nick.</span>
              </h1>
              <p className="text-[#FDFBF7]/65 text-lg leading-relaxed mb-8">
                The AI Coach is available 24/7 — but sometimes you need the actual person who rebuilt himself from a Hoyer lift. Nick takes a limited number of private clients for one reason: because nobody helped him, and he wishes someone had.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-13 px-8 rounded-full font-semibold"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-hero-see-options"
                >
                  See options <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-4 text-sm text-[#FDFBF7]/35">
                Not therapy. Not medical advice. Survivor-to-survivor coaching.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-[#3A3230]">
                <img src={nickPortrait} alt="Nick Kremers" className="w-full h-72 object-cover" />
              </div>
              <div className="absolute -bottom-5 -right-4 bg-[#C06B3E] rounded-2xl px-5 py-3 shadow-lg">
                <div className="text-white font-bold text-lg">7 years</div>
                <div className="text-white/80 text-xs">0% → 90% function</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-[#2A2421] border-y border-[#3A3230] py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-[#FDFBF7]/50">
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-[#C06B3E]" fill="currentColor" /> Survivor-built framework</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#C06B3E]" /> Non-clinical coaching</span>
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#C06B3E]" /> Flexible scheduling</span>
          <span className="flex items-center gap-2"><Video className="w-4 h-4 text-[#C06B3E]" /> Private Zoom session</span>
        </div>
      </div>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Choose your level</p>
            <h2 className="font-display text-[#1C1917] text-3xl sm:text-5xl leading-[0.95] mb-4">
              How much time with Nick<br />do you need?
            </h2>
            <p className="text-[#78716C] text-lg max-w-xl mx-auto">
              Both options are capped. Nick takes limited clients so every session gets his full attention.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Single session */}
            <div
              className={`rounded-2xl border-2 p-8 cursor-pointer transition-all ${
                selected === "session"
                  ? "border-[#C06B3E] bg-[#FDF7F4] shadow-[0_4px_24px_rgba(192,107,62,0.12)]"
                  : "border-[#E2C2A4]/40 bg-white hover:border-[#C06B3E]/40"
              }`}
              onClick={() => setSelected("session")}
              data-testid="card-session"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-1">Single Session</div>
                  <div className="font-display text-[#1C1917] text-4xl">$350</div>
                  <div className="text-[#78716C] text-sm mt-1">one-time · 60 minutes</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected === "session" ? "border-[#C06B3E] bg-[#C06B3E]" : "border-[#E2C2A4]"
                }`}>
                  {selected === "session" && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <ul className="space-y-3">
                {SESSION_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#5C534D]">
                    <Check className="w-4 h-4 text-[#C06B3E] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly intensive */}
            <div
              className={`rounded-2xl border-2 p-8 cursor-pointer transition-all relative overflow-hidden ${
                selected === "intensive"
                  ? "border-[#C06B3E] bg-[#FDF7F4] shadow-[0_4px_24px_rgba(192,107,62,0.12)]"
                  : "border-[#E2C2A4]/40 bg-white hover:border-[#C06B3E]/40"
              }`}
              onClick={() => setSelected("intensive")}
              data-testid="card-intensive"
            >
              <div className="absolute top-4 right-4">
                <span className="bg-[#C06B3E] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Most committed</span>
              </div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-1">Monthly Intensive</div>
                  <div className="font-display text-[#1C1917] text-4xl">$1,500</div>
                  <div className="text-[#78716C] text-sm mt-1">per month · cancel anytime</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-7 ${
                  selected === "intensive" ? "border-[#C06B3E] bg-[#C06B3E]" : "border-[#E2C2A4]"
                }`}>
                  {selected === "intensive" && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <ul className="space-y-3">
                {INTENSIVE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#5C534D]">
                    <Check className="w-4 h-4 text-[#C06B3E] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-12 text-base rounded-full font-semibold shadow-[0_2px_8px_rgba(192,107,62,0.2)] transition-all hover:-translate-y-0.5"
              onClick={() => checkoutMutation.mutate(selected)}
              disabled={checkoutMutation.isPending}
              data-testid="button-book-now"
            >
              {checkoutMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout...</>
                : <>Book {selected === "session" ? "my session" : "the intensive"} — {selected === "session" ? "$350" : "$1,500/mo"} <ArrowRight className="ml-2 h-4 w-4" /></>
              }
            </Button>
            <p className="mt-3 text-sm text-[#78716C]">
              {isAuthenticated ? "Secure checkout via Stripe." : "No account required to book."}
              {" "}Questions? <a href="mailto:nick@strokerecoveryacademy.com" className="text-[#C06B3E] underline">Email Nick directly.</a>
            </p>
          </div>
        </div>
      </section>

      {/* What a session looks like */}
      <section className="bg-[#F6EFEA] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">What actually happens</p>
          <h2 className="font-display text-[#1C1917] text-3xl md:text-4xl mb-12 leading-[0.95]">
            A session with Nick isn't a pep talk.
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Before",
                body: "You fill out a short intake: current deficits, what's stalled, what you've tried. Nick reads it before the call. You don't re-explain your whole story on Zoom.",
                icon: Clock,
              },
              {
                step: "02",
                title: "During",
                body: "60 minutes. Nick builds a protocol live — specific exercises, sequences, mindset frameworks from the Sasquatch Method — tailored to exactly where your recovery is stuck.",
                icon: Video,
              },
              {
                step: "03",
                title: "After",
                body: "Recording in 24 hours. 30-day follow-up message. If you're on the platform, the protocol goes straight into your daily routine so it's not just notes in a doc that get lost.",
                icon: Zap,
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-7 border border-[#E2C2A4]/30">
                <div className="w-10 h-10 rounded-xl bg-[#C06B3E] text-white flex items-center justify-center mb-5 font-bold text-sm">
                  {s.step}
                </div>
                <h3 className="font-bold text-[#1C1917] text-lg mb-3">{s.title}</h3>
                <p className="text-[#5C534D] text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform plug */}
      <section className="bg-[#1A1412] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <MessageCircle className="w-8 h-8 text-[#C06B3E] mx-auto mb-5" />
          <h2 className="font-display text-[#FDFBF7] text-2xl md:text-4xl mb-5 leading-[0.95]">
            Already on the platform?<br />
            <span className="italic font-serif text-[#C06B3E]">Your data lives here.</span>
          </h2>
          <p className="text-[#FDFBF7]/60 mb-8 leading-relaxed">
            Nick can pull your check-in history, Coach conversations, and progress arc before the session. The coaching hits different when it starts from your actual data — not a blank intake form.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full h-12 px-7 font-semibold">
              <a href="/recovery/dashboard">Go to my dashboard <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 border-[#FDFBF7]/20 bg-[#FDFBF7]/8 text-[#FDFBF7] hover:bg-[#FDFBF7]/15">
              <a href="/recovery/sasquatch-coach">Try the free Coach first</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FDFBF7] py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Questions</p>
          <h2 className="font-display text-[#1C1917] text-3xl mb-10">Before you book.</h2>
          <div className="bg-white rounded-2xl border border-[#E2C2A4]/30 px-6 divide-y divide-[#E2C2A4]/20">
            {FAQ.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#78716C]">
            Still have questions?{" "}
            <a href="mailto:nick@strokerecoveryacademy.com" className="text-[#C06B3E] font-semibold">
              Email Nick — he reads every one.
            </a>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#C06B3E] py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-[#FDFBF7] text-3xl sm:text-5xl mb-5 leading-[0.95]">
            Nobody watched the days in between.
          </h2>
          <p className="text-[#FDFBF7]/80 text-lg mb-8">
            Now you've got the person who lived them.
          </p>
          <Button
            size="lg"
            className="bg-[#FDFBF7] text-[#2A2421] hover:bg-[#E2C2A4] h-14 px-10 text-base rounded-full font-semibold transition-all hover:-translate-y-0.5"
            onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            data-testid="button-final-cta-book"
          >
            Book with Nick <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
