import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import nickPhoto from "@assets/IMG_4824_1776397947955.jpeg";

interface Props {
  source?: string;
  headline?: string;
  subheadline?: string;
  compact?: boolean;
}

export default function NewsletterSignupWidget({
  source = "website",
  headline = "Get The Sasquatch Dispatch",
  subheadline = "10 real emails from a stroke survivor — sent over 67 days. No fluff. No toxic positivity. Just the stuff that actually works.",
  compact = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [done, setDone] = useState(false);

  const subscribeMut = useMutation({
    mutationFn: (data: { email: string; firstName?: string; source: string }) =>
      apiRequest("POST", "/api/newsletter/subscribe", data),
    onSuccess: () => setDone(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    subscribeMut.mutate({ email: email.trim(), firstName: firstName.trim() || undefined, source });
  }

  if (done) {
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{ background: "#1a1a1a", border: "1px solid #333" }}
        data-testid="newsletter-success"
      >
        <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "#C9941A" }} />
        <p className="font-bold text-lg" style={{ color: "#FFF", fontFamily: "Georgia, serif" }}>
          You're in.
        </p>
        <p className="text-sm mt-2" style={{ color: "#999" }}>
          First email arrives in 3 days. Keep your eyes on your inbox —
          it's the one that starts with "I wanted to drive into traffic."
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap" data-testid="newsletter-form-compact">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Your email address"
          className="flex-1 min-w-[200px]"
          style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
          data-testid="input-newsletter-email"
        />
        <Button
          type="submit"
          disabled={subscribeMut.isPending}
          style={{ background: "#C9941A", color: "#000", fontWeight: 700 }}
          data-testid="button-newsletter-subscribe"
        >
          {subscribeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe Free"}
        </Button>
        {subscribeMut.isError && (
          <p className="w-full text-xs" style={{ color: "#ef4444" }}>
            {(subscribeMut.error as any)?.message || "Something went wrong. Try again."}
          </p>
        )}
      </form>
    );
  }

  return (
    <div
      className="rounded-lg p-8"
      style={{ background: "#1a1a1a", border: "1px solid #333" }}
      data-testid="newsletter-form-full"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="rounded-full p-2.5 shrink-0"
          style={{ background: "#2a1f00", border: "1px solid #C9941A" }}
        >
          <Mail className="h-5 w-5" style={{ color: "#C9941A" }} />
        </div>
        <div>
          <h3
            className="text-xl font-bold leading-tight mb-1"
            style={{ color: "#FFF", fontFamily: "Georgia, serif" }}
          >
            {headline}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "#999" }}>
            {subheadline}
          </p>
        </div>
      </div>

      {/* Edition preview */}
      <div
        className="rounded mb-6 p-4"
        style={{ background: "#111", border: "1px solid #2a2a2a" }}
      >
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#C9941A", fontWeight: 700 }}>
          10 editions. 67 days. Real content.
        </p>
        <ul className="space-y-1.5">
          {[
            "Day 3 — \"I wanted to drive into traffic.\"",
            "Day 7 — Why doctors were wrong about me",
            "Day 14 — What 66 days does to a recovering brain",
            "Day 21 — You're not stuck. You're in the plateau.",
            "Day 30 — Build in public. Do it anyway.",
            "...5 more editions through Day 67",
          ].map((item, i) => (
            <li key={i} className="text-xs flex items-center gap-2" style={{ color: "#888" }}>
              <span style={{ color: "#C9941A", fontSize: "8px" }}>◆</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
            style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
            data-testid="input-newsletter-firstname"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Your email address"
            style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
            data-testid="input-newsletter-email"
          />
        </div>

        {subscribeMut.isError && (
          <p className="text-xs" style={{ color: "#ef4444" }}>
            {(subscribeMut.error as any)?.message || "Something went wrong. Try again."}
          </p>
        )}

        <Button
          type="submit"
          className="w-full font-bold tracking-wide"
          style={{ background: "#C9941A", color: "#000" }}
          disabled={subscribeMut.isPending}
          data-testid="button-newsletter-subscribe"
        >
          {subscribeMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Send Me The Dispatch — Free"
          )}
        </Button>

        <p className="text-xs text-center" style={{ color: "#555" }}>
          No spam. Unsubscribe any time. Nick actually writes these.
        </p>
      </form>
    </div>
  );
}
