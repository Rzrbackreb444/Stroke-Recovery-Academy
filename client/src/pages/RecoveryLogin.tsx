import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";

type Tab = "signin" | "signup" | "otp";

export default function RecoveryLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Detect ?tab= param
  const params = new URLSearchParams(window.location.search);
  const initialTab = (params.get("tab") === "signup" ? "signup" : "signin") as Tab;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  // Sign in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPw, setSiPw] = useState("");

  // Sign up fields
  const [suFirst, setSuFirst] = useState("");
  const [suLast, setSuLast] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");

  // OTP fields
  const [otpCode, setOtpCode] = useState("");

  // ── Mutations ──────────────────────────────────────────────────────────────
  // Brand-new accounts → onboarding. Returning users with a plan → dashboard.
  async function routeAfterAuth() {
    try {
      const res = await fetch("/api/recovery/me/state", { credentials: "include" });
      if (res.ok) {
        const state = await res.json();
        if (state?.hasOnboarded) {
          window.location.href = "/recovery/dashboard";
          return;
        }
      }
    } catch {
      // fall through to onboarding
    }
    window.location.href = "/recovery/onboarding";
  }

  const signInMut = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiRequest("POST", "/api/auth/login", data),
    onSuccess: () => { routeAfterAuth(); },
    onError: (e: any) => toast({ title: "Sign in failed", description: e.message, variant: "destructive" }),
  });

  const signUpMut = useMutation({
    mutationFn: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      apiRequest("POST", "/api/auth/register", data),
    onSuccess: () => { window.location.href = "/recovery/onboarding"; },
    onError: (e: any) => toast({ title: "Sign up failed", description: e.message, variant: "destructive" }),
  });

  const otpSendMut = useMutation({
    mutationFn: (data: { email: string }) => apiRequest("POST", "/api/auth/otp/send", data),
    onSuccess: () => {
      setOtpEmail(tab === "signin" ? siEmail : suEmail);
      setTab("otp");
      toast({ title: "Code sent", description: "Check your inbox — the code expires in 10 minutes." });
    },
    onError: (e: any) => toast({ title: "Could not send code", description: e.message, variant: "destructive" }),
  });

  const otpVerifyMut = useMutation({
    mutationFn: (data: { email: string; otp: string }) => apiRequest("POST", "/api/auth/otp/verify", data),
    onSuccess: () => { routeAfterAuth(); },
    onError: (e: any) => toast({ title: "Invalid code", description: e.message, variant: "destructive" }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    signInMut.mutate({ email: siEmail.trim(), password: siPw });
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    signUpMut.mutate({ email: suEmail.trim(), password: suPw, firstName: suFirst.trim(), lastName: suLast.trim() });
  }

  function handleSendOtp(forEmail: string) {
    otpSendMut.mutate({ email: forEmail.trim() });
  }

  function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    otpVerifyMut.mutate({ email: otpEmail, otp: otpCode.trim() });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0D0D0D", color: "#E5E5E5" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #222" }}>
        <button
          onClick={() => setLocation("/recovery")}
          className="flex items-center gap-2 text-sm"
          style={{ color: "#999" }}
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Recovery OS
        </button>
        <span
          className="text-xs tracking-widest uppercase font-bold"
          style={{ color: "#E2741B" }}
        >
          Stroke Recovery Academy
        </span>
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-lg p-8"
          style={{ background: "#1a1a1a", border: "1px solid #333" }}
        >
          {/* Logo mark */}
          <div className="mb-8 text-center">
            <div
              className="inline-block text-3xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "Georgia, serif", color: "#FFF" }}
            >
              Recovery OS
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "#E2741B" }}>
              by Nick Kremers · Stroke Survivor Year 7
            </div>
          </div>

          {/* Tab switcher — only show for signin/signup */}
          {tab !== "otp" && (
            <div
              className="flex rounded-md mb-8 overflow-hidden"
              style={{ background: "#111", border: "1px solid #333" }}
            >
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: tab === t ? "#E2741B" : "transparent",
                    color: tab === t ? "#000" : "#999",
                    fontFamily: "Arial, sans-serif",
                  }}
                  data-testid={`tab-${t}`}
                >
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* ── SIGN IN ────────────────────────────────────────────────────── */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5" data-testid="form-signin">
              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
                  <Input
                    type="email"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    required
                    placeholder="you@email.com"
                    className="pl-9"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                    data-testid="input-signin-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={siPw}
                    onChange={(e) => setSiPw(e.target.value)}
                    required
                    placeholder="Your password"
                    className="pl-9 pr-10"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                    data-testid="input-signin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#555" }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold tracking-wide"
                style={{ background: "#E2741B", color: "#000" }}
                disabled={signInMut.isPending}
                data-testid="button-signin-submit"
              >
                {signInMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>

              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: "#333" }} />
                <span className="text-xs" style={{ color: "#555" }}>or sign in with a code</span>
                <div className="flex-1 h-px" style={{ background: "#333" }} />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                style={{ borderColor: "#333", color: "#999", background: "transparent" }}
                disabled={otpSendMut.isPending || !siEmail}
                onClick={() => handleSendOtp(siEmail)}
                data-testid="button-signin-otp"
              >
                {otpSendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a one-time code"}
              </Button>
            </form>
          )}

          {/* ── SIGN UP ────────────────────────────────────────────────────── */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5" data-testid="form-signup">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
                    <Input
                      value={suFirst}
                      onChange={(e) => setSuFirst(e.target.value)}
                      required
                      placeholder="Nick"
                      className="pl-9"
                      style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                      data-testid="input-signup-firstname"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>Last name</Label>
                  <Input
                    value={suLast}
                    onChange={(e) => setSuLast(e.target.value)}
                    placeholder="Kremers"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                    data-testid="input-signup-lastname"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
                  <Input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                    placeholder="you@email.com"
                    className="pl-9"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                    data-testid="input-signup-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={suPw}
                    onChange={(e) => setSuPw(e.target.value)}
                    required
                    minLength={8}
                    placeholder="8+ characters"
                    className="pl-9 pr-10"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5" }}
                    data-testid="input-signup-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#555" }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold tracking-wide"
                style={{ background: "#E2741B", color: "#000" }}
                disabled={signUpMut.isPending}
                data-testid="button-signup-submit"
              >
                {signUpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>

              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: "#333" }} />
                <span className="text-xs" style={{ color: "#555" }}>or join with a code</span>
                <div className="flex-1 h-px" style={{ background: "#333" }} />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                style={{ borderColor: "#333", color: "#999", background: "transparent" }}
                disabled={otpSendMut.isPending || !suEmail}
                onClick={() => handleSendOtp(suEmail)}
                data-testid="button-signup-otp"
              >
                {otpSendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a one-time code instead"}
              </Button>

              <p className="text-xs text-center" style={{ color: "#555" }}>
                By joining you agree to receive The Sasquatch Dispatch newsletter.
                Unsubscribe any time.
              </p>
            </form>
          )}

          {/* ── OTP VERIFY ─────────────────────────────────────────────────── */}
          {tab === "otp" && (
            <div data-testid="form-otp">
              <div className="mb-6 text-center">
                <Mail className="h-10 w-10 mx-auto mb-3" style={{ color: "#E2741B" }} />
                <p className="text-sm" style={{ color: "#999" }}>
                  We sent a 6-digit code to
                </p>
                <p className="font-semibold" style={{ color: "#E5E5E5" }}>{otpEmail}</p>
                <p className="text-xs mt-1" style={{ color: "#666" }}>Code expires in 10 minutes</p>
              </div>

              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase" style={{ color: "#999" }}>
                    Enter your code
                  </Label>
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-bold"
                    style={{ background: "#111", border: "1px solid #333", color: "#E5E5E5", height: "56px" }}
                    data-testid="input-otp-code"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold"
                  style={{ background: "#E2741B", color: "#000" }}
                  disabled={otpVerifyMut.isPending || otpCode.length < 6}
                  data-testid="button-otp-verify"
                >
                  {otpVerifyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enter"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  style={{ color: "#666" }}
                  onClick={() => { setOtpCode(""); setTab(initialTab); }}
                  data-testid="button-otp-back"
                >
                  Go back
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-center"
                  style={{ color: "#555" }}
                  onClick={() => handleSendOtp(otpEmail)}
                  data-testid="button-otp-resend"
                >
                  Didn't get it? Resend code
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer quote */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs italic" style={{ color: "#444" }}>
          "Heart still thumpin'? Then your life is still pumpin'. Get to work." — Nick Kremers
        </p>
      </div>
    </div>
  );
}
