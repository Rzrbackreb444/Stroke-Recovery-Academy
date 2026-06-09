import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2, GripVertical, ArrowRight } from "lucide-react";
import VoiceAnswerCapture from "./VoiceAnswerCapture";

type QType = "multiple_choice" | "mcq" | "true_false" | "fill_in" | "short_answer" | "drag_order" | "voice_record";
interface Option { id: string; text: string; }
interface Question { id: number; quizId: number; questionType: QType; question: string; options: Option[] | null; points: number; order?: number; }
interface Quiz { id: number; title: string; passingScore: number; allowRetakes: boolean; }
interface AttemptResult { score: number; passed: boolean; attemptNumber: number; passingScore: number; results: { questionId: number; correct: boolean; score: number; explanation: string | null; correctAnswer: string | null }[]; }

export default function QuizRunner({ quizId, onComplete }: { quizId: number; onComplete?: (r: AttemptResult) => void }) {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [startedAt] = useState(() => Date.now());

  const { data, isLoading } = useQuery<{ quiz: Quiz; questions: Question[] }>({
    queryKey: ["/api/quizzes", quizId],
  });

  if (isLoading) return <div className="py-8 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (!data) return <div className="text-sm text-gray-500">Quiz unavailable.</div>;

  const { quiz, questions } = data;

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await apiRequest("POST", `/api/quizzes/${quizId}/attempt`, {
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [String(k), v])),
        timeTaken: Math.round((Date.now() - startedAt) / 1000),
      });
      const json = await r.json() as AttemptResult;
      setResult(json);
      onComplete?.(json);
      queryClient.invalidateQueries({ queryKey: ["/api/review-queue"] });
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setAnswers({}); setResult(null); };

  if (result) {
    return (
      <Card className="p-4 bg-[#1a1a1a] border-[#333] space-y-3" data-testid="quiz-result">
        <div className="flex items-center gap-3">
          {result.passed ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
          <div>
            <div className="text-lg font-bold text-[#E2741B]" data-testid="text-quiz-score">{result.score}% · {result.passed ? "Passed" : "Keep going"}</div>
            <div className="text-xs text-gray-500">Passing: {result.passingScore}% · Attempt {result.attemptNumber}</div>
          </div>
        </div>
        <div className="space-y-2">
          {result.results.map((r, i) => {
            const q = questions.find(q => q.id === r.questionId);
            if (!q) return null;
            return (
              <div key={r.questionId} className={`rounded-md border px-3 py-2 text-sm ${r.correct ? "border-green-600/30" : "border-red-600/30"}`} data-testid={`result-q-${r.questionId}`}>
                <div className="flex items-start gap-2">
                  {r.correct ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <div className="text-gray-300">{i + 1}. {q.question}</div>
                    {!r.correct && r.correctAnswer && <div className="text-xs text-gray-500 mt-1">Correct: <span className="text-[#E2741B]">{r.correctAnswer}</span></div>}
                    {r.explanation && <div className="text-xs text-gray-400 mt-1 italic">{r.explanation}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {quiz.allowRetakes && !result.passed && (
          <Button onClick={retry} className="bg-[#E2741B] text-black hover:bg-[#E2741B]" data-testid="button-quiz-retry">Try again</Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid={`quiz-runner-${quizId}`}>
      <div>
        <h3 className="text-lg font-bold text-[#E2741B]" data-testid="text-quiz-title">{quiz.title}</h3>
        <p className="text-xs text-gray-500">Passing score: {quiz.passingScore}% · {questions.length} question{questions.length !== 1 ? "s" : ""}</p>
      </div>
      {questions.map((q, idx) => (
        <Card key={q.id} className="p-4 bg-[#1a1a1a] border-[#333] space-y-3" data-testid={`question-${q.id}`}>
          <div className="flex items-start gap-2">
            <span className="text-[#E2741B] font-bold">{idx + 1}.</span>
            <div className="flex-1 text-gray-200">{q.question}</div>
          </div>
          <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswers(a => ({ ...a, [q.id]: v }))} />
        </Card>
      ))}
      <Button onClick={submit} disabled={submitting} className="bg-[#E2741B] text-black hover:bg-[#E2741B]" data-testid="button-quiz-submit">
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Grading…</> : <>Submit quiz <ArrowRight className="w-4 h-4 ml-2" /></>}
      </Button>
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const type = q.questionType;

  if (type === "multiple_choice" || type === "mcq" || type === "true_false") {
    const opts = q.options || [];
    return (
      <div className="space-y-1.5">
        {opts.map(o => (
          <label key={o.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover-elevate ${String(value) === String(o.id) ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333]"}`} data-testid={`option-${q.id}-${o.id}`}>
            <input type="radio" name={`q-${q.id}`} checked={String(value) === String(o.id)} onChange={() => onChange(String(o.id))} className="accent-[#E2741B]" />
            <span className="text-sm text-gray-300">{o.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (type === "fill_in" || type === "short_answer") {
    return (
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="bg-[#0D0D0D] border-[#333] text-gray-200"
        data-testid={`input-fill-${q.id}`}
      />
    );
  }

  if (type === "drag_order") {
    const opts = q.options || [];
    const order: string[] = Array.isArray(value) ? value : opts.map(o => String(o.id));
    const move = (i: number, dir: -1 | 1) => {
      const next = [...order];
      const j = i + dir;
      if (j < 0 || j >= next.length) return;
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    return (
      <ul className="space-y-1.5" data-testid={`drag-${q.id}`}>
        {order.map((oid, i) => {
          const o = opts.find(x => String(x.id) === String(oid));
          if (!o) return null;
          return (
            <li key={oid} className="flex items-center gap-2 rounded-md border border-[#333] bg-[#0D0D0D] px-3 py-2" data-testid={`drag-item-${q.id}-${oid}`}>
              <GripVertical className="w-4 h-4 text-gray-600" />
              <span className="flex-1 text-sm text-gray-300">{o.text}</span>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => move(i, -1)} disabled={i === 0} data-testid={`button-up-${q.id}-${oid}`}>↑</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => move(i, 1)} disabled={i === order.length - 1} data-testid={`button-down-${q.id}-${oid}`}>↓</Button>
            </li>
          );
        })}
      </ul>
    );
  }

  if (type === "voice_record") {
    return (
      <VoiceAnswerCapture
        questionId={q.id}
        onResult={(r) => onChange(r.transcript)}
      />
    );
  }

  return <div className="text-xs text-red-400">Unsupported question type: {type}</div>;
}
