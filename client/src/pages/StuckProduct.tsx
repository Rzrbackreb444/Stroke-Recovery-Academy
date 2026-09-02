import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  STUCK_BUNDLE_PRICE_CENTS,
  STUCK_COVER_IMAGE,
  STUCK_FAQ,
  STUCK_PRODUCT_DESCRIPTION,
  STUCK_PRODUCT_SUBTITLE,
  STUCK_PRODUCT_TITLE,
  STUCK_STANDALONE_PRICE_CENTS,
} from "@shared/stuckProduct";
import { safeJsonLd } from "@/lib/safeJsonLd";

interface Edition {
  id: number;
  editionType: string;
  price: number;
  currency: string;
}

interface Storefront {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl?: string;
  pageCount?: number;
  wordCount?: number;
  editions: Edition[];
}

interface Entitlement {
  owns: boolean;
  orderId?: number;
  itemId?: number;
  orderNumber?: string;
}

const TLECA = [
  ["TAKE", "Name the exact thing that feels stuck."],
  ["LEARN", "Notice one useful signal instead of judging the whole journey."],
  ["EXPERIMENT", "Change one small variable and keep the rep safe."],
  ["COMBINE", "Pair the rep with a cue, person, or routine."],
  ["APPLY", "Keep what helps. Adjust what does not."],
];

const STANDALONE_INCLUDES = [
  "29-page STUCK workbook",
  "The complete T.L.E.C.A. plateau-breaking framework",
  "Reflection prompts, experiment cards, and hard-day protocol",
  "Caregiver guidance for making practice more usable",
];

const BUNDLE_INCLUDES = [
  "Everything in the STUCK workbook",
  "Printable 66-Day Rebuild companion",
  "Daily rep tracker and three 22-day phase sheets",
  "Weekly review and hard-day planning pages",
];

