import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Music,
  Image as ImageIcon,
  Quote,
  Loader2,
  Download,
  Sparkles,
  Lock,
  Volume2,
  Crown,
  Anchor,
} from "lucide-react";
import RecoveryAnchorStudio from "@/components/recovery/RecoveryAnchorStudio";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { MedicalDisclaimerCard } from "@/components/recovery/MedicalDisclaimerCard";

interface UsageResponse {
  month: string;
  anthemCount: number;
  visionCardCount: number;
  limits: { anthem: number; vision_card: number } | null;
  premium: boolean;
  ttsAvailable: boolean;
}

interface AnthemResponse {
  id: number;
  lyrics: string;
  audioUrl: string | null;
  title: string;
}

interface VisionCardResponse {
  id: number;
  imageUrl: string | null;
  declaration: string;
  goal: string;
}

interface QuoteResponse {
  date: string;
  quote: string;
  audioUrl: string | null;
}

function UsageBar({ usage }: { usage: UsageResponse }) {
  if (usage.premium) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <Crown className="h-4 w-4" />
        <span>Premium — unlimited generations</span>
      </div>
    );
  }
  const limits = usage.limits!;
  return (
    <div className="flex flex-wrap gap-3 text-xs text-amber-100/70">
      <Badge variant="outline" className="border-amber-700/50 text-amber-200" data-testid="badge-anthem-usage">
        Anthems: {usage.anthemCount}/{limits.anthem} this month
      </Badge>
      <Badge variant="outline" className="border-amber-700/50 text-amber-200" data-testid="badge-vision-usage">
        Vision cards: {usage.visionCardCount}/{limits.vision_card} this month
      </Badge>
      <Badge variant="outline" className="border-emerald-800/50 text-emerald-300">
        Quotes: unlimited
      </Badge>
    </div>
  );
}

