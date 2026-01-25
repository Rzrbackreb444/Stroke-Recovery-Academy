import GlobalHeader from "@/components/GlobalHeader";
import { TemplateMarketplace } from "@/features/template-marketplace/TemplateMarketplace";

export default function TemplateMarketplacePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]" data-testid="page-template-marketplace">
      <GlobalHeader />
      <TemplateMarketplace />
    </div>
  );
}
