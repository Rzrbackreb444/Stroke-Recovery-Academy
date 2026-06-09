import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Upload, Images, Loader2 } from "lucide-react";

interface GalleryItem { key: string; label: string; url: string; }

export default function AvatarSettings() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [extraPrompt, setExtraPrompt] = useState("");
  const [removeBg, setRemoveBg] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const gallery = useQuery<{ items: GalleryItem[] }>({ queryKey: ["/api/avatar/gallery"] });

  const current = user?.avatarUrl || user?.profileImageUrl;
  const initials = (user?.firstName || user?.email || "S").slice(0, 1).toUpperCase();

  const afterSave = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    toast({ title: "Avatar saved", description: "Your new avatar is live." });
  };

  const genMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/avatar/generate", { extraPrompt });
      return r.json();
    },
    onSuccess: afterSave,
    onError: (e: any) => toast({ title: "Generation failed", description: e?.message || "Try again", variant: "destructive" }),
  });

  const pickGalleryMut = useMutation({
    mutationFn: async (key: string) => {
      const r = await apiRequest("POST", "/api/avatar/gallery", { key });
      return r.json();
    },
    onSuccess: afterSave,
    onError: (e: any) => toast({ title: "Selection failed", description: e?.message || "Try again", variant: "destructive" }),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("removeBackground", removeBg ? "true" : "false");
      const r = await fetch("/api/avatar/upload", { method: "POST", body: fd, credentials: "include" });
      if (!r.ok) throw new Error((await r.json()).error || "Upload failed");
      return r.json();
    },
    onSuccess: afterSave,
    onError: (e: any) => toast({ title: "Upload failed", description: e?.message || "Try again", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-gray-200 p-4 md:p-8" data-testid="page-avatar-settings">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#E2741B]">Avatar</h1>
          <p className="text-sm text-gray-500">Show up as the version of yourself you want the pack to see.</p>
        </div>

        <Card className="p-4 bg-[#1a1a1a] border-[#333] flex items-center gap-4">
          <Avatar className="w-20 h-20 border border-[#E2741B]/30">
            {current ? <AvatarImage src={current} alt="Current avatar" /> : null}
            <AvatarFallback className="bg-[#0D0D0D] text-[#E2741B] text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm text-gray-400">Current avatar</div>
            <div className="text-xs text-gray-600 break-all" data-testid="text-current-avatar-url">{current || "Not set"}</div>
          </div>
        </Card>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid grid-cols-3 bg-[#1a1a1a] border border-[#333]">
            <TabsTrigger value="generate" data-testid="tab-generate"><Sparkles className="w-4 h-4 mr-1" /> Generate</TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-upload"><Upload className="w-4 h-4 mr-1" /> Upload</TabsTrigger>
            <TabsTrigger value="gallery" data-testid="tab-gallery"><Images className="w-4 h-4 mr-1" /> Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-4">
            <Card className="p-4 bg-[#1a1a1a] border-[#333] space-y-3">
              <p className="text-sm text-gray-400">Generate a symbolic avatar seeded from your Forge persona. Add a line below if you want a specific element.</p>
              <Label htmlFor="extra-prompt" className="text-xs text-gray-500">Extra detail (optional)</Label>
              <Input
                id="extra-prompt"
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                placeholder="e.g. a lantern in the fog, a mountain in the distance"
                className="bg-[#0D0D0D] border-[#333]"
                data-testid="input-extra-prompt"
              />
              <Button
                onClick={() => genMut.mutate()}
                disabled={genMut.isPending}
                className="bg-[#E2741B] text-black hover:bg-[#E2741B]"
                data-testid="button-generate-avatar"
              >
                {genMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Forging…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate avatar</>}
              </Button>
              <p className="text-xs text-gray-600">Costs one image generation. Seeded from your current persona archetype + accent color.</p>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <Card className="p-4 bg-[#1a1a1a] border-[#333] space-y-3">
              <p className="text-sm text-gray-400">Upload a portrait. We'll strip the background automatically so it sits clean on the dark theme.</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f); }} data-testid="input-file" />
              <div className="flex items-center gap-3">
                <Switch checked={removeBg} onCheckedChange={setRemoveBg} id="remove-bg" data-testid="switch-remove-bg" />
                <Label htmlFor="remove-bg" className="text-xs text-gray-400">Remove background</Label>
              </div>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploadMut.isPending}
                className="bg-[#E2741B] text-black hover:bg-[#E2741B]"
                data-testid="button-pick-file"
              >
                {uploadMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4 mr-2" /> Choose image</>}
              </Button>
              <p className="text-xs text-gray-600">JPEG, PNG, or WebP. Max 8 MB.</p>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <Card className="p-4 bg-[#1a1a1a] border-[#333]">
              {gallery.isLoading && <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#E2741B]" /></div>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gallery.data?.items?.map((it) => (
                  <button
                    key={it.key}
                    onClick={() => pickGalleryMut.mutate(it.key)}
                    disabled={pickGalleryMut.isPending}
                    className="rounded-md border border-[#333] bg-[#0D0D0D] p-2 hover-elevate active-elevate-2 text-center"
                    data-testid={`button-gallery-${it.key}`}
                  >
                    <img src={it.url} alt={it.label} className="w-full aspect-square object-cover rounded" loading="lazy" />
                    <div className="mt-1 text-xs text-gray-400">{it.label}</div>
                  </button>
                ))}
              </div>
              {pickGalleryMut.isPending && <div className="text-xs text-gray-500 mt-2"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Saving…</div>}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
