import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink, ShieldAlert, Filter, Flame, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { MedicalDisclaimerCard } from "@/components/recovery/MedicalDisclaimerCard";
import {
  SHOP_CATEGORIES,
  SHOP_PRODUCTS,
  type ShopCategoryId,
  type ShopProduct,
} from "@/data/survivorShop";
import { buildAmazonUrl } from "@/lib/amazonLink";

interface AffiliateConfig {
  amazonTag: string | null;
}

function ProductCard({ p, tag, configReady }: { p: ShopProduct; tag: string | null; configReady: boolean }) {
  const url = buildAmazonUrl(p.asin, tag);
  return (
    <Card className="bg-zinc-900/60 border-amber-900/30 flex flex-col" data-testid={`card-product-${p.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-amber-100 text-base leading-snug" data-testid={`text-product-name-${p.id}`}>
            {p.name}
          </CardTitle>
          <Badge variant="outline" className="border-amber-800/50 text-amber-300 shrink-0">
            {p.priceClass}
          </Badge>
        </div>
        {p.brand && (
          <CardDescription className="text-amber-100/50 text-xs">
            {p.brand} · ASIN {p.asin}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="text-amber-100/80 text-sm leading-relaxed">{p.whyNick}</p>
        {p.notMedicalNote && (
          <div className="flex items-start gap-2 rounded-md border border-amber-900/40 bg-amber-950/30 p-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80">{p.notMedicalNote}</p>
          </div>
        )}
        {configReady ? (
          <Button
            asChild
            className="mt-auto bg-amber-500 hover:bg-amber-400 text-zinc-950"
            data-testid={`link-amazon-${p.id}`}
          >
            <a href={url} target="_blank" rel="noopener noreferrer sponsored nofollow">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Amazon
            </a>
          </Button>
        ) : (
          <Button
            disabled
            className="mt-auto bg-amber-500/40 text-zinc-950"
            data-testid={`link-amazon-${p.id}-loading`}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Loading…
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function readCategoryFromUrl(): ShopCategoryId | "all" {
  if (typeof window === "undefined") return "all";
  const raw = new URLSearchParams(window.location.search).get("category");
  if (!raw) return "all";
  const valid = SHOP_CATEGORIES.some((c) => c.id === raw);
  return valid ? (raw as ShopCategoryId) : "all";
}

export default function SurvivorShop() {
  const [activeCat, setActiveCat] = useState<ShopCategoryId | "all">(() => readCategoryFromUrl());
  const [search, setSearch] = useState("");

  const { data: cfg, isLoading: cfgLoading } = useQuery<AffiliateConfig>({
    queryKey: ["/api/config/affiliate"],
  });
  const tag = cfg?.amazonTag ?? null;
  const configReady = !cfgLoading;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SHOP_PRODUCTS.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false) ||
        p.whyNick.toLowerCase().includes(q)
      );
    });
  }, [activeCat, search]);

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 flex flex-col">
      <GlobalHeader />
      <main className="flex-1">
        <section className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/30 to-zinc-950">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-3 text-amber-400 text-sm">
              <Flame className="h-4 w-4" />
              <span>Survivor-Curated Gear</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-4" data-testid="text-shop-title">
              The Survivor Shop
            </h1>
            <p className="text-lg text-amber-100/70 max-w-2xl mb-6">
              The boring, unglamorous tools that actually moved the needle for me and the survivors I trust.
              Every link is an Amazon affiliate link — a few cents per purchase comes back to keep this
              platform free for survivors who can't afford it.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-200/60">
              <Badge variant="outline" className="border-amber-700/50 text-amber-300">
                {SHOP_PRODUCTS.length} products
              </Badge>
              <Badge variant="outline" className="border-amber-700/50 text-amber-300">
                {SHOP_CATEGORIES.length} categories
              </Badge>
              {tag && (
                <Badge variant="outline" className="border-emerald-800/50 text-emerald-300" data-testid="badge-affiliate-active">
                  Affiliate tag active
                </Badge>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-8">
          <MedicalDisclaimerCard
            variant="full"
            extraContext="Nick is a stroke survivor, not a doctor. These are personal recommendations, not medical prescriptions. Always confirm assistive devices and braces with your physical, occupational, or speech therapist before purchase."
          />
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-100/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9 bg-zinc-900/60 border-amber-900/30 text-amber-50 placeholder:text-amber-100/40"
                data-testid="input-shop-search"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-100/50">
              <Filter className="h-3 w-3" />
              {filtered.length} shown
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              size="sm"
              variant={activeCat === "all" ? "default" : "outline"}
              className={activeCat === "all" ? "bg-amber-500 text-zinc-950 hover:bg-amber-400" : "border-amber-800/50 text-amber-200"}
              onClick={() => setActiveCat("all")}
              data-testid="button-cat-all"
            >
              All
            </Button>
            {SHOP_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={activeCat === c.id ? "default" : "outline"}
                className={activeCat === c.id ? "bg-amber-500 text-zinc-950 hover:bg-amber-400" : "border-amber-800/50 text-amber-200"}
                onClick={() => setActiveCat(c.id)}
                data-testid={`button-cat-${c.id}`}
              >
                {c.name}
              </Button>
            ))}
          </div>

          {activeCat !== "all" && (
            <Card className="bg-amber-950/20 border-amber-900/40 mb-6">
              <CardContent className="py-4">
                <p className="text-amber-100/80 text-sm">
                  {SHOP_CATEGORIES.find((c) => c.id === activeCat)?.blurb}
                </p>
                {SHOP_CATEGORIES.find((c) => c.id === activeCat)?.bonfireSignal && (
                  <p className="text-amber-300/70 text-xs mt-2 italic">
                    Recommended after Bonfire signal: "{SHOP_CATEGORIES.find((c) => c.id === activeCat)?.bonfireSignal}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-amber-950/15 border-amber-900/40 mb-6" data-testid="card-affiliate-disclosure">
            <CardContent className="py-4 text-sm text-amber-100/80">
              <p>
                <strong className="text-amber-200">Affiliate disclosure:</strong> Stroke Recovery Academy is
                an Amazon Associate. We earn from qualifying purchases — your price is unchanged. Every link
                below is an affiliate link.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px]">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} tag={tag} configReady={configReady} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-amber-100/50">
              No products match your search.
            </div>
          )}
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16">
          <Card className="bg-zinc-900/60 border-amber-900/30">
            <CardContent className="py-6 space-y-3 text-sm text-amber-100/70">
              <p>
                <strong className="text-amber-200">Full affiliate disclosure:</strong> KreAIte / Stroke Recovery
                Academy is an Amazon Associate. As an Amazon Associate we earn from qualifying purchases.
                Your price is unchanged. Choosing to buy through these links helps fund free survivor content.
              </p>
              <p>
                <strong className="text-amber-200">Not medical advice:</strong> Mobility devices, AFOs, splints,
                and grab bars must be selected and fitted by a licensed clinician. The recommendations on this
                page are personal preferences from a survivor, not prescriptions.
              </p>
              <p className="text-amber-100/50 text-xs">
                If a link looks broken or out of stock,{" "}
                <Link href="/contact" className="text-amber-400 hover:underline">
                  let us know
                </Link>{" "}
                and we'll swap it for a current alternative.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
