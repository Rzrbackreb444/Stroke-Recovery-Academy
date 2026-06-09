import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import RecoveryHeader from "@/components/RecoveryHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Lock, PenTool, Feather, Camera, Mic2, Check,
  HeartHandshake, Shield, Sparkles, BookOpen,
  Music, BookText, EyeOff, Globe2, CloudRain, Sun, Cloud,
  Activity, Heart, LifeBuoy
} from "lucide-react";

const PROMPT_CHIPS = [
  "What's one small thing?",
  "Who showed up for you?",
  "What did your body do today?",
  "A frustration you held back"
];

const TAGS = [
  "Mobility", "Speech", "Sleep", "Therapy", "Family", "Mood", "Pain", "Win"
];

function countSyllables(text: string): number {
  if (!text.trim()) return 0;
  const count = text.toLowerCase().split(/[^aeiouy]+/).filter(Boolean).length;
  return Math.max(1, count);
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

export default function RecoveryJournal() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Composer state
  const [entryMode, setEntryMode] = useState<"free" | "haiku" | "photo" | "voice">("free");
  const [entrySubType, setEntrySubType] = useState<"triumph" | "pitfall">("triumph");
  const [moodLabel, setMoodLabel] = useState<"good" | "okay" | "hard">("okay");
  const [energy, setEnergy] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isShared, setIsShared] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [activePrompt, setActivePrompt] = useState(PROMPT_CHIPS[0]);
  const [haikuLines, setHaikuLines] = useState(["", "", ""]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [communityFilter, setCommunityFilter] = useState<"all" | "triumphs" | "pitfalls" | "this-week">("all");

  // Data queries
  const { data: entries, isLoading: entriesLoading } = useQuery<any[]>({
    queryKey: ["/api/recovery/journal"],
  });

  const { data: insights } = useQuery<any>({
    queryKey: ["/api/recovery/journal/insights"],
  });

  const { data: communityEntries } = useQuery<any[]>({
    queryKey: ["/api/recovery/journal/community", { filter: communityFilter }],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/journal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/journal/insights"] });
      toast({ title: "Reflection saved.", description: "It's yours, always." });
      // Reset composer
      setFreeText("");
      setHaikuLines(["", "", ""]);
      setPhotoCaption("");
      setIsShared(false);
      setSelectedTags([]);
      setEnergy(3);
      setMoodLabel("okay");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save entry", variant: "destructive" });
    },
  });

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) setSelectedTags(selectedTags.filter((x) => x !== t));
    else setSelectedTags([...selectedTags, t]);
  };

  const handleSave = () => {
    const content = freeText || haikuLines.join("\n") || photoCaption || "Reflection";
    createMutation.mutate({
      content,
      entryType: entryMode,
      entrySubType,
      moodLabel,
      energyLevel: energy,
      tags: selectedTags.length > 0 ? selectedTags : null,
      isShared,
      isPrivate: !isShared,
      haikuLines: entryMode === "haiku" ? haikuLines : null,
      photoCaption: entryMode === "photo" ? photoCaption : null,
    });
  };

  const stats = insights?.stats || {};
  const totalEntries = entries?.length || 0;
  const totalWords = stats.total_words || 0;

  const filteredCommunity = useMemo(() => {
    if (!communityEntries) return [];
    if (communityFilter === "all") return communityEntries;
    if (communityFilter === "triumphs") return communityEntries.filter((e: any) => e.entry_sub_type === "triumph");
    if (communityFilter === "pitfalls") return communityEntries.filter((e: any) => e.entry_sub_type === "pitfall");
    if (communityFilter === "this-week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return communityEntries.filter((e: any) => new Date(e.shared_at || e.created_at) > weekAgo);
    }
    return communityEntries;
  }, [communityEntries, communityFilter]);

  return (
    <div className="min-h-[100dvh] bg-[#0E0D0C] text-[#F3F2EE] font-sans selection:bg-[#E2741B] selection:text-[#0E0D0C] overflow-x-hidden">
      <SEO
        title="Reflections | Stroke Recovery Academy"
        description="A survivor-first journaling space. No streaks, no pressure. Write when you need to, rest when you don't."
        canonical="/recovery/journal"
        keywords="stroke recovery journal, survivor journaling, recovery reflections"
        author="Stroke Recovery Academy"
        type="website"
      />
      <RecoveryHeader />

      {/* 1. HEADER / HERO */}
      <header className="px-6 pt-16 pb-12 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-['Anton'] text-3xl tracking-wide uppercase text-[#E2741B]">Reflections</h1>
          <div className="flex items-center gap-2 text-[#8A867D] text-sm font-medium">
            <Lock className="w-4 h-4" />
            <span>Private by default</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[#8A867D] text-sm uppercase tracking-widest font-bold mb-2">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-4xl sm:text-5xl font-['Anton'] uppercase leading-[1.1] tracking-wide mb-4">
              What's one small thing today?
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 bg-[#15120F] border border-[#2A2621] p-4 rounded-xl">
              <Shield className="w-5 h-5 text-[#8A867D] mt-0.5 shrink-0" />
              <p className="text-sm text-[#8A867D] leading-relaxed">
                No streaks. No pressure. Write when you need to, rest when you don't. Your recovery timeline is your own.
              </p>
            </div>
            <p className="text-sm text-[#8A867D] italic border-l-2 border-[#E2741B] pl-4 py-1">
              "We don't gloss over the hard days here. The dirt is where the roots grow." — Nick
            </p>
          </div>
        </div>
      </header>

      {/* 2. TODAY ENTRY COMPOSER */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <Card className="bg-[#15120F] border-[#2A2621] p-1 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-8 space-y-8">

            {/* Mode Chooser */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "free", label: "Free Write", icon: PenTool },
                { id: "haiku", label: "Haiku", icon: Feather },
                { id: "photo", label: "Photo", icon: Camera },
                { id: "voice", label: "Voice", icon: Mic2 },
              ].map((m) => {
                const isSelected = entryMode === (m.id as any);
                return (
                  <button
                    key={m.id}
                    onClick={() => setEntryMode(m.id as any)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl min-h-[88px] transition-all border-2 ${
                      isSelected
                        ? "bg-[#E2741B]/10 border-[#E2741B] text-[#E2741B]"
                        : "bg-[#1C1915] border-[#2A2621] text-[#8A867D] hover:bg-[#2A2621] hover:text-[#F3F2EE]"
                    }`}
                    data-testid={`button-mode-${m.id}`}
                  >
                    <m.icon className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MODES */}
            {entryMode === "free" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {PROMPT_CHIPS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePrompt(p)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        activePrompt === p
                          ? "bg-[#2A2621] border-[#5A5650] text-[#F3F2EE]"
                          : "bg-[#1C1915] border-[#2A2621] text-[#8A867D] hover:text-[#F3F2EE]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    className="w-full bg-[#1C1915] border-2 border-[#2A2621] rounded-2xl p-5 min-h-[160px] text-[#F3F2EE] placeholder:text-[#5A5650] focus:outline-none focus:border-[#E2741B] resize-none text-lg leading-relaxed"
                    placeholder={activePrompt}
                    data-testid="input-free-text"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-3 text-xs font-medium">
                    <span className="text-[#E2741B] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Autosaved
                    </span>
                    <span className="text-[#5A5650]">{freeText.split(/\s+/).filter((x) => x.length > 0).length} words</span>
                  </div>
                </div>
              </div>
            )}

            {entryMode === "haiku" && (
              <div className="space-y-4 bg-[#1C1915] p-6 sm:p-8 rounded-2xl border-2 border-[#2A2621]">
                <div className="flex items-start gap-3 mb-6">
                  <Feather className="w-5 h-5 text-[#8A867D] mt-1 shrink-0" />
                  <p className="text-[#8A867D] text-sm leading-relaxed">
                    A chapter is heavy. A haiku is 17 syllables. You can do this one-handed. Capture the feeling, drop the grammar.
                  </p>
                </div>
                <div className="space-y-4 font-medium text-lg">
                  {[
                    { target: 5, val: haikuLines[0], set: (v: string) => setHaikuLines([v, haikuLines[1], haikuLines[2]]) },
                    { target: 7, val: haikuLines[1], set: (v: string) => setHaikuLines([haikuLines[0], v, haikuLines[2]]) },
                    { target: 5, val: haikuLines[2], set: (v: string) => setHaikuLines([haikuLines[0], haikuLines[1], v]) },
                  ].map((line, i) => {
                    const count = countSyllables(line.val);
                    const isOver = count > line.target;
                    const isMatch = count === line.target;
                    return (
                      <div key={i} className="flex items-center gap-4 border-b border-[#2A2621] pb-2">
                        <input
                          type="text"
                          value={line.val}
                          onChange={(e) => line.set(e.target.value)}
                          placeholder={`Type ${line.target} syllables...`}
                          className="flex-1 bg-transparent border-none outline-none text-[#F3F2EE] placeholder:text-[#5A5650] italic focus:not-italic"
                          data-testid={`input-haiku-${i}`}
                        />
                        <div
                          className={`text-sm font-bold flex items-center justify-center w-12 h-8 rounded-lg ${
                            isMatch ? "bg-[#E2741B]/20 text-[#E2741B]" : isOver ? "bg-red-900/20 text-red-400" : "bg-[#2A2621] text-[#8A867D]"
                          }`}
                        >
                          {count}/{line.target}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {entryMode === "photo" && (
              <div className="space-y-4">
                <div className="w-full aspect-[4/3] bg-[#1C1915] border-2 border-dashed border-[#2A2621] hover:border-[#5A5650] rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors">
                  <div className="w-16 h-16 rounded-full bg-[#2A2621] flex items-center justify-center">
                    <Camera className="w-8 h-8 text-[#8A867D]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#F3F2EE] font-bold text-lg">Tap to upload</p>
                    <p className="text-[#8A867D] text-sm">A view, a meal, a messy room</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-[#1C1915] border-2 border-[#2A2621] rounded-xl px-5 py-4 text-[#F3F2EE] placeholder:text-[#5A5650] focus:outline-none focus:border-[#E2741B]"
                  placeholder="One line about this moment..."
                  data-testid="input-photo-caption"
                />
              </div>
            )}

            {entryMode === "voice" && (
              <div className="space-y-6 bg-[#1C1915] p-6 sm:p-8 rounded-2xl border-2 border-[#2A2621] flex flex-col items-center justify-center text-center min-h-[300px]">
                <button className="w-24 h-24 rounded-full bg-[#E2741B] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(226,116,27,0.3)]">
                  <Mic2 className="w-10 h-10 text-[#0E0D0C]" />
                </button>
                <div className="space-y-1">
                  <p className="text-[#F3F2EE] font-['Anton'] tracking-wider text-2xl">00:00</p>
                  <p className="text-[#8A867D] text-sm font-medium">Tap to record</p>
                </div>
                <div className="flex items-center gap-1 h-8 opacity-30">
                  {[2, 4, 3, 6, 8, 5, 3, 4, 7, 5, 2, 3].map((h, i) => (
                    <div key={i} className="w-1.5 bg-[#8A867D] rounded-full" style={{ height: `${h * 4}px` }} />
                  ))}
                </div>
                <div className="bg-[#2A2621]/50 p-4 rounded-xl border border-[#2A2621] w-full mt-4 text-left">
                  <p className="text-sm text-[#F3F2EE] mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E2741B]" /> We'll transcribe it for you
                  </p>
                  <p className="text-[#8A867D] text-xs italic">
                    "It automatically turns your audio into text, even if your speech is slow or slurred today..."
                  </p>
                </div>
              </div>
            )}

            {/* SHARED LOWER CONTROLS */}
            <div className="space-y-8 pt-6 border-t border-[#2A2621]">
              {/* Triumph / Pitfall */}
              <div className="flex bg-[#1C1915] p-1.5 rounded-2xl border-2 border-[#2A2621]">
                <button
                  onClick={() => setEntrySubType("triumph")}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
                    entrySubType === "triumph"
                      ? "bg-[#E2741B] text-[#0E0D0C] shadow-sm"
                      : "text-[#8A867D] hover:text-[#F3F2EE]"
                  }`}
                  data-testid="button-triumph"
                >
                  Triumph
                </button>
                <button
                  onClick={() => setEntrySubType("pitfall")}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
                    entrySubType === "pitfall"
                      ? "bg-[#2A2621] text-[#F3F2EE] shadow-sm"
                      : "text-[#8A867D] hover:text-[#F3F2EE]"
                  }`}
                  data-testid="button-pitfall"
                >
                  Pitfall
                </button>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <span className="text-xs text-[#5A5650] font-bold uppercase tracking-widest">Themes (Optional)</span>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const active = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                          active
                            ? "bg-[#2A2621] border-[#E2741B] text-[#F3F2EE]"
                            : "bg-[#1C1915] border-[#2A2621] text-[#8A867D] hover:border-[#5A5650]"
                        }`}
                        data-testid={`tag-${t}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Mood */}
                <div className="space-y-4">
                  <span className="text-xs text-[#5A5650] font-bold uppercase tracking-widest flex justify-between">
                    Mood
                    <span className="text-[#F3F2EE] capitalize">{moodLabel}</span>
                  </span>
                  <div className="flex justify-between gap-2 bg-[#1C1915] p-2 rounded-2xl border border-[#2A2621]">
                    {[
                      { id: "good", icon: Sun, label: "Good" },
                      { id: "okay", icon: Cloud, label: "Okay" },
                      { id: "hard", icon: CloudRain, label: "Hard" },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isActive = moodLabel === (m.id as any);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMoodLabel(m.id as any)}
                          className={`flex-1 flex justify-center p-4 rounded-xl transition-colors border-2 ${
                            isActive ? "bg-[#2A2621] text-[#E2741B] border-[#E2741B]" : "bg-transparent text-[#8A867D] border-transparent hover:text-[#F3F2EE]"
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy */}
                <div className="space-y-4">
                  <span className="text-xs text-[#5A5650] font-bold uppercase tracking-widest flex justify-between">
                    Energy Level
                    <span className="text-[#E2741B]">{energy}/5</span>
                  </span>
                  <div className="bg-[#1C1915] p-6 rounded-2xl border border-[#2A2621] flex flex-col justify-center min-h-[88px]">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-[#5A5650]">LOW</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={energy}
                        onChange={(e) => setEnergy(Number(e.target.value))}
                        className="flex-1 h-2 appearance-none rounded-full outline-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #E2741B ${((energy - 1) / 4) * 100}%, #2A2621 ${((energy - 1) / 4) * 100}%)`
                        }}
                        data-testid="slider-energy"
                      />
                      <span className="text-xs font-bold text-[#5A5650]">HIGH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="bg-[#1C1915] p-5 rounded-2xl border-2 border-[#2A2621] flex items-center justify-between gap-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    {isShared ? <Globe2 className="w-5 h-5 text-[#E2741B]" /> : <EyeOff className="w-5 h-5 text-[#8A867D]" />}
                    <span className="text-base font-bold uppercase tracking-wider text-[#F3F2EE]">Share to Community</span>
                  </div>
                  <p className="text-xs text-[#8A867D] leading-snug">
                    Help others feel less alone. You can always un-share later.
                  </p>
                </div>
                <Switch
                  checked={isShared}
                  onCheckedChange={setIsShared}
                  className="data-[state=checked]:bg-[#E2741B] scale-125 origin-right"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="w-full min-h-[64px] bg-[#E2741B] hover:bg-[#c96312] text-[#0E0D0C] font-bold uppercase tracking-widest text-lg rounded-2xl mt-4"
              data-testid="button-save-reflection"
            >
              {createMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </div>
        </Card>
      </section>

      {/* 3. LOOKING BACK (Dashboard) */}
      <section className="px-6 py-24 bg-[#15120F] border-t border-[#2A2621]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div>
            <h3 className="font-['Anton'] text-4xl uppercase text-[#F3F2EE] tracking-wide mb-3">Looking Back</h3>
            <p className="text-[#8A867D] text-lg">A tender proof of progress. Not gamified pressure.</p>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Reflections", value: String(totalEntries) },
              { label: "Words Written", value: totalWords ? String(totalWords) : "0" },
              { label: "Weeks", value: entries && entries.length > 0 ? "Active" : "Start today" },
              { label: "Longest Arc", value: stats.longest_arc || "—", desc: "gentle consistency" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0E0D0C] border border-[#2A2621] p-5 rounded-2xl">
                <p className="text-3xl font-['Anton'] text-[#E2741B] mb-1">{stat.value}</p>
                <p className="text-sm font-bold uppercase tracking-wider text-[#8A867D]">{stat.label}</p>
                {stat.desc && <p className="text-xs text-[#5A5650] mt-1">{stat.desc}</p>}
              </div>
            ))}
          </div>

          {/* Entry list */}
          {entriesLoading ? (
            <div className="text-center py-12 text-[#8A867D]">Loading your reflections...</div>
          ) : !entries?.length ? (
            <Card className="bg-[#0E0D0C] border-[#2A2621] p-8 text-center">
              <Heart className="h-12 w-12 text-[#E2741B] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[#F3F2EE]">Start Your Reflection</h3>
              <p className="text-[#8A867D] mb-4">Your first entry is the hardest. The rest follow.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.slice(0, 5).map((entry: any) => (
                <Card key={entry.id} className="bg-[#0E0D0C] border-[#2A2621] p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-[#F3F2EE]">{formatDate(entry.created_at)}</div>
                      <div className="flex items-center gap-2 text-sm text-[#8A867D]">
                        <span className="capitalize">{entry.entry_type || "reflection"}</span>
                        {entry.entry_sub_type && (
                          <>
                            <span>•</span>
                            <span className={entry.entry_sub_type === "triumph" ? "text-[#E2741B]" : "text-[#8A867D]"}>
                              {entry.entry_sub_type}
                            </span>
                          </>
                        )}
                        {entry.energy_level && (
                          <>
                            <span>•</span>
                            <span>Energy: {entry.energy_level}/5</span>
                          </>
                        )}
                      </div>
                    </div>
                    {entry.is_shared && (
                      <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-0 text-xs">
                        <Globe2 className="w-3 h-3 mr-1" /> Shared
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#F3F2EE] text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.content?.length > 200 ? entry.content.slice(0, 200) + "..." : entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {entry.tags.map((t: string) => (
                        <Badge key={t} variant="outline" className="border-[#2A2621] text-[#8A867D] text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
              {entries.length > 5 && (
                <p className="text-center text-[#5A5650] text-sm">
                  +{entries.length - 5} more entries
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. WHEN YOU'RE READY (Composition & Monetization) */}
      <section className="py-24 border-t border-[#2A2621] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#E2741B] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

        <div className="px-6 max-w-5xl mx-auto space-y-16 relative">
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <h3 className="font-['Anton'] text-4xl sm:text-5xl uppercase text-[#F3F2EE] tracking-wide leading-[1.1]">
                Turn your story into something
              </h3>
              <p className="text-[#8A867D] text-lg leading-relaxed max-w-lg">
                Only when you're ready — nothing is published for you. Your story, your royalties. AI helps organize, but the words stay yours.
              </p>
            </div>

            <div className="bg-[#15120F] border border-[#2A2621] p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#2A2621] pb-4">
                <div className="w-10 h-10 rounded-full bg-[#E2741B]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#E2741B]" />
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-[#F3F2EE] text-sm">Your Impact</h4>
                  <p className="text-[#8A867D] text-sm">Real numbers, real people.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-3xl font-['Anton'] text-[#E2741B] mb-1">$0</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8A867D]">Total Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-['Anton'] text-[#F3F2EE] mb-1">{totalEntries}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8A867D]">Entries Written</p>
                </div>
              </div>
              <div className="bg-[#1C1915] p-4 rounded-xl flex items-start gap-4">
                <HeartHandshake className="w-5 h-5 text-[#E2741B] mt-0.5 shrink-0" />
                <p className="text-sm text-[#8A867D] leading-snug">
                  <span className="text-[#F3F2EE] font-medium">$0</span> routed to Stroke Lyfe Inc this year. Your entries are your story — when you publish, you choose the give-back.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Expanded Card */}
            <div className="col-span-1 md:col-span-2 row-span-2 bg-[#E2741B] rounded-3xl p-1 shadow-2xl">
              <div className="bg-[#15120F] rounded-[22px] p-6 sm:p-8 h-full flex flex-col justify-between space-y-8">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <BookText className="w-10 h-10 text-[#E2741B]" />
                    <Badge className="bg-[#E2741B]/20 text-[#E2741B] hover:bg-[#E2741B]/20 border-0">IN PROGRESS</Badge>
                  </div>
                  <h4 className="font-['Anton'] uppercase text-3xl text-[#F3F2EE] tracking-wide mb-3">A Full Book</h4>
                  <p className="text-[#8A867D] text-lg mb-8">Weave your entries into a print-ready formatted manuscript for KDP or Lulu.</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-[#F3F2EE]">
                      <span>Readiness</span>
                      <span className="text-[#E2741B]">{totalEntries} / 40 Entries</span>
                    </div>
                    <div className="h-3 bg-[#1C1915] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E2741B] rounded-full" style={{ width: `${Math.min(100, (totalEntries / 40) * 100)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#0E0D0C] p-5 rounded-2xl border border-[#2A2621]">
                  <p className="text-xs text-[#8A867D] uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                    <EyeOff className="w-3 h-3" /> Preview Draft
                  </p>
                  <p className="text-[#F3F2EE] italic leading-relaxed text-sm">
                    "The lights didn't go out completely, they just flickered. Then the left side of the world vanished. Here is what they don't tell you about year one..."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="w-full h-14 bg-[#1C1915] text-[#F3F2EE] border-2 border-[#2A2621] hover:bg-[#2A2621] rounded-xl font-bold uppercase tracking-wider">
                    Edit Settings
                  </Button>
                  <Button className="w-full h-14 bg-[#E2741B] text-[#0E0D0C] hover:bg-[#c96312] rounded-xl font-bold uppercase tracking-wider">
                    Publish Options
                  </Button>
                </div>
              </div>
            </div>

            {/* Standard Cards */}
            {[
              { title: "Poem Collection", desc: "Compile your haikus into a digital chapbook.", icon: Feather, ready: `${totalEntries} entries`, pct: `${Math.min(100, (totalEntries / 15) * 100)}%` },
              { title: "A Chapter", desc: "Weave 30 entries into a narrative essay.", icon: BookOpen, ready: `${totalEntries} / 30`, pct: `${Math.min(100, (totalEntries / 30) * 100)}%` },
              { title: "Personal Anthem", desc: "Your words transformed into an AI music track.", icon: Music, ready: totalEntries > 0 ? "Ready to mix" : "Needs entries", pct: totalEntries > 0 ? "100%" : "0%" },
            ].map((product) => (
              <div key={product.title} className="group relative bg-[#15120F] border-2 border-[#2A2621] p-6 sm:p-8 rounded-3xl hover:border-[#5A5650] transition-colors cursor-pointer flex flex-col justify-between min-h-[300px]">
                <div>
                  <product.icon className="w-8 h-8 text-[#8A867D] mb-6 group-hover:text-[#E2741B] transition-colors" />
                  <h4 className="font-['Anton'] uppercase text-2xl text-[#F3F2EE] tracking-wide mb-3">{product.title}</h4>
                  <p className="text-[#8A867D] text-sm leading-relaxed">{product.desc}</p>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#5A5650] mb-2">
                    <span>{product.ready}</span>
                  </div>
                  <div className="h-1.5 bg-[#1C1915] rounded-full overflow-hidden">
                    <div className="h-full bg-[#5A5650] group-hover:bg-[#E2741B] transition-colors rounded-full" style={{ width: product.pct }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SHARED WITH THE TRIBE (Community) */}
      <section className="py-24 bg-[#0E0D0C] border-t border-[#2A2621]">
        <div className="px-6 max-w-5xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <h3 className="font-['Anton'] text-4xl uppercase text-[#F3F2EE] tracking-wide">Shared with the Tribe</h3>
              <p className="text-[#8A867D] text-lg">
                Consented entries from the community. Survivors seeing survivors. You're never the only one.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "triumphs", label: "Triumphs" },
                { id: "pitfalls", label: "Pitfalls" },
                { id: "this-week", label: "This Week" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCommunityFilter(f.id as any)}
                  className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-colors ${
                    communityFilter === f.id
                      ? "bg-[#E2741B] text-[#0E0D0C]"
                      : "bg-[#15120F] text-[#8A867D] border border-[#2A2621] hover:text-[#F3F2EE]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!filteredCommunity?.length ? (
              <div className="col-span-full text-center py-12 text-[#8A867D]">
                <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-[#2A2621]" />
                <p>No shared entries yet. Be the first to share your story — someone needs to hear it.</p>
              </div>
            ) : (
              filteredCommunity.map((post: any) => (
                <div key={post.id} className="bg-[#15120F] border border-[#2A2621] p-6 sm:p-8 rounded-3xl flex flex-col justify-between gap-6 hover:border-[#5A5650] transition-colors">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[#8A867D] border-[#2A2621] bg-[#1C1915] uppercase tracking-wider text-[10px] font-bold rounded-md px-2 py-1">
                        Shared by choice
                      </Badge>
                      <span className={`text-xs font-bold uppercase tracking-wider ${post.entry_sub_type === "triumph" ? "text-[#E2741B]" : "text-[#8A867D]"}`}>
                        {post.entry_sub_type || "reflection"}
                      </span>
                    </div>
                    <p className="text-[#F3F2EE] text-lg leading-relaxed font-medium">
                      "{post.content?.length > 200 ? post.content.slice(0, 200) + "..." : post.content}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-[#2A2621]">
                    <div className="text-sm font-medium text-[#8A867D]">
                      {post.first_name || "Anonymous"}
                    </div>
                    <button className="flex items-center gap-2 text-[#8A867D] hover:text-[#E2741B] transition-colors bg-[#1C1915] px-3 py-1.5 rounded-full border border-[#2A2621]">
                      <HeartHandshake className="w-4 h-4" />
                      <span className="text-xs font-bold">Felt this</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. GIVE-BACK FOOTER */}
      <footer className="bg-[#15120F] border-t border-[#2A2621] py-24 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-32 bg-[#E2741B] opacity-5 blur-[100px] rounded-t-full pointer-events-none" />

        <div className="px-6 max-w-3xl mx-auto text-center space-y-12 relative">
          <div className="w-20 h-20 bg-[#1C1915] border border-[#2A2621] rounded-2xl flex items-center justify-center mx-auto rotate-3">
            <HeartHandshake className="w-10 h-10 text-[#E2741B] -rotate-3" />
          </div>

          <div className="space-y-6">
            <h4 className="font-['Anton'] text-4xl uppercase tracking-wide text-[#F3F2EE]">The Virtuous Loop</h4>
            <p className="text-[#8A867D] text-lg leading-relaxed">
              Stroke Lyfe operates as a dual structure. When survivors publish their stories, they can choose to route a percentage of royalties to Stroke Lyfe Inc (our 501c3). This funds accounts and coaching for survivors who cannot afford it.
            </p>
            <div className="inline-flex flex-col items-center gap-2 bg-[#1C1915] border-2 border-[#2A2621] px-8 py-4 rounded-2xl mt-4">
              <span className="text-3xl font-['Anton'] text-[#E2741B]">312</span>
              <span className="text-sm font-bold uppercase tracking-widest text-[#F3F2EE]">Free accounts funded this year</span>
            </div>
          </div>

          <div className="pt-12 border-t border-[#2A2621] flex flex-col items-center gap-6">
            <span className="text-lg font-['Anton'] uppercase tracking-widest text-[#E2741B]">Heart's still thumpin'.</span>
            <p className="text-xs text-[#5A5650] max-w-md">
              If things are getting too dark, don't wait. Dial 988 or reach out to your doctor. Recovery is a long road, but you don't have to walk it alone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
