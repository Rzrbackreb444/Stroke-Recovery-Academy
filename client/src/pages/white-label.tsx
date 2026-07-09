import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import {
  ArrowRight, Check, Building2, Users, ShieldCheck, Loader2,
  ChevronDown, ChevronUp, Lock, UploadCloud, LineChart, HeartPulse,
} from "lucide-react";

const ACCENT = "#E2741B";

const HOW_IT_WORKS = [
  {
    icon: UploadCloud,
    title: "Provision seats, onboard at discharge",
    body: "Buy a block of seats, then invite survivors by email — one at a time or a whole discharge list at once. Each gets a private activation link. No EHR project, no IT ticket.",
  },
  {
    icon: HeartPulse,
    title: "Survivors get full premium access",
    body: "Daily routines, neuroplasticity reps, the AI Sasquatch Coach, and the survivor community — billed to your organization, not the survivor.",
  },
  {
    icon: LineChart,
    title: "Your team sees cohort engagement",
    body: "A live dashboard shows how your cohort is showing up: active-in-7-days, streaks, activation, and consented self-reported outcome trends. Aggregate by default.",
  },
];

const PRIVACY_ITEMS = [
  {
    icon: Lock,
    title: "Consent defaults to de-identified",
    body: "Every survivor starts contributing to aggregate cohort stats only — no name, no PII leaves. They opt in to anything more, and can revoke it any time.",
  },
  {
    icon: ShieldCheck,
    title: "No unconsented PHI, ever",
    body: "Your dashboard never shows raw journals, medical logs, or flicker logs. Small cohorts are suppressed so no individual can be re-identified.",
  },
  {
    icon: Users,
    title: "Survivor stays in control",
    body: "Each survivor chooses per-organization what you see: nothing, aggregate-only, or an identified engagement summary. Their call, always reversible.",
  },
];

const FAQ = [
  {
    q: "Is this clinical software?",
    a: "No. Stroke Recovery Academy is a non-clinical peer-accountability platform. It fills the hours between therapy sessions — it does not diagnose, treat, or replace PT/OT. We route crises to 988/911 and direct survivors to their care team for new symptoms.",
  },
  {
    q: "What can our clinicians actually see?",
    a: "By default, only de-identified aggregate cohort stats: how many survivors are active, streak and activation rates, and self-reported outcome trends across the cohort. Individual names and engagement summaries appear only for survivors who explicitly opt in to identified sharing. Raw journal, medical, and flicker text is never exposed.",
  },
  {
    q: "How does billing work?",
    a: "Seat-based, billed to your organization. You purchase a seat block; each active survivor consumes one seat. Removing a survivor frees the seat. Survivors pay nothing.",
  },
  {
    q: "How do survivors join?",
    a: "You invite them by email — individually or in bulk from a discharge list. Each survivor gets a private activation link, signs in, and lands in a consent screen that starts fully de-identified.",
  },
  {
    q: "Is our data siloed from other organizations?",
    a: "Yes. Every dashboard query is scoped to your organization. No clinician can ever see another organization's cohort.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2C2A4]/30 last:border-0">
      <button
        className="w-full text-left flex items-start justify-between gap-4 py-5"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`institution-faq-${q.slice(0, 15).replace(/\s/g, "-")}`}
      >
        <span className="font-semibold text-[#1C1917] text-base leading-snug">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#78716C] shrink-0 mt-0.5" />
        )}
      </button>
      {open && <p className="text-[#5C534D] pb-5 leading-relaxed text-sm">{a}</p>}
    </div>
  );
}

