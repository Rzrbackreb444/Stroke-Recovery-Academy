import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import {
  BookOpen, Search, Calendar, Clock, User, ArrowRight,
  Eye, Heart, MessageCircle, TrendingUp, Sparkles,
  Brain, Dumbbell, FlaskConical, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  heroImageUrl?: string;
  featuredImage?: string;
  status: string;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  estimatedReadMinutes?: number;
}

const categories = [
  { id: "all", label: "All Posts" },
  { id: "philosophy", label: "Philosophy" },
  { id: "therapy", label: "Therapy" },
  { id: "science", label: "Science" },
  { id: "exercises", label: "Exercises" },
  { id: "caregivers", label: "Caregivers" },
  { id: "income", label: "Income" },
];

const categoryLabels: Record<string, string> = {
  philosophy: "Philosophy",
  therapy: "Therapy",
  science: "Science",
  exercises: "Exercises",
  caregivers: "Caregivers",
  income: "Income",
};

const categoryColors: Record<string, string> = {
  philosophy: "bg-purple-100 text-purple-700 border-purple-200",
  therapy: "bg-blue-100 text-blue-700 border-blue-200",
  science: "bg-green-100 text-green-700 border-green-200",
  exercises: "bg-orange-100 text-orange-700 border-orange-200",
  caregivers: "bg-pink-100 text-pink-700 border-pink-200",
  income: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

interface CategoryIllustrationDef {
  gradient: string;
  dotColor: string;
  iconColor: string;
  Icon: LucideIcon;
}

const CATEGORY_ILLUSTRATIONS: Record<string, CategoryIllustrationDef> = {
  philosophy: { gradient: "from-purple-50 to-purple-100/60", dotColor: "bg-purple-200", iconColor: "#9333EA", Icon: Brain },
  therapy:    { gradient: "from-blue-50 to-blue-100/60",   dotColor: "bg-blue-200",   iconColor: "#2563EB", Icon: Heart },
  science:    { gradient: "from-green-50 to-green-100/60", dotColor: "bg-green-200",  iconColor: "#16A34A", Icon: FlaskConical },
  exercises:  { gradient: "from-orange-50 to-orange-100/60", dotColor: "bg-orange-200", iconColor: "#C06B3E", Icon: Dumbbell },
  caregivers: { gradient: "from-pink-50 to-pink-100/60",   dotColor: "bg-pink-200",   iconColor: "#DB2777", Icon: Users },
  income:     { gradient: "from-yellow-50 to-amber-100/60", dotColor: "bg-yellow-200", iconColor: "#B45309", Icon: TrendingUp },
};

function CategoryIllustration({ category, tall = false }: { category: string; tall?: boolean }) {
  const def = CATEGORY_ILLUSTRATIONS[category] ?? {
    gradient: "from-stone-50 to-[#F5F0EB]",
    dotColor: "bg-[#E2C2A4]",
    iconColor: "#C06B3E",
    Icon: BookOpen,
  };
  const { gradient, dotColor, iconColor, Icon } = def;
  return (
    <div className={`relative w-full ${tall ? "h-48" : "h-32"} bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full opacity-40 ${dotColor}`} />
      <div className={`absolute bottom-4 left-4 w-3 h-3 rounded-full opacity-20 ${dotColor}`} />
      <div className={`absolute top-6 left-6 w-1.5 h-1.5 rounded-full opacity-30 ${dotColor}`} />
      <Icon
        className="group-hover:scale-110 transition-transform duration-200"
        style={{ color: iconColor, width: tall ? 52 : 36, height: tall ? 52 : 36, opacity: 0.65 }}
      />
    </div>
  );
}

export default function RecoveryBlog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/recovery/blog', activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await fetch(`/api/recovery/blog?${params}`);
      if (!res.ok) throw new Error('Failed to fetch blog posts');
      return res.json();
    },
  });

  const { data: categoryCounts = [] } = useQuery<{ category: string; count: number }[]>({
    queryKey: ['/api/recovery/blog/counts'],
    queryFn: async () => {
      const res = await fetch('/api/recovery/blog/counts');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const countMap: Record<string, number> = {};
  let total = 0;
  for (const row of categoryCounts) {
    countMap[row.category] = Number(row.count);
    total += Number(row.count);
  }
  countMap['all'] = total;

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const featuredPosts = posts.filter(p => p.featured);

  const BlogCardImage = ({ src, alt, height, category, tall }: { src?: string; alt: string; height: string; category: string; tall?: boolean }) => {
    if (src) {
      const webpSrc = src.replace(/\.(jpe?g|png)(\?|$)/i, '.webp$2');
      const hasWebp = webpSrc !== src;
      return (
        <div className={`${height} relative overflow-hidden flex-shrink-0`} style={{ contain: "strict" }}>
          <picture>
            {hasWebp && <source srcSet={webpSrc} type="image/webp" />}
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              width={800}
              height={height === "h-48" ? 192 : 128}
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
          </picture>
        </div>
      );
    }
    return (
      <div className="flex-shrink-0">
        <CategoryIllustration category={category} tall={tall} />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917]">
      <RecoveryHeader />
      <RecoverySEO
        title="Stroke Recovery Blog — Expert Insights & Survivor Stories"
        description="Evidence-based stroke recovery articles by Nick Kremers — survivor who went from 0% to 90% recovery. Get actionable rehab tips, neuroplasticity strategies, mindset tools, and real survivor stories."
        canonical="/recovery/blog"
        keywords={[
          "stroke recovery blog", "stroke survivor stories", "stroke rehab tips", "neuroplasticity after stroke",
          "stroke recovery exercises", "post stroke depression tips", "aphasia recovery", "stroke caregiver advice",
          "Nick Kremers blog"
        ]}
        pageType="article"
        author="Nick Kremers"
        speakableSelectors={["h1", ".blog-hero-text", ".featured-article-excerpt"]}
        breadcrumbs={[{ name: "Recovery Hub", url: "/recovery" }, { name: "Blog", url: "/recovery/blog" }]}
        faq={[
          { question: "How long does stroke recovery take?", answer: "Stroke recovery is a lifelong process, but the most significant gains typically happen in the first 3-6 months. Nick Kremers went from 0% to 90% functional recovery over 2+ years of consistent rehabilitation." },
          { question: "What are the most effective stroke recovery exercises?", answer: "The most effective stroke recovery exercises focus on high repetition and task-specific training: mirror therapy, constraint-induced movement therapy, finger extension exercises, and gait training. Research shows 400-1,000 repetitions per session drive the strongest neuroplastic changes." },
          { question: "Can stroke survivors fully recover?", answer: "Many stroke survivors achieve significant recovery — some reaching near-full function. Nick Kremers went from 0% mobility to 90% function through relentless daily rehabilitation." },
        ]}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3 mb-3 text-[#1C1917]">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-[#C06B3E]" />
            Recovery Blog
          </h1>
          <p className="text-[#78716C] text-base sm:text-lg">
            Expert insights, recovery strategies, and survivor stories from Nick Kremers
          </p>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A29E]" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-[#E2C2A4]/40 pl-10 text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#C06B3E]/40"
            data-testid="input-search-blog"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={
                activeCategory === cat.id
                  ? "bg-[#C06B3E] text-white border-[#C06B3E]"
                  : "border-[#E2C2A4]/40 text-[#78716C] hover:border-[#C06B3E]/30 hover:text-[#1C1917]"
              }
              data-testid={`button-category-${cat.id}`}
            >
              {cat.label}{countMap[cat.id] != null ? ` (${countMap[cat.id]})` : ''}
            </Button>
          ))}
        </div>

        {isLoading && (
          <>
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white border-[#E2C2A4]/30 overflow-hidden">
                  <Skeleton className="h-48 w-full bg-[#E2C2A4]/20" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-20 bg-[#E2C2A4]/20" />
                    <Skeleton className="h-6 w-full bg-[#E2C2A4]/20" />
                    <Skeleton className="h-4 w-3/4 bg-[#E2C2A4]/20" />
                    <Skeleton className="h-4 w-1/2 bg-[#E2C2A4]/20" />
                  </div>
                </Card>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-[#E2C2A4]/30 overflow-hidden">
                  <Skeleton className="h-32 w-full bg-[#E2C2A4]/20" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-4 w-16 bg-[#E2C2A4]/20" />
                    <Skeleton className="h-5 w-full bg-[#E2C2A4]/20" />
                    <Skeleton className="h-4 w-3/4 bg-[#E2C2A4]/20" />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isLoading && activeCategory === "all" && featuredPosts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#1C1917]">
              <TrendingUp className="h-6 w-6 text-[#C06B3E]" />
              Featured Articles
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post) => (
                <Link key={post.id} href={`/recovery/blog/${post.slug}`}>
                  <Card
                    className="bg-white border-[#E2C2A4]/30 overflow-hidden hover:border-[#C06B3E]/40 hover:shadow-[0_4px_16px_rgba(192,107,62,0.08)] transition-all duration-200 cursor-pointer group h-full"
                    data-testid={`card-featured-${post.id}`}
                  >
                    <div className="relative">
                      <BlogCardImage 
                        src={post.heroImageUrl || post.featuredImage} 
                        alt={post.title} 
                        height="h-48" 
                        category={post.category}
                        tall
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#C06B3E] text-white border-[#C06B3E]">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <Badge className={categoryColors[post.category] || "bg-stone-100 text-stone-600 border-stone-200"}>
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      <h3 className="text-xl font-bold mt-3 mb-2 text-[#1C1917] group-hover:text-[#C06B3E] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[#78716C] mb-4 line-clamp-2">{post.excerpt}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-[#A8A29E] flex-wrap gap-y-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.estimatedReadMinutes ?? post.readTime} min read
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E2C2A4]/30">
                        <div className="flex items-center gap-3 text-sm text-[#A8A29E]">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {formatNumber(post.viewCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {formatNumber(post.likeCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/recovery/blog/${post.slug}`}>
                <Card
                  className="bg-white border-[#E2C2A4]/30 overflow-hidden hover:border-[#C06B3E]/40 hover:shadow-[0_4px_16px_rgba(192,107,62,0.08)] transition-all duration-200 cursor-pointer group h-full flex flex-col"
                  data-testid={`card-post-${post.id}`}
                >
                  <BlogCardImage 
                    src={post.heroImageUrl || post.featuredImage} 
                    alt={post.title} 
                    height="h-32" 
                    category={post.category}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <Badge className={`${categoryColors[post.category] || "bg-stone-100 text-stone-600 border-stone-200"} self-start mb-2`}>
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                    <h3 className="font-bold mb-2 text-[#1C1917] line-clamp-2 group-hover:text-[#C06B3E] transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-[#78716C] text-sm mb-3 line-clamp-2">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-xs text-[#A8A29E] mt-auto">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                      {(post.estimatedReadMinutes ?? post.readTime ?? 0) > 0 && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {post.estimatedReadMinutes ?? post.readTime} min read
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E2C2A4]/30 text-xs text-[#A8A29E]">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(post.likeCount)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && (
          <Card className="bg-white border-[#E2C2A4]/30 p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C06B3E]/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[#1C1917]">No articles found</h3>
            <p className="text-[#78716C] mb-4">
              Try adjusting your search or category filter
            </p>
            <Button
              variant="outline"
              className="border-[#C06B3E]/40 text-[#C06B3E]"
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
            >
              Clear Filters
            </Button>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-[#C06B3E]/8 to-white border-[#C06B3E]/20 p-6 sm:p-8 mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 text-[#1C1917]">Want to Share Your Recovery Story?</h2>
          <p className="text-[#78716C] mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            Your journey could inspire thousands of other survivors. Submit your story and help build
            the world's largest collection of stroke recovery experiences.
          </p>
          <Link href="/recovery/community">
            <Button className="bg-[#C06B3E] text-white font-semibold">
              Join the Community <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
