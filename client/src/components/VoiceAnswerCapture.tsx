import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  questionId: number;
  onResult: (r: { transcript: string; correct: boolean; similarity: number }) => void;
}

export default function VoiceAnswerCapture({ questionId, onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ transcript: string; correct: boolean; similarity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => { recRef.current?.stop(); }, []);

  const start = async () => {
    setError(null); setResult(null); chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setSubmitting(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "answer.webm");
          const r = await fetch(`/api/quiz-questions/${questionId}/voice-answer`, { method: "POST", body: fd, credentials: "include" });
          if (!r.ok) throw new Error((await r.json()).error || "Transcription failed");
          const data = await r.json();
          setResult({ transcript: data.transcript, correct: data.correct, similarity: data.similarity });
          onResult({ transcript: data.transcript, correct: data.correct, similarity: data.similarity });
        } catch (e: any) {
          setError(e?.message || "Failed to grade voice answer");
        } finally {
          setSubmitting(false);
        }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      setError(e?.message || "Microphone access denied");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-2" data-testid={`voice-answer-${questionId}`}>
      <div className="flex items-center gap-2">
        {!recording ? (
          <Button onClick={start} disabled={submitting} className="bg-[#E2741B] text-black hover:bg-[#E2741B]" data-testid="button-voice-start">
            <Mic className="w-4 h-4 mr-2" /> Record answer
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" data-testid="button-voice-stop">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        )}
        {submitting && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Transcribing…</span>}
      </div>
      {error && <div className="text-xs text-red-400" data-testid="text-voice-error">{error}</div>}
      {result && (
        <div className={`text-xs rounded-md border px-2 py-1.5 ${result.correct ? "border-green-600/40 text-green-400" : "border-red-600/40 text-red-400"}`} data-testid="text-voice-result">
          {result.correct ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
          Heard: "{result.transcript}" <span className="text-gray-500">({Math.round(result.similarity * 100)}% match)</span>
        </div>
      )}
    </div>
  );
}
