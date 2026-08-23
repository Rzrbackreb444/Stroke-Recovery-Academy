import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  X,
  LogOut,
  Flag,
} from "lucide-react";
import "./washbiz.css";

type Page = "home" | "learn" | "community" | "buy" | "scorecard";

type Lesson = {
  id: number;
  title: string;
  duration: string;
  description: string;
  locked?: boolean;
};

type CommunityPost = {
  id: number;
  author: string;
  role: string;
  initials: string;
  color: string;
  tag: string;
  title: string;
  body: string;
  replies: number;
  likes: number;
  time: string;
};

type SavedSiteScore = {
  id?: number;
  name?: string;
  address: string;
  score: number;
  createdAt: string | Date;
};

type WashbizUser = { id: string; firstName: string | null; lastName: string | null };

function useWashbizAuth() {
  const [user, setUser] = useState<WashbizUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/user", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (active) setUser(value); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  return { user, isLoading, isAuthenticated: !!user };
}

type Discussion = {
  id: number; space: string; title: string; body: string; replyCount: number; isLocked: boolean;
  authorId: string; authorName: string | null; authorLastName: string | null; createdAt: string;
};

type Reply = {
  id: number; body: string; authorId: string; authorName: string | null; authorLastName: string | null; createdAt: string;
};

type EquipmentPlan = { id: number; name: string; items: string[]; notes: string | null };

const spaces = [
  ["all", "All discussion"],
  ["start-smart", "Start Smart"],
  ["buy-right", "Buy Right"],
  ["run-profitable", "Run Profitable"],
  ["scale-legacy", "Scale the Legacy"],
  ["wins-numbers", "Wins & numbers"],
] as const;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Something went wrong. Please try again.");
  return payload as T;
}

function displayName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName?.slice(0, 1) ? `${lastName.slice(0, 1)}.` : ""].filter(Boolean).join(" ") || "WashBizHub member";
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function relativeTime(value: string | Date) {
  const age = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(age / 60_000));
  return minutes < 60 ? `${minutes} min ago` : minutes < 1_440 ? `${Math.floor(minutes / 60)} hr ago` : new Date(value).toLocaleDateString();
}

const lessons: Lesson[] = [
  { id: 1, title: "Location Is Law", duration: "12 min", description: "Decide whether the site can win before you negotiate anything." },
  { id: 2, title: "Read the Market", duration: "16 min", description: "Map demand, competition, customer habits, and the real trade area.", locked: true },
  { id: 3, title: "Apply the C.L.E.A.N. Principle", duration: "18 min", description: "Build an acquisition filter that removes emotion from the deal.", locked: true },
  { id: 4, title: "Calculate the CLEANBI Score", duration: "14 min", description: "Turn field research into a clear site-quality score.", locked: true },
  { id: 5, title: "Validate the Site", duration: "10 min", description: "Pressure-test the assumptions before your money is committed.", locked: true },
  { id: 6, title: "Make the Go / No-Go Decision", duration: "9 min", description: "Know exactly when to move, negotiate, or walk away.", locked: true },
];

const posts: CommunityPost[] = [
  {
    id: 1,
    author: "Marcus L.",
    role: "First store · Arizona",
    initials: "ML",
    color: "teal",
    tag: "Location Intelligence",
    title: "I walked a site at 7 PM—and the story completely changed.",
    body: "Midday traffic looked light. At dinner, every washer was full and there was a line at the dryer bank. The lesson made me go back at the hours that actually matter.",
    replies: 14,
    likes: 37,
    time: "18 min ago",
  },
  {
    id: 2,
    author: "Tasha R.",
    role: "2-store operator · Ohio",
    initials: "TR",
    color: "blue",
    tag: "Buy Right",
    title: "My landlord countered. Here is the lease term I would not give up.",
    body: "The seven-year term looked fine until I modeled the equipment amortization. Sharing the one clause that protected the deal and the questions I used to negotiate it.",
    replies: 9,
    likes: 22,
    time: "43 min ago",
  },
  {
    id: 3,
    author: "Andre V.",
    role: "Founder · Texas",
    initials: "AV",
    color: "gold",
    tag: "Run Profitable",
    title: "The three numbers I review before I open a second store.",
    body: "Revenue does not equal readiness. These are the operating numbers that need to be stable before expansion becomes an option—not an expensive distraction.",
    replies: 28,
    likes: 61,
    time: "2 hrs ago",
  },
];

