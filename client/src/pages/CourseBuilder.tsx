import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import RecoveryHeader from "@/components/RecoveryHeader";
import { 
  BookOpen, Plus, Video, FileText, HelpCircle, Dumbbell, Download,
  Headphones, GripVertical, Settings, Eye, Trash2, Edit, 
  Clock, Users, Star, DollarSign, Lock, Unlock, CheckCircle2,
  Award, Calendar, Layers
} from "lucide-react";

const lessonTypes = [
  { value: "video", label: "Video Lesson", icon: Video },
  { value: "text", label: "Text/Article", icon: FileText },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "exercise", label: "Exercise", icon: Dumbbell },
  { value: "download", label: "Downloadable", icon: Download },
  { value: "audio", label: "Audio", icon: Headphones },
];

const categories = [
  { value: "recovery", label: "Recovery Fundamentals" },
  { value: "movement", label: "Movement & Exercise" },
  { value: "mindset", label: "Mindset & Motivation" },
  { value: "nutrition", label: "Nutrition & Health" },
  { value: "speech", label: "Speech Therapy" },
  { value: "cognitive", label: "Cognitive Training" },
  { value: "lifestyle", label: "Lifestyle & Wellness" },
];

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  lessonType: string;
  content: string;
  videoUrl: string;
  estimatedMinutes: number;
  isPreview: boolean;
  order: number;
}

interface Course {
  id?: number;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  thumbnailUrl: string;
  category: string;
  difficulty: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  dripEnabled: boolean;
  dripIntervalDays: number;
  certificateEnabled: boolean;
  modules: Module[];
}

