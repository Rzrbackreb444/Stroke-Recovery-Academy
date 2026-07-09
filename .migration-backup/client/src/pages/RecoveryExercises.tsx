import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecoverySafetyFooter } from "@/components/recovery/RecoverySafetyFooter";
import {
  Activity,
  Hand,
  StretchHorizontal,
  Wind,
  Search,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Exercise {
  id: number;
  slug: string;
  name: string;
  category: string;
  position: string;
  level: string;
  domain: string;
  targets: string[];
  description: string;
  beginnerSets: number | null;
  beginnerReps: number | null;
  beginnerHoldSec: number | null;
  moderateSets: number | null;
  moderateReps: number | null;
  moderateHoldSec: number | null;
  advancedSets: number | null;
  advancedReps: number | null;
  advancedHoldSec: number | null;
  saschPhase: string | null;
}

const CATEGORIES: {
  key: string;
  label: string;
  icon: any;
  blurb: string;
}[] = [
  { key: "all", label: "All", icon: Dumbbell, blurb: "Full library" },
  { key: "lower", label: "Lower Body", icon: Activity, blurb: "Legs, hips, ankles, balance" },
  { key: "upper", label: "Upper Body", icon: Activity, blurb: "Shoulders, arms, elbows, wrists" },
  { key: "hand_fine_motor", label: "Hand / Fine Motor", icon: Hand, blurb: "Grip, pinch, dexterity" },
  { key: "spasticity", label: "Spasticity", icon: Wind, blurb: "Calm tone before & after work" },
  { key: "stretch", label: "Stretches", icon: StretchHorizontal, blurb: "Range of motion + recovery" },
];

const POSITIONS = ["all", "seated", "standing", "either"];
const LEVELS = ["all", "beginner", "moderate", "advanced"];

export default function RecoveryExercises() {
  const [category, setCategory] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  useEffect(() => {
    document.title = "Recovery Exercise Library | Stroke Recovery OS";
  }, []);

  const { data, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/recovery/exercises"],
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((ex) => {
      if (category !== "all" && ex.category !== category) return false;
      if (position !== "all" && ex.position !== position) return false;
      if (level !== "all" && ex.level !== level) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay =
          ex.name.toLowerCase() +
          " " +
          ex.description.toLowerCase() +
          " " +
          ex.targets.join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, category, position, level, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length || 0 };
    for (const ex of data || []) c[ex.category] = (c[ex.category] || 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#E2741B] mb-2">
            Survivor OS · Exercise Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Real exercises. Real progressions.
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Evidence-based stroke recovery exercises with seated and standing variations,
            three difficulty levels, and clear progression rules. Authored by Nick Kremers.
          </p>
        </div>

        <RecoverySafetyFooter variant="compact" />

        {/* Filters */}
        <div className="mt-8 mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = category === c.key;
              const count = counts[c.key] ?? 0;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  data-testid={`filter-category-${c.key}`}
                  className={[
                    "rounded-lg border p-3 text-left transition-all hover-elevate",
                    isActive
                      ? "border-[#E2741B] bg-[#E2741B]/10"
                      : "border-[#333] bg-[#1a1a1a]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="h-4 w-4 text-[#E2741B]" />
                    <span className="text-[10px] text-gray-500 font-mono">{count}</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-tight">{c.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{c.blurb}</p>
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                Position
              </p>
              <div className="flex gap-1 flex-wrap">
                {POSITIONS.map((p) => (
                  <Badge
                    key={p}
                    variant={position === p ? "default" : "outline"}
                    onClick={() => setPosition(p)}
                    className={
                      position === p
                        ? "cursor-pointer bg-[#E2741B] text-black hover:bg-[#E2741B]"
                        : "cursor-pointer"
                    }
                    data-testid={`filter-position-${p}`}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="sm:col-span-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                Level
              </p>
              <div className="flex gap-1 flex-wrap">
                {LEVELS.map((l) => (
                  <Badge
                    key={l}
                    variant={level === l ? "default" : "outline"}
                    onClick={() => setLevel(l)}
                    className={
                      level === l
                        ? "cursor-pointer bg-[#E2741B] text-black hover:bg-[#E2741B]"
                        : "cursor-pointer"
                    }
                    data-testid={`filter-level-${l}`}
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="sm:col-span-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
                Search
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="drop foot, grip, balance…"
                  className="pl-9 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
                  data-testid="input-exercise-search"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#1a1a1a]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-10 text-center">
            <p className="text-gray-400">No exercises match. Try broadening filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((ex) => (
              <ExerciseCard key={ex.slug} ex={ex} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ ex }: { ex: Exercise }) {
  const begin = ex.beginnerSets && ex.beginnerReps
    ? `${ex.beginnerSets}×${ex.beginnerReps}${ex.beginnerHoldSec ? ` · ${ex.beginnerHoldSec}s` : ""}`
    : null;
  const mod = ex.moderateSets && ex.moderateReps
    ? `${ex.moderateSets}×${ex.moderateReps}${ex.moderateHoldSec ? ` · ${ex.moderateHoldSec}s` : ""}`
    : null;
  const adv = ex.advancedSets && ex.advancedReps
    ? `${ex.advancedSets}×${ex.advancedReps}${ex.advancedHoldSec ? ` · ${ex.advancedHoldSec}s` : ""}`
    : null;

  return (
    <Link
      href={`/recovery/exercises/${ex.slug}`}
      className="block"
      data-testid={`card-exercise-${ex.slug}`}
    >
        <Card className="bg-[#1a1a1a] border-[#333] p-4 hover-elevate h-full">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-white">{ex.name}</h3>
            <ChevronRight className="h-4 w-4 text-[#E2741B] flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="text-[10px] capitalize">
              {ex.position}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {ex.level}
            </Badge>
            {ex.targets.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] capitalize border-[#E2741B]/40 text-[#E2741B]">
                {t.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
            {ex.description}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#333]">
            <Stat label="Beginner" value={begin} />
            <Stat label="Moderate" value={mod} />
            <Stat label="Advanced" value={adv} />
          </div>
        </Card>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-[11px] font-mono text-white mt-0.5">{value || "—"}</p>
    </div>
  );
}
