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
  ShoppingCart,
  CheckCircle,
  Shield,
  Award,
  TrendingUp,
  Users,
  Quote,
} from "lucide-react";
const sasquatchLogo = "/sasquatch-logo.webp";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  whyRecommended: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewCount: number;
  amazonUrl: string;
  imageUrl: string;
  category: string;
  tags: string[];
  recoveryBenefits: string[];
  nickSays?: string;
  isBestSeller?: boolean;
  isNicksPick?: boolean;
}

const RECOVERY_PRODUCTS: Product[] = [
  {
    id: "push-up-bars-1",
    name: "Perfect Fitness Push Up Bars",
    brand: "Perfect Fitness",
    description: "Ergonomic push up bars with cushioned rotating grips that reduce wrist strain and engage more muscles. Ideal for stroke survivors rebuilding upper body strength.",
    whyRecommended: "The rotating grip reduces wrist strain common after stroke while the stable base provides confidence during exercises.",
    price: "$24.99",
    rating: 4.7,
    reviewCount: 28543,
    amazonUrl: "https://www.amazon.com/dp/B008DNAJ5M",
    imageUrl: "https://m.media-amazon.com/images/I/71qg1w0YuBL._AC_SL1500_.jpg",
    category: "strength",
    tags: ["Upper Body", "Strength Training", "Low Impact"],
    recoveryBenefits: ["Builds arm strength", "Reduces wrist strain", "Improves stability"],
    nickSays: "These saved my wrists when I started rebuilding. The rotation takes pressure off and lets you focus on the movement.",
    isBestSeller: true,
    isNicksPick: true,
  },
  {
    id: "grip-strengthener-1",
    name: "Grip Strength Trainer Set",
    brand: "FitBeast",
    description: "Complete hand grip strengthener set with adjustable resistance (22-132 lbs). Includes finger exerciser, grip ring, stress relief ball, and finger stretcher bands.",
    whyRecommended: "Perfect for stroke survivors working on fine motor skills and hand strength. Start low and progressively increase resistance.",
    price: "$12.99",
    rating: 4.5,
    reviewCount: 45892,
    amazonUrl: "https://www.amazon.com/dp/B07B2Z3YXS",
    imageUrl: "https://m.media-amazon.com/images/I/71JT3XNsxzL._AC_SL1500_.jpg",
    category: "strength",
    tags: ["Hand Strength", "Fine Motor", "Adjustable"],
    recoveryBenefits: ["Rebuilds grip strength", "Improves dexterity", "Reduces hand fatigue"],
    nickSays: "I keep one of these on my desk. Every squeeze is a victory. Start where you are.",
    isNicksPick: true,
  },
  {
    id: "therapy-bands-1",
    name: "Fit Simplify Resistance Bands Set",
    brand: "Fit Simplify",
    description: "Set of 5 resistance loop bands with varying resistance levels. Perfect for physical therapy, stretching, and strength training. Includes carrying bag and exercise guide.",
    whyRecommended: "The color-coded resistance levels let you start gentle and progress at your own pace - exactly what recovery demands.",
    price: "$10.95",
    rating: 4.5,
    reviewCount: 156782,
    amazonUrl: "https://www.amazon.com/dp/B01AVDVHTI",
    imageUrl: "https://m.media-amazon.com/images/I/71w4rN9J-aL._AC_SL1500_.jpg",
    category: "therapy",
    tags: ["Physical Therapy", "Stretching", "All Levels"],
    recoveryBenefits: ["Low-impact strength building", "Improves flexibility", "Portable therapy"],
    isBestSeller: true,
  },
  {
    id: "brooks-adrenaline-1",
    name: "Brooks Adrenaline GTS 23",
    brand: "Brooks",
    description: "Premium stability running shoe with GuideRails holistic support system. Provides excellent support for those with gait issues or drop foot, keeping excess movement in check.",
    whyRecommended: "Brooks GuideRails technology helps keep your stride natural even with drop foot. The wide toe box accommodates AFOs.",
    price: "$139.95",
    rating: 4.6,
    reviewCount: 12453,
    amazonUrl: "https://www.amazon.com/dp/B0B9T2MJZQ",
    imageUrl: "https://m.media-amazon.com/images/I/71TZFqGq0kL._AC_SL1500_.jpg",
    category: "mobility",
    tags: ["Drop Foot", "Stability", "AFO Compatible"],
    recoveryBenefits: ["Supports drop foot", "Accommodates AFOs", "Prevents overpronation"],
    nickSays: "Best shoes I found for my drop foot. The support is real and they actually look good.",
    isNicksPick: true,
  },
  {
    id: "afo-brace-1",
    name: "Ossur AFO Dynamic Brace",
    brand: "Ossur",
    description: "Lightweight carbon fiber ankle-foot orthosis for drop foot. Provides dynamic support during walking while allowing natural ankle movement.",
    whyRecommended: "Medical-grade drop foot support that fits in regular shoes. Helps prevent tripping and improves gait confidence.",
    price: "$89.00",
    rating: 4.4,
    reviewCount: 892,
    amazonUrl: "https://www.amazon.com/dp/B07XNQB9RK",
    imageUrl: "https://m.media-amazon.com/images/I/51Fq9rMOoRL._AC_SL1200_.jpg",
    category: "mobility",
    tags: ["AFO", "Drop Foot", "Medical Grade"],
    recoveryBenefits: ["Prevents foot drop", "Improves walking confidence", "Fits in shoes"],
  },
  {
    id: "drop-foot-stretcher-1",
    name: "ProStretch Plus Calf Stretcher",
    brand: "Medi-Dyne",
    description: "Adjustable calf and foot stretcher designed for drop foot recovery. Provides deep, effective stretching of the Achilles tendon and plantar fascia.",
    whyRecommended: "Essential for maintaining ankle flexibility with drop foot. Use daily to prevent contractures and improve range of motion.",
    price: "$39.95",
    rating: 4.5,
    reviewCount: 5672,
    amazonUrl: "https://www.amazon.com/dp/B001HTFZZ8",
    imageUrl: "https://m.media-amazon.com/images/I/71mvYMRvFJL._AC_SL1500_.jpg",
    category: "mobility",
    tags: ["Stretching", "Drop Foot", "Flexibility"],
    recoveryBenefits: ["Stretches calf muscles", "Improves ankle mobility", "Prevents tightness"],
    isNicksPick: true,
  },
  {
    id: "walking-cane-1",
    name: "HurryCane Freedom Edition",
    brand: "HurryCane",
    description: "Pivoting base walking cane that provides stability on any terrain. Folds for easy storage and adjusts to your height. Perfect for post-stroke mobility support.",
    whyRecommended: "The pivoting base provides extra stability on uneven surfaces - a game changer for stroke survivors regaining mobility.",
    price: "$39.99",
    rating: 4.3,
    reviewCount: 18234,
    amazonUrl: "https://www.amazon.com/dp/B00MV4WEVU",
    imageUrl: "https://m.media-amazon.com/images/I/61Vq4Y9nDdL._AC_SL1500_.jpg",
    category: "mobility",
    tags: ["Walking Aid", "Stability", "Foldable"],
    recoveryBenefits: ["Extra stability", "Confidence walking", "Portable"],
  },
  {
    id: "brain-games-book-1",
    name: "399 Games, Puzzles & Trivia for Stroke Recovery",
    brand: "Rockridge Press",
    description: "Comprehensive brain exercise book designed specifically for stroke survivors. Includes word searches, crosswords, memory games, and cognitive exercises at varying difficulty levels.",
    whyRecommended: "Designed BY stroke survivors FOR stroke survivors. Progressive difficulty lets you build cognitive strength at your pace.",
    price: "$15.99",
    rating: 4.6,
    reviewCount: 3421,
    amazonUrl: "https://www.amazon.com/dp/1648769039",
    imageUrl: "https://m.media-amazon.com/images/I/71MlZZk0NeL._AC_SL1500_.jpg",
    category: "brain",
    tags: ["Cognitive", "Puzzles", "Word Games"],
    recoveryBenefits: ["Rebuilds cognitive function", "Improves memory", "Fun daily exercise"],
    isBestSeller: true,
  },
  {
    id: "word-search-1",
    name: "Large Print Word Search for Stroke Survivors",
    brand: "Brain Health Publishing",
    description: "Extra-large print word search puzzles designed for stroke recovery. Features easy-to-read fonts, simple to challenging progressions, and stroke-relevant themes.",
    whyRecommended: "Large print reduces eye strain while word finding exercises rebuild language processing pathways damaged by stroke.",
    price: "$9.99",
    rating: 4.7,
    reviewCount: 1892,
    amazonUrl: "https://www.amazon.com/dp/B09MYQWG2M",
    imageUrl: "https://m.media-amazon.com/images/I/71kR0SQZWXL._AC_SL1500_.jpg",
    category: "brain",
    tags: ["Word Search", "Large Print", "Cognitive"],
    recoveryBenefits: ["Improves word recall", "Low-stress activity", "Daily brain exercise"],
  },
  {
    id: "crossword-puzzles-1",
    name: "Easy Crossword Puzzles for Adults",
    brand: "Funster",
    description: "Large print crossword puzzles with easy to medium difficulty. Perfect for rebuilding vocabulary and cognitive function after stroke.",
    whyRecommended: "Crosswords activate multiple brain regions simultaneously - perfect for neuroplasticity and language recovery.",
    price: "$7.99",
    rating: 4.5,
    reviewCount: 8934,
    amazonUrl: "https://www.amazon.com/dp/1953561020",
    imageUrl: "https://m.media-amazon.com/images/I/71SzW+RqxVL._AC_SL1500_.jpg",
    category: "brain",
    tags: ["Crosswords", "Large Print", "Vocabulary"],
    recoveryBenefits: ["Expands vocabulary", "Activates memory", "Fun daily challenge"],
  },
  {
    id: "sudoku-1",
    name: "Sudoku Puzzles for Stroke Recovery",
    brand: "Brain Games",
    description: "Large format Sudoku puzzles ranging from very easy to medium. Helps rebuild logic, pattern recognition, and concentration after stroke.",
    whyRecommended: "Numbers-based puzzles work different brain pathways than word games - use both for comprehensive cognitive recovery.",
    price: "$8.99",
    rating: 4.4,
    reviewCount: 2341,
    amazonUrl: "https://www.amazon.com/dp/1640307834",
    imageUrl: "https://m.media-amazon.com/images/I/81V7YpJe8XL._AC_SL1500_.jpg",
    category: "brain",
    tags: ["Sudoku", "Logic", "Numbers"],
    recoveryBenefits: ["Improves logic", "Builds concentration", "Pattern recognition"],
  },
  {
    id: "putty-therapy-1",
    name: "Theraputty Hand Exercise Putty Set",
    brand: "TheraBand",
    description: "Professional-grade therapy putty in 4 resistance levels. Used by occupational therapists for hand strengthening and fine motor skill development.",
    whyRecommended: "The gold standard for hand therapy. Different resistances let you progress as strength returns.",
    price: "$24.95",
    rating: 4.7,
    reviewCount: 6782,
    amazonUrl: "https://www.amazon.com/dp/B001AW1PE0",
    imageUrl: "https://m.media-amazon.com/images/I/71-lOSyTRfL._AC_SL1500_.jpg",
    category: "therapy",
    tags: ["Hand Therapy", "Fine Motor", "OT Approved"],
    recoveryBenefits: ["Rebuilds hand strength", "Improves dexterity", "Reduces stiffness"],
    isNicksPick: true,
  },
  {
    id: "balance-board-1",
    name: "StrongTek Balance Board",
    brand: "StrongTek",
    description: "Wooden balance board for stability training. Helps rebuild core strength, balance, and proprioception after stroke.",
    whyRecommended: "Balance is one of the first things to go and last to return. This board helps accelerate that recovery safely.",
    price: "$39.99",
    rating: 4.6,
    reviewCount: 9823,
    amazonUrl: "https://www.amazon.com/dp/B07D8J6BHR",
    imageUrl: "https://m.media-amazon.com/images/I/71+VZ3cX3RL._AC_SL1500_.jpg",
    category: "therapy",
    tags: ["Balance", "Core Strength", "Stability"],
    recoveryBenefits: ["Improves balance", "Strengthens core", "Builds confidence"],
  },
  {
    id: "pedal-exerciser-1",
    name: "DeskCycle Under Desk Pedal Exerciser",
    brand: "DeskCycle",
    description: "Ultra-quiet under-desk pedal exerciser with 8 resistance levels. Perfect for rebuilding leg strength and circulation while seated.",
    whyRecommended: "You can use this while watching TV or working. Consistent movement is key - this makes it easy.",
    price: "$179.00",
    originalPrice: "$199.00",
    rating: 4.5,
    reviewCount: 15234,
    amazonUrl: "https://www.amazon.com/dp/B00B1VDNQA",
    imageUrl: "https://m.media-amazon.com/images/I/61JC0BFDRVL._AC_SL1000_.jpg",
    category: "strength",
    tags: ["Leg Exercise", "Seated", "Circulation"],
    recoveryBenefits: ["Rebuilds leg strength", "Improves circulation", "Low impact"],
    nickSays: "I use this every day. Put it under my desk and pedal while I work. No excuses.",
    isNicksPick: true,
  },
  {
    id: "finger-exerciser-1",
    name: "D'Addario Varigrip Hand Exerciser",
    brand: "D'Addario",
    description: "Adjustable tension finger exerciser that allows individual finger strengthening. Originally for musicians, perfect for stroke fine motor recovery.",
    whyRecommended: "Each finger can be worked independently at different tensions - crucial for recovering individual finger control.",
    price: "$14.99",
    rating: 4.6,
    reviewCount: 21567,
    amazonUrl: "https://www.amazon.com/dp/B001OCGGEM",
    imageUrl: "https://m.media-amazon.com/images/I/71WFj3T+0QL._AC_SL1500_.jpg",
    category: "strength",
    tags: ["Finger Strength", "Individual Control", "Portable"],
    recoveryBenefits: ["Individual finger control", "Rebuilds dexterity", "Portable therapy"],
  },
];