export default function StuckProduct() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery<Storefront>({
    queryKey: ["/api/stuck/storefront"],
  });
  const { data: entitlement } = useQuery<Entitlement>({
    queryKey: ["/api/stuck/entitlement"],
    enabled: isAuthenticated,
  });

  const buy = async (edition: Edition, kind: string) => {
    if (!isAuthenticated) {
      window.location.href = `/api/login?returnTo=${encodeURIComponent("/stuck")}`;
      return;
    }
    setBusy(kind);
    try {
      const response = await apiRequest("POST", "/api/marketplace/checkout", {
        items: [{ editionId: edition.id, quantity: 1 }],
      });
      const json = await response.json();
      if (!json.checkoutUrl) throw new Error(json.message || "Could not start checkout");
      window.location.href = json.checkoutUrl;
    } catch (purchaseError: any) {
      toast({
        title: "Checkout failed",
        description: String(purchaseError?.message || purchaseError),
        variant: "destructive",
      });
      setBusy(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  const storefront = data || {
    id: 0,
    title: STUCK_PRODUCT_TITLE,
    subtitle: STUCK_PRODUCT_SUBTITLE,
    description: STUCK_PRODUCT_DESCRIPTION,
    coverImageUrl: STUCK_COVER_IMAGE,
    pageCount: 29,
    wordCount: 5000,
    editions: [],
  };
  const standalone = storefront.editions.find((edition) => edition.editionType === "digital_pdf");
  const bundle = storefront.editions.find((edition) => edition.editionType === "digital_bundle");
  const cover = storefront.coverImageUrl || STUCK_COVER_IMAGE;
  const canonical = "https://strokerecoveryacademy.com/stuck";
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: storefront.title,
    description: storefront.description,
    image: cover.startsWith("http") ? cover : `https://strokerecoveryacademy.com${cover}`,
    brand: { "@type": "Brand", name: "Stroke Recovery Academy" },
    category: "Stroke recovery workbook",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: (standalone?.price ?? STUCK_STANDALONE_PRICE_CENTS) / 100,
      highPrice: (bundle?.price ?? STUCK_BUNDLE_PRICE_CENTS) / 100,
      priceCurrency: "USD",
      offerCount: 2,
      availability: "https://schema.org/InStock",
      url: canonical,
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title="STUCK — Break a Stroke Recovery Plateau"
        description="The survivor-built STUCK workbook uses the T.L.E.C.A. framework to help stroke survivors turn a recovery plateau into the next safe experiment. PDF from $14.99."
        canonical="/stuck"
        pageType="product"
        image={cover.startsWith("http") ? cover : `https://strokerecoveryacademy.com${cover}`}
        keywords={[
          "stroke recovery plateau workbook",
          "break through stroke recovery plateau",
          "stroke recovery workbook PDF",
          "TLECA recovery framework",
          "stroke survivor workbook",
          "recovery plateau after stroke",
        ]}
        breadcrumbs={[
          { name: "Recovery", url: "/recovery" },
          { name: "STUCK Workbook", url: "/stuck" },
        ]}
        faq={STUCK_FAQ.map((item) => ({ question: item.question, answer: item.answer }))}
        additionalSchema={[productSchema]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }} />
      <GlobalHeader />

      <main className="flex-1">
        <section className="border-b border-border/50 bg-card/30">
          <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
            <div className="grid items-center gap-12 md:grid-cols-[0.75fr_1.25fr]">
              <div className="mx-auto w-full max-w-sm">
                <div className="overflow-hidden rounded-md border border-border/60 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                  <img src={cover} alt="STUCK workbook cover" className="block aspect-[8.5/11] w-full object-cover" data-testid="img-stuck-cover" />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">29 pages · instant PDF delivery · survivor-built</p>
              </div>

              <div className="max-w-2xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E2741B]">A Sasquatch recovery workbook</p>
                <h1 className="text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl" style={{ fontFamily: "var(--font-serif)" }}>
                  {storefront.title}
                </h1>
                <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{storefront.subtitle}</p>
                <p className="mt-6 max-w-xl text-base leading-8 text-foreground/80">{storefront.description}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {entitlement?.owns ? (
                    <Button asChild size="lg" className="gap-2 bg-[#E2741B] text-white hover:bg-[#c96112]" data-testid="button-stuck-owned">
                      <Link href={`/api/marketplace/orders/${entitlement.orderId}/items/${entitlement.itemId}/download`}>
                        <Download className="h-4 w-4" /> Download your copy
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="gap-2" data-testid="button-stuck-see-pricing">
                      <a href="#pricing">Choose your copy <ArrowRight className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button asChild size="lg" variant="ghost" className="gap-2">
                    <Link href="/recovery/academy">See the Academy <ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#E2741B]" /> Secure account delivery</span>
                  <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-[#E2741B]" /> Read on any device</span>
                  <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#E2741B]" /> No clinical promises</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E2741B]">The framework</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>Plateaus are information — not a verdict.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">STUCK gives you a way to work with the plateau without trying to bully it away. Five moves. One variable at a time. A next rep you can actually use.</p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {TLECA.map(([letter, description], index) => (
              <div key={letter} className="rounded-lg border border-border/60 bg-card/40 p-5" data-testid={`card-tleca-${index}`}>
                <div className="text-sm font-bold tracking-[0.18em] text-[#E2741B]">{letter}</div>
                <p className="mt-3 text-sm leading-6 text-foreground/80">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/50 bg-card/20">
          <div className="container mx-auto max-w-6xl px-4 py-16">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E2741B]">Inside the workbook</p>
                <h2 className="mt-3 text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>For the day the old plan stops working.</h2>
                <div className="mt-7 space-y-4">
                  {[
                    "A plateau map that separates the task, the setup, and the signal.",
                    "Experiment cards that turn frustration into one safe thing to try.",
                    "A hard-day protocol for keeping the chain without pretending you have unlimited energy.",
                    "Caregiver prompts for helping without taking over.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground/80">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#E2741B]" /> <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Card className="border-[#E2741B]/30 bg-[#E2741B]/5">
                <CardContent className="p-7">
                  <p className="text-sm font-semibold text-[#E2741B]">A note from Nick</p>
                  <blockquote className="mt-4 text-2xl leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                    “You are not a failed version of your old self. You are a person collecting new evidence.”
                  </blockquote>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">STUCK comes from the same survivor-first philosophy behind the Stroke Recovery Academy: keep the language honest, make the next step smaller, and count the rep that happened.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E2741B]">Choose your starting point</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>One workbook. Two ways to use it.</h2>
            {error && <p className="mt-3 text-sm text-muted-foreground">The live checkout editions are still being prepared. Please check back shortly.</p>}
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <OfferCard
              title="STUCK Workbook"
              price={standalone?.price ?? STUCK_STANDALONE_PRICE_CENTS}
              description="The complete 29-page PDF for breaking down your next plateau."
              includes={STANDALONE_INCLUDES}
              buttonLabel="Get the workbook"
              edition={standalone}
              busy={busy === "standalone"}
              onBuy={() => standalone && buy(standalone, "standalone")}
            />
            <OfferCard
              title="STUCK + 66-Day Rebuild"
              price={bundle?.price ?? STUCK_BUNDLE_PRICE_CENTS}
              description="The workbook plus printable tracking pages to keep the practice alive."
              includes={BUNDLE_INCLUDES}
              buttonLabel="Get the bundle"
              edition={bundle}
              busy={busy === "bundle"}
              featured
              onBuy={() => bundle && buy(bundle, "bundle")}
            />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-muted-foreground">Secure checkout via Stripe. Digital products are delivered to your account after payment and remain available for one year. Digital purchases are non-refundable after delivery; contact support if your file is missing or inaccessible.</p>
        </section>

        <section className="border-y border-border/50 bg-card/20">
          <div className="container mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>Questions before you start?</h2>
            <div className="mt-7 divide-y divide-border/60">
              {STUCK_FAQ.map((item, index) => (
                <div key={item.question}>
                  <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium hover:text-[#E2741B]" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} data-testid={`button-stuck-faq-${index}`}>
                    {item.question}
                    <span className="text-xl text-muted-foreground">{openFaq === index ? "−" : "+"}</span>
                  </button>
                  {openFaq === index && <p className="pb-5 text-sm leading-7 text-muted-foreground" data-testid={`text-stuck-faq-${index}`}>{item.answer}</p>}
                </div>
              ))}
            </div>
            <Separator className="my-10" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Keep going with the free Academy</p>
                <p className="mt-1 text-sm text-muted-foreground">Daily practice, community, and survivor-led education.</p>
              </div>
              <Button asChild variant="outline" className="gap-2"><Link href="/recovery/academy">Open the Academy <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function OfferCard({
  title,
  price,
  description,
  includes,
  buttonLabel,
  edition,
  busy,
  featured,
  onBuy,
}: {
  title: string;
  price: number;
  description: string;
  includes: string[];
  buttonLabel: string;
  edition?: Edition;
  busy: boolean;
  featured?: boolean;
  onBuy: () => void;
}) {
  return (
    <Card className={`relative h-full border-border/70 ${featured ? "border-[#E2741B]/60 bg-[#E2741B]/5" : "bg-card/40"}`}>
      {featured && <div className="absolute right-5 top-5 rounded-full bg-[#E2741B] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Best value</div>}
      <CardContent className="flex h-full flex-col p-7">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
        <div className="mt-4 text-4xl font-bold">${(price / 100).toFixed(2)}</div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="my-6 space-y-3">
          {includes.map((item) => <div key={item} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#E2741B]" /><span>{item}</span></div>)}
        </div>
        <Button className={`mt-auto w-full gap-2 ${featured ? "bg-[#E2741B] text-white hover:bg-[#c96112]" : ""}`} variant={featured ? "default" : "outline"} onClick={onBuy} disabled={!edition || busy} data-testid={`button-buy-stuck-${featured ? "bundle" : "workbook"}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {edition ? buttonLabel : "Coming soon"}
        </Button>
      </CardContent>
    </Card>
  );
}