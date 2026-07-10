import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { SiGoogle, SiFacebook, SiGithub, SiApple } from "react-icons/si";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

const oauthProviders = [
  { id: "google", name: "Google", icon: SiGoogle, color: "#4285F4", bgColor: "bg-white hover:bg-gray-50", textColor: "text-gray-700" },
  { id: "facebook", name: "Facebook", icon: SiFacebook, color: "#1877F2", bgColor: "bg-[#1877F2] hover:bg-[#1877F2]/90", textColor: "text-white" },
  { id: "github", name: "GitHub", icon: SiGithub, color: "#333", bgColor: "bg-[#333] hover:bg-[#333]/90", textColor: "text-white" },
  { id: "apple", name: "Apple", icon: SiApple, color: "#000", bgColor: "bg-black hover:bg-black/90", textColor: "text-white" },
];

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register" | "magic_link" | "forgot_password">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({ title: "Welcome back!", description: "You've been logged in successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid email or password",
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      return apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({ title: "Account created!", description: "Welcome to Stroke Recovery Academy! You're now logged in." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Could not create account",
        variant: "destructive" 
      });
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/auth/magic-link", { email });
    },
    onSuccess: () => {
      toast({ 
        title: "Magic link sent!", 
        description: "Check your email for a login link." 
      });
      setMode("login");
    },
    onError: () => {
      toast({ 
        title: "Failed to send", 
        description: "Could not send magic link. Try again.",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "login") {
      loginMutation.mutate({ email: formData.email, password: formData.password });
    } else if (mode === "register") {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
      if (formData.password.length < 8) {
        toast({ title: "Password must be at least 8 characters", variant: "destructive" });
        return;
      }
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    } else if (mode === "magic_link") {
      magicLinkMutation.mutate(formData.email);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || magicLinkMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#FAF8F3]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-[#E2741B] rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-serif">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "magic_link" && "Magic Link Login"}
            {mode === "forgot_password" && "Reset Password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" && "Sign in to access your creator dashboard"}
            {mode === "register" && "Join 50,000+ stroke survivors on Stroke Recovery Academy"}
            {mode === "magic_link" && "We'll send you a secure login link"}
            {mode === "forgot_password" && "Enter your email to reset password"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(mode === "login" || mode === "register") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={`${provider.bgColor} ${provider.textColor} border-gray-200`}
                    onClick={() => handleOAuthLogin(provider.id)}
                    data-testid={`button-oauth-${provider.id}`}
                  >
                    <provider.icon className="w-4 h-4 mr-2" />
                    {provider.name}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#FAF8F3] px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="pl-10"
                      data-testid="input-first-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            {(mode === "login" || mode === "register") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0 h-auto text-xs text-[#E2741B]"
                      onClick={() => setMode("forgot_password")}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    required
                    minLength={8}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#E2741B] hover:bg-[#E2741B]/90"
              disabled={isLoading}
              data-testid="button-submit-auth"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {mode === "login" && "Sign In"}
              {mode === "register" && "Create Account"}
              {mode === "magic_link" && "Send Magic Link"}
              {mode === "forgot_password" && "Reset Password"}
            </Button>
          </form>

          {mode === "login" && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setMode("magic_link")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Magic Link
            </Button>
          )}

          <div className="text-center text-sm">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <Button variant="ghost" className="p-0 h-auto text-[#E2741B]" onClick={() => setMode("register")}>
                  Sign up
                </Button>
              </p>
            ) : mode === "register" ? (
              <p>
                Already have an account?{" "}
                <Button variant="ghost" className="p-0 h-auto text-[#E2741B]" onClick={() => setMode("login")}>
                  Sign in
                </Button>
              </p>
            ) : (
              <Button variant="ghost" className="p-0 h-auto text-[#E2741B]" onClick={() => setMode("login")}>
                Back to sign in
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
