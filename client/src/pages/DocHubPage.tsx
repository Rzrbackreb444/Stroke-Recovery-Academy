import GlobalHeader from "@/components/GlobalHeader";
import { DocHub } from "@/features/doc-hub/DocHub";

export default function DocHubPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]" data-testid="page-doc-hub">
      <GlobalHeader />
      <DocHub />
    </div>
  );
}
