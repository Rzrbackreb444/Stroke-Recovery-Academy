import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import kreaiteLogo from "@assets/Untitled_design.zip_-_1_1769816069353.png";
import { Button } from "@/components/ui/button";

export default function AuthVerify() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("GET", `/api/email-auth/verify-magic-link?token=${token}`);
      return response.json();
    },
    onSuccess: (data) => {
      setStatus("success");
      queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
      toast({ title: "Welcome back!", description: "You've been signed in successfully" });
      setTimeout(() => setLocation("/creator-hub"), 2000);
    },
    onError: (error: any) => {
      setStatus("error");
      setErrorMessage(error.message || "Invalid or expired magic link");
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setStatus("error");
      setErrorMessage("No verification token provided");
    }
  }, [search]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
        <CardContent className="pt-8 pb-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Verifying your link...</h2>
              <p className="text-white/60">Please wait while we sign you in</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">You're in!</h2>
              <p className="text-white/60 mb-6">Redirecting you to your dashboard...</p>
              <div className="flex items-center justify-center">
                <img 
                  src={kreaiteLogo} 
                  alt="Welcome to KreAIte" 
                  className="h-8 w-auto object-contain"
                />
              </div>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
              <p className="text-white/60 mb-6">{errorMessage}</p>
              <Button
                onClick={() => setLocation("/auth")}
                className="bg-amber-500 hover:bg-amber-400 text-black"
              >
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
