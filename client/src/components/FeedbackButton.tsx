import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Send, Bug, Lightbulb, Heart, HelpCircle } from "lucide-react";

const KIND_OPTIONS = [
  { value: "bug", label: "Bug — something is broken", Icon: Bug },
  { value: "feature", label: "Idea — I wish it did this", Icon: Lightbulb },
  { value: "praise", label: "Praise — this helped me", Icon: Heart },
  { value: "confusion", label: "Confusion — I don't get this", Icon: HelpCircle },
  { value: "general", label: "General feedback", Icon: MessageSquarePlus },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// Routes where the floating button should NOT appear (clutter or focus-sensitive).
const SUPPRESS_PREFIXES = [
  "/checkout",
  "/recovery/admin",
  "/admin",
  "/api/",
  "/recovery/login",
];

export default function FeedbackButton() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>("general");
  const [severity, setSeverity] = useState<string>("normal");
  const [body, setBody] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const { toast } = useToast();

  const suppressed = SUPPRESS_PREFIXES.some((p) => location.startsWith(p));

  const mutation = useMutation({
    mutationFn: (payload: object) => apiRequest("POST", "/api/feedback/items", payload),
    onSuccess: () => {
      toast({ title: "Sent to Nick", description: "Thank you. Every message gets read." });
      setBody("");
      setContactEmail("");
      setKind("general");
      setSeverity("normal");
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Couldn't send", description: "Try again in a moment.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (trimmed.length < 3) {
      toast({ title: "Add a few words", description: "At least 3 characters." });
      return;
    }
    mutation.mutate({
      route: location || "/",
      kind,
      severity,
      body: trimmed,
      contactEmail: contactEmail.trim() || undefined,
    });
  };

  if (suppressed) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="default"
          className="fixed bottom-4 left-4 h-12 w-12 rounded-full shadow-lg z-50 bg-[#C9941A] hover:bg-[#C9941A] text-black border border-[#C9941A]"
          aria-label="Send feedback to Nick"
          data-testid="button-feedback-toggle"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-[360px] p-4 bg-[#0f0f0f] border-[#1f1f1f] text-white"
        data-testid="popover-feedback"
      >
        <div className="mb-3">
          <div className="text-sm font-semibold text-white">Send Nick a note</div>
          <div className="text-xs text-gray-400 mt-1">
            Bug, idea, praise, or confusion. Goes straight to the inbox — Nick reads every one.
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="feedback-kind" className="text-xs text-gray-300">Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="feedback-kind" className="bg-[#0a0a0a] border-[#1f1f1f] text-white" data-testid="select-feedback-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#1f1f1f] text-white">
                {KIND_OPTIONS.map(({ value, label, Icon }) => (
                  <SelectItem key={value} value={value} data-testid={`option-kind-${value}`}>
                    <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {kind === "bug" && (
            <div>
              <Label htmlFor="feedback-severity" className="text-xs text-gray-300">How blocking?</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger id="feedback-severity" className="bg-[#0a0a0a] border-[#1f1f1f] text-white" data-testid="select-feedback-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1f1f1f] text-white">
                  {SEVERITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} data-testid={`option-severity-${o.value}`}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="feedback-body" className="text-xs text-gray-300">Message</Label>
            <Textarea
              id="feedback-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={4000}
              rows={4}
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white text-sm"
              data-testid="textarea-feedback-body"
            />
            <div className="text-[10px] text-gray-500 mt-1 text-right">{body.length}/4000</div>
          </div>

          <div>
            <Label htmlFor="feedback-email" className="text-xs text-gray-300">Reply-to email (optional)</Label>
            <Input
              id="feedback-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#0a0a0a] border-[#1f1f1f] text-white text-sm"
              data-testid="input-feedback-email"
            />
          </div>

          <div className="text-[10px] text-gray-500 leading-relaxed">
            Sent from <span className="text-gray-300">{location || "/"}</span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || body.trim().length < 3}
            className="w-full bg-[#C9941A] hover:bg-[#C9941A] text-black"
            data-testid="button-feedback-submit"
          >
            <Send className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Sending…" : "Send to Nick"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
