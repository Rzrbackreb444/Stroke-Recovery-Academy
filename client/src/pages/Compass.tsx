import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  Compass as CompassIcon, Scale, Footprints, Beaker, Sun, 
  Flame, CheckCircle2, TrendingUp, Plus
} from "lucide-react";

const pillars = [
  { 
    id: "control", 
    name: "Control", 
    letter: "C",
    icon: Scale, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    description: "Control what you can — let go of the rest. Focus your energy where it moves the needle.",
    questions: ["What did you control today?", "What did you choose to let go of?"]
  },
  { 
    id: "own_pace", 
    name: "Own Your Pace", 
    letter: "O",
    icon: Footprints, 
    color: "text-[#C9941A]",
    bgColor: "bg-[#C9941A]/20",
    description: "Own your pace. This is your recovery, not a race. Progress on your timeline is still progress.",
    questions: ["Did you honor your own pace today?", "Did you compare yourself to others?"]
  },
  { 
    id: "mutate", 
    name: "Mutate", 
    letter: "M",
    icon: Beaker, 
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    description: "Mutate — adapt and experiment. What stopped working yesterday is a signal to evolve, not quit.",
    questions: ["What did you try differently today?", "What are you adapting in your protocol?"]
  },
  { 
    id: "patience", 
    name: "Patience", 
    letter: "P",
    icon: Sun, 
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    description: "Patience + nutrition = fuel. You cannot rush neuroplasticity. Feed the machine and let it work.",
    questions: ["Did you eat to fuel your recovery today?", "Are you being patient with your progress?"]
  },
  { 
    id: "anger", 
    name: "Anger is Fuel", 
    letter: "A",
    icon: Flame, 
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    description: "Anger is fuel — channel it. Let every 'you can't' and every setback stoke the fire instead of burning you down.",
    questions: ["What are you angry about?", "How did you use that anger productively today?"]
  },
  { 
    id: "small_wins", 
    name: "Small Wins", 
    letter: "S",
    icon: CheckCircle2, 
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    description: "Small wins are sacred. A twitch, a flicker, one more rep — log it. Celebrate it. Build on it.",
    questions: ["What small win happened today?", "Did you log your flicker moments?"]
  },
  { 
    id: "stack", 
    name: "Stack Failures", 
    letter: "S",
    icon: TrendingUp, 
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    description: "Stack failures into success. Every failed attempt is data. Stack them into your recovery foundation.",
    questions: ["What didn't work today?", "What did that failure teach you?"]
  },
];

