import { useState } from "react";
import SEO from "@/components/SEO";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Eye,
  Save,
  Sparkles,
  Video,
  FileText,
  DollarSign,
  BarChart3,
  BookOpen,
  Play,
  Upload,
  Clock,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Wand2,
  ListChecks,
  HelpCircle,
  Image,
  Pencil,
  Copy,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "quiz";
  duration: number;
  content: string;
  videoUrl?: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  price: number;
  currency: string;
  modules: Module[];
  status: "draft" | "published" | "archived";
  students: number;
  rating: number;
  revenue: number;
}

const categories = [
  { value: "health", label: "Health & Wellness" },
  { value: "business", label: "Business & Entrepreneurship" },
  { value: "technology", label: "Technology & Development" },
  { value: "creative", label: "Creative Arts" },
  { value: "personal", label: "Personal Development" },
  { value: "recovery", label: "Recovery & Rehabilitation" },
];

const levels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All Levels" },
];

export default function CourseStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-courses");
  const [wizardStep, setWizardStep] = useState(1);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [coursePrice, setCoursePrice] = useState(49);
  const [enableDrip, setEnableDrip] = useState(false);
  const [enableCertificate, setEnableCertificate] = useState(true);

  const [modules, setModules] = useState<Module[]>([
    {
      id: "1",
      title: "Getting Started",
      description: "Introduction to the course",
      lessons: [
        { id: "1-1", title: "Welcome & Course Overview", type: "video", duration: 10, content: "", completed: false },
        { id: "1-2", title: "Setting Your Goals", type: "text", duration: 5, content: "", completed: false },
      ],
      expanded: true,
    },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    {
      id: "q1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    },
  ]);

  const [myCourses] = useState<Course[]>([
    {
      id: "1",
      title: "Complete Stroke Recovery Protocol",
      description: "Master the fundamentals of stroke recovery with proven techniques",
      thumbnail: "",
      category: "recovery",
      level: "beginner",
      price: 97,
      currency: "USD",
      modules: [],
      status: "published",
      students: 342,
      rating: 4.8,
      revenue: 33174,
    },
    {
      id: "2",
      title: "Advanced Mobility Training",
      description: "Take your mobility to the next level with advanced exercises",
      thumbnail: "",
      category: "health",
      level: "advanced",
      price: 147,
      currency: "USD",
      modules: [],
      status: "draft",
      students: 0,
      rating: 0,
      revenue: 0,
    },
  ]);

  const totalSteps = 5;
  const wizardProgress = (wizardStep / totalSteps) * 100;

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      description: "",
      lessons: [],
      expanded: true,
    };
    setModules([...modules, newModule]);
  };

  const addLesson = (moduleId: string, type: "video" | "text" | "quiz") => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newLesson: Lesson = {
          id: `lesson-${Date.now()}`,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Lesson`,
          type,
          duration: type === "video" ? 10 : 5,
          content: "",
          completed: false,
        };
        return { ...module, lessons: [...module.lessons, newLesson] };
      }
      return module;
    }));
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return { ...module, lessons: module.lessons.filter(l => l.id !== lessonId) };
      }
      return module;
    }));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return { ...module, expanded: !module.expanded };
      }
      return module;
    }));
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    const newModules = [...modules];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < modules.length) {
      [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
      setModules(newModules);
    }
  };

  const generateAIOutline = async () => {
    if (!courseTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a course title first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const generatedModules: Module[] = [
      {
        id: `module-${Date.now()}-1`,
        title: "Foundation & Introduction",
        description: "Build a solid foundation with essential concepts",
        lessons: [
          { id: `lesson-${Date.now()}-1`, title: "Welcome to the Course", type: "video", duration: 8, content: "", completed: false },
          { id: `lesson-${Date.now()}-2`, title: "Course Overview & Learning Path", type: "text", duration: 5, content: "", completed: false },
          { id: `lesson-${Date.now()}-3`, title: "Setting Your Success Goals", type: "video", duration: 12, content: "", completed: false },
        ],
        expanded: true,
      },
      {
        id: `module-${Date.now()}-2`,
        title: "Core Principles & Techniques",
        description: "Master the fundamental techniques",
        lessons: [
          { id: `lesson-${Date.now()}-4`, title: "Understanding the Basics", type: "video", duration: 15, content: "", completed: false },
          { id: `lesson-${Date.now()}-5`, title: "Key Techniques Breakdown", type: "video", duration: 20, content: "", completed: false },
          { id: `lesson-${Date.now()}-6`, title: "Practice Exercise #1", type: "text", duration: 10, content: "", completed: false },
          { id: `lesson-${Date.now()}-7`, title: "Module Quiz", type: "quiz", duration: 10, content: "", completed: false },
        ],
        expanded: true,
      },
      {
        id: `module-${Date.now()}-3`,
        title: "Advanced Strategies",
        description: "Take your skills to the next level",
        lessons: [
          { id: `lesson-${Date.now()}-8`, title: "Advanced Technique #1", type: "video", duration: 18, content: "", completed: false },
          { id: `lesson-${Date.now()}-9`, title: "Advanced Technique #2", type: "video", duration: 22, content: "", completed: false },
          { id: `lesson-${Date.now()}-10`, title: "Case Study Analysis", type: "text", duration: 15, content: "", completed: false },
        ],
        expanded: true,
      },
      {
        id: `module-${Date.now()}-4`,
        title: "Implementation & Action",
        description: "Put your knowledge into practice",
        lessons: [
          { id: `lesson-${Date.now()}-11`, title: "Creating Your Action Plan", type: "video", duration: 12, content: "", completed: false },
          { id: `lesson-${Date.now()}-12`, title: "Tracking Your Progress", type: "text", duration: 8, content: "", completed: false },
          { id: `lesson-${Date.now()}-13`, title: "Final Assessment", type: "quiz", duration: 15, content: "", completed: false },
          { id: `lesson-${Date.now()}-14`, title: "Next Steps & Resources", type: "video", duration: 10, content: "", completed: false },
        ],
        expanded: true,
      },
    ];

    setModules(generatedModules);
    setIsGeneratingAI(false);
    
    toast({
      title: "AI Outline Generated",
      description: "Your course structure has been created. Customize it as needed!",
    });
  };

  const addQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        id: `q-${Date.now()}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      },
    ]);
  };

  const removeQuizQuestion = (questionId: string) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
    }
  };

  const updateQuizQuestion = (questionId: string, field: string, value: any) => {
    setQuizQuestions(quizQuestions.map(q => {
      if (q.id === questionId) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const updateQuizOption = (questionId: string, optionIndex: number, value: string) => {
    setQuizQuestions(quizQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const getTotalLessons = () => {
    return modules.reduce((acc, module) => acc + module.lessons.length, 0);
  };

  const getTotalDuration = () => {
    return modules.reduce((acc, module) => {
      return acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.duration, 0);
    }, 0);
  };

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-step-title">
                Course Details
              </h2>
              <p className="text-white/60">Start with the basics of your course</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="course-title" className="text-white/70">Course Title</Label>
                <Input
                  id="course-title"
                  data-testid="input-course-title"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Complete Stroke Recovery Protocol"
                  className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mt-1"
                />
              </div>

              <div>
                <Label htmlFor="course-description" className="text-white/70">Course Description</Label>
                <Textarea
                  id="course-description"
                  data-testid="input-course-description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe what students will learn..."
                  className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mt-1 min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Category</Label>
                  <Select value={courseCategory} onValueChange={setCourseCategory}>
                    <SelectTrigger data-testid="select-category" className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#C9941A]/30">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-foreground">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/70">Level</Label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger data-testid="select-level" className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mt-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#C9941A]/30">
                      {levels.map((level) => (
                        <SelectItem key={level.value} value={level.value} className="text-foreground">
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="course-thumbnail" className="text-white/70">Thumbnail Image</Label>
                <div className="mt-1 border-2 border-dashed border-[#C9941A]/30 rounded-lg p-8 text-center hover:border-[#C9941A]/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-white/50 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Click to upload or drag and drop</p>
                  <p className="text-white/50 text-xs mt-1">PNG, JPG up to 5MB (1280x720 recommended)</p>
                  <Input
                    id="course-thumbnail"
                    type="file"
                    data-testid="input-thumbnail"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setCourseThumbnail(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-step-title">
                Course Structure
              </h2>
              <p className="text-white/60">Organize your course into modules and lessons</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="border-[#C9941A]/50 text-[#C9941A]">
                  {modules.length} Modules
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-white/60">
                  {getTotalLessons()} Lessons
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-white/60">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTotalDuration()} min
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-ai-generate"
                  onClick={generateAIOutline}
                  disabled={isGeneratingAI}
                  className="border-[#C9941A]/50 text-[#C9941A] hover:bg-primary/10"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  AI Generate Outline
                </Button>
                <Button
                  size="sm"
                  data-testid="button-add-module"
                  onClick={addModule}
                  className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {modules.map((module, moduleIndex) => (
                  <Card key={module.id} className="industrial-card" data-testid={`card-module-${module.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-5 h-5 text-white/40 cursor-move" />
                          <Input
                            value={module.title}
                            data-testid={`input-module-title-${module.id}`}
                            onChange={(e) => {
                              setModules(modules.map(m => 
                                m.id === module.id ? { ...m, title: e.target.value } : m
                              ));
                            }}
                            className="bg-transparent border-none text-foreground font-semibold text-lg p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-move-up-${module.id}`}
                            onClick={() => moveModule(moduleIndex, "up")}
                            disabled={moduleIndex === 0}
                            className="h-8 w-8 text-white/60 hover:text-foreground"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-move-down-${module.id}`}
                            onClick={() => moveModule(moduleIndex, "down")}
                            disabled={moduleIndex === modules.length - 1}
                            className="h-8 w-8 text-white/60 hover:text-foreground"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-toggle-module-${module.id}`}
                            onClick={() => toggleModuleExpand(module.id)}
                            className="h-8 w-8 text-white/60 hover:text-foreground"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${module.expanded ? "rotate-90" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-module-${module.id}`}
                            onClick={() => removeModule(module.id)}
                            className="h-8 w-8 text-white/60 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={module.description}
                        data-testid={`input-module-description-${module.id}`}
                        onChange={(e) => {
                          setModules(modules.map(m => 
                            m.id === module.id ? { ...m, description: e.target.value } : m
                          ));
                        }}
                        placeholder="Module description..."
                        className="bg-transparent border-none text-white/60 text-sm p-0 h-auto focus-visible:ring-0"
                      />
                    </CardHeader>
                    
                    {module.expanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-2 pl-7">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg group"
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-white/40 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                                {lesson.type === "video" && <Video className="w-4 h-4 text-[#C9941A]" />}
                                {lesson.type === "text" && <FileText className="w-4 h-4 text-blue-500" />}
                                {lesson.type === "quiz" && <ListChecks className="w-4 h-4 text-[#C9941A]" />}
                                <Input
                                  value={lesson.title}
                                  data-testid={`input-lesson-title-${lesson.id}`}
                                  onChange={(e) => {
                                    setModules(modules.map(m => {
                                      if (m.id === module.id) {
                                        return {
                                          ...m,
                                          lessons: m.lessons.map(l =>
                                            l.id === lesson.id ? { ...l, title: e.target.value } : l
                                          ),
                                        };
                                      }
                                      return m;
                                    }));
                                  }}
                                  className="bg-transparent border-none text-foreground text-sm p-0 h-auto focus-visible:ring-0 w-auto"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-[#C9941A]/30 text-white/50 text-xs">
                                  {lesson.duration} min
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-delete-lesson-${lesson.id}`}
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="h-7 w-7 text-white/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-add-video-${module.id}`}
                              onClick={() => addLesson(module.id, "video")}
                              className="border-[#C9941A]/30 text-white/60 hover:text-foreground hover:border-[#C9941A]/50"
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-add-text-${module.id}`}
                              onClick={() => addLesson(module.id, "text")}
                              className="border-[#C9941A]/30 text-white/60 hover:text-foreground hover:border-blue-500/50"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Text
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-add-quiz-${module.id}`}
                              onClick={() => addLesson(module.id, "quiz")}
                              className="border-[#C9941A]/30 text-white/60 hover:text-foreground hover:border-green-500/50"
                            >
                              <ListChecks className="w-3 h-3 mr-1" />
                              Quiz
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-step-title">
                Content & Media
              </h2>
              <p className="text-white/60">Upload videos and create content for your lessons</p>
            </div>

            <Tabs defaultValue="video" className="w-full">
              <TabsList className="bg-[#1A1A1A] border border-[#C9941A]/30 mb-4">
                <TabsTrigger value="video" data-testid="tab-video-upload" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black">
                  <Video className="w-4 h-4 mr-2" />
                  Video Upload
                </TabsTrigger>
                <TabsTrigger value="text" data-testid="tab-text-editor" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black">
                  <FileText className="w-4 h-4 mr-2" />
                  Text Editor
                </TabsTrigger>
                <TabsTrigger value="quiz" data-testid="tab-quiz-builder" className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black">
                  <ListChecks className="w-4 h-4 mr-2" />
                  Quiz Builder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video">
                <Card className="industrial-card">
                  <CardContent className="p-6">
                    <div className="border-2 border-dashed border-[#C9941A]/30 rounded-lg p-12 text-center hover:border-[#C9941A]/50 transition-colors cursor-pointer">
                      <Upload className="w-16 h-16 text-white/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Upload Video Lessons</h3>
                      <p className="text-white/60 mb-4">Drag and drop your video files or click to browse</p>
                      <p className="text-white/50 text-sm">Supports MP4, MOV, WebM up to 2GB</p>
                      <Button
                        data-testid="button-upload-video"
                        className="mt-6 bg-[#C9941A] hover:bg-[#C9941A] text-black"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Videos
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-gray-700 rounded flex items-center justify-center">
                            <Play className="w-4 h-4 text-[#C9941A]" />
                          </div>
                          <div>
                            <p className="text-foreground font-medium">welcome_video.mp4</p>
                            <p className="text-white/50 text-sm">145 MB • Uploaded</p>
                          </div>
                        </div>
                        <Badge className="bg-[#C9941A]/20 text-[#C9941A] border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="text">
                <Card className="industrial-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-[#C9941A]/30 pb-4">
                      <Button variant="ghost" size="sm" data-testid="button-bold" className="text-white/60 hover:text-foreground">
                        <span className="font-bold">B</span>
                      </Button>
                      <Button variant="ghost" size="sm" data-testid="button-italic" className="text-white/60 hover:text-foreground">
                        <span className="italic">I</span>
                      </Button>
                      <Separator orientation="vertical" className="h-6 bg-gray-700" />
                      <Button variant="ghost" size="sm" data-testid="button-heading" className="text-white/60 hover:text-foreground">
                        H1
                      </Button>
                      <Button variant="ghost" size="sm" data-testid="button-list" className="text-white/60 hover:text-foreground">
                        <ListChecks className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 bg-gray-700" />
                      <Button variant="ghost" size="sm" data-testid="button-image" className="text-white/60 hover:text-foreground">
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      data-testid="textarea-lesson-content"
                      placeholder="Write your lesson content here..."
                      className="bg-gray-800 border-[#C9941A]/30 text-foreground min-h-[300px]"
                    />
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="button-ai-enhance"
                        className="border-[#C9941A]/50 text-[#C9941A] hover:bg-primary/10"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Enhance Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quiz">
                <Card className="industrial-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground">Quiz Questions</h3>
                      <Button
                        size="sm"
                        data-testid="button-add-question"
                        onClick={addQuizQuestion}
                        className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    <ScrollArea className="h-[350px] pr-4">
                      <div className="space-y-6">
                        {quizQuestions.map((question, qIndex) => (
                          <Card key={question.id} className="bg-gray-800 border-[#C9941A]/30" data-testid={`card-question-${question.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/20 text-[#C9941A] border">
                                    Q{qIndex + 1}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-delete-question-${question.id}`}
                                  onClick={() => removeQuizQuestion(question.id)}
                                  className="h-8 w-8 text-white/50 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <Input
                                value={question.question}
                                data-testid={`input-question-${question.id}`}
                                onChange={(e) => updateQuizQuestion(question.id, "question", e.target.value)}
                                placeholder="Enter your question..."
                                className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mb-4"
                              />

                              <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <Button
                                      variant={question.correctAnswer === optIndex ? "default" : "outline"}
                                      size="icon"
                                      data-testid={`button-correct-${question.id}-${optIndex}`}
                                      onClick={() => updateQuizQuestion(question.id, "correctAnswer", optIndex)}
                                      className={`h-8 w-8 ${
                                        question.correctAnswer === optIndex
                                          ? "bg-[#C9941A] hover:bg-[#C9941A] text-foreground"
                                          : "border-[#C9941A]/30 text-white/50"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIndex)}
                                    </Button>
                                    <Input
                                      value={option}
                                      data-testid={`input-option-${question.id}-${optIndex}`}
                                      onChange={(e) => updateQuizOption(question.id, optIndex, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                      className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4">
                                <Label className="text-white/60 text-sm">Explanation (shown after answer)</Label>
                                <Textarea
                                  value={question.explanation}
                                  data-testid={`textarea-explanation-${question.id}`}
                                  onChange={(e) => updateQuizQuestion(question.id, "explanation", e.target.value)}
                                  placeholder="Explain why this answer is correct..."
                                  className="bg-[#1A1A1A] border-[#C9941A]/30 text-foreground mt-1 min-h-[60px]"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-step-title">
                Pricing & Settings
              </h2>
              <p className="text-white/60">Set your course price and configure options</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="industrial-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#C9941A]" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/70">Course Price (USD)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                      <Input
                        type="number"
                        value={coursePrice}
                        data-testid="input-course-price"
                        onChange={(e) => setCoursePrice(Number(e.target.value))}
                        className="bg-gray-800 border-[#C9941A]/30 text-foreground pl-10 text-2xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#C9941A]/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Platform fee (10%)</span>
                      <span className="text-white/60">-${(coursePrice * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-semibold mt-2">
                      <span className="text-foreground">Your earnings</span>
                      <span className="text-[#C9941A]">${(coursePrice * 0.9).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="industrial-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#C9941A]" />
                    Course Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Drip Content</p>
                      <p className="text-white/50 text-sm">Release modules over time</p>
                    </div>
                    <Switch
                      checked={enableDrip}
                      data-testid="switch-drip-content"
                      onCheckedChange={setEnableDrip}
                      className="data-[state=checked]:bg-[#C9941A]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">Completion Certificate</p>
                      <p className="text-white/50 text-sm">Award certificate on completion</p>
                    </div>
                    <Switch
                      checked={enableCertificate}
                      data-testid="switch-certificate"
                      onCheckedChange={setEnableCertificate}
                      className="data-[state=checked]:bg-[#C9941A]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="industrial-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#C9941A]" />
                  Revenue Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-white/60 text-sm mb-1">10 Students</p>
                    <p className="text-2xl font-bold text-foreground">${(coursePrice * 10 * 0.9).toFixed(0)}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border-2 border">
                    <p className="text-white/60 text-sm mb-1">100 Students</p>
                    <p className="text-2xl font-bold text-[#C9941A]">${(coursePrice * 100 * 0.9).toFixed(0)}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-white/60 text-sm mb-1">1,000 Students</p>
                    <p className="text-2xl font-bold text-foreground">${(coursePrice * 1000 * 0.9).toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-step-title">
                Preview & Publish
              </h2>
              <p className="text-white/60">Review your course before publishing</p>
            </div>

            <Card className="industrial-card">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-800 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                  {courseThumbnail ? (
                    <img src={courseThumbnail} alt="Course thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <GraduationCap className="w-16 h-16 text-white/40 mx-auto mb-2" />
                      <p className="text-white/50">Course Thumbnail</p>
                    </div>
                  )}
                  <Badge className="absolute top-4 left-4 bg-[#C9941A] text-black">
                    {categories.find(c => c.value === courseCategory)?.label || "Category"}
                  </Badge>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="text-preview-title">
                    {courseTitle || "Your Course Title"}
                  </h3>
                  <p className="text-white/60 mb-4">
                    {courseDescription || "Your course description will appear here..."}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <Badge variant="outline" className="border-[#C9941A]/30 text-white/60">
                      {levels.find(l => l.value === courseLevel)?.label || "Level"}
                    </Badge>
                    <Badge variant="outline" className="border-[#C9941A]/30 text-white/60">
                      <Clock className="w-3 h-3 mr-1" />
                      {getTotalDuration()} min
                    </Badge>
                    <Badge variant="outline" className="border-[#C9941A]/30 text-white/60">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {getTotalLessons()} lessons
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#C9941A]/30">
                    <div>
                      <span className="text-3xl font-bold text-foreground">${coursePrice}</span>
                      <span className="text-white/50 ml-2">one-time</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        data-testid="button-preview-course"
                        onClick={() => setShowPreview(true)}
                        className="border-[#C9941A]/30 text-foreground"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Full Preview
                      </Button>
                      <Button
                        data-testid="button-save-draft"
                        variant="outline"
                        className="border-[#C9941A]/50 text-[#C9941A]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button
                        data-testid="button-publish-course"
                        className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Publish Course
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="industrial-card">
              <CardHeader>
                <CardTitle className="text-foreground">Course Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Course title added", done: !!courseTitle },
                    { label: "Description written", done: !!courseDescription },
                    { label: "Category selected", done: !!courseCategory },
                    { label: "At least one module created", done: modules.length > 0 },
                    { label: "Pricing configured", done: coursePrice > 0 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3" data-testid={`checklist-item-${index}`}>
                      {item.done ? (
                        <CheckCircle className="w-5 h-5 text-[#C9941A]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-white/50" />
                      )}
                      <span className={item.done ? "text-foreground" : "text-white/50"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO
        title="Course Studio - Create & Sell Online Courses with AI"
        description="Create professional online courses with AI-powered content generation, video lessons, interactive quizzes, and certificates of completion. Build, monetize, and scale your educational content with KreAIte's complete course studio platform. Earn 85% on every sale with built-in payment processing."
        keywords="online course creation, sell courses, e-learning platform, course builder, video courses, LMS, course platform, create courses online, online education, digital courses, course monetization"
        canonical="/course-studio"
        type="website"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Creator Hub", url: "/creator-hub" },
          { name: "Course Studio", url: "/course-studio" }
        ]}
        faq={[
          {
            question: "How do I create a course in Course Studio?",
            answer: "Simply use our AI-powered wizard to define your course structure, add modules and lessons, create video lessons or text content, design interactive quizzes, and set your pricing. Our platform guides you through the entire process with a user-friendly interface and AI assistance."
          },
          {
            question: "Can I sell my courses and earn money?",
            answer: "Yes! You can set your own prices for each course and earn 85% of every sale through our built-in payment processing. There are no transaction fees or hidden charges, making it easy to monetize your expertise."
          },
          {
            question: "What types of content can I include in my courses?",
            answer: "Course Studio supports video lessons, text-based content, interactive quizzes with multiple question types, downloadable resources, drip-feed content scheduling, and automated certificates of completion for enrolled students."
          },
          {
            question: "How do students track their progress and earn certificates?",
            answer: "Students can track their progress through our built-in student dashboard with completion status for each lesson and module. Upon completing all course requirements and passing quizzes, they automatically receive professional certificates that they can download and share."
          }
        ]}
        expertise={[
          "AI-powered course outline generation",
          "Professional curriculum design",
          "Interactive learning experience design",
          "Student assessment and analytics",
          "Course monetization solutions",
          "Educational platform architecture"
        ]}
        experience="Built by creators for creators with years of educational platform experience and thousands of successful courses published worldwide. Our platform combines AI innovation with proven teaching methodologies."
        trustSignals={[
          "GDPR and HIPAA-compliant student data protection",
          "Professional-grade video hosting and streaming",
          "Secure PCI-DSS payment processing",
          "Automated certificate verification system",
          "24/7 customer support for creators",
          "Regular platform security audits",
          "Trusted by thousands of educators and course creators"
        ]}
        schema={[
          {
            "@type": "SoftwareApplication",
            name: "KreAIte Course Studio",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web Browser",
            description: "Create professional online courses with AI-powered content generation, video lessons, quizzes, and certificates. Build, monetize, and scale your educational content.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "AI Course Outline Generation",
              "Video Lesson Editor with Multiple Content Types",
              "Interactive Quiz and Assessment Builder",
              "Student Analytics and Progress Tracking",
              "Automated Certificate Generator",
              "Built-in Payment Processing (85% Creator Earnings)",
              "Drip-Feed Content Scheduling",
              "Student Enrollment Management",
              "Course Review and Rating System",
              "Downloadable Resource Management"
            ]
          }
        ]}
      />
      <GlobalHeader />

      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-primary/20 text-[#C9941A] border mb-4" data-testid="badge-studio">
              <GraduationCap className="w-3 h-3 mr-1" />
              AI-Powered Course Creation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tight mb-4" data-testid="text-hero-title">
              Course <span className="text-[#C9941A]">Studio</span>
            </h1>
            <p className="text-lg text-white/60 mb-8" data-testid="text-hero-description">
              Transform your expertise into profitable online courses. AI-powered content generation, 
              beautiful video lessons, interactive quizzes, and built-in monetization.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9941A]" />
                <span>AI Content Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#C9941A]" />
                <span>Video Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C9941A]" />
                <span>Certificates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1A1A1A] border border-[#C9941A]/30 mb-8 w-full justify-start">
            <TabsTrigger
              value="my-courses"
              data-testid="tab-my-courses"
              className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              My Courses
            </TabsTrigger>
            <TabsTrigger
              value="create"
              data-testid="tab-create"
              className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              data-testid="tab-analytics"
              className="data-[state=active]:bg-[#C9941A] data-[state=active]:text-black"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course) => (
                <Card
                  key={course.id}
                  className="industrial-card hover-elevate cursor-pointer"
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="aspect-video bg-gray-800 rounded-t-lg flex items-center justify-center relative">
                    <GraduationCap className="w-12 h-12 text-white/40" />
                    <Badge
                      className={`absolute top-3 right-3 ${
                        course.status === "published"
                          ? "bg-[#C9941A]/20 text-[#C9941A] border-green-500/30"
                          : course.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                          : "bg-gray-500/20 text-white/50 border-gray-500/30"
                      }`}
                    >
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2" data-testid={`text-course-title-${course.id}`}>
                      {course.title}
                    </h3>
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">{course.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-white/60">
                          <Users className="w-4 h-4" />
                          {course.students}
                        </div>
                        {course.rating > 0 && (
                          <div className="flex items-center gap-1 text-[#C9941A]">
                            <Star className="w-4 h-4 fill-current" />
                            {course.rating}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-foreground">${course.price}</span>
                    </div>

                    {course.revenue > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#C9941A]/30">
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-sm">Total Revenue</span>
                          <span className="text-[#C9941A] font-semibold">${course.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card
                className="bg-[#1A1A1A]/50 border-[#C9941A]/30 border-dashed hover-elevate cursor-pointer"
                onClick={() => setActiveTab("create")}
                data-testid="card-create-new"
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-[#C9941A]" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Create New Course</h3>
                  <p className="text-white/50 text-sm text-center">
                    Start building your next course with AI assistance
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          step === wizardStep
                            ? "bg-[#C9941A] text-black"
                            : step < wizardStep
                            ? "bg-[#C9941A] text-foreground"
                            : "bg-gray-800 text-white/50"
                        }`}
                        data-testid={`step-indicator-${step}`}
                      >
                        {step < wizardStep ? <CheckCircle className="w-4 h-4" /> : step}
                      </div>
                      {step < 5 && (
                        <div className={`w-12 h-1 rounded ${step < wizardStep ? "bg-[#C9941A]" : "bg-gray-800"}`} />
                      )}
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="border-[#C9941A]/30 text-white/60">
                  Step {wizardStep} of {totalSteps}
                </Badge>
              </div>
              <Progress value={wizardProgress} className="h-2 bg-gray-800" data-testid="progress-wizard" />
            </div>

            <Card className="bg-[#1A1A1A]/50 border-[#C9941A]/30">
              <CardContent className="p-8">
                {renderWizardStep()}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#C9941A]/30">
                  <Button
                    variant="outline"
                    data-testid="button-prev-step"
                    onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                    disabled={wizardStep === 1}
                    className="border-[#C9941A]/30 text-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {wizardStep < totalSteps ? (
                    <Button
                      data-testid="button-next-step"
                      onClick={() => setWizardStep(wizardStep + 1)}
                      className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
                    >
                      Next Step
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      data-testid="button-finish-wizard"
                      className="bg-[#C9941A] hover:bg-[#C9941A] text-black"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Publish Course
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Students", value: "342", change: "+12%", icon: Users },
                { label: "Total Revenue", value: "$33,174", change: "+8%", icon: DollarSign },
                { label: "Avg. Rating", value: "4.8", change: "+0.2", icon: Star },
                { label: "Completion Rate", value: "78%", change: "+5%", icon: Trophy },
              ].map((stat, index) => (
                <Card key={index} className="industrial-card" data-testid={`card-stat-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-none bg-[#C9941A]/20 flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-[#C9941A]" />
                      </div>
                      <Badge className="bg-[#C9941A]/10 text-[#C9941A] border-none text-[10px] font-bold">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="industrial-card">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-white/60">
                    <BarChart3 className="w-12 h-12 text-[#C9941A]" />
                    <span className="ml-4">Revenue chart visualization</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="industrial-card">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myCourses
                      .filter(c => c.status === "published")
                      .map((course, index) => (
                        <div key={course.id} className="flex items-center justify-between p-3 bg-white/5 rounded-none border border-[#C9941A]/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-none bg-[#C9941A]/20 flex items-center justify-center text-[#C9941A] font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{course.title}</p>
                              <p className="text-white/60 text-sm">{course.students} students</p>
                            </div>
                          </div>
                          <span className="text-[#C9941A] font-semibold">${course.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
