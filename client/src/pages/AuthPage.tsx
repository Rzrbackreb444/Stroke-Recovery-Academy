import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import kreaiteLogo from "@assets/Untitled_design.zip_-_1_1769816069353.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff,
  Wand2, Check, Crown, Zap, Star, ArrowLeft
} from "lucide-react";

type AuthMode = "login" | "register" | "magic-link" | "forgot-password";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Welcome back!", description: "You've successfully signed in" });
      setLocation("/creator-hub");
    },
    onError: (error: any) => {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-auth/register", {
        email,
        password,
        firstName,
        lastName,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Account created!", description: "Welcome to Stroke Recovery Academy" });
      setLocation("/creator-hub");
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  });

  const magicLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-auth/magic-link", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setMagicLinkSent(true);
      toast({ title: "Magic link sent!", description: "Check your email to sign in" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-auth/forgot-password", { email });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reset link sent", description: "Check your email to reset your password" });
    },
    onError: (error: any) => {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register" && password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    
    if (mode === "login") loginMutation.mutate();
    else if (mode === "register") registerMutation.mutate();
    else if (mode === "magic-link") magicLinkMutation.mutate();
    else if (mode === "forgot-password") forgotPasswordMutation.mutate();
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || 
                    magicLinkMutation.isPending || forgotPasswordMutation.isPending;

  const features = [
    { icon: Crown, text: "7 Premium AI Studios" },
    { icon: Zap, text: "10+ AI Models Integrated" },
    { icon: Star, text: "85/15 Creator Revenue Split" },
  ];

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
              Create.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Publish.
              </span><br />
              Earn.
            </h1>
            
            <p className="text-xl text-white/60 mb-12 max-w-md">
              The world's most powerful AI creator platform. Turn your imagination into reality with our 7 professional studios.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="flex items-center gap-3 text-white/80">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Icon className="w-5 h-5 text-[#C9941A]" />
                    </div>
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-white/40 text-sm">
            Trusted by 50M+ creators worldwide
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
              <CardTitle className="text-2xl text-white">
                {mode === "login" && "Welcome Back"}
                {mode === "register" && "Create Account"}
                {mode === "magic-link" && "Magic Link Sign In"}
                {mode === "forgot-password" && "Reset Password"}
              </CardTitle>
              <CardDescription className="text-white/60">
                {mode === "login" && "Sign in to your Stroke Recovery Academy account"}
                {mode === "register" && "Join 50M+ creators on Stroke Recovery Academy"}
                {mode === "magic-link" && "We'll email you a secure sign in link"}
                {mode === "forgot-password" && "Enter your email to reset password"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {magicLinkSent && mode === "magic-link" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C9941A]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#C9941A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
                  <p className="text-white/60 text-sm mb-6">
                    We've sent a magic link to <strong className="text-white">{email}</strong>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => { setMagicLinkSent(false); setMode("login"); }}
                    className="text-[#C9941A]"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
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
                            placeholder="John"
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
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  
                  {(mode === "login" || mode === "register") && (
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
                          className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
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
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </div>
                  )}
                  
                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode("forgot-password")}
                        className="text-sm text-[#C9941A] hover:text-amber-300"
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
                        {mode === "login" && "Sign In"}
                        {mode === "register" && "Create Account"}
                        {mode === "magic-link" && "Send Magic Link"}
                        {mode === "forgot-password" && "Send Reset Link"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  {(mode === "login" || mode === "register") && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#0a0a0a] px-4 text-sm text-white/40">or</span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMode("magic-link")}
                        className="w-full border-white/20 text-white hover:bg-white/10"
                        data-testid="button-magic-link"
                      >
                        <Wand2 className="w-4 h-4 mr-2 text-[#C9941A]" />
                        Sign in with Magic Link
                      </Button>
                    </>
                  )}
                  
                  {(mode === "magic-link" || mode === "forgot-password") && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMode("login")}
                      className="w-full text-white/60 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  )}
                </form>
              )}
              
              <div className="mt-6 text-center">
                {mode === "login" ? (
                  <p className="text-white/60 text-sm">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-[#C9941A] hover:text-amber-300 font-medium"
                    >
                      Sign up free
                    </button>
                  </p>
                ) : mode === "register" ? (
                  <p className="text-white/60 text-sm">
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-[#C9941A] hover:text-amber-300 font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-white/40 text-xs mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
