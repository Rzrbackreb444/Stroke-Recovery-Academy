import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Download, FileText, Truck, Star, Check, Loader2, BookOpen, BookMarked } from "lucide-react";

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

export default function BookBuy() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

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
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
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
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 10, unitCode: "DAY" },
        },
      },
    },
  ].filter(Boolean);

  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${SITE}/book/buy#book`,
    name: data.title,
    alternateName: "The Ultimate Stroke Recovery Revolution",
    headline: data.subtitle,
    description: data.description,
    image: coverAbs,
    url: `${SITE}/book/buy`,
    bookFormat: "https://schema.org/Paperback",
    inLanguage: "en-US",
    numberOfPages: data.pageCount,
    wordCount: data.wordCount,
    isbn: undefined,
    datePublished: "2026",
    publisher: {
      "@type": "Organization",
      name: "Stroke Recovery Academy",
      url: SITE,
    },
    author: {
      "@type": "Person",
      name: "Nick Kremers",
      "@id": `${SITE}/recovery/about-nick#nick-kremers`,
      url: `${SITE}/recovery/about-nick`,
    },
    about: [
      { "@type": "MedicalCondition", name: "Stroke" },
      { "@type": "Thing", name: "Neuroplasticity" },
      { "@type": "Thing", name: "Stroke Rehabilitation" },
    ],
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 18,
      requiredGender: "Any",
      audienceType: "Stroke survivors and caregivers",
    },
    workExample: offers.map((offer: any, i) => ({
      "@type": "Book",
      bookFormat:
        i === 0 && digital
          ? "https://schema.org/EBook"
          : "https://schema.org/Paperback",
      potentialAction: {
        "@type": "ReadAction",
        target: `${SITE}/book/read`,
      },
      offers: offer,
    })),
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE}/book/buy#product`,
    name: data.title,
    description: data.description,
    image: [coverAbs],
    brand: { "@type": "Brand", name: "Stroke Recovery Academy" },
    category: "Books > Health & Fitness > Stroke Recovery",
    sku: "SRA-USRR-001",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: digital ? (digital.price / 100).toFixed(2) : "19.00",
      highPrice: print ? (print.price / 100).toFixed(2) : "29.00",
      offerCount: offers.length,
      offers,
    },
  };

  const faq = [
    {
      question: "How much is The Ultimate Stroke Recovery Revolution?",
      answer:
        "The digital PDF is $19 with instant download. The 6×9 print paperback is $29 and ships in 5-10 days via Lulu print-on-demand.",
    },
    {
      question: "Who wrote the book?",
      answer:
        "Nick Kremers, a 7-year stroke survivor who recovered from 0% to 90%+ functional ability. The book is built from his own multi-year recovery and the Stroke Recovery Academy method.",
    },
    {
      question: "What's inside?",
      answer:
        "30 chapters, 17 appendices including the full 90-day breakthrough program, 9 case studies (Stories from the Tribe), 12 anatomical line-art figures, and cross-references to the Stroke Recovery Academy video library.",
    },
    {
      question: "Is the book medical advice?",
      answer:
        "No. It is a survivor-built recovery manual for informational purposes. Always consult your healthcare provider before starting any rehabilitation program.",
    },
    {
      question: "Can I read it on my phone or Kindle?",
      answer:
        "Yes. The digital edition is a standard PDF that opens on any device. Owners can also read it directly inside the Stroke Recovery Academy at /book/read.",
    },
    {
      question: "Do I get a refund if I don't like it?",
      answer:
        "Digital downloads are non-refundable once delivered. Print paperbacks follow Lulu's standard fulfillment terms.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title="Buy The Ultimate Stroke Recovery Revolution — Digital $19 / Print $29"
        description="Nick Kremers' battle-tested 314-page stroke recovery manual. Digital PDF $19 (instant) or 6×9 paperback $29 (ships 5-10 days). 30 chapters, 17 appendices, 9 case studies, full 90-day program. Forged by a 7-year survivor."
        canonical="/book/buy"
        pageType="product"
        image={coverAbs}
        keywords={[
          "buy stroke recovery book",
          "stroke recovery PDF",
          "stroke recovery paperback",
          "Nick Kremers book",
          "Ultimate Stroke Recovery Revolution",
          "stroke survivor manual",
          "neuroplasticity book",
          "90-day stroke recovery program",
          "stroke rehabilitation guide",
          "Sasquatch Method",
        ]}
        breadcrumbs={[
          { name: "Recovery", url: "/recovery" },
          { name: "Book", url: "/book" },
          { name: "Buy", url: "/book/buy" },
        ]}
        speakableSelectors={["[data-testid='text-book-title']", "[data-testid='text-book-description']"]}
        faq={faq}
        additionalSchema={[bookSchema, productSchema]}
      />
      <GlobalHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-start max-w-6xl mx-auto">
            <div className="md:sticky md:top-24 flex flex-col items-center md:items-stretch">
              <div
                className="rounded-md overflow-hidden shadow-2xl ring-1 ring-border bg-black mx-auto"
                style={{ maxWidth: "min(100%, 360px)", aspectRatio: "1410 / 2250" }}
              >
                <img
                  src={data.coverImageUrl}
                  alt={data.title}
                  className="w-full h-full object-contain"
                  data-testid="img-book-cover"
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{data.pageCount} pages</Badge>
                <Badge variant="secondary">{Math.round(data.wordCount / 1000)}k words</Badge>
                <Badge variant="secondary">30 chapters</Badge>
              </div>
              {entitlement?.owns && (
                <Button
                  asChild
                  size="sm"
                  className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white"
                  data-testid="link-read-owned"
                >
                  <Link href="/book/read">
                    <BookMarked className="w-4 h-4 mr-2" />
                    Read your book
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                data-testid="link-sample-pdf"
              >
                <a href="/book/sample.pdf" target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  Read free 36-page sample
                </a>
              </Button>
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight" data-testid="text-book-title">
                {data.title}
              </h1>
              <p className="mt-3 text-xl text-muted-foreground" data-testid="text-book-subtitle">
                {data.subtitle}
              </p>

              <div className="flex items-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                ))}
                <span className="text-sm text-muted-foreground ml-2">First-edition launch</span>
              </div>

              <p className="mt-6 text-base leading-relaxed" data-testid="text-book-description">
                {data.description}
              </p>

              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "30 chapters + 9 case studies (Stories from the Tribe)",
                  "17 appendices including the full 90-Day Breakthrough Program",
                  "12 anatomical line-art figures + cinematic chapter openers",
                  "Cross-referenced with strokerecoveryacademy.com video library",
                  "Forged by a 7-year survivor — not a clinician, a builder",
                ].map(line => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <Separator className="my-8" />

              <div className="grid sm:grid-cols-2 gap-4">
                {digital && (
                  <Card className="hover-elevate" data-testid="card-edition-digital">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Download className="w-4 h-4" />
                        Digital PDF
                      </div>
                      <div className="text-3xl font-bold mt-2">${(digital.price / 100).toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Instant download. Read anywhere. Lifetime access.
                      </p>
                      <Button
                        className="w-full mt-4"
                        onClick={() => buy(digital.id, "digital")}
                        disabled={busy !== null}
                        data-testid="button-buy-digital"
                      >
                        {busy === "digital" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Buy digital
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {print && (
                  <Card className="hover-elevate ring-2 ring-orange-500/40" data-testid="card-edition-print">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="w-4 h-4" />
                          Print Paperback
                        </div>
                        <Badge className="bg-orange-500 text-white">Most loved</Badge>
                      </div>
                      <div className="text-3xl font-bold mt-2">${(print.price / 100).toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        6×9 trade paperback, printed on demand. Ships in 5-10 days.
                      </p>
                      <Button
                        className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => buy(print.id, "print")}
                        disabled={busy !== null}
                        data-testid="button-buy-print"
                      >
                        {busy === "print" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4 mr-2" />
                        )}
                        Order paperback
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Secure checkout via Stripe. Print orders fulfilled by Lulu Press. By buying you support
                Stroke Lyfe Inc. (501c3) and the academy's free survivor resources.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <Button asChild variant="ghost" size="sm" data-testid="link-companion">
                  <Link href="/book">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse the companion academy
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
