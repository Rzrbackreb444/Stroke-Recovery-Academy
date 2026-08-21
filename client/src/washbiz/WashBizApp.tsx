import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, Calculator, Check, CheckCircle2, ChevronRight, Gauge,
  LayoutDashboard, LockKeyhole, MapPin, Menu, MessageCircle, Plus, Search,
  Sparkles, Store, Target, TrendingUp, Users, X,
} from "lucide-react";
import "./washbiz.css";

type Page = "home" | "learn" | "community" | "buy" | "scorecard";
type User = { id: string; firstName?: string | null; email?: string | null };
type Board = { id: number; name: string; slug: string; description?: string | null };
type Thread = {
  id: number; postId: number; title: string; content: string; replyCount: number; score: number;
  authorId: string; authorName?: string | null; categoryName: string; categorySlug: string;
  createdAt: string; lastActivityAt: string;
};
type ThreadPost = { id: number; content: string; score: number; isOriginal: boolean; createdAt: string; authorId: string; authorName?: string | null };
type Scorecard = { id: number; siteName: string; score: number; eveningTraffic: string; competition: string; rent: string; createdAt: string; updatedAt: string };
type Progress = { completedLessons: number; reflection: string; revision: number };

const lessons = [
  { id: 1, title: "Location Is Law", duration: "12 min", description: "Decide whether the site can win before you negotiate anything." },
  { id: 2, title: "Read the Market", duration: "16 min", description: "Map demand, competition, customer habits, and the real trade area." },
  { id: 3, title: "Apply the C.L.E.A.N. Principle", duration: "18 min", description: "Build an acquisition filter that removes emotion from the deal." },
  { id: 4, title: "Calculate the CLEANBI Score", duration: "14 min", description: "Turn field research into a clear site-quality score." },
  { id: 5, title: "Validate the Site", duration: "10 min", description: "Pressure-test the assumptions before your money is committed." },
  { id: 6, title: "Make the Go / No-Go Decision", duration: "9 min", description: "Know exactly when to move, negotiate, or walk away." },
];

const products = [
  { key: "hard-mount-washer", name: "Hard-Mount Washer", label: "High-extraction washer planning category", tone: "washer", icon: "◉" },
  { key: "stack-dryer", name: "Stack Dryer", label: "Two-pocket drying capacity planning category", tone: "stack", icon: "◉◉" },
  { key: "single-dryer", name: "Single Dryer", label: "Single-pocket drying capacity planning category", tone: "dryer", icon: "◉" },
  { key: "stack-combo", name: "Stack Combo", label: "Vertical washer and dryer planning category", tone: "combo", icon: "◉◌" },
];

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || body.error || "Something went wrong.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function signIn(page: Page) {
  window.location.assign(`/api/login?returnTo=${encodeURIComponent(`/#${page}`)}`);
}

