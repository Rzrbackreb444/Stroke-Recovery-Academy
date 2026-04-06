import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Users, Clock, CheckCircle, ExternalLink, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";

const ROK_PARTNER_LINK = "https://go.mypartner.io/referral-partner/?ref=001Qk00000KW1FBIA1";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Think of someone who owns a business",
    description:
      "A neighbor, old coworker, family friend, anyone who runs a company and might need funding to grow, hire, buy equipment, or bridge a cash flow gap. You probably know more of these people than you think.",
  },
  {
    number: "02",
    icon: Clock,
    title: "Share their name and contact info",
    description:
      "That's it. Give ROK Financial the person's name, phone, and email. Their team of business financing advisors handles everything from there — the pitch, the paperwork, the approval process. You just introduced them.",
  },
  {
    number: "03",
    icon: DollarSign,
    title: "Collect your commission",
    description:
      "When the loan funds, you earn. ROK Financial works with 75+ commercial lenders and offers aggressive commission structures. No experience required. No selling. Just connecting people who need funding with people who provide it.",
  },
];

const whyItFits = [
  {
    icon: Clock,
    title: "No schedule required",
    description: "Work from your couch, your phone, whenever you have energy. Stroke recovery is unpredictable — this income model matches that reality.",
  },
  {
    icon: Zap,
    title: "Zero physical demands",
    description: "This is entirely conversation-based. You don't need two working hands, a car, or the ability to stand for hours.",
  },
  {
    icon: Shield,
    title: "Your reputation does the work",
    description: "People trust referrals from people they know. Your network — built over a lifetime before your stroke — is the asset here.",
  },
  {
    icon: TrendingUp,
    title: "Scales as you recover",
    description: "Start small with one or two referrals. As your energy and confidence grow, so can this income stream.",
  },
];

const incomeExamples = [
  { scenario: "1 small business loan funded", commission: "$200 – $800" },
  { scenario: "3 referrals funded in a month", commission: "$600 – $2,400" },
  { scenario: "1 larger commercial deal", commission: "$1,500 – $5,000+" },
];

const blogPosts = [
  {
    slug: "stroke-survivor-income-from-home",
    title: "How Stroke Survivors Can Generate Real Income From Home",
    excerpt: "Cognitive and physical limitations don't have to mean financial helplessness. Here's a realistic roadmap.",
  },
  {
    slug: "business-loan-referrals-passive-income",
    title: "Business Loan Referrals: The Simplest Passive Income Strategy Most People Overlook",
    excerpt: "If you know business owners, you have an asset worth money. Here's how the referral model works.",
  },
  {
    slug: "rebuilding-financial-confidence-after-stroke",
    title: "Rebuilding Financial Confidence After Stroke",
    excerpt: "A stroke doesn't just affect your body. Here's how to think about income, identity, and earning again.",
  },
];

