import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Mountain, Flame, Shield, Anchor, Hammer, Lightbulb,
  ArrowRight, ArrowLeft, Sparkles, Check, Loader2, Edit3,
} from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";

interface Archetype {
  key: string;
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  creedSeeds: string[];
  voicePreset: string;
  accentColor: string;
  iconKey: string;
}

const ICON_MAP: Record<string, any> = {
  Mountain, Flame, Shield, Anchor, Hammer, Lightbulb,
};

export default function RecoveryForge() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selected, setSelected] = useState<Archetype | null>(null);
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const [creed, setCreed] = useState("");
  const [trigger, setTrigger] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { data: archetypeData } = useQuery<{ archetypes: Archetype[] }>({
    queryKey: ['/api/persona/archetypes'],
  });
  const { data: existingData } = useQuery<{ persona: any | null }>({
    queryKey: ['/api/persona/me'],
  });

  // Pre-fill if persona already exists (edit mode)
  useEffect(() => {
    if (existingData?.persona && archetypeData?.archetypes && step === 1 && !selected) {
      const arch = archetypeData.archetypes.find((a) => a.key === existingData.persona.archetypeKey);
      if (arch) {
        setSelected(arch);
        setName(existingData.persona.name);
        setCreed(existingData.persona.creed);
        setTrigger(existingData.persona.triggerCue ?? "");
        setWhy(existingData.persona.why ?? "");
      }
    }
  }, [existingData, archetypeData]);

  const forgeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/persona/forge', {
        archetypeKey: selected?.key,
        name,
        why,
      });
      return await res.json();
    },
    onSuccess: (data: { suggestions: string[] }) => {
      setSuggestions(data.suggestions);
      if (data.suggestions[0] && !creed) setCreed(data.suggestions[0]);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/persona', {
        archetypeKey: selected?.key,
        name,
        creed,
        why: why || null,
        triggerCue: trigger || null,
        voicePreset: selected?.voicePreset,
        accentColor: selected?.accentColor,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persona/me'] });
      toast({
        title: "Beast forged",
        description: `${name} is ready. Time to chop wood.`,
      });
      setLocation('/recovery/dashboard');
    },
    onError: () => {
      toast({ title: "Could not save persona", variant: "destructive" });
    },
  });

  const archetypes = archetypeData?.archetypes ?? [];
  const accent = selected?.accentColor ?? "#C9941A";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Progress strip */}
        <div className="flex items-center gap-2 mb-8" data-testid="forge-progress">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded ${n <= step ? "bg-[#C9941A]" : "bg-[#333]"}`}
            />
          ))}
        </div>

        <header className="mb-8">
          <Badge className="bg-[#C9941A]/15 text-[#C9941A] border-[#C9941A]/30 mb-3">
            Forge Your Beast — Step {step} of 5
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-2" data-testid="heading-forge-step">
            {step === 1 && "Pick the beast that lives in you"}
            {step === 2 && "Name your beast"}
            {step === 3 && "Forge the creed"}
            {step === 4 && "Choose your trigger"}
            {step === 5 && "Confirm the rebuild begins"}
          </h1>
          <p className="text-gray-400">
            {step === 1 && "The wounded self can't do the rep. Your beast can. Pick the one that fits."}
            {step === 2 && "What is the version of you that does the work called? Make it yours."}
            {step === 3 && "One sentence. Spoken in your beast's voice. The thing you say when the rep gets hard."}
            {step === 4 && "A physical cue that tells your nervous system: I'm switching modes now. (Optional but powerful.)"}
            {step === 5 && "Once you confirm, your beast shows up across the OS. You can re-forge anytime."}
          </p>
        </header>

        {/* STEP 1 — pick archetype */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4" data-testid="grid-archetypes">
            {archetypes.map((a) => {
              const Icon = ICON_MAP[a.iconKey] ?? Mountain;
              const isSel = selected?.key === a.key;
              return (
                <Card
                  key={a.key}
                  onClick={() => setSelected(a)}
                  className={`bg-[#1a1a1a] border cursor-pointer hover-elevate active-elevate-2 ${isSel ? "border-[#C9941A]" : "border-[#333]"}`}
                  data-testid={`card-archetype-${a.key}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${a.accentColor}22`, color: a.accentColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black mb-1">{a.name}</h3>
                        <p className="text-sm text-gray-400 mb-3 italic">{a.tagline}</p>
                        <p className="text-sm text-gray-300 mb-3">{a.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {a.traits.map((t) => (
                            <Badge key={t} variant="outline" className="border-[#333] text-gray-400 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {isSel && <Check className="w-5 h-5 text-[#C9941A] shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* STEP 2 — name */}
        {step === 2 && selected && (
          <Card className="bg-[#1a1a1a] border border-[#333]" data-testid="card-name">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                You picked <span className="text-[#C9941A] font-bold">{selected.name}</span>. What name does your beast go by?
                Most people use a first name plus the archetype: "Cassie the Phoenix," "Marcus the Wolf," or just "Sasquatch."
              </p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. "${selected.name}" or "Your-name the ${selected.name}"`}
                className="bg-[#0D0D0D] border-[#333] text-white text-lg"
                maxLength={60}
                data-testid="input-persona-name"
              />
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                  Optional: why this archetype matters to you (used to personalize your creed)
                </label>
                <Textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="A sentence or two. The realer the better."
                  className="bg-[#0D0D0D] border-[#333] text-white resize-none"
                  rows={3}
                  data-testid="textarea-why"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 — creed */}
        {step === 3 && selected && (
          <Card className="bg-[#1a1a1a] border border-[#333]" data-testid="card-creed">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-400">
                  One sentence in <span className="text-[#C9941A] font-bold">{name}</span>'s voice. Spoken in third person.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => forgeMutation.mutate()}
                  disabled={forgeMutation.isPending}
                  className="border-[#C9941A]/40 text-[#C9941A] hover:bg-[#C9941A]/10"
                  data-testid="button-generate-creed"
                >
                  {forgeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Forging...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Suggest creeds</>
                  )}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2" data-testid="creed-suggestions">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tap one to use it</p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCreed(s)}
                      className="w-full text-left p-3 rounded border border-[#333] bg-[#0D0D0D] hover-elevate text-sm text-gray-200"
                      data-testid={`button-suggestion-${i}`}
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                  <Edit3 className="w-3 h-3" /> Your creed (edit freely)
                </label>
                <Textarea
                  value={creed}
                  onChange={(e) => setCreed(e.target.value)}
                  placeholder={selected.creedSeeds[0]?.replaceAll(selected.name, name || selected.name)}
                  className="bg-[#0D0D0D] border-[#333] text-white text-base resize-none"
                  rows={3}
                  maxLength={280}
                  data-testid="textarea-creed"
                />
                <p className="text-xs text-gray-500 mt-1">{creed.length} / 280</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4 — trigger */}
        {step === 4 && (
          <Card className="bg-[#1a1a1a] border border-[#333]" data-testid="card-trigger">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                The trigger is the cue you use to step into your beast. A bracelet you tap. A song you play before therapy.
                A phrase you say out loud. The trigger is how you tell your nervous system: <span className="text-[#C9941A] italic">"I am switching modes now."</span>
              </p>
              <Input
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder={`e.g. "Tap left wrist twice" or "Play Eye of the Tiger" or "Say: chop wood"`}
                className="bg-[#0D0D0D] border-[#333] text-white"
                maxLength={160}
                data-testid="input-trigger"
              />
              <p className="text-xs text-gray-500">Optional. You can add or change it later.</p>
            </CardContent>
          </Card>
        )}

        {/* STEP 5 — confirm */}
        {step === 5 && selected && (
          <Card className="bg-[#1a1a1a] border" style={{ borderColor: accent }} data-testid="card-confirm">
            <CardContent className="p-8 text-center space-y-4">
              {(() => {
                const Icon = ICON_MAP[selected.iconKey] ?? Mountain;
                return (
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    <Icon className="w-10 h-10" />
                  </div>
                );
              })()}
              <h2 className="text-3xl font-black" data-testid="text-confirm-name">{name}</h2>
              <p className="text-sm text-gray-500 uppercase tracking-widest">{selected.name} archetype</p>
              <blockquote
                className="text-xl italic max-w-2xl mx-auto py-4 border-l-2 pl-4 text-left"
                style={{ borderColor: accent }}
                data-testid="text-confirm-creed"
              >
                "{creed}"
              </blockquote>
              {trigger && (
                <p className="text-sm text-gray-400">
                  <span className="text-[#C9941A] font-bold uppercase tracking-wide">Trigger:</span> {trigger}
                </p>
              )}
              <p className="text-xs text-gray-500 max-w-md mx-auto pt-4">
                Confirm to wire your beast into the dashboard, the quizzes, and your certificate.
                You can re-forge at any time from your dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-8 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 1) setLocation('/recovery/dashboard');
              else setStep((s) => (s - 1) as any);
            }}
            className="border-[#333] text-white hover:bg-[#1a1a1a]"
            data-testid="button-forge-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep((s) => (s + 1) as any)}
              disabled={
                (step === 1 && !selected) ||
                (step === 2 && name.trim().length < 2) ||
                (step === 3 && creed.trim().length < 5)
              }
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
              data-testid="button-forge-next"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !creed.trim()}
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
              data-testid="button-forge-confirm"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Forging...</>
              ) : (
                <>Forge {name || "the beast"} <Check className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
