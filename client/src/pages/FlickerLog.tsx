import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  Zap, Plus, Sparkles, Hand, Footprints, Brain, MessageCircle, 
  Heart, Star, Clock, Trophy, TrendingUp 
} from "lucide-react";

const bodyParts = [
  { value: "affected_hand", label: "Affected Hand", icon: Hand },
  { value: "affected_arm", label: "Affected Arm", icon: Hand },
  { value: "affected_leg", label: "Affected Leg", icon: Footprints },
  { value: "affected_foot", label: "Affected Foot", icon: Footprints },
  { value: "speech", label: "Speech", icon: MessageCircle },
  { value: "cognitive", label: "Cognitive/Thinking", icon: Brain },
  { value: "balance", label: "Balance", icon: TrendingUp },
  { value: "other", label: "Other", icon: Sparkles },
];

const emotions = [
  "Hopeful", "Excited", "Surprised", "Grateful", "Determined", 
  "Frustrated", "Tired", "Calm", "Focused", "Proud"
];

export default function FlickerLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    moment: "",
    bodyPart: "",
    intensity: 3,
    emotionBefore: "",
    emotionAfter: "",
    activity: "",
    isBreakthrough: false,
    notes: "",
  });

  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/recovery/flicker-log"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/recovery/flicker-log", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/flicker-log"] });
      setIsOpen(false);
      setForm({
        moment: "",
        bodyPart: "",
        intensity: 3,
        emotionBefore: "",
        emotionAfter: "",
        activity: "",
        isBreakthrough: false,
        notes: "",
      });
      toast({ title: "Flicker captured!", description: "Every micro-moment matters in your recovery." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save flicker log", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.moment.trim()) {
      toast({ title: "Required", description: "Please describe your moment", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const breakthroughs = logs?.filter(l => l.is_breakthrough) || [];
  const recentCount = logs?.length || 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-500" />
              Flicker Log
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Track micro-moments of recovery - every twitch, every spark matters
            </p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500" data-testid="button-add-flicker">
                <Plus className="h-4 w-4 mr-2" />
                Log a Flicker
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Capture Your Moment
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label>What happened? *</Label>
                  <Textarea
                    placeholder="I felt my finger twitch... My hand opened slightly... I said a word clearly..."
                    value={form.moment}
                    onChange={(e) => setForm({ ...form, moment: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    data-testid="input-moment"
                  />
                </div>

                <div>
                  <Label>Body Part</Label>
                  <Select value={form.bodyPart} onValueChange={(v) => setForm({ ...form, bodyPart: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1" data-testid="select-body-part">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {bodyParts.map((part) => (
                        <SelectItem key={part.value} value={part.value}>
                          {part.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Intensity (1-5)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[form.intensity]}
                      onValueChange={([v]) => setForm({ ...form, intensity: v })}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                      {form.intensity}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Emotion Before</Label>
                    <Select value={form.emotionBefore} onValueChange={(v) => setForm({ ...form, emotionBefore: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                        <SelectValue placeholder="How did you feel?" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {emotions.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Emotion After</Label>
                    <Select value={form.emotionAfter} onValueChange={(v) => setForm({ ...form, emotionAfter: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                        <SelectValue placeholder="How do you feel now?" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {emotions.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>What were you doing?</Label>
                  <Input
                    placeholder="Therapy, exercising, resting, eating..."
                    value={form.activity}
                    onChange={(e) => setForm({ ...form, activity: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakthrough"
                    checked={form.isBreakthrough}
                    onCheckedChange={(checked) => setForm({ ...form, isBreakthrough: !!checked })}
                  />
                  <label htmlFor="breakthrough" className="flex items-center gap-2 text-sm cursor-pointer">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Mark as Breakthrough Moment
                  </label>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any other details you want to remember..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full bg-orange-500"
                  disabled={createMutation.isPending}
                  data-testid="button-save-flicker"
                >
                  {createMutation.isPending ? "Saving..." : "Capture This Flicker"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{recentCount}</div>
            <div className="text-sm text-gray-400">Total Flickers</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{breakthroughs.length}</div>
            <div className="text-sm text-gray-400">Breakthroughs</div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {logs?.[0] ? new Date(logs[0].created_at).toLocaleDateString() : "-"}
            </div>
            <div className="text-sm text-gray-400">Last Logged</div>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading your flickers...</div>
        ) : !logs?.length ? (
          <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
            <Sparkles className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flickers logged yet</h3>
            <p className="text-gray-400 mb-4">
              Start capturing those micro-moments of recovery. Every twitch, every spark is progress!
            </p>
            <Button 
              onClick={() => setIsOpen(true)} 
              className="bg-orange-500"
            >
              Log Your First Flicker
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <Card key={log.id} className={`bg-zinc-900 border-zinc-800 p-4 ${log.is_breakthrough ? 'border-yellow-500/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {log.is_breakthrough && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Breakthrough
                        </Badge>
                      )}
                      {log.body_part && (
                        <Badge variant="outline" className="border-zinc-700">
                          {bodyParts.find(b => b.value === log.body_part)?.label || log.body_part}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                        Intensity: {log.intensity}/5
                      </Badge>
                    </div>
                    <p className="text-white font-medium">{log.moment}</p>
                    {log.activity && (
                      <p className="text-gray-400 text-sm mt-1">While: {log.activity}</p>
                    )}
                    {(log.emotion_before || log.emotion_after) && (
                      <p className="text-gray-500 text-sm mt-1">
                        {log.emotion_before && `Felt: ${log.emotion_before}`}
                        {log.emotion_before && log.emotion_after && " → "}
                        {log.emotion_after && `Now: ${log.emotion_after}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(log.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