export default function Compass() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPillar, setSelectedPillar] = useState<typeof pillars[0] | null>(null);
  const [form, setForm] = useState({
    score: 5,
    reflection: "",
    wins: "",
    challenges: "",
    tomorrowsGoal: "",
  });

  const { data: compassData, isLoading } = useQuery<any>({
    queryKey: ["/api/recovery/compass"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/compass", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/compass"] });
      setSelectedPillar(null);
      setForm({ score: 5, reflection: "", wins: "", challenges: "", tomorrowsGoal: "" });
      toast({ title: "Pillar updated!", description: "Keep navigating your recovery!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update compass", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedPillar) return;
    updateMutation.mutate({
      pillar: selectedPillar.id,
      score: form.score,
      reflection: form.reflection,
      wins: form.wins ? [form.wins] : null,
      challenges: form.challenges ? [form.challenges] : null,
      tomorrowsGoal: form.tomorrowsGoal,
    });
  };

  const entries = compassData?.entries || [];
  const goals = compassData?.goals || [];

  const getPillarScore = (pillarId: string) => {
    const recentEntries = entries.filter((e: any) => e.pillar === pillarId).slice(0, 7);
    if (recentEntries.length === 0) return 0;
    const avg = recentEntries.reduce((sum: number, e: any) => sum + e.score, 0) / recentEntries.length;
    return Math.round(avg * 10);
  };

  const overallScore = pillars.reduce((sum, p) => sum + getPillarScore(p.id), 0) / pillars.length;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <CompassIcon className="h-8 w-8 text-[#C9941A]" />
            C.O.M.P.A.S.S.
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            The Builder's Full Navigation System — Control · Own · Mutate · Patience · Anger · Small Wins · Stack
          </p>
          <p className="text-[#C9941A] text-sm font-medium mt-1 italic">
            "Your advanced recovery compass — used alongside S.A.S.C.H. every day."
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Recovery Score</h2>
            <span className="text-2xl font-bold text-[#C9941A]">{Math.round(overallScore)}%</span>
          </div>
          <Progress value={overallScore} className="h-3" />
          <p className="text-gray-400 text-sm mt-2">
            Based on your average pillar scores over the last 7 days
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pillars.map((pillar) => {
            const score = getPillarScore(pillar.id);
            const Icon = pillar.icon;
            
            return (
              <Card 
                key={pillar.id} 
                className="bg-[#1a1a1a] border-[#333] p-4 cursor-pointer hover-elevate transition-all"
                onClick={() => setSelectedPillar(pillar)}
                data-testid={`pillar-${pillar.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${pillar.bgColor}`}>
                    <Icon className={`h-5 w-5 ${pillar.color}`} />
                  </div>
                  <Badge variant="outline" className={`${pillar.color} border-current`}>
                    {score}%
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{pillar.name}</h3>
                <p className="text-gray-400 text-sm">{pillar.description}</p>
                <Progress value={score} className="h-1.5 mt-3" />
              </Card>
            );
          })}
        </div>

        <Card className="bg-[#1a1a1a] border-[#333] p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#C9941A]" />
            Recent Reflections
          </h2>
          {entries.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Click on any pillar above to start tracking your recovery journey.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map((entry: any) => {
                const pillar = pillars.find(p => p.id === entry.pillar);
                const Icon = pillar?.icon || CompassIcon;
                
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 bg-[#1a1a1a]/50 rounded-lg">
                    <div className={`p-1.5 rounded ${pillar?.bgColor || 'bg-zinc-700'}`}>
                      <Icon className={`h-4 w-4 ${pillar?.color || 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pillar?.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {entry.score}/10
                        </Badge>
                      </div>
                      {entry.reflection && (
                        <p className="text-gray-400 text-sm mt-1">{entry.reflection}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Dialog open={!!selectedPillar} onOpenChange={() => setSelectedPillar(null)}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
            {selectedPillar && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <selectedPillar.icon className={`h-5 w-5 ${selectedPillar.color}`} />
                    {selectedPillar.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>How would you rate this pillar today? (1-10)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[form.score]}
                        onValueChange={([v]) => setForm({ ...form, score: v })}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <Badge className={`${selectedPillar.bgColor} ${selectedPillar.color} border-0`}>
                        {form.score}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>{selectedPillar.questions[0]}</Label>
                    <Textarea
                      placeholder="Reflect on your experience..."
                      value={form.reflection}
                      onChange={(e) => setForm({ ...form, reflection: e.target.value })}
                      className="bg-[#1a1a1a] border-[#333] mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Today's Win</Label>
                    <Textarea
                      placeholder="What went well with this pillar today?"
                      value={form.wins}
                      onChange={(e) => setForm({ ...form, wins: e.target.value })}
                      className="bg-[#1a1a1a] border-[#333] mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Challenge</Label>
                    <Textarea
                      placeholder="What was difficult?"
                      value={form.challenges}
                      onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                      className="bg-[#1a1a1a] border-[#333] mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Tomorrow's Goal</Label>
                    <Textarea
                      placeholder="What will you focus on tomorrow?"
                      value={form.tomorrowsGoal}
                      onChange={(e) => setForm({ ...form, tomorrowsGoal: e.target.value })}
                      className="bg-[#1a1a1a] border-[#333] mt-1"
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    className="w-full bg-[#C9941A]"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-compass"
                  >
                    {updateMutation.isPending ? "Saving..." : "Update Pillar"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
