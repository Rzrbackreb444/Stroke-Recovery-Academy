import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NextCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  difficulty: string;
  estimatedHours: number | null;
  enrollmentCount: number;
  matchedCategories: string[];
  reason: string;
}

const DIFF_LABELS: Record<string, string> = {
  survival: "Survival",
  rebuild: "Rebuild",
  rise: "Rise",
  reign: "Reign",
};

export default function MyPathRecommender({ limit = 4 }: { limit?: number }) {
  const { data = [], isLoading } = useQuery<NextCourse[]>({
    queryKey: ["/api/recommendations/next-courses", limit],
    queryFn: async () =>
      (await fetch(`/api/recommendations/next-courses?limit=${limit}`)).json(),
  });

  if (isLoading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E2741B]" /> My Path
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400">Loading next courses…</CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E2741B]" /> My Path
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400">
          Start a course in Recovery University and your personalized path will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-white text-base flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E2741B]" /> My Path
          </span>
          <Link href="/recovery/university">
            <span className="text-xs text-[#E2741B] hover:underline inline-flex items-center gap-1"
              data-testid="link-all-courses">
              All courses <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {data.map((c) => (
          <Link
            key={c.id}
            href={`/course/${c.id}`}
            className="block rounded-md border border-[#333] bg-[#0D0D0D] p-3 hover-elevate"
            data-testid={`card-recommend-${c.id}`}
          >
              <div className="flex items-start gap-3">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt=""
                    className="w-16 h-16 rounded-md object-cover border border-[#333]" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#E2741B]/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-sm font-semibold text-white line-clamp-2">{c.title}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[#E2741B]/15 text-[#E2741B] border-0 text-[10px]">
                      {DIFF_LABELS[c.difficulty] || c.difficulty}
                    </Badge>
                    {c.estimatedHours ? (
                      <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {c.estimatedHours}h
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-gray-400 italic line-clamp-1" data-testid={`text-reason-${c.id}`}>
                    {c.reason}
                  </p>
                </div>
              </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
