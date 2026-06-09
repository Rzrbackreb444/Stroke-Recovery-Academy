import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, ShieldCheck, ThumbsUp, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: number; userId: string; rating: number; title: string | null; body: string;
  isVerifiedCompletion: boolean; helpfulCount: number; createdAt: string;
  authorName: string | null; authorAvatar: string | null; helpfulByMe: boolean;
}
interface ReviewsResponse {
  reviews: Review[];
  aggregate: { count: number; avg: number; distribution: Record<string, number> };
  myReviewId: number | null;
  myCompletion: boolean;
}

function StarRow({ rating, size = "w-4 h-4", onSelect }:
  { rating: number; size?: string; onSelect?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} of 5`}
          onClick={() => onSelect?.(n)}
          className={onSelect ? "p-0.5 hover-elevate rounded-sm" : "p-0"}
          data-testid={onSelect ? `button-star-${n}` : undefined}
        >
          <Star className={`${size} ${n <= rating ? "text-[#E2741B] fill-[#E2741B]" : "text-zinc-600"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPanel({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draftRating, setDraftRating] = useState(5);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ["/api/courses", courseId, "reviews"],
    enabled: !!courseId,
  });

  const myReview = data?.reviews.find((r) => r.id === data?.myReviewId);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/reviews`, {
        rating: draftRating, title: draftTitle.trim() || null, body: draftBody.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      setDraftTitle(""); setDraftBody(""); setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "reviews"] });
      toast({ title: "Review posted", description: "Thanks for sharing your experience." });
    },
    onError: (e: any) => toast({ title: "Couldn't post", description: e?.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reviews/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "reviews"] }),
  });

  const helpfulMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/reviews/${id}/helpful`),
    onMutate: async (id: number) => {
      const key = ["/api/courses", courseId, "reviews"];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ReviewsResponse>(key);
      if (prev) {
        queryClient.setQueryData<ReviewsResponse>(key, {
          ...prev,
          reviews: prev.reviews.map((r) => r.id === id
            ? { ...r, helpfulByMe: !r.helpfulByMe, helpfulCount: r.helpfulCount + (r.helpfulByMe ? -1 : 1) }
            : r),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/courses", courseId, "reviews"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId, "reviews"] }),
  });

  if (isLoading || !data) {
    return <div className="text-gray-400 text-sm py-6 text-center">Loading reviews…</div>;
  }

  const { aggregate, reviews, myCompletion } = data;
  const showComposer = user && (!myReview || editing);

  return (
    <div className="space-y-4">
      {/* Aggregate */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-4xl font-bold text-white" data-testid="text-rating-avg">
                {aggregate.avg.toFixed(1)}
              </div>
              <StarRow rating={Math.round(aggregate.avg)} size="w-5 h-5" />
              <div className="text-xs text-gray-400 mt-1" data-testid="text-rating-count">
                {aggregate.count} review{aggregate.count === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              {[5,4,3,2,1].map((n) => {
                const c = aggregate.distribution[String(n)] || 0;
                const pct = aggregate.count ? (c / aggregate.count) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6">{n}★</span>
                    <Progress value={pct} className="h-2 flex-1 bg-[#0D0D0D]" />
                    <span className="text-xs text-gray-500 w-8 text-right">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      {showComposer && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-300">Your rating:</span>
              <StarRow rating={draftRating} size="w-6 h-6" onSelect={setDraftRating} />
              {myCompletion && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border-0 gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified completion
                </Badge>
              )}
            </div>
            <Input
              placeholder="Title (optional)"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="bg-[#0D0D0D] border-[#333] text-white"
              data-testid="input-review-title"
            />
            <Textarea
              placeholder="What helped you? What would you change? (10+ chars)"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              className="bg-[#0D0D0D] border-[#333] text-white resize-none min-h-[100px]"
              data-testid="input-review-body"
            />
            <div className="flex justify-end gap-2">
              {editing && (
                <Button variant="outline" size="sm" className="border-[#333] text-gray-300"
                  onClick={() => setEditing(false)}>Cancel</Button>
              )}
              <Button
                size="sm"
                className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90"
                disabled={draftBody.trim().length < 10 || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                data-testid="button-submit-review"
              >
                <Send className="w-4 h-4 mr-1.5" /> Post review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="py-4 text-sm text-gray-400">
            Sign in to leave a review.
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      <div className="space-y-2">
        {reviews.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="py-8 text-center text-gray-400 text-sm">
              No reviews yet — be the first.
            </CardContent>
          </Card>
        ) : (
          reviews.map((r) => {
            const isMine = r.id === data.myReviewId;
            return (
              <Card key={r.id} className="bg-[#1a1a1a] border-[#333]" data-testid={`card-review-${r.id}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.authorAvatar || undefined} />
                        <AvatarFallback className="bg-[#E2741B]/20 text-[#E2741B] text-xs">
                          {(r.authorName || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm text-white font-medium">{r.authorName || "Survivor"}</div>
                        <div className="flex items-center gap-2">
                          <StarRow rating={r.rating} size="w-3.5 h-3.5" />
                          <span className="text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {r.isVerifiedCompletion && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-0 gap-1">
                        <ShieldCheck className="w-3 h-3" /> Completed
                      </Badge>
                    )}
                  </div>
                  {r.title && <h4 className="text-white font-semibold text-sm">{r.title}</h4>}
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.body}</p>
                  <div className="flex items-center gap-2 pt-1">
                    {!isMine && user && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-[#333] ${r.helpfulByMe ? "text-[#E2741B]" : "text-gray-300"}`}
                        onClick={() => helpfulMutation.mutate(r.id)}
                        disabled={helpfulMutation.isPending}
                        data-testid={`button-helpful-${r.id}`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${r.helpfulByMe ? "fill-[#E2741B]" : ""}`} />
                        Helpful · {r.helpfulCount}
                      </Button>
                    )}
                    {isMine && (
                      <>
                        <Button size="sm" variant="outline" className="border-[#333] text-gray-300"
                          onClick={() => {
                            setDraftRating(r.rating);
                            setDraftTitle(r.title || "");
                            setDraftBody(r.body);
                            setEditing(true);
                          }}
                          data-testid={`button-edit-review-${r.id}`}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline"
                          className="border-rose-500/40 text-rose-300"
                          onClick={() => deleteMutation.mutate(r.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-review-${r.id}`}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
