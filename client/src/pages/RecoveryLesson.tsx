import { useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  GraduationCap,
  Lock,
  Trophy,
  BookOpen,
} from "lucide-react";

function renderMarkdown(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let inPara = false;
  const closePara = () => {
    if (inPara) {
      html += "</p>";
      inPara = false;
    }
  };
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closePara();
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closePara();
      closeList();
      html += `<h3 class="text-xl font-bold text-white mt-6 mb-2">${inline(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      closePara();
      closeList();
      html += `<h2 class="text-2xl font-bold text-[#C9941A] mt-8 mb-3">${inline(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      closePara();
      closeList();
      html += `<h1 class="text-3xl font-black text-white mt-8 mb-4">${inline(line.slice(2))}</h1>`;
    } else if (line.startsWith("> ")) {
      closePara();
      closeList();
      html += `<blockquote class="border-l-4 border-[#C9941A] pl-4 italic text-gray-300 my-4">${inline(line.slice(2))}</blockquote>`;
    } else if (/^[-*]\s+/.test(line)) {
      closePara();
      if (!inList) {
        html += '<ul class="list-disc pl-6 space-y-1 my-3 text-gray-200">';
        inList = true;
      }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
    } else {
      closeList();
      if (!inPara) {
        html += '<p class="text-gray-200 leading-relaxed my-3">';
        inPara = true;
      } else {
        html += " ";
      }
      html += inline(line);
    }
  }
  closePara();
  closeList();
  return html;
}

export default function RecoveryLesson() {
  const { chapter: chapterParam } = useParams<{ chapter: string }>();
  const chapter = parseInt(chapterParam ?? "1", 10);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<{
    lesson: {
      id: number;
      chapter: number;
      partNumber: number;
      title: string;
      subtitle: string | null;
      estimatedMinutes: number;
      requiredTier: string;
      body: string;
      keyTakeaways: string[] | null;
      passingScore: number;
    };
    progress: { status: string; bestScore: number; attempts: number } | null;
    userTier: string;
  }>({
    queryKey: ["/api/recovery/university/lesson", chapter],
    enabled: !!user && Number.isFinite(chapter),
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/recovery/university/lesson/${chapter}/start`),
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/recovery/university/lesson/${chapter}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/university/lesson", chapter] });
      queryClient.invalidateQueries({ queryKey: ["/api/recovery/university/progress"] });
      toast({ title: "Marked as read", description: "Now lock it in with the quiz." });
    },
  });

  // Auto-mark as started on first load (idempotent on the server)
  useEffect(() => {
    if (data?.lesson && !data.progress) {
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.lesson?.id]);

  const html = useMemo(() => (data?.lesson ? renderMarkdown(data.lesson.body) : ""), [data?.lesson]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p className="text-gray-400">Loading lesson…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 text-[#C9941A] mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Sign in to access lessons</h2>
            <p className="text-gray-400 mb-4">Recovery University is for survivors. Free to start.</p>
            <Link href="/api/login">
              <Button className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black" data-testid="button-sign-in">
                Sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const errStatus = (error as any)?.status;
  if (errStatus === 403) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 text-[#C9941A] mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Tier locked</h2>
            <p className="text-gray-400 mb-4">
              Upgrade your plan to unlock Chapter {chapter}.
            </p>
            <Link href="/pricing">
              <Button className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black" data-testid="button-upgrade-tier">
                See plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.lesson) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-4">Lesson not found.</p>
            <Link href="/recovery/university">
              <Button variant="outline" className="border-[#333] text-white" data-testid="button-back-syllabus">
                Back to syllabus
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lesson, progress } = data;
  const passed = progress?.status === "passed";
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < 33 ? chapter + 1 : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="bg-[#0D0D0D] border-b border-[#333] py-4 px-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link href="/recovery/university">
            <Button variant="outline" size="sm" className="border-[#333] text-white hover:bg-[#1a1a1a]" data-testid="button-back-syllabus">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Syllabus
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GraduationCap className="w-4 h-4 text-[#C9941A]" />
            <span>Recovery University</span>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="outline" className="border-[#C9941A]/50 text-[#C9941A] bg-[#C9941A]/10" data-testid="badge-chapter">
              Part {lesson.partNumber} · Chapter {lesson.chapter}
            </Badge>
            <Badge variant="outline" className="border-[#333] text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {lesson.estimatedMinutes} min
            </Badge>
            {passed && (
              <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30" data-testid="badge-passed">
                <CheckCircle className="w-3 h-3 mr-1" />
                Passed · {progress?.bestScore}%
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2" data-testid="heading-lesson-title">
            {lesson.title}
          </h1>
          {lesson.subtitle && (
            <p className="text-lg text-gray-400" data-testid="text-lesson-subtitle">{lesson.subtitle}</p>
          )}
        </div>

        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
          data-testid="content-lesson-body"
        />

        {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
          <Card className="bg-[#1a1a1a] border border-[#C9941A]/30 mt-8" data-testid="card-takeaways">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-[#C9941A]" />
                <h3 className="text-lg font-bold text-white">Key takeaways</h3>
              </div>
              <ul className="space-y-2 text-gray-200">
                {lesson.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-[#C9941A] mt-1 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            variant="outline"
            className="border-[#333] text-white hover:bg-[#1a1a1a]"
            data-testid="button-mark-complete"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {progress?.readAt || progress?.status === "read" || progress?.status === "passed" ? "Marked as read" : "Mark as read"}
          </Button>
          <Button
            onClick={() => setLocation(`/recovery/university/quiz/${chapter}`)}
            className="bg-[#C9941A] hover:bg-[#C9941A]/90 text-black"
            data-testid="button-take-quiz"
          >
            {passed ? "Retake quiz" : "Take the quiz"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-[#333] pt-6">
          {prevChapter ? (
            <Link href={`/recovery/university/lesson/${prevChapter}`}>
              <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-prev-chapter">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Chapter {prevChapter}
              </Button>
            </Link>
          ) : (
            <span />
          )}
          {nextChapter ? (
            <Link href={`/recovery/university/lesson/${nextChapter}`}>
              <Button variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-next-chapter">
                Chapter {nextChapter}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </article>

      <SasquatchChatWidget />
    </div>
  );
}
