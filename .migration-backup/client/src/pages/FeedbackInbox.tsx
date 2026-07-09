import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bug, Lightbulb, Heart, HelpCircle, MessageSquare, Inbox } from "lucide-react";

interface FeedbackItem {
  id: number;
  user_id: string | null;
  route: string;
  kind: string;
  body: string;
  severity: string;
  status: string;
  contact_email: string | null;
  user_agent: string | null;
  created_at: string;
}

const STATUSES = ["new", "triaged", "in_progress", "resolved", "wont_fix"] as const;

const KIND_META: Record<string, { Icon: any; color: string }> = {
  bug: { Icon: Bug, color: "bg-red-500/10 text-red-400 border-red-500/30" },
  feature: { Icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30" },
  praise: { Icon: Heart, color: "bg-pink-500/10 text-pink-300 border-pink-500/30" },
  confusion: { Icon: HelpCircle, color: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  general: { Icon: MessageSquare, color: "bg-gray-500/10 text-gray-300 border-gray-500/30" },
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30",
  triaged: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  in_progress: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  resolved: "bg-green-500/10 text-green-300 border-green-500/30",
  wont_fix: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default function FeedbackInbox() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const queryKey = statusFilter
    ? ["/api/admin/feedback/items", { status: statusFilter }]
    : ["/api/admin/feedback/items"];

  const { data: items = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        statusFilter ? `/api/admin/feedback/items?status=${statusFilter}` : "/api/admin/feedback/items",
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load feedback");
      return res.json();
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/feedback/items/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback/items"] });
    },
  });

  if (authLoading) return null;
  if (!user) {
    setLocation("/recovery/login");
    return null;
  }

  const counts = {
    total: items.length,
    new: items.filter((i) => i.status === "new").length,
    bugs: items.filter((i) => i.kind === "bug").length,
    urgent: items.filter((i) => i.severity === "urgent").length,
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Inbox className="h-6 w-6 text-[#E2741B]" />
          <h1 className="text-2xl font-bold" data-testid="text-inbox-title">Feedback Inbox</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Route-aware feedback from the floating button. Triage status to track follow-up.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 bg-[#111] border-[#1f1f1f]">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-2xl font-bold text-white" data-testid="stat-total">{counts.total}</div>
          </Card>
          <Card className="p-4 bg-[#111] border-[#1f1f1f]">
            <div className="text-xs text-gray-400">New</div>
            <div className="text-2xl font-bold text-[#E2741B]" data-testid="stat-new">{counts.new}</div>
          </Card>
          <Card className="p-4 bg-[#111] border-[#1f1f1f]">
            <div className="text-xs text-gray-400">Bugs</div>
            <div className="text-2xl font-bold text-red-400" data-testid="stat-bugs">{counts.bugs}</div>
          </Card>
          <Card className="p-4 bg-[#111] border-[#1f1f1f]">
            <div className="text-xs text-gray-400">Urgent</div>
            <div className="text-2xl font-bold text-orange-400" data-testid="stat-urgent">{counts.urgent}</div>
          </Card>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs text-gray-400">Filter status:</span>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44 bg-[#0a0a0a] border-[#1f1f1f] text-white" data-testid="select-status-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-[#1f1f1f] text-white">
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} data-testid={`option-filter-${s}`}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <Card className="p-8 bg-[#111] border-[#1f1f1f] text-center">
            <Inbox className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <div className="text-gray-400">No feedback yet for this filter.</div>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const meta = KIND_META[item.kind] ?? KIND_META.general;
              const KindIcon = meta.Icon;
              return (
                <Card
                  key={item.id}
                  className="p-4 bg-[#111] border-[#1f1f1f]"
                  data-testid={`card-feedback-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${meta.color} border`} data-testid={`badge-kind-${item.id}`}>
                        <KindIcon className="h-3 w-3 mr-1" />
                        {item.kind}
                      </Badge>
                      <Badge className={`${SEVERITY_COLOR[item.severity] || ""} border`}>{item.severity}</Badge>
                      <Badge className={`${STATUS_COLOR[item.status] || ""} border`} data-testid={`badge-status-${item.id}`}>
                        {item.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">{item.route}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap mb-3" data-testid={`text-body-${item.id}`}>
                    {item.body}
                  </p>
                  <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-gray-500">
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.contact_email && (
                        <span>
                          Reply: <a href={`mailto:${item.contact_email}`} className="text-[#E2741B] underline">{item.contact_email}</a>
                        </span>
                      )}
                      {item.user_id && <span>User: <span className="font-mono">{item.user_id.slice(0, 8)}…</span></span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {STATUSES.filter((s) => s !== item.status).slice(0, 3).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: item.id, status: s })}
                          disabled={updateStatus.isPending}
                          data-testid={`button-set-${s}-${item.id}`}
                        >
                          → {s.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
