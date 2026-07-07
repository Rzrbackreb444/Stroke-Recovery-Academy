import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import {
  ArrowRight, Check, Building2, Users, Handshake, Mail,
  MessageCircle, Loader2, ChevronDown, ChevronUp, Star,
  Activity, Zap,
} from "lucide-react";

const PARTNERSHIP_TYPES = [
  {
    id: "refer",
    icon: Users,
    label: "Referral Partner",
    price: "Free",
    sub: "no commitment",
    badge: null,
    headline: "Refer patients. We do the rest.",
    body: "Give your patients a simple URL and referral code. You get a dashboard showing how many of your patients are active — no setup, no integration required.",
    includes: [
      "Branded referral link for your practice",
      "Monthly patient activity report",
      "Free staff access to the platform",
      "Co-branded handout PDF for discharge packets",
    ],
  },
  {
    id: "license",
    icon: Building2,
    label: "Facility License",
    price: "$299",
    sub: "/mo · up to 50 patients",
    badge: "Most popular",
    headline: "Platform access for your whole patient panel.",
    body: "Your patients get full premium access as part of their care plan — billed to the facility, not the patient. Includes a live dashboard for your team.",
    includes: [
      "Up to 50 active patient accounts",
      "Staff admin dashboard with compliance tracking",
      "Custom onboarding flow with your facility branding",
      "Quarterly outcomes report for your records",
      "Priority support for care coordinators",
    ],
  },
  {
    id: "cobrand",
    icon: Handshake,
    label: "Co-Brand / Research",
    price: "Custom",
    sub: "let's talk",
    badge: null,
    headline: "Large-scale or research partnerships.",
    body: "Rehab networks, hospital systems, academic research programs. White-label, data API access, bulk licensing, IRB-friendly data exports.",
    includes: [
      "Unlimited patient volume",
      "White-label or co-branded platform option",
      "API access for outcomes data",
      "Research collaboration support",
      "Custom contract + SLA",
    ],
  },
];

const WHY_ITEMS = [
  {
    icon: Activity,
    title: "The accountability gap is real",
    body: "Patients discharge with a stack of handouts. Adherence rates for home exercise programs are 30-50% at 3 months. SRA pushes that with daily accountability, AI coaching, and community.",
  },
  {
    icon: MessageCircle,
    title: "Built by a survivor, not a vendor",
    body: "Nick Kremers rebuilt himself from a Hoyer lift. The methods are his own. Patients recognise the difference between clinical content and lived experience — it drives engagement.",
  },
  {
    icon: Zap,
    title: "Zero friction for your team",
    body: "Referral partners need nothing except a URL. No EHR integration required, no IT project. Patients onboard themselves in under 5 minutes.",
  },
  {
    icon: Star,
    title: "Non-clinical — no liability territory",
    body: "SRA is explicitly non-clinical peer coaching. We're not displacing PT/OT — we're filling the 167 hours a week when the therapist isn't there.",
  },
];

const FAQ = [
  {
    q: "Does SRA replace occupational or physical therapy?",
    a: "No. SRA fills the accountability gap between clinical sessions — the 167 hours a week when the therapist isn't there. We explicitly direct patients to their healthcare team for clinical questions and new symptoms.",
  },
  {
    q: "What are the liability implications for our facility?",
    a: "SRA is a non-clinical peer coaching and accountability platform, not a medical device or healthcare service. Our medical disclaimer, crisis routing (988/911), and non-clinical framing are explicit throughout the platform.",
  },
  {
    q: "Can we get outcomes data for our patients?",
    a: "Facility license and co-brand partners receive quarterly outcomes reports covering engagement, streak data, and self-reported functional improvement. Raw data exports for research partnerships require a data use agreement.",
  },
  {
    q: "Do patients need to pay separately?",
    a: "Referral partners: yes, patients pay $19/mo or $190/yr themselves. Facility license: patients get full access at no individual cost — your facility pays a flat monthly fee. Co-brand: negotiated case-by-case.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2C2A4]/30 last:border-0">
      <button
        className="w-full text-left flex items-start justify-between gap-4 py-5"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        data-testid={`partner-faq-${q.slice(0, 15).replace(/\s/g, "-")}`}
      >
        <span className="font-semibold text-[#1C1917] text-base leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-[#C06B3E] shrink-0 mt-0.5" />
          : <ChevronDown className="w-5 h-5 text-[#78716C] shrink-0 mt-0.5" />}
      </button>
      {open && <p className="text-[#5C534D] pb-5 leading-relaxed text-sm">{a}</p>}
    </div>
  );
}

