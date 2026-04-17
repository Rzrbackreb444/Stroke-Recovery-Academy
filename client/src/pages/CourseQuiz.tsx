import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle, ArrowLeft, ArrowRight, Award, BookOpen, Check,
  CheckCircle, ChevronLeft, ChevronRight, Clock, Flag, HelpCircle,
  Lightbulb, Loader2, RotateCcw, Target, Timer, Trophy, X, XCircle,
  Zap, Star, Sparkles, Brain, GraduationCap, Medal, ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface QuizQuestion {
  id: string;
  type: "single" | "multiple" | "true-false" | "fill-blank" | "matching";
  question: string;
  options?: string[];
  correctAnswer: number | number[] | string | { [key: string]: string };
  explanation: string;
  points: number;
  hint?: string;
  imageUrl?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface QuizResult {
  questionId: string;
  userAnswer: number | number[] | string | { [key: string]: string };
  isCorrect: boolean;
  timeSpent: number;
}

const mockQuiz = {
  id: "quiz1",
  title: "Module 1: Foundation & Mindset Assessment",
  description: "Test your understanding of the core principles covered in Module 1",
  courseId: "1",
  moduleId: "m1",
  passingScore: 70,
  timeLimit: 600, // 10 minutes
  allowRetry: true,
  showAnswers: true,
  randomizeQuestions: false,
  questions: [
    {
      id: "q1",
      type: "single" as const,
      question: "What is the primary principle behind the 'Never Zero' philosophy?",
      options: [
        "Always aim for perfection in every task",
        "Do at least one small action every day, no matter what",
        "Take rest days to recover fully",
        "Only work when you feel motivated"
      ],
      correctAnswer: 1,
      explanation: "The 'Never Zero' principle emphasizes consistency over intensity. Even on difficult days, doing just one rep or one small action maintains momentum and reinforces the habit of progress.",
      points: 10,
      hint: "Think about what happens on your worst days...",
      difficulty: "easy" as const,
    },
    {
      id: "q2",
      type: "multiple" as const,
      question: "Which of the following are pillars of the C.O.M.P.A.S.S. navigation system? (Select all that apply)",
      options: [
        "Control what you can",
        "Own your pace",
        "Money management",
        "Patience + nutrition",
        "Anger as fuel",
        "Speed over consistency"
      ],
      correctAnswer: [0, 1, 3, 4],
      explanation: "C.O.M.P.A.S.S. stands for Control · Own your pace · Mutate · Patience · Anger · Small Wins · Stack. 'Money management' and 'Speed over consistency' are not pillars — recovery is about sustainability, not shortcuts.",
      points: 15,
      difficulty: "medium" as const,
    },
    {
      id: "q3",
      type: "true-false" as const,
      question: "Neuroplasticity allows the brain to form new neural connections throughout a person's entire life.",
      options: ["True", "False"],
      correctAnswer: 0,
      explanation: "This is true! Neuroplasticity is the brain's remarkable ability to reorganize itself by forming new neural connections throughout life. This is the foundation of stroke recovery.",
      points: 10,
      difficulty: "easy" as const,
    },
    {
      id: "q4",
      type: "single" as const,
      question: "According to the Sasquatch Doctrine, what is the most important factor in long-term recovery success?",
      options: [
        "Access to expensive equipment",
        "Daily consistency and showing up every day",
        "Having a medical degree",
        "Completing recovery in the shortest time possible"
      ],
      correctAnswer: 1,
      explanation: "The Sasquatch Doctrine emphasizes that consistent daily effort, no matter how small, compounds over time to produce remarkable results. It's not about speed or resources, but about showing up every single day.",
      points: 10,
      difficulty: "easy" as const,
    },
    {
      id: "q5",
      type: "fill-blank" as const,
      question: "Complete the phrase: 'One ___ saves your streak.'",
      correctAnswer: "rep",
      explanation: "'One rep saves your streak' is a core mantra of the Never Zero philosophy. It reminds us that even the smallest action counts and keeps our momentum going.",
      points: 10,
      difficulty: "easy" as const,
    },
    {
      id: "q6",
      type: "single" as const,
      question: "What do the two S's in C.O.M.P.A.S.S. stand for?",
      options: [
        "Strength and Speed",
        "Small Wins and Stack Failures into Success",
        "Success and Strategy",
        "Sleep and Stress management"
      ],
      correctAnswer: 1,
      explanation: "The two S's in C.O.M.P.A.S.S. stand for 'Small wins are sacred' and 'Stack failures into success.' Both remind you that every flicker of progress counts and every setback is data to build on.",
      points: 10,
      difficulty: "medium" as const,
    },
    {
      id: "q7",
      type: "multiple" as const,
      question: "Which benefits does tracking your 'Flicker Moments' provide? (Select all that apply)",
      options: [
        "Builds awareness of progress that might otherwise go unnoticed",
        "Provides motivation during difficult periods",
        "Helps identify patterns in recovery",
        "Guarantees faster recovery times"
      ],
      correctAnswer: [0, 1, 2],
      explanation: "Tracking Flicker Moments helps build awareness, provides motivation, and identifies patterns. However, nothing can 'guarantee' faster recovery - everyone's journey is unique.",
      points: 15,
      difficulty: "medium" as const,
    },
    {
      id: "q8",
      type: "true-false" as const,
      question: "Recovery progress is always linear and predictable.",
      options: ["True", "False"],
      correctAnswer: 1,
      explanation: "False! Recovery is rarely linear. There will be good days and challenging days, plateaus and breakthroughs. Understanding this helps maintain realistic expectations and prevents discouragement.",
      points: 10,
      difficulty: "easy" as const,
    },
  ],
};

export default function CourseQuiz() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [results, setResults] = useState<QuizResult[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(mockQuiz.timeLimit);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  // Results state
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  
  const currentQuestion = mockQuiz.questions[currentQuestionIndex];
  const totalQuestions = mockQuiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;
  
  // Timer effect
  useEffect(() => {
    if (!quizStarted || quizCompleted) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [quizStarted, quizCompleted]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const startQuiz = () => {
    setQuizStarted(true);
    setQuestionStartTime(Date.now());
  };
  
  const handleAnswer = (answer: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };
  
  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlaggedQuestions(newFlagged);
  };
  
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
      setShowHint(false);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    }
  };
  
  const nextQuestion = () => goToQuestion(currentQuestionIndex + 1);
  const prevQuestion = () => goToQuestion(currentQuestionIndex - 1);
  
  const checkAnswer = (question: QuizQuestion, userAnswer: any): boolean => {
    if (question.type === "single" || question.type === "true-false") {
      return userAnswer === question.correctAnswer;
    }
    if (question.type === "multiple") {
      const correct = question.correctAnswer as number[];
      const user = (userAnswer as number[]) || [];
      return correct.length === user.length && correct.every(a => user.includes(a));
    }
    if (question.type === "fill-blank") {
      return (userAnswer as string)?.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim();
    }
    return false;
  };
  
  const submitQuiz = useCallback(() => {
    const quizResults: QuizResult[] = mockQuiz.questions.map(q => ({
      questionId: q.id,
      userAnswer: answers[q.id],
      isCorrect: checkAnswer(q, answers[q.id]),
      timeSpent: 0,
    }));
    
    setResults(quizResults);
    
    const correctCount = quizResults.filter(r => r.isCorrect).length;
    const earnedPoints = mockQuiz.questions.reduce((acc, q, idx) => {
      return acc + (quizResults[idx].isCorrect ? q.points : 0);
    }, 0);
    const totalPoints = mockQuiz.questions.reduce((acc, q) => acc + q.points, 0);
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    
    setScore(percentage);
    setPassed(percentage >= mockQuiz.passingScore);
    setQuizCompleted(true);
    setShowResultsDialog(true);
    
    if (percentage >= mockQuiz.passingScore) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [answers]);
  
  const retryQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults([]);
    setFlaggedQuestions(new Set());
    setTimeRemaining(mockQuiz.timeLimit);
    setShowResultsDialog(false);
    setReviewMode(false);
  };
  
  const getQuestionResult = (questionId: string) => {
    return results.find(r => r.questionId === questionId);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-[#C9941A] bg-[#C9941A]/20";
      case "medium": return "text-yellow-400 bg-yellow-500/20";
      case "hard": return "text-red-400 bg-red-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };
  
  // Pre-quiz screen
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-[#1a1a1a] border-[#333] p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{mockQuiz.title}</h1>
            <p className="text-gray-400">{mockQuiz.description}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-[#1a1a1a] rounded-lg">
              <HelpCircle className="w-6 h-6 text-[#C9941A] mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalQuestions}</p>
              <p className="text-xs text-gray-400">Questions</p>
            </div>
            <div className="text-center p-4 bg-[#1a1a1a] rounded-lg">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.floor(mockQuiz.timeLimit / 60)}</p>
              <p className="text-xs text-gray-400">Minutes</p>
            </div>
            <div className="text-center p-4 bg-[#1a1a1a] rounded-lg">
              <Target className="w-6 h-6 text-[#C9941A] mx-auto mb-2" />
              <p className="text-2xl font-bold">{mockQuiz.passingScore}%</p>
              <p className="text-xs text-gray-400">To Pass</p>
            </div>
            <div className="text-center p-4 bg-[#1a1a1a] rounded-lg">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{mockQuiz.questions.reduce((a, q) => a + q.points, 0)}</p>
              <p className="text-xs text-gray-400">Total Points</p>
            </div>
          </div>
          
          <Card className="bg-[#1a1a1a] border-[#333] p-4 mb-8">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Quiz Instructions
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C9941A] mt-0.5" />
                Read each question carefully before answering
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C9941A] mt-0.5" />
                You can flag questions to review later
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C9941A] mt-0.5" />
                Use the navigation to jump between questions
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C9941A] mt-0.5" />
                Submit when you're ready - you can review answers after
              </li>
              {mockQuiz.allowRetry && (
                <li className="flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-500 mt-0.5" />
                  You can retry this quiz if needed
                </li>
              )}
            </ul>
          </Card>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/course/1")}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <Button
              onClick={startQuiz}
              className="flex-1 bg-[#C9941A]"
              data-testid="button-start-quiz"
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Results dialog
  const ResultsDialog = () => (
    <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {passed ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <span className="text-2xl text-[#C9941A]">Congratulations!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                  <Target className="w-10 h-10 text-white" />
                </div>
                <span className="text-2xl text-yellow-500">Keep Going!</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <p className="text-6xl font-bold mb-2">{score}%</p>
          <p className="text-gray-400">
            {passed ? "You passed the quiz!" : `You need ${mockQuiz.passingScore}% to pass`}
          </p>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#C9941A]">{results.filter(r => r.isCorrect).length}</p>
              <p className="text-xs text-gray-400">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{results.filter(r => !r.isCorrect).length}</p>
              <p className="text-xs text-gray-400">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{formatTime(mockQuiz.timeLimit - timeRemaining)}</p>
              <p className="text-xs text-gray-400">Time Used</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setShowResultsDialog(false); setReviewMode(true); setCurrentQuestionIndex(0); }}
            className="flex-1"
            data-testid="button-review-answers"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Review Answers
          </Button>
          {!passed && mockQuiz.allowRetry && (
            <Button
              onClick={retryQuiz}
              className="flex-1 bg-[#C9941A]"
              data-testid="button-retry-quiz"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {passed && (
            <Button
              onClick={() => navigate("/course/1")}
              className="flex-1 bg-[#C9941A]"
              data-testid="button-continue-course"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue Course
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // Main quiz interface
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-[#333]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/course/1")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="font-semibold text-sm">{mockQuiz.title}</p>
              <p className="text-xs text-gray-400">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!quizCompleted && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-[#1a1a1a]'}`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            {reviewMode && (
              <Badge className="bg-blue-500/20 text-blue-400">Review Mode</Badge>
            )}
          </div>
        </div>
        
        {/* Progress */}
        <Progress value={progress} className="h-1 rounded-none" />
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-8">
          {/* Question Area */}
          <div>
            <Card className="bg-[#1a1a1a] border-[#333] p-6 mb-6">
              {/* Question header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[#C9941A]">Q{currentQuestionIndex + 1}</span>
                  <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-[#333]">
                    {currentQuestion.points} pts
                  </Badge>
                </div>
                {!reviewMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFlag}
                    className={flaggedQuestions.has(currentQuestion.id) ? 'text-yellow-500' : ''}
                    data-testid="button-flag"
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                )}
              </div>
              
              {/* Question text */}
              <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>
              
              {/* Answer options */}
              <div className="space-y-3">
                {currentQuestion.type === "single" || currentQuestion.type === "true-false" ? (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString()}
                    onValueChange={(v) => !reviewMode && handleAnswer(parseInt(v))}
                    disabled={reviewMode}
                  >
                    {currentQuestion.options?.map((option, idx) => {
                      const result = getQuestionResult(currentQuestion.id);
                      const isCorrect = result && currentQuestion.correctAnswer === idx;
                      const isWrong = result && result.userAnswer === idx && !isCorrect;
                      
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            reviewMode
                              ? isCorrect
                                ? 'bg-[#C9941A]/20 border-green-500'
                                : isWrong
                                ? 'bg-red-500/20 border-red-500'
                                : 'bg-[#1a1a1a] border-[#333]'
                              : answers[currentQuestion.id] === idx
                              ? 'bg-[#C9941A]/20 border-[#C9941A]'
                              : 'bg-[#1a1a1a] border-[#333] hover:border-zinc-600'
                          }`}
                          data-testid={`option-${idx}`}
                        >
                          <RadioGroupItem value={idx.toString()} className="border-2" />
                          <span className="flex-1">{option}</span>
                          {reviewMode && isCorrect && <CheckCircle className="w-5 h-5 text-[#C9941A]" />}
                          {reviewMode && isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                        </label>
                      );
                    })}
                  </RadioGroup>
                ) : currentQuestion.type === "multiple" ? (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, idx) => {
                      const userAnswers = (answers[currentQuestion.id] as number[]) || [];
                      const correctAnswers = currentQuestion.correctAnswer as number[];
                      const isSelected = userAnswers.includes(idx);
                      const result = getQuestionResult(currentQuestion.id);
                      const isCorrect = result && correctAnswers.includes(idx);
                      const isWrong = result && isSelected && !isCorrect;
                      
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            reviewMode
                              ? isCorrect
                                ? 'bg-[#C9941A]/20 border-green-500'
                                : isWrong
                                ? 'bg-red-500/20 border-red-500'
                                : 'bg-[#1a1a1a] border-[#333]'
                              : isSelected
                              ? 'bg-[#C9941A]/20 border-[#C9941A]'
                              : 'bg-[#1a1a1a] border-[#333] hover:border-zinc-600'
                          }`}
                          data-testid={`option-${idx}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={reviewMode}
                            onCheckedChange={(checked) => {
                              if (reviewMode) return;
                              const current = (answers[currentQuestion.id] as number[]) || [];
                              if (checked) {
                                handleAnswer([...current, idx]);
                              } else {
                                handleAnswer(current.filter(i => i !== idx));
                              }
                            }}
                          />
                          <span className="flex-1">{option}</span>
                          {reviewMode && isCorrect && <CheckCircle className="w-5 h-5 text-[#C9941A]" />}
                          {reviewMode && isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                        </label>
                      );
                    })}
                    <p className="text-sm text-gray-400 mt-2">Select all that apply</p>
                  </div>
                ) : currentQuestion.type === "fill-blank" ? (
                  <div>
                    <Input
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => !reviewMode && handleAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      disabled={reviewMode}
                      className={`bg-[#1a1a1a] border-[#333] text-lg py-6 ${
                        reviewMode
                          ? getQuestionResult(currentQuestion.id)?.isCorrect
                            ? 'border-green-500'
                            : 'border-red-500'
                          : ''
                      }`}
                      data-testid="input-answer"
                    />
                    {reviewMode && (
                      <p className="mt-2 text-sm">
                        <span className="text-gray-400">Correct answer: </span>
                        <span className="text-[#C9941A] font-semibold">{currentQuestion.correctAnswer as string}</span>
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
              
              {/* Hint */}
              {!reviewMode && currentQuestion.hint && (
                <div className="mt-6">
                  {showHint ? (
                    <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <p className="text-yellow-200 text-sm">{currentQuestion.hint}</p>
                      </div>
                    </Card>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setShowHint(true)}
                      className="text-yellow-500"
                      data-testid="button-show-hint"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Show Hint
                    </Button>
                  )}
                </div>
              )}
              
              {/* Explanation (review mode) */}
              {reviewMode && (
                <Card className="mt-6 bg-blue-500/10 border-blue-500/30 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-400 mb-1">Explanation</p>
                      <p className="text-gray-300 text-sm">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </Card>
              )}
            </Card>
            
            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                data-testid="button-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {!reviewMode && !quizCompleted && (
                  <Button
                    variant="outline"
                    onClick={submitQuiz}
                    className="border-green-500 text-[#C9941A]"
                    data-testid="button-submit"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Quiz
                  </Button>
                )}
                {reviewMode && (
                  <Button
                    onClick={() => navigate("/course/1")}
                    className="bg-[#C9941A]"
                    data-testid="button-finish-review"
                  >
                    Finish Review
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Question Navigator */}
          <div className="hidden lg:block">
            <Card className="bg-[#1a1a1a] border-[#333] p-4 sticky top-24">
              <h3 className="font-semibold mb-4">Question Navigator</h3>
              <div className="grid grid-cols-4 gap-2">
                {mockQuiz.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);
                  const result = getQuestionResult(q.id);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`w-10 h-10 rounded-lg font-semibold text-sm relative transition-all ${
                        currentQuestionIndex === idx
                          ? 'bg-[#C9941A] text-white'
                          : reviewMode
                          ? result?.isCorrect
                            ? 'bg-[#C9941A]/20 text-[#C9941A] border border-green-500/50'
                            : result
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-[#1a1a1a] text-gray-400'
                          : isAnswered
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-[#1a1a1a] text-gray-400 hover:bg-zinc-700'
                      }`}
                      data-testid={`nav-question-${idx}`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <Flag className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <Separator className="my-4 bg-zinc-700" />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Answered</span>
                  <span className="font-semibold">{answeredCount} / {totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Flagged</span>
                  <span className="font-semibold text-yellow-500">{flaggedQuestions.size}</span>
                </div>
              </div>
              
              {!quizCompleted && !reviewMode && (
                <Button
                  onClick={submitQuiz}
                  className="w-full mt-4 bg-[#C9941A]"
                  disabled={answeredCount < totalQuestions}
                  data-testid="button-submit-sidebar"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Quiz
                </Button>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <ResultsDialog />
    </div>
  );
}
