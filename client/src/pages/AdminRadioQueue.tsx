import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Music, Check, X, Clock, ShieldAlert, Radio as RadioIcon, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Mirror of SasquatchRadio.tsx SEED_CATALOG (id + display metadata only).
// Kept in this admin file so the admin chunk doesn't pull in the full
// 17-track audio bundle. If you add a new seed track to the radio page,
// add a matching row here so admins can mint its DJ intro.
const SEED_TRACKS_FOR_DJ: Array<{ id: string; title: string; artist: string; vibe: string }> = [
  { id: "stroked-out-but-not-done", title: "Stroked-Out (But Not Done)", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "fault-line-icu", title: "Fault Line (ICU)", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "white-coats", title: "White Coats", artist: "Stroked-Out Sasquatch", vibe: "Hip-Hop Fight Song" },
  { id: "wheeled-out-discharge", title: "Wheeled Out (Discharge)", artist: "Stroked-Out Sasquatch", vibe: "Country Grit" },
  { id: "handicrap", title: "Handicrap", artist: "Stroked-Out Sasquatch", vibe: "Hip-Hop Fight Song" },
  { id: "maximum-benefit", title: "Maximum Benefit", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "wheelchair-warrior", title: "Wheelchair Warrior", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "sixty-six-days", title: "66 Days", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "hostile-construction", title: "Hostile Construction", artist: "Stroked-Out Sasquatch", vibe: "Hip-Hop Fight Song" },
  { id: "the-vanguard", title: "The Vanguard", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "phantom-limb", title: "Phantom Limb", artist: "Stroked-Out Sasquatch", vibe: "Lo-Fi" },
  { id: "the-promise", title: "The Promise", artist: "Stroked-Out Sasquatch", vibe: "Gospel" },
  { id: "i-am-the-architect", title: "I Am the Architect", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "blacking-out", title: "Blacking Out", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "squatchy", title: "Squatchy", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "stand-up", title: "Stand Up!", artist: "Stroked-Out Sasquatch", vibe: "Rock Anthem" },
  { id: "ding-now-fight", title: "Ding — Now Fight", artist: "Stroked-Out Sasquatch", vibe: "Hip-Hop Fight Song" },
];

interface DjIntroRow {
  id: number;
  trackId: string;
  trackTitle: string;
  trackArtist: string | null;
  trackKind: string;
  voiceId: string;
  script: string;
  createdAt: string;
}

interface QueueItem {
  id: number;
  userId: string;
  title: string;
  artistName: string | null;
  broadcastVibe: string | null;
  scriptData: any;
  audioUrl: string | null;
  durationMs: number | null;
  broadcastStatus: "none" | "pending" | "approved" | "rejected";
  broadcastSubmittedAt: string | null;
  broadcastRejectionReason: string | null;
}

