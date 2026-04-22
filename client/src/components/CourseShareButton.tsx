import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Share2, Copy, Check, MessageSquare, Send,
} from "lucide-react";
import { SiX, SiFacebook, SiReddit, SiLinkedin, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareMeta {
  courseId: number;
  title: string;
  summary: string;
  shareUrl: string;
  refCode: string | null;
  channels: Record<"x" | "facebook" | "reddit" | "linkedin" | "whatsapp" | "sms" | "copy", string>;
}

interface Props {
  courseId: number | string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
  label?: string;
}

const CHANNELS: Array<{
  key: keyof ShareMeta["channels"];
  label: string;
  Icon: any;
  newTab?: boolean;
}> = [
  { key: "x", label: "X / Twitter", Icon: SiX, newTab: true },
  { key: "facebook", label: "Facebook", Icon: SiFacebook, newTab: true },
  { key: "reddit", label: "Reddit", Icon: SiReddit, newTab: true },
  { key: "linkedin", label: "LinkedIn", Icon: SiLinkedin, newTab: true },
  { key: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp, newTab: true },
  { key: "sms", label: "Text message", Icon: MessageSquare },
];

export default function CourseShareButton({
  courseId, variant = "ghost", size = "icon", label,
}: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { data } = useQuery<ShareMeta>({
    queryKey: ["/api/share/course", courseId],
    queryFn: async () =>
      (await fetch(`/api/share/course/${courseId}`)).json(),
    enabled: !!courseId,
  });

  function track(channel: string) {
    fetch("/api/share/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: Number(courseId), channel, refCode: data?.refCode ?? null,
      }),
    }).catch(() => {});
  }

  function open(url: string, channel: string, newTab?: boolean) {
    track(channel);
    if (newTab) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  async function copyLink() {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      track("copy");
      toast({ title: "Link copied", description: "Share it anywhere." });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  async function nativeShare() {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.summary, url: data.shareUrl });
        track("native");
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          data-testid={`button-share-course-${courseId}`}
          aria-label="Share course"
        >
          <Share2 className="w-4 h-4" />
          {label ? <span className="ml-2">{label}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Share {data?.refCode ? "(your link earns)" : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CHANNELS.map(({ key, label, Icon, newTab }) => (
          <DropdownMenuItem
            key={key}
            disabled={!data}
            onSelect={() => data && open(data.channels[key], key, newTab)}
            data-testid={`share-${key}-${courseId}`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={copyLink}
          disabled={!data}
          data-testid={`share-copy-${courseId}`}
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy link"}
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && (navigator as any).share ? (
          <DropdownMenuItem onSelect={nativeShare} disabled={!data}
            data-testid={`share-native-${courseId}`}>
            <Send className="w-4 h-4 mr-2" /> More…
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
