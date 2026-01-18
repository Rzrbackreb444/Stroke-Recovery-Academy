import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, BookOpen, AlertTriangle } from "lucide-react";

export default function IntelligenceHUD({ collapsed, active }: { collapsed: boolean; active: boolean }) {
  if (collapsed) return <div className="p-4 flex flex-col gap-8 items-center"><BrainCircuit className="w-5 h-5 text-orange-500" /></div>;

  return (
    <div className="h-full flex flex-col bg-[#121212] border-l border-zinc-800/50">
      <div className="p-4 border-b border-zinc-800/50 flex items-center gap-3">
        <BrainCircuit className="w-5 h-5 text-orange-500" />
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-100">Intelligence HUD</h2>
      </div>

      <Tabs defaultValue="lore" className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-zinc-800/50 rounded-none h-10 px-2 justify-start gap-4">
          <TabsTrigger value="lore" className="text-[10px] uppercase font-bold data-[state=active]:text-orange-500">Lore</TabsTrigger>
          <TabsTrigger value="pacing" className="text-[10px] uppercase font-bold data-[state=active]:text-orange-500">Pacing</TabsTrigger>
          <TabsTrigger value="audit" className="text-[10px] uppercase font-bold data-[state=active]:text-orange-500">Audit</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="lore" className="m-0 space-y-4">
            <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold text-zinc-400">DOCTRINE SYNC</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed italic">"Grandpa Jerry: Pickup truck full of quarters. Foundation of reliability."</p>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="m-0">
            <div className="flex items-center gap-2 p-3 text-orange-500/80 bg-orange-500/5 border border-orange-500/20 rounded-sm">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[10px] font-bold">NO CONTRADICTIONS DETECTED</span>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}