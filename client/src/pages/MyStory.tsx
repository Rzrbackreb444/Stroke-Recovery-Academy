import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import {
  BookOpen,
  PenLine,
  Lock,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StoryStats = {
  journalEntries: number;
  storyMoments: number;
  checkins: number;
  recentChapters: Array<{
    id: number;
    title: string | null;
    content: string;
    createdAt: string;
    isStoryMoment: boolean;
    entryType: string | null;
    moodLabel: string | null;
  }>;
};

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-4 rounded-xl bg-white/5 border border-white/8 min-w-[90px]">
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function ChapterCard({
  entry,
  onUnmark,
}: {
  entry: StoryStats["recentChapters"][0];
  onUnmark: (id: number) => void;
}) {
  const preview = entry.content.slice(0, 180).trim();
  const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="rounded-xl border border-[#E2741B]/25 bg-[#0d0d0d] p-5"
      data-testid={`card-chapter-${entry.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/25 flex items-center justify-center flex-shrink-0">
            <BookMarked className="w-3 h-3 text-[#E2741B]" />
          </div>
          <span className="text-xs font-semibold text-[#E2741B] uppercase tracking-wider">Chapter</span>
        </div>
        <span className="text-xs text-gray-600">{date}</span>
      </div>
      {entry.title && (
        <p className="text-sm font-semibold text-gray-100 mb-2 leading-snug">{entry.title}</p>
      )}
      <p className="text-sm text-gray-400 leading-relaxed mb-4">
        {preview}{preview.length < entry.content.length ? "…" : ""}
      </p>
      <button
        onClick={() => onUnmark(entry.id)}
        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        data-testid={`button-unmark-chapter-${entry.id}`}
      >
        Remove from story
      </button>
    </div>
  );
}

export default function MyStory() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<StoryStats>({
    queryKey: ["/api/recovery/my-story/stats"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isStoryMoment }: { id: number; isStoryMoment: boolean }) =>
      apiRequest("PATCH", `/api/recovery/journal/${id}/story-moment`, { isStoryMoment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/my-story/stats"] });
    },
    onError: () => {
      toast({ title: "Couldn't update that entry. Try again.", variant: "destructive" });
    },
  });

  const unmark = (id: number) => toggleMutation.mutate({ id, isStoryMoment: false });

  const chapters = stats?.recentChapters ?? [];
  const hasChapters = chapters.length > 0;

  return (
    <>
      <RecoverySEO
        title="Your Recovery Story | Stroke Recovery Academy"
        description="Document your journey. Mark your chapters. Compile your recovery into a real book — in your own voice."
      />
      <RecoveryHeader />

      <div className="min-h-screen bg-[#0a0a0a] pt-20">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
              <BookOpen className="w-3.5 h-3.5 text-[#E2741B]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Your Recovery Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              You're writing a book<br />
              <span className="text-[#E2741B]">one rep at a time.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
              Every check-in, every journal entry, every breakthrough you tell Sasquatch — it's all material. Mark the moments that matter. When you're ready, compile them into a real book. Digital or print. In your voice. About your life.
            </p>
            <p className="mt-4 text-sm text-gray-600 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Everything else stays between you and the Squatch.
            </p>
          </div>

          {/* STATS */}
          {isLoading ? (
            <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-3 mt-8">
              <StatPill value={stats?.journalEntries ?? 0} label="Journal entries" />
              <StatPill value={stats?.checkins ?? 0} label="Check-ins logged" />
              <StatPill value={stats?.storyMoments ?? 0} label="Chapters marked" />
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <div className="rounded-2xl border border-white/8 bg-[#0d0d0d] p-6 md:p-8">
            <h2 className="text-lg font-bold text-white mb-6">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: PenLine,
                  step: "1",
                  title: "Keep writing",
                  body: "Journal entries, daily check-ins, breakthroughs you share with Sasquatch Coach. Every word is yours.",
                },
                {
                  icon: BookMarked,
                  step: "2",
                  title: "Mark your chapters",
                  body: "Open any journal entry and tap \"Mark as chapter.\" Those moments get flagged for your book. Everything else stays private.",
                },
                {
                  icon: BookOpen,
                  step: "3",
                  title: "Compile your book",
                  body: "When you're ready, hit compile. We turn your chapters into a formatted book — digital PDF or paperback print.",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#E2741B]">{item.step}</span>
                    </div>
                    <item.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-100">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTERS */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {hasChapters ? "Your chapters" : "No chapters yet"}
            </h2>
            <Link href="/recovery/journal">
              <button
                className="text-xs font-semibold text-[#E2741B] hover:text-[#E2741B]/80 transition-colors"
                data-testid="link-go-to-journal"
              >
                Go to journal →
              </button>
            </Link>
          </div>

          {!hasChapters ? (
            <div className="rounded-xl border border-white/8 bg-[#0d0d0d] p-8 text-center">
              <FileText className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">You haven't marked any chapters yet.</p>
              <p className="text-xs text-gray-700">
                Open any journal entry and tap "Mark as chapter" — those moments will appear here.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-5 bg-[#E2741B] text-black font-semibold hover:bg-[#E2741B]/90"
                data-testid="button-go-journal-empty"
              >
                <Link href="/recovery/journal">Open journal</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((ch) => (
                <ChapterCard key={ch.id} entry={ch} onUnmark={unmark} />
              ))}
            </div>
          )}
        </section>

        {/* COMPILE CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#120d04] to-[#0d0d0d] p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E2741B]/15 border border-[#E2741B]/25 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-5 h-5 text-[#E2741B]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Ready to compile your book?</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto mb-6">
              Your journal entries become a real book — digital PDF ($19) or printed paperback ($29). Your words. Your story. Something to hand to your family, your doctor, anyone who wasn't in the room.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#E2741B] text-black font-semibold h-11 px-6 rounded-md"
                data-testid="button-compile-book"
              >
                <Link href="/recovery/journal">
                  Mark chapters first <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 rounded-md border-white/15 text-gray-300"
                data-testid="button-learn-more-premium"
              >
                <Link href="/recovery/premium">Learn about Premium</Link>
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-center mt-6">
              <CheckCircle2 className="w-4 h-4 text-gray-700" />
              <span className="text-xs text-gray-700">
                Only the chapters you mark. Everything else stays private.
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
