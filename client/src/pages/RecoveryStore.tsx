import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeJsonLd } from "@/lib/safeJsonLd";
import { buildAmazonUrl } from "@/lib/amazonLink";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Search,
  Heart,
  Brain,
  Dumbbell,
  Footprints,
  Hand,
  Utensils,
  ShoppingCart,
  CheckCircle,
  Shield,
  Award,
  TrendingUp,
  Users,
  Quote,
} from "lucide-react";
import strokeLyfeLogo from "@assets/Untitled_design_1776789083877.png";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";

import { Product, RECOVERY_PRODUCTS } from "@/data/recoveryProducts";
import {
  STORE_CATEGORY_GUIDES as CATEGORY_GUIDES,
  STORE_FAQS,
  HOW_NICK_PICKS,
  HOW_NICK_PICKS_HEADING,
  HOW_NICK_PICKS_EYEBROW,
  HOW_NICK_PICKS_INTRO,
} from "@shared/storeEditorial";


const CATEGORIES = [
  { id: "all", name: "All Products", icon: ShoppingCart },
  { id: "strength", name: "Strength Training", icon: Dumbbell },
  { id: "mobility", name: "Mobility & Drop Foot", icon: Footprints },
  { id: "therapy", name: "Therapy Tools", icon: Hand },
  { id: "adaptive", name: "Adaptive Aids", icon: Utensils },
  { id: "brain", name: "Brain Games & Books", icon: Brain },
];

function ProductSchema({ product, tag }: { product: Product; tag: string | null }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    image: product.imageUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      // Strip every non-numeric/non-dot character. Safe for US/Amazon
      // prices (e.g. "$9.99", "$9.99 USD", "$1,299.00") which is the only
      // affiliate region this storefront serves today (AMAZON_AFFILIATE_TAG
      // is US). If/when EU/UK affiliate tags are added, swap to a locale-
      // aware parser — comma-decimal prices like "€9,99" would otherwise
      // collapse to "999".
      price: product.price.replace(/[^0-9.]/g, ""),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: buildAmazonUrl(product.amazonUrl, tag),
    },
    review: {
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: 5 },
      author: { "@type": "Person", name: "Nick Kremers" },
      reviewBody: product.nickSays || product.whyRecommended,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating)
                ? "fill-[#E2741B] text-[#E2741B]"
                : star <= rating
                ? "fill-[#E2741B]/50 text-[#E2741B]"
                : "text-gray-500"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {rating} ({reviewCount.toLocaleString()} reviews)
      </span>
    </div>
  );
}

