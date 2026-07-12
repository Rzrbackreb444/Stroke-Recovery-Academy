import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import kreaiteLogo from "@assets/Untitled_design.zip_-_1_1769816069353.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiGoogle } from "react-icons/si";
import {
  Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff,
  Wand2, Check, Crown, Zap, Star, ArrowLeft, KeyRound,
} from "lucide-react";

// AuthMode philosophy:
//   "otp"          — DEFAULT. Email + 6-digit code. No password to remember.
//                    Survivor-first: many users have aphasia or memory deficits
//                    after a stroke; OTP removes the password burden entirely.
//   "password"     — Returning users with an established password.
//   "register"     — Create-account form (still password-based for users who
//                    explicitly want one).
//   "magic-link"   — Email a one-tap link instead of a code.
//   "forgot-password" — Standard reset flow.
//
// Replit Auth is intentionally a small fallback link below the card, NOT a
// primary button — survivors found the developer-branded "Continue with Replit"
// confusing/cheap-looking.
type AuthMode = "otp" | "password" | "register" | "magic-link" | "forgot-password";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("otp");

  // Show error toast when landing with ?error= (e.g. failed Google OAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      const messages: Record<string, string> = {
        google_token: "Google sign-in failed. Try email instead.",
        google: "Google sign-in failed. Try email instead.",
        oauth: "Sign-in failed. Try another method.",
      };
      toast({
        title: "Sign-in failed",
        description: messages[err] || "Something went wrong. Try again.",
        variant: "destructive",
      });
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Probe configured social providers so we only render Google if the server
  // actually has GOOGLE_CLIENT_ID. Avoids a dead button.
  const { data: providersData } = useQuery<{ providers: string[] }>({
    queryKey: ["/api/auth/providers"],
    staleTime: 60_000,
  });
  const googleEnabled = providersData?.providers?.includes("google") ?? false;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/otp/send", { email });
      return r.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({ title: "Code sent", description: `Check ${email} for your 6-digit code` });
    },
    onError: (e: any) => {
      toast({ title: "Couldn't send code", description: e.message || "Try again", variant: "destructive" });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/otp/verify", { email, otp });
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Welcome!", description: "You're signed in" });
      // New OTP accounts go to /welcome (intake-first); returning users go to
      // the creator hub. Server flags isNewUser via the OTP verify response.
      setLocation(data?.isNewUser ? "/welcome" : "/creator-hub");
    },
    onError: (e: any) => {
      toast({ title: "Invalid code", description: e.message || "Check the code and try again", variant: "destructive" });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/email-auth/login", { email, password });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Welcome back!", description: "You've successfully signed in" });
      setLocation("/creator-hub");
    },
    onError: (e: any) => {
      toast({ title: "Login failed", description: e.message || "Invalid credentials", variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/email-auth/register", { email, password, firstName, lastName });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Account created!", description: "Welcome to Stroke Recovery Academy" });
      setLocation("/welcome");
    },
    onError: (e: any) => {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/email-auth/magic-link", { email });
      return r.json();
    },
    onSuccess: () => {
      setMagicLinkSent(true);
      toast({ title: "Magic link sent!", description: "Check your email to sign in" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/email-auth/forgot-password", { email });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Reset link sent", description: "Check your email to reset your password" });
    },
    onError: (e: any) => {
      toast({ title: "Request failed", description: e.message, variant: "destructive" });
    },
  });

  // Reset OTP step state when leaving OTP mode so the form re-arms cleanly.
  useEffect(() => {
    if (mode !== "otp") {
      setOtpSent(false);
      setOtp("");
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "otp") {
      if (!otpSent) sendOtpMutation.mutate();
      else verifyOtpMutation.mutate();
    } else if (mode === "password") {
      loginMutation.mutate();
    } else if (mode === "register") {
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
      registerMutation.mutate();
    } else if (mode === "magic-link") {
      magicLinkMutation.mutate();
    } else if (mode === "forgot-password") {
      forgotPasswordMutation.mutate();
    }
  };

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    loginMutation.isPending ||
    registerMutation.isPending ||
    magicLinkMutation.isPending ||
    forgotPasswordMutation.isPending;

  const features = [
    { icon: Crown, text: "7 Premium AI Studios" },
    { icon: Zap, text: "10+ AI Models Integrated" },
    { icon: Star, text: "85/15 Creator Revenue Split" },
  ];

  // Title/description derived from mode so we keep one card layout.
  const cardTitle = {
    otp: otpSent ? "Enter Your Code" : "Sign In with Email",
    password: "Sign in with Password",
    register: "Create Account",
    "magic-link": "Magic Link Sign In",
    "forgot-password": "Reset Password",
  }[mode];

  const cardDescription = {
    otp: otpSent
      ? `We sent a 6-digit code to ${email}`
      : "We'll email you a 6-digit code — no password needed",
    password: "Use your saved password",
    register: "Join survivors and creators worldwide",
    "magic-link": "We'll email you a one-tap sign-in link",
    "forgot-password": "Enter your email to reset password",
  }[mode];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aDZ2NmgtdnptLTYgNmg2di02aC02djZ6bTAtMTJoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <img
                src={kreaiteLogo}
                alt="Stroke Recovery Academy"
                className="h-12 w-auto object-contain"
              />
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Rebuild.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Rewire.
              </span><br />
              Rise.
            </h1>

            <p className="text-xl text-white/60 mb-12 max-w-md">
              The survivor-first stroke recovery platform. Daily routines, AI coach, and a community that gets it.
            </p>

            <div className="space-y-4">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3 text-white/80">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Icon className="w-5 h-5 text-[#E2741B]" />
                    </div>
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-white/40 text-sm">
            Built by survivors, for survivors.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img
              src={kreaiteLogo}
              alt="Stroke Recovery Academy"
              className="h-10 w-auto object-contain"
            />
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-white" data-testid="text-auth-title">
                {cardTitle}
              </CardTitle>
              <CardDescription className="text-white/60">
                {cardDescription}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {magicLinkSent && mode === "magic-link" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E2741B]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#E2741B]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
                  <p className="text-white/60 text-sm mb-6">
                    We've sent a magic link to <strong className="text-white">{email}</strong>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => { setMagicLinkSent(false); setMode("otp"); }}
                    className="text-[#E2741B]"
                    data-testid="button-back-from-magic-link"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  {/* ── Google + Replit social row (above email form) ──────
                     Shown only on the entry modes (otp / password / register).
                     Hidden on magic-link / forgot-password to keep the focused
                     flow uncluttered. */}
                  {(mode === "otp" || mode === "password" || mode === "register") && !otpSent && (
                    <div className="space-y-3 mb-6">
                      {googleEnabled && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { window.location.href = "/api/auth/google"; }}
                          className="w-full border-white/20 text-white hover:bg-white/10"
                          data-testid="button-google-signin"
                        >
                          <SiGoogle className="w-4 h-4 mr-2" />
                          Continue with Google
                        </Button>
                      )}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#0a0a0a] px-4 text-sm text-white/40">or use email</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white/80 text-sm">First Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Jane"
                              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                              data-testid="input-first-name"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-white/80 text-sm">Last Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Doe"
                              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                              data-testid="input-last-name"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email field — hidden on the OTP "enter code" step */}
                    {!(mode === "otp" && otpSent) && (
                      <div>
                        <Label className="text-white/80 text-sm">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            data-testid="input-email"
                          />
                        </div>
                      </div>
                    )}

                    {/* OTP code field — only on the "enter code" step */}
                    {mode === "otp" && otpSent && (
                      <div>
                        <Label className="text-white/80 text-sm">6-Digit Code</Label>
                        <div className="relative mt-1">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            required
                            autoFocus
                            autoComplete="one-time-code"
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 tracking-[0.5em] text-center text-lg"
                            data-testid="input-otp"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtp(""); }}
                          className="text-xs text-white/50 hover:text-white/80 mt-2"
                          data-testid="button-otp-change-email"
                        >
                          Use a different email
                        </button>
                      </div>
                    )}

                    {(mode === "password" || mode === "register") && (
                      <div>
                        <Label className="text-white/80 text-sm">Password</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            autoComplete={mode === "register" ? "new-password" : "current-password"}
                            className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                            data-testid="button-toggle-password-visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === "register" && (
                      <div>
                        <Label className="text-white/80 text-sm">Confirm Password</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                            autoComplete="new-password"
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            data-testid="input-confirm-password"
                          />
                        </div>
                      </div>
                    )}

                    {mode === "password" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-sm text-[#E2741B] hover:text-amber-300"
                          data-testid="button-forgot-password"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold py-6"
                      data-testid="button-submit-auth"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {mode === "otp" && (otpSent ? "Verify & Sign In" : "Send Code")}
                          {mode === "password" && "Sign In"}
                          {mode === "register" && "Create Account"}
                          {mode === "magic-link" && "Send Magic Link"}
                          {mode === "forgot-password" && "Send Reset Link"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    {/* Resend code on the OTP "enter code" step */}
                    {mode === "otp" && otpSent && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={sendOtpMutation.isPending}
                        onClick={() => sendOtpMutation.mutate()}
                        className="w-full text-white/60 hover:text-white"
                        data-testid="button-otp-resend"
                      >
                        {sendOtpMutation.isPending ? "Sending…" : "Didn't get it? Resend code"}
                      </Button>
                    )}

                    {/* Mode switchers — secondary options */}
                    {mode === "otp" && !otpSent && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("password")}
                          className="border-white/20 text-white hover:bg-white/10"
                          data-testid="button-mode-password"
                        >
                          <Lock className="w-4 h-4 mr-2 text-[#E2741B]" />
                          Password
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("magic-link")}
                          className="border-white/20 text-white hover:bg-white/10"
                          data-testid="button-mode-magic-link"
                        >
                          <Wand2 className="w-4 h-4 mr-2 text-[#E2741B]" />
                          Magic link
                        </Button>
                      </div>
                    )}

                    {mode === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMode("otp")}
                        className="w-full text-white/60 hover:text-white"
                        data-testid="button-back-to-otp"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Use a code instead
                      </Button>
                    )}

                    {(mode === "magic-link" || mode === "forgot-password") && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setMode("otp")}
                        className="w-full text-white/60 hover:text-white"
                        data-testid="button-back-to-signin"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sign In
                      </Button>
                    )}
                  </form>
                </>
              )}

              {/* Sign-up / Sign-in toggle */}
              {!magicLinkSent && (mode === "otp" || mode === "password" || mode === "register") && (
                <div className="mt-6 text-center">
                  {mode === "register" ? (
                    <p className="text-white/60 text-sm">
                      Already have an account?{" "}
                      <button
                        onClick={() => setMode("otp")}
                        className="text-[#E2741B] hover:text-amber-300 font-medium"
                        data-testid="button-toggle-signin"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p className="text-white/60 text-sm">
                      New here?{" "}
                      <button
                        onClick={() => setMode("register")}
                        className="text-[#E2741B] hover:text-amber-300 font-medium"
                        data-testid="button-toggle-register"
                      >
                        Create an account
                      </button>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replit Auth fallback — small, low-emphasis, below the card */}
          <div className="mt-6 text-center">
            <a
              href="/api/login"
              className="text-xs text-white/40 hover:text-white/70 underline underline-offset-4"
              data-testid="link-replit-fallback"
            >
              Or continue with Replit
            </a>
          </div>

          <p className="text-center text-white/40 text-xs mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
