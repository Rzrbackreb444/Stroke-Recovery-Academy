import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, ChevronLeft, CheckCircle2, Save } from "lucide-react";

export default function ProfileSettings() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const ownUserId: string | null = user ? ((user as any).claims?.sub ?? (user as any).id) : null;

  const { data: settings } = useQuery<{ username: string | null; displayName: string | null }>({
    queryKey: ["/api/sparks/settings"],
    queryFn: () => fetch("/api/sparks/settings").then((r) => r.json()),
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      setUsername(settings.username ?? "");
      setDisplayName(settings.displayName ?? "");
    }
  }, [settings]);

  const validateUsername = (val: string): string | null => {
    if (val.length < 3) return "At least 3 characters.";
    if (val.length > 30) return "Max 30 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Lowercase letters, numbers, underscores only.";
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, string> = {};
      if (username.trim()) body.username = username.trim();
      if (displayName.trim()) body.displayName = displayName.trim();
      return apiRequest("PATCH", "/api/sparks/settings", body);
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/sparks/settings"] });
      toast({ title: "Profile updated" });
      if (data.username) navigate(`/sparks/u/${data.username}`);
    },
    onError: (err: any) => {
      const msg = err?.message ?? "Could not save. Try again.";
      if (msg.includes("taken")) {
        setUsernameError("That username is taken.");
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Sign in to edit your profile.</p>
      </div>
    );
  }

  const profileLink = settings?.username
    ? `/sparks/u/${settings.username}`
    : ownUserId
    ? `/sparks/profile/${ownUserId}`
    : "/sparks";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(profileLink)}
            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            data-testid="button-back-profile"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Zap className="w-4 h-4 text-[#E2741B]" />
            <span className="text-white font-semibold">Profile Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-zinc-300 text-sm font-medium">
            Username
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                setUsername(val);
                setUsernameError(validateUsername(val));
              }}
              className="pl-7 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-[#E2741B]"
              placeholder="yourhandle"
              maxLength={30}
              data-testid="input-username"
            />
          </div>
          {usernameError ? (
            <p className="text-red-400 text-xs">{usernameError}</p>
          ) : username && !usernameError ? (
            <p className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> @{username}
            </p>
          ) : null}
          <p className="text-zinc-600 text-xs">Your profile will be at sparks/u/{username || "yourhandle"}</p>
        </div>

        {/* Display name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-zinc-300 text-sm font-medium">
            Display Name
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 60))}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-[#E2741B]"
            placeholder="Nick Kremers"
            maxLength={60}
            data-testid="input-display-name"
          />
        </div>

        {/* Save */}
        <Button
          onClick={() => {
            const err = validateUsername(username);
            if (err) { setUsernameError(err); return; }
            saveMutation.mutate();
          }}
          disabled={saveMutation.isPending || !!usernameError || (!username && !displayName)}
          className="w-full bg-[#E2741B] hover:bg-[#E2741B]/90 text-white font-semibold"
          data-testid="button-save-settings"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving…" : "Save Profile"}
        </Button>

        <div className="pt-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => navigate(profileLink)}
            className="text-zinc-500 hover:text-zinc-300 w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