function ProductCard({ product, tag, configReady }: { product: Product; tag: string | null; configReady: boolean }) {
  const amazonUrl = buildAmazonUrl(product.amazonUrl, tag);
  return (
    <>
      <ProductSchema product={product} tag={tag} />
      <Card className="group overflow-hidden bg-[#1a1a1a] border border-[#333] hover:border-[#E2741B]/30 hover:shadow-lg hover:shadow-[#E2741B]/5 transition-all">
        <div className="relative aspect-square bg-[#0D0D0D] overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNicksPick && (
              <Badge className="bg-[#E2741B] text-black text-[10px] border-0">
                <Award className="w-3 h-3 mr-1" />
                Nick's Pick
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-[#E2741B]/20 text-[#E2741B] border border-[#E2741B]/30 text-[10px]">
                <TrendingUp className="w-3 h-3 mr-1" />
                Best Seller
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-xs text-[#E2741B] font-medium uppercase tracking-wide">
              {product.brand}
            </p>
            <h3 className="font-semibold text-white line-clamp-2 mt-1">
              {product.name}
            </h3>
          </div>
          
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          
          <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
          
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] border-[#333] text-gray-400 bg-transparent">
                {tag}
              </Badge>
            ))}
          </div>
          
          {product.nickSays && (
            <div className="bg-[#E2741B]/10 rounded-lg p-3 border-l-2 border-[#E2741B]">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-[#E2741B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300 italic line-clamp-2">"{product.nickSays}"</p>
              </div>
              <p className="text-[10px] text-[#E2741B] font-medium mt-1">— Nick Kremers</p>
            </div>
          )}
          
          <div className="pt-2">
            <Button
              asChild
              variant="outline"
              className="border-[#E2741B] text-[#E2741B] hover:bg-[#E2741B]/10 w-full"
              data-testid={`button-buy-${product.id}`}
            >
              <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored nofollow">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Check Current Price on Amazon
              </a>
            </Button>
          </div>
          
          <div className="pt-2 border-t border-[#333]">
            <p className="text-xs text-gray-500 font-medium mb-1">Recovery Benefits:</p>
            <div className="flex flex-wrap gap-1">
              {product.recoveryBenefits.map((benefit) => (
                <span key={benefit} className="text-[10px] bg-[#E2741B]/10 text-[#E2741B] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

interface AffiliateConfig {
  amazonTag: string | null;
}

export default function RecoveryStore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: affiliateConfig, isLoading: affiliateLoading } = useQuery<AffiliateConfig>({
    queryKey: ["/api/config/affiliate"],
  });
  const affiliateTag = affiliateConfig?.amazonTag ?? null;
  const configReady = !affiliateLoading;

  useEffect(() => {
    document.title = "Recovery Store | Stroke Recovery Academy - Curated Products for Stroke Survivors";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Shop curated recovery products hand-picked by stroke survivor Nick Kremers. Push-up bars, grip strengtheners, drop foot aids, brain games, and more. Every purchase supports stroke survivors.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Shop curated recovery products hand-picked by stroke survivor Nick Kremers. Push-up bars, grip strengtheners, drop foot aids, brain games, and more. Every purchase supports stroke survivors.";
      document.head.appendChild(meta);
    }

    let keywords = document.querySelector('meta[name="keywords"]');
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    keywords.setAttribute("content", "stroke recovery products, adaptive equipment for stroke survivors, gait belt, drop foot brace, grip strengthener, hand therapy tools, transfer sling, brain games for stroke, recovery store");

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://strokerecoveryacademy.com/recovery/store");

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", "Recovery Store | Stroke Recovery Academy");
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", "Curated recovery products for stroke survivors, tested and approved by Nick Kremers.");
    }

    return () => {
      document.title = "Stroke Recovery Academy";
    };
  }, []);

  const filteredProducts = RECOVERY_PRODUCTS.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const nicksPicks = RECOVERY_PRODUCTS.filter((p) => p.isNicksPick);

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Store",
        name: "Stroke Recovery Academy Recovery Store",
        description: "Curated recovery products hand-picked by stroke survivor Nick Kremers. Every product is chosen for genuine therapeutic value in stroke recovery.",
        url: "https://strokerecoveryacademy.com/recovery/store",
        brand: { "@type": "Brand", name: "Stroke Recovery Academy" },
        founder: {
          "@type": "Person",
          name: "Nick Kremers",
          description: "Stroke survivor who reports reaching 0% to 90% function. Shares lived-experience recovery education.",
          url: "https://strokerecoveryacademy.com/recovery/about-nick",
          knowsAbout: ["Stroke Recovery", "Neuroplasticity", "Physical Therapy", "Cognitive Rehabilitation", "Adaptive Equipment"],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://strokerecoveryacademy.com/" },
          { "@type": "ListItem", position: 2, name: "Recovery", item: "https://strokerecoveryacademy.com/recovery" },
          { "@type": "ListItem", position: 3, name: "Recovery Store", item: "https://strokerecoveryacademy.com/recovery/store" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: STORE_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(pageSchema) }}
      />

      <header className="bg-[#0D0D0D] border-b border-[#333] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={strokeLyfeLogo} alt="Stroke Lyfe" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white">Recovery Store</span>
          </div>
          <Badge className="bg-[#E2741B]/20 text-[#E2741B] border border-[#E2741B]/30">
            <Award className="w-3 h-3 mr-1" />
            Curated by Nick
          </Badge>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#1a1a1a] via-[#0D0D0D] to-[#1a1a1a] py-16 px-4 border-b border-[#333]">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 mb-4">
            <Award className="w-3 h-3 mr-1" />
            Curated by Nick Kremers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
            Recovery Store
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            Every product hand-picked for stroke recovery success. 
            Tested and approved by survivors who've been where you are.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E2741B]" />
              Survivor Tested
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#E2741B]" />
              Expert Recommended
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E2741B]" />
              Community Approved
            </span>
          </div>
        </div>
      </section>

      <section className="py-8 px-4 bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <img src={strokeLyfeLogo} alt="Nick's Picks" className="w-10 h-10" />
            <div>
              <h2 className="text-xl font-bold text-white">Nick's Top Picks</h2>
              <p className="text-sm text-gray-400">Products I personally use in my recovery</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {nicksPicks.map((product) => (
              <a
                key={product.id}
                href={`#${product.id}`}
                className="bg-[#0D0D0D] hover:bg-[#E2741B]/10 border border-[#333] hover:border-[#E2741B]/30 rounded-lg p-3 text-center transition-colors"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-contain mx-auto mb-2"
                />
                <p className="text-xs font-medium text-gray-300 line-clamp-2">{product.name}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="mb-10 bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 md:p-8" data-testid="section-how-nick-picks">
          <div className="mb-6">
            <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 mb-3">
              <Award className="w-3 h-3 mr-1" />
              {HOW_NICK_PICKS_EYEBROW}
            </Badge>
            <h2 className="text-2xl font-bold text-white mb-2 font-serif">{HOW_NICK_PICKS_HEADING}</h2>
            <p className="text-gray-400 max-w-2xl">{HOW_NICK_PICKS_INTRO}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_NICK_PICKS.map((c) => (
              <div key={c.title} className="bg-[#0D0D0D] border border-[#333] rounded-lg p-4">
                <h3 className="font-semibold text-white mb-1.5 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#E2741B] flex-shrink-0 mt-0.5" />
                  {c.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search recovery products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
              data-testid="input-search-store"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="bg-[#1a1a1a] border border-[#333] flex-wrap h-auto gap-1 p-1 mb-8">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-[#E2741B] data-[state=active]:text-black text-gray-400 flex items-center gap-2"
                data-testid={`tab-${category.id}`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory}>
            {selectedCategory !== "all" && CATEGORY_GUIDES[selectedCategory] && (
              <div
                className="mb-6 rounded-lg border border-[#E2741B]/30 bg-[#E2741B]/10 p-4"
                data-testid={`cat-guide-${selectedCategory}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E2741B] mb-1.5">
                  What to look for
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {CATEGORY_GUIDES[selectedCategory]}
                </p>
              </div>
            )}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} id={product.id}>
                    <ProductCard product={product} tag={affiliateTag} configReady={configReady} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-[#1a1a1a] border border-[#333]">
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your search or category filter</p>
                  <Button
                    variant="outline"
                    className="border-[#E2741B] text-[#E2741B] hover:bg-[#E2741B]/10"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    data-testid="button-clear-filters"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <section className="mt-16 bg-[#1a1a1a] border border-[#333] rounded-2xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4 font-serif">Why These Products?</h2>
            <p className="text-gray-400 mb-6">
              Every product in the Recovery Store has been personally tested by Nick Kremers 
              or recommended by stroke recovery specialists. We only feature products that 
              genuinely help the recovery journey - no paid placements, no compromises.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E2741B]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-[#E2741B]" />
                </div>
                <h3 className="font-semibold text-white mb-1">Survivor Tested</h3>
                <p className="text-sm text-gray-500">Every product used in real recovery journeys</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E2741B]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-[#E2741B]" />
                </div>
                <h3 className="font-semibold text-white mb-1">Expert Curated</h3>
                <p className="text-sm text-gray-500">Selected based on therapeutic value</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E2741B]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-[#E2741B]" />
                </div>
                <h3 className="font-semibold text-white mb-1">Community First</h3>
                <p className="text-sm text-gray-500">Affiliate revenue supports survivors</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 border-t border-[#333]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center font-serif">
              Recovery Store FAQ
            </h2>
            <div className="space-y-4">
              {STORE_FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5"
                  data-testid={`faq-store-${i}`}
                >
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0D0D0D] border-t border-[#333] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img src={strokeLyfeLogo} alt="Stroke Lyfe" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Stroke Lyfe Recovery Store is part of Stroke Lyfe Inc., a 501(c)(3) nonprofit. 
            Affiliate revenue from purchases supports our scholarship fund and free resources for stroke survivors.
          </p>
          <p className="text-[#E2741B] mt-4 font-semibold">REBUILD. REWIRE. RISE.</p>
        </div>
      </footer>

      <SasquatchChatWidget />
    </div>
  );
}