const products = [
  { name: "Hard-Mount Washer", label: "200G extraction", price: "$3,895", tone: "washer", icon: "◉" },
  { name: "Stack Dryer", label: "Double capacity per bay", price: "$4,750", tone: "stack", icon: "◉◉" },
  { name: "Single Dryer", label: "35–55 lb tumbler", price: "$3,420", tone: "dryer", icon: "◉" },
  { name: "Stack Combo", label: "Washer + dryer in one bay", price: "$5,430", tone: "combo", icon: "◉◌" },
];

function useSavedNumber(key: string, fallback: number) {
  const [value, setValue] = useState(() => {
    const stored = window.localStorage.getItem(key);
    return stored ? Number(stored) : fallback;
  });
  useEffect(() => window.localStorage.setItem(key, String(value)), [key, value]);
  return [value, setValue] as const;
}

function useSavedList(key: string) {
  const [items, setItems] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => window.localStorage.setItem(key, JSON.stringify(items)), [key, items]);
  return [items, setItems] as const;
}

function NavLogo({ compact = false }: { compact?: boolean }) {
  return (
    <button className="wb-logo" onClick={() => window.location.assign("#home")} aria-label="WashBizHub home">
      <span className="wb-logo-mark">WB</span>
      {!compact && (
        <span className="wb-logo-copy">
          <strong>WASHBIZHUB</strong>
          <small>LAUNDROMAT MASTERY</small>
        </span>
      )}
    </button>
  );
}

