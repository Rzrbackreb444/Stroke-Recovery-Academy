import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Lock, Download, ShoppingCart, BookOpen, Maximize2 } from "lucide-react";

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
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Not signed in → paywall with sign-in CTA.
  if (!isAuthenticated) {
    return <Paywall reason="signin" />;
  }

  // Signed in but no paid order → paywall with buy CTA.
  if (!data?.owns) {
    return <Paywall reason="purchase" />;
  }

  const downloadUrl = `/api/marketplace/orders/${data.orderId}/items/${data.itemId}/download`;
  const inlineUrl = `${downloadUrl}?inline=1`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />
      <main className="flex-1 flex flex-col">
        <div className="border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">The Ultimate Stroke Recovery Revolution</span>
              <span className="text-muted-foreground hidden sm:inline">— Order {data.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" data-testid="link-fullscreen">
                <a href={inlineUrl} target="_blank" rel="noopener noreferrer">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Open in new tab
                </a>
              </Button>
              <Button asChild size="sm" data-testid="link-download">
                <a href={downloadUrl}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/30">
          <iframe
            src={inlineUrl}
            title="The Ultimate Stroke Recovery Revolution"
            className="w-full"
            style={{ height: "calc(100vh - 140px)", border: 0 }}
            data-testid="iframe-book-reader"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Paywall({ reason }: { reason: "signin" | "purchase" }) {
  const isSignin = reason === "signin";
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full" data-testid="card-paywall">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-paywall-title">
              {isSignin ? "Sign in to read your book" : "Get the book to keep reading"}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {isSignin
                ? "The Ultimate Stroke Recovery Revolution is unlocked for survivors who own a copy. Sign in to access yours."
                : "The full 286-page manual is reader-only for owners. Pick up the digital PDF for $19 (instant) or the print paperback for $29 (ships in 5-10 days)."}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {isSignin ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
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
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  data-testid="button-paywall-buy"
                >
                  <Link href="/book/buy">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    See buy options
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" data-testid="button-paywall-sample">
                <a href="/book/sample.pdf" target="_blank" rel="noopener noreferrer">
                  Read free sample
                </a>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Already bought? Make sure you're signed in with the same account you used at checkout.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
