import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Award,
  Download,
  Lock,
  Share2,
  GraduationCap,
} from "lucide-react";

const PART_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Foundation", subtitle: "Understanding Your New Reality" },
  2: { title: "Mindset Mastery", subtitle: "The Mental Game of Recovery" },
  3: { title: "Physical Reclamation", subtitle: "Rebuilding Your Body" },
  4: { title: "Cognitive Comeback", subtitle: "Sharpening the Mind" },
  5: { title: "Life Integration", subtitle: "Thriving in the Real World" },
  6: { title: "Prevention & Optimization", subtitle: "Never Again" },
  7: { title: "Legacy Building", subtitle: "From Survivor to Thriver" },
};

export default function RecoveryCertificate() {
  const { part: partParam } = useParams<{ part: string }>();
  const partNumber = parseInt(partParam ?? "1", 10);
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery<{
    partNumber: number;
    eligible: boolean;
    missingChapters: number[];
    certificate: { serial: string; issuedAt: string; partNumber: number } | null;
    recipientName: string;
  }>({
    queryKey: ["/api/recovery/university/certificate", partNumber],
    enabled: !!user && Number.isFinite(partNumber),
    retry: false,
  });

  const partInfo = PART_TITLES[partNumber];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p className="text-gray-400">Loading certificate…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
        <Card className="bg-[#1a1a1a] border border-[#333] max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-10 h-10 text-[#E2741B] mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Sign in to view your certificates.</p>
            <Link href="/api/login">
              <Button className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-black" data-testid="button-sign-in">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!partInfo) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <p className="text-gray-400">Invalid part.</p>
      </div>
    );
  }

  const { toast } = useToast();
  const handleShare = async () => {
    const url = window.location.href;
    const text = `I just earned my Recovery University · Part ${partNumber} (${partInfo.title}) certificate from Stroke Recovery Academy.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Recovery University Certificate", text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: "Link copied", description: "Share your certificate anywhere." });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <header className="bg-[#0D0D0D] border-b border-[#333] py-4 px-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/recovery/university">
            <Button variant="outline" size="sm" className="border-[#333] text-white hover:bg-[#1a1a1a]" data-testid="button-back-syllabus">
              <ArrowLeft className="w-4 h-4 mr-1" /> Syllabus
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GraduationCap className="w-4 h-4 text-[#E2741B]" />
            <span>Recovery University</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {!data?.eligible ? (
          <Card className="bg-[#1a1a1a] border border-[#333]" data-testid="card-not-eligible">
            <CardContent className="p-10 text-center">
              <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Not yet earned</h1>
              <p className="text-gray-400 mb-4">
                Pass every chapter quiz in <span className="text-white font-semibold">Part {partNumber}: {partInfo.title}</span> to unlock this certificate.
              </p>
              {data?.missingChapters && data.missingChapters.length > 0 && (
                <p className="text-sm text-gray-500 mb-6" data-testid="text-missing-chapters">
                  Still need: Chapter{data.missingChapters.length === 1 ? "" : "s"} {data.missingChapters.join(", ")}
                </p>
              )}
              <Link href="/recovery/university">
                <Button className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-black" data-testid="button-keep-learning">
                  Keep learning
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-4 border-[#E2741B] rounded-lg p-10 md:p-16 text-center print:bg-white print:border-black print:text-black"
              data-testid="card-certificate"
            >
              <div className="absolute top-4 left-4 right-4 bottom-4 border border-[#E2741B]/40 rounded pointer-events-none print:border-black/40" />

              <Award className="w-16 h-16 text-[#E2741B] mx-auto mb-4 print:text-black" />
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-2 print:text-gray-700">
                Stroke Recovery Academy · Recovery University
              </p>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-6 print:text-black" data-testid="heading-certificate">
                Certificate of Completion
              </h1>
              <p className="text-gray-400 mb-2 print:text-gray-700">This certifies that</p>
              <p className="text-2xl md:text-3xl font-bold text-[#E2741B] mb-6 print:text-black" data-testid="text-recipient-name">
                {data.recipientName}
              </p>
              <p className="text-gray-300 max-w-2xl mx-auto mb-2 print:text-gray-800">
                has successfully completed every chapter and quiz of
              </p>
              <p className="text-xl md:text-2xl font-bold text-white mb-1 print:text-black" data-testid="text-part-title">
                Part {partNumber}: {partInfo.title}
              </p>
              <p className="text-gray-400 italic mb-8 print:text-gray-700" data-testid="text-part-subtitle">
                {partInfo.subtitle}
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-10 text-sm text-gray-400 print:text-gray-700">
                <div>
                  <p className="uppercase tracking-wider text-xs mb-1">Issued</p>
                  <p className="font-semibold text-white print:text-black" data-testid="text-issued-date">
                    {data.certificate ? new Date(data.certificate.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
                  </p>
                </div>
                <div className="hidden md:block w-px h-8 bg-[#333] print:bg-black/30" />
                <div>
                  <p className="uppercase tracking-wider text-xs mb-1">Serial</p>
                  <p className="font-mono text-white print:text-black" data-testid="text-certificate-serial">
                    {data.certificate?.serial ?? "—"}
                  </p>
                </div>
                <div className="hidden md:block w-px h-8 bg-[#333] print:bg-black/30" />
                <div>
                  <p className="uppercase tracking-wider text-xs mb-1">Signed</p>
                  <p className="font-semibold text-white print:text-black">Nick Kremers</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
              <Button
                onClick={() => window.print()}
                className="bg-[#E2741B] hover:bg-[#E2741B]/90 text-black"
                data-testid="button-print-certificate"
              >
                <Download className="w-4 h-4 mr-2" />
                Print / Save as PDF
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#1a1a1a]"
                data-testid="button-share-certificate"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Link href="/recovery/university">
                <Button variant="ghost" className="text-gray-400" data-testid="button-back-syllabus-cert">
                  Back to syllabus
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
