import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Flame, Heart, Share2, ArrowLeft,
  Star, Hammer, Lightbulb, GraduationCap, Compass,
  BookOpen, Sparkles, Trophy, CheckCircle, RefreshCw, Sun
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SendPowerPointsModal from "@/components/SendPowerPointsModal";
import { VerifiedTherapistBadge } from "@/components/VerifiedTherapistBadge";
import DailyGiftButton from "@/components/DailyGiftButton";

const ORANGE = "#E2741B";

interface SurvivorProfile {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  slug: string;
  acceptsPowerPoints: boolean;
  isVerifiedTherapist: boolean;
  therapistTitle: string | null;
  persona_name: string | null;
  persona_creed: string | null;
  persona_accent_color: string | null;
  currentStreak: number;
  totalPoints: number;
  giftCount: number;
}

interface BadgeRow {
  badge_key: string;
  badge_name: string;
  category: string;
  awarded_at: string;
}

interface TierRow {
  tier: string;
  is_legend_awarded: boolean;
}

// ── Badge metadata map ────────────────────────────────────────────────────────
const BADGE_ICONS: Record<string, React.ComponentType<any>> = {
  streak_7: Flame, streak_30: Zap, streak_66: RefreshCw, streak_365: Sun,
  first_log: BookOpen, first_spark: Sparkles, goal_complete: Trophy, consistent_4: CheckCircle,
  forge: Hammer, lighthouse: Lightbulb, teacher: GraduationCap, pioneer: Compass, legend: Star,
};

const TIER_CONFIG = {
  ember:   { label: "Ember",   color: "#F97316", desc: "The fire started." },
  bonfire: { label: "Bonfire", color: "#E2741B", desc: "Others can feel the heat." },
  forge:   { label: "Forge",   color: "#C06B3E", desc: "Something lasting was built here." },
  legend:  { label: "Legend",  color: "#D4AF37", desc: "Nick personally selected." },
};

function TierChip({ tier }: { tier: string }) {
  const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest border"
      style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}15` }}
      data-testid="text-tier"
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function BadgeChip({ badge }: { badge: BadgeRow }) {
  const Icon = BADGE_ICONS[badge.badge_key] ?? Star;
  const isNominated = badge.category === "nominated";
  return (
    <div
      title={badge.badge_name}
      className="flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-colors"
      style={{
        borderColor: isNominated ? `${ORANGE}50` : "#2a2a2a",
        background: isNominated ? `${ORANGE}10` : "#111",
      }}
      data-testid={`badge-${badge.badge_key}`}
    >
      <Icon className="w-5 h-5" style={{ color: isNominated ? ORANGE : "#666" }} />
      <span className="text-[10px] text-center leading-tight text-gray-400 max-w-[60px]">{badge.badge_name}</span>
    </div>
  );
}

export default function SurvivorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [giftOpen, setGiftOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ profile: SurvivorProfile }>({
    queryKey: ["/api/survivors", slug],
    queryFn: async () => {
      const r = await fetch(`/api/survivors/${slug}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  const { data: badgeData } = useQuery<{ badges: BadgeRow[]; tier: TierRow | null }>({
    queryKey: ["/api/survivors", slug, "badges"],
    queryFn: async () => {
      const r = await fetch(`/api/survivors/${slug}/badges`);
      if (!r.ok) return { badges: [], tier: null };
      return r.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D0D0D] text-gray-400 flex items-center justify-center">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border-[#333] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Profile not found</h1>
            <p className="text-gray-400 mb-4">This survivor's profile link may have changed.</p>
            <Button asChild variant="outline" className="border-[#333]">
              <Link href="/recovery/community"><ArrowLeft className="w-4 h-4 mr-2" /> Back to community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = data.profile;
  const isSelf = user?.id === p.id;
  const displayName = p.persona_name || p.displayName;
  const badges = badgeData?.badges ?? [];
  const tierRow = badgeData?.tier ?? null;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${displayName} — Stroke Recovery Academy`, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-[#E2741B]/40 via-[#1a1a1a] to-[#0D0D0D]" />
          <CardContent className="p-6 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-[#1a1a1a] bg-[#2a2a2a]">
                <AvatarImage src={p.profileImageUrl || ""} />
                <AvatarFallback className="bg-[#2a2a2a] text-[#E2741B] text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="text-2xl font-bold truncate"
                    style={{ color: p.persona_name && p.persona_accent_color ? p.persona_accent_color : "#FFFFFF" }}
                    data-testid="text-survivor-name"
                  >
                    {displayName}
                  </h1>
                  {p.isVerifiedTherapist && <VerifiedTherapistBadge title={p.therapistTitle || undefined} />}
                </div>
                {/* Tier chip */}
                {tierRow && <div className="mt-1"><TierChip tier={tierRow.tier} /></div>}
                {p.persona_creed && (
                  <p className="text-sm italic text-gray-400 mt-1 line-clamp-2">"{p.persona_creed}"</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <StatBlock icon={<Zap className="w-4 h-4" />} label="Power Received" value={p.totalPoints.toLocaleString()} />
              <StatBlock icon={<Heart className="w-4 h-4" />} label="Gifts" value={p.giftCount.toLocaleString()} />
              <StatBlock icon={<Flame className="w-4 h-4" />} label="Streak" value={`${p.currentStreak}d`} />
            </div>

            {/* Badge grid */}
            {badges.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-3">Earned badges</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {badges.map(b => <BadgeChip key={b.badge_key} badge={b} />)}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              {p.acceptsPowerPoints && !isSelf && (
                <Button
                  onClick={() => { if (!user) { window.location.href = "/api/login"; return; } setGiftOpen(true); }}
                  className="flex-1 text-white font-bold"
                  style={{ background: ORANGE }}
                  data-testid="button-send-power"
                >
                  <Zap className="w-4 h-4 mr-2" /> Send Power Points
                </Button>
              )}
              {!p.acceptsPowerPoints && !isSelf && (
                <div className="flex-1 text-center text-sm text-gray-500 py-2 rounded-md border border-[#333]">
                  This survivor isn't accepting Power Points right now.
                </div>
              )}
              <Button variant="outline" className="border-[#333]" onClick={handleShare} data-testid="button-share">
                <Share2 className="w-4 h-4 mr-2" /> Share profile
              </Button>
            </div>

            {p.acceptsPowerPoints && !isSelf && user && (
              <div className="mt-3">
                <DailyGiftButton receiverId={p.id} receiverName={displayName} size="default" className="w-full" />
              </div>
            )}

            <p className="text-[11px] text-gray-500 mt-6 leading-snug text-center">
              Power Points fund this survivor's access to therapist courses, AI tools, and exercises. Points are not redeemable for cash.
            </p>
          </CardContent>
        </Card>
      </div>

      <SendPowerPointsModal
        open={giftOpen}
        onOpenChange={setGiftOpen}
        receiverId={p.id}
        receiverName={displayName}
        receiverAvatarUrl={p.profileImageUrl}
      />
    </div>
  );
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#333] bg-[#0D0D0D] p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[#E2741B] mb-1">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
