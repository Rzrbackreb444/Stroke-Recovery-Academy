import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { 
  BookOpen, Search, Calendar, Clock, User, ArrowRight,
  Heart, Brain, Dumbbell, MessageCircle, TrendingUp
} from "lucide-react";

const categories = [
  { id: "all", label: "All Posts" },
  { id: "recovery", label: "Recovery Tips" },
  { id: "exercises", label: "Exercises" },
  { id: "nutrition", label: "Nutrition" },
  { id: "mindset", label: "Mindset" },
  { id: "stories", label: "Survivor Stories" },
];

const blogPosts = [
  {
    id: 1,
    title: "The Sasquatch Formula: My Journey from 0% to 90% Recovery",
    excerpt: "How I defied medical expectations and built a complete recovery system that anyone can follow.",
    author: "Nick Kremers",
    date: "2024-01-15",
    readTime: "12 min read",
    category: "stories",
    featured: true,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
  },
  {
    id: 2,
    title: "5 Essential Exercises for Upper Extremity Recovery",
    excerpt: "Strengthen your affected arm and hand with these proven rehabilitation exercises.",
    author: "Nick Kremers",
    date: "2024-01-10",
    readTime: "8 min read",
    category: "exercises",
    featured: true,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
  },
  {
    id: 3,
    title: "Neuroplasticity: Your Brain's Superpower for Recovery",
    excerpt: "Understanding how your brain rewires itself and how to maximize this incredible healing ability.",
    author: "Nick Kremers",
    date: "2024-01-05",
    readTime: "10 min read",
    category: "recovery",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800",
  },
  {
    id: 4,
    title: "The Power of Accountability in Stroke Recovery",
    excerpt: "Why having someone hold you accountable can accelerate your recovery by 3x.",
    author: "Nick Kremers",
    date: "2024-01-01",
    readTime: "6 min read",
    category: "mindset",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800",
  },
  {
    id: 5,
    title: "Brain-Boosting Foods for Stroke Recovery",
    excerpt: "The best foods to eat for cognitive recovery and overall brain health.",
    author: "Nick Kremers",
    date: "2023-12-28",
    readTime: "7 min read",
    category: "nutrition",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
  },
  {
    id: 6,
    title: "Managing Drop Foot: Exercises and Strategies",
    excerpt: "Practical tips and exercises to improve your gait and reduce drop foot symptoms.",
    author: "Nick Kremers",
    date: "2023-12-20",
    readTime: "9 min read",
    category: "exercises",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800",
  },
];

export default function RecoveryBlog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(p => p.featured);

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
            Expert insights, recovery strategies, and survivor stories
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

        {activeCategory === "all" && featuredPosts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#C9941A]" />
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#C9941A]/30 transition-colors" data-testid={`card-featured-${post.id}`}>
                  <div className="h-48 bg-gradient-to-br from-[#C9941A]/20 to-[#0D0D0D] flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-[#C9941A]/50" />
                  </div>
                  <div className="p-6">
                    <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30 mb-3">
                      Featured
                    </Badge>
                    <h3 className="text-xl font-bold mb-2 text-white">{post.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <Button variant="ghost" className="text-[#C9941A]" data-testid={`button-read-${post.id}`}>
                        Read <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="bg-[#1a1a1a] border-[#333] overflow-hidden hover:border-[#C9941A]/30 transition-colors" data-testid={`card-post-${post.id}`}>
              <div className="h-32 bg-gradient-to-br from-[#C9941A]/10 to-[#0D0D0D] flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-[#C9941A]/30" />
              </div>
              <div className="p-5">
                <Badge variant="outline" className="border-[#333] text-gray-400 mb-2 capitalize">
                  {post.category}
                </Badge>
                <h3 className="font-bold mb-2 text-white line-clamp-2">{post.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author}
                  </span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-gray-400">Try a different search or category</p>
          </Card>
        )}
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
