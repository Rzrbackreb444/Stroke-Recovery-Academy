import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Star } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";

interface Spotlight {
  id: number;
  slug: string;
  monthKey: string;
  displayName: string;
  headline: string | null;
  story: string | null;
  recoveryDate: string | null;
  location: string | null;
  photoUrl: string | null;
  publishedAt: string | null;
}

function renderStory(story: string) {
  // Minimal markdown: paragraphs, **bold**, _italic_
  const paras = story.split(/\n{2,}/);
  return paras.map((p, i) => (
    <p key={i} className="mb-4 text-base leading-relaxed text-gray-300">
      {p.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((chunk, j) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return (
            <strong key={j} className="font-bold text-white">
              {chunk.slice(2, -2)}
            </strong>
          );
        }
        if (chunk.startsWith("_") && chunk.endsWith("_")) {
          return (
            <em key={j} className="italic">
              {chunk.slice(1, -1)}
            </em>
          );
        }
        return <span key={j}>{chunk}</span>;
      })}
    </p>
  ));
}

export default function RecoverySpotlight() {
  const [, archiveParams] = useRoute("/recovery/spotlight/:slug");
  const slug = archiveParams?.slug;

  const { data: current, isLoading: loadingCurrent } = useQuery<Spotlight | null>({
    queryKey: ["/api/recovery/spotlight"],
    enabled: !slug,
  });
  const { data: byslug, isLoading: loadingSlug } = useQuery<Spotlight>({
    queryKey: ["/api/recovery/spotlight", slug],
    enabled: !!slug,
  });
  const { data: archive } = useQuery<Spotlight[]>({
    queryKey: ["/api/recovery/spotlight/archive"],
  });

  const spotlight = slug ? byslug : current;
  const isLoading = slug ? loadingSlug : loadingCurrent;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title={
          spotlight
            ? `${spotlight.displayName} — Survivor Spotlight`
            : "Survivor Spotlight — Stroke Recovery Stories"
        }
        description={
          spotlight?.headline ||
          spotlight?.story?.slice(0, 160) ||
          "Real stroke survivors. Real comebacks. Featured monthly."
        }
        canonical={slug ? `/recovery/spotlight/${slug}` : "/recovery/spotlight"}
        keywords={[
          "stroke survivor story",
          "stroke recovery testimonial",
          "survivor spotlight",
          "stroke comeback",
        ]}
      />

      <RecoveryHeader />

      <section className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#1a1a1a] to-[#0D0D0D]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href={slug ? "/recovery/spotlight" : "/recovery/dashboard"}>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-gray-400"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {slug ? "Back to current spotlight" : "Back to dashboard"}
            </Button>
          </Link>
          <p
            className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
            style={{ color: "#C9941A" }}
          >
            <Star className="h-4 w-4" />
            Survivor Spotlight
          </p>
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            {isLoading
              ? "Loading…"
              : spotlight
                ? spotlight.displayName
                : "No spotlight yet"}
          </h1>
          {spotlight?.headline && (
            <p className="mt-3 text-xl text-gray-300 sm:text-2xl">
              {spotlight.headline}
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#0D0D0D]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          {isLoading && (
            <p className="text-gray-400">Loading spotlight…</p>
          )}
          {!isLoading && !spotlight && (
            <div className="rounded-lg border border-[#1a1a1a] bg-[#111] p-8 text-center">
              <p className="text-lg font-bold text-white">
                Our first spotlight ships next month.
              </p>
              <p className="mt-2 text-gray-400">
                Want to be featured? Opt in from your{" "}
                <Link href="/settings">
                  <a className="underline" style={{ color: "#C9941A" }}>
                    profile settings
                  </a>
                </Link>
                .
              </p>
            </div>
          )}
          {spotlight && (
            <div className="grid gap-8 lg:grid-cols-[200px,1fr]">
              <div>
                <Avatar className="mx-auto h-40 w-40 lg:mx-0">
                  <AvatarImage
                    src={spotlight.photoUrl || undefined}
                    alt={spotlight.displayName}
                  />
                  <AvatarFallback className="bg-[#C9941A] text-3xl font-black text-black">
                    {spotlight.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  {spotlight.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: "#C9941A" }} />
                      {spotlight.location}
                    </p>
                  )}
                  {spotlight.recoveryDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: "#C9941A" }} />
                      Stroke {new Date(spotlight.recoveryDate).toLocaleDateString()}
                    </p>
                  )}
                  {spotlight.publishedAt && (
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      Featured {new Date(spotlight.publishedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <article className="prose prose-invert max-w-none">
                {spotlight.story ? renderStory(spotlight.story) : (
                  <p className="text-gray-400">Story coming soon.</p>
                )}
              </article>
            </div>
          )}
        </div>
      </section>

      {!slug && archive && archive.length > 1 && (
        <section className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
              Past Spotlights
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {archive.slice(1).map((s) => (
                <Link key={s.id} href={`/recovery/spotlight/${s.slug}`}>
                  <a
                    data-testid={`link-archive-${s.slug}`}
                    className="block rounded-md border border-[#1a1a1a] bg-[#111] p-4 hover-elevate active-elevate-2"
                  >
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      {s.publishedAt && new Date(s.publishedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-base font-black text-white">{s.displayName}</p>
                    {s.headline && (
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2">{s.headline}</p>
                    )}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