function AppHeader({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading } = useWashbizAuth();
  const nav = [
    ["learn", "Learn"],
    ["community", "Community"],
    ["buy", "Buy Right"],
    ["scorecard", "Score a Site"],
  ] as const;

  const go = (next: Page) => {
    onNavigate(next);
    setMenuOpen(false);
  };

  return (
    <header className="wb-header">
      <div className="wb-container wb-header-inner">
        <NavLogo />
        <nav className="wb-nav" aria-label="Primary navigation">
          {nav.map(([key, label]) => (
            <button key={key} className={page === key ? "active" : ""} onClick={() => go(key)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="wb-header-actions">
          <button className="wb-link-button" onClick={() => go("community")}>Community workspace</button>
          {isLoading ? null : user ? (
            <>
              <span className="wb-account-name">{user.firstName || "Member"}</span>
              <button className="wb-link-button" onClick={() => window.location.assign("/api/logout")} aria-label="Sign out"><LogOut size={16} /> Sign out</button>
            </>
          ) : (
            <button className="wb-button wb-button-small" onClick={() => window.location.assign("/api/login")}>Sign in to save <ArrowRight size={15} /></button>
          )}
        </div>
        <button className="wb-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <div className="wb-mobile-nav">
          {nav.map(([key, label]) => <button key={key} onClick={() => go(key)}>{label}<ChevronRight size={16} /></button>)}
          {user ? <button onClick={() => window.location.assign("/api/logout")}>Sign out <LogOut size={16} /></button> : <button onClick={() => window.location.assign("/api/login")}>Sign in to save <ArrowRight size={16} /></button>}
        </div>
      )}
    </header>
  );
}

function Home({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <section className="wb-hero">
        <div className="wb-hero-grid" />
        <div className="wb-container wb-hero-inner">
          <div className="wb-hero-copy">
            <div className="wb-eyebrow"><Sparkles size={14} /> Powered by WashBizHub.com</div>
            <h1>Build the laundromat<br /><span>that outlasts you.</span></h1>
            <p>Clear the noise. Learn the deal. Build a profitable store—with a community that has been in the trenches.</p>
            <div className="wb-hero-actions">
              <button className="wb-button" onClick={() => onNavigate("learn")}>Start smart <ArrowRight size={18} /></button>
              <button className="wb-button wb-button-ghost" onClick={() => onNavigate("scorecard")}><Calculator size={17} /> Score a location</button>
            </div>
            <div className="wb-hero-proof">
              <div><strong>4</strong><span>mastery paths</span></div>
              <div><strong>6</strong><span>site-decision lessons</span></div>
              <div><strong>1</strong><span>operator community</span></div>
            </div>
          </div>
          <div className="wb-hero-visual">
            <div className="wb-machine-glow" />
            <div className="wb-machine-stack">
              <div className="wb-machine-top"><span>WASHBIZ</span><i>◉</i></div>
              <div className="wb-machine-base"><span>PRO SERIES</span><i>◉</i></div>
            </div>
            <div className="wb-float-card wb-float-card-score">
              <MapPin size={18} /><div><small>CLEANBI score</small><strong>82 <em>strong site</em></strong></div>
            </div>
            <div className="wb-float-card wb-float-card-revenue">
              <TrendingUp size={18} /><div><small>Weekly trend</small><strong>+18.4%</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="wb-strip">
        <img src="/washbiz/mastery-banner.png" alt="Laundromat Mastery Community: Start Smart, Buy Right, Run Profitable" />
      </section>

      <section className="wb-section">
        <div className="wb-container">
          <div className="wb-section-heading">
            <div><span className="wb-kicker">Your operating system</span><h2>Every winning store follows a sequence.</h2></div>
            <p>There is no magic machine and no shortcut lease. There is a repeatable system for selecting, building, and operating a store that wins.</p>
          </div>
          <div className="wb-path-grid">
            {[
              [Target, "01", "Start Smart", "Learn the fundamentals before you make an expensive first move.", "Foundation course"],
              [Store, "02", "Buy Right", "Find the location, build the scorecard, and negotiate from the numbers.", "Location intelligence"],
              [Gauge, "03", "Run Profitable", "Build the habits, machine mix, and operating cadence that protect margin.", "Operator playbook"],
              [TrendingUp, "04", "Scale the Legacy", "Create a portfolio that compounds expertise, cash flow, and optionality.", "Expansion track"],
            ].map(([Icon, number, title, copy, tag]) => {
              const IconComponent = Icon as typeof Target;
              return (
                <article className="wb-path-card" key={title as string}>
                  <div className="wb-path-top"><span>{number as string}</span><IconComponent size={22} /></div>
                  <h3>{title as string}</h3><p>{copy as string}</p><button onClick={() => onNavigate("learn")}>{tag as string} <ArrowRight size={15} /></button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wb-course-promo">
        <div className="wb-container wb-course-promo-inner">
          <div className="wb-course-preview">
            <img src="/washbiz/course-preview.png" alt="Laundromat Mastery course dashboard preview" />
          </div>
          <div className="wb-course-copy">
            <span className="wb-kicker">Core paid course · 6 lessons</span>
            <h2>Location Intelligence</h2>
            <p>Use the C.L.E.A.N. principle to separate a good-looking store from a location that can actually win.</p>
            <ul>
              <li><CheckCircle2 size={17} /> Evaluate the trade area like an owner</li>
              <li><CheckCircle2 size={17} /> Capture red flags before the lease</li>
              <li><CheckCircle2 size={17} /> Make an objective go / no-go decision</li>
            </ul>
            <button className="wb-button" onClick={() => onNavigate("learn")}>Continue course <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <section className="wb-community-promo">
        <div className="wb-container wb-community-promo-inner">
          <div><span className="wb-kicker">The room where operators get better</span><h2>No gurus. No flexing. Just owners building better stores.</h2></div>
          <button className="wb-button wb-button-light" onClick={() => onNavigate("community")}><Users size={18} /> Join the discussion</button>
        </div>
      </section>
    </>
  );
}

function Learn() {
  const [completed, setCompleted] = useSavedNumber("washbiz-completed-lessons", 0);
  const [active, setActive] = useState(1);
  const [reflection, setReflection] = useState("");
  const lesson = lessons.find((item) => item.id === active) ?? lessons[0];
  const progress = Math.round((completed / lessons.length) * 100);
  const [savedScore] = useState<SavedSiteScore | null>(() => {
    try {
      const stored = window.localStorage.getItem("washbiz-last-site-score");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const completeLesson = () => {
    if (active <= completed + 1) setCompleted(Math.min(lessons.length, completed + 1));
  };

  return (
    <main className="wb-workspace">
      <section className="wb-course-hero">
        <div className="wb-container">
          <span className="wb-course-label">Core paid course · 6 lessons</span>
          <div className="wb-course-hero-layout">
            <div><h1>Location Intelligence</h1><p>Find a store that can win before you spend a dollar on equipment, build-out, or optimism.</p></div>
            <div className="wb-course-hero-icon"><MapPin size={34} /><span>C.L.E.A.N.</span></div>
          </div>
          <div className="wb-progress-row"><div className="wb-progress"><span style={{ width: `${progress}%` }} /></div><strong>{progress}% complete</strong></div>
        </div>
      </section>
      <div className="wb-container">
        <section className="wb-score-grid">
          <div><small>CLEANBI Score</small><strong>{savedScore ? `${savedScore.score} / self-assessment` : "Not scored yet"}</strong></div>
          <div><small>Site under review</small><strong>{savedScore?.address ?? "Open the scorecard"}</strong></div>
          <div><small>Decision</small><strong className={savedScore ? "wb-blue" : ""}>{savedScore ? "Validate in the field" : "Complete the scorecard"}</strong></div>
          <div><small>Course Progress</small><strong className="wb-blue">{completed} / 6</strong></div>
        </section>
        <div className="wb-warning"><Sparkles size={16} /> You can fix equipment. You can renegotiate rent. You cannot fix a bad location.</div>

        <div className="wb-learning-layout">
          <aside className="wb-lesson-nav">
            <div className="wb-lesson-nav-title">Lessons <BookOpen size={16} /></div>
            {lessons.map((item) => {
              const isAvailable = item.id <= completed + 1;
              return (
                <button
                  key={item.id}
                  className={`${active === item.id ? "active" : ""} ${!isAvailable ? "locked" : ""}`}
                  disabled={!isAvailable}
                  onClick={() => setActive(item.id)}
                >
                  <span>{isAvailable && item.id <= completed ? <Check size={14} /> : item.id}</span>
                  <div><strong>{item.title}</strong><small>{isAvailable ? item.duration : "Locked"}</small></div>
                  {!isAvailable && <LockKeyhole size={14} />}
                </button>
              );
            })}
          </aside>

          <article className="wb-lesson-card">
            <span className="wb-lesson-chip">Lesson {lesson.id}</span>
            <h2>{lesson.title}</h2>
            <h3>Core truth: location and lease fundamentals determine most of the financial outcome of a laundromat investment.</h3>
            <p>{lesson.description} A common trap is watching a site at 2 PM on a Saturday. Your customers may be working renters who need laundry in the evening. Build your first impression from the operating hours that matter.</p>
            <div className="wb-doctrine"><strong>Doctrine:</strong> Audit the 6 PM–10 PM window. If the location does not work during peak laundry hours, it does not work—period.</div>
            <p>Use this lesson to build a site-evaluation framework that takes emotion, assumptions, and “it feels busy” out of the decision.</p>
            <label className="wb-reflection-label">Reflection: What makes this location worth investigating?
              <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Write your initial thoughts about the site you are evaluating..." />
            </label>
            <div className="wb-lesson-actions">
              <button className="wb-button" onClick={completeLesson}>{active <= completed ? "Completed" : "Mark complete"} <Check size={17} /></button>
              {active < lessons.length && active < completed + 1 && <button className="wb-secondary-button" onClick={() => setActive(active + 1)}>Next lesson <ArrowRight size={16} /></button>}
            </div>
          </article>
        </div>
        <section className="wb-badge-row">
          <span>Progress badges</span>{["Market Screened", "CLEAN Applied", "CLEANBI Scored", "Field Validated", "Decision Documented"].map((item, index) => <i className={completed > index ? "earned" : ""} key={item}>{completed > index && <Check size={12} />}{item}</i>)}
        </section>
      </div>
    </main>
  );
}

function Community({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user, isAuthenticated, isLoading } = useWashbizAuth();
  const [items, setItems] = useState<Discussion[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [openDiscussion, setOpenDiscussion] = useState<number | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api<{ discussions: Discussion[] }>(`/api/laundromat/discussions${selectedSpace === "all" ? "" : `?space=${selectedSpace}`}`);
      setItems(data.discussions);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the community.");
    }
  };
  useEffect(() => { void load(); }, [isAuthenticated, selectedSpace]);

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true); setMessage("");
    try {
      await api("/api/laundromat/discussions", { method: "POST", body: JSON.stringify({ space: selectedSpace === "all" ? "start-smart" : selectedSpace, title, body }) });
      setTitle(""); setBody(""); setComposerOpen(false); setMessage("Discussion published and synced to your member account."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish your discussion."); }
    finally { setBusy(false); }
  };
  const showReplies = async (id: number) => {
    if (openDiscussion === id) return setOpenDiscussion(null);
    setOpenDiscussion(id); setReplyDraft("");
    try {
      const data = await api<{ replies: Reply[] }>(`/api/laundromat/discussions/${id}`);
      setReplies(data.replies);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load replies."); }
  };
  const addReply = async (id: number) => {
    if (!replyDraft.trim()) return;
    setBusy(true);
    try {
      await api(`/api/laundromat/discussions/${id}/replies`, { method: "POST", body: JSON.stringify({ body: replyDraft }) });
      const data = await api<{ replies: Reply[] }>(`/api/laundromat/discussions/${id}`);
      setReplies(data.replies); setReplyDraft(""); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to post your reply."); }
    finally { setBusy(false); }
  };
  const report = async (id: number) => {
    const reason = window.prompt("Report reason: spam, harassment, unsafe_advice, off_topic, or other", "other");
    if (!reason) return;
    try {
      await api(`/api/laundromat/discussions/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) });
      setMessage("Thanks. Your report was sent to the moderator team.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send the report."); }
  };
  const filtered = useMemo(() => items.filter((item) => `${item.title} ${item.body} ${item.space}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  return (
    <main className="wb-page wb-community-page">
      <div className="wb-container">
        <section className="wb-page-heading">
          <div><span className="wb-kicker">Laundromat Mastery Community</span><h1>The operating room for better store owners.</h1><p>Ask the real questions. Share the real numbers. Your discussions now follow your member account—not a single browser.</p></div>
          <div className="wb-member-count"><Users size={20} /><strong>Operator board</strong><span>{isAuthenticated ? "member workspace synced" : "sign in to join the board"}</span></div>
        </section>
        <div className="wb-community-layout">
          <aside className="wb-community-sidebar">
            <button className="wb-button" onClick={() => isAuthenticated ? setComposerOpen(true) : window.location.assign("/api/login")}><Plus size={17} /> {isAuthenticated ? "Start a discussion" : "Sign in to discuss"}</button>
            <div className="wb-sidebar-card"><strong>Laundromat spaces</strong>{spaces.map(([key, label], index) => <button className={selectedSpace === key ? "active" : ""} onClick={() => setSelectedSpace(key)} key={key}>{index === 0 ? <MessageCircle size={15} /> : <span className="wb-dot" />}{label}</button>)}</div>
            <div className="wb-sidebar-card wb-ask-card"><Sparkles size={18} /><strong>Stuck on a deal?</strong><p>Save your scorecard, write down the open question, and bring both to your next operator review.</p><button onClick={() => onNavigate("scorecard")}>Open scorecard <ArrowRight size={14} /></button></div>
          </aside>
          <section className="wb-feed">
            <div className="wb-feed-toolbar"><div className="wb-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search operator discussions" /></div><button>Newest <ChevronRight size={14} /></button></div>
            {message && <p className="wb-sync-message">{message}</p>}
            {!isLoading && !isAuthenticated && <div className="wb-empty-state"><LockKeyhole size={20} /><strong>Sign in to view and join the private operator board.</strong><button className="wb-button wb-button-small" onClick={() => window.location.assign("/api/login")}>Sign in <ArrowRight size={15} /></button></div>}
            {composerOpen && <div className="wb-composer"><div><span className="wb-avatar navy">{initials(displayName(user?.firstName, user?.lastName))}</span><strong>Start a conversation</strong></div><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give the room a clear title" maxLength={160} /><textarea autoFocus value={body} onChange={(event) => setBody(event.target.value)} placeholder="What are you working through? Give the room enough context to help." /><p className="wb-save-note">This discussion is saved to your authenticated member account.</p><div><button className="wb-secondary-button" onClick={() => setComposerOpen(false)}>Cancel</button><button disabled={busy || !title.trim() || !body.trim()} className="wb-button" onClick={() => void publish()}>Publish post</button></div></div>}
            {isAuthenticated && !filtered.length && <div className="wb-empty-state"><MessageCircle size={20} /><strong>No discussions here yet.</strong><span>Start the first useful conversation for this operator space.</span></div>}
            {filtered.map((post) => {
              const author = displayName(post.authorName, post.authorLastName);
              return <article className="wb-post" key={post.id}>
                <div className="wb-avatar navy">{initials(author)}</div>
                <div className="wb-post-body">
                  <div className="wb-post-meta"><strong>{author}</strong><span>WashBizHub member</span><i>·</i><span>{relativeTime(post.createdAt)}</span></div>
                  <span className="wb-tag">{spaces.find(([key]) => key === post.space)?.[1] ?? "Operator discussion"}</span><h2>{post.title}</h2><p>{post.body}</p>
                  <div className="wb-post-actions"><button onClick={() => void showReplies(post.id)}><MessageCircle size={16} /> {post.replyCount} replies</button><button onClick={() => void report(post.id)}><Flag size={15} /> Report</button></div>
                  {openDiscussion === post.id && <div className="wb-reply-panel">{replies.map((reply) => <div className="wb-reply" key={reply.id}><strong>{displayName(reply.authorName, reply.authorLastName)}</strong><span>{relativeTime(reply.createdAt)}</span><p>{reply.body}</p></div>)}{!post.isLocked && <div className="wb-reply-composer"><textarea value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} placeholder="Add a practical reply…" /><button disabled={busy || !replyDraft.trim()} className="wb-button wb-button-small" onClick={() => void addReply(post.id)}>Reply</button></div>}</div>}
                </div>
              </article>;
            })}
          </section>
        </div>
      </div>
    </main>
  );
}

function BuyRight() {
  const [quoted, setQuoted] = useState<string | null>(null);
  const { isAuthenticated } = useWashbizAuth();
  const [plan, setPlan] = useState<EquipmentPlan | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const loadPlan = async () => {
    if (!isAuthenticated) return setPlan(null);
    try {
      const data = await api<{ plans: EquipmentPlan[] }>("/api/laundromat/equipment-plans");
      setPlan(data.plans.find((item) => item.name === "My equipment lineup") ?? null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load your equipment plan."); }
  };
  useEffect(() => { void loadPlan(); }, [isAuthenticated]);
  const addToPlan = async (name: string) => {
    if (!isAuthenticated) return window.location.assign("/api/login");
    const items = plan?.items.includes(name) ? plan.items : [...(plan?.items ?? []), name];
    setBusy(true); setMessage("");
    try {
      const data = plan
        ? await api<{ plan: EquipmentPlan }>(`/api/laundromat/equipment-plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ name: plan.name, items, notes: plan.notes }) })
        : await api<{ plan: EquipmentPlan }>("/api/laundromat/equipment-plans", { method: "POST", body: JSON.stringify({ name: "My equipment lineup", items, notes: null }) });
      setPlan(data.plan); setQuoted(name); setMessage("Equipment lineup synced to your member account.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save this equipment plan."); }
    finally { setBusy(false); }
  };
  const removeFromPlan = async (name: string) => {
    if (!plan) return;
    setBusy(true);
    try {
      const data = await api<{ plan: EquipmentPlan }>(`/api/laundromat/equipment-plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ name: plan.name, items: plan.items.filter((item) => item !== name), notes: plan.notes }) });
      setPlan(data.plan);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update your plan."); }
    finally { setBusy(false); }
  };
  return (
    <main className="wb-page">
      <div className="wb-container">
        <section className="wb-page-heading wb-buy-heading"><div><span className="wb-kicker">Buy Right · Equipment intelligence</span><h1>See the machine.<br />Then price the store.</h1><p>Every equipment family is shown at full height before the technical specs. Pick the footprint that fits your floor, then build the right lineup.</p></div><div className="wb-price-note"><span /> Planning estimates</div></section>
        <section className="wb-product-grid">
          {products.map((product) => (
            <article className="wb-product-card" key={product.name}>
              <div className={`wb-product-image ${product.tone}`}><span className="wb-product-series">BCT Series</span><div className="wb-product-machine"><small>WASHBIZ</small><i>{product.icon}</i><b /></div></div>
               <div className="wb-product-content"><small>{product.label}</small><h2>{product.name}</h2><div className="wb-product-price"><span>Planning estimate from</span><strong>{product.price}</strong></div><button disabled={busy} onClick={() => void addToPlan(product.name)}>{plan?.items.includes(product.name) ? "Saved to lineup" : isAuthenticated ? "Save to lineup" : "Sign in to save"} <ArrowRight size={15} /></button></div>
            </article>
          ))}
        </section>
        <p className="wb-estimate-note">Planning estimates are not a supplier quote. Confirm final configuration, availability, freight, installation, and price with WashBizHub before making a purchase decision.</p>
        {message && <p className="wb-sync-message">{message}</p>}
        {isAuthenticated && plan && <section className="wb-plan-summary"><div><span className="wb-kicker">Your synced equipment lineup</span><h2>{plan.name}</h2><p>{plan.items.length ? "Available from every device where you sign in." : "Add equipment to begin your lineup."}</p></div><div className="wb-plan-items">{plan.items.map((item) => <span key={item}>{item}<button onClick={() => void removeFromPlan(item)} aria-label={`Remove ${item}`}>×</button></span>)}</div></section>}
        {quoted && <section className="wb-quote-panel"><div><CheckCircle2 size={22} /><div><strong>{quoted} saved to your planning list.</strong><p>Bring it to the equipment lineup lesson to compare capacity, footprint, and revenue per square foot.</p></div></div><button className="wb-button" onClick={() => setQuoted(null)}>Keep planning</button></section>}
        <section className="wb-buy-cta"><div><span className="wb-kicker">Don’t buy equipment in a vacuum</span><h2>Build the store around the location—not the other way around.</h2></div><button className="wb-button" onClick={() => window.location.assign("#scorecard")}>Score your site <Calculator size={17} /></button></section>
      </div>
    </main>
  );
}

function Scorecard() {
  const { isAuthenticated } = useWashbizAuth();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [eveningTraffic, setEveningTraffic] = useState("high");
  const [competition, setCompetition] = useState("moderate");
  const [rent, setRent] = useState("fair");
  const [showResult, setShowResult] = useState(false);
  const [savedScore, setSavedScore] = useState<SavedSiteScore | null>(null);
  const [savedScorecards, setSavedScorecards] = useState<SavedSiteScore[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const score = 58 + (eveningTraffic === "high" ? 18 : eveningTraffic === "moderate" ? 8 : -8) + (competition === "low" ? 12 : competition === "moderate" ? 4 : -8) + (rent === "fair" ? 8 : rent === "low" ? 14 : -10);
  useEffect(() => {
    if (!isAuthenticated) { setSavedScorecards([]); return; }
    void api<{ scorecards: SavedSiteScore[] }>("/api/laundromat/scorecards").then((data) => {
      setSavedScorecards(data.scorecards);
      if (data.scorecards[0]) setSavedScore(data.scorecards[0]);
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load your scorecards."));
  }, [isAuthenticated]);
  const calculate = async () => {
    if (!address.trim()) return;
    if (!isAuthenticated) return window.location.assign("/api/login");
    if (!name.trim()) return setMessage("Give this site scorecard a name before saving it.");
    setBusy(true); setMessage("");
    try {
      const data = await api<{ scorecard: SavedSiteScore }>("/api/laundromat/scorecards", {
        method: "POST",
        body: JSON.stringify({ name, address: address.trim(), eveningTraffic, competition, rent, score, notes: null }),
      });
      setSavedScore(data.scorecard); setSavedScorecards((items) => [data.scorecard, ...items]); setShowResult(true);
      setMessage("Named scorecard saved to your member account.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save your scorecard."); }
    finally { setBusy(false); }
  };

  return (
    <main className="wb-page wb-scorecard-page">
      <div className="wb-container wb-scorecard-layout">
        <section className="wb-scorecard-intro"><span className="wb-kicker">C.L.E.A.N.B.I. location intelligence</span><h1>Score the site<br />before it scores you.</h1><p>Use the first-pass scorecard to frame a better site visit. It does not replace due diligence—it makes sure you perform it.</p><div className="wb-scorecard-steps"><span><b>1</b> Assess demand</span><span><b>2</b> Map the trade area</span><span><b>3</b> Review the lease</span><span><b>4</b> Make a decision</span></div></section>
        <section className="wb-scorecard-form">
          <div className="wb-form-heading"><Calculator size={21} /><div><strong>Quick site score</strong><span>Start with the three factors that move a deal.</span></div></div>
          <label>Scorecard name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Columbus first-store review" /></label>
          <label>Site address or market<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="e.g. 1424 North Main, Columbus" /></label>
          <label>What does evening traffic look like?<select value={eveningTraffic} onChange={(event) => setEveningTraffic(event.target.value)}><option value="high">Active from 6–10 PM</option><option value="moderate">Some activity</option><option value="low">Quiet / uncertain</option></select></label>
          <label>Competitive pressure<select value={competition} onChange={(event) => setCompetition(event.target.value)}><option value="low">Low / underserved</option><option value="moderate">Moderate</option><option value="high">Heavy / entrenched</option></select></label>
          <label>Rent relative to the market<select value={rent} onChange={(event) => setRent(event.target.value)}><option value="low">Below market</option><option value="fair">Fair</option><option value="high">High / unclear</option></select></label>
          <button className="wb-button wb-full-button" disabled={!address.trim() || !name.trim() || busy} onClick={() => void calculate()}>{isAuthenticated ? "Calculate and save score" : "Sign in to save score"} <ArrowRight size={17} /></button>
          {message && <p className="wb-sync-message">{message}</p>}
          {showResult && savedScore && <div className={`wb-score-result ${savedScore.score >= 80 ? "good" : savedScore.score >= 65 ? "watch" : "risk"}`}><span>First-pass self-assessment · {savedScore.name ? `${savedScore.name} · ` : ""}{savedScore.address}</span><strong>{savedScore.score}</strong><p>{savedScore.score >= 80 ? "Promising. Validate this self-assessment in the field and document the lease assumptions." : savedScore.score >= 65 ? "Worth investigating—but take a harder look at the weak variables." : "Do not force the deal. Bring the risks to the Location Intelligence course."}</p></div>}
          {savedScorecards.length > 0 && <div className="wb-saved-scorecards"><strong>Your saved scorecards</strong>{savedScorecards.slice(0, 4).map((card) => <button key={card.id ?? card.address} onClick={() => { setSavedScore(card); setShowResult(true); }}><span>{card.name ?? card.address}</span><b>{card.score}</b></button>)}</div>}
        </section>
      </div>
    </main>
  );
}

function Footer() {
  return <footer className="wb-footer"><div className="wb-container wb-footer-inner"><NavLogo /><p>WashBizHub.com · The Laundromat Mastery Community</p><div><a href="#learn">Academy</a><a href="#community">Community</a><a href="#buy">Equipment</a></div></div></footer>;
}

export default function WashBizApp() {
  const getPage = (): Page => {
    const selected = window.location.hash.replace("#", "") as Page;
    return ["learn", "community", "buy", "scorecard"].includes(selected) ? selected : "home";
  };
  const [page, setPage] = useState<Page>(getPage);
  const navigate = (next: Page) => {
    window.location.hash = next === "home" ? "home" : next;
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const handleHash = () => setPage(getPage());
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="washbiz-app">
      <AppHeader page={page} onNavigate={navigate} />
      {page === "home" && <Home onNavigate={navigate} />}
      {page === "learn" && <Learn />}
       {page === "community" && <Community onNavigate={navigate} />}
      {page === "buy" && <BuyRight />}
      {page === "scorecard" && <Scorecard />}
      <Footer />
    </div>
  );
}