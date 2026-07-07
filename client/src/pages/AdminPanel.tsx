import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Plus,
  Infinity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Crown,
  DollarSign,
  BarChart3,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Check,
  X as XIcon,
  Building2,
  Mail,
  UserPlus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import { Activity, UserPlus, AlertCircle, CheckCircle, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";

interface UserWithCredits {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  subscriptionStatus: string | null;
  createdAt: string;
  credits: {
    balance: number;
    bonusCredits: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
}

interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    recentSignups: number;
  };
  credits: {
    totalBalance: number;
    totalBonusCredits: number;
    totalEarned: number;
    totalSpent: number;
  };
  usage: {
    last24Hours: {
      events: number;
      creditsUsed: number;
    };
  };
}

interface RevenueData {
  metrics: {
    totalRevenue: number;
    mrr: number;
    subscriptionRevenue: number;
    creditPurchases: number;
    marketplaceSales: number;
    creatorPayouts: number;
    platformFees: number;
    transactionCount: number;
  };
  recentEvents: Array<{
    id: number;
    eventType: string;
    amount: number;
    productType: string | null;
    tierName: string | null;
    status: string;
    createdAt: string;
  }>;
}

interface SubscriptionData {
  activeSubscriptions: number;
  newThisMonth: number;
  churned: number;
  churnRate: string;
  byTier: Record<string, number>;
}

