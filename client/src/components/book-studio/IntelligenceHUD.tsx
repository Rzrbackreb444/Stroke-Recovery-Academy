import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  BrainCircuit, 
  BookOpen, 
  AlertTriangle, 
  Activity, 
  Users, 
  Target, 
  TrendingUp, 
  Search,
  ShieldCheck,
  Zap
} from "lucide-react"

export default function IntelligenceHUD({ collapsed, active }: { collapsed: boolean; active: boolean }) {
  if (collapsed) return null

  return (
    <div className="flex h-full flex-col border-l border-white/5 bg-zinc-950/50 backdrop-blur-xl text-zinc-100">
      
      {/* --- HUD HEADER --- */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            System Level: <span className="text-orange-500">Online</span>
          </span>
        </div>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1 w-1 rounded-full ${i === 3 ? 'bg-green-500 animate-ping' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <Tabs defaultValue="analysis" className="flex-1 flex flex-col overflow-hidden">
        
        {/* --- INDUSTRIAL TAB BAR --- */}
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-white/5 bg-transparent p-0 h-10">
          <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white/5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-100 transition-all">
            Analysis
          </TabsTrigger>
          <TabsTrigger value="entities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white/5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-100 transition-all">
            Entities
          </TabsTrigger>
          <TabsTrigger value="market" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white/5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 data-[state=active]:text-zinc-100 transition-all">
            Market
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">

            {/* --- ANALYSIS PANEL --- */}
            <TabsContent value="analysis" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* Doctrine Adherence Meter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Doctrine Match</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-500">94.2%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[94%]" />
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed border-l-2 border-emerald-500/20 pl-3">
                  "Softmount Protocol" aligns with <span className="text-zinc-300">Chapter 6 Principles</span>. No contradictions detected.
                </p>
              </div>

              <Separator className="bg-white/5" />

              {/* Pacing Velocity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Narrative Velocity</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-400 bg-blue-500/5">HIGH</Badge>
                </div>
                {/* Visual "Waveform" placeholder */}
                <div className="flex items-end gap-1 h-8 w-full opacity-50">
                   {[40, 60, 45, 70, 90, 60, 80, 50, 70, 90, 100, 80].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${h}%`}} />
                   ))}
                </div>
              </div>

               {/* Tone Analysis */}
               <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tone Fingerprint</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[9px] hover:bg-zinc-700">AUTHORITATIVE</Badge>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[9px] hover:bg-zinc-700">GRITTY</Badge>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[9px] hover:bg-zinc-700">TECHNICAL</Badge>
                  </div>
               </div>
            </TabsContent>

            {/* --- ENTITIES PANEL --- */}
            <TabsContent value="entities" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="space-y-4">
                  {[
                    { name: "Jerry Kremers", role: "Legacy Carrier", status: "Active", color: "text-orange-500" },
                    { name: "Larry Larsen", role: "Mentor / Expert", status: "Mentioned", color: "text-blue-500" },
                    { name: "Dexter T-900", role: "Equipment", status: "Object", color: "text-zinc-500" },
                  ].map((char, i) => (
                    <div key={i} className="group flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/40 p-3 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                         <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 border border-white/5 font-bold ${char.color}`}>
                           {char.name[0]}
                         </div>
                         <div>
                           <div className="text-xs font-bold text-zinc-200">{char.name}</div>
                           <div className="text-[9px] font-mono uppercase text-zinc-500">{char.role}</div>
                         </div>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                  ))}
               </div>
            </TabsContent>

            {/* --- MARKET PANEL --- */}
            <TabsContent value="market" className="m-0 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                 <div className="flex items-center gap-2 mb-2">
                   <Target className="h-4 w-4 text-orange-500" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Target Audience Match</h3>
                 </div>
                 <div className="text-2xl font-black text-white mb-1">98%</div>
                 <div className="text-[10px] text-zinc-400 mb-4">Strong fit for "Small Business Entrepreneurship"</div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500">
                     <span>Readability</span>
                     <span>Grade 8</span>
                   </div>
                   <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500">
                     <span>Sentiment</span>
                     <span>Positive</span>
                   </div>
                   <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500">
                     <span>Keywords</span>
                     <span>High Value</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Trend Velocity</h4>
                 <div className="flex items-center gap-3 p-3 rounded border border-white/5 bg-zinc-900/40">
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                   <div>
                     <div className="text-xs font-bold text-zinc-200">Laundromat Investment</div>
                     <div className="text-[9px] text-zinc-500">+14% Search Volume (MoM)</div>
                   </div>
                 </div>
               </div>
            </TabsContent>

          </div>
        </ScrollArea>
        
        {/* --- AI FOOTER --- */}
        <div className="border-t border-white/5 bg-zinc-950 p-3">
           <div className="flex items-center gap-2 rounded bg-zinc-900 px-3 py-2 text-[10px] text-zinc-400">
             <Search className="h-3 w-3" />
             <span>Ask the Doctrine AI...</span>
             <span className="ml-auto font-mono text-xs opacity-50">⌘K</span>
           </div>
        </div>

      </Tabs>
    </div>
  )
}