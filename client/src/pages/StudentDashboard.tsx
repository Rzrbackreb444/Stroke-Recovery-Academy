import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecoveryHeader from "@/components/RecoveryHeader";
import {
  Award, BookOpen, Calendar, CheckCircle, ChevronRight, Clock,
  Crown, Flame, GraduationCap, Heart, Medal, Play, PlayCircle,
  Settings, Sparkles, Star, Target, Timer, Trophy, TrendingUp,
  Zap, BookMarked, BarChart3, Gift, Users, Lock, ArrowRight,
  Bell, Download, Share2, MessageSquare, ThumbsUp, Coffee, Dumbbell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AchievementIconType = "target" | "flame" | "book" | "star" | "trophy" | "dumbbell" | "graduation" | "message";

const getAchievementIcon = (iconType: AchievementIconType) => {
  const iconClass = "w-6 h-6";
  switch (iconType) {
    case "target": return <Target className={`${iconClass} text-[#C9941A]`} />;
    case "flame": return <Flame className={`${iconClass} text-red-500`} />;
    case "book": return <BookOpen className={`${iconClass} text-blue-500`} />;
    case "star": return <Star className={`${iconClass} text-yellow-500`} />;
    case "trophy": return <Trophy className={`${iconClass} text-[#C9941A]`} />;
    case "dumbbell": return <Dumbbell className={`${iconClass} text-[#C9941A]`} />;
    case "graduation": return <GraduationCap className={`${iconClass} text-purple-500`} />;
    case "message": return <MessageSquare className={`${iconClass} text-cyan-500`} />;
    default: return <Award className={`${iconClass} text-gray-500`} />;
  }
};

interface EnrolledCourse {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: Date;
  nextLesson: string;
  category: string;
  certificateEarned: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconType: AchievementIconType;
  earnedAt?: Date;
  progress?: number;
  target?: number;
}

interface Activity {
  id: string;
  type: "lesson_complete" | "quiz_passed" | "certificate" | "streak" | "comment";
  title: string;
  description: string;
  timestamp: Date;
  courseId?: string;
}

const mockUser = {
  name: "John Smith",
  email: "john.smith@example.com",
  avatar: "",
  memberSince: new Date(2024, 0, 15),
  streak: 12,
  totalLearningTime: 2840, // minutes
  coursesCompleted: 3,
  certificatesEarned: 3,
  level: "Recovery Champion",
  xp: 4750,
  nextLevelXp: 5000,
};

const mockCourses: EnrolledCourse[] = [
  {
    id: "1",
    title: "Complete Stroke Recovery Protocol",
    instructor: "Nick Kremers",
    thumbnail: "",
    progress: 68,
    totalLessons: 42,
    completedLessons: 29,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 30),
    nextLesson: "Upper Body Mobility Exercises",
    category: "Recovery",
    certificateEarned: false,
  },
  {
    id: "2",
    title: "Cognitive Rehabilitation Masterclass",
    instructor: "Dr. Sarah Chen",
    thumbnail: "",
    progress: 100,
    totalLessons: 28,
    completedLessons: 28,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    nextLesson: "",
    category: "Cognitive",
    certificateEarned: true,
  },
  {
    id: "3",
    title: "Speech Therapy Fundamentals",
    instructor: "Nick Kremers",
    thumbnail: "",
    progress: 35,
    totalLessons: 24,
    completedLessons: 8,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    nextLesson: "Articulation Practice Session 3",
    category: "Speech",
    certificateEarned: false,
  },
];

const mockAchievements: Achievement[] = [
  { id: "a1", title: "First Steps", description: "Complete your first lesson", iconType: "target", earnedAt: new Date(2024, 0, 15) },
  { id: "a2", title: "Week Warrior", description: "Maintain a 7-day streak", iconType: "flame", earnedAt: new Date(2024, 0, 22) },
  { id: "a3", title: "Knowledge Seeker", description: "Complete 10 lessons", iconType: "book", earnedAt: new Date(2024, 1, 1) },
  { id: "a4", title: "Quiz Master", description: "Score 100% on any quiz", iconType: "star", earnedAt: new Date(2024, 1, 15) },
  { id: "a5", title: "Certified", description: "Earn your first certificate", iconType: "trophy", earnedAt: new Date(2024, 2, 1) },
  { id: "a6", title: "Month Strong", description: "Maintain a 30-day streak", iconType: "dumbbell", progress: 12, target: 30 },
  { id: "a7", title: "Course Collector", description: "Complete 5 courses", iconType: "graduation", progress: 3, target: 5 },
  { id: "a8", title: "Community Star", description: "Receive 50 likes on comments", iconType: "message", progress: 24, target: 50 },
];

