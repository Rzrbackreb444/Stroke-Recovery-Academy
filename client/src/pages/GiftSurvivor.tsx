import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Heart, CheckCircle, Shield, ArrowRight,
  Users, Star, Zap, Crown
} from "lucide-react";
const strokeLyfeLogo = "/stroke-lyfe-os-logo.webp";
import RecoverySEO from "@/components/RecoverySEO";

const GIFT_TIERS = [
  {
    id: "basic",
    label: "1 Month",
    price: 19,
    amount: 1900,
    headline: "One Month of Never Zero",
    description: "Give a survivor 30 days of the full Warrior system — check-ins, AI Coach, protocols, community.",
    features: [
      "Full 66-Day Challenge access",
      "AI Sasquatch Coach — 24/7",
      "Accountability push alerts",
      "Community access",
      "All protocols & lessons",
    ],
    icon: Zap,
    color: "#E2741B",
  },
  {
    id: "mentored",
    label: "3 Months",
    price: 57,
    amount: 5700,
    headline: "The Habit-Building Window",
    description: "Science says 66 days builds a real habit. Give them 90 days — enough time to feel the shift.",
    features: [
      "Everything in 1 Month",
      "Covers the full 66-Day Challenge",
      "3 months of check-in accountability",
      "Streak milestones celebrated",
      "Real momentum, real change",
    ],
    icon: Star,
    color: "#E2741B",
    popular: true,
  },
  {
    id: "elite",
    label: "Full Year",
    price: 190,
    amount: 19000,
    headline: "Give the Long Game",
    description: "Recovery isn't 66 days. It's years. Give them a full year with Nick's system. This changes lives.",
    features: [
      "Everything in 3 Months",
      "Year 2 protocols unlocked",
      "Priority community access",
      "Annual recovery review",
      "First access to new programs",
    ],
    icon: Crown,
    color: "#8B5CF6",
  },
];

const DONATION_PRESETS = [10, 25, 50];

const IMPACT_STATS = [
  { value: "1 in 4", label: "Survivors can't afford rehab" },
  { value: "$19", label: "One month changes everything" },
  { value: "50K+", label: "Warriors in the community" },
  { value: "Year 7", label: "Nick still recovering, still sharing" },
];

const SS_KEY = "sra:gift-checkout-ctx";

interface GiftConfirmation {
  type: "gift" | "donation" | "gift_and_donation";
  tierId: string;
  recipientEmail: string;
  survivorFund: boolean;
  donorEmail: string;
  donationAmountCents: number;
}

