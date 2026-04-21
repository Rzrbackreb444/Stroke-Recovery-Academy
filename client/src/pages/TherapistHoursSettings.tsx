import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Stethoscope, Save } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";

const DAYS = [
  { key: "sunday",    label: "Sunday" },
  { key: "monday",    label: "Monday" },
  { key: "tuesday",   label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday",  label: "Thursday" },
  { key: "friday",    label: "Friday" },
  { key: "saturday",  label: "Saturday" },
] as const;

type Hours = Record<string, string[]>;

function isValidWindow(s: string): boolean {
  const m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const sm = +m[1] * 60 + +m[2];
  const em = +m[3] * 60 + +m[4];
  return sm >= 0 && em > sm && em <= 24 * 60;
}

export default function TherapistHoursSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hours, setHours] = useState<Hours>({});

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/therapists", user?.id, "availability"],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/therapists/${user.id}/availability`);
      return res.ok ? res.json() : null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (data?.hours) setHours(data.hours);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      // Validate all windows
      for (const [day, wins] of Object.entries(hours)) {
        for (const w of wins) {
          if (!isValidWindow(w)) throw new Error(`Invalid time on ${day}: "${w}". Use HH:MM-HH:MM.`);
        }
      }
      const res = await apiRequest("PUT", "/api/therapists/me/hours", { hours });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Open hours saved", description: "Survivors will see your availability in DMs." });
      queryClient.invalidateQueries({ queryKey: ["/api/therapists", user?.id, "availability"] });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const addWindow = (day: string) =>
    setHours((h) => ({ ...h, [day]: [...(h[day] || []), "09:00-17:00"] }));
  const removeWindow = (day: string, idx: number) =>
    setHours((h) => ({ ...h, [day]: (h[day] || []).filter((_, i) => i !== idx) }));
  const updateWindow = (day: string, idx: number, val: string) =>
    setHours((h) => ({ ...h, [day]: (h[day] || []).map((w, i) => i === idx ? val : w) }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="text-gray-400 text-center py-12">Loading…</div>
      </div>
    );
  }

  if (data && !data.isTherapist) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-3">
          <Stethoscope className="w-12 h-12 text-[#C9941A] mx-auto" />
          <h1 className="text-xl font-semibold">Verified therapists only</h1>
          <p className="text-gray-400 text-sm">
            Apply to become a verified therapist to set your open hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Stethoscope className="w-7 h-7 text-[#C9941A]" /> Therapist Open Hours
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Survivors see this in your direct messages so they know when to expect a reply.
            Use 24-hour time, e.g. <code className="text-[#C9941A]">09:00-12:00</code>. Times are local.
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Weekly schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((d) => {
              const dayHours = hours[d.key] || [];
              return (
                <div key={d.key} className="flex flex-wrap items-start gap-3 pb-3 border-b border-[#333] last:border-0">
                  <div className="w-28 text-sm text-gray-300 font-medium pt-2">{d.label}</div>
                  <div className="flex-1 min-w-[220px] space-y-2">
                    {dayHours.length === 0 && (
                      <div className="text-xs text-gray-500 pt-2">Closed</div>
                    )}
                    {dayHours.map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={w}
                          onChange={(e) => updateWindow(d.key, i, e.target.value)}
                          placeholder="09:00-17:00"
                          className={`bg-[#0D0D0D] border-[#333] font-mono text-sm w-40
                            ${!isValidWindow(w) ? "border-red-500/60" : ""}`}
                          data-testid={`input-${d.key}-${i}`}
                        />
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => removeWindow(d.key, i)}
                          data-testid={`button-remove-${d.key}-${i}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => addWindow(d.key)}
                    className="text-[#C9941A]"
                    data-testid={`button-add-${d.key}`}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add window
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-[#C9941A] text-black hover:bg-[#C9941A]/90"
          data-testid="button-save-hours"
        >
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? "Saving…" : "Save hours"}
        </Button>
      </main>
    </div>
  );
}