function AnthemMaker({ usage, onDone }: { usage: UsageResponse; onDone: () => void }) {
  const { toast } = useToast();
  const [affirmation, setAffirmation] = useState("");
  const [theme, setTheme] = useState("");
  const [result, setResult] = useState<AnthemResponse | null>(null);

  const overLimit = !usage.premium && usage.anthemCount >= (usage.limits?.anthem ?? 999);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/motivation/anthem/generate", { affirmation, theme });
      return (await res.json()) as AnthemResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      onDone();
      toast({ title: "Anthem ready", description: "Your 4-line lyric is below." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Couldn't make your anthem",
        description: err?.message ?? "Please try again.",
      });
    },
  });

  return (
    <Card className="bg-zinc-900/60 border-amber-900/30">
      <CardHeader>
        <CardTitle className="text-amber-100 flex items-center gap-2">
          <Music className="h-5 w-5 text-amber-400" />
          Anthem Maker
        </CardTitle>
        <CardDescription className="text-amber-100/60">
          Turn one affirmation into a 4-line survivor anthem, voiced in Sasquatch's tone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-amber-200 mb-1 block">Your affirmation</label>
          <Textarea
            value={affirmation}
            onChange={(e) => setAffirmation(e.target.value)}
            placeholder="I am rebuilding the body my stroke tried to take."
            className="bg-zinc-950/60 border-amber-900/30 text-amber-50 resize-none"
            rows={3}
            maxLength={500}
            data-testid="input-anthem-affirmation"
          />
        </div>
        <div>
          <label className="text-sm text-amber-200 mb-1 block">Theme (optional)</label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="grit, gratitude, grace, fight, return…"
            className="bg-zinc-950/60 border-amber-900/30 text-amber-50"
            data-testid="input-anthem-theme"
          />
        </div>

        {overLimit ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-700/50 bg-amber-950/30 p-3">
            <Lock className="h-4 w-4 text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-100/80">
              <p className="font-semibold text-amber-200">Free monthly limit reached.</p>
              <p>You've used all {usage.limits?.anthem} anthems this month. Upgrade for unlimited.</p>
              <Link href="/pricing" className="text-amber-400 hover:underline">View plans →</Link>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !affirmation.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 w-full"
            data-testid="button-generate-anthem"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Composing…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Compose Anthem</>
            )}
          </Button>
        )}

        {result && (
          <Card className="bg-amber-950/20 border-amber-900/40 mt-4" data-testid="card-anthem-result">
            <CardContent className="py-5">
              <pre className="whitespace-pre-wrap font-serif text-lg text-amber-100 leading-relaxed mb-4" data-testid="text-anthem-lyrics">
                {result.lyrics}
              </pre>
              {result.audioUrl ? (
                <div className="flex items-center gap-3">
                  <audio controls src={result.audioUrl} className="flex-1" data-testid="audio-anthem-player" />
                  <Button asChild size="sm" variant="outline" className="border-amber-800/50">
                    <a href={result.audioUrl} download={`anthem-${result.id}.mp3`} data-testid="link-anthem-download">
                      <Download className="h-4 w-4 mr-1" /> mp3
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-amber-100/50">Voice generation unavailable right now — lyrics saved.</p>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function VisionCard({ usage, onDone }: { usage: UsageResponse; onDone: () => void }) {
  const { toast } = useToast();
  const [goal, setGoal] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [result, setResult] = useState<VisionCardResponse | null>(null);

  const overLimit = !usage.premium && usage.visionCardCount >= (usage.limits?.vision_card ?? 999);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/motivation/vision-card/generate", { goal, declaration });
      return (await res.json()) as VisionCardResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      onDone();
      toast({ title: "Vision card ready", description: "Save it to your phone lock screen." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Couldn't make your vision card",
        description: err?.message ?? "Please try again.",
      });
    },
  });

  return (
    <Card className="bg-zinc-900/60 border-amber-900/30">
      <CardHeader>
        <CardTitle className="text-amber-100 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-amber-400" />
          Vision Card
        </CardTitle>
        <CardDescription className="text-amber-100/60">
          Turn a 6-month goal into an image you can use as a lock screen, with a one-line declaration overlay.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-amber-200 mb-1 block">6-month goal</label>
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="walks unassisted to the mailbox every morning"
            className="bg-zinc-950/60 border-amber-900/30 text-amber-50 resize-none"
            rows={2}
            maxLength={300}
            data-testid="input-vision-goal"
          />
        </div>
        <div>
          <label className="text-sm text-amber-200 mb-1 block">Declaration (optional — we'll write one if blank)</label>
          <Input
            value={declaration}
            onChange={(e) => setDeclaration(e.target.value)}
            placeholder="I am the survivor who walks first, then runs."
            className="bg-zinc-950/60 border-amber-900/30 text-amber-50"
            maxLength={120}
            data-testid="input-vision-declaration"
          />
        </div>

        {overLimit ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-700/50 bg-amber-950/30 p-3">
            <Lock className="h-4 w-4 text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-100/80">
              <p className="font-semibold text-amber-200">Free monthly limit reached.</p>
              <p>You've used all {usage.limits?.vision_card} vision cards this month. Upgrade for unlimited.</p>
              <Link href="/pricing" className="text-amber-400 hover:underline">View plans →</Link>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !goal.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 w-full"
            data-testid="button-generate-vision"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drawing your vision…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Vision Card</>
            )}
          </Button>
        )}

        {result && (
          <Card className="bg-amber-950/20 border-amber-900/40 mt-4" data-testid="card-vision-result">
            <CardContent className="py-5">
              {result.imageUrl ? (
                <div className="relative rounded-md overflow-hidden border border-amber-900/40">
                  <img src={result.imageUrl} alt={result.goal} className="w-full block" data-testid="img-vision-card" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent p-5">
                    <p className="text-amber-50 text-lg font-serif italic" data-testid="text-vision-declaration">
                      "{result.declaration}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-amber-900/40 bg-zinc-950/60 p-6">
                  <p className="text-amber-50 text-lg font-serif italic mb-2">"{result.declaration}"</p>
                  <p className="text-amber-100/50 text-xs">
                    Image generation is unavailable right now — your declaration is saved.
                  </p>
                </div>
              )}
              {result.imageUrl && (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="border-amber-800/50">
                    <a href={result.imageUrl} download={`vision-${result.id}.png`} data-testid="link-vision-download">
                      <Download className="h-4 w-4 mr-1" /> Download
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function DailyQuote() {
  const { data, isLoading } = useQuery<QuoteResponse>({
    queryKey: ["/api/motivation/quote/today"],
  });

  return (
    <Card className="bg-zinc-900/60 border-amber-900/30">
      <CardHeader>
        <CardTitle className="text-amber-100 flex items-center gap-2">
          <Quote className="h-5 w-5 text-amber-400" />
          Today's Quote
        </CardTitle>
        <CardDescription className="text-amber-100/60">
          One Sasquatch line for today. Cached for everyone — refreshes after midnight.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-amber-100/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading today's quote…
          </div>
        ) : data ? (
          <div className="space-y-4">
            <blockquote className="text-2xl font-serif text-amber-50 leading-relaxed border-l-2 border-amber-500 pl-4" data-testid="text-daily-quote">
              "{data.quote}"
            </blockquote>
            {data.audioUrl ? (
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-amber-400" />
                <audio controls src={data.audioUrl} className="flex-1" data-testid="audio-quote-player" />
              </div>
            ) : (
              <p className="text-xs text-amber-100/50">Voice playback unavailable today.</p>
            )}
            <p className="text-xs text-amber-100/40">{data.date}</p>
          </div>
        ) : (
          <p className="text-amber-100/60">Quote unavailable right now. Try again later.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MotivationStudio() {
  const { user } = useAuth();
  const { data: usage, isLoading: usageLoading } = useQuery<UsageResponse>({
    queryKey: ["/api/motivation/usage"],
    enabled: !!user,
  });

  const refreshUsage = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/motivation/usage"] });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-amber-50 flex flex-col">
        <GlobalHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="bg-zinc-900/60 border-amber-900/30 max-w-md w-full">
            <CardContent className="py-8 text-center space-y-4">
              <Sparkles className="h-10 w-10 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-bold text-amber-100">Sign in to use the Motivation Studio</h2>
              <p className="text-amber-100/60 text-sm">
                Anthems, vision cards, and your monthly usage are tied to your account.
              </p>
              <Button asChild className="bg-amber-500 hover:bg-amber-400 text-zinc-950">
                <a href="/api/login" data-testid="link-signin">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 flex flex-col">
      <GlobalHeader />
      <main className="flex-1">
        <section className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/30 to-zinc-950">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-3 text-amber-400 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Motivation Studio</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-3" data-testid="text-motivation-title">
              The fuel for tomorrow.
            </h1>
            <p className="text-lg text-amber-100/70 mb-5 max-w-2xl">
              Three tools that put your own words in your ear — anthem, image, and the quote of the day.
            </p>
            {usage && <UsageBar usage={usage} />}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-8">
          <MedicalDisclaimerCard
            variant="compact"
            extraContext="Motivation tools are not therapy. If you are in crisis, call 911 or text 988."
          />
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <Tabs defaultValue="anchor" className="w-full">
            <TabsList className="bg-zinc-900 border border-amber-900/30 mb-6 flex-wrap h-auto">
              <TabsTrigger value="anchor" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950" data-testid="tab-anchor">
                <Anchor className="h-4 w-4 mr-1" /> Recovery Anchor
              </TabsTrigger>
              <TabsTrigger value="anthem" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950" data-testid="tab-anthem">
                <Music className="h-4 w-4 mr-1" /> Anthem
              </TabsTrigger>
              <TabsTrigger value="vision" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950" data-testid="tab-vision">
                <ImageIcon className="h-4 w-4 mr-1" /> Vision Card
              </TabsTrigger>
              <TabsTrigger value="quote" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950" data-testid="tab-quote">
                <Quote className="h-4 w-4 mr-1" /> Daily Quote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="anchor">
              <RecoveryAnchorStudio />
            </TabsContent>

            <TabsContent value="anthem">
              {usage ? (
                <AnthemMaker usage={usage} onDone={refreshUsage} />
              ) : (
                <Card className="bg-zinc-900/60 border-amber-900/30">
                  <CardContent className="py-12 flex items-center justify-center text-amber-100/60">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> {usageLoading ? "Loading…" : "Usage unavailable."}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="vision">
              {usage ? (
                <VisionCard usage={usage} onDone={refreshUsage} />
              ) : (
                <Card className="bg-zinc-900/60 border-amber-900/30">
                  <CardContent className="py-12 flex items-center justify-center text-amber-100/60">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> {usageLoading ? "Loading…" : "Usage unavailable."}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="quote">
              <DailyQuote />
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
}
