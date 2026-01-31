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
  Compass as CompassIcon, Users, Sun, Footprints, Target, 
  Scale, Beaker, Heart, Plus, TrendingUp, CheckCircle2
} from "lucide-react";

const pillars = [
  { 
    id: "community", 
    name: "Community", 
    icon: Users, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    description: "Connection with others on the recovery journey",
    questions: ["Did you connect with someone today?", "How supported do you feel?"]
  },
  { 
    id: "optimism", 
    name: "Optimism", 
    icon: Sun, 
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    description: "Maintaining hope and positive outlook",
    questions: ["What gave you hope today?", "What are you looking forward to?"]
  },
  { 
    id: "movement", 
    name: "Movement", 
    icon: Footprints, 
    color: "text-[#C9941A]",
    bgColor: "bg-[#C9941A]/20",
    description: "Physical activity and therapy",
    questions: ["What movement did you do today?", "How does your body feel?"]
  },
  { 
    id: "purpose", 
    name: "Purpose", 
    icon: Target, 
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    description: "Finding meaning and direction",
    questions: ["What gives your recovery meaning?", "What goals are you working toward?"]
  },
  { 
    id: "accountability", 
    name: "Accountability", 
    icon: Scale, 
    color: "text-[#C9941A]",
    bgColor: "bg-[#C9941A]/20",
    description: "Staying consistent and tracking progress",
    questions: ["Did you stick to your commitments?", "What habits did you maintain?"]
  },
  { 
    id: "science", 
    name: "Science", 
    icon: Beaker, 
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    description: "Using evidence-based approaches",
    questions: ["What new technique did you try?", "What worked well today?"]
  },
  { 
    id: "self_care", 
    name: "Self-Care", 
    icon: Heart, 
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    description: "Taking care of mind, body, and spirit",
    questions: ["How did you nurture yourself today?", "What do you need right now?"]
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
          <p className="text-gray-400">
            Your 7-Pillar Navigation System for Recovery
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
