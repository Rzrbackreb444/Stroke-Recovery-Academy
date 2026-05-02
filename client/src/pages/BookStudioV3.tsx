import GlobalHeader from "@/components/GlobalHeader";
import RecoveryHeader from "@/components/RecoveryHeader";
import { usePlatform } from "@/lib/hooks/usePlatform";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import KreAIteStudio from "@/components/book-studio/KreAIteStudio";
import { BookStudioProvider } from "@/lib/contexts/BookStudioContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, LogIn } from "lucide-react";

function BookStudioContent() {
  return <KreAIteStudio />;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen p-4" data-testid="loading-state">
      <Card className="w-full max-w-md p-8 bg-card border">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-[#C9941A]" data-testid="spinner" />
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full bg-primary/10" />
            <Skeleton className="h-4 w-3/4 bg-primary/10" />
            <Skeleton className="h-4 w-5/6 bg-primary/10" />
          </div>
          <div className="text-sm font-medium text-gray-400">
            Loading Book Studio...
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoginPrompt() {
  const platform = usePlatform();
  const isRecovery = platform === "recovery";

  return (
    <div className="flex items-center justify-center h-screen p-4" data-testid="login-prompt">
      <Card className="w-full max-w-md p-8 bg-card border text-center">
        <div className="flex flex-col items-center gap-6">
          <LogIn className="h-12 w-12 text-[#C9941A]" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-gray-400">
              {isRecovery 
                ? "Sign in to start writing your recovery story"
                : "Sign in to access Book Studio and create your book"
              }
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-[#C9941A] hover:bg-[#C9941A] text-foreground"
            data-testid="button-login"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function BookStudioV3() {
  const { isAuthenticated, isLoading } = useAuth();
  const platform = usePlatform();
  const isRecovery = platform === "recovery";
  const Header = isRecovery ? RecoveryHeader : GlobalHeader;

  const seoTitle = isRecovery 
    ? "Write Your Recovery Story | Stroke Recovery Academy"
    : "Book Studio | Stroke Recovery Academy - AI-Powered Book Creation";
  
  const seoDescription = isRecovery
    ? "Share your stroke recovery journey. Write, edit, and publish your memoir with AI assistance."
    : "Create, edit, and publish professional books with AI assistance. From brainstorm to KDP-ready export.";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <SEO 
          title={seoTitle}
          description={seoDescription}
        />
        <Header />
        <LoginPrompt />
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDescription}
      />
      <BookStudioProvider>
        <BookStudioContent />
      </BookStudioProvider>
    </>
  );
}