export default function InstitutionLanding() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", facility: "", email: "", role: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partners/inquiry", {
        ...form,
        partnershipType: "institutional",
      });
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: () =>
      toast({
        title: "Couldn't send",
        description: "Email us directly at partners@strokerecoveryacademy.com",
        variant: "destructive",
      }),
  });

  const canSubmit = form.name.trim() && form.facility.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <RecoverySEO
        title="For Clinics & Hospitals — Stroke Recovery Academy for Institutions"
        description="Provision Stroke Recovery Academy for your stroke survivors at discharge. Seat-based org billing, bulk onboarding, and a consent-gated cohort dashboard that defaults to de-identified. Non-clinical."
        canonical="/white-label"
      />

      {/* Hero */}
      <section className="bg-[#1A1412] pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 border"
            style={{ backgroundColor: "rgba(226,116,27,0.15)", borderColor: "rgba(226,116,27,0.3)" }}
          >
            <Building2 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
              For Clinics, Hospitals & Discharge Programs
            </span>
          </div>
          <h1 className="font-display text-[#FDFBF7] text-4xl md:text-6xl lg:text-7xl leading-[0.92] mb-6">
            Send them home with more<br />
            <span className="italic font-serif" style={{ color: ACCENT }}>than a stack of handouts.</span>
          </h1>
          <p className="text-[#FDFBF7]/65 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            Provision Stroke Recovery Academy for your whole panel. Survivors get daily accountability, AI coaching,
            and a community — billed to your organization. Your team gets a cohort dashboard that starts de-identified
            and never leaks unconsented data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="text-white h-14 px-10 rounded-full font-semibold border"
              style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
              onClick={() => document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-hero-request-access"
            >
              Request institutional access <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href="/institution">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-full font-semibold bg-white/5 backdrop-blur border-white/25 text-white"
                data-testid="button-hero-my-dashboard"
              >
                I already have an account
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[#FDFBF7]/30 text-sm">Non-clinical peer accountability. Not a medical device.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#1C1917] text-center mb-4">How it works</h2>
          <p className="text-[#5C534D] text-center max-w-2xl mx-auto mb-12">
            Three steps from discharge to a survivor doing daily reps at home.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((it) => (
              <div key={it.title} className="bg-white rounded-md p-6 border border-[#E2C2A4]/40">
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(226,116,27,0.12)" }}
                >
                  <it.icon className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <h3 className="font-semibold text-[#1C1917] text-lg mb-2">{it.title}</h3>
                <p className="text-[#5C534D] text-sm leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-[#F6EFEA] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-white border border-[#E2C2A4]/50">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#78716C]">Privacy by default</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-[#1C1917] mb-4">
              The survivor owns their data. Full stop.
            </h2>
            <p className="text-[#5C534D] max-w-2xl mx-auto">
              Consent starts at de-identified aggregate and only opens up if the survivor says so — and they can close it
              again at any time.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRIVACY_ITEMS.map((it) => (
              <div key={it.title} className="bg-white rounded-md p-6 border border-[#E2C2A4]/40">
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(226,116,27,0.12)" }}
                >
                  <it.icon className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <h3 className="font-semibold text-[#1C1917] text-lg mb-2">{it.title}</h3>
                <p className="text-[#5C534D] text-sm leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#1C1917] text-center mb-10">Questions from care teams</h2>
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 px-6">
            {FAQ.map((f) => (
              <FAQItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="inquiry" className="bg-[#1A1412] py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl text-[#FDFBF7] mb-3">Start the conversation</h2>
            <p className="text-[#FDFBF7]/60">
              Tell us about your facility and panel size. We'll set up your organization and seats.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-md p-8 text-center" data-testid="institution-inquiry-success">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "rgba(226,116,27,0.12)" }}
              >
                <Check className="w-7 h-7" style={{ color: ACCENT }} />
              </div>
              <h3 className="font-semibold text-xl text-[#1C1917] mb-2">Got it. We'll be in touch.</h3>
              <p className="text-[#5C534D] text-sm">
                We read every inquiry. Expect a reply within two business days — or email
                partners@strokerecoveryacademy.com directly.
              </p>
            </div>
          ) : (
            <form
              className="bg-white rounded-md p-6 md:p-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) submitMutation.mutate();
              }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Your name</label>
                  <input
                    className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2"
                    style={{ ["--tw-ring-color" as any]: ACCENT }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    data-testid="input-institution-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Role</label>
                  <input
                    className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2"
                    style={{ ["--tw-ring-color" as any]: ACCENT }}
                    placeholder="e.g. Care coordinator"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    data-testid="input-institution-role"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Facility / organization</label>
                <input
                  className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2"
                  style={{ ["--tw-ring-color" as any]: ACCENT }}
                  value={form.facility}
                  onChange={(e) => setForm({ ...form, facility: e.target.value })}
                  data-testid="input-institution-facility"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Work email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2"
                  style={{ ["--tw-ring-color" as any]: ACCENT }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="input-institution-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                  Panel size / anything we should know
                </label>
                <textarea
                  className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2 resize-none"
                  style={{ ["--tw-ring-color" as any]: ACCENT }}
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="input-institution-message"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit || submitMutation.isPending}
                className="w-full text-white h-12 rounded-full font-semibold border"
                style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                data-testid="button-institution-submit"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <>Request institutional access</>
                )}
              </Button>
              <p className="text-center text-xs text-[#78716C]">
                Prefer referral or co-brand options?{" "}
                <Link href="/partners" className="underline" style={{ color: ACCENT }}>
                  See all partnership types
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
