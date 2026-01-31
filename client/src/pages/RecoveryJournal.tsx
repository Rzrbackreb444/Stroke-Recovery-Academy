import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  BookHeart, Plus, Calendar, Heart, Sun, Moon, Cloud, 
  Smile, Frown, Meh, TrendingUp, Clock, Star
} from "lucide-react";

const moods = [
  { value: "great", label: "Great", icon: Smile, color: "text-green-500" },
  { value: "good", label: "Good", icon: Sun, color: "text-yellow-500" },
  { value: "okay", label: "Okay", icon: Meh, color: "text-gray-400" },
  { value: "struggling", label: "Struggling", icon: Cloud, color: "text-blue-400" },
  { value: "difficult", label: "Difficult", icon: Frown, color: "text-red-400" },
];

export default function RecoveryJournal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    mood: "okay",
    energyLevel: 5,
    gratitude: "",
    wins: "",
    challenges: "",
    reflection: "",
    tomorrowsGoal: "",
  });

  const { data: entries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/recovery/journal"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/journal", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/journal"] });
      setIsOpen(false);
      setForm({
        mood: "okay",
        energyLevel: 5,
        gratitude: "",
        wins: "",
        challenges: "",
        reflection: "",
        tomorrowsGoal: "",
      });
      toast({ title: "Journal entry saved!", description: "Reflection is key to recovery." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save entry", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    createMutation.mutate(form);
  };

  const getMoodIcon = (mood: string) => {
    const m = moods.find(mo => mo.value === mood);
    return m ? m.icon : Meh;
  };

  const getMoodColor = (mood: string) => {
    const m = moods.find(mo => mo.value === mood);
    return m ? m.color : "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Recovery Journal | Stroke Recovery Academy"
        description="Daily journaling tool for stroke recovery. Track your mood, energy levels, wins, and challenges to monitor emotional and physical progress on your recovery journey."
        canonical="/recovery/journal"
        keywords="stroke recovery journal, daily reflection, recovery tracking, stroke survivor journaling"
        author="Stroke Recovery Academy"
        type="website"
        expertise={["Stroke recovery psychology", "Mindfulness in recovery", "Progress monitoring"]}
        experience="Supporting stroke survivors since 2024"
        trustSignals={["Evidence-based recovery programs", "Therapeutic journaling methods", "Professional recovery support"]}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Recovery Journal", url: "/recovery/journal" }]}
      />
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookHeart className="h-6 w-6 text-orange-500" />
              Recovery Journal
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Daily reflections on your journey
            </p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500" data-testid="button-new-entry">
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>Today's Journal Entry</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>How are you feeling today?</Label>
                  <div className="flex gap-2 mt-2">
                    {moods.map((mood) => {
                      const Icon = mood.icon;
                      return (
                        <button
                          key={mood.value}
                          onClick={() => setForm({ ...form, mood: mood.value })}
                          className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                            form.mood === mood.value 
                              ? 'bg-orange-500/20 border border-orange-500' 
                              : 'bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          <Icon className={`h-6 w-6 ${mood.color}`} />
                          <span className="text-xs mt-1">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Energy Level (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[form.energyLevel]}
                      onValueChange={([v]) => setForm({ ...form, energyLevel: v })}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                      {form.energyLevel}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>What are you grateful for today?</Label>
                  <Textarea
                    placeholder="Three things I'm grateful for..."
                    value={form.gratitude}
                    onChange={(e) => setForm({ ...form, gratitude: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Today's Wins (big or small)</Label>
                  <Textarea
                    placeholder="What went well today? What did you accomplish?"
                    value={form.wins}
                    onChange={(e) => setForm({ ...form, wins: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Challenges</Label>
                  <Textarea
                    placeholder="What was difficult? What did you struggle with?"
                    value={form.challenges}
                    onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Free Write / Reflection</Label>
                  <Textarea
                    placeholder="Anything else on your mind..."
                    value={form.reflection}
                    onChange={(e) => setForm({ ...form, reflection: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tomorrow's Goal</Label>
                  <Textarea
                    placeholder="What's one thing you want to accomplish tomorrow?"
                    value={form.tomorrowsGoal}
                    onChange={(e) => setForm({ ...form, tomorrowsGoal: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full bg-orange-500"
                  disabled={createMutation.isPending}
                  data-testid="button-save-entry"
                >
                  {createMutation.isPending ? "Saving..." : "Save Journal Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <Calendar className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{entries?.length || 0}</div>
            <div className="text-sm text-gray-400">Total Entries</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {entries?.filter((e: any) => e.mood === 'great' || e.mood === 'good').length || 0}
            </div>
            <div className="text-sm text-gray-400">Good Days</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <Star className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {entries?.filter((e: any) => e.wins).length || 0}
            </div>
            <div className="text-sm text-gray-400">Wins Logged</div>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading your journal...</div>
        ) : !entries?.length ? (
          <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
            <BookHeart className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Journal</h3>
            <p className="text-gray-400 mb-4">
              Daily reflection helps you see patterns and celebrate progress.
            </p>
            <Button onClick={() => setIsOpen(true)} className="bg-orange-500">
              Write Your First Entry
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry: any) => {
              const MoodIcon = getMoodIcon(entry.mood);
              return (
                <Card key={entry.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800">
                        <MoodIcon className={`h-5 w-5 ${getMoodColor(entry.mood)}`} />
                      </div>
                      <div>
                        <div className="font-medium">
                          {new Date(entry.created_at).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="capitalize">{entry.mood}</span>
                          <span>•</span>
                          <span>Energy: {entry.energy_level}/10</span>
                        </div>
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  
                  {entry.wins && (
                    <div className="mb-3">
                      <Badge className="bg-green-500/20 text-green-400 mb-1">Wins</Badge>
                      <p className="text-gray-300 text-sm">{entry.wins}</p>
                    </div>
                  )}
                  
                  {entry.gratitude && (
                    <div className="mb-3">
                      <Badge className="bg-purple-500/20 text-purple-400 mb-1">Grateful For</Badge>
                      <p className="text-gray-300 text-sm">{entry.gratitude}</p>
                    </div>
                  )}
                  
                  {entry.reflection && (
                    <div>
                      <Badge className="bg-blue-500/20 text-blue-400 mb-1">Reflection</Badge>
                      <p className="text-gray-300 text-sm">{entry.reflection}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
