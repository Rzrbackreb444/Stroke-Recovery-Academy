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
  Eye, Heart, MessageCircle, TrendingUp, Sparkles
} from "lucide-react";

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
  { id: "work-career", label: "Work & Career" },
];

const categoryLabels: Record<string, string> = {
  philosophy: "Philosophy",
  therapy: "Therapy",
  science: "Science",
  exercises: "Exercises",
  caregivers: "Caregivers",
  "work-career": "Work & Career",
};

const categoryColors: Record<string, string> = {
  philosophy: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  therapy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  science: "bg-green-500/20 text-green-400 border-green-500/30",
  exercises: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  caregivers: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "work-career": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

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
    <div className="min-h-screen bg-[#0D0D0D] text-white">
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
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-[#E2741B]" />
            Recovery Blog
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Expert insights, recovery strategies, and survivor stories from Nick Kremers
          </p>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#1a1a1a] border-[#333] pl-10 text-white"
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
              className={activeCategory === cat.id ? "bg-[#E2741B] text-black" : "border-[#333] text-gray-300"}
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
                <Card key={i} className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                  <Skeleton className="h-48 w-full bg-[#333]" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-20 bg-[#333]" />
                    <Skeleton className="h-6 w-full bg-[#333]" />
                    <Skeleton className="h-4 w-3/4 bg-[#333]" />
                    <Skeleton className="h-4 w-1/2 bg-[#333]" />
                  </div>
                </Card>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                  <Skeleton className="h-32 w-full bg-[#333]" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-4 w-16 bg-[#333]" />
                    <Skeleton className="h-5 w-full bg-[#333]" />
                    <Skeleton className="h-4 w-3/4 bg-[#333]" />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isLoading && activeCategory === "all" && featuredPosts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#E2741B]" />
              Featured Articles
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post) => (
                <Link key={post.id} href={`/recovery/blog/${post.slug}`}>
                  <Card
                    className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#E2741B]/50 transition-all duration-200 cursor-pointer group h-full"
                    data-testid={`card-featured-${post.id}`}
                  >
                    <div className="h-48 bg-gradient-to-br from-[#E2741B]/20 to-[#0D0D0D] flex items-center justify-center relative">
                      <BookOpen className="h-16 w-16 text-[#E2741B]/50 group-hover:scale-110 transition-transform" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#E2741B] text-black">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={categoryColors[post.category] || "bg-gray-500/20 text-gray-400"}>
                          {categoryLabels[post.category] || post.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">By {post.authorName || "Nick Kremers"}</p>
                      <h3 className="text-xl font-bold mt-1 mb-2 text-white group-hover:text-[#E2741B] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-2">{post.excerpt}</p>

                      <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.createdAt)}
                        </span>
                        {(post.estimatedReadMinutes ?? post.readTime ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.estimatedReadMinutes ?? post.readTime} min read
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333]">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
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
                  className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#E2741B]/50 transition-all duration-200 cursor-pointer group h-full flex flex-col"
                  data-testid={`card-post-${post.id}`}
                >
                  <div className="h-32 bg-gradient-to-br from-[#E2741B]/10 to-[#0D0D0D] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-10 w-10 text-[#E2741B]/30 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <Badge className={`${categoryColors[post.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"} self-start mb-1`}>
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                    <p className="text-xs text-gray-500 mb-2">By {post.authorName || "Nick Kremers"}</p>
                    <h3 className="font-bold mb-2 text-white line-clamp-2 group-hover:text-[#E2741B] transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>

                    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-[#333] text-xs text-gray-500">
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
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#E2741B] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search or category filter
            </p>
            <Button
              variant="outline"
              className="border-[#E2741B] text-[#E2741B]"
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
            >
              Clear Filters
            </Button>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-[#E2741B]/20 to-[#1a1a1a] border-[#E2741B]/30 p-6 sm:p-8 mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Want to Share Your Recovery Story?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            Your journey could inspire thousands of other survivors. Submit your story and help build
            the world's largest collection of stroke recovery experiences.
          </p>
          <Link href="/recovery/community">
            <Button className="bg-[#E2741B] text-black font-semibold">
              Join the Community <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
