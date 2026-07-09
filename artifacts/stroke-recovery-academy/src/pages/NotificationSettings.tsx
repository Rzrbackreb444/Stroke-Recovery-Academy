import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import RecoveryHeader from "@/components/RecoveryHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, Bell, Flame, Target, Users, Mail, BarChart2,
  Save, Eye, EyeOff, Smartphone, MessageSquare, Moon, Globe, BellOff,
} from "lucide-react";
import { useState, useEffect } from "react";

type Prefs = {
  checkinReminderHour: number;
  streakBreakEmail: boolean;
  weeklyRepGoal: number;
  weeklyDigestEnabled: boolean;
  caregiverShareEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  smsPhone: string | null;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string;
  unsubscribedAll: boolean;
};

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "America/Toronto", label: "Canada Eastern (Toronto)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
  { value: "UTC", label: "UTC" },
];

const HOURS = Array.from({ length: 24 }, (_, h) => {
  const ampm = h < 12 ? "AM" : "PM";
  const display = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
  return { value: h, label: display };
});

function Toggle({ enabled, onToggle, testId }: { enabled: boolean; onToggle: () => void; testId: string }) {
  return (
    <button
      data-testid={testId}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? "bg-[#E2741B]" : "bg-[#333]"
      }`}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[#1e1e1e] last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-8 w-8 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-[#E2741B]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: prefs, isLoading } = useQuery<Prefs>({
    queryKey: ["/api/recovery/notification-prefs"],
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState<Prefs>({
    checkinReminderHour: 9,
    streakBreakEmail: true,
    weeklyRepGoal: 21,
    weeklyDigestEnabled: true,
    caregiverShareEnabled: false,
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    smsPhone: null,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: "America/New_York",
    unsubscribedAll: false,
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (prefs) {
      setForm({
        checkinReminderHour: prefs.checkinReminderHour ?? 9,
        streakBreakEmail: prefs.streakBreakEmail ?? true,
        weeklyRepGoal: prefs.weeklyRepGoal ?? 21,
        weeklyDigestEnabled: prefs.weeklyDigestEnabled ?? true,
        caregiverShareEnabled: prefs.caregiverShareEnabled ?? false,
        emailEnabled: prefs.emailEnabled ?? true,
        pushEnabled: prefs.pushEnabled ?? true,
        smsEnabled: prefs.smsEnabled ?? false,
        smsPhone: prefs.smsPhone ?? null,
        quietHoursStart: prefs.quietHoursStart ?? null,
        quietHoursEnd: prefs.quietHoursEnd ?? null,
        timezone: prefs.timezone ?? "America/New_York",
        unsubscribedAll: prefs.unsubscribedAll ?? false,
      });
    }
  }, [prefs]);

  const update = (patch: Partial<Prefs>) => {
    setForm(f => ({ ...f, ...patch }));
    setDirty(true);
  };

  const quietOn = form.quietHoursStart != null && form.quietHoursEnd != null;
  const toggleQuiet = () => {
    if (quietOn) update({ quietHoursStart: null, quietHoursEnd: null });
    else update({ quietHoursStart: 22, quietHoursEnd: 7 });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", "/api/recovery/notification-prefs", form);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Your preferences are updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/notification-prefs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/progress"] });
      setDirty(false);
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" });
    },
  });

  // Caregiver links (so survivor knows who would see their data)
  const { data: caregiverData } = useQuery<{ caregivers: any[]; sharingEnabled: boolean }>({
    queryKey: ["/api/recovery/my-caregivers"],
    staleTime: 1000 * 60 * 5,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Sign in to manage settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <SEO
        title="Goals & Alerts | Stroke Recovery Academy"
        description="Set your weekly rep goal, manage reminder emails, and control supporter visibility."
      />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/recovery/progress">
            <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-back-progress">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Goals &amp; Alerts</h1>
            <p className="text-xs text-gray-500">Rep goal, reminders, and supporter access</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-[#1a1a1a] animate-pulse" />)}
          </div>
        ) : (
          <>
            <Card className="bg-[#111] border-[#222] px-5 mb-4">
              {/* Weekly rep goal */}
              <SettingRow
                icon={Target}
                label="Weekly rep goal"
                description="How many reps you aim to log each week. Default: 21 (3/day)."
              >
                <Input
                  data-testid="input-weekly-rep-goal"
                  type="number"
                  min={1}
                  max={200}
                  value={form.weeklyRepGoal}
                  onChange={e => update({ weeklyRepGoal: Math.max(1, Math.min(200, Number(e.target.value) || 1)) })}
                  className="w-20 bg-[#1a1a1a] border-[#333] text-white text-center"
                />
              </SettingRow>

              {/* Check-in reminder */}
              <SettingRow
                icon={Bell}
                label="Daily check-in reminder"
                description="Hour of day to receive your nudge email (your local time zone)."
              >
                <select
                  data-testid="select-reminder-hour"
                  value={form.checkinReminderHour}
                  onChange={e => update({ checkinReminderHour: Number(e.target.value) })}
                  className="bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#E2741B]/50"
                >
                  {HOURS.map(h => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </SettingRow>

              {/* Streak break email */}
              <SettingRow
                icon={Flame}
                label="Streak-break reminder"
                description="Get an email when you miss a day so you can save the streak before midnight."
              >
                <Toggle
                  enabled={form.streakBreakEmail}
                  onToggle={() => update({ streakBreakEmail: !form.streakBreakEmail })}
                  testId="toggle-streak-break-email"
                />
              </SettingRow>

              {/* Weekly digest */}
              <SettingRow
                icon={BarChart2}
                label="Weekly progress digest"
                description="A Sunday summary email with your reps, streak, mood average, and next-week goal."
              >
                <Toggle
                  enabled={form.weeklyDigestEnabled}
                  onToggle={() => update({ weeklyDigestEnabled: !form.weeklyDigestEnabled })}
                  testId="toggle-weekly-digest"
                />
              </SettingRow>

              {/* Caregiver sharing */}
              <SettingRow
                icon={form.caregiverShareEnabled ? Eye : EyeOff}
                label="Allow supporters to see my progress"
                description="Linked caregivers and family can view your streak, today's reps, and 7-day chart."
              >
                <Toggle
                  enabled={form.caregiverShareEnabled}
                  onToggle={() => update({ caregiverShareEnabled: !form.caregiverShareEnabled })}
                  testId="toggle-caregiver-share"
                />
              </SettingRow>
            </Card>

            {/* Channels & delivery */}
            <Card className="bg-[#111] border-[#222] px-5 mb-4">
              <div className="pt-4 pb-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-600">Channels &amp; delivery</p>
              </div>

              {/* Email channel */}
              <SettingRow
                icon={Mail}
                label="Email"
                description="Lifecycle emails — onboarding, win-back, trial reminders, and your weekly digest."
              >
                <Toggle
                  enabled={form.emailEnabled}
                  onToggle={() => update({ emailEnabled: !form.emailEnabled })}
                  testId="toggle-email-enabled"
                />
              </SettingRow>

              {/* Push channel */}
              <SettingRow
                icon={Smartphone}
                label="Push notifications"
                description="Browser and device push for reminders and nudges."
              >
                <Toggle
                  enabled={form.pushEnabled}
                  onToggle={() => update({ pushEnabled: !form.pushEnabled })}
                  testId="toggle-push-enabled"
                />
              </SettingRow>

              {/* SMS channel */}
              <SettingRow
                icon={MessageSquare}
                label="Text messages (SMS)"
                description="Opt in to text reminders. Reply STOP anytime. Msg & data rates may apply."
              >
                <Toggle
                  enabled={form.smsEnabled}
                  onToggle={() => update({ smsEnabled: !form.smsEnabled })}
                  testId="toggle-sms-enabled"
                />
              </SettingRow>

              {form.smsEnabled && (
                <div className="pb-4">
                  <Input
                    data-testid="input-sms-phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={form.smsPhone ?? ""}
                    onChange={e => update({ smsPhone: e.target.value })}
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-600 mt-1.5">
                    Include your country code. We only text what you opt into, and STOP ends it instantly.
                  </p>
                </div>
              )}

              {/* Quiet hours */}
              <SettingRow
                icon={Moon}
                label="Quiet hours"
                description="Pause push & SMS overnight (your time zone). Email is unaffected."
              >
                <Toggle
                  enabled={quietOn}
                  onToggle={toggleQuiet}
                  testId="toggle-quiet-hours"
                />
              </SettingRow>

              {quietOn && (
                <div className="flex items-center gap-2 pb-4 text-sm text-gray-400">
                  <span>From</span>
                  <select
                    data-testid="select-quiet-start"
                    value={form.quietHoursStart ?? 22}
                    onChange={e => update({ quietHoursStart: Number(e.target.value) })}
                    className="bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#E2741B]/50"
                  >
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                  <span>to</span>
                  <select
                    data-testid="select-quiet-end"
                    value={form.quietHoursEnd ?? 7}
                    onChange={e => update({ quietHoursEnd: Number(e.target.value) })}
                    className="bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#E2741B]/50"
                  >
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              )}

              {/* Time zone */}
              <SettingRow
                icon={Globe}
                label="Time zone"
                description="Used for quiet hours and time-of-day sends."
              >
                <select
                  data-testid="select-timezone"
                  value={form.timezone}
                  onChange={e => update({ timezone: e.target.value })}
                  className="bg-[#1a1a1a] border border-[#333] text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-[#E2741B]/50 max-w-[180px]"
                >
                  {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </SettingRow>
            </Card>

            {/* Global unsubscribe */}
            <Card className="bg-[#111] border-[#222] px-5 mb-4">
              <SettingRow
                icon={BellOff}
                label="Unsubscribe from everything"
                description="Stops every lifecycle message on all channels. Receipts and security emails still send."
              >
                <Toggle
                  enabled={form.unsubscribedAll}
                  onToggle={() => update({ unsubscribedAll: !form.unsubscribedAll })}
                  testId="toggle-unsubscribed-all"
                />
              </SettingRow>
            </Card>

            {/* Linked caregivers preview */}
            {caregiverData?.caregivers && caregiverData.caregivers.length > 0 && (
              <Card className="bg-[#111] border-[#222] p-4 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Linked supporters
                  {form.caregiverShareEnabled
                    ? <span className="text-green-500 ml-auto">Can see your progress</span>
                    : <span className="text-gray-600 ml-auto">Sharing is off</span>}
                </p>
                <div className="space-y-2">
                  {caregiverData.caregivers.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <div className="h-7 w-7 rounded-full bg-[#E2741B]/20 flex items-center justify-center text-[#E2741B] text-xs font-bold shrink-0">
                        {(c.first_name || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-gray-300">{c.first_name} {c.last_name}</span>
                      {c.relationship && (
                        <span className="text-gray-600 text-xs capitalize">{c.relationship}</span>
                      )}
                    </div>
                  ))}
                </div>
                {!form.caregiverShareEnabled && (
                  <p className="text-xs text-gray-600 mt-3 italic">
                    Toggle sharing on above so they can cheer you on.
                  </p>
                )}
              </Card>
            )}

            {caregiverData?.caregivers?.length === 0 && (
              <Card className="bg-[#111] border-[#222] p-4 mb-4">
                <p className="text-xs text-gray-600 mb-2">No linked supporters yet.</p>
                <Link href="/settings/caregivers">
                  <Button size="sm" variant="outline" className="border-[#333] text-gray-300 gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    Invite a supporter
                  </Button>
                </Link>
              </Card>
            )}

            {/* Save */}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!dirty || saveMutation.isPending}
              className="w-full bg-[#E2741B] text-black font-bold gap-2"
              data-testid="button-save-prefs"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving…" : "Save preferences"}
            </Button>

            <p className="text-xs text-gray-600 text-center mt-4">
              Email alerts use the address on your account.{" "}
              <Link href="/settings"><span className="text-gray-500 hover:text-gray-300 cursor-pointer underline">Change email →</span></Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
