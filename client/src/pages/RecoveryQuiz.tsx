import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
  RotateCcw,
  GraduationCap,
  Lock,
  Award,
} from "lucide-react";

interface QuizQuestion {
  id: number;
  order: number;
  prompt: string;
  options: { id: string; text: string }[];
}

interface QuizPayload {
  chapter: number;
  lessonTitle: string;
  passingScore: number;
  questions: QuizQuestion[];
}

interface AttemptResponse {
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  graded: Record<string, { picked: string | null; correct: boolean; correctOptionId: string; explanation: string }>;
  issuedCertificate: { partNumber: number; serial: string } | null;
}

export default function RecoveryQuiz() {
  const { chapter: chapterParam } = useParams<{ chapter: string }>();
  const chapter = parseInt(chapterParam ?? "1", 10);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hintsRevealed, setHintsRevealed] = useState<Record<number, string>>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<AttemptResponse | null>(null);
  const startedAt = useRef<number>(Date.now());

  const { data: quiz, isLoading, error } = useQuery<QuizPayload>({
    queryKey: ["/api/recovery/university/quiz", chapter],
    enabled: !!user && Number.isFinite(chapter),
    retry: false,
  });

  const { data: personaData } = useQuery<{ persona: { name: string } | null }>({
    queryKey: ['/api/persona/me'],
    enabled: !!user,
  });
  const persona = personaData?.persona ?? null;

  const hintMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest("GET", `/api/recovery/university/quiz/${chapter}/hint/${questionId}`);
      return res.json() as Promise<{ questionId: number; hint: string }>;
    },
    onSuccess: (d) => {
      setHintsRevealed((prev) => {
        if (prev[d.questionId]) return prev;
        setHintsUsed((n) => n + 1);
        return { ...prev, [d.questionId]: d.hint };
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/recovery/university/quiz/${chapter}/attempt`, {
        answers,
        hintsUsed,
        durationSec: Math.floor((Date.now() - startedAt.current) / 1000),
      });
      return res.json() as Promise<AttemptResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/university/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/university/lesson", chapter] });
      if (data.passed) {
        toast({
          title: "Chapter passed",
          description: `You scored ${data.score}%. ${data.issuedCertificate ? "New certificate unlocked." : ""}`,
        });
      } else {
        toast({
          title: `${data.score}% — not yet`,
          description: `You need ${data.passingScore}% to pass. Review the explanations and try again.`,
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    setCurrentIdx(0);
    setAnswers({});
    setHintsRevealed({});
    setHintsUsed(0);
    setResult(null);
    startedAt.current = Date.now();
  }, [chapter]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p className="text-gray-400">Loading quiz…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 text-[#C9941A] mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Sign in to take the quiz.</p>
            <Link href="/api/login">
              <Button className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black" data-testid="button-sign-in">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if ((error as any)?.status === 403) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 text-[#C9941A] mx-auto mb-3" />
            <p className="text-gray-400 mb-4">This quiz is locked behind a higher tier.</p>
            <Link href="/pricing">
              <Button className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black" data-testid="button-upgrade">See plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p className="text-gray-400">No quiz found.</p>
      </div>
    );
  }

  // ── Result view ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <header className="bg-[#0D0D0D] border-b border-[#333] py-4 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href={`/recovery/university/lesson/${chapter}`}>
              <Button variant="outline" size="sm" className="border-[#333] text-white hover:bg-[#1a1a1a]" data-testid="button-back-lesson">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to lesson
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <GraduationCap className="w-4 h-4 text-[#C9941A]" />
              <span>Recovery University</span>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-10">
          <Card className="bg-[#1a1a1a] border border-[#333] mb-6" data-testid="card-result-summary">
            <CardContent className="p-8 text-center">
              {result.passed ? (
                <CheckCircle className="w-14 h-14 text-[#C9941A] mx-auto mb-3" />
              ) : (
                <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
              )}
              <h1 className="text-3xl font-black mb-2" data-testid="heading-quiz-result">
                {result.passed ? "Chapter passed" : "Not yet — keep going"}
              </h1>
              {persona && (
                <p className="text-sm text-[#C9941A] italic mb-2" data-testid="text-persona-line">
                  {result.passed
                    ? `${persona.name} keeps the streak.`
                    : `${persona.name} doesn't quit on this. Try again.`}
                </p>
              )}
              <p className="text-5xl font-black text-[#C9941A] my-4" data-testid="text-final-score">
                {result.score}%
              </p>
              <p className="text-gray-400">
                {result.correctCount} / {result.totalQuestions} correct · need {result.passingScore}% to pass
              </p>
              {result.issuedCertificate && (
                <div className="mt-6 p-4 rounded-lg bg-[#C9941A]/10 border border-[#C9941A]/30">
                  <Award className="w-6 h-6 text-[#C9941A] mx-auto mb-2" />
                  <p className="font-bold text-white">Part {result.issuedCertificate.partNumber} certificate unlocked!</p>
                  <Link href={`/recovery/university/certificate/${result.issuedCertificate.partNumber}`}>
                    <Button className="mt-3 bg-[#C9941A] hover:bg-[#C9941A]/90 text-black" data-testid="button-view-certificate">
                      View certificate
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 mb-8">
            {quiz.questions.map((q, idx) => {
              const g = result.graded[String(q.id)];
              if (!g) return null;
              return (
                <Card
                  key={q.id}
                  className={`bg-[#1a1a1a] border ${g.correct ? "border-[#C9941A]/30" : "border-red-500/30"}`}
                  data-testid={`card-graded-${q.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      {g.correct ? (
                        <CheckCircle className="w-5 h-5 text-[#C9941A] mt-1 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-1">Question {idx + 1}</p>
                        <p className="font-semibold text-white mb-3">{q.prompt}</p>
                        <div className="space-y-1 text-sm">
                          {q.options.map((opt) => {
                            const isCorrect = opt.id === g.correctOptionId;
                            const wasPicked = opt.id === g.picked;
                            return (
                              <div
                                key={opt.id}
                                className={`p-2 rounded ${
                                  isCorrect
                                    ? "bg-[#C9941A]/15 text-[#C9941A]"
                                    : wasPicked
                                      ? "bg-red-500/10 text-red-300"
                                      : "text-gray-400"
                                }`}
                              >
                                <span className="font-mono mr-2">{opt.id.toUpperCase()}.</span>
                                {opt.text}
                                {isCorrect && <span className="ml-2 text-xs">(correct)</span>}
                                {wasPicked && !isCorrect && <span className="ml-2 text-xs">(your answer)</span>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 p-3 rounded bg-[#0D0D0D] border border-[#333] text-sm text-gray-300">
                          <strong className="text-[#C9941A]">Why: </strong>
                          {g.explanation}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!result.passed && (
              <Button
                onClick={() => {
                  setCurrentIdx(0);
                  setAnswers({});
                  setHintsRevealed({});
                  setHintsUsed(0);
                  setResult(null);
                  startedAt.current = Date.now();
                }}
                className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
                data-testid="button-retake-quiz"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake quiz
              </Button>
            )}
            <Link href={`/recovery/university/lesson/${chapter}`}>
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a]" data-testid="button-review-lesson">
                Review lesson
              </Button>
            </Link>
            {result.passed && chapter < 33 && (
              <Button
                onClick={() => setLocation(`/recovery/university/lesson/${chapter + 1}`)}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#1a1a1a]"
                data-testid="button-next-chapter"
              >
                Next chapter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Link href="/recovery/university">
              <Button variant="ghost" className="text-gray-400" data-testid="button-back-syllabus">
                Back to syllabus
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Question view ─────────────────────────────────────────────────────────
  const currentQ = quiz.questions[currentIdx];
  const picked = answers[currentQ.id];
  const isLast = currentIdx === quiz.questions.length - 1;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const progressPct = Math.round(((currentIdx + (picked ? 1 : 0)) / quiz.questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="bg-[#0D0D0D] border-b border-[#333] py-4 px-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href={`/recovery/university/lesson/${chapter}`}>
            <Button variant="outline" size="sm" className="border-[#333] text-white hover:bg-[#1a1a1a]" data-testid="button-back-lesson">
              <ArrowLeft className="w-4 h-4 mr-1" /> Lesson
            </Button>
          </Link>
          <div className="text-sm text-gray-400">
            Chapter {chapter} · Question {currentIdx + 1}/{quiz.questions.length}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{quiz.lessonTitle}</span>
            <span>Need {quiz.passingScore}% to pass</span>
          </div>
          <Progress value={progressPct} className="h-2 bg-[#333] [&>div]:bg-[#C9941A]" data-testid="progress-quiz" />
        </div>

        <Card className="bg-[#1a1a1a] border border-[#333]" data-testid={`card-question-${currentQ.id}`}>
          <CardContent className="p-6 md:p-8">
            <Badge variant="outline" className="mb-4 border-[#C9941A]/50 text-[#C9941A] bg-[#C9941A]/10">
              Question {currentIdx + 1}
            </Badge>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6" data-testid="text-question-prompt">
              {currentQ.prompt}
            </h2>

            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isPicked = picked === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                    className={`w-full text-left p-4 rounded-lg border transition-colors hover-elevate ${
                      isPicked
                        ? "border-[#C9941A] bg-[#C9941A]/10"
                        : "border-[#333] bg-[#0D0D0D]"
                    }`}
                    data-testid={`option-${currentQ.id}-${opt.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isPicked ? "bg-[#C9941A] text-black" : "bg-[#333] text-gray-400"
                        }`}
                      >
                        {opt.id.toUpperCase()}
                      </div>
                      <span className={isPicked ? "text-white" : "text-gray-200"}>{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {hintsRevealed[currentQ.id] ? (
                <div className="p-4 rounded-lg bg-[#C9941A]/10 border border-[#C9941A]/30 flex gap-3" data-testid={`hint-${currentQ.id}`}>
                  <Lightbulb className="w-5 h-5 text-[#C9941A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#C9941A] mb-1">Hint</p>
                    <p className="text-sm text-gray-200">{hintsRevealed[currentQ.id]}</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => hintMutation.mutate(currentQ.id)}
                  disabled={hintMutation.isPending}
                  className="text-[#C9941A] hover:bg-[#C9941A]/10"
                  data-testid={`button-hint-${currentQ.id}`}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Stuck? Get a hint
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            className="border-[#333] text-white hover:bg-[#1a1a1a]"
            data-testid="button-prev-question"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          {isLast ? (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!allAnswered || submitMutation.isPending}
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
              data-testid="button-submit-quiz"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Grading…" : "Submit quiz"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIdx((i) => Math.min(quiz.questions.length - 1, i + 1))}
              disabled={!picked}
              className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
              data-testid="button-next-question"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
