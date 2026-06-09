import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  recovery: string;
  initials: string;
}

export default function TestimonialCard({
  quote,
  name,
  recovery,
  initials,
}: TestimonialCardProps) {
  return (
    <div className="h-full rounded-md border border-white/10 bg-white/[0.03] p-7 flex flex-col">
      <Quote className="h-8 w-8 text-gold shrink-0" fill="currentColor" />
      <p
        className="mt-5 text-lg leading-relaxed text-white/85 flex-1"
        data-testid="text-testimonial-quote"
      >
        "{quote}"
      </p>
      <div className="flex items-center gap-3 pt-6 mt-6 border-t border-white/10">
        <Avatar className="border-2 border-gold/40">
          <AvatarFallback className="bg-gold text-black font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-white" data-testid="text-testimonial-name">
            {name}
          </div>
          <div className="text-sm text-white/50" data-testid="text-testimonial-recovery">
            {recovery}
          </div>
        </div>
      </div>
    </div>
  );
}
