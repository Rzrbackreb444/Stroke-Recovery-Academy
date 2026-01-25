import GlobalHeader from "@/components/GlobalHeader";
import { AvatarStudio } from "@/features/ai-avatar/AvatarStudio";

export default function AvatarStudioPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]" data-testid="page-avatar-studio">
      <GlobalHeader />
      <AvatarStudio />
    </div>
  );
}
