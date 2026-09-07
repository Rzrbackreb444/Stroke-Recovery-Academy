import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecoveryHeader from "@/components/RecoveryHeader";
import {
  Target,
  BookOpen,
  Hammer,
  Combine,
  Activity,
  Download,
  CheckCircle,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

const STEPS = [
  {
    letter: "S",
    word: "Seize",
    icon: Target,
    body: "Accept exactly where you are right now. No denial. This is your raw material — your flickers, your limitations, your real starting point. You can't build on fantasy.",
  },
  {
    letter: "A",
    word: "Absorb",
    icon: BookOpen,
    body: "Take in every useful piece of knowledge — therapists, science, other survivors, your own body's feedback. Even the therapist you don't like has one technique worth stealing.",
  },
  {
    letter: "S",
    word: "Swing",
    icon: Activity,
    body: "Experiment. Test. Take action. Try new angles, tools, or reps — even when they feel awkward or useless. Action beats perfection.",
  },
  {
    letter: "C",
    word: "Combine",
    icon: Combine,
    body: "Mix the best pieces into your own custom system. Don't follow one method blindly. Build your personal recovery recipe.",
  },
  {
    letter: "H",
    word: "Hammer",
    icon: Hammer,
    body: "Practice when your energy allows, then pause for rest and recovery. Adjust the pace to your body, care plan, and day.",
  },
];

export default function SaschLanding() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [done, setDone] = useState(false);

  const subscribeMut = useMutation({
    mutationFn: (data: { email: string; firstName?: string }) =>
      apiRequest("POST", "/api/sasch/subscribe", data),
    onSuccess: () => setDone(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    subscribeMut.mutate({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
    });
  }

  return (
    <>
      <Helmet>
        <title>The S.A.S.C.H. Formula — Free Stroke Recovery Cheat Sheet | Stroke Recovery Academy</title>
        <meta
          name="description"
          content="Download the free S.A.S.C.H. Formula PDF — the 5-step personal framework Nick Kremers used during his own 0% to 90%+ recovery story. Seize, Absorb, Swing, Combine, Hammer."
        />
        <meta property="og:title" content="The S.A.S.C.H. Formula — Free Stroke Recovery Cheat Sheet" />
        <meta
          property="og:description"
          content="The 5-step personal blueprint Nick used during his 0% to 90%+ recovery story. Download the free PDF and get the 67-day Sasquatch Dispatch series."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://strokerecoveryacademy.com/recovery/sasch" />
      </Helmet>

      <div className="min-h-screen" style={{ background: "#0D0D0D", color: "#E5E5E5" }}>
        <RecoveryHeader />

        {/* HERO */}
        <section className="px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 uppercase tracking-widest text-xs"
              style={{ background: "#2a1f00", color: "#E2741B", border: "1px solid #E2741B" }}
              data-testid="badge-free"
            >
              Free Cheat Sheet · No Credit Card
            </Badge>
            <h1
              className="text-4xl md:text-6xl font-black tracking-tight mb-6"
              style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
              data-testid="text-hero-title"
            >
              The <span style={{ color: "#E2741B" }}>S.A.S.C.H.</span> Formula
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
              style={{ color: "#E5E5E5" }}
            >
              The 5-step personal system Nick Kremers used during his own journey from{" "}
              <span style={{ color: "#E2741B", fontWeight: 700 }}>0% function</span> after a massive stroke
              to <span style={{ color: "#E2741B", fontWeight: 700 }}>90%+ recovery — and still rising.</span>
            </p>
            <p className="text-sm md:text-base italic" style={{ color: "#999" }}>
              Print it. Tape it to the mirror. Keep it on your phone. However you'll actually use it.
            </p>
          </div>
        </section>

        {/* EMAIL GATE */}
        <section className="px-4 pb-16">
          <div className="max-w-2xl mx-auto">
            {done ? (
              <Card style={{ background: "#1a1a1a", border: "1px solid #E2741B" }}>
                <CardContent className="py-10 text-center">
                  <CheckCircle className="h-14 w-14 mx-auto mb-4" style={{ color: "#E2741B" }} />
                  <h2
                    className="text-2xl font-black mb-3"
                    style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
                    data-testid="text-success-title"
                  >
                    You're in. Cheat sheet incoming.
                  </h2>
                  <p className="text-base mb-6" style={{ color: "#E5E5E5" }}>
                    Check your inbox in the next minute. If you don't see it, check spam — and if it's still
                    missing, grab it directly here:
                  </p>
                  <a
                    href="/api/sasch/cheat-sheet.pdf"
                    download
                    data-testid="link-direct-download"
                  >
                    <Button
                      className="font-bold"
                      style={{ background: "#E2741B", color: "#000" }}
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download the PDF Now
                    </Button>
                  </a>
                  <p className="text-xs mt-6" style={{ color: "#999" }}>
                    Over the next 67 days you'll also get 10 emails from Nick — real stuff, not fluff. The
                    first one arrives in 3 days.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card style={{ background: "#1a1a1a", border: "1px solid #333" }}>
                <CardContent className="py-8 px-6 md:px-10">
                  <div className="text-center mb-6">
                    <h2
                      className="text-2xl md:text-3xl font-black mb-2"
                      style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
                    >
                      Send Me the Cheat Sheet
                    </h2>
                    <p className="text-sm" style={{ color: "#999" }}>
                      One email. PDF attached. Plus the 67-day Sasquatch Dispatch series.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name (optional)"
                        style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                        data-testid="input-firstname"
                      />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Your email address"
                        style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                        data-testid="input-email"
                      />
                    </div>
                    {subscribeMut.isError && (
                      <p className="text-xs" style={{ color: "#ef4444" }} data-testid="text-error">
                        {(subscribeMut.error as any)?.message || "Something went wrong. Try again."}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full font-bold tracking-wide"
                      style={{ background: "#E2741B", color: "#000" }}
                      disabled={subscribeMut.isPending}
                      size="lg"
                      data-testid="button-submit"
                    >
                      {subscribeMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Send Me the Cheat Sheet — Free
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center" style={{ color: "#666" }}>
                      Free. Unsubscribe any time. Nick actually writes these.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* THE 5 STEPS */}
        <section className="px-4 py-16" style={{ background: "#111" }} data-testid="section-steps">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge
                className="mb-4 uppercase tracking-widest text-xs"
                style={{ background: "#2a1f00", color: "#E2741B", border: "1px solid #E2741B" }}
              >
                Sasquatch Action System — Construction Hammer
              </Badge>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
              >
                Five Steps. Zero Fluff.
              </h2>
              <p className="text-base max-w-2xl mx-auto" style={{ color: "#E5E5E5" }}>
                Run them every morning or every night. Log one swing and one flicker. Repeat tomorrow. That's
                the whole formula — and the simplicity is why it works when motivation runs out.
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {STEPS.map((s, i) => (
                <Card
                  key={i}
                  className="border-2 hover-elevate"
                  style={{ background: "#1a1a1a", borderColor: "#333" }}
                  data-testid={`step-${s.word.toLowerCase()}`}
                >
                  <CardContent className="pt-6 pb-5 text-center">
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{ background: "#E2741B" }}
                    >
                      <s.icon className="h-6 w-6" style={{ color: "#000" }} />
                    </div>
                    <div
                      className="text-3xl font-black mb-1"
                      style={{ color: "#E2741B", fontFamily: "Georgia, serif" }}
                    >
                      {s.letter}
                    </div>
                    <h3
                      className="text-base font-bold uppercase tracking-wide mb-2"
                      style={{ color: "#FFFFFF" }}
                    >
                      {s.word}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#999" }}>
                      {s.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p
                className="text-base md:text-lg italic"
                style={{ color: "#E2741B", fontFamily: "Georgia, serif" }}
              >
                "S.A.S.C.H. it every day: Seize → Absorb → Swing → Combine → Hammer."
              </p>
            </div>
          </div>
        </section>

        {/* THE 66-DAY TRUTH */}
        <section className="px-4 py-16" data-testid="section-truth">
          <div className="max-w-3xl mx-auto">
            <Card style={{ background: "#1a1a1a", border: "1px solid #E2741B" }}>
              <CardContent className="py-8 px-6 md:px-10">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 shrink-0" style={{ color: "#E2741B" }} />
                  <h2
                    className="text-xl md:text-2xl font-black uppercase tracking-wide"
                    style={{ color: "#E2741B", fontFamily: "Georgia, serif" }}
                  >
                    The 66-Day Truth
                  </h2>
                </div>
                <div className="space-y-4 text-base leading-relaxed" style={{ color: "#E5E5E5" }}>
                  <p>
                    66 days is the average time it takes to turn deliberate effort into a habit.{" "}
                    <strong style={{ color: "#FFF" }}>It is not a guarantee.</strong>
                  </p>
                  <p>
                    Every stroke is different. Every brain is different. Every recovery is different. The
                    S.A.S.C.H. Formula is a blueprint built from Nick's personal journey from 0% to 90%+
                    and still rising; it is not a universal outcome.
                  </p>
                  <p>
                    The blueprint is optional. Try what feels appropriate, pause for rest, and discuss
                    any exercise changes with your care team.
                  </p>
                  <p style={{ color: "#FFF", fontWeight: 600 }}>
                    Nick's experience shows what was possible for him. Your recovery will be your own.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SOFT CTA TO CHALLENGE */}
        <section className="px-4 py-16" style={{ background: "#111" }} data-testid="section-cta-challenge">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-2xl md:text-3xl font-black mb-4"
              style={{ color: "#FFFFFF", fontFamily: "Georgia, serif" }}
            >
              Ready for the Full 66-Day Blueprint?
            </h2>
            <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto" style={{ color: "#E5E5E5" }}>
              The cheat sheet is the daily formula. The 66-Day Sasquatch Transformation Challenge is the
              full program — daily missions, accountability tracking, the survivor community, and Nick's
              voice in your ear every morning.
            </p>
            <Link href="/recovery/challenge" data-testid="link-challenge">
              <Button
                size="lg"
                className="font-bold tracking-wide"
                style={{ background: "#E2741B", color: "#000" }}
              >
                See the 66-Day Challenge — 7 Days Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="px-4 py-10" data-testid="section-disclaimer">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
              <strong style={{ color: "#888" }}>Lived experience only — not medical advice.</strong> The
              S.A.S.C.H. Formula and all content from Stroke Recovery Academy are for motivational and
              informational purposes only. Always consult your physician, neurologist, or licensed therapist
              before beginning any rehabilitation program. Individual results vary significantly.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
