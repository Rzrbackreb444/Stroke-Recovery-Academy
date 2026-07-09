import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { CheckSquare, Square, MessageSquare, Send, Check } from "lucide-react";

const USER_TYPES = [
  { value: "survivor", label: "Stroke Survivor" },
  { value: "caregiver", label: "Caregiver / Family Member" },
  { value: "visitor", label: "Just exploring" },
];

const GOALS = [
  { id: "physical", label: "Regain movement — arm, hand, or leg" },
  { id: "speech", label: "Improve speech and communication" },
  { id: "fatigue", label: "Reduce cognitive fatigue and brain fog" },
  { id: "habits", label: "Build daily recovery habits that actually stick" },
  { id: "community", label: "Connect with survivors who actually get it" },
  { id: "accountability", label: "Someone to keep me accountable day to day" },
  { id: "caregiver_support", label: "Support and guidance for my caregiver" },
  { id: "roadmap", label: "A clear roadmap — what to do in Year 1, 2, 3+" },
  { id: "information", label: "Understand what happened to my brain" },
];

export default function FeedbackSurvey() {
  const [userType, setUserType] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/feedback/platform", data),
    onSuccess: () => setSubmitted(true),
  });

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedGoals.length === 0) return;
    mutation.mutate({ name, email, userType, goals: selectedGoals, freeText });
  };

  if (submitted) {
    return (
      <section className="border-t border-[#1a1a1a] bg-[#0a0a0a] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#E2741B]/10 border border-[#E2741B]/30 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-[#E2741B]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Received. Thank you.
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-md mx-auto">
            Nick reads every response himself. This is how the platform gets built — around what survivors actually need, not what someone guessed they needed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-[#1a1a1a] bg-[#0a0a0a] py-20 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-3">
          <MessageSquare className="h-5 w-5 text-[#E2741B]" />
          <span className="text-[#E2741B] text-sm font-semibold uppercase tracking-widest">
            Direct to Nick
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          What would you like to gain from this platform?
        </h2>
        <p className="text-gray-400 mb-10 leading-relaxed">
          This isn't a marketing form. I built this platform out of a wheelchair and I'm still building it. Your answer tells me exactly what to build next. Takes 90 seconds.
        </p>

        <div className="space-y-8">
          {/* Who are you */}
          <div>
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              I am a...
            </p>
            <div className="flex flex-wrap gap-3">
              {USER_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setUserType(type.value)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    userType === type.value
                      ? "border-[#E2741B] bg-[#E2741B]/10 text-[#E2741B]"
                      : "border-[#333] text-gray-400 hover:border-[#555]"
                  }`}
                  data-testid={`button-usertype-${type.value}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              What I want most — select all that apply
            </p>
            <div className="space-y-2">
              {GOALS.map(goal => {
                const selected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-colors ${
                      selected
                        ? "border-[#E2741B] bg-[#E2741B]/8 text-white"
                        : "border-[#222] text-gray-400 hover:border-[#444] hover:text-gray-300"
                    }`}
                    data-testid={`button-goal-${goal.id}`}
                  >
                    {selected
                      ? <CheckSquare className="h-4 w-4 text-[#E2741B] shrink-0" />
                      : <Square className="h-4 w-4 text-gray-600 shrink-0" />
                    }
                    <span className="text-sm">{goal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free text */}
          <div>
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Anything else you want Nick to know — optional
            </p>
            <Textarea
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              placeholder="Where you're at. What's hardest. What you tried. Whatever you want to say."
              className="bg-[#111] border-[#333] text-white placeholder:text-gray-600 resize-none min-h-24 focus-visible:ring-[#E2741B]/30"
              data-testid="input-feedback-freetext"
            />
          </div>

          {/* Optional contact */}
          <div>
            <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Optional — if you want Nick to follow up
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your first name"
                className="w-full px-4 py-2.5 rounded-md bg-[#111] border border-[#333] text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-[#E2741B]/50"
                data-testid="input-feedback-name"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-md bg-[#111] border border-[#333] text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-[#E2741B]/50"
                data-testid="input-feedback-email"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Never shared. Only used if Nick wants to respond directly to you.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedGoals.length === 0 || mutation.isPending}
            className="w-full bg-[#E2741B] text-black font-bold text-base py-6"
            data-testid="button-feedback-submit"
          >
            {mutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send my feedback to Nick
              </>
            )}
          </Button>

          {mutation.isError && (
            <p className="text-red-400 text-sm text-center">
              Something went wrong. Try again.
            </p>
          )}

          {selectedGoals.length === 0 && (
            <p className="text-gray-600 text-xs text-center">
              Select at least one goal above to submit.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
