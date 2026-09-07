import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Download, Truck, Check, Loader2, BookOpen, BookMarked,
  ChevronDown, FileText, ArrowRight, Star
} from "lucide-react";
import { safeJsonLd } from "@/lib/safeJsonLd";

interface Edition {
  id: number;
  editionType: string;
  price: number;
  currency: string;
}

interface Listing {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string;
  pageCount: number;
  wordCount: number;
  editions: Edition[];
}

const INSIDE_ROWS = [
  { label: "Chapters", value: "30 + 9 Tribe case studies" },
  { label: "Appendices", value: "17, including the full 90-Day Breakthrough Program" },
  { label: "Figures", value: "12 anatomical line-art illustrations" },
  { label: "Length", value: "314 pages / 75k words" },
  { label: "Format", value: "Memoir-manual hybrid — lived, not clinical" },
  { label: "Cross-references", value: "Every drill links to the SRA video library" },
];

const FAQ = [
  {
    q: "How much is The Ultimate Stroke Recovery Revolution?",
    a: "Digital PDF is $19 with instant download. The 6×9 trade paperback is $29, printed on demand and shipped in 5–10 days via Lulu Press.",
  },
  {
    q: "Who wrote it?",
    a: "Nick Kremers — 7-year stroke survivor. He reports reaching 0% to 90%+ functional ability. He built the academy from his lived experience. Not a clinician; a builder.",
  },
  {
    q: "Is it medical advice?",
    a: "No. It's a survivor-built recovery manual for informational purposes. Always consult your healthcare provider before starting any rehabilitation program.",
  },
  {
    q: "Can I read it on phone or Kindle?",
    a: "Yes. The digital edition is a standard PDF that opens on any device. Owners can also read it in-browser at /book/read — no app required.",
  },
  {
    q: "What's the refund policy?",
    a: "Digital downloads are non-refundable once delivered. Print paperbacks follow Lulu's standard fulfillment terms.",
  },
];

