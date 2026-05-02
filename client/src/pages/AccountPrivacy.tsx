import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, Trash2, ShieldAlert, FileJson, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";

export default function AccountPrivacy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmEmail, setConfirmEmail] = useState("");

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account/export", { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      return await res.blob();
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strokerecovery-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Export downloaded",
        description: "Your data was exported as JSON.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Export failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Delete failed (${res.status})`);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "We've scrubbed your data and signed you out.",
      });
      // Hard reload — session cookie was cleared server-side.
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const userEmail = (user as any)?.email || "";
  const canDelete = confirmEmail.trim().length > 0 && !deleteMutation.isPending;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" data-testid="page-account-privacy">
      <RecoverySEO
        title="Privacy & Account Controls | Stroke Recovery Academy"
        description="Export your data or permanently delete your Stroke Recovery Academy account."
        canonical="/settings/privacy"
      />
      <RecoveryHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/settings">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-[#C9941A] mb-6"
            data-testid="link-back-settings"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
          </Button>
        </Link>

        <h1 className="text-3xl font-black mb-2" data-testid="text-page-title">
          Privacy &amp; Your Data
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your recovery is yours. Take it with you any time. Delete it any time.
        </p>

        {/* Export */}
        <Card className="bg-[#111] border-[#1e1e1e] mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <FileJson className="h-5 w-5 text-[#C9941A]" />
              Export your data
            </CardTitle>
            <CardDescription className="text-gray-400">
              Download a JSON file with everything we have on your account: profile, intake answers, daily
              check-ins, milestones, streak, journal, medical and flicker logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="bg-[#C9941A] text-black hover:bg-[#b8841a]"
              data-testid="button-export-data"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing export…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> Download my data (JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Delete */}
        <Card className="bg-red-950/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Delete your account
            </CardTitle>
            <CardDescription className="text-gray-300 leading-relaxed">
              Permanently scrubs your name, email, profile, story, journal entries and other personal
              identifiers. Your check-in history is anonymized but kept so the platform's aggregate stats
              stay accurate. <strong className="text-white">This cannot be undone.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator className="bg-red-500/15" />

            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-sm text-gray-300">
                Type your account email{" "}
                <span className="font-mono text-white" data-testid="text-account-email">
                  {userEmail || "your email"}
                </span>{" "}
                to confirm:
              </Label>
              <Input
                id="confirm-email"
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-black/40 border-red-500/30 text-white placeholder:text-gray-600 focus-visible:border-red-400"
                data-testid="input-confirm-email"
              />
            </div>

            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={!canDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-delete-account"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Permanently delete my account
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 leading-relaxed">
              Need a paused account instead? Cancel your subscription from{" "}
              <Link href="/settings" className="text-[#C9941A] underline">
                Settings → Billing
              </Link>{" "}
              — you'll keep your check-ins and progress, just lose paid features at period end.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
