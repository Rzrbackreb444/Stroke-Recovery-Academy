import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreePine, Brain, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";

/**
 * Brain Games hub.
 * Casino-style games (slots/blackjack/roulette/poker/bingo/powerball/scratch-off)
 * have been hidden — they don't fit the Stroke Recovery Academy brand. Only
 * cognitive-recovery games appear here.
 */

const BRAIN_GAMES = [
  {
    id: "wilderness-survival",
    name: "Wilderness Survival",
    description:
      "7-day survival adventure. Make decisions, manage resources, outlast the wild. Builds problem-solving and resilience — exactly the cognitive skills stroke recovery rebuilds.",
    icon: TreePine,
    href: "/wilderness-survival",
    benefits: ["Decision-making", "Resource planning", "Pattern recognition"],
    gradient: "from-emerald-700 via-green-600 to-teal-700",
  },
];

const COGNITIVE_BENEFITS = [
  { name: "Decision-Making", desc: "Practice weighing trade-offs under pressure." },
  { name: "Working Memory", desc: "Hold multiple variables in mind at once." },
  { name: "Pattern Recognition", desc: "Spot recurring shapes, sequences, threats." },
  { name: "Executive Function", desc: "Plan, prioritize, and follow through." },
];

export default function SasquatchGames() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D0D0D] via-[#1a1a1a] to-[#0D0D0D] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link href="/recovery/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-[#C9941A] mb-6"
            data-testid="link-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <Badge className="bg-[#C9941A]/15 text-[#C9941A] border-none uppercase tracking-widest text-[10px] font-black mb-4">
            <Brain className="w-3.5 h-3.5 mr-2" /> Cognitive Recovery
          </Badge>
          <h1
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
            data-testid="text-page-title"
          >
            Brain Games
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Survivor-friendly cognitive training disguised as fun. Each game targets the
            recovery skills your therapist works on in clinic — but at your pace, in your
            living room, with no pressure.
          </p>
        </div>

        {/* Game grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {BRAIN_GAMES.map((game) => (
            <Link key={game.id} href={game.href} data-testid={`link-game-${game.id}`}>
              <Card className="bg-[#161616] border-[#C9941A]/20 hover-elevate cursor-pointer overflow-hidden h-full">
                <div className={`h-32 bg-gradient-to-br ${game.gradient} relative`}>
                  <game.icon className="w-16 h-16 text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-black tracking-tight">{game.name}</h3>
                    <ChevronRight className="w-5 h-5 text-[#C9941A] flex-shrink-0" />
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">
                    {game.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {game.benefits.map((b) => (
                      <Badge
                        key={b}
                        className="bg-[#C9941A]/10 text-[#C9941A] border-none text-[10px] uppercase tracking-wider font-bold"
                      >
                        {b}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Coming-soon placeholder card so the grid doesn't look empty */}
          <Card className="bg-[#161616]/50 border-[#C9941A]/10 border-dashed">
            <div className="h-32 bg-gradient-to-br from-[#1f1f1f] to-[#0f0f0f] relative flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[#C9941A]/40" />
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-black tracking-tight text-white/70 mb-2">
                More games coming
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                We're building memory, attention, and language games designed specifically for
                stroke recovery. Want one built next? Tell us in the community.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why brain games matter */}
        <div className="border-t border-[#C9941A]/15 pt-12">
          <h2 className="text-2xl font-black tracking-tight mb-2">
            Why brain games matter for stroke recovery
          </h2>
          <p className="text-sm text-white/60 mb-8 max-w-2xl">
            Neuroplasticity isn't just for physical movement. The same rewiring that rebuilds an
            arm rebuilds attention, language, and memory — but only with repeated, targeted practice.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COGNITIVE_BENEFITS.map((b) => (
              <Card key={b.name} className="bg-[#161616] border-[#C9941A]/15">
                <CardContent className="p-5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#C9941A] mb-2">
                    {b.name}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-5 border border-[#C9941A]/20 rounded-md bg-[#161616]">
          <p className="text-xs text-white/60 leading-relaxed">
            <strong className="text-white">Not a medical device.</strong> Brain games are
            supplemental practice, not a replacement for prescribed cognitive therapy. If you have
            ongoing cognitive deficits, work with a licensed speech-language pathologist or
            neuropsychologist.
          </p>
        </div>
      </div>
    </div>
  );
}
