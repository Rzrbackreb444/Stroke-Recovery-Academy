import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import SasquatchChatWidget from "@/components/recovery/SasquatchChatWidget";
import { 
  BookOpen, Plus, Edit3, Eye, Download, Trash2, 
  Clock, Calendar, FileText, Sparkles, ChevronRight, PenTool
} from "lucide-react";

interface BookProject {
  id: number;
  title: string;
  description: string;
  status: "draft" | "writing" | "editing" | "published";
  wordCount: number;
  targetWords: number;
  lastEdited: string;
  chapters: number;
  coverImage?: string;
}

const mockBooks: BookProject[] = [
  {
    id: 1,
    title: "My Stroke Recovery Journey",
    description: "A personal memoir about overcoming stroke and reclaiming my life",
    status: "writing",
    wordCount: 24500,
    targetWords: 50000,
    lastEdited: "2024-01-15",
    chapters: 8,
  },
  {
    id: 2,
    title: "The Caregiver's Guide",
    description: "Essential tips for supporting a stroke survivor",
    status: "draft",
    wordCount: 5200,
    targetWords: 30000,
    lastEdited: "2024-01-10",
    chapters: 3,
  },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  writing: "bg-[#C9941A]/20 text-[#C9941A] border-[#C9941A]/30",
  editing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function MyBook() {
  const { user } = useAuth();
  const [books] = useState<BookProject[]>(mockBooks);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <SEO
        title="My Books | Stroke Recovery Academy"
        description="Write and manage your recovery story, memoirs, and books with AI assistance."
        canonical="/my-book"
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <BookOpen className="h-10 w-10 text-[#C9941A]" />
              My Books
            </h1>
            <p className="text-gray-400">
              Write your recovery story with AI-powered assistance
            </p>
          </div>
          <Link href="/book-studio">
            <Button className="bg-[#C9941A] text-black font-semibold" data-testid="button-new-book">
              <Plus className="h-4 w-4 mr-2" />
              New Book
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{books.length}</p>
                <p className="text-gray-400 text-sm">Total Books</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{books.reduce((sum, b) => sum + b.wordCount, 0).toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Words</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9941A]/20 flex items-center justify-center">
                <PenTool className="h-6 w-6 text-[#C9941A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{books.reduce((sum, b) => sum + b.chapters, 0)}</p>
                <p className="text-gray-400 text-sm">Chapters Written</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-[#1a1a1a] border-[#C9941A]/30 p-6 mb-8">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8 text-[#C9941A]" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">AI Writing Assistant</h3>
              <p className="text-gray-400 text-sm">
                Get help outlining chapters, overcoming writer's block, and polishing your prose. 
                Your Sasquatch Coach is ready to help you tell your story.
              </p>
            </div>
            <Link href="/book-studio">
              <Button variant="outline" className="border-[#C9941A] text-[#C9941A]" data-testid="button-ai-help">
                Get Help
              </Button>
            </Link>
          </div>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Your Projects</h2>

        <div className="space-y-4">
          {books.map((book) => (
            <Card key={book.id} className="bg-[#1a1a1a] border-[#333] p-6 hover:border-[#C9941A]/30 transition-colors" data-testid={`card-book-${book.id}`}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-24 h-32 rounded-lg bg-gradient-to-br from-[#C9941A]/20 to-[#0D0D0D] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-10 w-10 text-[#C9941A]/50" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{book.title}</h3>
                      <p className="text-gray-400 text-sm">{book.description}</p>
                    </div>
                    <Badge className={statusColors[book.status]}>
                      {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-[#C9941A]">{Math.round((book.wordCount / book.targetWords) * 100)}%</span>
                    </div>
                    <Progress value={(book.wordCount / book.targetWords) * 100} className="h-2 bg-[#333] [&>div]:bg-[#C9941A]" />
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{book.wordCount.toLocaleString()} words</span>
                      <span>Target: {book.targetWords.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {book.chapters} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Last edited: {new Date(book.lastEdited).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/book-studio?id=${book.id}`}>
                      <Button className="bg-[#C9941A] text-black" data-testid={`button-edit-${book.id}`}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Continue Writing
                      </Button>
                    </Link>
                    <Button variant="outline" className="border-[#333] text-gray-300" data-testid={`button-preview-${book.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" className="border-[#333] text-gray-300" data-testid={`button-export-${book.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {books.length === 0 && (
          <Card className="bg-[#1a1a1a] border-[#333] p-12 text-center">
            <BookOpen className="h-16 w-16 text-[#C9941A] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start Your First Book</h3>
            <p className="text-gray-400 mb-6">Share your recovery story with the world</p>
            <Link href="/book-studio">
              <Button className="bg-[#C9941A] text-black">
                <Plus className="h-4 w-4 mr-2" />
                Create New Book
              </Button>
            </Link>
          </Card>
        )}
      </main>

      <SasquatchChatWidget />
    </div>
  );
}
