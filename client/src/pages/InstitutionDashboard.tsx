import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoverySEO from "@/components/RecoverySEO";
import {
  Loader2, Building2, Users, Activity, Flame, TrendingUp, ShieldAlert,
  UserPlus, Trash2, Mail, Copy, Check, CreditCard, FileText, ExternalLink,
} from "lucide-react";

const ACCENT = "#E2741B";

interface Membership {
  orgId: number; orgName: string; orgType: string; role: string;
  shareLevel: string; joinedAt: string | null;
}
interface Seats { limit: number; used: number; available: number; }
interface Dashboard {
  suppressed: boolean; minCohort?: number; consentedCount: number; totalActive: number;
  seats: Seats;
  engagement?: { active7d: number; active30d: number; active7dRate: number | null };
  activation?: { activated: number; activationRate: number | null };
  consistency?: { avgCurrentStreak: number; maxLongestStreak: number; totalActiveDays: number };
  outcomeTrend?: { assessedCount: number; physical: number | null; cognitive: number | null; speech: number | null; emotional: number | null; memory: number | null };
  reps?: { actions30d: number; totalReps30d: number };
}
interface RosterRow {
  memberId: number; status: string; invitedEmail: string | null; inviteToken: string | null;
  name: string | null; shareLevel: string | null; joinedAt: string | null; invitedAt: string | null;
}
interface IdentifiedRow {
  userId: string; name: string; email: string; currentStreak: number; longestStreak: number;
  lastActivityDate: string | null; checkinCount: number; intakeCompleted: boolean;
}

function pct(v: number | null | undefined) {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-5" data-testid={`stat-${label.replace(/\s/g, "-").toLowerCase()}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">{label}</span>
      </div>
      <div className="text-2xl font-bold text-[#1C1917]">{value}</div>
      {sub && <div className="text-xs text-[#78716C] mt-1">{sub}</div>}
    </div>
  );
}

function InviteBox({ orgId }: { orgId: number }) {
  const { toast } = useToast();
  const [emails, setEmails] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
      const res = await apiRequest("POST", `/api/institutions/org/${orgId}/invite`, { emails: list });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId, "roster"] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId] });
      const n = data?.invited?.length ?? 0;
      const skipped = data?.skipped?.length ?? 0;
      toast({ title: `Invited ${n}`, description: skipped ? `${skipped} skipped (already on roster or over seat limit).` : "Activation links emailed." });
      setEmails("");
    },
    onError: (e: any) => toast({ title: "Couldn't invite", description: e?.message, variant: "destructive" }),
  });
  return (
    <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-5">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-4 h-4" style={{ color: ACCENT }} />
        <h3 className="font-semibold text-[#1C1917]">Onboard survivors</h3>
      </div>
      <p className="text-sm text-[#5C534D] mb-3">Paste a discharge list — emails separated by commas, spaces, or new lines. Each gets a private activation link.</p>
      <textarea
        className="w-full rounded-md border border-[#E2C2A4]/60 px-3 py-2.5 text-[#1C1917] focus:outline-none focus:ring-2 resize-none text-sm"
        style={{ ["--tw-ring-color" as any]: ACCENT }}
        rows={3}
        placeholder="survivor1@email.com, survivor2@email.com"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        data-testid="input-bulk-emails"
      />
      <Button
        className="mt-3 text-white border"
        style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
        disabled={!emails.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
        data-testid="button-send-invites"
      >
        {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="mr-2 h-4 w-4" /> Send invites</>}
      </Button>
    </div>
  );
}

interface Invoice {
  id: string; number: string | null; status: string; amountDueCents: number;
  amountPaidCents: number; currency: string; created: string | null;
  hostedInvoiceUrl: string | null; invoicePdf: string | null;
}
interface BillingData {
  billingStatus: string; hasSubscription: boolean; seatLimit: number; seatsUsed: number;
  perSeatCents: number;
  subscription: {
    id: string; status: string; quantity: number; perSeatCents: number;
    monthlyTotalCents: number; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
  } | null;
  invoices: Invoice[];
}

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format((cents ?? 0) / 100);
}

