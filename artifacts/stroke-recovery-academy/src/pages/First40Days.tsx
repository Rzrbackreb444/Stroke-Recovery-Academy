import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { Flame, Download, Check, ArrowRight, Loader2, Mail } from "lucide-react";

const phases = [
  {
    range: "Days 1–10",
    title: "Survive. Reframe. Refuse the verdict.",
    points: [
      "Treat every prognosis as a data point, not a verdict",
      "Run S.O.S. every morning — Survive, Organize, Strive",
      "Know the window: rewiring density is highest in the first 30–180 days",
    ],
  },
  {
    range: "Days 11–25",
    title: "Send the signal. Every day.",
    points: [
      "THINK work: three 10-minute blocks a day on one muscle",
      "Nick's toe did nothing for 37 straight days — he kept sending the signal",
      "Never Zero: one honest rep, every single day",
    ],
  },
  {
    range: "Days 26–40",
    title: "Build the system that outlasts motivation.",
    points: [
      "Start a flicker log — every tiny sign of progress is evidence",
      "Log one swing and one flicker every day",
      "Recruit the person who says \"try again\" instead of \"poor you\"",
    ],
  },
];

export default function First40Days() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [result, setResult] = useState<{ message: string; downloadUrl: string; alreadySubscribed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/first-40-days/subscribe", { email, firstName });
      return res.json();
    },
    onSuccess: (data) => {
      setError(null);
      setResult(data);
    },
    onError: (err: any) => {
      setError(err?.message?.replace(/^\d+:\s*/, "") || "Something went wrong. Try again.");
    },
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <RecoverySEO
        title="The First 40 Days — Free Stroke Recovery Field Guide | Stroke Recovery Academy"
        description="A free field guide to the first 40 days after a stroke, built from Nick Kremers' real recovery arc — the paved-road plasticity window, S.O.S. mornings, THINK signal work, Never Zero, and the day-41 toe flicker that started everything."
        canonical="/recovery/first-40-days"
        pageType="article"
        author="Nick Kremers"
        keywords={[
          "first 40 days after stroke",
          "what to do after a stroke",
          "stroke recovery first weeks",
          "stroke recovery guide free",
          "neuroplasticity window stroke",
          "Nick Kremers",
        ]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "The First 40 Days", url: "/recovery/first-40-days" }]}
        faq={[
          {
            question: "What should I do in the first 40 days after a stroke?",
            answer:
              "The first 30–180 days after a stroke are when the brain's rewiring density is highest. The First 40 Days guide breaks that window into three phases: survive and reframe (days 1–10), daily signal work (days 11–25), and building a system that outlasts motivation (days 26–40). It's lived experience from a survivor who went 0% to 90%+ — not medical advice.",
          },
          {
            question: "Is The First 40 Days guide really free?",
            answer:
              "Yes. Enter your email and the PDF arrives in your inbox in about a minute, along with a short series of follow-up emails from Nick. Unsubscribe anytime.",
          },
        ]}
      />
      <RecoveryHeader />

      {/* Hero + capture */}
      <section className="relative bg-[#1A1412] overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(192,107,62,0.18),_transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDFBF7]/8 border border-[#C06B3E]/30 mb-6">
            <Flame className="w-3.5 h-3.5 text-[#C06B3E]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FDFBF7]/80">Free field guide · No catch</span>
          </div>
          <h1 className="font-display text-[#FDFBF7] text-4xl sm:text-5xl md:text-7xl leading-[0.95] mb-6">
            The First 40 Days.<br />
            <span className="italic font-serif text-[#C06B3E]">The window that matters most.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#FDFBF7]/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            After Nick's stroke, a doctor said he'd probably never walk normally again. Thirty-seven days of signal work later, nothing had moved. On day 41, his toe lifted. This free guide is those 40 days — organized so you can run them.
          </p>

          {result ? (
            <div className="max-w-xl mx-auto bg-[#0F0C0A] border border-[#3A3230] rounded-3xl p-8 text-left" data-testid="card-first40-success">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#C06B3E]/15 border border-[#C06B3E]/40 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#C06B3E]" />
                </div>
                <p className="text-[#FDFBF7] font-semibold" data-testid="text-first40-message">{result.message}</p>
              </div>
              <p className="text-[#FDFBF7]/60 text-sm mb-6">
                {result.alreadySubscribed
                  ? "No new email this time — but the guide is one click away."
                  : "Can't wait? Grab the PDF right now."}
              </p>
              <Button
                asChild
                className="bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full font-semibold"
                data-testid="button-first40-download"
              >
                <a href={result.downloadUrl}>
                  <Download className="w-4 h-4 mr-2" /> Download the PDF
                </a>
              </Button>
            </div>
          ) : (
            <form
              className="max-w-xl mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (!subscribe.isPending) subscribe.mutate();
              }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 bg-[#0F0C0A] border-[#3A3230] text-[#FDFBF7] placeholder:text-[#FDFBF7]/40 rounded-full px-5 sm:max-w-[180px]"
                  data-testid="input-first40-name"
                />
                <Input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[#0F0C0A] border-[#3A3230] text-[#FDFBF7] placeholder:text-[#FDFBF7]/40 rounded-full px-5 flex-1"
                  data-testid="input-first40-email"
                />
                <Button
                  type="submit"
                  disabled={subscribe.isPending}
                  className="h-12 bg-[#C06B3E] hover:bg-[#A85B33] text-white rounded-full font-semibold px-7"
                  data-testid="button-first40-submit"
                >
                  {subscribe.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" /> Send me the guide
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-[#E2741B] text-sm mt-3" data-testid="text-first40-error">{error}</p>
              )}
              <p className="text-[#FDFBF7]/40 text-xs mt-4">
                Free PDF + a short email series from Nick. Unsubscribe anytime. Not medical advice — lived experience only.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* What's inside */}
      <section className="bg-[#FDFBF7] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-bold tracking-widest uppercase text-[#C06B3E] mb-4">What's inside</p>
            <h2 className="font-display text-[#1C1917] text-3xl sm:text-4xl md:text-5xl">Three phases. One daily card. Zero fluff.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {phases.map((p, i) => (
              <div
                key={i}
                className="border border-[#E2C2A4]/30 rounded-3xl p-7 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                data-testid={`card-first40-phase-${i}`}
              >
                <p className="text-xs font-bold tracking-widest uppercase text-[#C06B3E] mb-3">{p.range}</p>
                <h3 className="text-xl font-bold text-[#2A2421] mb-4">{p.title}</h3>
                <ul className="space-y-3">
                  {p.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[#5C534D] leading-relaxed">
                      <Check className="w-4 h-4 text-[#C06B3E] mt-1 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day 41 pull quote + next step */}
      <section className="bg-[#F5F0EB] py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <blockquote className="font-serif italic text-[#1C1917] text-2xl sm:text-3xl leading-snug mb-6">
            "If you are in week three and the muscle has not moved, you are not failing. You are on day three of forty-one. Keep sending the signal."
          </blockquote>
          <p className="text-[#78716C] mb-10">— Nick Kremers, The Ultimate Stroke Recovery Revolution</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-10 rounded-full font-semibold"
              data-testid="button-first40-start"
            >
              <Link href="/recovery/onboarding">Start your recovery — 7 days free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 rounded-full border-[#E2C2A4]/40 bg-white text-[#1C1917]"
              data-testid="button-first40-premium"
            >
              <Link href="/recovery/premium">
                See Premium <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
