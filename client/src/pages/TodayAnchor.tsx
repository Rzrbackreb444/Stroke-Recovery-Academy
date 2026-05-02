import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Anchor,
  Flame,
  Trophy,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  Sparkles,
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEO from "@/components/SEO";

interface TodayResponse {
  date: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  checkedInToday: boolean;
  todayAnchor: AnchorRow | null;
  yesterdayAnchor: AnchorRow | null;
}

interface AnchorRow {
  id: number;
  anchorType: "affirmation" | "speech" | "memory";
  inputText: string;
  anchorData: {
    title: string;
    lines: string[];
    callResponse?: { sasquatch: string[]; you: string[] } | null;
    mnemonic?: { facts: string[]; hookStamp: string } | null;
    realityFooter?: string;
  };
  audioUrl: string | null;
  isShared: boolean;
  shareId: string | null;
  createdAt: string;
}

export default function TodayAnchor() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: today, isLoading: loadingToday } = useQuery<TodayResponse>({
    queryKey: ["/api/recovery/anchor/today"],
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: list, isLoading: loadingList } = useQuery<AnchorRow[]>({
    queryKey: ["/api/recovery/anchor/list"],
    enabled: !!user,
    staleTime: 60_000,
  });

  const setToday = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/recovery/anchor/${id}/set-today`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/anchor/today"] });
      toast({ title: "Set as today's anchor", description: "Practice it once and check in tomorrow." });
    },
    onError: (e: any) =>
      toast({ variant: "destructive", title: "Couldn't set today's anchor", description: e?.message }),
  });

  const checkIn = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "remembered" | "struggled" | "forgot" }) => {
      const res = await apiRequest("POST", `/api/recovery/anchor/${id}/check-in`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/anchor/today"] });
      toast({ title: "Got it", description: "Recorded — your anchor is learning you." });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-amber-50 flex flex-col">
        <GlobalHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="bg-zinc-900/60 border-amber-900/30 max-w-md w-full">
            <CardContent className="py-8 text-center space-y-4">
              <Anchor className="h-10 w-10 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-bold text-amber-100">Sign in to view your anchor</h2>
              <Button asChild className="bg-amber-500 hover:bg-amber-400 text-zinc-950">
                <a href="/api/login" data-testid="link-signin-anchor">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-amber-50 flex flex-col">
      <SEO title="Today's Anchor · Stroke Recovery Academy" />
      <GlobalHeader />
      <main className="flex-1">
        <section className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/30 to-[#0D0D0D]">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-2 mb-2 text-amber-400 text-sm">
              <Anchor className="h-4 w-4" />
              <span>Today's Anchor</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-100 mb-3" data-testid="text-today-anchor-title">
              One anchor. One day. Compound it.
            </h1>
            <p className="text-amber-100/70 max-w-2xl">
              Pick a recovery anchor as today's. Listen to it once. Tomorrow, tell us if it stuck.
              Repetition over weeks is what builds the encoding — not any single listen.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <StreakCard today={today} loading={loadingToday} />

          {today?.yesterdayAnchor && !today.checkedInToday && (
            <YesterdayCheckIn
              anchor={today.yesterdayAnchor}
              onCheckIn={(status) => checkIn.mutate({ id: today.yesterdayAnchor!.id, status })}
              pending={checkIn.isPending}
            />
          )}

          {today?.todayAnchor ? (
            <TodayAnchorCard anchor={today.todayAnchor} />
          ) : (
            <Card className="bg-zinc-900/60 border-amber-900/30">
              <CardContent className="py-8 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-amber-400 mx-auto" />
                <h2 className="text-xl font-bold text-amber-100">No anchor for today yet</h2>
                <p className="text-sm text-amber-100/70 max-w-md mx-auto">
                  Render a new one in the Motivation Studio, or pick one of your existing anchors
                  below.
                </p>
                <Button asChild className="bg-amber-500 hover:bg-amber-400 text-zinc-950">
                  <Link href="/recovery/motivation" data-testid="link-go-make-anchor">
                    Make a new anchor <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-bold text-amber-100 mb-3">Your anchors</h3>
            {loadingList ? (
              <p className="text-sm text-amber-100/60">Loading…</p>
            ) : list && list.length > 0 ? (
              <div className="space-y-2">
                {list.map((a) => (
                  <AnchorListRow
                    key={a.id}
                    anchor={a}
                    isToday={today?.todayAnchor?.id === a.id}
                    onSetToday={() => setToday.mutate(a.id)}
                    setting={setToday.isPending}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-100/60">No anchors yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StreakCard({ today, loading }: { today: TodayResponse | undefined; loading: boolean }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div
        className="rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-zinc-950 p-4"
        data-testid="card-streak-current"
      >
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-4 w-4 text-amber-400" />
          <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
            Current streak
          </p>
        </div>
        <p className="text-3xl font-bold text-amber-100" data-testid="text-streak-current">
          {loading ? "—" : today?.currentStreak ?? 0}
        </p>
        <p className="text-xs text-amber-100/60">consecutive days</p>
      </div>
      <div
        className="rounded-lg border border-amber-900/40 bg-zinc-900/50 p-4"
        data-testid="card-streak-longest"
      >
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-amber-400" />
          <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold">
            Longest
          </p>
        </div>
        <p className="text-3xl font-bold text-amber-100" data-testid="text-streak-longest">
          {loading ? "—" : today?.longestStreak ?? 0}
        </p>
        <p className="text-xs text-amber-100/60">days at your best</p>
      </div>
      <div
        className="rounded-lg border border-amber-900/40 bg-zinc-900/50 p-4"
        data-testid="card-streak-last"
      >
        <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold mb-1">
          Last check-in
        </p>
        <p className="text-base font-bold text-amber-100">
          {loading ? "—" : today?.lastCheckInDate ?? "Not yet"}
        </p>
        <p className="text-xs text-amber-100/60">YYYY-MM-DD</p>
      </div>
    </div>
  );
}

function YesterdayCheckIn({
  anchor,
  onCheckIn,
  pending,
}: {
  anchor: AnchorRow;
  onCheckIn: (status: "remembered" | "struggled" | "forgot") => void;
  pending: boolean;
}) {
  return (
    <Card className="bg-amber-950/20 border-amber-700/40" data-testid="card-yesterday-checkin">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold mb-1">
              Yesterday's anchor
            </p>
            <h3 className="text-lg font-bold text-amber-100">{anchor.anchorData.title}</h3>
          </div>
        </div>
        <p className="text-sm text-amber-100/80 mb-4">Did you remember it today?</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-700/60 text-emerald-300"
            disabled={pending}
            onClick={() => onCheckIn("remembered")}
            data-testid="button-yesterday-remembered"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Remembered
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-700/60 text-amber-300"
            disabled={pending}
            onClick={() => onCheckIn("struggled")}
            data-testid="button-yesterday-struggled"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Struggled
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-300"
            disabled={pending}
            onClick={() => onCheckIn("forgot")}
            data-testid="button-yesterday-forgot"
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Forgot
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TodayAnchorCard({ anchor }: { anchor: AnchorRow }) {
  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-950 border-amber-500/40" data-testid="card-today-anchor">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold mb-1">
              Today's anchor · {anchor.anchorType}
            </p>
            <h2 className="text-2xl font-bold text-amber-100" data-testid="text-today-anchor-name">
              {anchor.anchorData.title}
            </h2>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-300">
            #{anchor.id}
          </Badge>
        </div>

        <ol className="space-y-1.5 mb-4">
          {anchor.anchorData.lines.map((line, i) => (
            <li
              key={i}
              className="text-base text-amber-50 leading-relaxed pl-3 border-l-2 border-amber-500/40"
            >
              {line}
            </li>
          ))}
        </ol>

        {anchor.audioUrl && (
          <audio
            controls
            src={anchor.audioUrl}
            className="w-full mb-3"
            data-testid="audio-today-anchor"
          />
        )}

        {anchor.anchorData.realityFooter && (
          <p className="text-xs text-amber-100/60 italic leading-relaxed border-t border-amber-900/30 pt-3">
            {anchor.anchorData.realityFooter}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AnchorListRow({
  anchor,
  isToday,
  onSetToday,
  setting,
}: {
  anchor: AnchorRow;
  isToday: boolean;
  onSetToday: () => void;
  setting: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border border-amber-900/30 bg-zinc-900/40 px-3 py-2.5"
      data-testid={`row-anchor-${anchor.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-amber-100 truncate">
            {anchor.anchorData.title}
          </span>
          <Badge variant="outline" className="border-amber-700/40 text-amber-300/80 text-[10px]">
            {anchor.anchorType}
          </Badge>
          {anchor.audioUrl && <Volume2 className="h-3 w-3 text-amber-400/70" />}
        </div>
        <p className="text-[11px] text-amber-100/50 mt-0.5">
          {new Date(anchor.createdAt).toLocaleDateString()}
        </p>
      </div>
      {isToday ? (
        <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10">
          Today
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="border-amber-700 text-amber-200"
          onClick={onSetToday}
          disabled={setting}
          data-testid={`button-set-today-${anchor.id}`}
        >
          Set as today's
        </Button>
      )}
    </div>
  );
}
