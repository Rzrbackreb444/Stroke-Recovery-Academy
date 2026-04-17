import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Brain, Sparkles, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import WordSearchGame from "@/components/games/WordSearchGame";
import CrosswordGame from "@/components/games/CrosswordGame";
import MemoryMatchGame from "@/components/games/MemoryMatchGame";
import { BRAIN_GYM_PACKS, getDailyPack, type BrainGymPack } from "@shared/brainGymPacks";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type GameType = "wordsearch" | "crossword" | "memory";

export default function BrainGym() {
  const dailyPack = useMemo(() => getDailyPack(), []);
  const [packId, setPackId] = useState<string>(dailyPack.id);
  const [game, setGame] = useState<GameType>("wordsearch");
  const { toast } = useToast();

  const pack: BrainGymPack =
    BRAIN_GYM_PACKS.find((p) => p.id === packId) ?? dailyPack;

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  async function handleComplete(type: GameType) {
    try {
      await apiRequest("POST", "/api/recovery/brain-gym/complete", {
        gameType: type,
        packId: pack.id,
      });
      toast({
        title: "Streak credit logged",
        description: "Brain rep counted. Never zero.",
      });
    } catch {
      // Non-blocking — public users still get the win, no toast needed
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Brain Gym — Word Search, Crossword & Memory Games for Stroke Recovery"
        description="Free word search, crossword, and memory games built for stroke survivors. Themed packs from Nick Kremers' Sasquatch Method exercise language, vocabulary recall, and cognitive endurance."
        canonical="/recovery/brain-gym"
        keywords={[
          "stroke recovery brain games",
          "cognitive exercises stroke",
          "word search stroke survivor",
          "crossword aphasia recovery",
          "memory match brain training",
          "Sasquatch Method brain gym",
        ]}
      />

      <RecoveryHeader />

      {/* Hero */}
      <section className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#1a1a1a] to-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Link href="/recovery/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-gray-400"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="mb-3 text-sm font-bold uppercase tracking-widest"
                style={{ color: "#C9941A" }}
              >
                Brain Gym
              </p>
              <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
                Train the brain.
                <br />
                <span style={{ color: "#C9941A" }}>One rep at a time.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
                Word search, crossword, and memory games built for survivors. Themed
                from the Sasquatch Method, recovery anatomy, and the language of the
                comeback. Daily reps build the wire.
              </p>
            </div>
            <div className="rounded-md border border-[#C9941A]/30 bg-[#C9941A]/10 p-4 sm:w-72">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#C9941A]">
                <Calendar className="h-4 w-4" />
                Daily Pack
              </div>
              <p className="mt-2 text-xl font-black">{dailyPack.name}</p>
              <p className="mt-1 text-sm text-gray-400">{dailyPack.tagline}</p>
              <Button
                size="sm"
                onClick={() => {
                  setPackId(dailyPack.id);
                  setGame("wordsearch");
                  document
                    .getElementById("brain-gym-play")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-3 w-full bg-[#C9941A] text-black"
                data-testid="button-play-daily"
              >
                Play today's pack
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pack picker */}
      <section className="border-b border-[#1a1a1a] bg-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
            <Sparkles className="h-4 w-4" />
            Themed Packs
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BRAIN_GYM_PACKS.map((p) => {
              const isActive = p.id === packId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackId(p.id)}
                  data-testid={`pack-${p.id}`}
                  className="rounded-md border bg-[#111] p-4 text-left transition-all hover-elevate active-elevate-2"
                  style={{
                    borderColor: isActive ? p.accent : "#1e1e1e",
                    boxShadow: isActive ? `0 0 0 1px ${p.accent}` : "none",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: p.accent }}
                  >
                    {p.entries.length} terms
                  </p>
                  <p className="mt-1 text-base font-black text-white">{p.name}</p>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                    {p.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="brain-gym-play" className="bg-[#0D0D0D]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase">
                {pack.name}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                {pack.description}
              </p>
            </div>
          </div>

          <Tabs value={game} onValueChange={(v) => setGame(v as GameType)}>
            <TabsList className="mb-6 grid w-full grid-cols-3 bg-[#111] sm:max-w-md">
              <TabsTrigger value="wordsearch" data-testid="tab-wordsearch">
                Word Search
              </TabsTrigger>
              <TabsTrigger value="crossword" data-testid="tab-crossword">
                Crossword
              </TabsTrigger>
              <TabsTrigger value="memory" data-testid="tab-memory">
                Memory Match
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wordsearch" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <WordSearchGame
                  key={`ws-${pack.id}`}
                  entries={pack.entries}
                  accent={pack.accent}
                  onComplete={() => handleComplete("wordsearch")}
                />
              </div>
            </TabsContent>

            <TabsContent value="crossword" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <CrosswordGame
                  key={`cw-${pack.id}`}
                  entries={pack.entries}
                  accent={pack.accent}
                  onComplete={() => handleComplete("crossword")}
                />
              </div>
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-6">
                <MemoryMatchGame
                  key={`mm-${pack.id}`}
                  entries={pack.entries}
                  accent={pack.accent}
                  onComplete={() => handleComplete("memory")}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-start gap-4">
            <Brain className="mt-1 h-8 w-8 flex-shrink-0" style={{ color: "#C9941A" }} />
            <div>
              <h3 className="text-xl font-black text-white sm:text-2xl">
                Why we built Brain Gym
              </h3>
              <p className="mt-3 text-gray-400">
                Cognitive exercise after stroke isn't a side dish — it's main course.
                Word retrieval, visual scanning, working memory, and focus are all
                trainable. These games are designed to give you a daily rep that's
                playable from the couch on a hard day, themed in the language of the
                Method so the vocabulary itself gets stronger every time you play.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Lived experience, not medical advice. Consult your healthcare team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
