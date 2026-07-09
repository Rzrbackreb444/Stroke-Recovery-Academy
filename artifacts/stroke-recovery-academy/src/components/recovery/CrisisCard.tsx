import { Phone, MessageSquare, ExternalLink, ShieldAlert } from "lucide-react";

export interface CrisisResource {
  label: string;
  detail: string;
  action: {
    type: "tel" | "sms" | "url";
    value: string;
  };
}

interface CrisisCardProps {
  message: string;
  resources: CrisisResource[];
}

function actionHref(action: CrisisResource["action"]): string {
  switch (action.type) {
    case "tel":
      return `tel:${action.value.replace(/[^0-9+]/g, "")}`;
    case "sms":
      return `sms:${action.value}`;
    case "url":
      return action.value;
  }
}

function actionIcon(type: CrisisResource["action"]["type"]) {
  switch (type) {
    case "tel":
      return Phone;
    case "sms":
      return MessageSquare;
    case "url":
      return ExternalLink;
  }
}

export default function CrisisCard({ message, resources }: CrisisCardProps) {
  return (
    <div
      className="border border-red-500/40 bg-red-950/30 rounded-2xl p-5 space-y-4"
      data-testid="crisis-card"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="h-4 w-4 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 mb-1">
            You deserve real human support
          </p>
          <p className="text-sm text-gray-200 leading-relaxed" data-testid="text-crisis-message">
            {message}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {resources.map((res) => {
          const Icon = actionIcon(res.action.type);
          const href = actionHref(res.action);
          const target = res.action.type === "url" ? "_blank" : undefined;
          return (
            <li key={res.label}>
              <a
                href={href}
                target={target}
                rel={target ? "noopener noreferrer" : undefined}
                className="flex items-start gap-3 px-3 py-3 rounded-md bg-black/40 border border-red-500/20 hover-elevate active-elevate-2"
                data-testid={`crisis-resource-${res.action.type}-${res.action.value.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 24)}`}
              >
                <Icon className="h-4 w-4 text-red-300 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{res.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{res.detail}</p>
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-gray-500 leading-relaxed pt-1 border-t border-red-500/15">
        This card replaced the AI coach's reply because what you shared deserves a real person, not a chatbot. The AI will resume normal conversation on your next message — but please reach out first.
      </p>
    </div>
  );
}
