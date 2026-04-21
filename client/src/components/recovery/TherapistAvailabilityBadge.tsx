import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Clock, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface TherapistAvailability {
  isTherapist: boolean;
  title?: string;
  acceptingPatients?: boolean;
  hours?: Record<string, string[]>;
}

const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
  return h * 60 + mn;
}

/** Computed against the VIEWER's local clock so the badge reads correctly
 *  on the device showing it. v1: we don't store therapist timezone, so we
 *  treat the configured hours as "in your local time" — same convention as
 *  most chat-availability hints. */
function computeAvailability(hours?: Record<string, string[]>) {
  if (!hours) return { isOpen: false, currentWindow: null as any, nextWindow: null as any };
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let currentWindow: { day: string; start: string; end: string } | null = null;
  let nextWindow: { day: string; start: string; end: string; minutesUntil: number } | null = null;
  let bestDelta = Infinity;
  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayIdx + offset) % 7;
    const dayKey = DAY_KEYS[idx];
    const wins = hours[dayKey] || [];
    for (const w of wins) {
      const [s, e] = w.split("-");
      const sm = parseHHMM(s), em = parseHHMM(e);
      if (sm == null || em == null || em <= sm) continue;
      if (offset === 0 && nowMin >= sm && nowMin < em) {
        currentWindow = { day: dayKey, start: s, end: e };
      }
      const delta = offset === 0 ? sm - nowMin : offset * 24 * 60 + sm - nowMin;
      if (delta > 0 && delta < bestDelta) {
        bestDelta = delta;
        nextWindow = { day: dayKey, start: s, end: e, minutesUntil: delta };
      }
    }
  }
  return { isOpen: !!currentWindow, currentWindow, nextWindow };
}

function formatNext(n: { day: string; start: string; minutesUntil: number }): string {
  const min = n.minutesUntil;
  if (min < 60) return `Open in ${min}m`;
  if (min < 24 * 60) return `Open at ${n.start}`;
  const days = Math.floor(min / (24 * 60));
  if (days === 1) return `Open tomorrow ${n.start}`;
  return `Open ${n.day.slice(0,3)} ${n.start}`;
}

export function useTherapistAvailability(userId?: string | null) {
  return useQuery<TherapistAvailability>({
    queryKey: ["/api/therapists", userId, "availability"],
    queryFn: async () => {
      if (!userId) return { isTherapist: false };
      const res = await fetch(`/api/therapists/${userId}/availability`);
      if (!res.ok) return { isTherapist: false };
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

interface Props {
  userId?: string | null;
  variant?: "inline" | "compact";
}

export default function TherapistAvailabilityBadge({ userId, variant = "inline" }: Props) {
  const { data } = useTherapistAvailability(userId);
  if (!data?.isTherapist) return null;

  const { isOpen, currentWindow, nextWindow } = computeAvailability(data.hours);
  const open = isOpen;
  const summary = open
    ? currentWindow ? `Open Hours · until ${currentWindow.end}` : "Open Hours · available"
    : nextWindow ? formatNext(nextWindow) : "Hours not set";

  if (variant === "compact") {
    return (
      <Badge
        className={`gap-1 text-[10px] border-0 ${
          open ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700/60 text-zinc-300"
        }`}
        data-testid={`therapist-availability-${userId}`}
      >
        <Stethoscope className="w-3 h-3" />
        {open ? "Open" : "Closed"}
      </Badge>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-xs"
      data-testid={`therapist-availability-${userId}`}
    >
      <Badge className="gap-1 bg-[#C9941A]/15 text-[#C9941A] border-0">
        <Stethoscope className="w-3 h-3" /> {data.title || "Therapist"}
      </Badge>
      <span className={`inline-flex items-center gap-1 ${open ? "text-emerald-300" : "text-zinc-400"}`}>
        {open
          ? <CircleDot className="w-3 h-3 fill-emerald-400 text-emerald-400" />
          : <Clock className="w-3 h-3" />}
        {summary}
      </span>
    </div>
  );
}
