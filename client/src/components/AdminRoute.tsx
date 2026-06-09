import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) window.location.href = "/api/login";
  }, [isLoading, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  const role = (user as any).role;
  if (role !== "admin" && role !== "owner") {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border-[#333] max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-10 h-10 text-[#E2741B] mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-2">Admin access required</h1>
            <p className="text-gray-400 mb-4 text-sm">This area is restricted to platform administrators.</p>
            <Button asChild variant="outline" className="border-[#333]">
              <Link href="/recovery/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
