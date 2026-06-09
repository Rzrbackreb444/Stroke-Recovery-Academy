import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users, GraduationCap, Star, DollarSign, TrendingUp, ShieldCheck, BookOpen, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import RecoveryHeader from "@/components/RecoveryHeader";

interface SummaryRow {
  courses: number; enrollments: number; completions: number; completionRate: number;
  avgRating: number; reviewCount: number;
  earningsCents: number; pendingCents: number; paidCents: number;
}
interface CourseRow {
  id: number; slug: string; title: string; status: string;
  priceCredits: number | null;
  enrolled: number; completed: number; completionRate: number; avgProgress: number;
  avgRating: number; reviewCount: number;
  earningsCents: number; pendingCents: number; paidCents: number;
}
interface RecentReview {
  id: number; course_id: number; rating: number;
  title: string | null; body: string;
  is_verified_completion: boolean; created_at: string; course_title: string;
}

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Kpi({ icon: Icon, label, value, sub, testid }: any) {
  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-2xl font-bold text-white mt-1" data-testid={testid}>{value}</div>
            {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
          </div>
          <div className="w-10 h-10 rounded-md bg-[#E2741B]/15 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#E2741B]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorAnalytics() {
  const { data, isLoading } = useQuery<{ summary: SummaryRow; courses: CourseRow[] }>({
    queryKey: ["/api/instructor/analytics"],
  });
  const { data: recent = [] } = useQuery<RecentReview[]>({
    queryKey: ["/api/instructor/analytics/recent-reviews"],
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <RecoveryHeader />
        <div className="max-w-7xl mx-auto px-4 py-12 text-gray-400 text-center">Loading analytics…</div>
      </div>
    );
  }

  const { summary, courses } = data;
  const noCourses = summary.courses === 0;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoveryHeader />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Instructor Analytics</h1>
            <p className="text-gray-400 mt-1">Students, completion, ratings, and earnings across your courses.</p>
          </div>
          <Link href="/course-studio">
            <Button className="bg-[#E2741B] text-black hover:bg-[#E2741B]/90" data-testid="button-create-course">
              <BookOpen className="w-4 h-4 mr-2" /> Open Course Studio
            </Button>
          </Link>
        </div>

        {noCourses ? (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="py-12 text-center space-y-3">
              <GraduationCap className="w-12 h-12 text-[#E2741B] mx-auto" />
              <h2 className="text-xl font-semibold">No courses yet</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Publish your first course in the Course Studio to start teaching survivors and earning 85% of every sale.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Kpi icon={Users} label="Enrollments" value={summary.enrollments.toLocaleString()}
                sub={`${summary.completions.toLocaleString()} completed`}
                testid="kpi-enrollments" />
              <Kpi icon={TrendingUp} label="Completion rate"
                value={`${summary.completionRate}%`}
                sub={`across ${summary.courses} course${summary.courses === 1 ? "" : "s"}`}
                testid="kpi-completion" />
              <Kpi icon={Star} label="Avg rating"
                value={summary.avgRating ? summary.avgRating.toFixed(2) : "—"}
                sub={`${summary.reviewCount} review${summary.reviewCount === 1 ? "" : "s"}`}
                testid="kpi-rating" />
              <Kpi icon={DollarSign} label="Earnings (85%)"
                value={fmtMoney(summary.earningsCents)}
                sub={`${fmtMoney(summary.paidCents)} paid · ${fmtMoney(summary.pendingCents)} pending`}
                testid="kpi-earnings" />
            </div>

            {/* Per-course table */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Courses</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="pb-2 pr-4">Course</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Enrolled</th>
                      <th className="pb-2 pr-4">Completion</th>
                      <th className="pb-2 pr-4">Rating</th>
                      <th className="pb-2 pr-4">Earnings</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {courses.map((c) => (
                      <tr key={c.id} data-testid={`row-course-${c.id}`}>
                        <td className="py-3 pr-4">
                          <div className="text-white font-medium">{c.title}</div>
                          <div className="text-xs text-gray-500">/{c.slug}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={c.status === "published"
                            ? "bg-emerald-500/15 text-emerald-300 border-0"
                            : "bg-zinc-700/50 text-zinc-300 border-0"}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-200">{c.enrolled}</td>
                        <td className="py-3 pr-4 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <Progress value={c.completionRate} className="h-1.5 flex-1 bg-[#0D0D0D]" />
                            <span className="text-xs text-gray-300 w-10 text-right">{c.completionRate}%</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{c.completed} completed</div>
                        </td>
                        <td className="py-3 pr-4">
                          {c.reviewCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-[#E2741B] fill-[#E2741B]" />
                              <span className="text-gray-200">{c.avgRating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({c.reviewCount})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No reviews</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-gray-200">{fmtMoney(c.earningsCents)}</div>
                          <div className="text-xs text-gray-500">
                            {fmtMoney(c.paidCents)} paid
                          </div>
                        </td>
                        <td className="py-3">
                          <Link href={`/course/${c.id}`}>
                            <Button size="sm" variant="ghost" className="text-gray-300"
                              data-testid={`button-view-course-${c.id}`}>
                              View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Recent reviews */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Recent reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recent.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">No reviews yet — keep teaching.</div>
                ) : recent.map((r) => (
                  <div key={r.id} className="rounded-md border border-[#333] p-3"
                    data-testid={`recent-review-${r.id}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating
                              ? "text-[#E2741B] fill-[#E2741B]" : "text-zinc-600"}`} />
                          ))}
                        </div>
                        <Link href={`/course/${r.course_id}`}>
                          <span className="text-xs text-gray-400 hover:text-[#E2741B] cursor-pointer">
                            {r.course_title}
                          </span>
                        </Link>
                        {r.is_verified_completion && (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-0 gap-1">
                            <ShieldCheck className="w-3 h-3" /> Completed
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.title && <div className="text-sm font-medium text-white mt-2">{r.title}</div>}
                    <p className="text-sm text-gray-300 mt-1 line-clamp-3 whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
