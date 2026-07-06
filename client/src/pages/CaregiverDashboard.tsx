import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame,
  Activity,
  Calendar,
  Clock,
  Zap,
  Heart,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

interface SurvivorDashboard {
  survivor: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    joinedAt: string;
  };
  metrics: {
    streak: number;
    totalReps: number;
    daysSinceStroke: number | null;
    lastCheckinAt: string | null;
  };
  recentActivity: Array<{
    label: string;
    exerciseMinutes: number;
    winsToday: string | null;
    lastAt: string;
  }>;
  profile: {
    strokeType: string | null;
    affectedSide: string | null;
    deficits: string[] | null;
    dailyTimeBudgetMinutes: number | null;
    energyPattern: string | null;
  } | null;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function fmtExerciseLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function milestoneLabel(days: number | null): string {
  if (!days) return "";
  if (days >= 365) return `Year ${Math.floor(days / 365)}`;
  if (days >= 180) return "6-Month Warrior";
  if (days >= 90) return "90-Day Climber";
  if (days >= 60) return "60-Day Builder";
  if (days >= 30) return "30-Day Fighter";
  if (days >= 14) return "Two-Week Strong";
  if (days >= 7) return "First Week";
  return "Day 1 Courage";
}

export default function CaregiverDashboard() {
  const { survivorId } = useParams<{ survivorId: string }>();

  const { data, isLoading, error } = useQuery<SurvivorDashboard>({
    queryKey: [`/api/caregivers/survivor/${survivorId}/dashboard`],
    enabled: !!survivorId,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">
          Dashboard unavailable — you may not have an active link with this survivor.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/settings/caregivers">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Manage links
          </Link>
        </Button>
      </div>
    );
  }

  const { survivor, metrics, recentActivity, profile } = data;
  const firstName = survivor.firstName ?? "Your survivor";
  const initials =
    `${survivor.firstName?.[0] ?? ""}${survivor.lastName?.[0] ?? ""}`.toUpperCase() || "S";

  const checkedInToday =
    metrics.lastCheckinAt &&
    new Date(metrics.lastCheckinAt).toDateString() === new Date().toDateString();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" data-testid="button-back">
          <Link to="/settings/caregivers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <Avatar className="h-12 w-12">
          <AvatarImage src={survivor.avatarUrl ?? undefined} alt={firstName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-survivor-name">
            {firstName}
            {survivor.lastName ? ` ${survivor.lastName}` : ""}'s Recovery
          </h1>
          {metrics.daysSinceStroke !== null && (
            <p className="text-sm text-muted-foreground">
              Day {metrics.daysSinceStroke} post-stroke — {milestoneLabel(metrics.daysSinceStroke)}
            </p>
          )}
        </div>
      </div>

      {/* Today status banner */}
      <Card className={checkedInToday ? "border-[#C06B3E]/40 bg-[#C06B3E]/5" : ""}>
        <CardContent className="py-4 flex items-center gap-3">
          <Heart
            className={`w-5 h-5 shrink-0 ${checkedInToday ? "text-[#C06B3E]" : "text-muted-foreground"}`}
          />
          <span className="text-sm" data-testid="text-checkin-status">
            {checkedInToday
              ? `${firstName} checked in today.`
              : metrics.lastCheckinAt
              ? `Last check-in: ${fmtRelative(metrics.lastCheckinAt)}`
              : `${firstName} hasn't checked in yet.`}
          </span>
          {checkedInToday && (
            <Badge variant="secondary" className="ml-auto">
              Active today
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2 flex-wrap">
            <Flame className="w-4 h-4 text-[#C06B3E] shrink-0" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NeverZero Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-bold"
              data-testid="text-streak"
            >
              {metrics.streak}
              <span className="text-base font-normal text-muted-foreground ml-1">days</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-[#C06B3E] shrink-0" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reps Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-reps">
              {metrics.totalReps.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {metrics.daysSinceStroke !== null && (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-[#C06B3E] shrink-0" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Days Since Stroke
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="text-days-since-stroke">
                {metrics.daysSinceStroke}
              </p>
            </CardContent>
          </Card>
        )}

        {profile?.dailyTimeBudgetMinutes && (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-[#C06B3E] shrink-0" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Time Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="text-time-budget">
                {profile.dailyTimeBudgetMinutes}
                <span className="text-base font-normal text-muted-foreground ml-1">min</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deficit profile */}
      {profile && (profile.strokeType || profile.affectedSide || (profile.deficits?.length ?? 0) > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 flex-wrap pb-2">
            <Zap className="w-4 h-4 text-[#C06B3E] shrink-0" />
            <CardTitle className="text-sm font-semibold">Recovery Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {profile.strokeType && (
                <Badge variant="outline" data-testid="badge-stroke-type">
                  {profile.strokeType}
                </Badge>
              )}
              {profile.affectedSide && (
                <Badge variant="outline" data-testid="badge-affected-side">
                  {profile.affectedSide} side
                </Badge>
              )}
              {profile.energyPattern && (
                <Badge variant="outline" data-testid="badge-energy">
                  {profile.energyPattern} energy
                </Badge>
              )}
            </div>
            {profile.deficits && profile.deficits.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                  Active deficits
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.deficits.map((d) => (
                    <Badge key={d} className="bg-[#C06B3E]/10 text-[#C06B3E] border-[#C06B3E]/20">
                      {fmtExerciseLabel(d)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4" data-testid="list-recent-activity">
              {recentActivity.map((a, i) => (
                <li
                  key={i}
                  className="space-y-1"
                  data-testid={`activity-row-${i}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.label}</span>
                    {a.exerciseMinutes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {a.exerciseMinutes} min
                      </span>
                    )}
                  </div>
                  {a.winsToday && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {a.winsToday}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {recentActivity.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No exercise activity logged in the past 7 days.
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        This view is shared with you because {firstName} invited you as a caregiver.
        Data refreshes every 5 minutes.
      </p>
    </div>
  );
}
