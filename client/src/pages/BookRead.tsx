import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import RecoverySEO from "@/components/RecoverySEO";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Lock, Download, ShoppingCart, BookOpen, Maximize2, FileText, ArrowRight } from "lucide-react";

interface Entitlement {
  owns: boolean;
  orderId?: number;
  itemId?: number;
  orderNumber?: string;
}

export default function BookRead() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery<Entitlement>({
    queryKey: ["/api/book/entitlement"],
    enabled: isAuthenticated,
  });

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Paywall reason="signin" />;
  if (!data?.owns) return <Paywall reason="purchase" />;

  const downloadUrl = `/api/marketplace/orders/${data.orderId}/items/${data.itemId}/download`;
  const inlineUrl = `${downloadUrl}?inline=1`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title="Read Your Book — The Ultimate Stroke Recovery Revolution"
        description="Owner-only in-platform reader for The Ultimate Stroke Recovery Revolution."
        canonical="/book/read"
        noindex
        medicalDisclaimer={false}
      />
      <GlobalHeader />

      <main className="flex-1 flex flex-col">
        {/* Reader toolbar */}
        <div className="border-b border-border/50 bg-card/40">
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-medium truncate">
                The Ultimate Stroke Recovery Revolution
              </span>
              {data.orderNumber && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · Order {data.orderNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="ghost" data-testid="link-fullscreen">
                <a href={inlineUrl} target="_blank" rel="noopener noreferrer">
                  <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                  New tab
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" data-testid="link-download">
                <a href={downloadUrl}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black/20">
          <iframe
            src={inlineUrl}
            title="The Ultimate Stroke Recovery Revolution"
            className="w-full"
            style={{ height: "calc(100vh - 108px)", border: 0 }}
            data-testid="iframe-book-reader"
          />
        </div>
      </main>
    </div>
  );
}

function Paywall({ reason }: { reason: "signin" | "purchase" }) {
  const isSignin = reason === "signin";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RecoverySEO
        title={isSignin ? "Sign In to Read Your Book" : "Get The Ultimate Stroke Recovery Revolution"}
        description="Sign in to read The Ultimate Stroke Recovery Revolution, or purchase the digital PDF ($19) or print paperback ($29)."
        canonical="/book/read"
        noindex
        medicalDisclaimer={false}
      />
      <GlobalHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full" data-testid="card-paywall">

          {/* Lock mark */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full border border-border/50 bg-card/60 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
              data-testid="text-paywall-title"
            >
              {isSignin ? "Sign in to read your book" : "Get the book to keep reading"}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {isSignin
                ? "The Ultimate Stroke Recovery Revolution is unlocked for survivors who own a copy. Sign in with the account you used at checkout."
                : "The full 314-page manual is owner-only. Pick up the digital PDF for $19 (instant) or the trade paperback for $29 (ships 5–10 days via Lulu)."}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {isSignin ? (
              <Button
                asChild
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="button-paywall-signin"
              >
                <a href={`/api/login?returnTo=${encodeURIComponent("/book/read")}`}>
                  Sign in
                </a>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="button-paywall-buy"
              >
                <Link href="/book/buy">
                  <ShoppingCart className="w-4 h-4" />
                  See buy options
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" data-testid="button-paywall-sample">
              <a href="/book/sample.pdf" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                Free 43-page sample
              </a>
            </Button>
          </div>

          {/* Trust footer */}
          <div className="text-center space-y-2">
            <a
              href="/book"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse the companion academy
              <ArrowRight className="w-3 h-3" />
            </a>
            {!isSignin && (
              <p className="text-xs text-muted-foreground">
                Already bought? Sign in with the same account used at checkout.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
