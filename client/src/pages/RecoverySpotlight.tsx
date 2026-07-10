import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Calendar, Star, Upload, X, Check, Loader2, Trophy, Heart } from "lucide-react";
import RecoveryHeader from "@/components/RecoveryHeader";
import RecoverySEO from "@/components/RecoverySEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ORANGE = "#E2741B";

interface Spotlight {
  id: number;
  slug: string;
  monthKey: string;
  displayName: string;
  headline: string | null;
  story: string | null;
  recoveryDate: string | null;
  location: string | null;
  photoUrl: string | null;
  publishedAt: string | null;
}

function renderStory(story: string) {
  const paras = story.split(/\n{2,}/);
  return paras.map((p, i) => (
    <p key={i} className="mb-4 text-base leading-relaxed text-gray-300">
      {p.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((chunk, j) => {
        if (chunk.startsWith("**") && chunk.endsWith("**"))
          return <strong key={j} className="font-bold text-white">{chunk.slice(2, -2)}</strong>;
        if (chunk.startsWith("_") && chunk.endsWith("_"))
          return <em key={j} className="italic">{chunk.slice(1, -1)}</em>;
        return <span key={j}>{chunk}</span>;
      })}
    </p>
  ));
}

// ── Nomination dialog ─────────────────────────────────────────────────────────
type NomType = "self" | "other";

interface MediaFile {
  file: File;
  previewUrl: string;
  uploading: boolean;
  objectPath: string | null;
  error?: string;
}

