import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { routeAfterAuth } from "@/lib/postAuthRedirect";

// Canonical magic-link verification landing for emailed links of the form
// /magic-link/verify/:token (magicLinkService, passport session). The sign-in
// FORM was consolidated into the canonical /auth page — /magic-link now
// redirects there. This verify screen is kept so already-sent links never 404.
export function MagicLinkVerify() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!params.token) {
        setStatus("error");
        setErrorMessage("Invalid magic link");
        return;
      }

      try {
        const response = await fetch(`/api/auth/magic-link/verify/${params.token}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.message || "Invalid or expired magic link");
          return;
        }

        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/email-auth/me"] });
        toast({
          title: "Signed in successfully!",
          description: "Welcome back to Stroke Recovery Academy.",
        });

        setTimeout(() => routeAfterAuth(navigate), 1500);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify magic link");
      }
    };

    verifyToken();
  }, [params.token, navigate, toast]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#E2741B] animate-spin" />
              </div>
              <CardTitle data-testid="text-verifying-title">Verifying magic link...</CardTitle>
              <CardDescription>Please wait while we sign you in.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#E2741B]/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-[#E2741B]" />
              </div>
              <CardTitle data-testid="text-success-title">Signed in!</CardTitle>
              <CardDescription>Redirecting you...</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle data-testid="text-error-title">Verification failed</CardTitle>
              <CardDescription data-testid="text-error-description">{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === "error" && (
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/auth?mode=magic-link")}
              data-testid="button-try-again"
            >
              Try again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