export default function SurvivorIncome() {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <RecoverySEO
        title="Survivor Income Program — Earn From Home as a Stroke Survivor | Stroke Recovery Academy"
        description="Turn your network into income. Refer business owners to commercial financing through ROK Financial and earn commissions — no experience, no schedule, no physical demands. Built for stroke survivors."
        canonical="/recovery/survivor-income"
        pageType="website"
        keywords={[
          "stroke survivor income",
          "earn money after stroke",
          "passive income stroke survivor",
          "work from home stroke recovery",
          "business loan referral commissions",
          "income for disabled adults",
          "stroke recovery financial independence",
          "ROK Financial partner program",
        ]}
        breadcrumbs={[
          { name: "Recovery Hub", url: "/recovery" },
          { name: "Survivor Income", url: "/recovery/survivor-income" },
        ]}
        faq={[
          {
            question: "Can stroke survivors really earn money from loan referrals?",
            answer:
              "Yes. The ROK Financial partner program requires nothing more than connecting a business owner with their financing team. You provide a name and contact info — they do the rest and pay you when the deal funds.",
          },
          {
            question: "Do I need finance experience to refer business loans?",
            answer:
              "None at all. ROK Financial's advisors handle everything. Your only job is making the introduction. No licenses, no training, no selling.",
          },
          {
            question: "How much can a stroke survivor earn referring business loans?",
            answer:
              "Commissions vary by deal size but typically range from a few hundred dollars per funded referral to several thousand for larger commercial loans.",
          },
        ]}
      />
      <RecoveryHeader />

      <main>
        {/* Hero */}
        <section className="relative pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#C9941A] text-sm font-semibold uppercase tracking-widest mb-5">
              Survivor Income Program
            </p>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
              Turn Your Network<br />
              <span className="text-[#C9941A]">Into Income</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
              You've spent a lifetime building relationships. Stroke recovery takes your time — but it doesn't have to take your earning power. Refer business owners you know to commercial financing and collect commissions when their deal closes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={ROK_PARTNER_LINK} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-[#C9941A] text-black font-bold text-lg px-10 shadow-lg shadow-[#C9941A]/20"
                  data-testid="button-hero-apply"
                >
                  Apply as a Partner
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/recovery/blog">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#2a2a2a] text-gray-300 font-semibold text-lg px-10"
                  data-testid="button-hero-learn"
                >
                  Read the Guide
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why it fits stroke survivors */}
        <section className="py-16 border-y border-[#1a1a1a] bg-[#080808]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Why This Works for Survivors Specifically
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Most income opportunities weren't designed with stroke recovery in mind. This one fits because of how simple it actually is.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {whyItFits.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-4 p-5 rounded-xl bg-[#0a0a0a] border border-[#1e1e1e]"
                    data-testid={`benefit-card-${item.title.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#C9941A]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-[#C9941A]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3-step process */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                How It Works
              </h2>
              <p className="text-gray-500">Three steps. No selling. No experience needed.</p>
            </div>
            <div className="space-y-6">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="flex gap-6 p-7 rounded-2xl bg-[#0a0a0a] border border-[#1e1e1e]"
                    data-testid={`step-card-${step.number}`}
                  >
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <span className="text-4xl font-black text-[#C9941A]/20">{step.number}</span>
                      <div className="w-10 h-10 rounded-xl bg-[#C9941A]/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#C9941A]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Income examples */}
        <section className="py-16 border-y border-[#1a1a1a] bg-[#080808]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white mb-2">What Could You Earn?</h2>
              <p className="text-gray-500 text-sm">Estimates based on ROK Financial's typical commission structure. Actual amounts vary by deal.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {incomeExamples.map((ex) => (
                <div
                  key={ex.scenario}
                  className="p-6 rounded-xl bg-[#0a0a0a] border border-[#1e1e1e] text-center"
                  data-testid={`income-example-${ex.scenario.slice(0, 10).replace(/\s/g, "-").toLowerCase()}`}
                >
                  <p className="text-2xl font-black text-[#C9941A] mb-2">{ex.commission}</p>
                  <p className="text-sm text-gray-500">{ex.scenario}</p>
                </div>
              ))}
            </div>

            {/* What ROK Financial offers */}
            <div className="rounded-2xl border border-[#C9941A]/20 bg-[#0f0c07] p-8">
              <h3 className="text-white font-bold text-lg mb-5">What You're Connecting People To</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Access to 75+ commercial lenders",
                  "Business term loans & lines of credit",
                  "SBA loans and equipment financing",
                  "Real-time partner portal access",
                  "4.9 stars on Trustpilot (1,093+ reviews)",
                  "Dedicated partnership advisor support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-[#C9941A] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Blog posts */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black text-white">Guides & Strategies</h2>
              <Link href="/recovery/blog">
                <Button variant="outline" className="border-[#2a2a2a] text-gray-400" data-testid="link-all-blog-posts">
                  All Articles <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={`/recovery/blog/${post.slug}`}>
                  <div
                    className="group p-6 rounded-xl bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#C9941A]/30 transition-colors cursor-pointer h-full flex flex-col"
                    data-testid={`blog-card-${post.slug}`}
                  >
                    <h3 className="text-white font-bold text-sm leading-snug mb-3 group-hover:text-[#C9941A] transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to Put Your<br />
              <span className="text-[#C9941A]">Network to Work?</span>
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Apply in minutes. Free to join. Start with one referral and see what happens. There's nothing to lose and real income to gain.
            </p>
            <a href={ROK_PARTNER_LINK} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-[#C9941A] text-black font-bold text-lg px-12 shadow-lg shadow-[#C9941A]/20"
                data-testid="button-final-cta"
              >
                Apply as a Partner — It's Free
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <p className="text-xs text-gray-600 mt-4">
              Opens ROK Financial's partner application. Stroke Recovery Academy earns a referral commission on funded deals.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