function BillingBox({ orgId, seatsUsed }: { orgId: number; seatsUsed: number }) {
  const { toast } = useToast();
  const { data: billing, isLoading } = useQuery<BillingData>({ queryKey: ["/api/institutions/org", orgId, "billing"] });
  const [seats, setSeats] = useState<string>("");

  const checkoutMutation = useMutation({
    mutationFn: async (n: number) => {
      const res = await apiRequest("POST", `/api/institutions/org/${orgId}/billing/checkout`, { seats: n });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.url) { window.location.href = data.url; return; }
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId, "billing"] });
      toast({ title: "Billing updated" });
    },
    onError: (e: any) => toast({ title: "Couldn't start billing", description: e?.message, variant: "destructive" }),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/institutions/org/${orgId}/billing/portal`, {});
      return res.json();
    },
    onSuccess: (data: any) => { if (data?.url) window.location.href = data.url; },
    onError: (e: any) => toast({ title: "Couldn't open billing", description: e?.message, variant: "destructive" }),
  });

  const sub = billing?.subscription;
  const defaultSeats = String(billing?.seatLimit || Math.max(1, seatsUsed) || 1);
  const seatVal = seats === "" ? defaultSeats : seats;
  const perSeat = billing?.perSeatCents ?? 1200;

  return (
    <div className="mt-6 bg-white rounded-md border border-[#E2C2A4]/40 p-5" data-testid={`billing-${orgId}`}>
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-4 h-4" style={{ color: ACCENT }} />
        <h3 className="font-semibold text-[#1C1917]">Billing & seats</h3>
      </div>
      {isLoading ? (
        <div className="text-[#78716C] text-sm py-4"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>
      ) : (
        <>
          <p className="text-sm text-[#5C534D] mb-4">
            {money(perSeat)}/survivor seat per month, billed to your organization. You currently use {seatsUsed} of {billing?.seatLimit ?? 0} seats.
          </p>

          {sub ? (
            <div className="rounded-md border border-[#E2C2A4]/50 p-4 mb-4" style={{ backgroundColor: "rgba(226,116,27,0.05)" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-[#1C1917] capitalize" data-testid={`billing-status-${orgId}`}>
                    {sub.status.replace(/_/g, " ")}{sub.cancelAtPeriodEnd ? " · ending" : ""}
                  </p>
                  <p className="text-xs text-[#78716C]">
                    {sub.quantity} seats × {money(sub.perSeatCents)} = <strong>{money(sub.monthlyTotalCents)}/mo</strong>
                    {sub.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Seats to purchase</label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  min={1}
                  className="w-28 rounded-md border border-[#E2C2A4]/60 px-3 py-2 text-[#1C1917] focus:outline-none focus:ring-2 text-sm"
                  style={{ ["--tw-ring-color" as any]: ACCENT }}
                  value={seatVal}
                  onChange={(e) => setSeats(e.target.value)}
                  data-testid={`input-seats-${orgId}`}
                />
                <span className="text-sm text-[#78716C]">× {money(perSeat)} = <strong>{money((Number(seatVal) || 0) * perSeat)}/mo</strong></span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {sub ? (
              <>
                <Button
                  className="text-white border"
                  style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                  disabled={portalMutation.isPending}
                  onClick={() => portalMutation.mutate()}
                  data-testid={`button-manage-billing-${orgId}`}
                >
                  {portalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage billing & invoices
                </Button>
                <Button
                  variant="outline"
                  disabled={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate(Number(seatVal) || sub.quantity)}
                  data-testid={`button-adjust-seats-${orgId}`}
                >
                  Change seat count
                </Button>
              </>
            ) : (
              <Button
                className="text-white border"
                style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                disabled={checkoutMutation.isPending || !(Number(seatVal) > 0)}
                onClick={() => checkoutMutation.mutate(Number(seatVal))}
                data-testid={`button-subscribe-${orgId}`}
              >
                {checkoutMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</> : <><CreditCard className="mr-2 h-4 w-4" /> Subscribe & pay</>}
              </Button>
            )}
          </div>

          {billing?.invoices && billing.invoices.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C] mb-2">Invoices & receipts</p>
              <div className="rounded-md border border-[#E2C2A4]/40 divide-y divide-[#E2C2A4]/30">
                {billing.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 p-3 flex-wrap" data-testid={`invoice-${inv.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#78716C] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-[#1C1917] truncate">{inv.number || inv.id}</p>
                        <p className="text-xs text-[#78716C]">
                          {inv.created ? new Date(inv.created).toLocaleDateString() : ""} · <span className="capitalize">{inv.status}</span> · {money(inv.amountPaidCents || inv.amountDueCents, inv.currency)}
                        </p>
                      </div>
                    </div>
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer" data-testid={`link-invoice-${inv.id}`}>
                        <Button size="sm" variant="outline"><ExternalLink className="w-3.5 h-3.5" /><span className="ml-1.5">View</span></Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrgPanel({ m }: { m: Membership }) {
  const orgId = m.orgId;
  const { toast } = useToast();
  const [copied, setCopied] = useState<number | null>(null);

  const { data: org } = useQuery<{ name: string; seats: Seats; role: string }>({ queryKey: ["/api/institutions/org", orgId] });
  const { data: dash, isLoading: dashLoading } = useQuery<Dashboard>({ queryKey: ["/api/institutions/org", orgId, "dashboard"] });
  const { data: roster } = useQuery<RosterRow[]>({ queryKey: ["/api/institutions/org", orgId, "roster"] });
  const { data: identified } = useQuery<IdentifiedRow[]>({ queryKey: ["/api/institutions/org", orgId, "identified"] });

  const removeMutation = useMutation({
    mutationFn: async (memberId: number) => apiRequest("DELETE", `/api/institutions/org/${orgId}/member/${memberId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId, "roster"] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/org", orgId, "identified"] });
      toast({ title: "Seat freed" });
    },
    onError: () => toast({ title: "Couldn't remove", variant: "destructive" }),
  });

  const seats = org?.seats ?? dash?.seats;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(226,116,27,0.12)" }}>
          <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-[#1C1917]" data-testid={`text-org-${orgId}`}>{m.orgName}</h2>
          <p className="text-sm text-[#78716C] capitalize">{m.role} · {m.orgType?.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Seats */}
      {seats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat icon={Users} label="Seats used" value={`${seats.used} / ${seats.limit}`} sub={`${seats.available} available`} />
          <Stat icon={Users} label="Active survivors" value={String(dash?.totalActive ?? 0)} />
          <Stat icon={ShieldAlert} label="Sharing consent" value={String(dash?.consentedCount ?? 0)} sub="opted into aggregate+" />
          <Stat icon={Activity} label="Active last 7d" value={String(dash?.engagement?.active7d ?? 0)} sub={pct(dash?.engagement?.active7dRate)} />
        </div>
      )}

      <InviteBox orgId={orgId} />

      {/* Billing — owner only */}
      {m.role === "owner" && <BillingBox orgId={orgId} seatsUsed={seats?.used ?? 0} />}

      {/* Cohort metrics */}
      <div className="mt-6">
        <h3 className="font-semibold text-[#1C1917] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: ACCENT }} /> Cohort engagement (de-identified)</h3>
        {dashLoading && <div className="text-[#78716C] text-sm py-6"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…</div>}
        {!dashLoading && dash?.suppressed && (
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-6 text-center" data-testid="dashboard-suppressed">
            <ShieldAlert className="w-6 h-6 mx-auto mb-2" style={{ color: ACCENT }} />
            <p className="text-[#1C1917] font-semibold mb-1">Not enough consented survivors yet</p>
            <p className="text-[#5C534D] text-sm">
              We suppress cohort stats until at least {dash.minCohort ?? 3} survivors opt into sharing — so no individual can be re-identified.
              {" "}{dash.consentedCount} of {dash.totalActive} active survivors have opted in.
            </p>
          </div>
        )}
        {!dashLoading && dash && !dash.suppressed && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Stat icon={Activity} label="Active 30d" value={String(dash.engagement?.active30d ?? 0)} />
              <Stat icon={Check} label="Activation" value={pct(dash.activation?.activationRate)} sub={`${dash.activation?.activated ?? 0} activated`} />
              <Stat icon={Flame} label="Avg streak" value={String(dash.consistency?.avgCurrentStreak ?? 0)} sub={`max ${dash.consistency?.maxLongestStreak ?? 0}`} />
              <Stat icon={TrendingUp} label="Reps (30d)" value={String(dash.reps?.totalReps30d ?? 0)} sub={`${dash.reps?.actions30d ?? 0} actions`} />
            </div>
            {dash.outcomeTrend && dash.outcomeTrend.assessedCount > 0 && (
              <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C] mb-3">
                  Self-reported outcome trend — cohort avg ({dash.outcomeTrend.assessedCount} assessed). Self-assessment, not clinical.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(["physical", "cognitive", "speech", "emotional", "memory"] as const).map((k) => (
                    <div key={k} className="text-center">
                      <div className="text-xl font-bold text-[#1C1917]">{dash.outcomeTrend?.[k] ?? "—"}</div>
                      <div className="text-xs text-[#78716C] capitalize">{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Identified members (opt-in only) */}
      {identified && identified.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-[#1C1917] mb-3">Survivors who opted into identified sharing</h3>
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 divide-y divide-[#E2C2A4]/30">
            {identified.map((s) => (
              <div key={s.userId} className="flex items-center justify-between gap-4 p-4 flex-wrap" data-testid={`identified-${s.userId}`}>
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm">{s.name}</p>
                  <p className="text-xs text-[#78716C]">{s.email}</p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span className="text-[#5C534D]"><Flame className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />{s.currentStreak}d</span>
                  <span className="text-[#5C534D]">{s.checkinCount} check-ins</span>
                  <span className="text-[#78716C] text-xs">{s.lastActivityDate ? `active ${s.lastActivityDate}` : "no activity"}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#78716C] mt-2">Engagement summary only. Raw journals, medical logs, and flicker logs are never shown.</p>
        </div>
      )}

      {/* Roster / seat management */}
      {roster && roster.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-[#1C1917] mb-3">Roster & seats</h3>
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 divide-y divide-[#E2C2A4]/30">
            {roster.map((r) => (
              <div key={r.memberId} className="flex items-center justify-between gap-4 p-4 flex-wrap" data-testid={`roster-${r.memberId}`}>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1C1917] text-sm truncate">{r.name || r.invitedEmail || "Pending survivor"}</p>
                  <p className="text-xs text-[#78716C]">
                    <span className="capitalize">{r.status}</span>
                    {r.shareLevel && <> · sharing: {r.shareLevel}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "invited" && r.inviteToken && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = `${window.location.origin}/institution/join/${r.inviteToken}`;
                        navigator.clipboard.writeText(link);
                        setCopied(r.memberId);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      data-testid={`button-copy-link-${r.memberId}`}
                    >
                      {copied === r.memberId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="ml-1.5">Link</span>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeMutation.mutate(r.memberId)}
                    disabled={removeMutation.isPending}
                    data-testid={`button-remove-${r.memberId}`}
                  >
                    <Trash2 className="w-4 h-4 text-[#B91C1C]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstitutionDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: memberships, isLoading } = useQuery<Membership[]>({
    queryKey: ["/api/institutions/me/memberships"],
    enabled: isAuthenticated,
  });

  const staffOrgs = (memberships ?? []).filter((m) => m.role === "owner" || m.role === "clinician");

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-12">
      <RecoverySEO title="Institution dashboard — Stroke Recovery Academy" description="Cohort engagement and seat management for your organization." canonical="/institution" noindex />
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[#1C1917] mb-2">Institution dashboard</h1>
        <p className="text-[#5C534D] mb-8">Cohort engagement and seat management. Aggregate by default — no unconsented data.</p>

        {(authLoading || isLoading) && (
          <div className="text-center text-[#78716C] py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" /> Loading…</div>
        )}

        {!isLoading && !authLoading && staffOrgs.length === 0 && (
          <div className="bg-white rounded-md border border-[#E2C2A4]/40 p-8 text-center" data-testid="dashboard-empty">
            <Building2 className="w-8 h-8 mx-auto mb-3 text-[#78716C]" />
            <p className="text-[#1C1917] font-semibold mb-1">No organization yet</p>
            <p className="text-[#5C534D] text-sm">You're not a staff member of any organization. If you run a clinic or discharge program, request access.</p>
            <a href="/white-label" className="inline-block mt-4">
              <Button className="text-white border" style={{ backgroundColor: ACCENT, borderColor: ACCENT }} data-testid="button-request-access">Request institutional access</Button>
            </a>
          </div>
        )}

        {!isLoading && staffOrgs.map((m) => <OrgPanel key={m.orgId} m={m} />)}
      </div>
    </div>
  );
}
