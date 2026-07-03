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

  const C = {
    page: "#FDFBF7",
    card: "#FFFFFF",
    border: "#E2C2A4",
    borderLight: "#EDD9C3",
    inputBg: "#FDFBF7",
    text: "#2A2421",
    secondary: "#78716C",
    tertiary: "#A8A29E",
    accent: "#C06B3E",
    accentHover: "#A85B33",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.page, color: C.text }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.borderLight }}>
        <button
          onClick={() => setLocation("/recovery")}
          className="flex items-center gap-2 text-sm transition-colors hover:text-[#C06B3E]"
          style={{ color: C.secondary }}
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs tracking-widest uppercase font-bold" style={{ color: C.accent }}>
          Stroke Recovery Academy
        </span>
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-xl p-8 shadow-[0_2px_16px_rgba(44,34,27,0.08)]"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* Logo mark */}
          <div className="mb-8 text-center">
            <div className="text-2xl font-bold tracking-tight mb-1" style={{ color: C.text, fontFamily: "Georgia, serif" }}>
              Recovery OS
            </div>
            <div className="text-xs tracking-widest uppercase font-semibold" style={{ color: C.accent }}>
              by Nick Kremers · Stroke Survivor Year 7
            </div>
          </div>

          {/* Tab switcher */}
          {tab !== "otp" && (
            <div
              className="flex rounded-lg mb-7 overflow-hidden"
              style={{ background: "#F5EFE8", border: `1px solid ${C.borderLight}` }}
            >
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: tab === t ? C.accent : "transparent",
                    color: tab === t ? "#FFF" : C.secondary,
                    borderRadius: "6px",
                  }}
                  data-testid={`tab-${t}`}
                >
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* ── SIGN IN ────────────────────────────────────────────────── */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-5" data-testid="form-signin">
              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.tertiary }} />
                  <Input
                    type="email"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    required
                    placeholder="you@email.com"
                    className="pl-9"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                    data-testid="input-signin-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.tertiary }} />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={siPw}
                    onChange={(e) => setSiPw(e.target.value)}
                    required
                    placeholder="Your password"
                    className="pl-9 pr-10"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                    data-testid="input-signin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[#C06B3E]"
                    style={{ color: C.tertiary }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold tracking-wide text-white"
                style={{ background: C.accent }}
                disabled={signInMut.isPending}
                data-testid="button-signin-submit"
              >
                {signInMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>

              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: C.borderLight }} />
                <span className="text-xs" style={{ color: C.tertiary }}>or sign in with a one-time code</span>
                <div className="flex-1 h-px" style={{ background: C.borderLight }} />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                style={{ borderColor: C.border, color: C.secondary }}
                disabled={otpSendMut.isPending || !siEmail}
                onClick={() => handleSendOtp(siEmail)}
                data-testid="button-signin-otp"
              >
                {otpSendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a one-time code"}
              </Button>
            </form>
          )}

          {/* ── SIGN UP ────────────────────────────────────────────────── */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-5" data-testid="form-signup">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.tertiary }} />
                    <Input
                      value={suFirst}
                      onChange={(e) => setSuFirst(e.target.value)}
                      required
                      placeholder="Nick"
                      className="pl-9"
                      style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                      data-testid="input-signup-firstname"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>Last name</Label>
                  <Input
                    value={suLast}
                    onChange={(e) => setSuLast(e.target.value)}
                    placeholder="Kremers"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                    data-testid="input-signup-lastname"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.tertiary }} />
                  <Input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                    placeholder="you@email.com"
                    className="pl-9"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                    data-testid="input-signup-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.tertiary }} />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={suPw}
                    onChange={(e) => setSuPw(e.target.value)}
                    required
                    minLength={8}
                    placeholder="8+ characters"
                    className="pl-9 pr-10"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text }}
                    data-testid="input-signup-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[#C06B3E]"
                    style={{ color: C.tertiary }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold tracking-wide text-white"
                style={{ background: C.accent }}
                disabled={signUpMut.isPending}
                data-testid="button-signup-submit"
              >
                {signUpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>

              <div className="relative flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: C.borderLight }} />
                <span className="text-xs" style={{ color: C.tertiary }}>or join with a one-time code</span>
                <div className="flex-1 h-px" style={{ background: C.borderLight }} />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                style={{ borderColor: C.border, color: C.secondary }}
                disabled={otpSendMut.isPending || !suEmail}
                onClick={() => handleSendOtp(suEmail)}
                data-testid="button-signup-otp"
              >
                {otpSendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a one-time code instead"}
              </Button>

              <p className="text-xs text-center" style={{ color: C.tertiary }}>
                By joining you agree to receive The Sasquatch Dispatch newsletter.{" "}
                Unsubscribe any time.
              </p>
            </form>
          )}

          {/* ── OTP VERIFY ──────────────────────────────────────────────── */}
          {tab === "otp" && (
            <div data-testid="form-otp">
              <div className="mb-6 text-center">
                <Mail className="h-10 w-10 mx-auto mb-3" style={{ color: C.accent }} />
                <p className="text-sm" style={{ color: C.secondary }}>We sent a 6-digit code to</p>
                <p className="font-semibold mt-1" style={{ color: C.text }}>{otpEmail}</p>
                <p className="text-xs mt-1" style={{ color: C.tertiary }}>Code expires in 10 minutes</p>
              </div>

              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider uppercase font-semibold" style={{ color: C.secondary }}>
                    Enter your code
                  </Label>
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-bold"
                    style={{ background: C.inputBg, borderColor: C.border, color: C.text, height: "56px" }}
                    data-testid="input-otp-code"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold text-white"
                  style={{ background: C.accent }}
                  disabled={otpVerifyMut.isPending || otpCode.length < 6}
                  data-testid="button-otp-verify"
                >
                  {otpVerifyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Enter"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  style={{ color: C.secondary }}
                  onClick={() => { setOtpCode(""); setTab(initialTab); }}
                  data-testid="button-otp-back"
                >
                  Go back
                </Button>

                <button
                  type="button"
                  className="w-full text-xs text-center transition-colors hover:text-[#C06B3E]"
                  style={{ color: C.tertiary }}
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
        <p className="text-xs italic" style={{ color: C.tertiary }}>
          "Heart still thumpin'? Then your life is still pumpin'. Get to work." — Nick Kremers
        </p>
      </div>
    </div>
  );
}
