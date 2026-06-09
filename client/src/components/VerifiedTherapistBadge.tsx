import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  title?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function VerifiedTherapistBadge({ title, size = "sm", className = "" }: Props) {
  const dims = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-[#E2741B]/40 bg-[#E2741B]/10 ${padding} font-semibold text-[#E2741B] ${className}`}
          data-testid="badge-verified-therapist"
        >
          <ShieldCheck className={dims} />
          {title ? <span>{title}</span> : <span>Verified Therapist</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Credentials verified by Stroke Recovery Academy. Educational content only — not medical advice.
      </TooltipContent>
    </Tooltip>
  );
}