export default function CourseBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [newModuleOpen, setNewModuleOpen] = useState(false);
  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  const [courseForm, setCourseForm] = useState<Course>({
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    thumbnailUrl: "",
    category: "recovery",
    difficulty: "beginner",
    price: 0,
    isFree: true,
    isPublished: false,
    dripEnabled: false,
    dripIntervalDays: 7,
    certificateEnabled: true,
    modules: [],
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    lessonType: "video",
    content: "",
    videoUrl: "",
    estimatedMinutes: 10,
    isPreview: false,
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const addModule = () => {
    if (!moduleForm.title) return;
    
    const newModule: Module = {
      id: Date.now(),
      title: moduleForm.title,
      description: moduleForm.description,
      lessons: [],
      order: courseForm.modules.length + 1,
    };
    
    setCourseForm({
      ...courseForm,
      modules: [...courseForm.modules, newModule],
    });
    
    setModuleForm({ title: "", description: "" });
    setNewModuleOpen(false);
    toast({ title: "Module added!" });
  };

  const addLesson = () => {
    if (!lessonForm.title || selectedModule === null) return;
    
    const newLesson: Lesson = {
      id: Date.now(),
      ...lessonForm,
      order: (courseForm.modules.find(m => m.id === selectedModule)?.lessons.length || 0) + 1,
    };
    
    setCourseForm({
      ...courseForm,
      modules: courseForm.modules.map(m => 
        m.id === selectedModule 
          ? { ...m, lessons: [...m.lessons, newLesson] }
          : m
      ),
    });
    
    setLessonForm({
      title: "",
      description: "",
      lessonType: "video",
      content: "",
      videoUrl: "",
      estimatedMinutes: 10,
      isPreview: false,
    });
    setNewLessonOpen(false);
    toast({ title: "Lesson added!" });
  };

  const totalLessons = courseForm.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = courseForm.modules.reduce((sum, m) => 
    sum + m.lessons.reduce((lSum, l) => lSum + l.estimatedMinutes, 0), 0
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#E2741B]" />
              Course Builder
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Create professional courses with video, quizzes, and certificates
            </p>
          </div>
          
          <Button 
            onClick={() => setNewCourseOpen(true)} 
            className="bg-[#E2741B]"
            data-testid="button-new-course"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a1a] border-[#333] mb-6">
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#E2741B]">
              <Layers className="h-4 w-4 mr-2" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="editor" className="data-[state=active]:bg-[#E2741B]">
              <Edit className="h-4 w-4 mr-2" />
              Course Editor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#E2741B]">
              <Star className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                className="bg-[#1a1a1a] border-[#333] border-dashed border-2 p-8 flex flex-col items-center justify-center cursor-pointer hover-elevate"
                onClick={() => setNewCourseOpen(true)}
              >
                <Plus className="h-12 w-12 text-gray-500 mb-3" />
                <p className="text-gray-400">Create New Course</p>
              </Card>

              {courseForm.title && (
                <Card className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-[#E2741B]" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={courseForm.isPublished ? "bg-[#E2741B]/20 text-[#E2741B]" : "bg-yellow-500/20 text-yellow-400"}>
                        {courseForm.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {courseForm.isFree ? (
                        <Badge variant="outline">Free</Badge>
                      ) : (
                        <Badge className="bg-[#E2741B]/20 text-[#E2741B]">${(courseForm.price / 100).toFixed(2)}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{courseForm.title}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{courseForm.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {courseForm.modules.length} modules
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {totalLessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(totalMinutes / 60)}h
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab("editor")}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="editor">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#1a1a1a] border-[#333] p-6">
                  <h2 className="text-lg font-semibold mb-4">Course Details</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Course Title</Label>
                      <Input
                        value={courseForm.title}
                        onChange={(e) => {
                          setCourseForm({ 
                            ...courseForm, 
                            title: e.target.value,
                            slug: generateSlug(e.target.value)
                          });
                        }}
                        placeholder="e.g., Stroke Recovery Fundamentals"
                        className="bg-[#1a1a1a] border-[#333] mt-1"
                        data-testid="input-course-title"
                      />
                    </div>
                    <div>
                      <Label>Short Description</Label>
                      <Textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        placeholder="A brief overview of your course..."
                        className="bg-[#1a1a1a] border-[#333] mt-1"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select 
                          value={courseForm.category} 
                          onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#333] mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-[#333]">
                            {categories.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select 
                          value={courseForm.difficulty} 
                          onValueChange={(v) => setCourseForm({ ...courseForm, difficulty: v })}
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#333] mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-[#333]">
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#333] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Course Content</h2>
                    <Button 
                      onClick={() => setNewModuleOpen(true)} 
                      size="sm"
                      className="bg-[#E2741B]"
                      data-testid="button-add-module"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Module
                    </Button>
                  </div>

                  {courseForm.modules.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No modules yet. Add your first module to start building your course.</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {courseForm.modules.map((module, idx) => (
                        <AccordionItem 
                          key={module.id} 
                          value={`module-${module.id}`}
                          className="bg-[#1a1a1a] rounded-lg border-[#333] px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-gray-500" />
                              <span className="text-[#E2741B] font-bold">M{idx + 1}</span>
                              <span className="font-medium">{module.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {module.lessons.length} lessons
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            <p className="text-gray-400 text-sm mb-4">{module.description}</p>
                            
                            {module.lessons.length === 0 ? (
                              <p className="text-gray-500 text-sm italic">No lessons in this module yet.</p>
                            ) : (
                              <div className="space-y-2 mb-4">
                                {module.lessons.map((lesson, lIdx) => {
                                  const LessonIcon = lessonTypes.find(t => t.value === lesson.lessonType)?.icon || FileText;
                                  return (
                                    <div key={lesson.id} className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded">
                                      <span className="text-gray-500 text-sm">{lIdx + 1}</span>
                                      <LessonIcon className="h-4 w-4 text-[#E2741B]" />
                                      <span className="flex-1 text-sm">{lesson.title}</span>
                                      <span className="text-gray-500 text-xs">{lesson.estimatedMinutes}m</span>
                                      {lesson.isPreview && (
                                        <Badge variant="outline" className="text-xs">Preview</Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module.id);
                                setNewLessonOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Lesson
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-[#1a1a1a] border-[#333] p-6">
                  <h2 className="text-lg font-semibold mb-4">Course Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Free Course</Label>
                        <p className="text-gray-500 text-xs">Make this course free for everyone</p>
                      </div>
                      <Switch
                        checked={courseForm.isFree}
                        onCheckedChange={(v) => setCourseForm({ ...courseForm, isFree: v })}
                      />
                    </div>
                    
                    {!courseForm.isFree && (
                      <div>
                        <Label>Price (USD)</Label>
                        <Input
                          type="number"
                          value={courseForm.price / 100}
                          onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) * 100 })}
                          placeholder="49.99"
                          className="bg-[#1a1a1a] border-[#333] mt-1"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Drip Content</Label>
                        <p className="text-gray-500 text-xs">Release modules over time</p>
                      </div>
                      <Switch
                        checked={courseForm.dripEnabled}
                        onCheckedChange={(v) => setCourseForm({ ...courseForm, dripEnabled: v })}
                      />
                    </div>

                    {courseForm.dripEnabled && (
                      <div>
                        <Label>Days Between Modules</Label>
                        <Input
                          type="number"
                          value={courseForm.dripIntervalDays}
                          onChange={(e) => setCourseForm({ ...courseForm, dripIntervalDays: parseInt(e.target.value) })}
                          className="bg-[#1a1a1a] border-[#333] mt-1"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Certificate</Label>
                        <p className="text-gray-500 text-xs">Award certificate on completion</p>
                      </div>
                      <Switch
                        checked={courseForm.certificateEnabled}
                        onCheckedChange={(v) => setCourseForm({ ...courseForm, certificateEnabled: v })}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#333] p-6">
                  <h2 className="text-lg font-semibold mb-4">Course Stats</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Modules</span>
                      <span className="font-semibold">{courseForm.modules.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Lessons</span>
                      <span className="font-semibold">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Duration</span>
                      <span className="font-semibold">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6 bg-[#E2741B] hover:bg-[#E2741B]/80"
                    onClick={() => {
                      setCourseForm({ ...courseForm, isPublished: !courseForm.isPublished });
                      toast({ 
                        title: courseForm.isPublished ? "Course unpublished" : "Course published!",
                        description: courseForm.isPublished ? "Your course is now a draft." : "Students can now enroll."
                      });
                    }}
                    data-testid="button-publish-course"
                  >
                    {courseForm.isPublished ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Publish Course
                      </>
                    )}
                  </Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-[#1a1a1a] border-[#333] p-4">
                <p className="text-sm text-gray-400">Enrollments</p>
                <p className="text-3xl font-bold text-[#E2741B]">156</p>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#333] p-4">
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-3xl font-bold text-green-400">78%</p>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#333] p-4">
                <p className="text-sm text-gray-400">Avg. Rating</p>
                <p className="text-3xl font-bold text-yellow-400">4.8</p>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#333] p-4">
                <p className="text-sm text-gray-400">Revenue</p>
                <p className="text-3xl font-bold text-blue-400">$2,340</p>
              </Card>
            </div>
            <Card className="bg-[#1a1a1a] border-[#333] p-6">
              <h3 className="font-semibold mb-4">Module Performance</h3>
              <div className="space-y-3">
                {["Introduction", "Core Concepts", "Practice Sessions", "Final Assessment"].map((mod, i) => (
                  <div key={mod} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-32">{mod}</span>
                    <div className="flex-1 h-2 bg-[#333] rounded-full">
                      <div className="h-full bg-[#E2741B] rounded-full" style={{ width: `${95 - i * 12}%` }} />
                    </div>
                    <span className="text-sm text-gray-400">{95 - i * 12}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Course Dialog */}
        <Dialog open={newCourseOpen} onOpenChange={setNewCourseOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Course Title *</Label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ 
                    ...courseForm, 
                    title: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="e.g., Stroke Recovery Fundamentals"
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="What will students learn?"
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => {
                  setNewCourseOpen(false);
                  setActiveTab("editor");
                  toast({ title: "Course created!", description: "Start adding modules and lessons." });
                }} 
                className="w-full bg-[#E2741B]"
                disabled={!courseForm.title}
              >
                Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Module Dialog */}
        <Dialog open={newModuleOpen} onOpenChange={setNewModuleOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Add Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Module Title *</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g., Getting Started"
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="What does this module cover?"
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                  rows={2}
                />
              </div>
              <Button 
                onClick={addModule} 
                className="w-full bg-[#E2741B]"
                disabled={!moduleForm.title}
              >
                Add Module
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Lesson Dialog */}
        <Dialog open={newLessonOpen} onOpenChange={setNewLessonOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Lesson Title *</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Recovery"
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                />
              </div>
              <div>
                <Label>Lesson Type</Label>
                <Select 
                  value={lessonForm.lessonType} 
                  onValueChange={(v) => setLessonForm({ ...lessonForm, lessonType: v })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-[#333] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {lessonTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {lessonForm.lessonType === "video" && (
                <div>
                  <Label>Video URL</Label>
                  <Input
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/... or Vimeo URL"
                    className="bg-[#1a1a1a] border-[#333] mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Content</Label>
                <Textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Lesson content or description..."
                  className="bg-[#1a1a1a] border-[#333] mt-1"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={lessonForm.estimatedMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, estimatedMinutes: parseInt(e.target.value) || 10 })}
                    className="bg-[#1a1a1a] border-[#333] mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={lessonForm.isPreview}
                      onCheckedChange={(v) => setLessonForm({ ...lessonForm, isPreview: v })}
                    />
                    <Label>Free Preview</Label>
                  </div>
                </div>
              </div>
              <Button 
                onClick={addLesson} 
                className="w-full bg-[#E2741B]"
                disabled={!lessonForm.title}
              >
                Add Lesson
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