export default function Partners() {
  const { toast } = useToast();
  const [type, setType] = useState<string>("refer");
  const [form, setForm] = useState({ name: "", facility: "", email: "", role: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partners/inquiry", { ...form, partnershipType: type });
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: () => toast({ title: "Couldn't send", description: "Email us directly at partners@strokerecoveryacademy.com", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <RecoverySEO
        title="Partner with Stroke Recovery Academy — For Rehab Professionals & Facilities"
        description="Refer patients, license the platform for your facility, or co-brand with Stroke Recovery Academy. Evidence-based survivor accountability for your discharge patients."
        canonical="/partners"
      />

      {/* Hero */}
      <section className="bg-[#1A1412] pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C06B3E]/20 border border-[#C06B3E]/30 mb-8">
            <Handshake className="w-3.5 h-3.5 text-[#C06B3E]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#C06B3E]">For Rehab Professionals</span>
          </div>
          <h1 className="font-display text-[#FDFBF7] text-4xl md:text-6xl lg:text-7xl leading-[0.92] mb-6">
            Your patients do the reps.<br />
            <span className="italic font-serif text-[#C06B3E]">We make sure they show up.</span>
          </h1>
          <p className="text-[#FDFBF7]/65 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            You discharge a stroke survivor with a home program and hope for the best. We're what fills the 167 hours a week when you're not there — daily reps, AI coaching, accountability pods, and a community built entirely around survivors.
          </p>
          <Button
            size="lg"
            className="bg-[#C06B3E] hover:bg-[#A85B33] text-white h-14 px-10 rounded-full font-semibold"
            onClick={() => document.getElementById("options")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-hero-see-options"
          >
            See partnership options <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-4 text-[#FDFBF7]/30 text-sm">Referral program is free. No commitment.</p>
        </div>
      </section>

      {/* Why section */}
      <section className="bg-[#F6EFEA] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Why it works</p>
            <h2 className="font-display text-[#1C1917] text-3xl md:text-5xl leading-[0.95]">
              Not another app your patients won't open.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {WHY_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-[#E2C2A4]/30">
                <div className="w-10 h-10 rounded-xl bg-[#F6EFEA] text-[#C06B3E] flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1C1917] text-lg mb-3">{item.title}</h3>
                <p className="text-[#5C534D] text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership options */}
      <section id="options" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Three ways to partner</p>
            <h2 className="font-display text-[#1C1917] text-3xl md:text-5xl leading-[0.95]">
              Pick what fits your practice.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PARTNERSHIP_TYPES.map((p) => {
              const Icon = p.icon;
              const active = type === p.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border-2 p-7 cursor-pointer transition-all relative ${
                    active
                      ? "border-[#C06B3E] bg-[#FDF7F4] shadow-[0_4px_24px_rgba(192,107,62,0.1)]"
                      : "border-[#E2C2A4]/40 bg-white hover:border-[#C06B3E]/40"
                  }`}
                  onClick={() => setType(p.id)}
                  data-testid={`card-partnership-${p.id}`}
                >
                  {p.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-[#C06B3E] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">{p.badge}</span>
                    </div>
                  )}
                  <Icon className="w-8 h-8 text-[#C06B3E] mb-4" />
                  <div className="font-display text-[#1C1917] text-3xl mb-0.5">{p.price}</div>
                  <div className="text-[#78716C] text-xs mb-5">{p.sub}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-2">{p.label}</div>
                  <h3 className="font-bold text-[#1C1917] text-base mb-3 leading-snug">{p.headline}</h3>
                  <p className="text-[#5C534D] text-sm leading-relaxed mb-5">{p.body}</p>
                  <ul className="space-y-2.5">
                    {p.includes.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#5C534D]">
                        <Check className="w-3.5 h-3.5 text-[#C06B3E] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="bg-[#1A1412] py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Get started</p>
            <h2 className="font-display text-[#FDFBF7] text-3xl md:text-4xl mb-4 leading-[0.95]">
              Tell us about your practice.
            </h2>
            <p className="text-[#FDFBF7]/55 text-base">
              We respond within 1 business day. For referral partners, we can have you set up same-day.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-700/20 border border-green-600/40 rounded-2xl p-8 text-center">
              <Check className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <h3 className="text-[#FDFBF7] font-bold text-xl mb-2">Got it — we'll be in touch.</h3>
              <p className="text-[#FDFBF7]/60 text-sm">
                Nick or a team member will respond within 24 hours. Check your email.
              </p>
            </div>
          ) : (
            <form
              className="bg-[#2A2421] rounded-2xl p-8 space-y-5"
              onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
              data-testid="form-partner-inquiry"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">Your name</label>
                  <input
                    className="w-full bg-[#1A1412] border border-[#3A3230] rounded-lg px-4 py-2.5 text-[#FDFBF7] text-sm focus:outline-none focus:border-[#C06B3E] transition-colors placeholder:text-[#FDFBF7]/25"
                    placeholder="Dr. Sarah Chen"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    data-testid="input-partner-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">Role</label>
                  <input
                    className="w-full bg-[#1A1412] border border-[#3A3230] rounded-lg px-4 py-2.5 text-[#FDFBF7] text-sm focus:outline-none focus:border-[#C06B3E] transition-colors placeholder:text-[#FDFBF7]/25"
                    placeholder="Physical Therapist / OT / Neuro MD"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    data-testid="input-partner-role"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">Facility / Practice name</label>
                <input
                  className="w-full bg-[#1A1412] border border-[#3A3230] rounded-lg px-4 py-2.5 text-[#FDFBF7] text-sm focus:outline-none focus:border-[#C06B3E] transition-colors placeholder:text-[#FDFBF7]/25"
                  placeholder="Memorial Hospital Rehab Center"
                  value={form.facility}
                  onChange={e => setForm(f => ({ ...f, facility: e.target.value }))}
                  required
                  data-testid="input-partner-facility"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full bg-[#1A1412] border border-[#3A3230] rounded-lg px-4 py-2.5 text-[#FDFBF7] text-sm focus:outline-none focus:border-[#C06B3E] transition-colors placeholder:text-[#FDFBF7]/25"
                  placeholder="sarah.chen@hospital.org"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  data-testid="input-partner-email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">
                  Partnership interest
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {PARTNERSHIP_TYPES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        type === p.id
                          ? "bg-[#C06B3E] border-[#C06B3E] text-white"
                          : "bg-transparent border-[#3A3230] text-[#FDFBF7]/50 hover:border-[#C06B3E]/50"
                      }`}
                      onClick={() => setType(p.id)}
                      data-testid={`button-type-${p.id}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#FDFBF7]/60 uppercase tracking-wider mb-1.5">Anything else we should know</label>
                <textarea
                  className="w-full bg-[#1A1412] border border-[#3A3230] rounded-lg px-4 py-2.5 text-[#FDFBF7] text-sm focus:outline-none focus:border-[#C06B3E] transition-colors placeholder:text-[#FDFBF7]/25 resize-none"
                  rows={4}
                  placeholder="Approx. patient volume, questions, specific needs..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  data-testid="textarea-partner-message"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#C06B3E] hover:bg-[#A85B33] text-white h-12 rounded-full font-semibold"
                disabled={submitMutation.isPending}
                data-testid="button-submit-inquiry"
              >
                {submitMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  : <>Send inquiry <ArrowRight className="ml-2 h-4 w-4" /></>
                }
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FDFBF7] py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C06B3E] mb-3">Questions</p>
          <h2 className="font-display text-[#1C1917] text-3xl mb-10">Before you reach out.</h2>
          <div className="bg-white rounded-2xl border border-[#E2C2A4]/30 px-6">
            {FAQ.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#78716C]">
            More questions?{" "}
            <a href="mailto:partners@strokerecoveryacademy.com" className="text-[#C06B3E] font-semibold">
              partners@strokerecoveryacademy.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
