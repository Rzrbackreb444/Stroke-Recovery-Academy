import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Plus, Search, Shield, Heart, HeartPulse, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface GroupRow {
  id: number; slug: string; name: string; description: string;
  type: string; conditionTag: string | null; memberCount: number;
  isMember?: boolean; iconUrl?: string | null;
}

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  survivor: { label: "Survivors", icon: Shield, color: "text-[#C9941A]" },
  caregiver: { label: "Caregivers", icon: Heart, color: "text-rose-500" },
  condition: { label: "Condition-specific", icon: HeartPulse, color: "text-blue-500" },
  general: { label: "General", icon: Sparkles, color: "text-emerald-500" },
};

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "survivor", conditionTag: "" });

  const { data: allGroups, isLoading } = useQuery<GroupRow[]>({
    queryKey: ["/api/groups"],
  });

  const filtered = (allGroups || []).filter((g) => {
    if (tab !== "all" && g.type !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.conditionTag || "").toLowerCase().includes(q);
    }
    return true;
  });

  const joinMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/groups/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Joined group" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/groups/${id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Left group" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/groups", form);
      return res.json();
    },
    onSuccess: (g: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setCreateOpen(false);
      setForm({ name: "", description: "", type: "survivor", conditionTag: "" });
      toast({ title: "Group created!", description: `${g.name} is live.` });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to create group", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7 text-[#C9941A]" />
              Groups
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Cohorts for survivors, caregivers, and condition-specific circles.
            </p>
          </div>
          {user && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#C9941A] text-black hover:bg-[#C9941A]/90" data-testid="button-create-group">
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle>New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Left-Side Rebuild"
                      className="bg-[#0D0D0D] border-[#333]"
                      data-testid="input-group-name"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="bg-[#0D0D0D] border-[#333]" data-testid="select-group-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                        <SelectItem value="survivor">Survivors</SelectItem>
                        <SelectItem value="caregiver">Caregivers</SelectItem>
                        <SelectItem value="condition">Condition-specific</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.type === "condition" && (
                    <div>
                      <Label>Condition tag</Label>
                      <Input
                        value={form.conditionTag}
                        onChange={(e) => setForm({ ...form, conditionTag: e.target.value })}
                        placeholder="aphasia, hemiparesis, fatigue…"
                        className="bg-[#0D0D0D] border-[#333]"
                        data-testid="input-condition-tag"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What's this group for?"
                      className="min-h-[100px] bg-[#0D0D0D] border-[#333]"
                      data-testid="input-group-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !form.name.trim() || !form.description.trim()}
                    className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                    data-testid="button-submit-group"
                  >
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups…"
              className="pl-9 bg-[#1a1a1a] border-[#333]"
              data-testid="input-search-groups"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-[#1a1a1a] border border-[#333]">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="survivor" data-testid="tab-survivor">Survivors</TabsTrigger>
              <TabsTrigger value="caregiver" data-testid="tab-caregiver">Caregivers</TabsTrigger>
              <TabsTrigger value="condition" data-testid="tab-condition">Conditions</TabsTrigger>
              <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading groups…</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="text-center py-16">
              <Users className="h-10 w-10 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No groups match your search yet.</p>
              {user && (
                <Button className="mt-4 gap-2 bg-[#C9941A] text-black hover:bg-[#C9941A]/90" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Start one
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((g) => {
              const meta = TYPE_META[g.type] || TYPE_META.general;
              const Icon = meta.icon;
              return (
                <Card
                  key={g.id}
                  className="bg-[#1a1a1a] border-[#333] hover-elevate transition-all"
                  data-testid={`card-group-${g.id}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start gap-2 text-base">
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.color}`} />
                      <Link href={`/groups/${g.slug}`} className="hover:text-[#C9941A] transition-colors line-clamp-2">
                        {g.name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-400 line-clamp-3">{g.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="border-[#C9941A]/30 text-[#C9941A]">
                        {meta.label}
                      </Badge>
                      {g.conditionTag && (
                        <Badge variant="outline" className="border-[#333]">{g.conditionTag}</Badge>
                      )}
                      <span className="text-xs text-gray-500 ml-auto">
                        {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link href={`/groups/${g.slug}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-[#333]" data-testid={`button-open-${g.id}`}>
                          Open
                        </Button>
                      </Link>
                      {user && (
                        g.isMember ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400"
                            disabled={leaveMutation.isPending}
                            onClick={() => leaveMutation.mutate(g.id)}
                            data-testid={`button-leave-${g.id}`}
                          >
                            Leave
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
                            disabled={joinMutation.isPending}
                            onClick={() => joinMutation.mutate(g.id)}
                            data-testid={`button-join-${g.id}`}
                          >
                            Join
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
