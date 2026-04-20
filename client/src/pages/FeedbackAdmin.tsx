import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Target, Calendar } from "lucide-react";

interface FeedbackEntry {
  id: number;
  name: string | null;
  email: string | null;
  user_type: string;
  goals: string[];
  free_text: string | null;
  created_at: string;
}

const GOAL_LABELS: Record<string, string> = {
  physical: "Regain movement",
  speech: "Improve speech",
  fatigue: "Reduce cognitive fatigue",
  habits: "Build daily habits",
  community: "Connect with survivors",
  accountability: "Accountability",
  caregiver_support: "Caregiver support",
  roadmap: "Clear roadmap",
  information: "Understand my brain",
};

const TYPE_COLORS: Record<string, string> = {
  survivor: "bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30",
  caregiver: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  visitor: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function FeedbackAdmin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: entries = [], isLoading } = useQuery<FeedbackEntry[]>({
    queryKey: ["/api/admin/feedback"],
    enabled: !!user,
  });

  if (authLoading) return null;
  if (!user) {
    setLocation("/recovery/login");
    return null;
  }

  const survivors = entries.filter(e => e.user_type === "survivor").length;
  const caregivers = entries.filter(e => e.user_type === "caregiver").length;
  const goalCounts: Record<string, number> = {};
  entries.forEach(e => e.goals.forEach(g => { goalCounts[g] = (goalCounts[g] || 0) + 1; }));
  const topGoals = Object.entries(goalCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Feedback Responses</h1>
          <p className="text-gray-500 text-sm">What survivors say they need from the platform</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#111] border-[#222] p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-[#C9941A]" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-black text-white">{entries.length}</p>
          </Card>
          <Card className="bg-[#111] border-[#222] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#C9941A]" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Survivors</span>
            </div>
            <p className="text-2xl font-black text-white">{survivors}</p>
          </Card>
          <Card className="bg-[#111] border-[#222] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Caregivers</span>
            </div>
            <p className="text-2xl font-black text-white">{caregivers}</p>
          </Card>
          <Card className="bg-[#111] border-[#222] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-[#C9941A]" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">With Email</span>
            </div>
            <p className="text-2xl font-black text-white">{entries.filter(e => e.email).length}</p>
          </Card>
        </div>

        {/* Top goals */}
        {topGoals.length > 0 && (
          <Card className="bg-[#111] border-[#222] p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Most Requested</h2>
            <div className="space-y-2">
              {topGoals.map(([goal, count]) => (
                <div key={goal} className="flex items-center gap-3">
                  <div
                    className="h-2 rounded-full bg-[#C9941A]"
                    style={{ width: `${Math.round((count / entries.length) * 100)}%`, minWidth: 8 }}
                  />
                  <span className="text-sm text-gray-300 shrink-0">{GOAL_LABELS[goal] || goal}</span>
                  <span className="text-xs text-gray-600 ml-auto">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Individual responses */}
        {isLoading ? (
          <p className="text-gray-500 text-center py-12">Loading responses...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No feedback yet. Share the platform to collect responses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <Card key={entry.id} className="bg-[#111] border-[#222] p-5">
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-white">
                      {entry.name || <span className="text-gray-500 italic">Anonymous</span>}
                    </p>
                    {entry.email && (
                      <p className="text-sm text-[#C9941A]">{entry.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs border ${TYPE_COLORS[entry.user_type] || TYPE_COLORS.visitor}`}>
                      {entry.user_type === "survivor" ? "Survivor" : entry.user_type === "caregiver" ? "Caregiver" : "Visitor"}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {entry.goals.map(g => (
                    <span key={g} className="text-xs px-2 py-1 rounded bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]">
                      {GOAL_LABELS[g] || g}
                    </span>
                  ))}
                </div>

                {entry.free_text && (
                  <p className="text-sm text-gray-300 border-t border-[#1e1e1e] pt-3 mt-2 leading-relaxed">
                    "{entry.free_text}"
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
