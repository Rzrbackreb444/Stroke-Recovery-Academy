import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import RecoveryHeader from "@/components/RecoveryHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Music, Mic2, Send, CheckCircle2, Headphones, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  HOSTILE_CONSTRUCTION_TRACKS,
  HOSTILE_CONSTRUCTION_ALBUM,
} from "@shared/hostileConstruction";
import { ALBUM_COVER, HOSTILE_AUDIO } from "@/lib/hostileAudio";

interface InterestForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  storyText: string;
  songVibe: string;
  tierInterest: "sponsored" | "paid" | "either";
  hearAbout: string;
}

const EMPTY: InterestForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  storyText: "",
  songVibe: "",
  tierInterest: "either",
  hearAbout: "",
};

export default function SasquatchSound() {
  const [form, setForm] = useState<InterestForm>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const submit = useMutation({
    mutationFn: async (payload: InterestForm) => {
      return await apiRequest("POST", "/api/sasquatch-sound/interest", payload);
    },
    onSuccess: () => {
      setSubmitted(true);
      setForm(EMPTY);
      toast({
        title: "You're on the list",
        description: "Nick will reach out personally. Welcome to the Vanguard.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't submit",
        description: err?.message || "Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  function update<K extends keyof InterestForm>(key: K, value: InterestForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast({ title: "Add your name", variant: "destructive" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast({ title: "Add a valid email", variant: "destructive" });
      return;
    }
    submit.mutate(form);
  }

  // Showcase tracks first - the strongest survivor-anthem cuts
  const showcase = HOSTILE_CONSTRUCTION_TRACKS.filter((t) =>
    ["stroked-out-but-not-done", "i-am-the-architect", "the-promise", "wheelchair-warrior", "stand-up", "hostile-construction"].includes(t.slug)
  );

  return (
    <div className="min-h-screen bg-background">
      <RecoverySEO
        title="Sasquatch Sound — The Survivor Music Label"
        description="Your stroke story, turned into a real song. Released on Spotify, Apple Music, YouTube under your name. Built by survivors, for survivors."
        canonical="/sasquatch-sound"
      />
      <RecoveryHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge variant="secondary" className="mx-auto">
            <Sparkles className="w-3 h-3 mr-1" /> Pre-launch · Founding artists wanted
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight" data-testid="text-hero-title">
            Sasquatch Sound
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your stroke story — turned into a <strong>real song</strong>, released on Spotify, Apple
            Music, and YouTube, under <strong>your name</strong>.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Built by a survivor, for survivors. The first label where the artists are the warriors.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge variant="outline">17 tracks released</Badge>
            <Badge variant="outline">Founder: Stroked-Out Sasquatch</Badge>
            <Badge variant="outline">Now accepting interest</Badge>
          </div>
          <div className="pt-3">
            <Button asChild size="lg" variant="outline" data-testid="link-hero-studio">
              <Link href="/sasquatch-studio">
                <Sparkles className="w-4 h-4 mr-2" />
                Or clone your own voice — Sasquatch Studio · $9.99/mo
              </Link>
            </Button>
          </div>
        </section>

        {/* Proof — listen to what's already out */}
        <section className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Headphones className="w-5 h-5" /> Hear what's possible
              </h2>
              <p className="text-sm text-muted-foreground">
                Six cuts from the founder album <em>Hostile Construction</em>. This is what your
                song will sound like — produced for you, in your voice, in your story.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" data-testid="link-full-album">
              <Link href="/hostile-construction">Full album →</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {showcase.map((t) => {
              const audio = HOSTILE_AUDIO[t.slug];
              return (
                <Card key={t.slug} className="p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={ALBUM_COVER}
                      alt=""
                      className="w-14 h-14 rounded-md border"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/track/${t.slug}`}
                        className="font-semibold hover:underline block truncate"
                        data-testid={`link-showcase-${t.slug}`}
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{t.vibe}</p>
                    </div>
                  </div>
                  {audio && (
                    <audio
                      controls
                      preload="none"
                      src={audio}
                      className="w-full"
                      data-testid={`audio-showcase-${t.slug}`}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Tell your story",
                body: "Sign up below. Share your stroke story, your fight, your why. The raw material of your anthem.",
              },
              {
                n: "02",
                title: "We build your song",
                body: "Nick personally writes lyrics from your story and produces the track in the same engine that built Hostile Construction.",
              },
              {
                n: "03",
                title: "Released under your name",
                body: "Your song lands on Spotify, Apple Music, YouTube, Amazon Music. Your photo, your story, your anthem — your platform.",
              },
            ].map((s) => (
              <Card key={s.n} className="p-5 space-y-2">
                <p className="text-xs text-muted-foreground tracking-wider">{s.n}</p>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Tiers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Three ways in</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 space-y-3">
              <Badge variant="secondary">Sponsored slot</Badge>
              <h3 className="text-xl font-semibold">Free · Apply</h3>
              <p className="text-sm text-muted-foreground">
                One survivor each month gets the full treatment, fully funded. Selected from the
                interest list below.
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Custom song from your story</li>
                <li>Released on all major platforms</li>
                <li>Your own track page + QR</li>
              </ul>
            </Card>
            <Card className="p-6 space-y-3 border-primary/40">
              <Badge>Skip the line</Badge>
              <h3 className="text-xl font-semibold">Paid · Coming soon</h3>
              <p className="text-sm text-muted-foreground">
                Pay an affordable production fee and your song ships in 14 days. Founding-member
                pricing for the interest list.
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Everything in Sponsored, on your timeline</li>
                <li>Founding-member pricing</li>
                <li>You keep 100% of streaming royalties</li>
              </ul>
            </Card>
            <Card className="p-6 space-y-3 border-primary/60">
              <Badge>DIY · Live now</Badge>
              <h3 className="text-xl font-semibold">Sasquatch Studio · $9.99/mo</h3>
              <p className="text-sm text-muted-foreground">
                Clone your own voice. Record audiobooks, poems, anthems — anything — in your own
                voice. Even on bad-aphasia days.
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Up to 3 cloned voices</li>
                <li>50,000 characters / month</li>
                <li>Download every track as MP3</li>
              </ul>
              <Button asChild size="sm" data-testid="link-tier-studio">
                <Link href="/sasquatch-studio">Open the Studio →</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* Interest form */}
        <section id="signup" className="scroll-mt-24">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <Mic2 className="w-6 h-6 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold">Pre-launch interest list</h2>
                <p className="text-sm text-muted-foreground">
                  Tell Nick a little about you. He'll reach out personally before the public
                  launch. No spam, ever.
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">You're on the list</h3>
                <p className="text-muted-foreground">
                  Nick will reach out personally. Welcome to the Vanguard.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)} data-testid="button-add-another">
                  Add another survivor
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        data-testid="input-city"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        data-testid="input-state"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="story">Your story (in your words)</Label>
                  <Textarea
                    id="story"
                    rows={5}
                    placeholder="When did your stroke hit? What did the doctors say? What's the fight you're in right now?"
                    value={form.storyText}
                    onChange={(e) => update("storyText", e.target.value)}
                    data-testid="input-story"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vibe">Dream song vibe</Label>
                  <Textarea
                    id="vibe"
                    rows={3}
                    placeholder="Rock anthem? Hip-hop fight song? Country grit? Gospel rise? Tell Nick what hits for you."
                    value={form.songVibe}
                    onChange={(e) => update("songVibe", e.target.value)}
                    data-testid="input-vibe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Which tier interests you most?</Label>
                  <RadioGroup
                    value={form.tierInterest}
                    onValueChange={(v) => update("tierInterest", v as InterestForm["tierInterest"])}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="sponsored" id="tier-sponsored" data-testid="radio-tier-sponsored" />
                      <Label htmlFor="tier-sponsored" className="font-normal cursor-pointer">
                        Sponsored slot (free, by application)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="paid" id="tier-paid" data-testid="radio-tier-paid" />
                      <Label htmlFor="tier-paid" className="font-normal cursor-pointer">
                        Paid skip-the-line (founding pricing)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="either" id="tier-either" data-testid="radio-tier-either" />
                      <Label htmlFor="tier-either" className="font-normal cursor-pointer">
                        Either / not sure yet
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hear">How'd you hear about this?</Label>
                  <Input
                    id="hear"
                    placeholder="TikTok, Facebook, the book, a friend…"
                    value={form.hearAbout}
                    onChange={(e) => update("hearAbout", e.target.value)}
                    data-testid="input-hear-about"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submit.isPending}
                    data-testid="button-submit"
                  >
                    {submit.isPending ? (
                      "Sending…"
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Get on the list
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    No payment required. No spam. Nick reads every one.
                  </p>
                </div>
              </form>
            )}
          </Card>
        </section>

        <section className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Already a fan of the music?{" "}
            <Link href="/hostile-construction" className="underline" data-testid="link-album-footer">
              Listen to the full album
            </Link>{" "}
            or{" "}
            <Link href="/recovery/radio" className="underline" data-testid="link-radio-footer">
              tune Sasquatch Radio
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
