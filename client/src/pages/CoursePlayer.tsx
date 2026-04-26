import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";
import QuizRunner from "@/components/QuizRunner";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CohortPanel from "@/components/CohortPanel";
import ReviewsPanel from "@/components/ReviewsPanel";
import CourseShareButton from "@/components/CourseShareButton";
import CourseRefundButton from "@/components/CourseRefundButton";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Maximize, Minimize, Settings, ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle, Circle, Lock, BookOpen, FileText, Video, HelpCircle,
  Clock, Award, MessageSquare, Bookmark, BookmarkCheck, Download,
  Share2, ThumbsUp, Flag, Menu, X, Loader2, RotateCcw, RotateCw,
  Subtitles, PictureInPicture, Keyboard, Sun, Moon, Zap, Target,
  TrendingUp, Star, Users, PlayCircle, ListVideo, StickyNote, Heart,
  Coffee, Lightbulb, Quote, CheckSquare, Square, Plus, Trash2, Edit3,
  Send, Reply, MoreVertical, ArrowLeft, GraduationCap, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: Comment[];
  createdAt: Date;
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "quiz" | "assignment" | "download";
  duration: number;
  completed: boolean;
  locked: boolean;
  videoUrl?: string;
  content?: string;
  resources?: { name: string; url: string; type: string }[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface CourseData {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  rating: number;
  students: number;
  modules: Module[];
}

const EMPTY_COURSE: CourseData = {
  id: "",
  title: "Course unavailable",
  instructor: "—",
  instructorAvatar: "",
  totalLessons: 0,
  completedLessons: 0,
  totalDuration: 0,
  rating: 0,
  students: 0,
  modules: [],
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function CoursePlayer() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, routeParams] = useRoute("/course/:courseId");
  const courseId = routeParams?.courseId;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Real course data — fetched from API; falls back to empty shell while loading or if not found.
  const { data: courseData, isLoading: isCourseLoading } = useQuery<CourseData>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId,
  });
  const mockCourse: CourseData = courseData ?? EMPTY_COURSE;

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [quality, setQuality] = useState("1080p");
  const [showSubtitles, setShowSubtitles] = useState(false);

  // Course state — re-syncs when real course data arrives.
  const [modules, setModules] = useState<Module[]>(mockCourse.modules);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(
    mockCourse.modules[0]?.lessons[0] ?? null,
  );
  useEffect(() => {
    if (courseData) {
      setModules(courseData.modules);
      setCurrentLesson(courseData.modules[0]?.lessons[0] ?? null);
    }
  }, [courseData]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("curriculum");
  
  // Notes & Bookmarks
  const [notes, setNotes] = useState<Note[]>([
    { id: "n1", timestamp: 45, content: "Key point about neuroplasticity - brain can rewire itself", createdAt: new Date() },
    { id: "n2", timestamp: 180, content: "Remember to practice this daily", createdAt: new Date() },
  ]);
  const [newNote, setNewNote] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: "b1", timestamp: 120, label: "Important concept" },
  ]);
  
  // Comments
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "c1",
      userId: "u1",
      userName: "Sarah M.",
      userAvatar: "",
      content: "This lesson really helped me understand the recovery process. Thank you!",
      timestamp: 0,
      likes: 24,
      replies: [
        {
          id: "c1r1",
          userId: "instructor",
          userName: "Nick Kremers",
          userAvatar: "",
          content: "So glad it helped, Sarah! Keep pushing forward!",
          timestamp: 0,
          likes: 8,
          replies: [],
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
    },
  ]);
  const [newComment, setNewComment] = useState("");
  
  // Progress simulation
  const progressPercent = mockCourse.totalLessons > 0
    ? Math.round((mockCourse.completedLessons / mockCourse.totalLessons) * 100)
    : 0;
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'arrowleft':
          e.preventDefault();
          setCurrentTime(t => Math.max(0, t - 10));
          break;
        case 'arrowright':
          e.preventDefault();
          setCurrentTime(t => Math.min(duration, t + 10));
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'm':
          setIsMuted(m => !m);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'j':
          setCurrentTime(t => Math.max(0, t - 10));
          break;
        case 'l':
          setCurrentTime(t => Math.min(duration, t + 10));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration]);
  
  // Playback simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(t => Math.min(duration, t + playbackSpeed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, duration, currentTime]);
  
  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && playerRef.current) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };
  
  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, expanded: !m.expanded } : m
    ));
  };
  
  const selectLesson = (lesson: Lesson) => {
    if (lesson.locked) {
      toast({
        title: "Lesson Locked",
        description: "Complete previous lessons to unlock this content.",
        variant: "destructive",
      });
      return;
    }
    setCurrentLesson(lesson);
    setCurrentTime(0);
    setIsPlaying(false);
    setMobileSidebarOpen(false);
  };
  
  const markComplete = () => {
    setModules(modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => 
        l.id === currentLesson.id ? { ...l, completed: true } : l
      ),
    })));
    setCurrentLesson({ ...currentLesson, completed: true });
    toast({
      title: "Lesson Complete!",
      description: "Great work! Keep up the momentum.",
    });
  };
  
  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: `n-${Date.now()}`,
      timestamp: currentTime,
      content: newNote,
      createdAt: new Date(),
    };
    setNotes([...notes, note]);
    setNewNote("");
    toast({ title: "Note saved", description: `At ${formatTime(currentTime)}` });
  };
  
  const addBookmark = () => {
    const bookmark: Bookmark = {
      id: `b-${Date.now()}`,
      timestamp: currentTime,
      label: `Bookmark at ${formatTime(currentTime)}`,
    };
    setBookmarks([...bookmarks, bookmark]);
    toast({ title: "Bookmark added", description: formatTime(currentTime) });
  };
  
  const goToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp);
  };
  
  const nextLesson = () => {
    let found = false;
    for (const m of modules) {
      for (let i = 0; i < m.lessons.length; i++) {
        if (found && !m.lessons[i].locked) {
          selectLesson(m.lessons[i]);
          return;
        }
        if (m.lessons[i].id === currentLesson.id) {
          found = true;
        }
      }
    }
  };
  
  const prevLesson = () => {
    let prev: Lesson | null = null;
    for (const m of modules) {
      for (const l of m.lessons) {
        if (l.id === currentLesson.id && prev) {
          selectLesson(prev);
          return;
        }
        if (!l.locked) prev = l;
      }
    }
  };
  
  const getLessonIcon = (type: string, completed: boolean, locked: boolean) => {
    if (locked) return <Lock className="w-4 h-4 text-gray-500" />;
    if (completed) return <CheckCircle className="w-4 h-4 text-[#C9941A]" />;
    switch (type) {
      case "video": return <PlayCircle className="w-4 h-4 text-blue-400" />;
      case "text": return <FileText className="w-4 h-4 text-purple-400" />;
      case "quiz": return <HelpCircle className="w-4 h-4 text-[#C9941A]" />;
      case "assignment": return <Edit3 className="w-4 h-4 text-[#C9941A]" />;
      case "download": return <Download className="w-4 h-4 text-cyan-400" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };
  
  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  // Curriculum Sidebar Content
  const CurriculumContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {modules.map((module, idx) => (
          <div key={module.id} className="rounded-lg overflow-hidden">
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-3 bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] transition-colors"
              data-testid={`module-toggle-${module.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="text-left">
                  <p className="font-medium text-white text-sm">{module.title}</p>
                  <p className="text-xs text-gray-400">
                    {module.lessons.filter(l => l.completed).length}/{module.lessons.length} lessons
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${module.expanded ? 'rotate-180' : ''}`} />
            </button>
            
            {module.expanded && (
              <div className="bg-[#1a1a1a]/50 divide-y divide-zinc-800">
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(lesson)}
                    disabled={lesson.locked}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      currentLesson.id === lesson.id
                        ? 'bg-[#C9941A]/20 border-l-2 border-[#C9941A]'
                        : lesson.locked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[#1a1a1a]'
                    }`}
                    data-testid={`lesson-${lesson.id}`}
                  >
                    {getLessonIcon(lesson.type, lesson.completed, lesson.locked)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${currentLesson.id === lesson.id ? 'text-[#C9941A] font-medium' : 'text-gray-300'}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500">{lesson.duration} min</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Honest empty state when no lesson is loaded yet (data still arriving or course is empty).
  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 bg-[#1a1a1a] border-[#333] text-center">
          <h1 className="text-xl font-semibold mb-2">
            {isCourseLoading ? "Loading course…" : "Course content not available"}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            {isCourseLoading
              ? "Fetching your lessons."
              : "This course does not have any lessons yet, or the data could not be loaded."}
          </p>
          <Button onClick={() => navigate("/courses")} data-testid="button-back-to-courses">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <header className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courses")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="font-semibold text-sm truncate max-w-[300px]">{mockCourse.title}</h1>
            <p className="text-xs text-gray-400">{currentLesson.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Progress value={progressPercent} className="w-32 h-2" />
            <span className="text-xs text-gray-400">{progressPercent}%</span>
          </div>
          
          {courseId ? <CourseShareButton courseId={courseId} /> : null}
          {courseId ? <CourseRefundButton courseId={courseId} /> : null}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={addBookmark} data-testid="button-bookmark">
                  <Bookmark className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Bookmark</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-notes">
                <StickyNote className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#1a1a1a] border-[#333] w-96">
              <SheetHeader>
                <SheetTitle className="text-white">My Notes</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note at current time..."
                    className="bg-[#1a1a1a] border-[#333] min-h-[80px]"
                    data-testid="input-note"
                  />
                </div>
                <Button onClick={addNote} className="w-full bg-[#C9941A]" data-testid="button-save-note">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Note at {formatTime(currentTime)}
                </Button>
                <Separator className="bg-zinc-700" />
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {notes.map(note => (
                      <Card key={note.id} className="bg-[#1a1a1a] border-[#333] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => goToTimestamp(note.timestamp)}
                            className="text-[#C9941A] text-sm font-medium hover:underline"
                          >
                            {formatTime(note.timestamp)}
                          </button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-300">{note.content}</p>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-56px)]">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${sidebarOpen ? 'lg:mr-[380px]' : ''}`}>
          {/* Video Player */}
          <div 
            ref={playerRef}
            className="relative bg-black aspect-video max-h-[70vh] w-full group"
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Video/Content Area */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
              {currentLesson.type === "video" ? (
                <div className="absolute inset-0 p-2 md:p-4 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <LessonVideoPlayer lessonId={Number(currentLesson.id)} />
                  </div>
                </div>
              ) : currentLesson.type === "text" ? (
                <ScrollArea className="h-full w-full p-8">
                  <div className="max-w-3xl mx-auto prose prose-invert">
                    <h1>{currentLesson.title}</h1>
                    <p className="lead">This is text lesson content that would be loaded from the database.</p>
                    <p>The Sasquatch Doctrine is built on the foundation of consistent, daily effort. It doesn't matter how small the action is - what matters is that you show up every single day.</p>
                    <h2>Key Principles</h2>
                    <ul>
                      <li><strong>Never Zero:</strong> Always do at least one rep, one action, one step forward.</li>
                      <li><strong>Compound Progress:</strong> Small daily gains lead to massive long-term results.</li>
                      <li><strong>Mindset First:</strong> Your mental state determines your physical progress.</li>
                    </ul>
                    <blockquote>"The difference between who you are and who you want to be is what you do every day."</blockquote>
                  </div>
                </ScrollArea>
              ) : currentLesson.type === "quiz" ? (
                <ScrollArea className="h-full w-full p-6">
                  <div className="max-w-3xl mx-auto">
                    <QuizRunner quizId={Number((currentLesson as any).quizId ?? currentLesson.id)} />
                  </div>
                </ScrollArea>
              ) : null}
            </div>
            
            {/* Video Controls Overlay */}
            {currentLesson.type === "video" && (
              <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
                
                {/* Center play button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center"
                  data-testid="button-play-center"
                >
                  <div className="w-20 h-20 rounded-full bg-[#C9941A]/90 flex items-center justify-center hover:scale-110 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-white" />
                    ) : (
                      <Play className="w-10 h-10 text-white ml-1" />
                    )}
                  </div>
                </button>
                
                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  {/* Progress bar */}
                  <div className="group/progress relative">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                      data-testid="slider-progress"
                    />
                    {/* Bookmarks on timeline */}
                    {bookmarks.map(bm => (
                      <div
                        key={bm.id}
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-500 rounded-full cursor-pointer hover:scale-150 transition-transform"
                        style={{ left: `${(bm.timestamp / duration) * 100}%` }}
                        onClick={() => goToTimestamp(bm.timestamp)}
                      />
                    ))}
                  </div>
                  
                  {/* Control buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setCurrentTime(t => Math.max(0, t - 10))} data-testid="button-rewind">
                        <RotateCcw className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)} data-testid="button-play">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setCurrentTime(t => Math.min(duration, t + 10))} data-testid="button-forward">
                        <RotateCw className="w-5 h-5" />
                      </Button>
                      
                      {/* Volume */}
                      <div className="flex items-center gap-2 group/volume">
                        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} data-testid="button-mute">
                          <VolumeIcon />
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.01}
                          onValueChange={(v) => { setVolume(v[0]); setIsMuted(false); }}
                          className="w-20 opacity-0 group-hover/volume:opacity-100 transition-opacity"
                          data-testid="slider-volume"
                        />
                      </div>
                      
                      <span className="text-sm text-white ml-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Speed */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs" data-testid="button-speed">
                            {playbackSpeed}x
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333]">
                          {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                            <DropdownMenuItem
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={playbackSpeed === speed ? 'text-[#C9941A]' : ''}
                            >
                              {speed}x
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Quality */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="button-quality">
                            <Settings className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333]">
                          <DropdownMenuItem className="text-xs text-gray-400">Quality</DropdownMenuItem>
                          {["Auto", "1080p", "720p", "480p", "360p"].map(q => (
                            <DropdownMenuItem
                              key={q}
                              onClick={() => setQuality(q)}
                              className={quality === q ? 'text-[#C9941A]' : ''}
                            >
                              {q}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button variant="ghost" size="icon" onClick={() => setShowSubtitles(!showSubtitles)} data-testid="button-subtitles">
                        <Subtitles className={`w-5 h-5 ${showSubtitles ? 'text-[#C9941A]' : ''}`} />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={toggleFullscreen} data-testid="button-fullscreen">
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Below Video Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              {/* Lesson Info */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge className="bg-[#C9941A]/20 text-[#C9941A] mb-2">
                    {currentLesson.type.charAt(0).toUpperCase() + currentLesson.type.slice(1)} Lesson
                  </Badge>
                  <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentLesson.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {mockCourse.students.toLocaleString()} students
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={prevLesson} data-testid="button-prev-lesson">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  {currentLesson.completed ? (
                    <Button variant="outline" className="text-[#C9941A] border-green-500" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                  ) : (
                    <Button onClick={markComplete} className="bg-[#C9941A]" data-testid="button-complete">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                  <Button variant="outline" onClick={nextLesson} data-testid="button-next-lesson">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
              
              {/* Tabs */}
              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="bg-[#1a1a1a] border-[#333]">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  <TabsTrigger value="cohort" data-testid="tab-cohort">Cohort</TabsTrigger>
                  <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="notes">My Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="cohort" className="mt-4">
                  {(() => {
                    const cidNum = parseInt(String(courseId ?? ""), 10);
                    return Number.isFinite(cidNum)
                      ? <CohortPanel courseId={cidNum} />
                      : <div className="text-gray-400 text-sm py-6 text-center">Cohorts unavailable for this course.</div>;
                  })()}
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  {(() => {
                    const cidNum = parseInt(String(courseId ?? ""), 10);
                    return Number.isFinite(cidNum)
                      ? <ReviewsPanel courseId={cidNum} />
                      : <div className="text-gray-400 text-sm py-6 text-center">Reviews unavailable for this course.</div>;
                  })()}
                </TabsContent>
                
                <TabsContent value="overview" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333] p-6">
                    <h3 className="font-semibold mb-3">About This Lesson</h3>
                    <p className="text-gray-400 mb-4">
                      In this lesson, you'll learn the fundamental principles that will guide your entire recovery journey. 
                      We'll explore the science of neuroplasticity and how your brain can rewire itself with consistent practice.
                    </p>
                    <h4 className="font-semibold mb-2">What You'll Learn</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C9941A]" />
                        Understanding the recovery timeline
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C9941A]" />
                        Setting realistic and achievable goals
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C9941A]" />
                        Building daily habits for success
                      </li>
                    </ul>
                  </Card>
                  
                  <Card className="bg-[#1a1a1a] border-[#333] p-6 mt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mockCourse.instructor}</h3>
                        <p className="text-gray-400 text-sm">Course Instructor</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{mockCourse.rating} rating</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="resources" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333] p-6">
                    <h3 className="font-semibold mb-4">Downloadable Resources</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Recovery Goal Worksheet.pdf", size: "245 KB", icon: FileText },
                        { name: "Exercise Checklist.pdf", size: "128 KB", icon: FileText },
                        { name: "Progress Tracker Template.xlsx", size: "56 KB", icon: FileText },
                      ].map((resource, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-3">
                            <resource.icon className="w-5 h-5 text-[#C9941A]" />
                            <div>
                              <p className="font-medium text-sm">{resource.name}</p>
                              <p className="text-xs text-gray-500">{resource.size}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="discussion" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333] p-6">
                    <div className="flex gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-zinc-700" />
                      <div className="flex-1">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your thoughts or ask a question..."
                          className="bg-[#1a1a1a] border-[#333] min-h-[80px]"
                          data-testid="input-comment"
                        />
                        <div className="flex justify-end mt-2">
                          <Button className="bg-[#C9941A]" data-testid="button-post-comment">
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-zinc-700 my-6" />
                    
                    <div className="space-y-6">
                      {comments.map(comment => (
                        <div key={comment.id} className="space-y-4">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{comment.userName}</span>
                                <span className="text-xs text-gray-500">2 days ago</span>
                              </div>
                              <p className="text-gray-300 text-sm">{comment.content}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#C9941A]">
                                  <ThumbsUp className="w-3 h-3" />
                                  {comment.likes}
                                </button>
                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#C9941A]">
                                  <Reply className="w-3 h-3" />
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Replies */}
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex gap-3 ml-12 pl-4 border-l-2 border-[#333]">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{reply.userName}</span>
                                  <Badge className="bg-[#C9941A]/20 text-[#C9941A] text-xs">Instructor</Badge>
                                  <span className="text-xs text-gray-500">1 day ago</span>
                                </div>
                                <p className="text-gray-300 text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-4">
                  <Card className="bg-[#1a1a1a] border-[#333] p-6">
                    <div className="flex gap-3 mb-6">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Take a note..."
                        className="bg-[#1a1a1a] border-[#333]"
                        data-testid="input-note-inline"
                      />
                      <Button onClick={addNote} className="bg-[#C9941A]">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="flex gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                          <button
                            onClick={() => goToTimestamp(note.timestamp)}
                            className="text-[#C9941A] text-sm font-mono hover:underline whitespace-nowrap"
                          >
                            {formatTime(note.timestamp)}
                          </button>
                          <p className="text-gray-300 text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block fixed right-0 top-14 bottom-0 w-[380px] bg-[#1a1a1a] border-l border-[#333] transition-transform ${sidebarOpen ? '' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[#333]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Course Content</h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="flex-1 h-2" />
                <span className="text-sm text-gray-400">{progressPercent}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mockCourse.completedLessons} of {mockCourse.totalLessons} lessons complete
              </p>
            </div>
            
            <CurriculumContent />
            
            <div className="p-4 border-t border-[#333] bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#C9941A]" />
                <div>
                  <p className="font-semibold text-sm">Earn Your Certificate</p>
                  <p className="text-xs text-gray-400">Complete all lessons to unlock</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Toggle sidebar button */}
        {!sidebarOpen && (
          <Button
            className="hidden lg:flex fixed right-4 top-20 bg-[#1a1a1a] border-[#333]"
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <ListVideo className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="right" className="bg-[#1a1a1a] border-[#333] w-[320px] p-0">
          <SheetHeader className="p-4 border-b border-[#333]">
            <SheetTitle className="text-white text-left">Course Content</SheetTitle>
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-sm text-gray-400">{progressPercent}%</span>
            </div>
          </SheetHeader>
          <CurriculumContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}
