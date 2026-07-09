import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface DraftFAQ { q: string; a: string; }
interface BlogDraft {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  tags: string[];
  contentMarkdown: string;
  faqs: DraftFAQ[];
  heroImagePrompt: string;
  focusKeyphrase?: string;
  heroImageUrl?: string;
}

export default function BlogDraftStudio() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [focusKeyphrase, setFocusKeyphrase] = useState("");
  const [audience, setAudience] = useState("stroke survivors and their caregivers");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [savedPostId, setSavedPostId] = useState<number | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/blog/draft", { topic, focusKeyphrase, audience, length });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.draft) {
        setDraft(data.draft);
        setSavedPostId(null);
        toast({ title: "Draft generated", description: `"${data.draft.title}" — review, edit, then save.` });
      } else {
        toast({ title: "Draft failed", description: data?.message || "Unknown error", variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: "Generation failed", description: err?.message || "Network error", variant: "destructive" }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/blog/draft/save", { draft });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.post?.id) {
        setSavedPostId(data.post.id);
        toast({ title: "Draft saved", description: `Post id ${data.post.id} created in draft status.` });
        queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      } else {
        toast({ title: "Save failed", description: data?.message || "Unknown error", variant: "destructive" });
      }
    },
  });

  const infographic = useMutation({
    mutationFn: async () => {
      const prompt = draft?.heroImagePrompt || "warm hopeful illustration of a stroke survivor walking outdoors at dawn";
      const res = await apiRequest("POST", "/api/admin/blog/draft/infographic", { prompt, postId: savedPostId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.imageDataUrl && draft) {
        setDraft({ ...draft, heroImageUrl: data.imageDataUrl });
        toast({ title: "Infographic generated", description: savedPostId ? "Hero image attached to saved post." : "Save the draft to attach this image to the post." });
      } else {
        toast({ title: "Image failed", description: data?.message || "Imagen unavailable", variant: "destructive" });
      }
    },
  });

  const updateField = (key: keyof BlogDraft, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Blog Draft Studio</h1>
        <p className="text-muted-foreground">Topic in, full SEO-ready draft out — review, edit, save as draft.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Generate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to rebuild grip strength 6 months after stroke"
                rows={3}
                data-testid="input-topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kp">Focus keyphrase (optional)</Label>
              <Input
                id="kp"
                value={focusKeyphrase}
                onChange={(e) => setFocusKeyphrase(e.target.value)}
                placeholder="e.g. grip strength after stroke"
                data-testid="input-keyphrase"
              />
              <Label htmlFor="aud">Audience</Label>
              <Input
                id="aud"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                data-testid="input-audience"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label className="mb-0">Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as any)}>
              <SelectTrigger className="w-40" data-testid="select-length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (~800w)</SelectItem>
                <SelectItem value="medium">Medium (~1200w)</SelectItem>
                <SelectItem value="long">Long (~2000w)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || topic.trim().length < 5}
              data-testid="button-generate"
            >
              {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {draft && (
        <Card data-testid="card-draft-preview">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{draft.title}</CardTitle>
                <p className="text-sm text-muted-foreground">/blog/{draft.slug}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => infographic.mutate()} disabled={infographic.isPending} data-testid="button-infographic">
                  {infographic.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Generate infographic
                </Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending || savedPostId !== null} data-testid="button-save">
                  {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savedPostId ? `Saved · #${savedPostId}` : "Save as draft"}
                </Button>
                {savedPostId && (
                  <Button variant="ghost" asChild>
                    <Link href={`/blog/${draft.slug}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {draft.heroImageUrl && (
              <div className="overflow-hidden rounded-md border">
                <img src={draft.heroImageUrl} alt={draft.title} className="w-full" data-testid="img-hero" />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Meta title</Label>
                <Input value={draft.metaTitle || ""} onChange={(e) => updateField("metaTitle", e.target.value)} data-testid="input-meta-title" />
                <p className="text-xs text-muted-foreground">{(draft.metaTitle || "").length} / 70</p>
              </div>
              <div className="space-y-1">
                <Label>Meta description</Label>
                <Textarea value={draft.metaDescription || ""} onChange={(e) => updateField("metaDescription", e.target.value)} rows={2} data-testid="input-meta-description" />
                <p className="text-xs text-muted-foreground">{(draft.metaDescription || "").length} / 160</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Excerpt</Label>
              <Textarea value={draft.excerpt || ""} onChange={(e) => updateField("excerpt", e.target.value)} rows={3} data-testid="input-excerpt" />
            </div>

            <div className="flex flex-wrap gap-1">
              {draft.tags?.map((t) => (<Badge key={t} variant="secondary" data-testid={`badge-tag-${t}`}>{t}</Badge>))}
            </div>

            <div className="space-y-1">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={draft.contentMarkdown}
                onChange={(e) => updateField("contentMarkdown", e.target.value)}
                rows={20}
                className="font-mono text-sm"
                data-testid="input-content"
              />
              <p className="text-xs text-muted-foreground">{draft.contentMarkdown.split(/\s+/).length} words</p>
            </div>

            {draft.faqs && draft.faqs.length > 0 && (
              <div className="space-y-2">
                <Label>FAQs ({draft.faqs.length})</Label>
                <div className="space-y-2">
                  {draft.faqs.map((f, i) => (
                    <div key={i} className="rounded-md border p-3" data-testid={`faq-item-${i}`}>
                      <p className="font-semibold text-sm">{f.q}</p>
                      <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Hero image prompt</Label>
              <Textarea value={draft.heroImagePrompt || ""} onChange={(e) => updateField("heroImagePrompt", e.target.value)} rows={3} data-testid="input-hero-prompt" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