interface CreditAnalytics {
  totalCreditsUsed: number;
  totalCreditsGranted: number;
  netCreditFlow: number;
  byFeature: Record<string, number>;
  byStudio: Record<string, number>;
  topFeatures: Array<{ feature: string; credits: number }>;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function AddCreditsDialog({ user, onSuccess }: { user: UserWithCredits; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addCreditsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/credits`, {
        amount: parseInt(amount),
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Credits added successfully" });
      setOpen(false);
      setAmount("");
      setReason("");
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to add credits", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-add-credits-${user.id}`}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Credits to {user.firstName || user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter credit amount"
              data-testid="input-credit-amount"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adding credits"
              data-testid="input-credit-reason"
            />
          </div>
          <Button 
            onClick={() => addCreditsMutation.mutate()} 
            disabled={!amount || parseInt(amount) <= 0 || addCreditsMutation.isPending}
            className="w-full"
            data-testid="button-confirm-add-credits"
          >
            {addCreditsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add {amount || 0} Credits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({ user, onUpdate }: { user: UserWithCredits; onUpdate: () => void }) {
  const { toast } = useToast();

  const setUnlimitedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/unlimited`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Unlimited credits granted" });
      onUpdate();
    },
    onError: () => {
      toast({ title: "Failed to set unlimited credits", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${user.id}/role`, { role: newRole });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      onUpdate();
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const isUnlimited = user.credits.balance >= 999999999;
  const totalCredits = user.credits.balance + user.credits.bonusCredits;

  return (
    <div 
      className="flex flex-wrap items-center gap-4 p-4 border-b last:border-b-0 hover-elevate"
      data-testid={`row-user-${user.id}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.profileImageUrl || undefined} />
        <AvatarFallback>
          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-[200px]">
        <div className="font-medium text-sm">
          {user.firstName} {user.lastName}
          {user.role === 'admin' && <Crown className="h-3 w-3 inline ml-1 text-[#E2741B]" />}
        </div>
        <div className="text-xs text-gray-400">{user.email}</div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isUnlimited ? "default" : "secondary"} className="font-mono">
          {isUnlimited ? (
            <>
              <Infinity className="h-3 w-3 mr-1" /> Unlimited
            </>
          ) : (
            `${totalCredits.toLocaleString()} credits`
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={user.role}
          onValueChange={(value) => updateRoleMutation.mutate(value)}
          disabled={updateRoleMutation.isPending}
        >
          <SelectTrigger className="w-28" data-testid={`select-role-${user.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <AddCreditsDialog user={user} onSuccess={onUpdate} />

        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setUnlimitedMutation.mutate()}
          disabled={isUnlimited || setUnlimitedMutation.isPending}
          data-testid={`button-unlimited-${user.id}`}
        >
          {setUnlimitedMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Infinity className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface PendingSpotlight {
  id: number;
  monthKey: string;
  displayName: string;
  email: string | null;
  status: string;
  selectedAt: string | null;
  headline: string | null;
  story: string | null;
  photoUrl: string | null;
  location: string | null;
  recoveryDate: string | null;
}

function SpotlightAdminPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: pending, isLoading } = useQuery<PendingSpotlight[]>({
    queryKey: ["/api/admin/spotlight/pending"],
  });
  const [editing, setEditing] = useState<Record<number, Partial<PendingSpotlight>>>({});

  const select = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/spotlight/select-monthly"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/spotlight/pending"] });
      toast({ title: "Candidate selected", description: "Review and approve below." });
    },
    onError: (e: any) => toast({ title: "Selection failed", description: e?.message || "Try again", variant: "destructive" }),
  });

  const approve = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: any }) =>
      apiRequest("POST", `/api/admin/spotlight/${id}/approve`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/spotlight/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/recovery/spotlight"] });
      toast({ title: "Published", description: "Spotlight is live." });
    },
  });

  const reject = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("POST", `/api/admin/spotlight/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/spotlight/pending"] });
      toast({ title: "Rejected", description: "You can re-select." });
    },
  });

  const sendBroadcast = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/admin/spotlight/broadcast"),
    onSuccess: (res: any) => {
      toast({
        title: "Broadcast queued",
        description: `Sent: ${res?.sent ?? 0}, failed: ${res?.failed ?? 0}`,
      });
    },
    onError: (e: any) => toast({ title: "Broadcast failed", description: e?.message || "Try again", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#E2741B]" />
              Survivor Spotlight Pipeline
            </CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Pick a candidate (paid 3× weighted), review, then publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => select.mutate()}
              disabled={select.isPending}
              data-testid="button-select-monthly"
            >
              {select.isPending ? "Selecting…" : "Pick Candidate for This Month"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendBroadcast.mutate()}
              disabled={sendBroadcast.isPending}
              data-testid="button-spotlight-broadcast"
            >
              {sendBroadcast.isPending ? "Sending…" : "Send Monthly Newsletter"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading…</p>
          ) : !pending || pending.length === 0 ? (
            <p className="text-gray-400">
              No pending or published spotlights yet. Pick a candidate to start.
            </p>
          ) : (
            <div className="space-y-4">
              {pending.map((s) => {
                const draft = editing[s.id] || {};
                const merged = { ...s, ...draft };
                return (
                  <div
                    key={s.id}
                    className="rounded-md border border-[#333] bg-[#0D0D0D] p-4 space-y-3"
                    data-testid={`spotlight-row-${s.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-bold">{merged.displayName}</p>
                        <p className="text-xs text-gray-500">
                          {merged.monthKey} · {merged.email || "—"} · status:{" "}
                          <Badge variant="secondary">{merged.status}</Badge>
                        </p>
                      </div>
                      {s.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approve.mutate({
                                id: s.id,
                                body: {
                                  headline: merged.headline,
                                  story: merged.story,
                                  photoUrl: merged.photoUrl,
                                  location: merged.location,
                                  recoveryDate: merged.recoveryDate,
                                },
                              })
                            }
                            disabled={approve.isPending}
                            data-testid={`button-approve-${s.id}`}
                          >
                            <Check className="mr-1 h-4 w-4" /> Approve & Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reject.mutate(s.id)}
                            disabled={reject.isPending}
                            data-testid={`button-reject-${s.id}`}
                          >
                            <XIcon className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    {s.status === "pending" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Headline"
                          value={merged.headline || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, [s.id]: { ...draft, headline: e.target.value } })
                          }
                          data-testid={`input-headline-${s.id}`}
                        />
                        <Input
                          placeholder="Location"
                          value={merged.location || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, [s.id]: { ...draft, location: e.target.value } })
                          }
                          data-testid={`input-location-${s.id}`}
                        />
                        <Input
                          placeholder="Photo URL"
                          value={merged.photoUrl || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, [s.id]: { ...draft, photoUrl: e.target.value } })
                          }
                          data-testid={`input-photo-${s.id}`}
                        />
                        <Input
                          type="date"
                          value={merged.recoveryDate ? merged.recoveryDate.slice(0, 10) : ""}
                          onChange={(e) =>
                            setEditing({ ...editing, [s.id]: { ...draft, recoveryDate: e.target.value } })
                          }
                          data-testid={`input-date-${s.id}`}
                        />
                        <textarea
                          className="sm:col-span-2 min-h-[160px] rounded-md border border-[#333] bg-[#1a1a1a] p-3 text-sm text-white"
                          placeholder="Story (markdown allowed: **bold**, _italic_, paragraphs)"
                          value={merged.story || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, [s.id]: { ...draft, story: e.target.value } })
                          }
                          data-testid={`textarea-story-${s.id}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const NOM_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  selected: "bg-green-100 text-green-800",
  declined: "bg-gray-100 text-gray-600",
};

// ── Badges Admin Panel ────────────────────────────────────────────────────────
const NOMINATED_BADGE_KEYS = [
  { key: "forge",      label: "The Forge",   desc: "Found a new way through when the old way stopped working." },
  { key: "lighthouse", label: "Lighthouse",  desc: "Pulled another survivor back from a dark place." },
  { key: "teacher",    label: "The Teacher", desc: "Taught another survivor something that helped them." },
  { key: "pioneer",    label: "Pioneer",     desc: "Invented an adaptation the community adopted." },
  { key: "legend",     label: "Legend",      desc: "Nick's rarest badge — for the truly exceptional." },
];

function BadgesAdminPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; first_name?: string } | null>(null);
  const [badgeKey, setBadgeKey] = useState("forge");
  const [reason, setReason] = useState("");

  const userSearch = useQuery<any[]>({
    queryKey: ["/api/admin/badges/users", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const r = await fetch(`/api/admin/badges/users?q=${encodeURIComponent(search)}`);
      return r.ok ? r.json() : [];
    },
    enabled: search.length >= 2,
  });

  const recentBadges = useQuery<any[]>({
    queryKey: ["/api/admin/badges/recent"],
  });

  const awardMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/badges/award", {
        userId: selectedUser?.id,
        badgeKey,
        reason: reason.trim(),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
    },
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/badges/recent"] });
      toast({ title: `Badge awarded to ${selectedUser?.email}` });
      setSelectedUser(null); setReason(""); setBadgeKey("forge"); setSearch("");
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg">Award a Nominated Badge</h3>
          <p className="text-sm text-gray-500">
            Nominated badges are awarded by Nick for real contributions — not automatically. Each one
            is permanent and public on the survivor's profile.
          </p>

          {/* User search */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-gray-500">Survivor (search by email or name)</label>
            <Input
              value={selectedUser ? `${selectedUser.first_name ?? ""} ${selectedUser.email}`.trim() : search}
              onChange={e => { setSearch(e.target.value); setSelectedUser(null); }}
              placeholder="Search survivors…"
              className="bg-background"
              data-testid="input-badge-user-search"
            />
            {search.length >= 2 && !selectedUser && (userSearch.data ?? []).length > 0 && (
              <div className="border rounded-md divide-y mt-1 max-h-40 overflow-y-auto">
                {(userSearch.data ?? []).map((u: any) => (
                  <button
                    key={u.id}
                    className="w-full text-left px-3 py-2 text-sm hover-elevate"
                    onClick={() => { setSelectedUser(u); setSearch(""); }}
                    data-testid={`user-result-${u.id}`}
                  >
                    <span className="font-medium">{u.first_name} {u.last_name}</span>
                    <span className="ml-2 text-gray-500 text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-green-50 dark:bg-green-900/20 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>{selectedUser.first_name} — {selectedUser.email}</span>
                <button onClick={() => setSelectedUser(null)} className="ml-auto text-gray-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Badge selector */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-gray-500">Badge</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NOMINATED_BADGE_KEYS.map(b => (
                <button
                  key={b.key}
                  onClick={() => setBadgeKey(b.key)}
                  className={`text-left rounded-md border p-3 text-sm transition-colors ${badgeKey === b.key ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" : "border-border hover-elevate"}`}
                  data-testid={`badge-option-${b.key}`}
                >
                  <p className="font-bold">{b.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-gray-500">Reason (required — shown on their profile)</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="What did they do that earned this? Be specific — they'll read this."
              className="min-h-[80px]"
              maxLength={1000}
              data-testid="textarea-badge-reason"
            />
          </div>

          <Button
            onClick={() => awardMut.mutate()}
            disabled={!selectedUser || !reason.trim() || awardMut.isPending}
            className="w-full font-bold"
            data-testid="button-award-badge"
          >
            {awardMut.isPending ? "Awarding…" : `Award "${NOMINATED_BADGE_KEYS.find(b => b.key === badgeKey)?.label}" to ${selectedUser?.email ?? "…"}`}
          </Button>
        </CardContent>
      </Card>

      {/* Recent awards */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="font-bold text-lg">Recent Badge Awards</h3>
          {recentBadges.isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (recentBadges.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No badges awarded yet.</p>
          ) : (
            <div className="space-y-2">
              {(recentBadges.data ?? []).slice(0, 50).map((row: any) => (
                <div key={row.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{row.first_name ?? ""} {row.last_name ?? ""}</span>
                      <span className="text-xs text-gray-500">{row.email}</span>
                      <Badge variant={row.category === "nominated" ? "default" : "secondary"} className="text-[10px]">
                        {row.badge_name}
                      </Badge>
                    </div>
                    {row.reason && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">"{row.reason}"</p>}
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {new Date(row.awarded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SpotlightNominationsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: nominations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/spotlight/nominations"],
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/spotlight/nominations/${id}/status`, {
        status,
        adminNotes: notes[id] ?? undefined,
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/spotlight/nominations"] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#E2741B]" />
          Spotlight Applications & Nominations
          <Badge variant="secondary" className="ml-auto">{nominations?.length ?? 0}</Badge>
        </CardTitle>
        <p className="text-sm text-gray-400">Submissions from survivors applying or nominating others for the monthly feature.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !nominations?.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {nominations.map((nom: any) => (
              <div key={nom.id} className="rounded-lg border border-[#222] bg-[#0D0D0D] p-4 space-y-3"
                data-testid={`nom-row-${nom.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        {nom.type === "other" ? "Nomination" : "Self-application"}
                      </Badge>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${NOM_STATUS_COLORS[nom.status] ?? NOM_STATUS_COLORS.pending}`}>
                        {nom.status}
                      </span>
                    </div>
                    <p className="font-bold text-white mt-1">{nom.nominee_name}</p>
                    <p className="text-xs text-gray-500">
                      {nom.nominee_email && <>{nom.nominee_email} · </>}
                      {nom.nominee_location && <>{nom.nominee_location} · </>}
                      {nom.stroke_date && <>Stroke: {nom.stroke_date} · </>}
                      {nom.type === "other" && nom.relationship && <>Nominated by: {nom.submitter_first} ({nom.relationship})</>}
                      {nom.type === "self" && <>Submitted by: {nom.submitter_first} ({nom.submitter_email})</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["pending","reviewed","selected","declined"].map((s) => (
                      <button key={s}
                        onClick={() => statusMut.mutate({ id: nom.id, status: s })}
                        disabled={nom.status === s || statusMut.isPending}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${nom.status === s ? "bg-muted text-muted-foreground border-transparent" : "hover:bg-muted border-[#333] text-gray-300"}`}
                        data-testid={`btn-nom-status-${nom.id}-${s}`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed border-t border-[#1a1a1a] pt-3 whitespace-pre-line">
                  {nom.description}
                </p>
                {Array.isArray(nom.media_urls) && nom.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nom.media_urls.map((url: string, i: number) => (
                      <a key={i} href={`/objects/${url}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#E2741B] underline" data-testid={`link-media-${nom.id}-${i}`}>
                        Media {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end pt-1">
                  <div className="flex-1">
                    <input
                      placeholder="Admin notes (optional)"
                      value={notes[nom.id] ?? nom.admin_notes ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [nom.id]: e.target.value }))}
                      className="w-full text-xs bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-white placeholder:text-gray-600"
                      data-testid={`input-admin-notes-${nom.id}`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 shrink-0">
                    {new Date(nom.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsData {
  rangeDays: number;
  signupsByDay: { day: string; count: number }[];
  totals: {
    totalUsers: number;
    signups24h: number;
    signups7d: number;
    signups30d: number;
    active7d: number;
    active30d: number;
    checkins7d: number;
    checkins30d: number;
    enrollments30d: number;
    unlocks30d: number;
    revenue30d: number;
    revenueTotal: number;
    realSignupsInRecent: number;
  };
  recentSignups: Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    createdAt: string;
    isLikelyTest: boolean;
  }>;
  topFeatures: Array<{ feature: string; uses: number }>;
}

function AnalyticsTab() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load analytics.</span>
        </CardContent>
      </Card>
    );
  }

  const { totals, signupsByDay, recentSignups, topFeatures } = data;
  const realRecent = recentSignups.filter((u) => !u.isLikelyTest);
  const testRecent = recentSignups.filter((u) => u.isLikelyTest);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Signups"
          value={totals.totalUsers}
          icon={Users}
          subtitle={`${totals.signups24h} in last 24h · ${totals.signups7d} in 7d`}
        />
        <StatCard
          title="New (30 days)"
          value={totals.signups30d}
          icon={UserPlus}
        />
        <StatCard
          title="Active Users (7d)"
          value={totals.active7d}
          icon={Activity}
          subtitle={`${totals.active30d} active in 30d`}
        />
        <StatCard
          title="Daily Check-ins (30d)"
          value={totals.checkins30d}
          icon={Check}
          subtitle={`${totals.checkins7d} this week`}
        />
        <StatCard
          title="Course Enrollments (30d)"
          value={totals.enrollments30d}
          icon={Star}
        />
        <StatCard
          title="Course Unlocks (30d)"
          value={totals.unlocks30d}
          icon={CreditCard}
        />
        <StatCard
          title="Revenue (30d)"
          value={`$${totals.revenue30d.toFixed(2)}`}
          icon={DollarSign}
          subtitle={`$${totals.revenueTotal.toFixed(2)} all time`}
        />
        <StatCard
          title="Real (non-test) recent"
          value={totals.realSignupsInRecent}
          icon={Shield}
          subtitle="of last 25 signups"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signups per day (last {data.rangeDays} days)</CardTitle>
        </CardHeader>
        <CardContent>
          {signupsByDay.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center" data-testid="text-no-signups-chart">
              No signups in this range yet.
            </div>
          ) : (
            <div className="h-64" data-testid="chart-signups">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupsByDay}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: 4,
                      color: "#fff",
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#E2741B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent signups (real)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {realRecent.length === 0 ? (
              <div className="text-sm text-gray-400 py-4" data-testid="text-no-real-signups">
                No real signups yet. Start sharing the site to bring traffic in.
              </div>
            ) : (
              realRecent.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 p-2 rounded-md border border-[#333]"
                  data-testid={`row-real-signup-${u.id}`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.firstName || u.lastName ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : (u.email || u.id)}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{u.email}</div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test / seed accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {testRecent.length === 0 ? (
              <div className="text-sm text-gray-400 py-4">No test accounts in recent signups.</div>
            ) : (
              testRecent.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 p-2 rounded-md border border-[#333] opacity-70"
                  data-testid={`row-test-signup-${u.id}`}
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      {u.email || u.id}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {u.firstName} {u.lastName}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">test</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top features used (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {topFeatures.length === 0 ? (
            <div className="text-sm text-gray-400 py-4">No feature usage logged yet.</div>
          ) : (
            <div className="space-y-2">
              {topFeatures.map((f) => (
                <div
                  key={f.feature}
                  className="flex items-center justify-between gap-4 p-2 rounded-md border border-[#333]"
                  data-testid={`row-feature-${f.feature}`}
                >
                  <span className="text-sm truncate">{f.feature}</span>
                  <span className="text-sm font-medium tabular-nums">{f.uses.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

function LeadsTab() {
  const { toast } = useToast();
  const partnerQuery = useQuery<any[]>({ queryKey: ["/api/admin/partners/inquiries"] });
  const waitlistQuery = useQuery<any[]>({ queryKey: ["/api/admin/squad-waitlist"] });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/partners/inquiries/${id}/status`, { status });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/partners/inquiries"] }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  return (
    <div className="space-y-8">
      {/* Partner Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Partner Inquiries
            <Badge variant="secondary" className="ml-auto">{partnerQuery.data?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnerQuery.isLoading ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !partnerQuery.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No partner inquiries yet.</p>
          ) : (
            <div className="space-y-3">
              {partnerQuery.data.map((row: any) => (
                <div key={row.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{row.name} — {row.facility}</p>
                      <p className="text-xs text-muted-foreground">{row.email} {row.role ? `· ${row.role}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {row.partnership_type && <Badge variant="outline" className="text-xs">{row.partnership_type}</Badge>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] ?? STATUS_COLORS.new}`}>{row.status}</span>
                      {["new","contacted","active","closed"].map((s) => (
                        <button
                          key={s}
                          onClick={() => statusMut.mutate({ id: row.id, status: s })}
                          disabled={row.status === s || statusMut.isPending}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${row.status === s ? "bg-muted text-muted-foreground border-transparent" : "hover:bg-muted border-border"}`}
                          data-testid={`button-status-${row.id}-${s}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                  {row.message && <p className="text-xs text-muted-foreground leading-relaxed border-t pt-2 mt-2">{row.message}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Squad Waitlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Squad Waitlist
            <Badge variant="secondary" className="ml-auto">{waitlistQuery.data?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitlistQuery.isLoading ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !waitlistQuery.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No waitlist signups yet.</p>
          ) : (
            <div className="divide-y">
              {waitlistQuery.data.map((row: any) => (
                <div key={row.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{row.name || <span className="text-muted-foreground italic">unnamed</span>}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {row.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{new Date(row.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const limit = 20;

  const statsQuery = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const revenueQuery = useQuery<RevenueData>({
    queryKey: ["/api/admin/revenue"],
  });

  const subscriptionQuery = useQuery<SubscriptionData>({
    queryKey: ["/api/admin/subscriptions"],
  });

  const creditAnalyticsQuery = useQuery<CreditAnalytics>({
    queryKey: ["/api/admin/credits-analytics"],
  });

  const usersQuery = useQuery<{ users: UserWithCredits[]; total: number }>({
    queryKey: ["/api/admin/users", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (search) params.set("search", search);
      const response = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/credits-analytics"] });
  };

  const totalPages = usersQuery.data ? Math.ceil(usersQuery.data.total / limit) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#E2741B]" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="credits" data-testid="tab-credits">Credits</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="spotlight" data-testid="tab-spotlight">Spotlight</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="spotlight" className="space-y-6">
            <SpotlightAdminPanel />
            <SpotlightNominationsPanel />
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <BadgesAdminPanel />
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <LeadsTab />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {statsQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-24" />
                  </Card>
                ))}
              </div>
            ) : statsQuery.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={statsQuery.data.users.total}
                  icon={Users}
                  subtitle={`${statsQuery.data.users.recentSignups} in last 30 days`}
                />
                <StatCard
                  title="Admin Users"
                  value={statsQuery.data.users.byRole.admin || 0}
                  icon={Shield}
                />
                <StatCard
                  title="Credits in Circulation"
                  value={statsQuery.data.credits.totalBalance + statsQuery.data.credits.totalBonusCredits}
                  icon={CreditCard}
                />
                <StatCard
                  title="Usage (24h)"
                  value={statsQuery.data.usage.last24Hours.events}
                  icon={TrendingUp}
                  subtitle={`${statsQuery.data.usage.last24Hours.creditsUsed.toLocaleString()} credits used`}
                />
              </div>
            ) : null}

            {revenueQuery.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(revenueQuery.data.metrics.totalRevenue)}
                  icon={DollarSign}
                  subtitle="This period"
                />
                <StatCard
                  title="MRR"
                  value={formatCurrency(revenueQuery.data.metrics.mrr)}
                  icon={Repeat}
                  subtitle="Monthly recurring"
                />
                <StatCard
                  title="Active Subscriptions"
                  value={subscriptionQuery.data?.activeSubscriptions || 0}
                  icon={Users}
                  subtitle={`${subscriptionQuery.data?.newThisMonth || 0} new this month`}
                />
                <StatCard
                  title="Transactions"
                  value={revenueQuery.data.metrics.transactionCount}
                  icon={BarChart3}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {revenueQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : revenueQuery.data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(revenueQuery.data.metrics.totalRevenue)}
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Subscription Revenue"
                    value={formatCurrency(revenueQuery.data.metrics.subscriptionRevenue)}
                    icon={Repeat}
                  />
                  <StatCard
                    title="Marketplace Sales"
                    value={formatCurrency(revenueQuery.data.metrics.marketplaceSales)}
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Platform Fees (15%)"
                    value={formatCurrency(revenueQuery.data.metrics.platformFees)}
                    icon={ArrowUpRight}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {revenueQuery.data.recentEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No transactions yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {revenueQuery.data.recentEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4">
                            <div>
                              <div className="font-medium text-sm">
                                {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </div>
                              <div className="text-xs text-gray-400">
                                {event.tierName || event.productType || 'N/A'} - {new Date(event.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={event.status === 'succeeded' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                              <span className="font-mono font-medium">
                                {formatCurrency(event.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {subscriptionQuery.data && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-[#1a1a1a]/50 rounded-lg">
                          <div className="text-2xl font-bold">{subscriptionQuery.data.activeSubscriptions}</div>
                          <div className="text-sm text-gray-400">Active</div>
                        </div>
                        <div className="text-center p-4 bg-[#1a1a1a]/50 rounded-lg">
                          <div className="text-2xl font-bold text-[#E2741B]">{subscriptionQuery.data.newThisMonth}</div>
                          <div className="text-sm text-gray-400">New This Month</div>
                        </div>
                        <div className="text-center p-4 bg-[#1a1a1a]/50 rounded-lg">
                          <div className="text-2xl font-bold text-red-500">{subscriptionQuery.data.churned}</div>
                          <div className="text-sm text-gray-400">Churned</div>
                        </div>
                        <div className="text-center p-4 bg-[#1a1a1a]/50 rounded-lg">
                          <div className="text-2xl font-bold">{subscriptionQuery.data.churnRate}%</div>
                          <div className="text-sm text-gray-400">Churn Rate</div>
                        </div>
                      </div>
                      {Object.keys(subscriptionQuery.data.byTier).length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-3">By Tier</h4>
                          <div className="space-y-2">
                            {Object.entries(subscriptionQuery.data.byTier).map(([tier, count]) => (
                              <div key={tier} className="flex items-center justify-between">
                                <span className="text-sm">{tier}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            {creditAnalyticsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : creditAnalyticsQuery.data ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Credits Granted"
                    value={creditAnalyticsQuery.data.totalCreditsGranted.toLocaleString()}
                    icon={ArrowUpRight}
                    subtitle="This period"
                  />
                  <StatCard
                    title="Credits Used"
                    value={creditAnalyticsQuery.data.totalCreditsUsed.toLocaleString()}
                    icon={ArrowDownRight}
                    subtitle="This period"
                  />
                  <StatCard
                    title="Net Flow"
                    value={creditAnalyticsQuery.data.netCreditFlow.toLocaleString()}
                    icon={BarChart3}
                    subtitle={creditAnalyticsQuery.data.netCreditFlow >= 0 ? 'Positive' : 'Negative'}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Features by Credit Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creditAnalyticsQuery.data.topFeatures.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No usage data yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {creditAnalyticsQuery.data.topFeatures.map((item, idx) => {
                          const maxCredits = creditAnalyticsQuery.data!.topFeatures[0]?.credits || 1;
                          const percentage = (item.credits / maxCredits) * 100;
                          return (
                            <div key={item.feature} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                <span className="font-mono">{item.credits.toLocaleString()}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {Object.keys(creditAnalyticsQuery.data.byStudio).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage by Studio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.entries(creditAnalyticsQuery.data.byStudio).map(([studio, credits]) => (
                          <div key={studio} className="text-center p-4 bg-[#1a1a1a]/50 rounded-lg">
                            <div className="text-lg font-bold">{credits.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">{studio}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle>User Management</CardTitle>
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by email or name..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                      className="pl-10"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : usersQuery.data?.users.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No users found
                  </div>
                ) : (
                  <div>
                    {usersQuery.data?.users.map((user) => (
                      <UserRow key={user.id} user={user} onUpdate={handleRefresh} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-400">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
