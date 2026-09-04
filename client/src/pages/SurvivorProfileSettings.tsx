import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Edit3,
  Loader2,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useSurvivorProfile } from "@/hooks/useSurvivorProfile";
import { useToast } from "@/hooks/use-toast";

export default function SurvivorProfileSettings() {
  const [, navigate] = useLocation();
  const { profile, isLoading, isAuthenticated, patch, resetIntake } = useSurvivorProfile();
  const { toast } = useToast();
  const [draft, setDraft] = useState<any>({});
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && !hydrated) {
      setDraft(profile);
      setHydrated(true);
    }
  }, [profile, hydrated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login?returnTo=/settings/profile";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#E2741B]" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        id,
        userId,
        intakeCompletedAt,
        intakeComplete,
        updatedAt,
        profileProvenance,
        ...patchable
      } = draft;
      await patch({ ...patchable, profileSource: "survivor_profile_settings" });
      toast({ title: "Saved", description: "Your profile is up to date." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetIntake = async () => {
    if (!confirm("Reopen the intake from the start? Your data is kept — you'll just walk through the steps again.")) return;
    try {
      await resetIntake();
      navigate("/recovery/intake");
    } catch (e: any) {
      toast({ title: "Couldn't reset", description: e?.message || "Please try again.", variant: "destructive" });
    }
  };

  const setField = (k: string, v: any) => setDraft((d: any) => ({ ...d, [k]: v }));

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#E2741B]" /> Survivor profile
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Edit anything anytime. Coach and your dashboard adapt automatically.
            </p>
          </div>
          {profile?.intakeCompletedAt && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-400/30 rounded-md px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Intake complete
            </div>
          )}
        </div>

        {!profile?.intakeCompletedAt && !profile && (
          <Card className="bg-[#1a1a1a] border-[#E2741B]/40 mb-6">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold mb-1">You haven't started your intake yet</div>
                <div className="text-xs text-gray-400">Five minutes tunes the whole platform to you.</div>
              </div>
              <Button
                onClick={() => navigate("/recovery/intake")}
                className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold"
                data-testid="button-start-intake-from-settings"
              >
                Start intake
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6 space-y-6">
            <Section title="Identity">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Preferred name" field="preferredName" provenance={draft.profileProvenance}>
                  <Input
                    value={draft.preferredName ?? ""}
                    onChange={(e) => setField("preferredName", e.target.value)}
                    className="bg-[#0D0D0D] border-[#333]"
                    data-testid="input-settings-preferred-name"
                  />
                </Field>
                <Field label="Pronouns" field="pronouns" provenance={draft.profileProvenance}>
                  <Input
                    value={draft.pronouns ?? ""}
                    onChange={(e) => setField("pronouns", e.target.value)}
                    className="bg-[#0D0D0D] border-[#333]"
                    data-testid="input-settings-pronouns"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Stroke fundamentals">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Stroke date" field="strokeDate" provenance={draft.profileProvenance}>
                  <Input
                    type="date"
                    value={draft.strokeDate ? new Date(draft.strokeDate).toISOString().slice(0, 10) : ""}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setField("strokeDate", e.target.value || null)}
                    className="bg-[#0D0D0D] border-[#333]"
                    data-testid="input-settings-stroke-date"
                  />
                </Field>
                <Field label="Stroke type" field="strokeType" provenance={draft.profileProvenance}>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["ischemic", "Ischemic"],
                      ["hemorrhagic", "Hemorrhagic"],
                      ["tia", "TIA"],
                      ["unknown", "Not sure"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setField("strokeType", value)}
                        className={`rounded-md border px-3 py-1.5 text-xs ${
                          draft.strokeType === value
                            ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                            : "border-[#333] text-gray-400"
                        }`}
                        data-testid={`option-settings-stroke-type-${value}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Affected side" field="affectedSide" provenance={draft.profileProvenance}>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["left", "Left"],
                    ["right", "Right"],
                    ["both", "Both"],
                    ["none", "Neither"],
                    ["unsure", "Not sure"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField("affectedSide", value)}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        draft.affectedSide === value
                          ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                          : "border-[#333] text-gray-400"
                      }`}
                      data-testid={`option-settings-side-${value}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Current focus">
              <Field label="Goals (one per line)" field="recoveryGoals" provenance={draft.profileProvenance}>
                <Textarea
                  value={(draft.recoveryGoals ?? []).join("\n")}
                  onChange={(e) => setField("recoveryGoals", splitLines(e.target.value))}
                  className="bg-[#0D0D0D] border-[#333] min-h-[90px]"
                  data-testid="textarea-settings-goals"
                />
              </Field>
              <Field label="What's hardest right now? (one per line)" field="currentChallenges" provenance={draft.profileProvenance}>
                <Textarea
                  value={(draft.currentChallenges ?? []).join("\n")}
                  onChange={(e) => setField("currentChallenges", splitLines(e.target.value))}
                  className="bg-[#0D0D0D] border-[#333] min-h-[90px]"
                  data-testid="textarea-settings-challenges"
                />
              </Field>
              <Field label="Custom goal" field="customGoal" provenance={draft.profileProvenance}>
                <Input
                  value={draft.customGoal ?? ""}
                  onChange={(e) => setField("customGoal", e.target.value)}
                  className="bg-[#0D0D0D] border-[#333]"
                  data-testid="input-settings-custom-goal"
                />
              </Field>
            </Section>

            <Section title="Sasquatch Scale">
              <p className="text-xs text-gray-500">
                These are your current self-assessment scores. Correct them here when your picture changes; your next plan will use the updated values.
              </p>
              {[
                ["physical", "Physical"],
                ["cognitive", "Cognitive"],
                ["speech", "Speech"],
                ["emotional", "Emotional"],
                ["memory", "Memory"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{label}</span>
                    <span className="text-[#E2741B]">{draft.assessmentScores?.[key] ?? 5}/10</span>
                  </div>
                  <Slider
                    value={[draft.assessmentScores?.[key] ?? 5]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(arr) =>
                      setField("assessmentScores", {
                        ...(draft.assessmentScores ?? {}),
                        [key]: arr[0] ?? 5,
                      })
                    }
                    data-testid={`slider-settings-assessment-${key}`}
                  />
                </div>
              ))}
              <Field label="Assessment notes" field="assessmentNotes" provenance={draft.profileProvenance}>
                <Textarea
                  value={draft.assessmentNotes ?? ""}
                  onChange={(e) => setField("assessmentNotes", e.target.value)}
                  className="bg-[#0D0D0D] border-[#333] min-h-[80px]"
                  data-testid="textarea-settings-assessment-notes"
                />
              </Field>
              <ProfileMeta field="assessmentScores" provenance={draft.profileProvenance} />
            </Section>

            <Section title="What you’re working with">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Mobility aids (one per line)" field="mobilityAids" provenance={draft.profileProvenance}>
                  <Textarea
                    value={(draft.mobilityAids ?? []).join("\n")}
                    onChange={(e) => setField("mobilityAids", splitLines(e.target.value))}
                    className="bg-[#0D0D0D] border-[#333] min-h-[90px]"
                    data-testid="textarea-settings-mobility-aids"
                  />
                </Field>
                <Field label="Equipment (one per line)" field="equipment" provenance={draft.profileProvenance}>
                  <Textarea
                    value={(draft.equipment ?? []).join("\n")}
                    onChange={(e) => setField("equipment", splitLines(e.target.value))}
                    className="bg-[#0D0D0D] border-[#333] min-h-[90px]"
                    data-testid="textarea-settings-equipment"
                  />
                </Field>
              </div>
              {draft.deficits && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-400">Deficit levels</div>
                  {[
                    ["motor", "Movement / weakness"],
                    ["speech", "Speech / aphasia"],
                    ["cognitive", "Memory / focus"],
                    ["fatigue", "Fatigue"],
                    ["vision", "Vision"],
                    ["swallowing", "Swallowing"],
                    ["emotional", "Mood / emotions"],
                    ["sensory", "Sensation"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{label}</span>
                        <span className="text-[#E2741B]">{draft.deficits[key] ?? 0}/4</span>
                      </div>
                      <Slider
                        value={[draft.deficits[key] ?? 0]}
                        min={0}
                        max={4}
                        step={1}
                        onValueChange={(arr) =>
                          setField("deficits", { ...(draft.deficits ?? {}), [key]: arr[0] ?? 0 })
                        }
                        data-testid={`slider-settings-deficit-${key}`}
                      />
                    </div>
                  ))}
                  <ProfileMeta field="deficits" provenance={draft.profileProvenance} />
                </div>
              )}
            </Section>

            <Section title="Daily life">
              <Field
                label={`Daily recovery time: ${draft.dailyTimeBudgetMinutes ?? 20} min`}
                field="dailyTimeBudgetMinutes"
                provenance={draft.profileProvenance}
              >
                <Slider
                  value={[draft.dailyTimeBudgetMinutes ?? 20]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={(arr) => setField("dailyTimeBudgetMinutes", arr[0] ?? 20)}
                  data-testid="slider-settings-time-budget"
                />
              </Field>
              <Field label="Sharpest time of day" field="energyPattern" provenance={draft.profileProvenance}>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["morning", "Morning"],
                    ["afternoon", "Afternoon"],
                    ["evening", "Evening"],
                    ["variable", "It varies"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField("energyPattern", value)}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        draft.energyPattern === value
                          ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                          : "border-[#333] text-gray-400"
                      }`}
                      data-testid={`option-settings-energy-${value}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="Story">
              <Field label="Your story" field="story" provenance={draft.profileProvenance}>
                <Textarea
                  value={draft.story ?? ""}
                  onChange={(e) => setField("story", e.target.value)}
                  className="bg-[#0D0D0D] border-[#333] min-h-[120px]"
                  data-testid="textarea-settings-story"
                />
              </Field>
            </Section>

            <Section title="Caregiver">
              <div className="flex items-center justify-between rounded-md border border-[#333] bg-[#0D0D0D] p-4">
                <div>
                  <div className="text-sm font-semibold">I have a caregiver</div>
                  <div className="text-xs text-gray-500">We'll show caregiver tools when this is on.</div>
                </div>
                <Switch
                  checked={!!draft.hasCaregiver}
                  onCheckedChange={(v) => setField("hasCaregiver", v)}
                  data-testid="switch-settings-has-caregiver"
                />
              </div>
              <ProfileMeta field="hasCaregiver" provenance={draft.profileProvenance} />
              {draft.hasCaregiver && (
                <>
                  <Field label="Caregiver email" field="caregiverEmail" provenance={draft.profileProvenance}>
                    <Input
                      type="email"
                      value={draft.caregiverEmail ?? ""}
                      onChange={(e) => setField("caregiverEmail", e.target.value)}
                      className="bg-[#0D0D0D] border-[#333]"
                      data-testid="input-settings-caregiver-email"
                    />
                  </Field>
                  <Field label="Caregiver relationship" field="caregiverRelationship" provenance={draft.profileProvenance}>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["spouse", "Spouse / partner"],
                        ["child", "Child"],
                        ["parent", "Parent"],
                        ["friend", "Friend"],
                        ["professional", "Professional"],
                        ["other", "Other"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setField("caregiverRelationship", value)}
                          className={`rounded-md border px-3 py-1.5 text-xs ${
                            draft.caregiverRelationship === value
                              ? "border-[#E2741B] bg-[#E2741B]/10 text-white"
                              : "border-[#333] text-gray-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
            </Section>

            <Section title="Accessibility">
              <div className="space-y-3">
                {[
                  { k: "bigButtonMode", l: "Big buttons + larger text" },
                  { k: "dyslexiaFont", l: "Dyslexia-friendly font" },
                  { k: "reducedMotion", l: "Reduce motion" },
                  { k: "voicePrefersTts", l: "Read pages aloud by default" },
                ].map(({ k, l }) => (
                  <div key={k} className="rounded-md border border-[#333] bg-[#0D0D0D] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{l}</div>
                      <Switch
                        checked={!!draft[k]}
                        onCheckedChange={(v) => setField(k, v)}
                        data-testid={`switch-settings-${k}`}
                      />
                    </div>
                    <ProfileMeta field={k} provenance={draft.profileProvenance} />
                  </div>
                ))}
              </div>
            </Section>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#E2741B] hover:bg-[#B8851A] text-black font-bold flex-1"
                data-testid="button-save-profile"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save changes
              </Button>
              <Button
                variant="outline"
                onClick={handleResetIntake}
                className="border-[#333] text-gray-300"
                data-testid="button-reset-intake"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Walk me through intake again
              </Button>
            </div>

            <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5 pt-2">
              <ShieldCheck className="w-3 h-3" /> Private to you. Used only to personalize your recovery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-[#E2741B] font-semibold">{title}</div>
      {children}
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function ProfileMeta({
  field,
  provenance,
}: {
  field: string;
  provenance?: Record<string, { source: string; updatedAt: string }>;
}) {
  const meta = provenance?.[field];
  if (!meta) {
    return <div className="text-[10px] text-gray-600">Not set yet</div>;
  }
  const source = meta.source
    .replace(/^legacy_/, "Earlier ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return (
    <div className="text-[10px] text-gray-600">
      Source: {source} · Updated {new Date(meta.updatedAt).toLocaleDateString()}
    </div>
  );
}

function Field({
  label,
  field,
  provenance,
  children,
}: {
  label: string;
  field?: string;
  provenance?: Record<string, { source: string; updatedAt: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-gray-400">{label}</Label>
      {children}
      {field && <ProfileMeta field={field} provenance={provenance} />}
    </div>
  );
}
