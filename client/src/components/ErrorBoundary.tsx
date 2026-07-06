import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-full bg-[#C06B3E]/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-[#C06B3E]" />
            </div>
            <h2 className="text-xl font-bold text-[#2A2421] mb-2">Something went wrong</h2>
            <p className="text-[#5C534D] text-sm mb-6 leading-relaxed">
              An unexpected error occurred. Try refreshing — if it keeps happening, your session may have expired.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
                data-testid="button-error-retry"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try again
              </Button>
              <Button
                size="sm"
                className="bg-[#C06B3E] text-white"
                onClick={() => window.location.assign("/recovery/dashboard")}
                data-testid="button-error-dashboard"
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
