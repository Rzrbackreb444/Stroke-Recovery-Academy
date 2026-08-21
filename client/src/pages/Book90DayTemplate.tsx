import { useState } from "react";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Printer } from "lucide-react";

const PHASES = [
  { days: "Days 1–30", title: "Set your baseline", prompt: "What feels safe today? What does your care team want you to protect or practice?" },
  { days: "Days 31–60", title: "Repeat what works", prompt: "Which small action can you repeat consistently, and what needs to change to make it sustainable?" },
  { days: "Days 61–90", title: "Review and rebuild", prompt: "What changed? What will you keep, and what is the next realistic focus?" },
];

export default function Book90DayTemplate() {
  const [focus, setFocus] = useState("");
  const [nextRep, setNextRep] = useState("");
  const [careQuestion, setCareQuestion] = useState("");

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900">
      <RecoverySEO
        title="Free 90-Day Stroke Recovery Template | Stroke Recovery Academy"
        description="A free 90-day stroke recovery planning template from Stroke Recovery Academy. Set one focus, choose safe daily reps, review weekly, and bring better questions to your care team."
        canonical="/book/90-day-template"
        pageType="website"
        keywords={["90 day stroke recovery plan", "stroke recovery template", "stroke recovery workbook", "stroke survivor daily plan"]}
      />
      <GlobalHeader />
      <main>
        <section className="bg-[#17110b] text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <p className="text-gold text-sm font-bold uppercase tracking-[0.22em] mb-4">Free companion resource</p>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] max-w-3xl">
              Your 90-Day Recovery Template
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              A simple place to choose one focus, protect your energy, notice what changes, and return to the next safe rep.
              Use it with the book, with therapy, or on its own.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild className="bg-gold text-black font-bold hover:bg-gold/90">
                <Link href="/book/buy"><BookOpen className="mr-2 h-4 w-4" /> Choose a book edition</Link>
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                <Printer className="mr-2 h-4 w-4" /> Print this template
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-50 p-6 md:p-8 mb-8">
            <div className="flex gap-3">
              <CalendarDays className="w-6 h-6 text-amber-700 shrink-0" />
              <div>
                <h2 className="text-xl font-bold">Before you begin</h2>
                <p className="mt-2 text-neutral-700 leading-relaxed">
                  This is a planning tool—not medical advice. Choose activities and progressions only with the guidance of the clinicians who know your health, balance, medications, and current recovery needs.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {PHASES.map((phase) => (
              <section key={phase.days} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wider text-amber-700">{phase.days}</p>
                <h2 className="text-xl font-bold mt-2">{phase.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{phase.prompt}</p>
              </section>
            ))}
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-amber-700" />
              <h2 className="text-2xl font-bold">Write your next 90 days</h2>
            </div>
            <div className="grid gap-6">
              <label className="grid gap-2 font-semibold">
                My one recovery focus
                <textarea value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="Example: build confidence using my affected hand during one daily task." className="min-h-24 rounded-lg border border-neutral-300 p-3 font-normal text-neutral-700" />
              </label>
              <label className="grid gap-2 font-semibold">
                My next safe daily rep
                <textarea value={nextRep} onChange={(event) => setNextRep(event.target.value)} placeholder="Example: five minutes of a clinician-approved exercise after breakfast." className="min-h-24 rounded-lg border border-neutral-300 p-3 font-normal text-neutral-700" />
              </label>
              <label className="grid gap-2 font-semibold">
                A question for my care team
                <textarea value={careQuestion} onChange={(event) => setCareQuestion(event.target.value)} placeholder="Example: What would be a safe next progression if I can complete this consistently?" className="min-h-24 rounded-lg border border-neutral-300 p-3 font-normal text-neutral-700" />
              </label>
            </div>
            <div className="mt-8 rounded-lg bg-neutral-50 p-5">
              <p className="font-semibold">Weekly review prompt</p>
              <p className="mt-1 text-neutral-600">What felt useful? What was too much? What is one small adjustment that makes next week safer or more sustainable?</p>
            </div>
          </section>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 rounded-2xl bg-[#17110b] p-7 text-white">
            <div>
              <p className="font-display text-2xl">Want the full recovery playbook?</p>
              <p className="text-white/65 mt-1">Read the free sample or choose the digital or print Academy edition.</p>
            </div>
            <Link href="/book/buy" className="inline-flex shrink-0 items-center font-bold text-gold hover:text-gold/80">
              Explore the book <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}