const STATUS_FILTERS: Array<{ key: "pending" | "approved" | "rejected" | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function AdminRadioQueue() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const queueQuery = useQuery<{ items: QueueItem[] }>({
    queryKey: ["/api/admin/radio/queue"],
  });

  const items = (queueQuery.data?.items ?? []).filter((i) =>
    filter === "all" ? true : i.broadcastStatus === filter,
  );

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: number; action: "approve" | "reject"; reason?: string }) => {
      const r = await apiRequest("POST", `/api/admin/radio/queue/${id}`, { action, reason });
      return r.json();
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.action === "approve" ? "Approved for broadcast" : "Rejected",
        description: vars.action === "approve" ? "Track will appear in radio rotation." : "Survivor will see the rejection reason.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/radio/queue"] });
    },
    onError: (e: any) => {
      toast({ title: "Review failed", description: e?.message ?? "Try again", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-[#E2741B] mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Admin · Curation</span>
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-radio-title">Sasquatch Radio Queue</h1>
          <p className="text-white/60 mt-1">
            Survivor-submitted anthems awaiting broadcast review. Approving sends the track to the public rotation at <code className="text-[#E2741B]">/recovery/radio</code>.
          </p>
        </header>

        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? "bg-[#E2741B] text-black hover:bg-[#E2741B]/90" : ""}
              data-testid={`button-filter-${f.key}`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {queueQuery.isLoading && (
          <div className="text-white/60 text-center py-12">Loading queue…</div>
        )}

        {!queueQuery.isLoading && items.length === 0 && (
          <Card className="bg-[#1a1a1a] border-white/10 p-12 text-center">
            <Music className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <div className="text-white/70">Nothing in this bucket yet.</div>
          </Card>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <QueueRow key={item.id} item={item} onReview={(action, reason) => reviewMutation.mutate({ id: item.id, action, reason })} pending={reviewMutation.isPending} />
          ))}
        </div>

        {/* ── Coach Sasquatch DJ intros ────────────────────────── */}
        <DjIntroSection approvedTracks={(queueQuery.data?.items ?? []).filter((i) => i.broadcastStatus === "approved")} />
      </div>
    </div>
  );
}

function DjIntroSection({ approvedTracks }: { approvedTracks: QueueItem[] }) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const introsQuery = useQuery<{ intros: DjIntroRow[] }>({
    queryKey: ["/api/admin/radio/dj/intros"],
  });

  const introByTrack = new Map<string, DjIntroRow>();
  for (const r of introsQuery.data?.intros ?? []) introByTrack.set(r.trackId, r);

  const mintMutation = useMutation({
    mutationFn: async (body: {
      trackId: string;
      trackTitle: string;
      trackArtist: string;
      trackKind: "seed" | "survivor";
      vibe?: string;
    }) => {
      const r = await apiRequest("POST", "/api/admin/radio/dj/intro", body);
      return r.json();
    },
    onSuccess: (_d, vars) => {
      toast({ title: "Intro minted", description: `Coach DJ recorded the intro for "${vars.trackTitle}".` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/radio/dj/intros"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/radio/dj/intros"] });
    },
    onError: (e: any) => {
      toast({ title: "Mint failed", description: e?.message ?? "ElevenLabs error — try again", variant: "destructive" });
    },
    onSettled: () => setPendingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const r = await apiRequest("DELETE", `/api/admin/radio/dj/intro/${encodeURIComponent(trackId)}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Intro deleted", description: "It will be regenerated next time you mint." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/radio/dj/intros"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/radio/dj/intros"] });
    },
  });

  const allTracks: Array<{ id: string; title: string; artist: string; vibe: string; kind: "seed" | "survivor" }> = [
    ...SEED_TRACKS_FOR_DJ.map((t) => ({ ...t, kind: "seed" as const })),
    // Must match the id format the radio page sees from
    // /api/recovery/radio/tracks → `anthem-${anthem.id}` (see
    // server/recoveryAnthemRoutes.ts). Using a different prefix here
    // would silently mint intros that the player never looks up.
    ...approvedTracks.map((t) => ({
      id: `anthem-${t.id}`,
      title: t.title,
      artist: t.artistName ?? "Survivor",
      vibe: t.broadcastVibe ?? "",
      kind: "survivor" as const,
    })),
  ];

  return (
    <section className="mt-12 pt-8 border-t border-white/10">
      <div className="flex items-center gap-2 text-[#E2741B] mb-1">
        <RadioIcon className="w-4 h-4" />
        <span className="text-sm font-semibold uppercase tracking-wider">Coach Sasquatch DJ</span>
      </div>
      <h2 className="text-2xl font-bold mb-1" data-testid="text-dj-section-title">Between-Track Intros</h2>
      <p className="text-white/60 text-sm mb-5 max-w-2xl">
        Mint a short ElevenLabs intro for each track so the radio plays a Coach Sasquatch DJ voice between songs when listeners turn on DJ Mode. Distinct voice from Nick's coach persona — protects the brand voice.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allTracks.map((t) => {
          const intro = introByTrack.get(t.id);
          const busy = pendingId === t.id && mintMutation.isPending;
          return (
            <Card key={t.id} className="bg-[#1a1a1a] border-white/10 p-4" data-testid={`card-dj-${t.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{t.title}</div>
                  <div className="text-xs text-white/60 truncate">
                    {t.artist}{t.vibe ? ` · ${t.vibe}` : ""}
                  </div>
                </div>
                {intro ? (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/40">
                    <Check className="w-3 h-3 mr-1" />Minted
                  </Badge>
                ) : (
                  <Badge className="bg-white/10 text-white/60 border-0">No intro</Badge>
                )}
              </div>

              {intro && (
                <div className="text-xs text-white/60 italic mb-2 line-clamp-2">"{intro.script}"</div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPendingId(t.id);
                    mintMutation.mutate({
                      trackId: t.id,
                      trackTitle: t.title,
                      trackArtist: t.artist,
                      trackKind: t.kind,
                      vibe: t.vibe || undefined,
                    });
                  }}
                  disabled={busy || mintMutation.isPending}
                  className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-black"
                  data-testid={`button-mint-${t.id}`}
                >
                  {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RadioIcon className="w-4 h-4 mr-1" />}
                  {intro ? "Re-mint" : "Mint intro"}
                </Button>
                {intro && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(t.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${t.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function QueueRow({ item, onReview, pending }: { item: QueueItem; onReview: (action: "approve" | "reject", reason?: string) => void; pending: boolean }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const statusBadge = {
    pending: <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
    approved: <Badge className="bg-green-500/20 text-green-300 border border-green-500/40"><Check className="w-3 h-3 mr-1" />Approved</Badge>,
    rejected: <Badge className="bg-red-500/20 text-red-300 border border-red-500/40"><X className="w-3 h-3 mr-1" />Rejected</Badge>,
    none: <Badge className="bg-white/10 text-white/70 border-0">Withdrawn</Badge>,
  }[item.broadcastStatus];

  const script = item.scriptData ?? {};

  return (
    <Card className="bg-[#1a1a1a] border-white/10 p-5" data-testid={`card-queue-item-${item.id}`}>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-white truncate">{item.title}</h3>
            {statusBadge}
          </div>
          <div className="text-sm text-white/60">
            by <span className="text-white/80">{item.artistName ?? "(no artist name)"}</span>
            {(item.broadcastVibe ?? script.vibe) && (
              <> · <span className="text-[#E2741B]">{item.broadcastVibe ?? script.vibe}</span></>
            )}
          </div>
          {item.broadcastSubmittedAt && (
            <div className="text-xs text-white/40 mt-1">
              Submitted {new Date(item.broadcastSubmittedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {item.audioUrl && (
        <audio
          src={item.audioUrl}
          controls
          className="w-full mb-3"
          preload="none"
          data-testid={`audio-queue-${item.id}`}
        />
      )}

      {script.tagline && (
        <div className="text-sm text-white/70 mb-3 italic">"{script.tagline}"</div>
      )}

      {item.broadcastStatus === "rejected" && item.broadcastRejectionReason && (
        <div className="text-sm text-red-300 mb-3 p-2 rounded bg-red-500/10 border border-red-500/30">
          Rejection reason: {item.broadcastRejectionReason}
        </div>
      )}

      {item.broadcastStatus === "pending" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => onReview("approve")}
            disabled={pending}
            className="bg-green-600 hover:bg-green-500 text-white"
            data-testid={`button-approve-${item.id}`}
          >
            <Check className="w-4 h-4 mr-1" />Approve for broadcast
          </Button>
          {!showReject && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReject(true)}
              disabled={pending}
              data-testid={`button-show-reject-${item.id}`}
            >
              <X className="w-4 h-4 mr-1" />Reject
            </Button>
          )}
        </div>
      )}

      {item.broadcastStatus === "pending" && showReject && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shared with survivor — be kind, be specific)"
            maxLength={500}
            data-testid={`input-reject-reason-${item.id}`}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onReview("reject", reason.trim() || undefined);
                setShowReject(false);
                setReason("");
              }}
              disabled={pending}
              data-testid={`button-confirm-reject-${item.id}`}
            >
              Confirm reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