const CATEGORIES = [
  { id: "all", name: "All Products", icon: ShoppingCart },
  { id: "strength", name: "Strength Training", icon: Dumbbell },
  { id: "mobility", name: "Mobility & Drop Foot", icon: Footprints },
  { id: "therapy", name: "Therapy Tools", icon: Hand },
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
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#E2741B]">{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
              )}
            </div>
            {configReady ? (
              <Button
                asChild
                className="bg-[#E2741B] hover:bg-[#B8860B] text-black"
                data-testid={`button-buy-${product.id}`}
              >
                <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored nofollow">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="bg-[#E2741B]/40 text-black"
                data-testid={`button-buy-${product.id}-loading`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Loading…
              </Button>
            )}
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
    "@type": "Store",
    name: "Stroke Recovery Academy Recovery Store",
    description: "Curated recovery products recommended by stroke survivor Nick Kremers. Every product is hand-picked for stroke recovery success.",
    url: "https://strokelyfe.org/store",
    brand: { "@type": "Brand", name: "Stroked-Out Sasquatch" },
    founder: {
      "@type": "Person",
      name: "Nick Kremers",
      description: "Stroke survivor who recovered from 0% to 90% function. Expert in stroke recovery methodology.",
      knowsAbout: ["Stroke Recovery", "Neuroplasticity", "Physical Therapy", "Cognitive Rehabilitation"],
    },
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
            <img src={sasquatchLogo} alt="Stroked-Out Sasquatch" className="h-10 w-auto" />
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
            <img src={sasquatchLogo} alt="Nick's Picks" className="w-10 h-10" />
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
                  <p className="text-gray-400">Try adjusting your search or category filter</p>
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
      </main>

      <footer className="bg-[#0D0D0D] border-t border-[#333] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img src={sasquatchLogo} alt="Stroked-Out Sasquatch" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            The Recovery Store is part of Stroke Lyfe Inc., a 501(c)(3) nonprofit. 
            Affiliate revenue from purchases supports our scholarship fund and free resources for stroke survivors.
          </p>
          <p className="text-[#E2741B] mt-4 font-semibold">REBUILD. REWIRE. RISE.</p>
        </div>
      </footer>

      <SasquatchChatWidget />
    </div>
  );
}
