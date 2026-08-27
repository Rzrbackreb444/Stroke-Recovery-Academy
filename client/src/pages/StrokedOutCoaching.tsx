import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle,
  Flame,
  Loader2,
  LogIn,
  Mountain,
  Phone,
  Shield,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import Footer from "@/components/Footer";

const coachingPackages = [
  {
    id: "accountability-monthly",
    name: "Monthly Accountability",
    price: 197,
    interval: "/month",
    description: "Weekly check-ins to keep your recovery work moving.",
    features: [
      "Four weekly accountability calls",
      "Custom goal setting and tracking",
      "Progress reporting",
      "Email support between calls",
    ],
    icon: Target,
  },
  {
    id: "recovery-intensive",
    name: "Recovery Intensive",
    price: 497,
    interval: "one-time",
    description: "A focused strategy session for your next recovery chapter.",
    features: [
      "Two-hour strategy session with Nick",
      "Personalized recovery plan",
      "66-Day roadmap creation",
      "30-day follow-up call",
      "Sasquatch Method implementation",
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: "transformation",
    name: "66-Day Transformation",
    price: 1997,
    interval: "one-time",
    description: "A complete guided accountability program.",
    features: [
      "Full 66-day one-on-one coaching",
      "Daily accountability tracking",
      "Weekly strategy sessions",
      "Custom routine planning",
      "Direct phone/text access to Nick",
    ],
    icon: Mountain,
  },
  {
    id: "elite-annual",
    name: "Elite Annual Coaching",
    price: 4997,
    interval: "/year",
    description: "Long-term support with Nick for the year ahead.",
    features: [
      "Twelve monthly one-on-one sessions",
      "Weekly group coaching access",
      "Unlimited email support",
      "Quarterly strategy reviews",
      "Priority access to new programs",
    ],
    icon: Star,
  },
];

export default function StrokedOutCoaching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [completed] = useState(() => location.includes("coaching=success"));

  const coachingMutation = useMutation({
    mutationFn: async (data: { packageId: string }) => {
      const response = await apiRequest("POST", "/api/recovery/payments/coaching-package", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout unavailable",
        description: error.message || "There was an error starting checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = (packageId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in before booking paid coaching.",
      });
      navigate("/recovery/login");
      return;
    }
    coachingMutation.mutate({ packageId });
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title="Stroked-Out Sasquatch Coaching — Recovery Accountability with Nick"
        description="Work directly with Nick Kremers through Stroked-Out Sasquatch coaching. Choose a focused recovery session, monthly accountability, or longer-term support."
        canonical="/recovery/coaching"
        keywords={["stroke recovery coaching", "Stroked-Out Sasquatch coaching", "Nick Kremers coaching", "stroke survivor accountability"]}
        breadcrumbs={[
          { name: "Recovery Hub", url: "/recovery" },
          { name: "Sasquatch Coaching", url: "/recovery/coaching" },
        ]}
      />
      <RecoveryHeader />

      {completed ? (
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-[#E2741B]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4">You’re in.</h1>
          <p className="text-gray-400 leading-relaxed mb-8">
            Your coaching checkout is complete. Nick’s team will follow up with the next steps.
          </p>
          <Button asChild className="bg-[#E2741B] text-black font-bold">
            <Link href="/recovery/today">Back to Today</Link>
          </Button>
        </main>
      ) : (
        <>
          <main>
            <section className="border-b border-[#222] px-4 py-20">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="bg-[#E2741B]/15 text-[#E2741B] border-[#E2741B]/30 mb-5 uppercase tracking-widest">
                  <Flame className="h-3 w-3 mr-1" />
                  Stroked-Out Sasquatch
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5">
                  Recovery work is personal.<br />
                  <span className="text-[#E2741B]">So is the accountability.</span>
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                  Work directly with Nick Kremers, a stroke survivor who built the Sasquatch Method from lived experience, daily reps, and honest feedback.
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-400">
                  <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-[#E2741B]" /> Non-clinical accountability</span>
                  <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#E2741B]" /> Direct support options</span>
                  <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#E2741B]" /> Clear next steps</span>
                </div>
              </div>
            </section>

            <section className="px-4 py-16">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#E2741B] mb-3">Choose your level of support</p>
                  <h2 className="text-3xl font-black">Work with Sasquatch</h2>
                  <p className="text-gray-400 mt-3 max-w-xl mx-auto">
                    These are coaching and accountability services, not medical treatment or rehabilitation care.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {coachingPackages.map((pkg) => {
                    const Icon = pkg.icon;
                    return (
                      <Card
                        key={pkg.id}
                        className={`bg-[#111] border-[#2a2a2a] text-white relative ${pkg.popular ? "ring-1 ring-[#E2741B]" : ""}`}
                      >
                        {pkg.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E2741B] text-black">
                            Most chosen
                          </Badge>
                        )}
                        <CardHeader>
                          <div className="w-11 h-11 rounded-lg bg-[#E2741B]/15 flex items-center justify-center mb-3">
                            <Icon className="h-5 w-5 text-[#E2741B]" />
                          </div>
                          <CardTitle className="text-white text-lg">{pkg.name}</CardTitle>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-[#E2741B]">${pkg.price.toLocaleString()}</span>
                            <span className="text-sm text-gray-500">{pkg.interval}</span>
                          </div>
                          <CardDescription className="text-gray-400">{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5 mb-6">
                            {pkg.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle className="h-4 w-4 text-[#E2741B] mt-0.5 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button
                            className="w-full bg-[#E2741B] text-black font-bold hover:bg-[#f08a32]"
                            onClick={() => handleCheckout(pkg.id)}
                            disabled={coachingMutation.isPending}
                            data-testid={`button-sasquatch-coaching-${pkg.id}`}
                          >
                            {coachingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started"}
                            {!coachingMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {!user && (
                  <div className="mt-8 rounded-xl border border-[#2a2a2a] bg-[#111] p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">Ready to talk through your goals?</p>
                      <p className="text-sm text-gray-400 mt-1">Sign in first, then choose the coaching path that fits.</p>
                    </div>
                    <Button asChild variant="outline" className="border-[#E2741B]/50 text-[#E2741B]">
                      <a href="/api/login"><LogIn className="h-4 w-4 mr-2" />Sign in</a>
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className="border-t border-[#222] bg-[#111] px-4 py-12">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-gray-400 leading-relaxed">
                  Looking for nonprofit support instead? Stroke Lyfe Inc. is separate from paid coaching and focuses on donations, survivor gifts, and scholarship access.
                </p>
                <Button asChild variant="ghost" className="text-[#E2741B] mt-2">
                  <Link href="/recovery/strokelyfe-org">Visit Stroke Lyfe Inc. <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </section>
          </main>
        </>
      )}
      <Footer />
    </div>
  );
}