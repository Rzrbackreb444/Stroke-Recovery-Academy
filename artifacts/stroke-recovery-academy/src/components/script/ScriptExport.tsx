import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  FileText,
  File,
  Loader2,
  Check,
  Printer,
  Share2,
  Copy
} from "lucide-react";

interface ScriptExportProps {
  projectId: number;
  projectTitle: string;
}

const EXPORT_FORMATS = [
  { 
    value: "pdf", 
    label: "PDF", 
    description: "Industry-standard screenplay format",
    icon: FileText
  },
  { 
    value: "fdx", 
    label: "Final Draft (FDX)", 
    description: "Compatible with Final Draft software",
    icon: File
  },
  { 
    value: "fountain", 
    label: "Fountain", 
    description: "Plain text screenplay format",
    icon: FileText
  },
  { 
    value: "docx", 
    label: "Word Document", 
    description: "Microsoft Word compatible",
    icon: File
  },
];

export function ScriptExport({ projectId, projectTitle }: ScriptExportProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState("pdf");
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeCharacterList, setIncludeCharacterList] = useState(true);
  const [includeSceneNumbers, setIncludeSceneNumbers] = useState(true);
  const [includeBeatSheet, setIncludeBeatSheet] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/screenplay/${projectId}/export`, {
        format,
        options: {
          includeTitle,
          includeCharacterList,
          includeSceneNumbers,
          includeBeatSheet
        }
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = `${projectTitle}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Complete", description: "Your script has been downloaded." });
      }
    },
    onError: () => {
      toast({ title: "Export Failed", description: "Could not export script", variant: "destructive" });
    }
  });

  const copyToClipboard = async () => {
    try {
      const res = await apiRequest("GET", `/api/screenplay/${projectId}/text`);
      const data = await res.json();
      await navigator.clipboard.writeText(data.text);
      toast({ title: "Copied", description: "Script copied to clipboard" });
    } catch {
      toast({ title: "Copy Failed", description: "Could not copy script", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Download className="w-5 h-5 text-orange-500" />
          Export Script
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Export Format</label>
          <RadioGroup value={format} onValueChange={setFormat} className="space-y-2">
            {EXPORT_FORMATS.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    format === fmt.value 
                      ? "border-orange-500/50 bg-orange-500/5" 
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                  onClick={() => setFormat(fmt.value)}
                >
                  <RadioGroupItem value={fmt.value} id={fmt.value} />
                  <Icon className={`w-5 h-5 ${format === fmt.value ? "text-orange-500" : "text-zinc-500"}`} />
                  <div className="flex-1">
                    <Label htmlFor={fmt.value} className="cursor-pointer font-medium">{fmt.label}</Label>
                    <p className="text-xs text-zinc-500">{fmt.description}</p>
                  </div>
                  {fmt.value === "pdf" && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm text-zinc-400">Include in Export</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/50">
              <Checkbox
                id="title"
                checked={includeTitle}
                onCheckedChange={(checked) => setIncludeTitle(!!checked)}
              />
              <Label htmlFor="title" className="text-sm cursor-pointer flex-1">Title Page</Label>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/50">
              <Checkbox
                id="characters"
                checked={includeCharacterList}
                onCheckedChange={(checked) => setIncludeCharacterList(!!checked)}
              />
              <Label htmlFor="characters" className="text-sm cursor-pointer flex-1">Character List</Label>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/50">
              <Checkbox
                id="sceneNumbers"
                checked={includeSceneNumbers}
                onCheckedChange={(checked) => setIncludeSceneNumbers(!!checked)}
              />
              <Label htmlFor="sceneNumbers" className="text-sm cursor-pointer flex-1">Scene Numbers</Label>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/50">
              <Checkbox
                id="beatSheet"
                checked={includeBeatSheet}
                onCheckedChange={(checked) => setIncludeBeatSheet(!!checked)}
              />
              <Label htmlFor="beatSheet" className="text-sm cursor-pointer flex-1">Beat Sheet (Appendix)</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            data-testid="button-export"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Button variant="outline" className="flex-1" onClick={copyToClipboard} data-testid="button-copy">
            <Copy className="w-4 h-4 mr-2" />
            Copy Text
          </Button>
          <Button variant="outline" className="flex-1" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" data-testid="button-share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
