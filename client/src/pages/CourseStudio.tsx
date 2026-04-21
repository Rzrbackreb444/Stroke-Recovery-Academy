import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, Upload, BookOpen,
  FileText, Video, ListChecks, Loader2, GraduationCap, Rocket, Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

type LessonType = "text" | "video" | "quiz";
interface LessonDraft {
  id?: number;
  tmpId: string;
  title: string;
  content: string;
  lessonType: LessonType;
  videoUrl?: string | null;
  duration?: number | null;
}
interface ModuleDraft {
  id?: number;
  tmpId: string;
  title: string;
  description: string;
  lessons: LessonDraft[];
}

interface CourseCategory { id: number; slug: string; name: string; icon: string | null; color: string | null; sortOrder: number; }
interface PublishedCourseLite { id: number; title: string; slug: string; difficulty: string; }
interface MyCourseRow { id: number; title: string; slug: string; status: string; isPublished: boolean; updatedAt: string; difficulty: string; enrollmentCount: number; }

const DIFFICULTIES: { value: string; label: string; description: string }[] = [
  { value: "survival", label: "Survival", description: "Level 0 — stabilize, the absolute basics" },
  { value: "rebuild",  label: "Rebuild",  description: "Level 1–2 — daily routine, small wins" },
  { value: "rise",     label: "Rise",     description: "Level 3 — strength, momentum, habits" },
  { value: "reign",    label: "Reign",    description: "Level 4 — mastery, leadership, legacy" },
];

const tmp = () => Math.random().toString(36).slice(2);

function emptyModule(): ModuleDraft {
  return {
    tmpId: tmp(),
    title: "New Module",
    description: "",
    lessons: [{ tmpId: tmp(), title: "New Lesson", content: "", lessonType: "text" }],
  };
}

