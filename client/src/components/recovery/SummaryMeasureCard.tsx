import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, ShieldCheck } from "lucide-react";

type Audience = "survivor" | "caregiver" | "clinician";
type Rating = 1 | 2 | 3 | 4 | 5;

type Measurement = {
  before: { usefulness?: number; uncertainty?: number } | null;
  after: {
    usefulness?: number;
    uncertainty?: number;
    clarity?: number;
    actionability?: number;
    review_time_seconds?: number;
  } | null;
};

type SummaryResponse = {
  summaryId: string;
  windowDays: number;
  activity: {
    checkinDays: number;
    practiceDays: number;
    reflectionDays: number;
    firstActivityDate: string | null;
    lastActivityDate: string | null;
  };
  measurement: Measurement;
};

type Props = {
  audience: Audience;
  summaryPath: string;
  feedbackPath: string;
  title?: string;
};

const ratingLabels = ["Not at all", "A little", "Somewhat", "Mostly", "Very"];

export default function SummaryMeasureCard({
  audience,
  summaryPath,
  feedbackPath,
  title = "Care handoff summary",
}: Props) {
  const { data, isLoading, isError } = useQuery<SummaryResponse>({
    queryKey: [summaryPath],
  });
  const [usefulness, setUsefulness] = useState<Rating | null>(null);
  const [uncertainty, setUncertainty] = useState<Rating | null>(null);
  const [clarity, setClarity] = useState<Rating | null>(null);
  const [actionability, setActionability] = useState<Rating | null>(null);
  const [reviewSeconds, setReviewSeconds] = useState("");
  const [reviewStartedAt, setReviewStartedAt] = useState<number | null>(null);

  const isClinician = audience === "clinician";
  const beforeComplete = isClinician || Boolean(data?.measurement?.before);
  const afterComplete = Boolean(data?.measurement?.after);
  const needsBefore = !isClinician && !beforeComplete;

  useEffect(() => {
    if (!data?.measurement) return;
    const before = data.measurement.before;
    const after = data.measurement.after;
    if (before) {
      setUsefulness((before.usefulness as Rating) || null);
      setUncertainty((before.uncertainty as Rating) || null);
    }
    if (after) {
      setUsefulness((after.usefulness as Rating) || usefulness);
      setUncertainty((after.uncertainty as Rating) || uncertainty);
      setClarity((after.clarity as Rating) || null);
      setActionability((after.actionability as Rating) || null);
      setReviewSeconds(String(after.review_time_seconds || ""));
    }
    if (!reviewStartedAt) setReviewStartedAt(Date.now());
  }, [data?.measurement]);

  const feedback = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await apiRequest("POST", feedbackPath, payload);
      return response.json();
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const canSubmitBefore = usefulness !== null && uncertainty !== null;
  const canSubmitAfter = isClinician
    ? clarity !== null && actionability !== null && Number(reviewSeconds) >= 1
    : usefulness !== null && uncertainty !== null;
  const elapsedSeconds = useMemo(
    () => Math.max(1, Math.round((Date.now() - (reviewStartedAt || Date.now())) / 1000)),
    [reviewStartedAt],
  );

  const submit = (phase: "before" | "after") => {
    if (!data) return;
    const payload: Record<string, unknown> = {
      phase,
      summaryId: data.summaryId,
      usefulness: usefulness ?? undefined,
      uncertainty: uncertainty ?? undefined,
    };
    if (audience !== "survivor") payload.audience = audience;
    if (isClinician) {
      payload.clarity = clarity;
      payload.actionability = actionability;
      payload.reviewTimeSeconds = Number(reviewSeconds) || elapsedSeconds;
    }
    feedback.mutate(payload);
  };

  if (isLoading) {
    return <Card className="bg-[#15120F] border-[#2A2621] p-5"><Loader2 className="w-5 h-5 animate-spin text-[#E2741B]" /></Card>;
  }
  if (isError || !data) return null;

  return (
    <Card className="bg-[#15120F] border-[#2A2621] p-5 space-y-5" data-testid="card-summary-measurement">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-[#E2741B] mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold text-[#F3F2EE]">{title}</h3>
          <p className="text-xs text-[#8A867D] mt-1">
            A plain-language handoff using the last {data.windowDays} days of activity. No journal words are included.
          </p>
        </div>
      </div>

      {needsBefore && (
        <RatingPair
          usefulness={usefulness}
          uncertainty={uncertainty}
          onUsefulness={setUsefulness}
          onUncertainty={setUncertainty}
          heading="Before you read it"
        />
      )}

      {(beforeComplete || isClinician) && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Check-in days" value={data.activity.checkinDays} />
            <Metric label="Practice days" value={data.activity.practiceDays} />
            <Metric label="Reflection days" value={data.activity.reflectionDays} />
          </div>
          <p className="text-xs text-[#8A867D]">
            Activity window: {data.activity.firstActivityDate || "No activity yet"} to {data.activity.lastActivityDate || "today"}.
          </p>
        </>
      )}

      {needsBefore && (
        <Button
          onClick={() => submit("before")}
          disabled={!canSubmitBefore || feedback.isPending}
          className="w-full bg-[#E2741B] text-black font-bold"
          data-testid="button-summary-before"
        >
          {feedback.isPending ? "Saving…" : "Save rating and view summary"}
        </Button>
      )}

      {!afterComplete && (beforeComplete || isClinician) && (
        <div className="space-y-4 border-t border-[#2A2621] pt-4">
          <p className="text-sm font-semibold text-[#F3F2EE]">
            {isClinician ? "After reviewing the sample export" : "After using the summary"}
          </p>
          {isClinician ? (
            <>
              <RatingRow label="Clarity" value={clarity} onChange={setClarity} />
              <RatingRow label="Actionability" value={actionability} onChange={setActionability} />
              <label className="block text-xs text-[#8A867D]">
                Review time in seconds
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={reviewSeconds}
                  onChange={(event) => setReviewSeconds(event.target.value)}
                  placeholder={String(elapsedSeconds)}
                  className="mt-2 w-full rounded-md border border-[#2A2621] bg-[#0E0D0C] p-2 text-[#F3F2EE]"
                  data-testid="input-summary-review-seconds"
                />
              </label>
            </>
          ) : (
            <RatingPair
              usefulness={usefulness}
              uncertainty={uncertainty}
              onUsefulness={setUsefulness}
              onUncertainty={setUncertainty}
              heading="How is it helping now?"
            />
          )}
          <Button
            onClick={() => submit("after")}
            disabled={!canSubmitAfter || feedback.isPending}
            variant="outline"
            className="w-full border-[#E2741B] text-[#E2741B]"
            data-testid="button-summary-after"
          >
            {feedback.isPending ? "Saving…" : "Save after rating"}
          </Button>
        </div>
      )}

      {afterComplete && (
        <div className="flex items-start gap-2 text-xs text-[#8A867D]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          Thanks. This measurement stores ratings and timing only, never the summary contents.
        </div>
      )}
    </Card>
  );
}

function RatingPair({
  usefulness,
  uncertainty,
  onUsefulness,
  onUncertainty,
  heading,
}: {
  usefulness: Rating | null;
  uncertainty: Rating | null;
  onUsefulness: (value: Rating) => void;
  onUncertainty: (value: Rating) => void;
  heading: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#F3F2EE]">{heading}</p>
      <RatingRow label="How useful would this be?" value={usefulness} onChange={onUsefulness} />
      <RatingRow label="How uncertain do you feel about what to share next?" value={uncertainty} onChange={onUncertainty} />
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: Rating | null; onChange: (value: Rating) => void }) {
  return (
    <div>
      <p className="text-xs text-[#8A867D] mb-2">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating as Rating)}
            aria-label={`${rating} of 5, ${ratingLabels[rating - 1]}`}
            className={`rounded-md border px-1 py-2 text-xs ${value === rating ? "border-[#E2741B] bg-[#E2741B]/20 text-[#F3F2EE]" : "border-[#2A2621] text-[#8A867D]"}`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#2A2621] bg-[#0E0D0C] p-3 text-center">
      <p className="text-lg font-bold text-[#F3F2EE]">{value}</p>
      <p className="text-[10px] text-[#8A867D]">{label}</p>
    </div>
  );
}