function NominationDialog({ open, onOpenChange, defaultType }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultType?: NomType;
}) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"type" | "form" | "done">("type");
  const [nomType, setNomType] = useState<NomType>(defaultType ?? "self");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [nomineeLocation, setNomineeLocation] = useState("");
  const [strokeDate, setStrokeDate] = useState("");
  const [relationship, setRelationship] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const reset = () => {
    setStep("type");
    setNomType(defaultType ?? "self");
    setNomineeName("");
    setNomineeEmail("");
    setNomineeLocation("");
    setStrokeDate("");
    setRelationship("");
    setDescription("");
    setMediaFiles([]);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  // Upload a single file to object storage
  const uploadFile = async (mf: MediaFile, idx: number) => {
    setMediaFiles((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: true } : f));
    try {
      const { uploadURL, objectPath } = await apiRequest("POST", "/api/spotlight/nominations/upload-url").then((r) => r.json());
      await fetch(uploadURL, { method: "PUT", body: mf.file, headers: { "Content-Type": mf.file.type } });
      setMediaFiles((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: false, objectPath } : f));
    } catch {
      setMediaFiles((prev) => prev.map((f, i) => i === idx ? { ...f, uploading: false, error: "Upload failed" } : f));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - mediaFiles.length);
    const newItems: MediaFile[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      objectPath: null,
    }));
    setMediaFiles((prev) => {
      const updated = [...prev, ...newItems];
      newItems.forEach((_, i) => {
        const idx = prev.length + i;
        setTimeout(() => uploadFile(updated[idx], idx), 0);
      });
      return updated;
    });
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setMediaFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].previewUrl);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const submitMut = useMutation({
    mutationFn: async () => {
      const mediaUrls = mediaFiles.filter((f) => f.objectPath).map((f) => f.objectPath!);
      const res = await apiRequest("POST", "/api/spotlight/nominations", {
        type: nomType,
        nomineeName: nomineeName.trim(),
        nomineeEmail: nomineeEmail.trim() || undefined,
        nomineeLocation: nomineeLocation.trim() || undefined,
        strokeDate: strokeDate.trim() || undefined,
        relationship: relationship.trim() || undefined,
        description: description.trim(),
        mediaUrls,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Submission failed");
      }
    },
    onSuccess: () => setStep("done"),
    onError: (e: any) => toast({ title: "Couldn't submit", description: e?.message, variant: "destructive" }),
  });

  const canSubmit = nomineeName.trim().length >= 2 && description.trim().length >= 30 &&
    !mediaFiles.some((f) => f.uploading) && !submitMut.isPending;

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-[#111] border-[#222] text-white">
          <DialogHeader>
            <DialogTitle>Sign in first</DialogTitle>
            <DialogDescription className="text-gray-400">
              You need to be signed in to submit a spotlight application or nomination.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full bg-[#E2741B] hover:bg-[#c5621a] text-white"
            onClick={() => { window.location.href = "/recovery/login"; }}>
            Sign In
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-[#111] border-[#222] text-white max-h-[90vh] overflow-y-auto">
        {step === "type" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black">Who's the spotlight for?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Nick reviews every submission personally and writes the feature article.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-2">
              <button
                onClick={() => { setNomType("self"); setStep("form"); }}
                className={`text-left rounded-lg border p-4 transition-colors ${nomType === "self" ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#1a1a1a] hover:border-[#E2741B]/50"}`}
                data-testid="btn-type-self"
              >
                <p className="font-bold text-white text-sm mb-1">Apply for myself</p>
                <p className="text-gray-400 text-xs">I want to share my own recovery story for the monthly spotlight.</p>
              </button>
              <button
                onClick={() => { setNomType("other"); setStep("form"); }}
                className={`text-left rounded-lg border p-4 transition-colors ${nomType === "other" ? "border-[#E2741B] bg-[#E2741B]/10" : "border-[#333] bg-[#1a1a1a] hover:border-[#E2741B]/50"}`}
                data-testid="btn-type-other"
              >
                <p className="font-bold text-white text-sm mb-1">Nominate someone else</p>
                <p className="text-gray-400 text-xs">I know a survivor whose story needs to be told.</p>
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black">
                {nomType === "self" ? "Your application" : "Your nomination"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {nomType === "self"
                  ? "Tell Nick about yourself and why this is your month."
                  : "Tell Nick who you're nominating and why they deserve it."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider">
                    {nomType === "self" ? "Your name" : "Nominee's name"} <span className="text-[#E2741B]">*</span>
                  </Label>
                  <Input
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder={nomType === "self" ? "Your name" : "Their name"}
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                    data-testid="input-nominee-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider">
                    {nomType === "self" ? "Your email (optional)" : "Their email (optional)"}
                  </Label>
                  <Input
                    type="email"
                    value={nomineeEmail}
                    onChange={(e) => setNomineeEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                    data-testid="input-nominee-email"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider">Location (optional)</Label>
                  <Input
                    value={nomineeLocation}
                    onChange={(e) => setNomineeLocation(e.target.value)}
                    placeholder="City, State / Country"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                    data-testid="input-nominee-location"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider">Stroke date (optional)</Label>
                  <Input
                    value={strokeDate}
                    onChange={(e) => setStrokeDate(e.target.value)}
                    placeholder="e.g. March 2019"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                    data-testid="input-stroke-date"
                  />
                </div>
              </div>

              {nomType === "other" && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400 uppercase tracking-wider">Your relationship to them</Label>
                  <Input
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. My father, A friend from my support group, Fellow survivor"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600"
                    data-testid="input-relationship"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-gray-400 uppercase tracking-wider">
                  {nomType === "self" ? "Your story — why this is your month" : "Why they deserve the spotlight"} <span className="text-[#E2741B]">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={nomType === "self"
                    ? "Tell Nick about your recovery — the lows, the fight, where you are now, what you've built through it. Be real. That's what gets picked."
                    : "Tell Nick who this person is, what their recovery looked like, and why their story needs to be told. The more specific, the better."}
                  className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 min-h-[140px]"
                  maxLength={3000}
                  data-testid="textarea-description"
                />
                <p className="text-[10px] text-gray-600 text-right">{description.length}/3000</p>
              </div>

              {/* Media upload */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 uppercase tracking-wider">Photos or videos (optional, up to 5)</Label>
                <p className="text-xs text-gray-500">Images and short video clips help Nick make the decision. Upload recovery photos, therapy sessions, milestone moments — anything that shows the journey.</p>
                {mediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mediaFiles.map((mf, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#333] bg-[#1a1a1a]">
                        {mf.file.type.startsWith("video/") ? (
                          <video src={mf.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={mf.previewUrl} alt="" className="w-full h-full object-cover" />
                        )}
                        {mf.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Loader2 className="w-5 h-5 text-[#E2741B] animate-spin" />
                          </div>
                        )}
                        {mf.objectPath && !mf.uploading && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {mf.error && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <p className="text-[9px] text-red-400 text-center px-1">{mf.error}</p>
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center"
                          data-testid={`button-remove-media-${i}`}
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {mediaFiles.length < 5 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      data-testid="input-media-files"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 border border-dashed border-[#333] rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-[#E2741B]/50 hover:text-gray-300 transition-colors w-full justify-center"
                      data-testid="button-upload-media"
                    >
                      <Upload className="w-4 h-4" />
                      Add photos or videos
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="text-gray-400"
                  onClick={() => setStep("type")}
                  data-testid="button-back-type"
                >
                  Back
                </Button>
                <Button
                  onClick={() => submitMut.mutate()}
                  disabled={!canSubmit}
                  className="flex-1 bg-[#E2741B] hover:bg-[#c5621a] text-white font-bold"
                  data-testid="button-submit-nomination"
                >
                  {submitMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : "Submit to Nick"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black">Submitted.</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E2741B]/20 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-[#E2741B]" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Nick reviews every submission personally. If {nomType === "self" ? "you're" : "they're"} chosen, he'll reach out before writing the feature. Winners are announced monthly.
              </p>
              <Button
                onClick={() => handleClose(false)}
                className="bg-[#E2741B] hover:bg-[#c5621a] text-white"
                data-testid="button-done"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RecoverySpotlight() {
  const [, archiveParams] = useRoute("/recovery/spotlight/:slug");
  const slug = archiveParams?.slug;
  const [nomOpen, setNomOpen] = useState(false);
  const [nomDefaultType, setNomDefaultType] = useState<NomType>("self");

  const { data: current, isLoading: loadingCurrent } = useQuery<Spotlight | null>({
    queryKey: ["/api/recovery/spotlight"],
    enabled: !slug,
  });
  const { data: byslug, isLoading: loadingSlug } = useQuery<Spotlight>({
    queryKey: ["/api/recovery/spotlight", slug],
    enabled: !!slug,
  });
  const { data: archive } = useQuery<Spotlight[]>({
    queryKey: ["/api/recovery/spotlight/archive"],
  });

  const spotlight = slug ? byslug : current;
  const isLoading = slug ? loadingSlug : loadingCurrent;

  const openNom = (type: NomType) => {
    setNomDefaultType(type);
    setNomOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <RecoverySEO
        title={
          spotlight
            ? `${spotlight.displayName} — Survivor Spotlight`
            : "Survivor Spotlight — Stroke Recovery Stories"
        }
        description={
          spotlight?.headline ||
          spotlight?.story?.slice(0, 160) ||
          "Real stroke survivors. Real comebacks. Featured monthly."
        }
        canonical={slug ? `/recovery/spotlight/${slug}` : "/recovery/spotlight"}
        keywords={["stroke survivor story", "stroke recovery testimonial", "survivor spotlight", "stroke comeback"]}
      />

      <RecoveryHeader />
      <NominationDialog open={nomOpen} onOpenChange={setNomOpen} defaultType={nomDefaultType} />

      {/* Hero */}
      <section className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#1a1a1a] to-[#0D0D0D]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href={slug ? "/recovery/spotlight" : "/recovery/dashboard"}>
            <Button variant="ghost" size="sm" className="mb-4 text-gray-400" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {slug ? "Back to current spotlight" : "Back to dashboard"}
            </Button>
          </Link>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>
            <Star className="h-4 w-4" />
            Survivor Spotlight
          </p>
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            {isLoading ? "Loading…" : spotlight ? spotlight.displayName : "No spotlight yet"}
          </h1>
          {spotlight?.headline && (
            <p className="mt-3 text-xl text-gray-300 sm:text-2xl">{spotlight.headline}</p>
          )}
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#0D0D0D]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          {isLoading && <p className="text-gray-400">Loading spotlight…</p>}
          {!isLoading && !spotlight && (
            <div className="rounded-lg border border-[#1a1a1a] bg-[#111] p-8 text-center">
              <p className="text-lg font-bold text-white">Our first spotlight ships next month.</p>
              <p className="mt-2 text-gray-400">
                Be the first — apply below or nominate someone whose story needs to be told.
              </p>
            </div>
          )}
          {spotlight && (
            <div className="grid gap-8 lg:grid-cols-[200px,1fr]">
              <div>
                <Avatar className="mx-auto h-40 w-40 lg:mx-0">
                  <AvatarImage src={spotlight.photoUrl || undefined} alt={spotlight.displayName} />
                  <AvatarFallback className="bg-[#E2741B] text-3xl font-black text-black">
                    {spotlight.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  {spotlight.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: ORANGE }} />
                      {spotlight.location}
                    </p>
                  )}
                  {spotlight.recoveryDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: ORANGE }} />
                      Stroke {new Date(spotlight.recoveryDate).toLocaleDateString()}
                    </p>
                  )}
                  {spotlight.publishedAt && (
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      Featured {new Date(spotlight.publishedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <article className="prose prose-invert max-w-none">
                {spotlight.story ? renderStory(spotlight.story) : (
                  <p className="text-gray-400">Full story pending — check back soon.</p>
                )}
              </article>
            </div>
          )}
        </div>
      </section>

      {/* Archive */}
      {!slug && archive && archive.length > 1 && (
        <section className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">Past Spotlights</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {archive.slice(1).map((s) => (
                <Link key={s.id} href={`/recovery/spotlight/${s.slug}`} data-testid={`link-archive-${s.slug}`}
                  className="block rounded-md border border-[#1a1a1a] bg-[#111] p-4 hover-elevate active-elevate-2">
                  <p className="text-xs uppercase tracking-widest text-gray-500">
                    {s.publishedAt && new Date(s.publishedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  <p className="mt-1 text-base font-black text-white">{s.displayName}</p>
                  {s.headline && <p className="mt-1 text-sm text-gray-400 line-clamp-2">{s.headline}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Apply / Nominate CTA ───────────────────────────────────────────── */}
      {!slug && (
        <section className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-2" style={{ color: ORANGE }}>Monthly Feature</p>
              <h2 className="text-3xl font-black text-white mb-3">Could this be your story?</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Nick personally reads every submission and writes the feature article himself.
                One survivor chosen each month. Applications open always.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="rounded-xl border border-[#1a1a1a] bg-[#111] p-6 flex flex-col items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${ORANGE}20` }}>
                  <Trophy className="w-5 h-5" style={{ color: ORANGE }} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1">Apply for myself</h3>
                  <p className="text-gray-400 text-sm">Share your recovery story. Tell Nick what you've fought through and why this is your month.</p>
                </div>
                <Button
                  onClick={() => openNom("self")}
                  className="mt-auto w-full font-bold text-white"
                  style={{ background: ORANGE }}
                  data-testid="button-apply-self"
                >
                  Apply for the Spotlight
                </Button>
              </div>

              <div className="rounded-xl border border-[#1a1a1a] bg-[#111] p-6 flex flex-col items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a1a1a]">
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1">Nominate someone</h3>
                  <p className="text-gray-400 text-sm">Know a survivor whose comeback story needs to be told? Put their name in. Nick will reach out if they're selected.</p>
                </div>
                <Button
                  onClick={() => openNom("other")}
                  variant="outline"
                  className="mt-auto w-full font-bold border-[#333] text-white"
                  data-testid="button-nominate-other"
                >
                  Nominate a Survivor
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-600 mt-6">
              Winners are contacted before publication. Nick writes every feature article himself.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
