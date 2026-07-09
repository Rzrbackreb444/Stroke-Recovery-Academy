import GlobalHeader from "@/components/GlobalHeader";
import { PodcastStudio } from "@/features/podcast-studio/PodcastStudio";

export default function PodcastStudioPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]" data-testid="page-podcast-studio">
      <GlobalHeader />
      <PodcastStudio />
    </div>
  );
}
