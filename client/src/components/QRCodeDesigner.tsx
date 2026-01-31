import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Download, Palette, Image, RefreshCw, Loader2 } from "lucide-react";

interface QRCodeDesignerProps {
  projectId: number;
  projectName: string;
  onSave?: (qrUrl: string) => void;
}

const colorPresets = [
  { name: "Forest Green", fg: "#1B4332", bg: "#FFFFFF" },
  { name: "Gold Classic", fg: "#C9941A", bg: "#0D0D0D" },
  { name: "Ocean Blue", fg: "#0077B6", bg: "#FFFFFF" },
  { name: "Royal Purple", fg: "#7C3AED", bg: "#FFFFFF" },
  { name: "Sunset Orange", fg: "#EA580C", bg: "#FFFFFF" },
  { name: "Dark Mode", fg: "#FFFFFF", bg: "#0D0D0D" },
];

export default function QRCodeDesigner({ projectId, projectName, onSave }: QRCodeDesignerProps) {
  const [fgColor, setFgColor] = useState("#1B4332");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [size, setSize] = useState([256]);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quote-studio/qr/generate", {
        projectId,
        foregroundColor: fgColor,
        backgroundColor: bgColor,
        size: size[0],
        format,
        logoUrl: logoUrl || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setQrDataUrl(data.qrCode);
      if (onSave) onSave(data.qrCode);
    },
  });

  useEffect(() => {
    generateQRMutation.mutate();
  }, [projectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQRMutation.mutate();
    }, 500);

    return () => clearTimeout(timer);
  }, [fgColor, bgColor, size[0], format, logoUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-qr.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePresetClick = (preset: typeof colorPresets[0]) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  return (
    <Card className="bg-[#1a1a1a] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#C9941A]" />
          QR Code Designer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <Label className="text-white/80 text-sm">Color Presets</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className="p-2 rounded-lg border border-white/10 hover:border-[#C9941A]/50 transition-all"
                    style={{ backgroundColor: preset.bg }}
                    data-testid={`preset-${preset.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <div
                      className="w-full h-4 rounded"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <p className="text-xs mt-1 truncate" style={{ color: preset.fg === "#FFFFFF" ? "#333" : preset.fg }}>
                      {preset.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80 text-sm">Foreground Color</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                    data-testid="input-fg-color"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="bg-[#0D0D0D] border-white/20 text-white flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/80 text-sm">Background Color</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                    data-testid="input-bg-color"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-[#0D0D0D] border-white/20 text-white flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white/80 text-sm">Size: {size[0]}px</Label>
              <Slider
                value={size}
                onValueChange={setSize}
                min={128}
                max={512}
                step={64}
                className="mt-2"
                data-testid="slider-size"
              />
            </div>

            <div>
              <Label className="text-white/80 text-sm">Logo URL (optional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="bg-[#0D0D0D] border-white/20 text-white"
                  data-testid="input-logo-url"
                />
                <Button size="icon" variant="outline" className="border-white/20">
                  <Image className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-white/80 text-sm">Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "png" | "svg")}>
                <SelectTrigger className="bg-[#0D0D0D] border-white/20 text-white mt-2" data-testid="select-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  <SelectItem value="png" className="text-white">PNG (Best for print)</SelectItem>
                  <SelectItem value="svg" className="text-white">SVG (Scalable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-[#0D0D0D] rounded-xl border border-white/10">
            {generateQRMutation.isPending ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[#C9941A] animate-spin" />
                <p className="text-white/60 text-sm">Generating QR code...</p>
              </div>
            ) : qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="max-w-full rounded-lg shadow-lg"
                  style={{ maxHeight: "280px" }}
                  data-testid="qr-preview"
                />
                <p className="text-white/40 text-xs mt-4">
                  Scan to view: /q/{projectId}
                </p>
              </>
            ) : (
              <p className="text-white/60">No QR code generated</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => generateQRMutation.mutate()}
            disabled={generateQRMutation.isPending}
            variant="outline"
            className="flex-1 border-white/20 text-white gap-2"
            data-testid="button-regenerate"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 gap-2"
            style={{ backgroundColor: "#C9941A" }}
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4" /> Download {format.toUpperCase()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