function initials(name?: string | null) {
  const words = (name || "Member").trim().split(/\s+/);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NavLogo({ compact = false }: { compact?: boolean }) {
  return <button className="wb-logo" onClick={() => window.location.assign("#home")} aria-label="WashBizHub home">
    <span className="wb-logo-mark">WB</span>
    {!compact && <span className="wb-logo-copy"><strong>WASHBIZHUB</strong><small>LAUNDROMAT MASTERY</small></span>}
  </button>;
}

function AppHeader({ page, onNavigate, user }: { page: Page; onNavigate: (page: Page) => void; user: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav: [Page, string][] = [["learn", "Learn"], ["community", "Community"], ["buy", "Buy Right"], ["scorecard", "Score a Site"]];
  const go = (next: Page) => { onNavigate(next); setMenuOpen(false); };
  return <header className="wb-header">
    <div className="wb-container wb-header-inner">
      <NavLogo />
      <nav className="wb-nav" aria-label="Primary navigation">
        {nav.map(([key, label]) => <button key={key} className={page === key ? "active" : ""} onClick={() => go(key)}>{label}</button>)}
      </nav>
      <div className="wb-header-actions">
        {user ? <span className="wb-user-name">Hi, {user.firstName || "operator"}</span> : <button className="wb-link-button" onClick={() => signIn(page)}>Sign in</button>}
        <button className="wb-button wb-button-small" onClick={() => go("learn")}>Enter the academy <ArrowRight size={15} /></button>
      </div>
      <button className="wb-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
    </div>
    {menuOpen && <div className="wb-mobile-nav">
      {nav.map(([key, label]) => <button key={key} onClick={() => go(key)}>{label}<ChevronRight size={16} /></button>)}
      {!user && <button onClick={() => signIn(page)}>Sign in <ArrowRight size={16} /></button>}
    </div>}
  </header>;
}

function SignInGate({ page, title, children }: { page: Page; title: string; children: string }) {
  return <section className="wb-auth-gate">
    <LockKeyhole size={23} />
    <div><strong>{title}</strong><p>{children}</p></div>
    <button className="wb-button" onClick={() => signIn(page)}>Sign in to continue <ArrowRight size={16} /></button>
  </section>;
}

function Home({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return <>
    <section className="wb-hero">
      <div className="wb-hero-grid" />
      <div className="wb-container wb-hero-inner">
        <div className="wb-hero-copy">
          <div className="wb-eyebrow"><Sparkles size={14} /> Powered by WashBizHub.com</div>
          <h1>Build the laundromat<br /><span>that outlasts you.</span></h1>
          <p>Clear the noise. Learn the deal. Build a profitable store—with an operator community built around real decisions.</p>
          <div className="wb-hero-actions">
            <button className="wb-button" onClick={() => onNavigate("learn")}>Start smart <ArrowRight size={18} /></button>
            <button className="wb-button wb-button-ghost" onClick={() => onNavigate("scorecard")}><Calculator size={17} /> Score a location</button>
          </div>
          <div className="wb-hero-proof"><div><strong>4</strong><span>mastery paths</span></div><div><strong>6</strong><span>site-decision lessons</span></div><div><strong>1</strong><span>operator community</span></div></div>
        </div>
        <div className="wb-hero-visual">
          <div className="wb-machine-glow" /><div className="wb-machine-stack"><div className="wb-machine-top"><span>OPERATOR</span><i>◉</i></div><div className="wb-machine-base"><span>PLANNING</span><i>◉</i></div></div>
          <div className="wb-float-card wb-float-card-score"><MapPin size={18} /><div><small>CLEANBI framework</small><strong>Field-first <em>site review</em></strong></div></div>
          <div className="wb-float-card wb-float-card-revenue"><TrendingUp size={18} /><div><small>Owner workflow</small><strong>Learn · score · decide</strong></div></div>
        </div>
      </div>
    </section>
    <section className="wb-strip"><img src="/washbiz/mastery-banner.png" alt="Laundromat Mastery Community: Start Smart, Buy Right, Run Profitable" /></section>
    <section className="wb-section"><div className="wb-container">
      <div className="wb-section-heading"><div><span className="wb-kicker">Your operating system</span><h2>Every winning store follows a sequence.</h2></div><p>There is no magic machine and no shortcut lease. There is a repeatable system for selecting, building, and operating a store that wins.</p></div>
      <div className="wb-path-grid">
        {[[Target, "01", "Start Smart", "Learn the fundamentals before you make an expensive first move.", "Foundation course"], [Store, "02", "Buy Right", "Find the location, build the scorecard, and negotiate from the numbers.", "Location intelligence"], [Gauge, "03", "Run Profitable", "Build the habits, machine mix, and operating cadence that protect margin.", "Operator playbook"], [TrendingUp, "04", "Scale the Legacy", "Create a portfolio that compounds expertise, cash flow, and optionality.", "Expansion track"]].map(([Icon, number, title, copy, tag]) => {
          const IconComponent = Icon as typeof Target;
          return <article className="wb-path-card" key={title as string}><div className="wb-path-top"><span>{number as string}</span><IconComponent size={22} /></div><h3>{title as string}</h3><p>{copy as string}</p><button onClick={() => onNavigate("learn")}>{tag as string} <ArrowRight size={15} /></button></article>;
        })}
      </div>
    </div></section>
    <section className="wb-course-promo"><div className="wb-container wb-course-promo-inner"><div className="wb-course-preview"><img src="/washbiz/course-preview.png" alt="Location Intelligence course workspace" /></div><div className="wb-course-copy"><span className="wb-kicker">Core course · 6 lessons</span><h2>Location Intelligence</h2><p>Use the C.L.E.A.N. principle to separate a good-looking store from a location that can actually win.</p><ul><li><CheckCircle2 size={17} /> Evaluate the trade area like an owner</li><li><CheckCircle2 size={17} /> Capture red flags before the lease</li><li><CheckCircle2 size={17} /> Make an objective go / no-go decision</li></ul><button className="wb-button" onClick={() => onNavigate("learn")}>Continue course <ArrowRight size={17} /></button></div></div></section>
    <section className="wb-community-promo"><div className="wb-container wb-community-promo-inner"><div><span className="wb-kicker">The room where operators get better</span><h2>No gurus. No flexing. Just owners building better stores.</h2></div><button className="wb-button wb-button-light" onClick={() => onNavigate("community")}><Users size={18} /> Join the discussion</button></div></section>
  </>;
}

function Learn({ user }: { user: User | null }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [active, setActive] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    Promise.all([api<Progress>("/api/washbiz/course-progress"), api<{ scorecards: Scorecard[] }>("/api/washbiz/scorecards")])
      .then(([savedProgress, savedScorecards]) => { setProgress(savedProgress); setScorecards(savedScorecards.scorecards); })
      .catch((err: Error) => setError(err.message));
  }, [user]);
  if (!user) return <main className="wb-page"><div className="wb-container"><SignInGate page="learn" title="Keep your course work in one place">Sign in to save lesson progress, reflections, and the location work you build in the academy.</SignInGate></div></main>;
  if (!progress) return <main className="wb-page"><div className="wb-container"><p className="wb-loading">{error || "Loading your academy workspace…"}</p></div></main>;
  const completed = progress.completedLessons;
  const lesson = lessons.find((item) => item.id === active) || lessons[0];
  const latestScore = scorecards[0];
  const saveProgress = async (nextCompleted = completed, nextReflection = progress.reflection) => {
    setSaving(true); setError("");
    try { setProgress(await api<Progress>("/api/washbiz/course-progress", { method: "PUT", body: JSON.stringify({ completedLessons: nextCompleted, reflection: nextReflection, revision: progress.revision }) })); }
    catch (err) {
      const requestError = err as Error & { status?: number };
      if (requestError.status === 409) {
        const refreshed = await api<Progress>("/api/washbiz/course-progress");
        setProgress(refreshed);
        setError("Your newest course work was loaded from another device. Review it before saving again.");
      } else setError(requestError.message);
    } finally { setSaving(false); }
  };
  const completeLesson = () => { if (active <= completed + 1) void saveProgress(Math.min(lessons.length, Math.max(completed, active)), progress.reflection); };
  const percent = Math.round((completed / lessons.length) * 100);
  return <main className="wb-workspace">
    <section className="wb-course-hero"><div className="wb-container"><span className="wb-course-label">Core course · 6 lessons</span><div className="wb-course-hero-layout"><div><h1>Location Intelligence</h1><p>Find a store that can win before you spend a dollar on equipment, build-out, or optimism.</p></div><div className="wb-course-hero-icon"><MapPin size={34} /><span>C.L.E.A.N.</span></div></div><div className="wb-progress-row"><div className="wb-progress"><span style={{ width: `${percent}%` }} /></div><strong>{percent}% complete</strong></div></div></section>
    <div className="wb-container">
      <section className="wb-score-grid"><div><small>CLEANBI Score</small><strong>{latestScore ? `${latestScore.score} / self-assessment` : "Not scored yet"}</strong></div><div><small>Site under review</small><strong>{latestScore?.siteName || "Open the scorecard"}</strong></div><div><small>Decision</small><strong className={latestScore ? "wb-blue" : ""}>{latestScore ? "Validate in the field" : "Complete the scorecard"}</strong></div><div><small>Course Progress</small><strong className="wb-blue">{completed} / 6</strong></div></section>
      <div className="wb-warning"><Sparkles size={16} /> You can fix equipment. You can renegotiate rent. You cannot fix a bad location.</div>
      <div className="wb-learning-layout"><aside className="wb-lesson-nav"><div className="wb-lesson-nav-title">Lessons <BookOpen size={16} /></div>{lessons.map((item) => { const available = item.id <= completed + 1; return <button key={item.id} className={`${active === item.id ? "active" : ""} ${!available ? "locked" : ""}`} disabled={!available} onClick={() => setActive(item.id)}><span>{available && item.id <= completed ? <Check size={14} /> : item.id}</span><div><strong>{item.title}</strong><small>{available ? item.duration : "Locked"}</small></div>{!available && <LockKeyhole size={14} />}</button>; })}</aside>
        <article className="wb-lesson-card"><span className="wb-lesson-chip">Lesson {lesson.id}</span><h2>{lesson.title}</h2><h3>Core truth: location and lease fundamentals determine most of the financial outcome of a laundromat investment.</h3><p>{lesson.description} A common trap is watching a site at 2 PM on a Saturday. Your customers may be working renters who need laundry in the evening. Build your first impression from the operating hours that matter.</p><div className="wb-doctrine"><strong>Doctrine:</strong> Audit the 6 PM–10 PM window. If the location does not work during peak laundry hours, it does not work—period.</div><p>Use this lesson to build a site-evaluation framework that takes emotion, assumptions, and “it feels busy” out of the decision.</p><label className="wb-reflection-label">Reflection: What makes this location worth investigating?<textarea value={progress.reflection} onChange={(event) => setProgress({ ...progress, reflection: event.target.value })} placeholder="Write your initial thoughts about the site you are evaluating…" /></label>{error && <p className="wb-form-error">{error}</p>}<div className="wb-lesson-actions"><button className="wb-secondary-button" disabled={saving} onClick={() => void saveProgress()}>{saving ? "Saving…" : "Save reflection"}</button><button className="wb-button" disabled={saving} onClick={completeLesson}>{active <= completed ? "Completed" : "Mark complete"} <Check size={17} /></button>{active < lessons.length && active < completed + 1 && <button className="wb-secondary-button" onClick={() => setActive(active + 1)}>Next lesson <ArrowRight size={16} /></button>}</div></article>
      </div>
      <section className="wb-badge-row"><span>Progress badges</span>{["Market Screened", "CLEAN Applied", "CLEANBI Scored", "Field Validated", "Decision Documented"].map((item, index) => <i className={completed > index ? "earned" : ""} key={item}>{completed > index && <Check size={12} />}{item}</i>)}</section>
    </div>
  </main>;
}

function Community({ user }: { user: User | null }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeBoard, setActiveBoard] = useState("all");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [boardSlug, setBoardSlug] = useState("");
  const [selected, setSelected] = useState<{ thread: Thread; posts: ThreadPost[] } | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [helpfulPosts, setHelpfulPosts] = useState<number[]>([]);
  const load = async (board = activeBoard) => {
    setLoading(true); setError("");
    try { setThreads((await api<{ threads: Thread[] }>(`/api/washbiz/community/threads?board=${encodeURIComponent(board)}`)).threads); }
    catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!user) return;
    api<{ boards: Board[] }>("/api/washbiz/community/boards").then(({ boards: items }) => { setBoards(items); setBoardSlug(items[0]?.slug || ""); }).catch((err: Error) => setError(err.message));
  }, [user]);
  useEffect(() => { if (user) void load(activeBoard); }, [activeBoard, user]);
  const chooseBoard = (slug: string) => { setActiveBoard(slug); setSelected(null); };
  const openThread = async (thread: Thread) => {
    try { const data = await api<{ posts: ThreadPost[] }>(`/api/washbiz/community/threads/${thread.id}`); setSelected({ thread, posts: data.posts }); }
    catch (err) { setError((err as Error).message); }
  };
  const publish = async () => {
    if (!user) return signIn("community");
    setSaving(true); setError("");
    try { await api("/api/washbiz/community/threads", { method: "POST", body: JSON.stringify({ boardSlug, title, content: body }) }); setTitle(""); setBody(""); setComposerOpen(false); await load(activeBoard); }
    catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  };
  const sendReply = async () => {
    if (!user) return signIn("community");
    if (!selected) return;
    setSaving(true); setError("");
    try { await api(`/api/washbiz/community/threads/${selected.thread.id}/replies`, { method: "POST", body: JSON.stringify({ content: reply }) }); setReply(""); await openThread(selected.thread); await load(activeBoard); }
    catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  };
  const markHelpful = async (thread: Thread) => {
    if (!user) return signIn("community");
    try { const data = await api<{ score: number; helpful: boolean }>(`/api/washbiz/community/posts/${thread.postId}/helpful`, { method: "POST" }); setThreads((current) => current.map((item) => item.id === thread.id ? { ...item, score: data.score } : item)); setHelpfulPosts((current) => data.helpful ? [...current, thread.postId] : current.filter((id) => id !== thread.postId)); }
    catch (err) { setError((err as Error).message); }
  };
  if (!user) return <main className="wb-page"><div className="wb-container"><SignInGate page="community" title="Enter the member operator forum">Sign in to read and contribute to WashBizHub member discussions. Shared deal details and operator insights stay inside the community.</SignInGate></div></main>;
  const filtered = threads.filter((thread) => `${thread.title} ${thread.content} ${thread.categoryName}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="wb-page wb-community-page"><div className="wb-container">
    <section className="wb-page-heading"><div><span className="wb-kicker">Laundromat Mastery Community</span><h1>The operating room for better store owners.</h1><p>Discuss live deals, operating systems, equipment decisions, and the work of building a lasting store.</p></div><div className="wb-member-count"><Users size={20} /><strong>Member forum</strong><span>real operator discussions</span></div></section>
    <div className="wb-community-layout"><aside className="wb-community-sidebar"><button className="wb-button" onClick={() => user ? setComposerOpen(true) : signIn("community")}><Plus size={17} /> Start a discussion</button><div className="wb-sidebar-card"><strong>Spaces</strong><button className={activeBoard === "all" ? "active" : ""} onClick={() => chooseBoard("all")}><MessageCircle size={15} />All discussion</button>{boards.map((board) => <button className={activeBoard === board.slug ? "active" : ""} key={board.id} onClick={() => chooseBoard(board.slug)}><span className="wb-dot" />{board.name}</button>)}</div><div className="wb-sidebar-card wb-ask-card"><Sparkles size={18} /><strong>Stuck on a deal?</strong><p>Save your scorecard, put the open question in context, and ask the operator community for feedback.</p><button onClick={() => window.location.assign("#scorecard")}>Open scorecard <ArrowRight size={14} /></button></div></aside>
      <section className="wb-feed"><div className="wb-feed-toolbar"><div className="wb-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search live discussions" /></div><button>Newest <ChevronRight size={14} /></button></div>{error && <p className="wb-form-error">{error}</p>}
        {composerOpen && <div className="wb-composer"><div><span className="wb-avatar navy">{initials(user?.firstName)}</span><strong>Start a discussion</strong></div><select value={boardSlug} onChange={(event) => setBoardSlug(event.target.value)}>{boards.map((board) => <option key={board.id} value={board.slug}>{board.name}</option>)}</select><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="A clear title helps operators respond" /><textarea autoFocus value={body} onChange={(event) => setBody(event.target.value)} maxLength={10000} placeholder="Share the deal, operating question, or hard-won insight. Add enough context for the community to help." /><div><button className="wb-secondary-button" onClick={() => setComposerOpen(false)}>Cancel</button><button className="wb-button" disabled={saving || !title.trim() || !body.trim() || !boardSlug} onClick={() => void publish()}>{saving ? "Publishing…" : "Publish discussion"}</button></div></div>}
        {selected && <article className="wb-thread-detail"><button className="wb-close-detail" onClick={() => setSelected(null)}>Close <X size={15} /></button><span className="wb-tag">{selected.thread.categoryName}</span><h2>{selected.thread.title}</h2>{selected.posts.map((post) => <div className="wb-thread-reply" key={post.id}><span className="wb-avatar navy">{initials(post.authorName)}</span><div><div className="wb-post-meta"><strong>{post.authorName || "Member"}</strong><span>{relativeTime(post.createdAt)}</span></div><p>{post.content}</p></div></div>)}<label className="wb-reflection-label">Add a reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={user ? "Add a useful perspective…" : "Sign in to reply"} disabled={!user} /></label><button className="wb-button" disabled={saving || !reply.trim()} onClick={() => void sendReply()}>{saving ? "Publishing…" : "Publish reply"}</button></article>}
        {loading ? <p className="wb-loading">Loading live discussions…</p> : filtered.length === 0 ? <div className="wb-empty-state"><MessageCircle size={24} /><strong>No discussions in this space yet.</strong><p>Be the operator who starts a useful conversation.</p></div> : filtered.map((thread) => <article className="wb-post" key={thread.id}><div className="wb-avatar teal">{initials(thread.authorName)}</div><div className="wb-post-body"><div className="wb-post-meta"><strong>{thread.authorName || "Member"}</strong><span>{relativeTime(thread.lastActivityAt)}</span></div><span className="wb-tag">{thread.categoryName}</span><h2>{thread.title}</h2><p>{thread.content}</p><div className="wb-post-actions"><button onClick={() => void markHelpful(thread)}><CheckCircle2 size={16} className={helpfulPosts.includes(thread.postId) ? "liked" : ""} /> {thread.score} helpful</button><button onClick={() => void openThread(thread)}><MessageCircle size={16} /> {thread.replyCount} replies</button></div></div></article>)}
      </section>
    </div>
  </div></main>;
}

function BuyRight({ user }: { user: User | null }) {
  const [planned, setPlanned] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (user) api<{ items: { equipmentKey: string }[] }>("/api/washbiz/equipment-plan").then(({ items }) => setPlanned(items.map((item) => item.equipmentKey))).catch((err: Error) => setError(err.message)); }, [user]);
  const toggle = async (key: string, name: string) => {
    if (!user) return signIn("buy");
    setError("");
    try {
      const alreadySaved = planned.includes(key);
      const result = await api<{ saved: boolean }>(`/api/washbiz/equipment-plan/${key}`, { method: alreadySaved ? "DELETE" : "PUT" });
      setPlanned((items) => result.saved ? Array.from(new Set([...items, key])) : items.filter((item) => item !== key));
      setNotice(result.saved ? `${name} saved to your equipment plan.` : `${name} removed from your equipment plan.`);
    }
    catch (err) { setError((err as Error).message); }
  };
  return <main className="wb-page"><div className="wb-container"><section className="wb-page-heading wb-buy-heading"><div><span className="wb-kicker">Buy Right · Equipment planning</span><h1>Build the lineup<br />around the location.</h1><p>Save the equipment categories you need to compare capacity, footprint, and revenue per square foot. Supplier configuration and pricing belong in a verified quote.</p></div><div className="wb-price-note"><span /> Saved equipment plan</div></section><section className="wb-product-grid">{products.map((product) => <article className="wb-product-card" key={product.key}><div className={`wb-product-image ${product.tone}`}><span className="wb-product-series">Planning category</span><div className="wb-product-machine"><small>LAUNDRY</small><i>{product.icon}</i><b /></div></div><div className="wb-product-content"><small>{product.label}</small><h2>{product.name}</h2><p className="wb-product-copy">Save this category to your live plan and validate its specifications against your selected supplier.</p><button onClick={() => void toggle(product.key, product.name)}>{planned.includes(product.key) ? "Remove from plan" : "Save to plan"} <ArrowRight size={15} /></button></div></article>)}</section>{error && <p className="wb-form-error">{error}</p>}{notice && <section className="wb-quote-panel"><div><CheckCircle2 size={22} /><div><strong>{notice}</strong><p>Your equipment plan is attached to your member account and available from any signed-in device.</p></div></div><button className="wb-button" onClick={() => setNotice("")}>Keep planning</button></section>}<p className="wb-estimate-note">This planning tool does not quote, reserve, or represent supplier inventory. Confirm configuration, availability, freight, installation, and price directly with your chosen equipment supplier.</p><section className="wb-buy-cta"><div><span className="wb-kicker">Don’t buy equipment in a vacuum</span><h2>Build the store around the location—not the other way around.</h2></div><button className="wb-button" onClick={() => window.location.assign("#scorecard")}>Score your site <Calculator size={17} /></button></section></div></main>;
}

function Scorecard({ user }: { user: User | null }) {
  const [siteName, setSiteName] = useState("");
  const [eveningTraffic, setEveningTraffic] = useState("high");
  const [competition, setCompetition] = useState("moderate");
  const [rent, setRent] = useState("fair");
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (user) api<{ scorecards: Scorecard[] }>("/api/washbiz/scorecards").then(({ scorecards: items }) => setScorecards(items)).catch((err: Error) => setError(err.message)); }, [user]);
  if (!user) return <main className="wb-page"><div className="wb-container"><SignInGate page="scorecard" title="Save every site decision">Sign in to create named, server-saved scorecards you can revisit from the academy and share with your own decision process.</SignInGate></div></main>;
  const save = async () => {
    setSaving(true); setError("");
    try { const { scorecard } = await api<{ scorecard: Scorecard }>("/api/washbiz/scorecards", { method: "POST", body: JSON.stringify({ siteName, eveningTraffic, competition, rent }) }); setScorecards((items) => [scorecard, ...items]); setSiteName(""); }
    catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  };
  const latest = scorecards[0];
  return <main className="wb-page wb-scorecard-page"><div className="wb-container wb-scorecard-layout"><section className="wb-scorecard-intro"><span className="wb-kicker">C.L.E.A.N.B.I. location intelligence</span><h1>Score the site<br />before it scores you.</h1><p>Use the first-pass scorecard to frame a better site visit. It does not replace due diligence—it makes sure you perform it.</p><div className="wb-scorecard-steps"><span><b>1</b> Assess demand</span><span><b>2</b> Map the trade area</span><span><b>3</b> Review the lease</span><span><b>4</b> Make a decision</span></div></section><section className="wb-scorecard-form"><div className="wb-form-heading"><Calculator size={21} /><div><strong>Save a first-pass score</strong><span>Every saved scorecard belongs to your signed-in account.</span></div></div><label>Site address or market<input value={siteName} onChange={(event) => setSiteName(event.target.value)} maxLength={160} placeholder="e.g. 1424 North Main, Columbus" /></label><label>What does evening traffic look like?<select value={eveningTraffic} onChange={(event) => setEveningTraffic(event.target.value)}><option value="high">Active from 6–10 PM</option><option value="moderate">Some activity</option><option value="low">Quiet / uncertain</option></select></label><label>Competitive pressure<select value={competition} onChange={(event) => setCompetition(event.target.value)}><option value="low">Low / underserved</option><option value="moderate">Moderate</option><option value="high">Heavy / entrenched</option></select></label><label>Rent relative to the market<select value={rent} onChange={(event) => setRent(event.target.value)}><option value="low">Below market</option><option value="fair">Fair</option><option value="high">High / unclear</option></select></label><button className="wb-button wb-full-button" disabled={saving || !siteName.trim()} onClick={() => void save()}>{saving ? "Saving…" : "Calculate and save score"} <ArrowRight size={17} /></button>{error && <p className="wb-form-error">{error}</p>}{latest && <div className={`wb-score-result ${latest.score >= 80 ? "good" : latest.score >= 65 ? "watch" : "risk"}`}><span>Saved first-pass self-assessment · {latest.siteName}</span><strong>{latest.score}</strong><p>{latest.score >= 80 ? "Promising. Validate this self-assessment in the field and document the lease assumptions." : latest.score >= 65 ? "Worth investigating—but take a harder look at the weak variables." : "Do not force the deal. Bring the risks to the Location Intelligence course."}</p></div>}{scorecards.length > 1 && <div className="wb-saved-scorecards"><strong>Your recent sites</strong>{scorecards.slice(1, 6).map((scorecard) => <span key={scorecard.id}>{scorecard.siteName} · {scorecard.score}</span>)}</div>}</section></div></main>;
}

function Footer() {
  return <footer className="wb-footer"><div className="wb-container wb-footer-inner"><NavLogo /><p>WashBizHub.com · The Laundromat Mastery Community</p><div><a href="#learn">Academy</a><a href="#community">Community</a><a href="#buy">Equipment</a></div></div></footer>;
}

export default function WashBizApp() {
  const getPage = (): Page => { const selected = window.location.hash.replace("#", "") as Page; return ["learn", "community", "buy", "scorecard"].includes(selected) ? selected : "home"; };
  const [page, setPage] = useState<Page>(getPage);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { api<User | null>("/api/auth/user").then(setUser).catch(() => setUser(null)); }, []);
  const navigate = (next: Page) => { window.location.hash = next; setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => { const handleHash = () => setPage(getPage()); window.addEventListener("hashchange", handleHash); return () => window.removeEventListener("hashchange", handleHash); }, []);
  return <div className="washbiz-app"><AppHeader page={page} onNavigate={navigate} user={user} />{page === "home" && <Home onNavigate={navigate} />}{page === "learn" && <Learn user={user} />}{page === "community" && <Community user={user} />}{page === "buy" && <BuyRight user={user} />}{page === "scorecard" && <Scorecard user={user} />}<Footer /></div>;
}