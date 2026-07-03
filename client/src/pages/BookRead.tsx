import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import {
  Loader2, Lock, Download, ShoppingCart, BookOpen, FileText,
  ArrowRight, ChevronRight, ChevronLeft, Menu, X, BookMarked,
  ArrowUp, MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TocEntry {
  id: string;
  title: string;
  type: "frontmatter" | "quickstart" | "howto" | "part_header" | "chapter" | "tribe" | "appendix" | "backmatter";
  partLabel?: string;
  chapterNum?: string;
}

interface Entitlement {
  owns: boolean;
  orderId?: number;
  itemId?: number;
  orderNumber?: string;
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderMd(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inBlockquote = false;
  let inList = false;

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s: string): string => {
    let t = escape(s);
    // Bold-italic
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    t = t.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
    // Inline code
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Em-dashes (already in text as — or --)
    t = t.replace(/---/g, "—").replace(/--/g, "–");
    // Markdown links
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="bk-link">$1</a>');
    return t;
  };

  const closeList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
  };
  const closeBlockquote = () => {
    if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      closeList();
      closeBlockquote();
      out.push('<div class="bk-spacer"></div>');
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      closeList(); closeBlockquote();
      out.push('<hr class="bk-rule" />');
      continue;
    }

    // Headings
    if (line.startsWith("#")) {
      closeList(); closeBlockquote();
      const m = line.match(/^(#{1,6})\s+(.*)/);
      if (m) {
        const level = m[1].length;
        const text = inline(m[2]);
        const cls = ["", "bk-h1", "bk-h2", "bk-h3", "bk-h4", "bk-h5", "bk-h6"][level];
        out.push(`<h${level} class="${cls}">${text}</h${level}>`);
      }
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      if (!inBlockquote) { out.push('<blockquote class="bk-blockquote">'); inBlockquote = true; }
      out.push(`<p>${inline(line.slice(2))}</p>`);
      continue;
    }
    closeBlockquote();

    // List item
    if (/^[-*]\s/.test(line)) {
      if (!inList) { out.push('<ul class="bk-list">'); inList = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      if (!inList) { out.push('<ol class="bk-list bk-ol">'); inList = true; }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }
    closeList();

    // Regular paragraph
    out.push(`<p class="bk-p">${inline(line)}</p>`);
  }

  closeList();
  closeBlockquote();
  return out.join("\n");
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  toc: TocEntry[];
  currentId: string;
  onSelect: (id: string) => void;
  onClose?: () => void;
}

function tocLabel(e: TocEntry): string {
  if (e.type === "part_header") {
    const m = e.title.match(/^PART (I|II|III|IV|V|VI|VII)/);
    return m ? `Part ${m[1]}` : e.title.split("—")[0].trim();
  }
  if (e.type === "chapter") return e.title;
  if (e.type === "appendix") {
    const m = e.title.match(/^Appendix ([A-Z])[:–—\s]/);
    return m ? `Appendix ${m[1]}` : e.title.slice(0, 48);
  }
  if (e.type === "tribe") return e.title.replace(/^Case \d+:\s*/, "Case: ").slice(0, 48);
  return e.title.slice(0, 48);
}

function Sidebar({ toc, currentId, onSelect, onClose }: SidebarProps) {
  const currentRef = useRef<HTMLButtonElement>(null);
  const PROGRESS_KEY = "sra:book-read-progress";

  // Group by logical section
  const sections: Array<{ header: TocEntry | null; items: TocEntry[] }> = [];
  let currentSection: { header: TocEntry | null; items: TocEntry[] } = { header: null, items: [] };

  for (const e of toc) {
    if (e.type === "part_header") {
      if (currentSection.items.length || currentSection.header) sections.push(currentSection);
      currentSection = { header: e, items: [] };
    } else {
      currentSection.items.push(e);
    }
  }
  if (currentSection.items.length || currentSection.header) sections.push(currentSection);

  // Scroll current item into view
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentId]);

  return (
    <aside className="flex flex-col h-full bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(var(--sidebar-border))] shrink-0">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold tracking-wide text-[hsl(var(--sidebar-foreground))] uppercase">
            Contents
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 text-[hsl(var(--sidebar-foreground))]">
        {sections.map((sec, si) => (
          <div key={si} className="mb-1">
            {sec.header && (
              <button
                className={`w-full text-left px-3 py-2 rounded-sm text-xs uppercase tracking-widest font-semibold transition-colors ${
                  currentId === sec.header.id
                    ? "bg-amber-600/20 text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onSelect(sec.header!.id)}
                ref={currentId === sec.header.id ? currentRef : undefined}
                data-testid={`sidebar-part-${si}`}
              >
                {tocLabel(sec.header)}
              </button>
            )}
            {sec.items.map(e => {
              const isActive = currentId === e.id;
              return (
                <button
                  key={e.id}
                  ref={isActive ? currentRef : undefined}
                  className={`w-full text-left px-3 py-1.5 rounded-sm text-sm transition-colors flex items-center gap-2 group ${
                    isActive
                      ? "bg-amber-600/15 text-amber-400 font-medium"
                      : "text-[hsl(var(--sidebar-foreground))] opacity-75 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]"
                  }`}
                  onClick={() => onSelect(e.id)}
                  data-testid={`sidebar-item-${e.id}`}
                >
                  {isActive && <div className="w-0.5 h-3 bg-amber-500 rounded-full shrink-0" />}
                  <span className="truncate leading-snug">
                    {e.type === "chapter" && e.chapterNum
                      ? `Ch. ${e.chapterNum}`
                      : e.type === "appendix"
                        ? (() => { const m = e.title.match(/^Appendix ([A-Z])/); return m ? `App. ${m[1]}` : ""; })()
                        : ""}
                    {(e.type === "chapter" || e.type === "appendix") && (
                      <span className="text-muted-foreground ml-1">·</span>
                    )} {" "}
                    {e.type === "chapter"
                      ? e.title.replace(/^Chapter \d+[\u00BD]?:\s*/, "")
                      : e.type === "appendix"
                        ? e.title.replace(/^Appendix [A-Z]:\s*/, "").slice(0, 42)
                        : tocLabel(e)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Chapter content ─────────────────────────────────────────────────────────

interface ChapterPaneProps {
  chapterId: string;
  toc: TocEntry[];
  onNav: (id: string) => void;
  downloadUrl: string;
}

function ChapterPane({ chapterId, toc, onNav, downloadUrl }: ChapterPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const idx = toc.findIndex(e => e.id === chapterId);
  const prev = idx > 0 ? toc[idx - 1] : null;
  const next = idx < toc.length - 1 ? toc[idx + 1] : null;

  const { data, isLoading } = useQuery<{ id: string; title: string; markdown: string }>({
    queryKey: [`/api/book/chapter/${chapterId}`],
    staleTime: 1000 * 60 * 30,
  });

  // Scroll to top when chapter changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [chapterId]);

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const html = renderMd(data.markdown);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bk-scroll">
      <div className="max-w-[68ch] mx-auto px-6 md:px-12 py-12 md:py-16">
        {/* Chapter content */}
        <div
          className="bk-prose"
          dangerouslySetInnerHTML={{ __html: html }}
          data-testid="chapter-content"
        />

        {/* Coach CTA — only for chapter-type entries */}
        {(() => {
          const entry = toc[idx];
          if (!entry || entry.type !== "chapter") return null;
          const shortTitle = data.title
            .replace(/^Chapter \d+[\u00BD]?:\s*/, "")
            .split("—")[0]
            .trim();
          const prompt = encodeURIComponent(
            `I just read "${shortTitle}". Help me turn the key ideas into a personal protocol for my recovery.`
          );
          return (
            <div className="mt-12 rounded-xl border border-[#E2741B]/30 bg-gradient-to-br from-[#1a1008] to-[#0f0c04] p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-[#E2741B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200 mb-1">
                    Apply <span className="text-[#E2741B]">"{shortTitle}"</span> to your recovery
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    Ask Sasquatch to build a personal protocol from what you just read — specific to your deficits, schedule, and goals.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="bg-[#E2741B] text-black font-semibold"
                    data-testid="btn-chapter-coach-cta"
                  >
                    <a href={`/recovery/sasquatch-coach?prompt=${prompt}`}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      Talk to Sasquatch about this
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Chapter navigation */}
        <div className="mt-10 pt-8 border-t border-border/40 flex items-center justify-between gap-4">
          {prev ? (
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              onClick={() => onNav(prev.id)}
              data-testid="btn-prev-chapter"
            >
              <ChevronLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-left line-clamp-1 max-w-[180px]">
                {prev.title.replace(/^Chapter \d+[\u00BD]?:\s*/, "Ch. ")}
              </span>
            </button>
          ) : <div />}

          <button
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Top
          </button>

          {next ? (
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              onClick={() => onNav(next.id)}
              data-testid="btn-next-chapter"
            >
              <span className="text-right line-clamp-1 max-w-[180px]">
                {next.title.replace(/^Chapter \d+[\u00BD]?:\s*/, "Ch. ")}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}

// ─── Main reader ─────────────────────────────────────────────────────────────

const PROGRESS_KEY = "sra:book-chapter";

export default function BookRead() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: entitlement, isLoading: entitlementLoading } = useQuery<Entitlement>({
    queryKey: ["/api/book/entitlement"],
    enabled: isAuthenticated,
  });

  const { data: toc = [], isLoading: tocLoading } = useQuery<TocEntry[]>({
    queryKey: ["/api/book/toc"],
  });

  const [currentId, setCurrentId] = useState<string>(() => {
    try { return localStorage.getItem(PROGRESS_KEY) || ""; } catch { return ""; }
  });

  // Once TOC loads, resolve saved chapter or default to first
  useEffect(() => {
    if (!toc.length) return;
    const saved = (() => { try { return localStorage.getItem(PROGRESS_KEY) || ""; } catch { return ""; } })();
    if (saved && toc.find(e => e.id === saved)) {
      setCurrentId(saved);
    } else {
      setCurrentId(toc[0]?.id || "");
    }
  }, [toc]);

  const handleSelect = useCallback((id: string) => {
    setCurrentId(id);
    try { localStorage.setItem(PROGRESS_KEY, id); } catch {}
    setMobileSidebarOpen(false);
  }, []);

  // Loading states
  if (authLoading || (isAuthenticated && entitlementLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Paywall reason="signin" />;
  if (!entitlement?.owns) return <Paywall reason="purchase" />;

  const downloadUrl = `/api/marketplace/orders/${entitlement.orderId}/items/${entitlement.itemId}/download`;

  if (tocLoading || !toc.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const currentEntry = toc.find(e => e.id === currentId);
  const idx = toc.findIndex(e => e.id === currentId);
  const progress = toc.length > 0 ? Math.round(((idx + 1) / toc.length) * 100) : 0;

  return (
    <>
      <RecoverySEO
        title="Read Your Book — The Ultimate Stroke Recovery Revolution"
        description="Owner-only in-platform reader."
        canonical="/book/read"
        noindex
        medicalDisclaimer={false}
      />

      {/* ── Typography + prose styles ──────────────────────────────── */}
      <style>{`
        .bk-prose { color: hsl(var(--foreground)); line-height: 1.85; }
        .bk-prose .bk-h1 {
          font-family: var(--font-serif);
          font-size: 2rem; font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 2.5rem 0 1rem;
          color: hsl(var(--foreground));
        }
        .bk-prose .bk-h2 {
          font-family: var(--font-serif);
          font-size: 1.5rem; font-weight: 700;
          letter-spacing: -0.015em;
          line-height: 1.2;
          margin: 2.25rem 0 0.85rem;
          color: hsl(var(--foreground));
        }
        .bk-prose .bk-h3 {
          font-size: 1.1rem; font-weight: 600;
          margin: 1.75rem 0 0.6rem;
          color: hsl(var(--foreground) / 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.8rem;
        }
        .bk-prose .bk-h4 {
          font-size: 1rem; font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          color: hsl(var(--foreground) / 0.85);
        }
        .bk-prose .bk-p {
          margin: 0 0 0.2rem;
          font-size: 1.0625rem;
          color: hsl(var(--foreground) / 0.88);
        }
        .bk-prose .bk-spacer { height: 0.85em; }
        .bk-prose .bk-rule {
          border: none;
          border-top: 1px solid hsl(var(--border) / 0.5);
          margin: 2rem 0;
        }
        .bk-prose .bk-blockquote {
          border-left: 3px solid hsl(var(--accent));
          margin: 1.5rem 0;
          padding: 0.5rem 0 0.5rem 1.25rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
          font-family: var(--font-serif);
          font-size: 1.05rem;
        }
        .bk-prose .bk-list {
          margin: 0.5rem 0 0.5rem 1.5rem;
          padding: 0;
        }
        .bk-prose .bk-list li {
          margin-bottom: 0.35rem;
          font-size: 1.0625rem;
          color: hsl(var(--foreground) / 0.85);
        }
        .bk-prose .bk-ol { list-style-type: decimal; }
        .bk-prose code {
          font-family: var(--font-mono);
          font-size: 0.875em;
          background: hsl(var(--muted));
          padding: 0.1em 0.4em;
          border-radius: 3px;
          color: hsl(var(--foreground));
        }
        .bk-prose .bk-link {
          color: hsl(var(--accent));
          text-decoration: underline;
          text-decoration-color: hsl(var(--accent) / 0.4);
          text-underline-offset: 3px;
        }
        .bk-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent; }
        .bk-scroll::-webkit-scrollbar { width: 6px; }
        .bk-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
      `}</style>

      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* ── Top toolbar ──────────────────────────────────────────── */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background/95 backdrop-blur-sm shrink-0 z-20">
          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setMobileSidebarOpen(v => !v)}
            data-testid="btn-mobile-sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setSidebarOpen(v => !v)}
            data-testid="btn-desktop-sidebar"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-border/50 hidden md:block" />

          {/* Book + chapter title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href="/book/buy" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block shrink-0">
              The Ultimate Stroke Recovery Revolution
            </Link>
            {currentEntry && (
              <>
                <span className="text-muted-foreground text-xs hidden sm:block">/</span>
                <span className="text-xs text-foreground/80 truncate">
                  {currentEntry.title.replace(/^Chapter \d+[\u00BD]?:\s*/, "").slice(0, 60)}
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-24 h-1 bg-border/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{progress}%</span>
          </div>

          <div className="h-4 w-px bg-border/50" />

          <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs h-7 px-2" data-testid="btn-download">
            <a href={downloadUrl}>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </a>
          </Button>
        </header>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Mobile sidebar overlay */}
          {mobileSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 z-30 bg-black/60"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar — desktop collapsible, mobile overlay */}
          <div
            className={`
              md:static fixed z-40 top-0 bottom-0 left-0
              transition-all duration-200 shrink-0 overflow-hidden
              ${mobileSidebarOpen ? "w-72" : "w-0 md:w-auto"}
              ${sidebarOpen ? "md:w-64" : "md:w-0"}
            `}
            style={{ transitionProperty: "width" }}
          >
            {(sidebarOpen || mobileSidebarOpen) && (
              <div className="w-64 md:w-full h-full">
                <Sidebar
                  toc={toc}
                  currentId={currentId}
                  onSelect={handleSelect}
                  onClose={() => setMobileSidebarOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Content pane */}
          {currentId && (
            <ChapterPane
              key={currentId}
              chapterId={currentId}
              toc={toc}
              onNav={handleSelect}
              downloadUrl={downloadUrl}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Paywall ─────────────────────────────────────────────────────────────────

function Paywall({ reason }: { reason: "signin" | "purchase" }) {
  const isSignin = reason === "signin";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title={isSignin ? "Sign In to Read Your Book" : "Get The Ultimate Stroke Recovery Revolution"}
        description="Sign in or purchase to read The Ultimate Stroke Recovery Revolution in-platform."
        canonical="/book/read"
        noindex
        medicalDisclaimer={false}
      />
      <GlobalHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full" data-testid="card-paywall">

          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full border border-border/50 bg-card/60 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
              data-testid="text-paywall-title"
            >
              {isSignin ? "Sign in to read" : "Get the book to read"}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {isSignin
                ? "The in-platform reader unlocks for survivors who own a copy. Sign in with the account you used at checkout."
                : "The full 314-page manual is owner-only. Pick up the digital PDF for $19 (instant) or the trade paperback for $29."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {isSignin ? (
              <Button
                asChild size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="button-paywall-signin"
              >
                <a href={`/api/login?returnTo=${encodeURIComponent("/book/read")}`}>Sign in</a>
              </Button>
            ) : (
              <Button
                asChild size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="button-paywall-buy"
              >
                <Link href="/book/buy">
                  <ShoppingCart className="w-4 h-4" />
                  See buy options
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" data-testid="button-paywall-sample">
              <a href="/book/sample.pdf" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                Free sample
              </a>
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/book"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse the companion academy
              <ArrowRight className="w-3 h-3" />
            </Link>
            {!isSignin && (
              <p className="text-xs text-muted-foreground">
                Already bought? Sign in with the same account used at checkout.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