export default function CourseStudio() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentCourseId, setCurrentCourseId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<string>("survival");
  const [priceCredits, setPriceCredits] = useState<number>(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "preview" | "published">("draft");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [prerequisiteIds, setPrerequisiteIds] = useState<number[]>([]);
  const [modules, setModules] = useState<ModuleDraft[]>([emptyModule()]);

  const { data: myCourses = [] } = useQuery<MyCourseRow[]>({ queryKey: ["/api/my-courses"] });
  const { data: categories = [] } = useQuery<CourseCategory[]>({ queryKey: ["/api/course-categories"] });
  const { data: publishedList = [] } = useQuery<PublishedCourseLite[]>({
    queryKey: ["/api/courses/published-list", currentCourseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/published-list${currentCourseId ? `?exclude=${currentCourseId}` : ""}`);
      return res.ok ? res.json() : [];
    },
  });

  // Load full tree when switching courses
  useEffect(() => {
    if (!currentCourseId) return;
    (async () => {
      try {
        const [courseRes, taxRes] = await Promise.all([
          fetch(`/api/my-courses/${currentCourseId}`),
          fetch(`/api/my-courses/${currentCourseId}/taxonomy`),
        ]);
        if (!courseRes.ok) throw new Error("Failed to load course");
        const c = await courseRes.json();
        setTitle(c.title || "");
        setDescription(c.description || "");
        setDifficulty(c.difficulty || "survival");
        setPriceCredits(c.priceCredits ?? 0);
        setThumbnailUrl(c.thumbnailUrl || "");
        setStatus(c.status || "draft");
        const loadedModules: ModuleDraft[] = (c.modules || []).map((m: any) => ({
          id: m.id,
          tmpId: tmp(),
          title: m.title || "",
          description: m.description || "",
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id, tmpId: tmp(),
            title: l.title || "",
            content: l.content || "",
            lessonType: (l.lessonType as LessonType) || "text",
            videoUrl: l.videoUrl || null,
            duration: l.duration ?? null,
          })),
        }));
        setModules(loadedModules.length ? loadedModules : [emptyModule()]);
        if (taxRes.ok) {
          const tax = await taxRes.json();
          setCategoryIds(tax.categoryIds || []);
          setPrerequisiteIds(tax.prerequisiteIds || []);
        }
      } catch (e: any) {
        toast({ title: "Load failed", description: e?.message || "Couldn't load this course", variant: "destructive" });
      }
    })();
  }, [currentCourseId]);

  function startNewCourse() {
    setCurrentCourseId(null);
    setTitle(""); setDescription(""); setDifficulty("survival"); setPriceCredits(0);
    setThumbnailUrl(""); setStatus("draft"); setCategoryIds([]); setPrerequisiteIds([]);
    setModules([emptyModule()]);
  }

  function updateModule(idx: number, patch: Partial<ModuleDraft>) {
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  }
  function moveModule(idx: number, dir: -1 | 1) {
    setModules(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }
  function addLesson(moduleIdx: number) {
    setModules(prev => prev.map((m, i) => i === moduleIdx ? { ...m, lessons: [...m.lessons, { tmpId: tmp(), title: "New Lesson", content: "", lessonType: "text" }] } : m));
  }
  function updateLesson(moduleIdx: number, lessonIdx: number, patch: Partial<LessonDraft>) {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIdx) return m;
      return { ...m, lessons: m.lessons.map((l, j) => j === lessonIdx ? { ...l, ...patch } : l) };
    }));
  }
  function removeLesson(moduleIdx: number, lessonIdx: number) {
    setModules(prev => prev.map((m, i) => i !== moduleIdx ? m : { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIdx) }));
  }
  function moveLesson(moduleIdx: number, lessonIdx: number, dir: -1 | 1) {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIdx) return m;
      const ls = [...m.lessons];
      const swap = lessonIdx + dir;
      if (swap < 0 || swap >= ls.length) return m;
      [ls[lessonIdx], ls[swap]] = [ls[swap], ls[lessonIdx]];
      return { ...m, lessons: ls };
    }));
  }

  async function saveCourse(nextStatus?: "draft" | "preview" | "published") {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Give your course a name first.", variant: "destructive" });
      return null;
    }
    setIsSaving(true);
    try {
      const payload = {
        title, description, difficulty, priceCredits, thumbnailUrl: thumbnailUrl || null,
        status: nextStatus || status,
        categoryIds, prerequisiteIds,
        modules: modules.map(m => ({
          title: m.title, description: m.description,
          lessons: m.lessons.map(l => ({
            title: l.title, content: l.content, lessonType: l.lessonType,
            videoUrl: l.videoUrl, duration: l.duration,
          })),
        })),
      };
      const url = currentCourseId ? `/api/my-courses/${currentCourseId}` : "/api/my-courses";
      const method = currentCourseId ? "PATCH" : "POST";
      const saved = await apiRequest(method, url, payload).then(r => r.json());
      if (!currentCourseId && saved?.id) setCurrentCourseId(saved.id);
      if (nextStatus) setStatus(nextStatus);
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
      if (saved?.id) {
        // Re-fetch to pull back server-side IDs for lessons/modules so uploads target stable IDs
        const fresh = await fetch(`/api/my-courses/${saved.id}`).then(r => r.json());
        const loadedModules: ModuleDraft[] = (fresh.modules || []).map((m: any) => ({
          id: m.id, tmpId: tmp(), title: m.title || "", description: m.description || "",
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id, tmpId: tmp(), title: l.title || "", content: l.content || "",
            lessonType: (l.lessonType as LessonType) || "text",
            videoUrl: l.videoUrl || null, duration: l.duration ?? null,
          })),
        }));
        setModules(loadedModules.length ? loadedModules : modules);
      }
      toast({ title: "Saved", description: `Course ${nextStatus || status}` });
      return saved;
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Try again.", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function publishCourse() {
    setIsPublishing(true);
    try {
      const saved = await saveCourse("published");
      if (!saved?.id) return;
      await apiRequest("POST", `/api/my-courses/${saved.id}/publish`, { publish: true });
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
      toast({ title: "Published", description: "Your course is live on the Academy." });
    } catch (e: any) {
      toast({ title: "Publish failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  }

  async function uploadLessonVideo(lessonId: number, file: File) {
    const fd = new FormData();
    fd.append("video", file);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/video`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      toast({ title: "Video uploaded", description: "Captions generating in background." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again.", variant: "destructive" });
    }
  }

  function toggleCategory(id: number) {
    setCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function togglePrereq(id: number) {
    setPrerequisiteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const ogPreviewUrl = currentCourseId ? `/og/course/${currentCourseId}` : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FAF8F3]">
      <SEO title="Course Studio | Stroke Recovery Academy" description="Author courses for survivors and caregivers. Video, transcripts, quizzes, categories, prerequisites." />
      <GlobalHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-[#C9941A]" />
              Course Studio
            </h1>
            <p className="text-white/70 mt-1">Draft → preview → publish. Categories, prerequisites, videos, quizzes — all in one place.</p>
          </div>
          <Button variant="outline" onClick={startNewCourse} data-testid="button-new-course">
            <Plus className="w-4 h-4 mr-2" />New Course
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: my courses list */}
          <aside className="lg:col-span-3">
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-base text-[#FAF8F3]">My Courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myCourses.length === 0 && (
                  <p className="text-sm text-white/50">No courses yet. Start one on the right.</p>
                )}
                {myCourses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCurrentCourseId(c.id)}
                    className={`w-full text-left p-3 rounded-md border ${currentCourseId === c.id ? "border-[#C9941A] bg-[#0D0D0D]" : "border-[#333] bg-[#0D0D0D]"} hover-elevate`}
                    data-testid={`button-select-course-${c.id}`}
                  >
                    <div className="font-medium text-sm truncate text-[#FAF8F3]">{c.title}</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={c.isPublished ? "default" : "secondary"}>{c.isPublished ? "Live" : c.status}</Badge>
                      <Badge variant="outline" className="capitalize">{c.difficulty}</Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* MIDDLE: editor */}
          <section className="lg:col-span-6 space-y-6">
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-[#FAF8F3]">Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/80">Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rebuilding Grip Strength After Stroke" data-testid="input-course-title" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="What survivors will learn…" data-testid="input-course-description" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(d => (
                          <SelectItem key={d.value} value={d.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{d.label}</span>
                              <span className="text-xs text-muted-foreground">{d.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Price (credits)</Label>
                    <Input type="number" min={0} value={priceCredits} onChange={e => setPriceCredits(parseInt(e.target.value) || 0)} data-testid="input-price" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Thumbnail URL (optional)</Label>
                  <Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="/uploads/… or https://…" data-testid="input-thumbnail" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Categories (pick all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map(cat => {
                      const on = categoryIds.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm hover-elevate ${on ? "border-[#C9941A] bg-[#C9941A]/10" : "border-[#333] bg-[#0D0D0D]"}`}
                          data-testid={`button-category-${cat.slug}`}
                        >
                          <Checkbox checked={on} className="pointer-events-none" />
                          <span className={on ? "text-[#C9941A] font-medium" : "text-white/80"}>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Prerequisites (optional)</Label>
                  {publishedList.length === 0 ? (
                    <p className="text-xs text-white/50">No published courses yet to link.</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-auto border border-[#333] rounded-md p-2">
                      {publishedList.map(p => {
                        const on = prerequisiteIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 p-1 rounded hover-elevate cursor-pointer">
                            <Checkbox checked={on} onCheckedChange={() => togglePrereq(p.id)} data-testid={`checkbox-prereq-${p.id}`} />
                            <span className="text-sm text-white/80">{p.title}</span>
                            <Badge variant="outline" className="ml-auto capitalize">{p.difficulty}</Badge>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-[#FAF8F3]">Modules & Lessons</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setModules(prev => [...prev, emptyModule()])} data-testid="button-add-module">
                  <Plus className="w-4 h-4 mr-1" />Module
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {modules.map((m, mi) => (
                  <div key={m.tmpId} className="border border-[#333] rounded-md p-4 bg-[#0D0D0D]">
                    <div className="flex items-center gap-2 mb-3">
                      <Input value={m.title} onChange={e => updateModule(mi, { title: e.target.value })} placeholder="Module title" className="font-semibold" data-testid={`input-module-title-${mi}`} />
                      <Button size="icon" variant="ghost" onClick={() => moveModule(mi, -1)} disabled={mi === 0}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveModule(mi, 1)} disabled={mi === modules.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setModules(prev => prev.filter((_, i) => i !== mi))} disabled={modules.length === 1}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <Textarea value={m.description} onChange={e => updateModule(mi, { description: e.target.value })} placeholder="Module description (optional)" rows={2} className="mb-4" />

                    <div className="space-y-3">
                      {m.lessons.map((l, li) => (
                        <div key={l.tmpId} className="border border-[#333] rounded-md p-3 bg-[#1a1a1a]">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Input value={l.title} onChange={e => updateLesson(mi, li, { title: e.target.value })} placeholder="Lesson title" data-testid={`input-lesson-title-${mi}-${li}`} />
                                <Select value={l.lessonType} onValueChange={(v: LessonType) => updateLesson(mi, li, { lessonType: v })}>
                                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text"><span className="flex items-center gap-2"><FileText className="w-3 h-3" />Text</span></SelectItem>
                                    <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-3 h-3" />Video</span></SelectItem>
                                    <SelectItem value="quiz"><span className="flex items-center gap-2"><ListChecks className="w-3 h-3" />Quiz</span></SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {l.lessonType === "text" && (
                                <Textarea value={l.content} onChange={e => updateLesson(mi, li, { content: e.target.value })} rows={4} placeholder="Lesson content (markdown supported)" />
                              )}
                              {l.lessonType === "video" && (
                                <div className="space-y-2">
                                  {l.videoUrl && <div className="text-xs text-white/60 break-all">Current: {l.videoUrl}</div>}
                                  {l.id ? (
                                    <div>
                                      <input
                                        id={`vid-${l.id}`}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadLessonVideo(l.id!, f); }}
                                      />
                                      <label htmlFor={`vid-${l.id}`}>
                                        <Button type="button" size="sm" variant="outline" asChild>
                                          <span><Upload className="w-4 h-4 mr-2" />Upload Video (auto-captions)</span>
                                        </Button>
                                      </label>
                                      <p className="text-xs text-white/50 mt-2">Captions + transcript generated in the background via Whisper.</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-amber-400">Save course first to enable video upload for this lesson.</p>
                                  )}
                                  <Textarea value={l.content} onChange={e => updateLesson(mi, li, { content: e.target.value })} rows={2} placeholder="Notes shown next to the video (optional)" />
                                </div>
                              )}
                              {l.lessonType === "quiz" && (
                                <div className="space-y-2">
                                  <Textarea value={l.content} onChange={e => updateLesson(mi, li, { content: e.target.value })} rows={2} placeholder="Intro shown before the quiz" />
                                  {l.id ? (
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/quiz-editor/${l.id}`)}>
                                      <LinkIcon className="w-4 h-4 mr-2" />Edit Quiz Questions
                                    </Button>
                                  ) : (
                                    <p className="text-xs text-amber-400">Save course first to add quiz questions to this lesson.</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button size="icon" variant="ghost" onClick={() => moveLesson(mi, li, -1)} disabled={li === 0}><ArrowUp className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => moveLesson(mi, li, 1)} disabled={li === m.lessons.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => removeLesson(mi, li)} disabled={m.lessons.length === 1}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => addLesson(mi)} data-testid={`button-add-lesson-${mi}`}>
                        <Plus className="w-4 h-4 mr-1" />Add Lesson
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* RIGHT: actions + preview */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader><CardTitle className="text-base text-[#FAF8F3]">Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Current</span>
                  <Badge className="capitalize">{status}</Badge>
                </div>
                <Button className="w-full" variant="secondary" onClick={() => saveCourse("draft")} disabled={isSaving} data-testid="button-save-draft">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Draft
                </Button>
                <Button className="w-full" variant="outline" onClick={() => saveCourse("preview")} disabled={isSaving} data-testid="button-save-preview">
                  <Eye className="w-4 h-4 mr-2" />Save as Preview
                </Button>
                <Button className="w-full bg-[#C9941A] text-[#0D0D0D] hover:bg-[#E8B547]" onClick={publishCourse} disabled={isPublishing || isSaving} data-testid="button-publish">
                  {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                  Publish
                </Button>
                {currentCourseId && (
                  <Button className="w-full" variant="ghost" onClick={() => window.open(`/courses/${currentCourseId}`, "_blank")}>
                    <BookOpen className="w-4 h-4 mr-2" />View Public Page
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader><CardTitle className="text-base text-[#FAF8F3]">OG Preview</CardTitle></CardHeader>
              <CardContent>
                {ogPreviewUrl ? (
                  <>
                    <div className="border border-[#333] rounded-md overflow-hidden bg-[#0D0D0D]">
                      <img src={`${ogPreviewUrl}?t=${Date.now()}`} alt="OG preview" className="w-full h-auto" />
                    </div>
                    <p className="text-xs text-white/50 mt-2">Auto-generated from your title + difficulty. Refreshes on each save.</p>
                  </>
                ) : (
                  <p className="text-xs text-white/50">Save the course to generate a shareable card.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
