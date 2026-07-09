import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

type Spark = { text: string; category: string };

/**
 * Today's Spark — a single Nick quote, deterministic per (userId, day).
 * Pulled from server/data/nickQuotes.ts via /api/recovery/spark. Quotes
 * are Nick's actual book lines (Doctrine + Manifesto + Bible + ICU Hell),
 * never LLM-generated. Same survivor sees the same line all day; new
 * quote at UTC midnight.
 */
export function TodaysSpark() {
  const { data } = useQuery<Spark>({
    queryKey: ["/api/recovery/spark"],
    queryFn: async () => {
      const r = await fetch("/api/recovery/spark", { credentials: "include" });
      if (!r.ok) return { text: "", category: "" };
      return r.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour — line is stable for the UTC day
  });

  if (!data?.text) return null;

  return (
    <Card
      className="p-5 mb-6 bg-gradient-to-br from-amber-900/15 via-stone-900 to-stone-900 border-amber-700/30"
      data-testid="card-todays-spark"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-md bg-amber-900/40 flex items-center justify-center mt-0.5">
          <Quote className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <div
            className="text-xs uppercase tracking-wider text-amber-500/80 font-bold mb-1"
            data-testid="text-spark-label"
          >
            Today's Spark
          </div>
          <p
            className="text-amber-100 text-base md:text-lg leading-snug font-medium"
            data-testid="text-spark-quote"
          >
            {data.text}
          </p>
          <p className="text-stone-500 text-xs mt-2">
            — Nick Kremers, founder &amp; 7-year survivor
          </p>
        </div>
      </div>
    </Card>
  );
}

export default TodaysSpark;