export default function BookBuy() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data, isLoading } = useQuery<Listing>({
    queryKey: ["/api/book/storefront"],
  });
  const { data: entitlement } = useQuery<{ owns: boolean }>({
    queryKey: ["/api/book/entitlement"],
    enabled: isAuthenticated,
  });

  const buy = async (editionId: number, kind: string) => {
    if (!isAuthenticated) {
      window.location.href = `/api/login?returnTo=${encodeURIComponent("/book/buy")}`;
      return;
    }
    setBusy(kind);
    try {
      const res = await apiRequest("POST", "/api/marketplace/checkout", {
        items: [{ editionId, quantity: 1 }],
      });
      const json = await res.json();
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        toast({ title: "Could not start checkout", description: json.message || "Try again", variant: "destructive" });
        setBusy(null);
      }
    } catch (e: any) {
      toast({ title: "Checkout failed", description: String(e?.message || e), variant: "destructive" });
      setBusy(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const digital = data.editions.find(e => e.editionType === "digital_pdf");
  const print = data.editions.find(e => e.editionType === "print_paperback");

  const SITE = "https://strokerecoveryacademy.com";
  const coverAbs = data.coverImageUrl?.startsWith("http")
    ? data.coverImageUrl
    : `${SITE}${data.coverImageUrl || "/book/cover.jpg"}`;

  const offers = [
    digital && {
      "@type": "Offer",
      "@id": `${SITE}/book/buy#offer-digital`,
      name: "Digital PDF",
      price: (digital.price / 100).toFixed(2),
      priceCurrency: digital.currency || "USD",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${SITE}/book/buy`,
      seller: { "@type": "Organization", name: "Stroke Recovery Academy" },
    },
    print && {
      "@type": "Offer",
      "@id": `${SITE}/book/buy#offer-print`,
      name: "Print Paperback",
      price: (print.price / 100).toFixed(2),
      priceCurrency: print.currency || "USD",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${SITE}/book/buy`,
      seller: { "@type": "Organization", name: "Stroke Recovery Academy" },
    },
  ].filter(Boolean);

  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: data.title,
    headline: data.subtitle,
    description: data.description,
    image: coverAbs,
    url: `${SITE}/book/buy`,
    bookFormat: "https://schema.org/Paperback",
    inLanguage: "en-US",
    numberOfPages: data.pageCount,
    datePublished: "2026",
    publisher: { "@type": "Organization", name: "Stroke Recovery Academy", url: SITE },
    author: { "@type": "Person", name: "Nick Kremers", url: `${SITE}/recovery/about-nick` },
    offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "19.00", highPrice: "29.00", offerCount: 2, offers },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title="Buy The Ultimate Stroke Recovery Revolution — $19 Digital / $29 Print"
        description="Nick Kremers' 314-page survivor-led stroke recovery manual. Memoir-manual hybrid: 30 chapters, 17 appendices, 9 case studies, and a full 90-Day Breakthrough Program. Written by a 7-year survivor."
        canonical="/book/buy"
        pageType="product"
        image={coverAbs}
        keywords={[
          "buy stroke recovery book",
          "stroke recovery PDF",
          "Nick Kremers book",
          "Ultimate Stroke Recovery Revolution",
          "stroke survivor manual",
          "neuroplasticity book",
          "90-day stroke recovery program",
        ]}
        breadcrumbs={[
          { name: "Recovery", url: "/recovery" },
          { name: "Book", url: "/book" },
          { name: "Buy", url: "/book/buy" },
        ]}
        faq={FAQ.map(f => ({ question: f.q, answer: f.a }))}
        additionalSchema={[bookSchema]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(bookSchema) }}
      />

      <GlobalHeader />

      {/* ── Hero band ─────────────────────────────────────────── */}
      <section className="border-b border-border/50 bg-card/40">
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
          <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 items-end">

            {/* Cover */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div
                className="relative rounded-sm overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10 mx-auto md:mx-0"
                style={{ width: "min(100%, 280px)", aspectRatio: "1410 / 2250" }}
              >
                <img
                  src={data.coverImageUrl}
                  alt={data.title}
                  className="w-full h-full object-contain bg-black"
                  data-testid="img-book-cover"
                />
              </div>

              {/* Edition meta tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="secondary" className="text-xs font-normal">{data.pageCount} pages</Badge>
                <Badge variant="secondary" className="text-xs font-normal">{Math.round(data.wordCount / 1000)}k words</Badge>
                <Badge variant="secondary" className="text-xs font-normal">30 chapters</Badge>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
                <span className="text-xs text-muted-foreground ml-1.5">First-edition launch</span>
              </div>
            </div>

            {/* Title block */}
            <div className="flex flex-col gap-5">
              {/* Breadcrumb style label */}
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">
                Stroke Lyfe Publishing · 2026
              </p>

              <div>
                <h1
                  className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05]"
                  style={{ fontFamily: "var(--font-serif)" }}
                  data-testid="text-book-title"
                >
                  {data.title}
                </h1>
                <p
                  className="mt-3 text-lg md:text-xl text-muted-foreground leading-relaxed"
                  data-testid="text-book-subtitle"
                >
                  {data.subtitle}
                </p>
              </div>

              <Separator className="opacity-40" />

              <p className="text-sm leading-relaxed text-muted-foreground max-w-xl" data-testid="text-book-description">
                {data.description}
              </p>

              {/* CTA inline */}
              <div className="flex flex-wrap gap-3 mt-2">
                {digital && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => buy(digital.id, "digital")}
                    disabled={busy !== null}
                    data-testid="button-buy-digital-hero"
                    className="gap-2"
                  >
                    {busy === "digital" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Digital · ${(digital.price / 100).toFixed(0)}
                  </Button>
                )}
                {print && (
                  <Button
                    size="lg"
                    onClick={() => buy(print.id, "print")}
                    disabled={busy !== null}
                    data-testid="button-buy-print-hero"
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {busy === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Paperback · ${(print.price / 100).toFixed(0)}
                  </Button>
                )}
                {entitlement?.owns && (
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    data-testid="link-read-owned-hero"
                  >
                    <Link href="/book/read">
                      <BookMarked className="w-4 h-4" />
                      Read your copy
                    </Link>
                  </Button>
                )}
              </div>

              <a
                href="/book/sample.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors w-fit"
                data-testid="link-sample-pdf"
              >
                <FileText className="w-3.5 h-3.5" />
                Read the free 43-page sample
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 max-w-xl" data-testid="card-book-template-bundle">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Free 90-Day Companion Template
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  Download the free template, then pair it with either edition for daily check-ins, weekly reviews, and recovery-plan prompts.
                  It is the simplest way to turn a chapter into your next safe, practical rep.
                </p>
                <Link href="/book/90-day-template" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-600 hover:text-amber-700">
                  Open the free template <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's inside ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Features table */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-6">
              What's inside
            </h2>
            <div className="divide-y divide-border/50">
              {INSIDE_ROWS.map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-3.5">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium w-28 shrink-0 mt-0.5">
                    {row.label}
                  </span>
                  <span className="text-sm text-foreground/90 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-2">
              {[
                "30 chapters + 9 case studies (Stories from the Tribe)",
                "17 appendices including the full 90-Day Breakthrough Program",
                "12 anatomical line-art figures + cinematic chapter openers",
                "Cross-referenced with SRA video library",
                "Built by a 7-year survivor — not a clinician, a builder",
              ].map(line => (
                <div key={line} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing cards */}
          <div>
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-6">
              Choose your edition
            </h2>

            <div className="space-y-3">
              {/* Digital */}
              {digital && (
                <div
                  className="border border-border/60 rounded-sm p-6 hover-elevate transition-all"
                  data-testid="card-edition-digital"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Digital PDF</span>
                      </div>
                      <div className="text-3xl font-bold tracking-tight">${(digital.price / 100).toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1.5">Instant download · Read anywhere · Lifetime access</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => buy(digital.id, "digital")}
                      disabled={busy !== null}
                      data-testid="button-buy-digital"
                      className="shrink-0 mt-1"
                    >
                      {busy === "digital" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buy digital"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Print */}
              {print && (
                <div
                  className="border border-amber-600/30 bg-amber-950/10 rounded-sm p-6 hover-elevate transition-all relative"
                  data-testid="card-edition-print"
                >
                  <Badge className="absolute top-4 right-4 bg-amber-600 text-white text-xs font-normal">
                    Most loved
                  </Badge>
                  <div className="flex items-start justify-between gap-4 pr-28">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Print Paperback</span>
                      </div>
                      <div className="text-3xl font-bold tracking-tight">${(print.price / 100).toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1.5">6×9 trade paperback · Printed on demand · Ships 5–10 days</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-5 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={() => buy(print.id, "print")}
                    disabled={busy !== null}
                    data-testid="button-buy-print"
                  >
                    {busy === "print" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    Order the paperback
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Secure checkout via Stripe. Print orders fulfilled by Lulu Press.
              Your purchase supports Stroke Lyfe Inc. (501c3) and the academy's
              free survivor resources.
            </p>

            <div className="mt-6">
              <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2" data-testid="link-companion">
                <Link href="/book">
                  <BookOpen className="w-4 h-4" />
                  Browse the companion academy
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider quote ────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-card/30 py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <blockquote
            className="text-xl md:text-2xl leading-relaxed text-foreground/90 font-medium"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            "Recovery isn't healing. It's construction."
          </blockquote>
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Nicholas Kremers — 7-year stroke survivor
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 max-w-3xl">
        <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-8">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-border/50">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between gap-4 py-4 text-left group"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                data-testid={`faq-toggle-${i}`}
              >
                <span className="text-sm font-medium group-hover:text-amber-500 transition-colors">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <p className="pb-5 text-sm text-muted-foreground leading-relaxed" data-testid={`faq-answer-${i}`}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
