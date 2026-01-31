import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Award, Download, Share2, ArrowLeft, CheckCircle, Calendar,
  Star, Clock, BookOpen, Trophy, Sparkles, GraduationCap,
  Linkedin, Twitter, Facebook, Mail, Link2, Copy, Check,
  Printer, Image, FileText, Shield, Verified
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: string;
  recipientName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  credentialId: string;
  courseDuration: number;
  lessonsCompleted: number;
  quizScore: number;
  issueDate: Date;
  expiryDate?: Date;
  skills: string[];
}

const mockCertificate: Certificate = {
  id: "cert-2024-001",
  recipientName: "John Smith",
  courseTitle: "Complete Stroke Recovery Protocol",
  instructorName: "Nick Kremers",
  completionDate: new Date(),
  credentialId: "SRCA-2024-NK-001847",
  courseDuration: 480,
  lessonsCompleted: 42,
  quizScore: 92,
  issueDate: new Date(),
  skills: ["Stroke Recovery", "Neuroplasticity", "Physical Therapy", "Cognitive Rehabilitation", "Speech Therapy"],
};

const templates = [
  { id: "classic", name: "Classic Gold", preview: "gradient-to-br from-amber-100 to-yellow-50" },
  { id: "modern", name: "Modern Dark", preview: "gradient-to-br from-zinc-900 to-zinc-800" },
  { id: "elegant", name: "Elegant Blue", preview: "gradient-to-br from-blue-50 to-indigo-100" },
  { id: "premium", name: "Premium Black", preview: "gradient-to-br from-black to-zinc-900" },
];