const mockActivity: Activity[] = [
  { id: "act1", type: "lesson_complete", title: "Lesson Completed", description: "Fine Motor Skills Training", timestamp: new Date(Date.now() - 1000 * 60 * 30), courseId: "1" },
  { id: "act2", type: "streak", title: "Streak Extended!", description: "12 days and counting", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "act3", type: "quiz_passed", title: "Quiz Passed", description: "Module 2 Assessment - 92%", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), courseId: "1" },
  { id: "act4", type: "comment", title: "New Reply", description: "Nick Kremers replied to your comment", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), courseId: "1" },
  { id: "act5", type: "certificate", title: "Certificate Earned!", description: "Cognitive Rehabilitation Masterclass", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), courseId: "2" },
];

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

export default function StudentDashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lesson_complete": return <CheckCircle className="w-5 h-5 text-[#C9941A]" />;
      case "quiz_passed": return <Star className="w-5 h-5 text-yellow-500" />;
      case "certificate": return <Award className="w-5 h-5 text-purple-500" />;
      case "streak": return <Flame className="w-5 h-5 text-[#C9941A]" />;
      case "comment": return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default: return <Zap className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const inProgressCourses = mockCourses.filter(c => c.progress > 0 && c.progress < 100);
  const completedCourses = mockCourses.filter(c => c.progress === 100);
  const earnedAchievements = mockAchievements.filter(a => a.earnedAt);
  const inProgressAchievements = mockAchievements.filter(a => !a.earnedAt && a.progress !== undefined);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <RecoveryHeader />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-[#C9941A]">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-xl font-bold">
                {mockUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {mockUser.name.split(' ')[0]}!</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-[#C9941A]/20 text-[#C9941A]">
                  <Crown className="w-3 h-3 mr-1" />
                  {mockUser.level}
                </Badge>
                <span className="text-sm text-gray-400">
                  <Flame className="w-4 h-4 inline mr-1 text-[#C9941A]" />
                  {mockUser.streak} day streak
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/courses")} data-testid="button-browse-courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
            {inProgressCourses.length > 0 && (
              <Button 
                className="bg-[#C9941A]" 
                onClick={() => navigate(`/course/${inProgressCourses[0].id}`)}
                data-testid="button-continue-learning"
              >
                <Play className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <TrendingUp className="w-4 h-4 text-[#C9941A]" />
              </div>
              <p className="text-2xl font-bold">{formatDuration(mockUser.totalLearningTime)}</p>
              <p className="text-xs text-gray-400">Total Learning Time</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-5 h-5 text-[#C9941A]" />
                <span className="text-xs text-[#C9941A]">+1 this week</span>
              </div>
              <p className="text-2xl font-bold">{mockUser.coursesCompleted}</p>
              <p className="text-xs text-gray-400">Courses Completed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{mockUser.certificatesEarned}</p>
              <p className="text-xs text-gray-400">Certificates Earned</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-[#C9941A]" />
                <span className="text-xs text-[#C9941A]">Best: 28 days</span>
              </div>
              <p className="text-2xl font-bold">{mockUser.streak} days</p>
              <p className="text-xs text-gray-400">Current Streak</p>
            </CardContent>
          </Card>
        </div>
        
        {/* XP Progress */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-[#C9941A]/30 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C9941A]" />
                <span className="font-semibold">Level Progress</span>
              </div>
              <span className="text-sm text-gray-400">{mockUser.xp} / {mockUser.nextLevelXp} XP</span>
            </div>
            <Progress value={(mockUser.xp / mockUser.nextLevelXp) * 100} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">
              {mockUser.nextLevelXp - mockUser.xp} XP until next level: <span className="text-[#C9941A]">Recovery Legend</span>
            </p>
          </CardContent>
        </Card>
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a1a] border-[#333] mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#C9941A]" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#C9941A]" data-testid="tab-courses">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-[#C9941A]" data-testid="tab-achievements">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-[#C9941A]" data-testid="tab-certificates">
              Certificates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Continue Learning */}
                <Card className="bg-[#1a1a1a] border-[#333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-[#C9941A]" />
                      Continue Learning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inProgressCourses.map(course => (
                        <div 
                          key={course.id}
                          className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg hover-elevate cursor-pointer"
                          onClick={() => navigate(`/course/${course.id}`)}
                          data-testid={`course-${course.id}`}
                        >
                          <div className="w-20 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-8 h-8 text-[#C9941A]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{course.title}</h3>
                            <p className="text-sm text-gray-400">Next: {course.nextLesson}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Progress value={course.progress} className="flex-1 h-1.5" />
                              <span className="text-xs text-gray-400">{course.progress}%</span>
                            </div>
                          </div>
                          <Button size="icon" className="bg-[#C9941A] flex-shrink-0" data-testid={`button-play-${course.id}`}>
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recommended */}
                <Card className="bg-[#1a1a1a] border-[#333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#C9941A]" />
                      Recommended For You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: "Advanced Mobility Training", instructor: "Nick Kremers", duration: "6 hours", level: "Advanced" },
                        { title: "Mindfulness for Recovery", instructor: "Dr. Maya Patel", duration: "4 hours", level: "Beginner" },
                      ].map((course, idx) => (
                        <div key={idx} className="p-4 bg-[#1a1a1a] rounded-lg hover-elevate cursor-pointer">
                          <div className="w-full h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-3">
                            <BookOpen className="w-10 h-10 text-[#C9941A]/50" />
                          </div>
                          <h4 className="font-semibold mb-1">{course.title}</h4>
                          <p className="text-sm text-gray-400">{course.instructor}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-[#333]">{course.duration}</Badge>
                            <Badge variant="outline" className="text-xs border-[#333]">{course.level}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Activity Feed */}
              <div className="space-y-6">
                <Card className="bg-[#1a1a1a] border-[#333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#C9941A]" />
                        Recent Activity
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                        View All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {mockActivity.map(activity => (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(activity.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                {/* Quick Achievements */}
                <Card className="bg-[#1a1a1a] border-[#333]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[#C9941A]" />
                      Latest Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {earnedAchievements.slice(0, 5).map(achievement => (
                        <div
                          key={achievement.id}
                          className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                          title={achievement.title}
                          data-testid={`badge-achievement-${achievement.id}`}
                        >
                          {getAchievementIcon(achievement.iconType)}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-12 h-12 rounded-lg border-2 border-dashed border-[#333]"
                        onClick={() => setActiveTab("achievements")}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="courses">
            <div className="space-y-6">
              {/* In Progress */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-500" />
                  In Progress ({inProgressCourses.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressCourses.map(course => (
                    <Card 
                      key={course.id} 
                      className="bg-[#1a1a1a] border-[#333] hover-elevate cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <div className="h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-[#C9941A]/50" />
                      </div>
                      <CardContent className="p-4">
                        <Badge className="bg-[#1a1a1a] text-xs mb-2">{course.category}</Badge>
                        <h3 className="font-semibold mb-1 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{course.instructor}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            {course.completedLessons} / {course.totalLessons} lessons
                          </span>
                          <span className="text-xs font-semibold text-[#C9941A]">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Completed */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#C9941A]" />
                  Completed ({completedCourses.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCourses.map(course => (
                    <Card 
                      key={course.id} 
                      className="bg-[#1a1a1a] border-[#333] hover-elevate cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <div className="h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center relative">
                        <GraduationCap className="w-16 h-16 text-[#C9941A]/50" />
                        {course.certificateEarned && (
                          <Badge className="absolute top-2 right-2 bg-purple-500">
                            <Award className="w-3 h-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <Badge className="bg-[#C9941A]/20 text-[#C9941A] text-xs mb-2">Completed</Badge>
                        <h3 className="font-semibold mb-1 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{course.instructor}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Play className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                          {course.certificateEarned && (
                            <Button size="sm" className="bg-purple-500 flex-1">
                              <Award className="w-3 h-3 mr-1" />
                              Certificate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements">
            <div className="space-y-6">
              {/* Earned */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-yellow-500" />
                  Earned ({earnedAchievements.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedAchievements.map(achievement => (
                    <Card key={achievement.id} className="bg-[#1a1a1a] border-[#333] p-4 text-center hover-elevate" data-testid={`card-earned-achievement-${achievement.id}`}>
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        {getAchievementIcon(achievement.iconType)}
                      </div>
                      <h3 className="font-semibold mb-1">{achievement.title}</h3>
                      <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                      <p className="text-xs text-[#C9941A]">{achievement.earnedAt?.toLocaleDateString()}</p>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* In Progress */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  In Progress ({inProgressAchievements.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {inProgressAchievements.map(achievement => (
                    <Card key={achievement.id} className="bg-[#1a1a1a] border-[#333] p-4 text-center" data-testid={`card-progress-achievement-${achievement.id}`}>
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1a1a1a] flex items-center justify-center grayscale opacity-50">
                        {getAchievementIcon(achievement.iconType)}
                      </div>
                      <h3 className="font-semibold mb-1">{achievement.title}</h3>
                      <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                      <Progress value={((achievement.progress || 0) / (achievement.target || 1)) * 100} className="h-1.5 mb-1" />
                      <p className="text-xs text-gray-500">{achievement.progress} / {achievement.target}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="certificates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.filter(c => c.certificateEarned).map(course => (
                <Card key={course.id} className="bg-[#1a1a1a] border-[#333] overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-amber-100 to-yellow-50 p-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Award className="w-32 h-32 text-amber-600" />
                    </div>
                    <div className="relative z-10 text-center text-amber-900">
                      <Award className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                      <p className="text-xs uppercase tracking-wider">Certificate of Completion</p>
                      <p className="font-serif font-bold mt-2">{mockUser.name}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">Issued on {new Date().toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/certificate/${course.id}`)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" className="flex-1 bg-[#C9941A]">
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Locked certificates */}
              {inProgressCourses.map(course => (
                <Card key={course.id} className="bg-[#1a1a1a] border-[#333] overflow-hidden opacity-60">
                  <div className="h-40 bg-[#1a1a1a] p-6 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-12 h-12 text-gray-600" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">Complete the course to unlock</p>
                    <Progress value={course.progress} className="h-1.5" />
                    <p className="text-xs text-gray-500 mt-1">{course.progress}% complete</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
