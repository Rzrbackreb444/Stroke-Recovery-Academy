import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Anchor, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

interface PublicAnchor {
  id: number;
  anchorType: "affirmation" | "speech" | "memory";
  anchorData: {
    title: string;
    lines: string[];
    callResponse?: { sasquatch: string[]; you: string[] } | null;
    mnemonic?: { facts: string[]; hookStamp: string } | null;
    realityFooter?: string;
  };
  audioUrl: string | null;
  createdAt: string;
}

export default function AnchorShare() {
  const [, params] = useRoute<{ shareId: string }>("/anchor/s/:shareId");
  const shareId = params?.shareId ?? "";

  const { data, isLoading, isError } = useQuery<PublicAnchor>({
    queryKey: ["/api/recovery/anchor/share", shareId],
    queryFn: async () => {
      const res = await fetch(`/api/recovery/anchor/share/${encodeURIComponent(shareId)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as PublicAnchor;
    },
    enabled: !!shareId,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-amber-50 flex flex-col">
      <SEO
        title={data?.anchorData?.title ? `${data.anchorData.title} · Stroke Recovery Academy` : "A survivor's anchor"}
        description="A musical recovery anchor made by a stroke survivor on Stroke Recovery Academy."
      />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {isLoading && (
            <div className="text-center space-y-3 py-12">
              <Anchor className="h-8 w-8 text-amber-400 mx-auto animate-pulse" />
              <p className="text-sm text-amber-100/60">Loading the anchor…</p>
            </div>
          )}

          {isError && (
            <div
              className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-6 text-center space-y-3"
              data-testid="anchor-share-not-found"
            >
              <AlertCircle className="h-8 w-8 text-zinc-400 mx-auto" />
              <h1 className="text-xl font-bold text-amber-100">This anchor isn't public</h1>
              <p className="text-sm text-amber-100/60">
                The link may be wrong, or the survivor took it private. Both are okay.
              </p>
              <Button asChild className="bg-amber-500 hover:bg-amber-400 text-zinc-950">
                <Link href="/" data-testid="link-anchor-share-home">
                  Visit Stroke Recovery Academy
                </Link>
              </Button>
            </div>
          )}

          {data && (
            <article
              className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-6 space-y-5"
              data-testid="anchor-share-card"
            >
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-amber-400" />
                <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-500/10 text-[10px]">
                  {data.anchorType} anchor
                </Badge>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold text-amber-100 leading-tight"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                data-testid="text-share-title"
              >
                {data.anchorData.title}
              </h1>

              <ol className="space-y-2">
                {data.anchorData.lines.map((line, i) => (
                  <li
                    key={i}
                    className="text-lg text-amber-50 leading-relaxed pl-3 border-l-2 border-amber-500/40"
                    data-testid={`text-share-line-${i}`}
                  >
                    {line}
                  </li>
                ))}
              </ol>

              {data.audioUrl && (
                <audio
                  controls
                  src={data.audioUrl}
                  className="w-full"
                  data-testid="audio-share"
                />
              )}

              {data.anchorData.realityFooter && (
                <p className="text-xs text-amber-100/60 italic leading-relaxed border-t border-amber-900/30 pt-4">
                  {data.anchorData.realityFooter}
                </p>
              )}

              <div className="border-t border-amber-900/30 pt-4">
                <p className="text-[11px] uppercase tracking-widest text-amber-300/70 mb-2">
                  Made on Stroke Recovery Academy
                </p>
                <Link
                  href="/recovery"
                  className="inline-flex items-center gap-2 text-sm text-amber-300 font-semibold hover:text-amber-200"
                  data-testid="link-share-cta"
                >
                  Build your own recovery anchor
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          )}

          {!isLoading && !isError && !data && (
            <p className="text-center text-amber-100/60 text-sm">No anchor.</p>
          )}
        </div>
      </main>
    </div>
  );
}
