import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
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
}

const categories = [
  { id: "all", label: "All Posts" },
  { id: "philosophy", label: "Philosophy" },
  { id: "therapy", label: "Therapy" },
  { id: "science", label: "Science" },
  { id: "exercises", label: "Exercises" },
  { id: "caregivers", label: "Caregivers" },
];

const categoryColors: Record<string, string> = {
  philosophy: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  therapy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  science: "bg-green-500/20 text-green-400 border-green-500/30",
  exercises: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  caregivers: "bg-pink-500/20 text-pink-400 border-pink-500/30",
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
      year: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="Recovery Blog | Stroke Recovery Academy"
        description="Expert insights, recovery tips, and survivor stories from Nick Kremers and the Stroke Recovery Academy."
        canonical="/recovery/blog"
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <BookOpen className="h-10 w-10 text-[#C9941A]" />
            Recovery Blog
          </h1>
          <p className="text-gray-400 text-lg">
            Expert insights, recovery strategies, and survivor stories from Nick Kremers
          </p>
        </div>

        <div className="relative mb-6">
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
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "bg-[#C9941A] text-black" : "border-[#333] text-gray-300"}
              data-testid={`button-category-${cat.id}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <TrendingUp className="h-6 w-6 text-[#C9941A]" />
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post) => (
                <Card 
                  key={post.id} 
                  className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#C9941A]/30 transition-all duration-200 cursor-pointer group" 
                  data-testid={`card-featured-${post.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-[#C9941A]/20 to-[#0D0D0D] flex items-center justify-center relative overflow-hidden">
                    <BookOpen className="h-16 w-16 text-[#C9941A]/50 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#C9941A] text-black">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <Badge className={categoryColors[post.category] || "bg-gray-500/20 text-gray-400"}>
                      {post.category}
                    </Badge>
                    <h3 className="text-xl font-bold mt-3 mb-2 text-white group-hover:text-[#C9941A] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333]">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
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
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {post.readTime || 5} min read
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#C9941A]/30 transition-all duration-200 cursor-pointer group" 
                data-testid={`card-post-${post.id}`}
              >
                <div className="h-32 bg-gradient-to-br from-[#C9941A]/10 to-[#0D0D0D] flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-[#C9941A]/30 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-5">
                  <Badge className={categoryColors[post.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                    {post.category}
                  </Badge>
                  <h3 className="font-bold mt-2 mb-2 text-white line-clamp-2 group-hover:text-[#C9941A] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#333] text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(post.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(post.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime || 5} min
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search or category filter
            </p>
            <Button 
              variant="outline" 
              className="border-[#C9941A] text-[#C9941A]"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-[#C9941A]/20 to-[#1a1a1a] border-[#C9941A]/30 p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold mb-3">Want to Share Your Recovery Story?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Your journey could inspire thousands of other survivors. Submit your story and help build 
            the world's largest collection of stroke recovery experiences.
          </p>
          <Button className="bg-[#C9941A] text-black font-semibold">
            Submit Your Story <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
