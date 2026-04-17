import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import RecoveryHeader from "@/components/RecoveryHeader";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import {
  ArrowLeft, Clock, Calendar, User, Eye, Heart,
  MessageCircle, Share2, BookOpen, ArrowRight, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
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

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#C9941A] hover:underline font-medium">$1</a>');
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let pendingParagraph: string[] = [];

  const flushParagraph = () => {
    if (pendingParagraph.length > 0) {
      output.push(`<p class="text-gray-300 mb-5 leading-relaxed text-lg">${processInline(pendingParagraph.join(' '))}</p>`);
      pendingParagraph = [];
    }
  };

  const closeList = () => {
    if (inUl) { output.push('</ul>'); inUl = false; }
    if (inOl) { output.push('</ol>'); inOl = false; }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph(); closeList();
      output.push(`<h2 class="text-2xl font-bold mt-10 mb-4 text-white border-b border-[#333] pb-2">${processInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      flushParagraph(); closeList();
      output.push(`<h3 class="text-xl font-bold mt-8 mb-3 text-[#C9941A]">${processInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      flushParagraph(); closeList();
      output.push(`<h4 class="text-lg font-semibold mt-6 mb-2 text-white">${processInline(line.slice(5))}</h4>`);
    } else if (/^[-*]\s/.test(line)) {
      flushParagraph();
      if (inOl) { output.push('</ol>'); inOl = false; }
      if (!inUl) { output.push('<ul class="space-y-2 mb-5 ml-2">'); inUl = true; }
      output.push(`<li class="text-gray-300 flex gap-2 text-lg"><span class="text-[#C9941A] font-bold mt-0.5 flex-shrink-0">•</span><span>${processInline(line.replace(/^[-*]\s/, ''))}</span></li>`);
    } else if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      if (inUl) { output.push('</ul>'); inUl = false; }
      if (!inOl) { output.push('<ol class="space-y-2 mb-5 ml-2 list-none counter-reset-item">'); inOl = true; }
      const num = line.match(/^(\d+)\./)?.[1] ?? '';
      output.push(`<li class="text-gray-300 flex gap-3 text-lg"><span class="text-[#C9941A] font-bold flex-shrink-0 w-6">${num}.</span><span>${processInline(line.replace(/^\d+\.\s/, ''))}</span></li>`);
    } else if (line.startsWith('> ')) {
      flushParagraph(); closeList();
      output.push(`<blockquote class="border-l-4 border-[#C9941A] pl-4 my-6 italic text-gray-300 text-xl leading-relaxed">${processInline(line.slice(2))}</blockquote>`);
    } else {
      if (inUl || inOl) { closeList(); }
      pendingParagraph.push(line);
    }
  }

  flushParagraph();
  closeList();
  return output.join('\n');
}

const categoryColors: Record<string, string> = {
  philosophy: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  therapy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  science: "bg-green-500/20 text-green-400 border-green-500/30",
  exercises: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  caregivers: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  income: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const categoryGradients: Record<string, string> = {
  philosophy: "from-purple-900/30 to-[#0D0D0D]",
  therapy: "from-blue-900/30 to-[#0D0D0D]",
  science: "from-green-900/30 to-[#0D0D0D]",
  exercises: "from-orange-900/30 to-[#0D0D0D]",
  caregivers: "from-pink-900/30 to-[#0D0D0D]",
  income: "from-yellow-900/30 to-[#0D0D0D]",
};

export default function RecoveryBlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ['/api/recovery/blog', slug],
    queryFn: async () => {
      const res = await fetch(`/api/recovery/blog/${slug}`);
      if (!res.ok) throw new Error('Post not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: allPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/recovery/blog'],
    queryFn: async () => {
      const res = await fetch('/api/recovery/blog');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLocalLikes(1);
    toast({ description: "Thanks for showing your support!" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ description: "Link copied to clipboard!" });
    }
  };

  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && (p.category === post?.category || p.tags?.some((t) => post?.tags?.includes(t))))
    .slice(0, 3);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-8 w-24 bg-[#1a1a1a]" />
          <Skeleton className="h-12 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-48 w-full bg-[#1a1a1a]" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full bg-[#1a1a1a]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">Article Not Found</h1>
          <p className="text-gray-400 mb-6">This article may have been moved or doesn't exist.</p>
          <Link href="/recovery/blog">
            <Button className="bg-[#C9941A] text-black font-semibold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderedContent = renderMarkdown(post.content || '');
  const gradient = categoryGradients[post.category] || "from-[#C9941A]/20 to-[#0D0D0D]";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />

      <div className={`bg-gradient-to-b ${gradient} pt-8 pb-12`}>
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/recovery/blog">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-6 -ml-2 gap-2" data-testid="button-back-blog">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={categoryColors[post.category] || "bg-gray-500/20 text-gray-400"}>
              {post.category}
            </Badge>
            {post.featured && (
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30">
                Featured
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-6 text-white" data-testid="text-article-title">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.authorName || "Nick Kremers"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime || 5} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatNumber(post.viewCount)} views
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <article
          className="prose-recovery"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          data-testid="article-content"
        />

        <Separator className="my-10 bg-[#333]" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className={`border-[#333] gap-2 ${liked ? 'text-red-400 border-red-400/30' : 'text-gray-400'}`}
              onClick={handleLike}
              data-testid="button-like-article"
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-red-400' : ''}`} />
              {formatNumber(post.likeCount + localLikes)}
            </Button>
            <Button
              variant="outline"
              className="border-[#333] text-gray-400 gap-2"
              onClick={handleShare}
              data-testid="button-share-article"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-[#333] text-gray-400 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mt-10">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-[#C9941A]/20 flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-[#C9941A]" />
            </div>
            <div>
              <p className="font-bold text-white mb-1">{post.authorName || "Nick Kremers"}</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Stroke survivor who went from 0% to 90% recovery. Creator of the Sasquatch Method and 
                founder of Stroke Recovery Academy. Author of "The Stroked Out Sasquatch" and 
                "The Ultimate Stroke Recovery Revolution."
              </p>
            </div>
          </div>
        </Card>

        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-5 text-white">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link key={related.id} href={`/recovery/blog/${related.slug}`}>
                  <Card className="bg-[#1a1a1a] border-[#333] hover-elevate cursor-pointer h-full">
                    <div className="h-24 bg-gradient-to-br from-[#C9941A]/15 to-[#0D0D0D] flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-[#C9941A]/40" />
                    </div>
                    <div className="p-4">
                      <Badge className={`${categoryColors[related.category] || "bg-gray-500/20 text-gray-400"} text-xs mb-2`}>
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 mb-2">
                        {related.title}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {related.readTime || 5} min
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-gradient-to-br from-[#C9941A]/20 to-[#1a1a1a] border-[#C9941A]/30 p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Start Your Recovery?</h2>
          <p className="text-gray-300 mb-6">
            Join the 66-Day Sasquatch Transformation Challenge and go from surviving to thriving.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/recovery/challenge">
              <Button className="bg-[#C9941A] text-black font-semibold gap-2">
                Join the Challenge <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/recovery/community">
              <Button variant="outline" className="border-[#C9941A]/50 text-[#C9941A] gap-2">
                Join the Community
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <SasquatchChatWidget />
    </div>
  );
}