export default function GiftSurvivor() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<"specific" | "fund">("specific");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [addDonation, setAddDonation] = useState(false);
  const [donationPreset, setDonationPreset] = useState<number | null>(25);
  const [donationCustom, setDonationCustom] = useState("");

  const [confirmation, setConfirmation] = useState<GiftConfirmation | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // After Stripe redirect, read ?donated=success&session_id=... from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("donated") !== "success") return;

    const sessionId = params.get("session_id");

    // Remove query params from URL without reload
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    if (sessionId) {
      setConfirmLoading(true);
      fetch(`/api/recovery/payments/gift-checkout-session?sessionId=${encodeURIComponent(sessionId)}`)
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then((data: GiftConfirmation) => setConfirmation(data))
        .catch(() => {
          // Fall back to sessionStorage context saved before redirect
          const raw = sessionStorage.getItem(SS_KEY);
          if (raw) {
            try { setConfirmation(JSON.parse(raw)); } catch {}
          } else {
            setConfirmation({ type: "gift", tierId: "", recipientEmail: "", survivorFund: false, donorEmail: "", donationAmountCents: 0 });
          }
        })
        .finally(() => setConfirmLoading(false));
    } else {
      // No session_id — fall back to sessionStorage
      const raw = sessionStorage.getItem(SS_KEY);
      if (raw) {
        try { setConfirmation(JSON.parse(raw)); } catch {}
      } else {
        setConfirmation({ type: "gift", tierId: "", recipientEmail: "", survivorFund: false, donorEmail: "", donationAmountCents: 0 });
      }
    }
    sessionStorage.removeItem(SS_KEY);
  }, []);

  const resolvedDonationAmount = (() => {
    if (!addDonation || recipientMode === "fund") return 0;
    if (donationPreset !== null) return donationPreset;
    const parsed = parseFloat(donationCustom);
    return isNaN(parsed) || parsed < 1 ? 0 : Math.floor(parsed);
  })();

  const tier = GIFT_TIERS.find(t => t.id === selectedTier);
  const giftTotal = tier ? tier.price + resolvedDonationAmount : 0;

  const giftMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/recovery/payments/gift-scholarship", data),
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        // Direct success without Stripe redirect (shouldn't normally happen)
        setConfirmation({ type: "gift", tierId: selectedTier || "", recipientEmail, survivorFund: recipientMode === "fund", donorEmail, donationAmountCents: 0 });
      }
    },
    onError: () => {
      toast({
        title: "Payment Error",
        description: "Unable to process gift. Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const handleGift = () => {
    if (!tier) return;
    if (recipientMode === "specific" && !recipientEmail) {
      toast({ title: "Recipient email required", description: "Enter the survivor's email to send the gift.", variant: "destructive" });
      return;
    }
    if (!donorEmail) {
      toast({ title: "Your email required", description: "We'll send you a tax receipt and confirmation.", variant: "destructive" });
      return;
    }
    if (addDonation && resolvedDonationAmount < 1 && recipientMode === "specific") {
      toast({ title: "Invalid donation amount", description: "Enter a donation amount of at least $1, or uncheck the donation.", variant: "destructive" });
      return;
    }

    const survivorFund = recipientMode === "fund";
    const donationAmountCents = survivorFund ? 0 : resolvedDonationAmount * 100;
    const type: GiftConfirmation["type"] = survivorFund ? "donation" : donationAmountCents > 0 ? "gift_and_donation" : "gift";

    // Persist context to sessionStorage so confirmation survives Stripe redirect
    const ctx: GiftConfirmation = { type, tierId: selectedTier || "", recipientEmail: survivorFund ? "" : recipientEmail, survivorFund, donorEmail, donationAmountCents };
    sessionStorage.setItem(SS_KEY, JSON.stringify(ctx));

    giftMutation.mutate({ tierId: selectedTier, recipientEmail: survivorFund ? null : recipientEmail, message: message || `From ${donorName || "a supporter"}: You deserve to rebuild. Never Zero.`, donorName, donorEmail, survivorFund, donationAmountCents });
  };

  const SEOTags = (
    <RecoverySEO
      title="Gift a Survivor — Stroke Lyfe Inc."
      description="Sponsor a stroke survivor's recovery through Stroke Lyfe Inc., a 501(c)(3) nonprofit. Gift 1 month ($19), 3 months ($57), or a full year ($190) of Warrior membership. Gift directly, donate to our Survivor Fund, or both. Tax-deductible."
      canonical="/recovery/gift"
      keywords={["gift stroke survivor", "stroke recovery donation", "stroke nonprofit donation", "Stroke Lyfe Inc", "sponsor stroke recovery", "501c3 stroke charity", "gift membership stroke", "stroke survivor fund"]}
      breadcrumbs={[{ name: "Gift a Survivor", url: "/recovery/gift" }]}
      additionalSchema={{
        "@context": "https://schema.org",
        "@type": "DonateAction",
        name: "Gift a Survivor Warrior Membership",
        description: "Donate a Stroke Recovery Academy Warrior membership to a stroke survivor in need through Stroke Lyfe Inc., a 501(c)(3) nonprofit.",
        recipient: { "@type": "NGO", name: "Stroke Lyfe Inc.", url: "https://strokerecoveryacademy.com/recovery/strokelyfe-org" },
      }}
    />
  );

  if (confirmLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        {SEOTags}
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E2741B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Confirming your gift…</p>
        </div>
      </div>
    );
  }

  if (confirmation) {
    const { type, recipientEmail: confRecipient, survivorFund: confFund, donorEmail: confDonor, donationAmountCents: confDonation } = confirmation;
    const donationDollars = Math.round(confDonation / 100);
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        {SEOTags}
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            {type === "donation" ? "Donation Received." : "Gift Sent."}
          </h1>
          <p className="text-gray-400 mb-6">
            {type === "donation"
              ? "Your donation to the Stroke Lyfe Survivor Fund has been received. A survivor who couldn't afford recovery will get access because of you."
              : type === "gift_and_donation"
              ? `Your gift has been sent to ${confRecipient || "the recipient"}. Your $${donationDollars} Survivor Fund donation is also confirmed. You just doubled your impact.`
              : `Your gift has been sent to ${confRecipient || "the recipient"}. They'll receive an email with access instructions. You just changed a warrior's trajectory.`}
          </p>
          {confDonor && (
            <p className="text-xs text-gray-600 mb-6">
              A tax receipt will be sent to {confDonor}. Stroke Lyfe Inc. is a registered 501(c)(3) nonprofit.
            </p>
          )}
          <Button className="bg-[#E2741B] text-black font-black" onClick={() => window.location.href = "/recovery"}>
            Back to Recovery OS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {SEOTags}

      {/* HERO */}
      <section className="py-16 px-4 border-b border-[#222]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <img src={strokeLyfeLogo} alt="Stroke Lyfe OS — Rebuild. Rewire. Rise." className="h-32 w-auto" />
          </div>
          <Badge className="bg-[#E2741B]/20 text-[#E2741B] border-[#E2741B]/30 mb-5 uppercase tracking-widest text-xs">
            <Heart className="h-3 w-3 mr-1" />
            Stroke Lyfe Inc. — 501(c)(3) Nonprofit
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Gift a Survivor<br />
            <span style={{ color: "#E2741B" }}>Their Second Chance.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
            One in four stroke survivors can't afford rehabilitation. The Warrior system — 
            accountability, protocols, AI Coach, community — costs $19 a month. 
            Your gift gives someone what the insurance system won't.
          </p>
          <p className="text-sm text-gray-500 italic">
            "I had nothing when I started. Someone believing in me made the difference." — Nick Kremers, Stroke Survivor, Year 7
          </p>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="py-8 bg-[#111] border-b border-[#222]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {IMPACT_STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-[#E2741B]">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN GIFT FLOW */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Step 1 — Choose tier */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-full bg-[#E2741B] text-black font-black text-sm flex items-center justify-center flex-shrink-0">1</div>
              <h2 className="text-xl font-black text-white">Choose the gift</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {GIFT_TIERS.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedTier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTier(t.id)}
                    className={`text-left rounded-lg border p-5 transition-all relative ${isSelected ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#1a1a1a] hover:border-[#555]"}`}
                    data-testid={`button-tier-${t.id}`}
                  >
                    {t.popular && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="bg-[#E2741B] text-black text-xs font-black">Most Gifted</Badge>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-5 w-5 text-[#E2741B]" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 flex-shrink-0" style={{ color: t.color }} />
                      <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">{t.label}</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">${t.price}</div>
                    <p className="font-bold text-sm mb-1" style={{ color: t.color }}>{t.headline}</p>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">{t.description}</p>
                    <ul className="space-y-1.5">
                      {t.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                          <CheckCircle className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: t.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Who gets it */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-7 h-7 rounded-full font-black text-sm flex items-center justify-center flex-shrink-0 ${selectedTier ? "bg-[#E2741B] text-black" : "bg-[#333] text-gray-500"}`}>2</div>
              <h2 className={`text-xl font-black ${selectedTier ? "text-white" : "text-gray-600"}`}>Who gets the gift?</h2>
            </div>

            {selectedTier && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setRecipientMode("specific"); setAddDonation(false); }}
                    className={`rounded-lg border p-4 text-left transition-all ${recipientMode === "specific" ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#1a1a1a]"}`}
                    data-testid="button-mode-specific"
                  >
                    <Gift className="h-5 w-5 text-[#E2741B] mb-2" />
                    <p className="font-bold text-white text-sm">Gift to someone I know</p>
                    <p className="text-xs text-gray-400">Send directly to a specific survivor's email</p>
                  </button>
                  <button
                    onClick={() => { setRecipientMode("fund"); setAddDonation(false); }}
                    className={`rounded-lg border p-4 text-left transition-all ${recipientMode === "fund" ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#1a1a1a]"}`}
                    data-testid="button-mode-fund"
                  >
                    <Users className="h-5 w-5 text-[#E2741B] mb-2" />
                    <p className="font-bold text-white text-sm">Donate to the Survivor Fund</p>
                    <p className="text-xs text-gray-400">Stroke Lyfe Inc. selects a survivor in need</p>
                  </button>
                </div>

                {recipientMode === "specific" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Survivor's email address *</label>
                      <Input
                        type="email"
                        placeholder="friend@email.com"
                        value={recipientEmail}
                        onChange={e => setRecipientEmail(e.target.value)}
                        className="bg-[#1a1a1a] border-[#333] text-white max-w-md"
                        data-testid="input-recipient-email"
                      />
                      <p className="text-xs text-gray-600 mt-1">They'll receive an email with their access details and your message.</p>
                    </div>

                    {/* Add-a-donation toggle */}
                    <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#111]">
                      <button
                        onClick={() => setAddDonation(v => !v)}
                        className="flex items-center gap-3 w-full text-left"
                        data-testid="button-toggle-donation"
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${addDonation ? "bg-[#E2741B] border-[#E2741B]" : "border-[#555] bg-transparent"}`}>
                          {addDonation && <CheckCircle className="h-3.5 w-3.5 text-black" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Also donate to the Survivor Fund</p>
                          <p className="text-xs text-gray-500">Gift a membership AND fund a stranger's access — both in one checkout.</p>
                        </div>
                      </button>

                      {addDonation && (
                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                          <p className="text-xs text-gray-400 mb-3">Donation amount</p>
                          <div className="flex flex-wrap gap-2">
                            {DONATION_PRESETS.map(amt => (
                              <button
                                key={amt}
                                onClick={() => { setDonationPreset(amt); setDonationCustom(""); }}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all border ${donationPreset === amt ? "bg-[#E2741B] border-[#E2741B] text-black" : "border-[#444] text-gray-300 bg-[#1a1a1a]"}`}
                                data-testid={`button-donation-preset-${amt}`}
                              >
                                ${amt}
                              </button>
                            ))}
                            <button
                              onClick={() => setDonationPreset(null)}
                              className={`px-4 py-1.5 rounded text-sm font-bold transition-all border ${donationPreset === null ? "bg-[#E2741B] border-[#E2741B] text-black" : "border-[#444] text-gray-300 bg-[#1a1a1a]"}`}
                              data-testid="button-donation-custom"
                            >
                              Custom
                            </button>
                          </div>
                          {donationPreset === null && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-gray-400 text-sm">$</span>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Amount"
                                value={donationCustom}
                                onChange={e => setDonationCustom(e.target.value)}
                                className="bg-[#1a1a1a] border-[#333] text-white w-32"
                                data-testid="input-donation-custom-amount"
                              />
                            </div>
                          )}
                          <p className="text-xs text-gray-600 mt-2">
                            Stroke Lyfe Inc. selects a verified applicant from our waitlist. 100% goes to survivor access.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recipientMode === "fund" && (
                  <Card className="bg-[#1a1a1a] border-[#333]">
                    <CardContent className="p-4 flex gap-3 items-start">
                      <Heart className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white mb-1">How the Survivor Fund works</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Stroke Lyfe Inc. maintains a waitlist of survivors who've applied for assistance. 
                          Your donation funds their access. You'll receive a letter confirming who received 
                          your gift (if they consent to share). 100% goes to survivor access — no admin fees.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Personal message to the survivor (optional)</label>
                  <Textarea
                    placeholder={`You are stronger than you know. The Never Zero rule changed my life — I hope it changes yours too.`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="bg-[#1a1a1a] border-[#333] text-white max-w-lg"
                    data-testid="input-gift-message"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 3 — Your info + pay */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-7 h-7 rounded-full font-black text-sm flex items-center justify-center flex-shrink-0 ${selectedTier ? "bg-[#E2741B] text-black" : "bg-[#333] text-gray-500"}`}>3</div>
              <h2 className={`text-xl font-black ${selectedTier ? "text-white" : "text-gray-600"}`}>Your information</h2>
            </div>
            {selectedTier && (
              <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Your name (optional)</label>
                  <Input
                    placeholder="Anonymous"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    className="bg-[#1a1a1a] border-[#333] text-white"
                    data-testid="input-donor-name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Your email * (tax receipt)</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={donorEmail}
                    onChange={e => setDonorEmail(e.target.value)}
                    className="bg-[#1a1a1a] border-[#333] text-white"
                    data-testid="input-donor-email"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          {selectedTier && (
            <div className="border-t border-[#222] pt-8">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-3xl font-black text-white">
                    ${giftTotal}
                    {addDonation && resolvedDonationAmount > 0 && recipientMode === "specific" ? (
                      <span className="text-sm text-gray-400 font-normal ml-2">
                        (${tier?.price} gift + ${resolvedDonationAmount} donation)
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 font-normal ml-2">
                        {tier?.label} {recipientMode === "fund" ? "donation" : "gift"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Tax-deductible donation to Stroke Lyfe Inc. 501(c)(3)</p>
                </div>

                <Button
                  className="bg-[#E2741B] text-black font-black text-lg px-8 py-5"
                  onClick={handleGift}
                  disabled={giftMutation.isPending || !donorEmail}
                  data-testid="button-complete-gift"
                >
                  {giftMutation.isPending ? "Processing..." : (
                    <>
                      {recipientMode === "fund" ? "Donate to Fund" : addDonation && resolvedDonationAmount > 0 ? "Gift + Donate" : "Gift This Warrior"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-[#E2741B]" />Secure payment via Stripe</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-[#E2741B]" />Tax-deductible receipt emailed</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-[#E2741B]" />100% to survivor access</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className="py-16 px-4 bg-[#111] border-t border-[#222]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src={strokeLyfeLogo} alt="Stroke Lyfe OS" className="h-20 mb-6 opacity-90" />
              <h2 className="text-2xl font-black text-white mb-4">
                Stroke Lyfe Inc.<br />
                <span style={{ color: "#E2741B" }}>Rebuild. Rewire. Rise.</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Founded by Nick Kremers after his own stroke at 36, Stroke Lyfe Inc. exists to make 
                survivor-led recovery resources accessible to everyone — regardless of income, insurance, 
                or zip code.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The healthcare system fails most survivors after the first 3 months. We don't. The Warrior 
                membership gives survivors what they need for year 1, year 2, year 5 — and beyond.
              </p>
              <p className="text-gray-500 text-xs">
                Stroke Lyfe Inc. is a registered 501(c)(3) nonprofit organization. 
                EIN available upon request. All donations are tax-deductible to the fullest extent permitted by law.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: "No admin overhead", desc: "100% of your gift funds survivor access. Nick's platform costs are separate from the nonprofit." },
                { title: "Survivor-selected recipients", desc: "We maintain a waitlist of survivors who apply for assistance. Real need, verified by our team." },
                { title: "You see the impact", desc: "With recipient consent, we'll share who received your gift and their first 30-day progress update." },
                { title: "Give both ways at once", desc: "Gift a membership to someone you know and donate to the Survivor Fund — both happen in one checkout." },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-[#E2741B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white text-sm">{title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-12 px-4 text-center border-t border-[#222]">
        <p className="text-gray-400 text-sm mb-2">
          Questions? Contact the Stroke Lyfe nonprofit team:
        </p>
        <a href="mailto:support@strokelyfe.org" className="text-[#E2741B] text-sm font-semibold hover:underline">
          support@strokelyfe.org
        </a>
        <p className="text-gray-600 text-xs mt-4">
          Not medical advice. The Warrior membership is for motivational and informational purposes. 
          Individual results vary. Consult your healthcare provider.
        </p>
      </section>
    </div>
  );
}
