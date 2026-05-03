import { useParams } from "wouter";
import { safeJsonLd } from "@/lib/safeJsonLd";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import RecoveryHeader from "@/components/RecoveryHeader";
import NewsletterSignupWidget from "@/components/NewsletterSignupWidget";
import RecoverySEO from "@/components/RecoverySEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import {
  ArrowLeft, Clock, Calendar, User, Eye, Heart,
  Share2, BookOpen, ArrowRight, Twitter, Linkedin,
  Link2, ShieldCheck, List, ChevronDown, ChevronUp
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
  authorBio?: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  heroImageUrl?: string;
  status: string;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
}

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface FaqItem {
  question: string;
  answer: string;
}

// ── Markdown renderer ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function safeUrl(s: string): string {
  const trimmed = s.trim();
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return escapeHtml(trimmed);
  return '#';
}

function processInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // nosemgrep: javascript.lang.security.html-in-template-string
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${safeUrl(href)}" class="text-[#C9941A] hover:underline font-medium">${label}</a>`);
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let pendingParagraph: string[] = [];

  const flushParagraph = () => {
    if (pendingParagraph.length > 0) {
      // nosemgrep: javascript.lang.security.html-in-template-string
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
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    if (line.startsWith('## ')) {
      flushParagraph(); closeList();
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<h2 class="text-2xl font-bold mt-10 mb-4 text-white border-b border-[#333] pb-2">${processInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      flushParagraph(); closeList();
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<h3 class="text-xl font-bold mt-8 mb-3 text-[#C9941A]">${processInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      flushParagraph(); closeList();
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<h4 class="text-lg font-semibold mt-6 mb-2 text-white">${processInline(line.slice(5))}</h4>`);
    } else if (/^[-*]\s/.test(line)) {
      flushParagraph();
      if (inOl) { output.push('</ol>'); inOl = false; }
      if (!inUl) { output.push('<ul class="space-y-2 mb-5 ml-2">'); inUl = true; }
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<li class="text-gray-300 flex gap-2 text-lg"><span class="text-[#C9941A] font-bold mt-0.5 flex-shrink-0">•</span><span>${processInline(line.replace(/^[-*]\s/, ''))}</span></li>`);
    } else if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      if (inUl) { output.push('</ul>'); inUl = false; }
      if (!inOl) { output.push('<ol class="space-y-2 mb-5 ml-2 list-none counter-reset-item">'); inOl = true; }
      const num = line.match(/^(\d+)\./)?.[1] ?? '';
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<li class="text-gray-300 flex gap-3 text-lg"><span class="text-[#C9941A] font-bold flex-shrink-0 w-6">${num}.</span><span>${processInline(line.replace(/^\d+\.\s/, ''))}</span></li>`);
    } else if (line.startsWith('> ')) {
      flushParagraph(); closeList();
      // nosemgrep: javascript.lang.security.html-in-template-string
      output.push(`<blockquote class="border-l-4 border-[#C9941A] pl-4 my-6 italic text-gray-300 text-xl leading-relaxed">${processInline(line.slice(2))}</blockquote>`);
    } else {
      if (inUl || inOl) closeList();
      pendingParagraph.push(line);
    }
  }
  flushParagraph(); closeList();
  return output.join('\n');
}

// ── TOC extractor ────────────────────────────────────────────────────────────
// Injects id attributes into h2/h3 tags and returns the TOC item list

function extractTOC(html: string): { items: TocItem[]; html: string } {
  const items: TocItem[] = [];
  let counter = 0;
  const injected = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, lvl, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return _match;
    const id = `h-${counter++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)}`;
    items.push({ id, text, level: parseInt(lvl) as 2 | 3 });
    // nosemgrep: javascript.lang.security.html-in-template-string
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
  return { items, html: injected };
}

// ── FAQ extractor ─────────────────────────────────────────────────────────────
// Finds h3 headings that end with "?" and the next <p> as the answer

function extractFAQs(html: string): FaqItem[] {
  const faqs: FaqItem[] = [];
  const regex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const q = match[1].replace(/<[^>]+>/g, '').trim();
    const a = match[2].replace(/<[^>]+>/g, '').trim();
    if (q.endsWith('?') && a.length > 30) {
      faqs.push({ question: q, answer: a.slice(0, 600) });
    }
  }
  return faqs.slice(0, 8);
}

// ── Styling maps ──────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecoveryBlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  // UI state
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeTocId, setActiveTocId] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // Data
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

  // Derived content — useMemo so we don't re-parse on every render
  const rawContent = post?.content || '';

  const rawRendered = useMemo(
    () => renderMarkdown(rawContent),
    [rawContent]
  );

  const { items: tocItems, html: renderedContent } = useMemo(
    () => (post ? extractTOC(rawRendered) : { items: [], html: '' }),
    [rawRendered, post]
  );

  const faqItems = useMemo(() => extractFAQs(rawRendered), [rawRendered]);

  const wordCount = useMemo(
    () => rawContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 0).length,
    [rawContent]
  );

  const calculatedReadTime = post?.readTime && post.readTime > 0
    ? post.readTime
    : Math.max(1, Math.round(wordCount / 238));

  // Reading progress bar
  useEffect(() => {
    const update = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      if (scrollable <= 0) { setReadingProgress(100); return; }
      setReadingProgress(Math.max(0, Math.min(100, (-top / scrollable) * 100)));
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Active TOC heading via IntersectionObserver
  useEffect(() => {
    if (!tocItems.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveTocId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tocItems]);

  // Handlers
  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLocalLikes(1);
    toast({ description: "Thanks for showing your support!" });
  };

  const baseUrl = "https://strokerecoveryacademy.com";
  const postUrl = `${baseUrl}/recovery/blog/${slug}`;

  const shareTwitter = () => {
    const text = encodeURIComponent(`"${post?.title}" — by Nick Kremers (stroke survivor → 90% recovery)`);
    const url = encodeURIComponent(postUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(postUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ description: "Link copied to clipboard!" });
  };

  const relatedPosts = allPosts
    .filter(p => p.slug !== slug && (p.category === post?.category || p.tags?.some(t => post?.tags?.includes(t))))
    .slice(0, 3);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatShortDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-8 w-24 bg-[#1a1a1a]" />
          <Skeleton className="h-12 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-48 w-full bg-[#1a1a1a]" />
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full bg-[#1a1a1a]" />)}
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

  const gradient = categoryGradients[post.category] || "from-[#C9941A]/20 to-[#0D0D0D]";
  const authorName = post.authorName || "Nick Kremers";
  const authorBioText = post.authorBio ||
    "Nick Kremers is a hemorrhagic stroke survivor (December 3, 2018) and founder of Stroke Recovery Academy. He developed the Sasquatch Method and SASCH framework after recovering from complete left-side paralysis to full independent mobility.";

  // ── JSON-LD schemas ──────────────────────────────────────────────────────────

  const schemaGraph: object[] = [
    {
      "@type": "MedicalWebPage",
      "@id": `${postUrl}#webpage`,
      "url": postUrl,
      "name": post.title,
      "description": post.excerpt || '',
      "about": {
        "@type": "MedicalCondition",
        "name": "Stroke Recovery",
        "url": "https://en.wikipedia.org/wiki/Stroke_recovery"
      },
      "audience": { "@type": "MedicalAudience", "audienceType": "Patient" },
      "lastReviewed": post.updatedAt || post.createdAt,
      "reviewedBy": {
        "@type": "Person",
        "@id": `${baseUrl}#nick-kremers`,
        "name": "Nick Kremers"
      },
      "mainContentOfPage": { "@id": `${postUrl}#article` }
    },
    {
      "@type": "Article",
      "@id": `${postUrl}#article`,
      "headline": post.title,
      "description": post.excerpt || '',
      "url": postUrl,
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt || post.createdAt,
      "author": {
        "@type": "Person",
        "@id": `${baseUrl}#nick-kremers`,
        "name": authorName,
        "description": authorBioText,
        "url": `${baseUrl}/recovery`
      },
      "publisher": {
        "@type": "Organization",
        "name": "Stroke Recovery Academy",
        "url": baseUrl,
        "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` }
      },
      "image": post.heroImageUrl ? {
        "@type": "ImageObject",
        "url": post.heroImageUrl,
        "width": 1200,
        "height": 630
      } : undefined,
      "mainEntityOfPage": { "@type": "WebPage", "@id": postUrl },
      "keywords": (post.tags || []).join(", "),
      "articleSection": post.category,
      "wordCount": wordCount,
      "timeRequired": `PT${calculatedReadTime}M`
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Recovery Home", "item": `${baseUrl}/recovery` },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/recovery/blog` },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
      ]
    },
    {
      "@type": "Person",
      "@id": `${baseUrl}#nick-kremers`,
      "name": "Nick Kremers",
      "jobTitle": "Stroke Recovery Coach & Educator",
      "description": authorBioText,
      "url": `${baseUrl}/recovery`,
      "knowsAbout": ["stroke recovery", "neuroplasticity", "hemorrhagic stroke", "rehabilitation", "SASCH method", "stroke survivor"]
    }
  ];

  if (faqItems.length > 0) {
    schemaGraph.push({
      "@type": "FAQPage",
      "@id": `${postUrl}#faq`,
      "mainEntity": faqItems.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Reading progress bar — fixed at top */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-[#C9941A] z-[9999] transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <RecoverySEO
        title={`${post.title} | Stroke Recovery Academy`}
        description={post.excerpt || `Read this article by ${authorName} on Stroke Recovery Academy.`}
        canonical={`/recovery/blog/${post.slug}`}
        keywords={[...(post.tags || []), "stroke recovery", "Nick Kremers", post.category, "stroke survivor", "medical"]}
        pageType="article"
        author={authorName}
        image={post.heroImageUrl || undefined}
        publishedTime={post.createdAt}
        modifiedTime={post.updatedAt}
        breadcrumbs={[
          { name: "Recovery Hub", url: "/recovery" },
          { name: "Blog", url: "/recovery/blog" },
          { name: post.title, url: `/recovery/blog/${post.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd({ "@context": "https://schema.org", "@graph": schemaGraph }) }}
      />

      <RecoveryHeader />

      {/* Hero banner */}
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
            <p className="text-xl text-gray-300 leading-relaxed mb-8">{post.excerpt}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-[#C9941A]">
              <ShieldCheck className="h-4 w-4" />
              Reviewed {formatShortDate(post.updatedAt || post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {calculatedReadTime} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatNumber(post.viewCount)} views
            </span>
          </div>
        </div>
      </div>

      {/* Content grid — article + TOC sidebar */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className={tocItems.length > 3 ? "lg:grid lg:grid-cols-[1fr_240px] lg:gap-12" : ""}>

          {/* Article column */}
          <div>
            {/* Mobile TOC — collapsible */}
            {tocItems.length > 3 && (
              <div className="lg:hidden mb-8 bg-[#1a1a1a] border border-[#333] rounded-md overflow-hidden">
                <button
                  onClick={() => setMobileTocOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white"
                  data-testid="button-mobile-toc-toggle"
                >
                  <span className="flex items-center gap-2">
                    <List className="h-4 w-4 text-[#C9941A]" />
                    In this article
                  </span>
                  {mobileTocOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {mobileTocOpen && (
                  <nav className="px-4 pb-4 border-t border-[#333] pt-3 space-y-1">
                    {tocItems.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className={`block py-1 text-sm transition-colors ${item.level === 3 ? 'pl-4 text-gray-500' : 'text-gray-300'} hover:text-[#C9941A]`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            <article
              ref={articleRef}
              className="prose-recovery"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
              data-testid="article-content"
            />

            <Separator className="my-10 bg-[#333]" />

            {/* Action row: Like + social share + tags */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
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
                  size="icon"
                  className="border-[#333] text-[#1DA1F2]"
                  onClick={shareTwitter}
                  data-testid="button-share-twitter"
                  title="Share on Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#333] text-[#0A66C2]"
                  onClick={shareLinkedIn}
                  data-testid="button-share-linkedin"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#333] text-gray-400"
                  onClick={copyLink}
                  data-testid="button-copy-link"
                  title="Copy link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-[#333] text-gray-400 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Author card */}
            <Card className="bg-[#1a1a1a] border-[#333] p-6 mt-10">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-full bg-[#C9941A]/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-[#C9941A]" />
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">{authorName}</p>
                  <p className="text-xs text-[#C9941A] mb-2">Stroke Survivor · Founder, Stroke Recovery Academy</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{authorBioText}</p>
                </div>
              </div>
            </Card>

            {/* Newsletter */}
            <div className="mt-10">
              <NewsletterSignupWidget
                source="blog"
                headline="Like what you just read?"
                subheadline="Nick sends 10 real emails over 67 days — the stuff behind the articles. His worst moments, his protocol, what Year 7 actually feels like. Free."
              />
            </div>

            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold mb-5 text-white">Related Articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedPosts.map(related => (
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
                            {related.readTime || calculatedReadTime} min
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
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

          {/* Desktop TOC sidebar */}
          {tocItems.length > 3 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <List className="h-3.5 w-3.5 text-[#C9941A]" />
                  In this article
                </h4>
                <nav className="space-y-0.5">
                  {tocItems.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 text-sm leading-snug transition-colors border-l-2 ${
                        item.level === 3 ? 'pl-5' : 'pl-3'
                      } ${
                        activeTocId === item.id
                          ? 'border-[#C9941A] text-[#C9941A] font-medium'
                          : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                      }`}
                      data-testid={`toc-link-${item.id}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>

                {/* Mini share panel in sidebar */}
                <div className="mt-8 pt-6 border-t border-[#333]">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Share</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={shareTwitter}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#1DA1F2] transition-colors"
                      data-testid="button-sidebar-share-twitter"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter / X
                    </button>
                    <button
                      onClick={shareLinkedIn}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#0A66C2] transition-colors"
                      data-testid="button-sidebar-share-linkedin"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </button>
                    <button
                      onClick={copyLink}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                      data-testid="button-sidebar-copy-link"
                    >
                      <Link2 className="h-4 w-4" />
                      Copy link
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <SasquatchChatWidget />
    </div>
  );
}