export default function CourseCertificate() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const [certificate] = useState<Certificate>(mockCertificate);
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };
  
  const handleDownload = () => {
    toast({
      title: "Certificate Downloaded",
      description: "Your certificate has been saved as a PDF.",
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(`https://strokerecoveryacademy.com/verify/${certificate.credentialId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied to clipboard" });
  };
  
  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(`https://strokerecoveryacademy.com/verify/${certificate.credentialId}`);
    const text = encodeURIComponent(`I just completed "${certificate.courseTitle}" and earned my certificate! #StrokeRecovery #Learning`);
    
    const urls: { [key: string]: string } = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    setShareDialogOpen(false);
  };
  
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case "modern":
        return {
          bg: "bg-gradient-to-br from-zinc-900 to-zinc-800",
          border: "border-[#C9941A]",
          text: "text-white",
          accent: "text-[#C9941A]",
          secondary: "text-gray-400",
        };
      case "elegant":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
          border: "border-blue-600",
          text: "text-blue-900",
          accent: "text-blue-600",
          secondary: "text-blue-700",
        };
      case "premium":
        return {
          bg: "bg-gradient-to-br from-black to-zinc-900",
          border: "border-amber-500",
          text: "text-white",
          accent: "text-[#C9941A]",
          secondary: "text-gray-400",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
          border: "border-amber-600",
          text: "text-amber-900",
          accent: "text-amber-600",
          secondary: "text-amber-700",
        };
    }
  };
  
  const styles = getTemplateStyles();
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#333] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/courses")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Certificate of Completion</h1>
              <p className="text-sm text-gray-400">{certificate.courseTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} data-testid="button-print">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-share">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#333]">
                <DialogHeader>
                  <DialogTitle>Share Your Achievement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial('linkedin')}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Linkedin className="w-6 h-6 text-blue-500" />
                      <span className="text-xs">LinkedIn</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial('twitter')}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Twitter className="w-6 h-6 text-sky-500" />
                      <span className="text-xs">Twitter</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareToSocial('facebook')}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Facebook className="w-6 h-6 text-blue-600" />
                      <span className="text-xs">Facebook</span>
                    </Button>
                  </div>
                  
                  <Separator className="bg-zinc-700" />
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Or copy verification link</p>
                    <div className="flex gap-2">
                      <Input
                        value={`https://strokerecoveryacademy.com/verify/${certificate.credentialId}`}
                        readOnly
                        className="bg-[#1a1a1a] border-[#333] text-sm"
                      />
                      <Button onClick={copyLink} variant="outline">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleDownload} className="bg-[#C9941A]" data-testid="button-download">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
          {/* Certificate Preview */}
          <div>
            <div
              ref={certificateRef}
              className={`${styles.bg} ${styles.text} rounded-lg border-4 ${styles.border} p-12 aspect-[1.414/1] relative overflow-hidden print:rounded-none print:border-8`}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-current opacity-20" />
              <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-current opacity-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-current opacity-20" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-current opacity-20" />
              
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Award className="w-96 h-96" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between text-center">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <GraduationCap className={`w-10 h-10 ${styles.accent}`} />
                    <span className={`text-sm font-semibold uppercase tracking-[0.3em] ${styles.secondary}`}>
                      Stroke Recovery Academy
                    </span>
                  </div>
                  <h1 className={`text-4xl font-serif font-bold mb-2 ${styles.accent}`}>
                    Certificate of Completion
                  </h1>
                  <p className={`text-sm ${styles.secondary}`}>This certifies that</p>
                </div>
                
                {/* Recipient */}
                <div className="py-8">
                  <h2 className="text-5xl font-serif font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {certificate.recipientName}
                  </h2>
                  <p className={`${styles.secondary} mb-4`}>has successfully completed the course</p>
                  <h3 className={`text-2xl font-bold ${styles.accent} mb-2`}>
                    {certificate.courseTitle}
                  </h3>
                  <p className={`text-sm ${styles.secondary}`}>
                    Instructed by {certificate.instructorName}
                  </p>
                </div>
                
                {/* Achievement details */}
                <div className="flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${styles.accent}`}>{formatDuration(certificate.courseDuration)}</p>
                    <p className={`text-xs ${styles.secondary}`}>of learning</p>
                  </div>
                  <div className={`w-px h-12 ${selectedTemplate === 'classic' || selectedTemplate === 'elegant' ? 'bg-current' : 'bg-gray-600'} opacity-30`} />
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${styles.accent}`}>{certificate.lessonsCompleted}</p>
                    <p className={`text-xs ${styles.secondary}`}>lessons completed</p>
                  </div>
                  <div className={`w-px h-12 ${selectedTemplate === 'classic' || selectedTemplate === 'elegant' ? 'bg-current' : 'bg-gray-600'} opacity-30`} />
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${styles.accent}`}>{certificate.quizScore}%</p>
                    <p className={`text-xs ${styles.secondary}`}>assessment score</p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="w-full flex items-end justify-between">
                  <div className="text-left">
                    <p className={`text-xs ${styles.secondary} mb-1`}>Issue Date</p>
                    <p className="font-semibold">{formatDate(certificate.issueDate)}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`w-32 h-px ${selectedTemplate === 'classic' || selectedTemplate === 'elegant' ? 'bg-current' : 'bg-gray-500'} mb-2`} />
                    <p className="font-serif font-bold">{certificate.instructorName}</p>
                    <p className={`text-xs ${styles.secondary}`}>Course Instructor</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-xs ${styles.secondary} mb-1`}>Credential ID</p>
                    <p className="font-mono text-sm">{certificate.credentialId}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Verification badge */}
            <Card className="bg-[#1a1a1a] border-[#333] p-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C9941A]/20 flex items-center justify-center">
                  <Verified className="w-6 h-6 text-[#C9941A]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#C9941A]">Verified Certificate</p>
                  <p className="text-sm text-gray-400">
                    This certificate can be verified at strokerecoveryacademy.com/verify
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template selector */}
            <Card className="bg-[#1a1a1a] border-[#333] p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Image className="w-4 h-4 text-[#C9941A]" />
                Certificate Template
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-[#C9941A]'
                        : 'border-[#333] hover:border-zinc-600'
                    }`}
                    data-testid={`template-${template.id}`}
                  >
                    <div className={`h-12 rounded bg-${template.preview} mb-2`} />
                    <p className="text-xs font-medium">{template.name}</p>
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Certificate details */}
            <Card className="bg-[#1a1a1a] border-[#333] p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C9941A]" />
                Certificate Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient</span>
                  <span className="font-medium">{certificate.recipientName}</span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Course</span>
                  <span className="font-medium text-right max-w-[180px]">{certificate.courseTitle}</span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Instructor</span>
                  <span className="font-medium">{certificate.instructorName}</span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="font-medium">{formatDate(certificate.completionDate)}</span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Credential ID</span>
                  <span className="font-mono text-xs">{certificate.credentialId}</span>
                </div>
              </div>
            </Card>
            
            {/* Skills earned */}
            <Card className="bg-[#1a1a1a] border-[#333] p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9941A]" />
                Skills Earned
              </h3>
              <div className="flex flex-wrap gap-2">
                {certificate.skills.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="border-[#333]">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
            
            {/* Stats */}
            <Card className="bg-[#1a1a1a] border-[#333] p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C9941A]" />
                Achievement Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                  <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{formatDuration(certificate.courseDuration)}</p>
                  <p className="text-xs text-gray-400">Learning Time</p>
                </div>
                <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                  <BookOpen className="w-5 h-5 text-[#C9941A] mx-auto mb-1" />
                  <p className="text-lg font-bold">{certificate.lessonsCompleted}</p>
                  <p className="text-xs text-gray-400">Lessons</p>
                </div>
                <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{certificate.quizScore}%</p>
                  <p className="text-xs text-gray-400">Quiz Score</p>
                </div>
                <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                  <Award className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">Top 10%</p>
                  <p className="text-xs text-gray-400">Achiever</p>
                </div>
              </div>
            </Card>
            
            {/* Add to profile */}
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-[#C9941A]/30 p-4">
              <div className="flex items-start gap-3">
                <Linkedin className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold mb-1">Add to LinkedIn</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Showcase your achievement on your professional profile
                  </p>
                  <Button size="sm" className="bg-blue-600">
                    Add to Profile
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
