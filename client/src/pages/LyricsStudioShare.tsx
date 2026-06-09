import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Music2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicLyrics {
  id: number;
  genre: string;
  singer: string;
  lyricsData: {
    title: string;
    styleHeader: { style: string; tempo: string; vibe: string };
    sections: Array<{
      label: string;
      sceneNote?: string | null;
      lines: Array<{ voice?: string | null; direction?: string | null; text: string }>;
    }>;
    hashtags?: string[];
    producerNotes?: string;
  };
  createdAt: string;
}

export default function LyricsStudioShare() {
  const [, params] = useRoute("/lyrics/s/:shareId");
  const shareId = params?.shareId;

  const q = useQuery<PublicLyrics>({
    queryKey: ["/api/lyrics/share", shareId],
    queryFn: async () => {
      const res = await fetch(`/api/lyrics/share/${shareId}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
    enabled: !!shareId,
    retry: false,
  });

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E2741B]" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#111] border-[#222] max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <Music2 className="h-10 w-10 mx-auto text-gray-700" />
            <div>
              <div className="font-semibold mb-1">Not found</div>
              <div className="text-sm text-gray-400">
                This lyric is private or the link has been revoked.
              </div>
            </div>
            <Link href="/recovery/lyrics">
              <Button className="bg-[#E2741B] hover:bg-[#b08016] text-black" data-testid="button-create-own">
                Write your own
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const o = q.data.lyricsData;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest">
          <Music2 className="h-3.5 w-3.5 text-[#E2741B]" />
          Lyrics Studio · Shared production sheet
        </div>

        <Card className="bg-[#111] border-[#222]">
          <CardContent className="p-6 space-y-6">
            <div className="p-4 rounded-md bg-[#0a0a0a] border border-[#222] text-sm space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E2741B] mb-2">
                The Architect's Specifications
              </div>
              <div><span className="text-gray-500">• Style:</span> <span className="text-white">{o.styleHeader.style}</span></div>
              <div><span className="text-gray-500">• Tempo:</span> <span className="text-white">{o.styleHeader.tempo}</span></div>
              <div><span className="text-gray-500">• Vibe:</span> <span className="text-white">{o.styleHeader.vibe}</span></div>
            </div>

            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Title</div>
              <h1 className="text-2xl font-bold text-[#E2741B]">{o.title}</h1>
            </div>

            {o.sections.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="text-sm font-bold text-[#E2741B]">{s.label}</div>
                {s.sceneNote && (
                  <div className="text-xs italic text-gray-500 leading-relaxed">
                    {s.sceneNote.startsWith("(") ? s.sceneNote : `(${s.sceneNote})`}
                  </div>
                )}
                <div className="space-y-1.5 text-sm leading-relaxed">
                  {s.lines.map((l, li) => (
                    <div key={li}>
                      {l.voice && (
                        <div className="text-xs text-gray-500 italic">
                          ({l.voice}{l.direction ? ` — ${l.direction}` : ""})
                        </div>
                      )}
                      <div className="text-gray-100">{l.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {o.hashtags && o.hashtags.length > 0 && (
              <div className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-[#222]">
                {o.hashtags.map((h) => `#${h}`).join(" ")}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/recovery/lyrics">
            <Button className="bg-[#E2741B] hover:bg-[#b08016] text-black font-semibold" data-testid="button-create-own">
              Write your own song
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
