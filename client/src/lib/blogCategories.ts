import {
  Brain, Heart, FlaskConical, Dumbbell, Users, TrendingUp, BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Canonical blog category source-of-truth ──────────────────────────────────
// The `id` values MUST match the `category` column stored in the DB
// (see shared/schema.ts recovery_blog_posts.category). Keep this the single
// place that maps a raw category slug → human-readable label + styling so the
// filter tabs, list-card badges, and article-page badge never drift apart.

export interface BlogCategoryDef {
  id: string;
  label: string;
  /** Light-theme badge classes (RecoveryBlog list cards) */
  colorLight: string;
  /** Dark-theme badge classes (RecoveryBlogPost article page) */
  colorDark: string;
  /** Dark-theme hero gradient (RecoveryBlogPost) */
  gradient: string;
  /** Placeholder illustration when a post has no hero image */
  illustration: {
    gradient: string;
    dotColor: string;
    iconColor: string;
    Icon: LucideIcon;
  };
}

export const BLOG_CATEGORIES: BlogCategoryDef[] = [
  {
    id: "philosophy",
    label: "Philosophy",
    colorLight: "bg-purple-100 text-purple-700 border-purple-200",
    colorDark: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    gradient: "from-purple-900/30 to-[#1C1917]",
    illustration: { gradient: "from-purple-50 to-purple-100/60", dotColor: "bg-purple-200", iconColor: "#9333EA", Icon: Brain },
  },
  {
    id: "therapy",
    label: "Therapy",
    colorLight: "bg-blue-100 text-blue-700 border-blue-200",
    colorDark: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gradient: "from-blue-900/30 to-[#1C1917]",
    illustration: { gradient: "from-blue-50 to-blue-100/60", dotColor: "bg-blue-200", iconColor: "#2563EB", Icon: Heart },
  },
  {
    id: "science",
    label: "Science",
    colorLight: "bg-green-100 text-green-700 border-green-200",
    colorDark: "bg-green-500/20 text-green-400 border-green-500/30",
    gradient: "from-green-900/30 to-[#1C1917]",
    illustration: { gradient: "from-green-50 to-green-100/60", dotColor: "bg-green-200", iconColor: "#16A34A", Icon: FlaskConical },
  },
  {
    id: "exercises",
    label: "Exercises",
    colorLight: "bg-orange-100 text-orange-700 border-orange-200",
    colorDark: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    gradient: "from-orange-900/30 to-[#1C1917]",
    illustration: { gradient: "from-orange-50 to-orange-100/60", dotColor: "bg-orange-200", iconColor: "#C06B3E", Icon: Dumbbell },
  },
  {
    id: "caregivers",
    label: "Caregivers",
    colorLight: "bg-pink-100 text-pink-700 border-pink-200",
    colorDark: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    gradient: "from-pink-900/30 to-[#1C1917]",
    illustration: { gradient: "from-pink-50 to-pink-100/60", dotColor: "bg-pink-200", iconColor: "#DB2777", Icon: Users },
  },
  {
    id: "work-career",
    label: "Work & Career",
    colorLight: "bg-yellow-100 text-yellow-800 border-yellow-200",
    colorDark: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    gradient: "from-yellow-900/30 to-[#1C1917]",
    illustration: { gradient: "from-yellow-50 to-amber-100/60", dotColor: "bg-yellow-200", iconColor: "#B45309", Icon: TrendingUp },
  },
];

const CATEGORY_BY_ID: Record<string, BlogCategoryDef> = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.id, c]),
);

/** Filter tabs list, including the "All Posts" pseudo-category. */
export const BLOG_FILTER_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Posts" },
  ...BLOG_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
];

/** Human-readable label. Falls back to a de-slugged, title-cased version. */
export function categoryLabel(id: string): string {
  const def = CATEGORY_BY_ID[id];
  if (def) return def.label;
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function categoryLight(id: string): string {
  return CATEGORY_BY_ID[id]?.colorLight ?? "bg-stone-100 text-stone-600 border-stone-200";
}

export function categoryDark(id: string): string {
  return CATEGORY_BY_ID[id]?.colorDark ?? "bg-gray-500/20 text-gray-400";
}

export function categoryGradient(id: string): string {
  return CATEGORY_BY_ID[id]?.gradient ?? "from-[#C06B3E]/20 to-[#1C1917]";
}

const FALLBACK_ILLUSTRATION: BlogCategoryDef["illustration"] = {
  gradient: "from-stone-50 to-[#F5F0EB]",
  dotColor: "bg-[#E2C2A4]",
  iconColor: "#C06B3E",
  Icon: BookOpen,
};

export function categoryIllustration(id: string): BlogCategoryDef["illustration"] {
  return CATEGORY_BY_ID[id]?.illustration ?? FALLBACK_ILLUSTRATION;
}
