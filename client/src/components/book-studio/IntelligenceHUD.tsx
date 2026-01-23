import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
  Zap,
  Clock,
  BarChart3,
  Globe,
  DollarSign,
} from "lucide-react"

interface IntelligenceHUDProps {
  collapsed?: boolean;
  active?: boolean;
  isDark?: boolean;
}

export default function IntelligenceHUD({ 
  collapsed = false, 
  active = true,
  isDark = false 
}: IntelligenceHUDProps) {
  if (collapsed) return null

  return (
    <div className={cn(
      "flex h-full flex-col",
      isDark 
        ? "bg-stone-950/50 backdrop-blur-xl text-stone-200" 
        : "bg-white/40 backdrop-blur-xl text-[#1A1A1A]"
    )}>
      
      {/* HUD Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isDark ? "border-stone-800/50" : "border-[#C9941A]/10"
      )}>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-[#C9941A]" />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em]",
            isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
          )}>
            System: <span className="text-emerald-500">Online</span>
          </span>
        </div>
        <div className="flex gap-1" aria-label="System status indicators">
          {[1,2,3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i === 3 ? 'bg-emerald-500 animate-pulse' : isDark ? 'bg-stone-700' : 'bg-[#C9941A]/20'
              )} 
            />
          ))}
        </div>
      </div>

      <Tabs defaultValue="analysis" className="flex-1 flex flex-col overflow-hidden">
        
        {/* Tab Bar */}
        <TabsList className={cn(
          "grid w-full grid-cols-3 rounded-none border-b bg-transparent p-0 h-10",
          isDark ? "border-stone-800/50" : "border-[#C9941A]/10"
        )}>
          <TabsTrigger 
            value="analysis" 
            className={cn(
              "rounded-none border-b-2 border-transparent text-[9px] font-bold uppercase tracking-wider transition-all",
              isDark 
                ? "data-[state=active]:border-[#C9941A] data-[state=active]:bg-stone-900/50 text-stone-500 data-[state=active]:text-stone-100" 
                : "data-[state=active]:border-[#C9941A] data-[state=active]:bg-[#C9941A]/5 text-[#1A1A1A]/40 data-[state=active]:text-[#1A1A1A]"
            )}
            data-testid="tab-analysis"
          >
            Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="entities" 
            className={cn(
              "rounded-none border-b-2 border-transparent text-[9px] font-bold uppercase tracking-wider transition-all",
              isDark 
                ? "data-[state=active]:border-[#C9941A] data-[state=active]:bg-stone-900/50 text-stone-500 data-[state=active]:text-stone-100" 
                : "data-[state=active]:border-[#C9941A] data-[state=active]:bg-[#C9941A]/5 text-[#1A1A1A]/40 data-[state=active]:text-[#1A1A1A]"
            )}
            data-testid="tab-entities"
          >
            Entities
          </TabsTrigger>
          <TabsTrigger 
            value="market" 
            className={cn(
              "rounded-none border-b-2 border-transparent text-[9px] font-bold uppercase tracking-wider transition-all",
              isDark 
                ? "data-[state=active]:border-[#C9941A] data-[state=active]:bg-stone-900/50 text-stone-500 data-[state=active]:text-stone-100" 
                : "data-[state=active]:border-[#C9941A] data-[state=active]:bg-[#C9941A]/5 text-[#1A1A1A]/40 data-[state=active]:text-[#1A1A1A]"
            )}
            data-testid="tab-market"
          >
            Market
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">

            {/* ANALYSIS PANEL */}
            <TabsContent value="analysis" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* Doctrine Adherence Meter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                    )}>Doctrine Match</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-500">94.2%</span>
                </div>
                <div className={cn(
                  "h-1.5 w-full rounded-full overflow-hidden",
                  isDark ? "bg-stone-800" : "bg-[#C9941A]/10"
                )}>
                   <div className="h-full bg-emerald-500 w-[94%]" />
                </div>
                <p className={cn(
                  "text-[10px] leading-relaxed border-l-2 border-emerald-500/20 pl-3",
                  isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                )}>
                  "Softmount Protocol" aligns with <span className={isDark ? "text-stone-300" : "text-[#1A1A1A]"}>Chapter 6 Principles</span>. No contradictions detected.
                </p>
              </div>

              <Separator className={isDark ? "bg-stone-800" : "bg-[#C9941A]/10"} />

              {/* Pacing Velocity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                    )}>Narrative Velocity</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-500 bg-blue-500/5">HIGH</Badge>
                </div>
                {/* Visual Waveform */}
                <div className="flex items-end gap-1 h-8 w-full opacity-60" aria-label="Pacing waveform visualization">
                   {[40, 60, 45, 70, 90, 60, 80, 50, 70, 90, 100, 80].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${h}%`}} />
                   ))}
                </div>
              </div>

              {/* Tone Analysis */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3 w-3 text-[#C9941A]" />
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                    )}>Tone Fingerprint</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className={cn(
                      "text-[9px]",
                      isDark ? "bg-stone-800 text-stone-400" : "bg-[#C9941A]/10 text-[#1A1A1A]/70"
                    )}>AUTHORITATIVE</Badge>
                    <Badge variant="secondary" className={cn(
                      "text-[9px]",
                      isDark ? "bg-stone-800 text-stone-400" : "bg-[#C9941A]/10 text-[#1A1A1A]/70"
                    )}>GRITTY</Badge>
                    <Badge variant="secondary" className={cn(
                      "text-[9px]",
                      isDark ? "bg-stone-800 text-stone-400" : "bg-[#C9941A]/10 text-[#1A1A1A]/70"
                    )}>TECHNICAL</Badge>
                  </div>
               </div>

               {/* Consistency Alert */}
               <div className={cn(
                 "rounded-sm border p-3",
                 isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-500/20 bg-amber-50"
               )}>
                 <div className="flex items-start gap-2">
                   <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                   <div>
                     <p className={cn(
                       "text-[10px] font-semibold",
                       isDark ? "text-amber-400" : "text-amber-700"
                     )}>Character Voice Drift</p>
                     <p className={cn(
                       "text-[9px] mt-0.5",
                       isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                     )}>Marcus sounds too cheerful in Ch. 4 compared to established voice</p>
                   </div>
                 </div>
               </div>
            </TabsContent>

            {/* ENTITIES PANEL */}
            <TabsContent value="entities" className="m-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="space-y-4">
                  {[
                    { name: "Jerry Kremers", role: "Legacy Carrier", status: "Active", color: "text-[#C9941A]" },
                    { name: "Larry Larsen", role: "Mentor / Expert", status: "Mentioned", color: "text-blue-500" },
                    { name: "Dexter T-900", role: "Equipment", status: "Object", color: isDark ? "text-stone-500" : "text-[#1A1A1A]/50" },
                  ].map((char, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "group flex items-center justify-between rounded-sm border p-3 transition-all",
                        isDark 
                          ? "border-stone-800 bg-stone-900/40 hover:border-stone-700" 
                          : "border-[#C9941A]/10 bg-white/50 hover:border-[#C9941A]/20"
                      )}
                      data-testid={`entity-${char.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "flex h-8 w-8 items-center justify-center rounded-full border font-bold",
                           isDark ? "bg-stone-950 border-stone-800" : "bg-[#FAF8F3] border-[#C9941A]/20",
                           char.color
                         )}>
                           {char.name[0]}
                         </div>
                         <div>
                           <div className={cn(
                             "text-xs font-bold",
                             isDark ? "text-stone-200" : "text-[#1A1A1A]"
                           )}>{char.name}</div>
                           <div className={cn(
                             "text-[9px] font-mono uppercase",
                             isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                           )}>{char.role}</div>
                         </div>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                  ))}
               </div>

               <Separator className={isDark ? "bg-stone-800" : "bg-[#C9941A]/10"} />

               {/* Locations */}
               <div>
                 <div className="flex items-center gap-2 mb-3">
                   <Globe className="h-3 w-3 text-[#C9941A]" />
                   <span className={cn(
                     "text-[10px] font-bold uppercase tracking-widest",
                     isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                   )}>Locations</span>
                 </div>
                 <div className="space-y-2">
                   {["The Laundromat", "Downtown Austin", "Warehouse District"].map((loc, i) => (
                     <div 
                       key={i}
                       className={cn(
                         "px-3 py-2 rounded-sm text-xs border",
                         isDark 
                           ? "border-stone-800 bg-stone-900/30 text-stone-300" 
                           : "border-[#C9941A]/10 bg-white/30 text-[#1A1A1A]/70"
                       )}
                     >
                       {loc}
                     </div>
                   ))}
                 </div>
               </div>
            </TabsContent>

            {/* MARKET PANEL */}
            <TabsContent value="market" className="m-0 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
               {/* Target Audience Match */}
               <div className={cn(
                 "rounded-sm border p-4",
                 isDark ? "border-[#C9941A]/20 bg-[#C9941A]/5" : "border-[#C9941A]/20 bg-[#C9941A]/5"
               )}>
                 <div className="flex items-center gap-2 mb-2">
                   <Target className="h-4 w-4 text-[#C9941A]" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-[#C9941A]">Target Audience Match</h3>
                 </div>
                 <div className={cn(
                   "text-2xl font-black mb-1",
                   isDark ? "text-white" : "text-[#1A1A1A]"
                 )}>98%</div>
                 <div className={cn(
                   "text-[10px] mb-4",
                   isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                 )}>Strong fit for "Small Business Entrepreneurship"</div>
                 
                 <div className="space-y-2">
                   {[
                     { label: "Readability", value: "Grade 8" },
                     { label: "Sentiment", value: "Positive" },
                     { label: "Keywords", value: "High Value" },
                   ].map((item, i) => (
                     <div key={i} className={cn(
                       "flex justify-between text-[9px] uppercase font-bold",
                       isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                     )}>
                       <span>{item.label}</span>
                       <span>{item.value}</span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Pricing Recommendations */}
               <div>
                 <div className="flex items-center gap-2 mb-3">
                   <DollarSign className="h-3 w-3 text-emerald-500" />
                   <span className={cn(
                     "text-[10px] font-bold uppercase tracking-widest",
                     isDark ? "text-stone-400" : "text-[#1A1A1A]/50"
                   )}>Optimal Pricing</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                   {[
                     { format: "eBook", price: "$9.99" },
                     { format: "Paperback", price: "$19.99" },
                     { format: "Hardcover", price: "$34.99" },
                   ].map((item, i) => (
                     <div 
                       key={i}
                       className={cn(
                         "text-center p-2 rounded-sm border",
                         isDark 
                           ? "border-stone-800 bg-stone-900/30" 
                           : "border-[#C9941A]/10 bg-white/50"
                       )}
                     >
                       <div className={cn(
                         "text-[9px] uppercase tracking-wider mb-1",
                         isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                       )}>{item.format}</div>
                       <div className={cn(
                         "text-sm font-bold",
                         isDark ? "text-stone-200" : "text-[#1A1A1A]"
                       )}>{item.price}</div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Trend Velocity */}
               <div className="space-y-2">
                 <h4 className={cn(
                   "text-[9px] font-bold uppercase tracking-widest mb-2",
                   isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                 )}>Trend Velocity</h4>
                 <div className={cn(
                   "flex items-center gap-3 p-3 rounded-sm border",
                   isDark 
                     ? "border-stone-800 bg-stone-900/40" 
                     : "border-[#C9941A]/10 bg-white/50"
                 )}>
                   <TrendingUp className="h-4 w-4 text-emerald-500" />
                   <div>
                     <div className={cn(
                       "text-xs font-bold",
                       isDark ? "text-stone-200" : "text-[#1A1A1A]"
                     )}>Laundromat Investment</div>
                     <div className={cn(
                       "text-[9px]",
                       isDark ? "text-stone-500" : "text-[#1A1A1A]/40"
                     )}>+14% Search Volume (MoM)</div>
                   </div>
                 </div>
               </div>
            </TabsContent>

          </div>
        </ScrollArea>
        
        {/* AI Search Footer */}
        <div className={cn(
          "border-t p-3",
          isDark ? "border-stone-800 bg-stone-950" : "border-[#C9941A]/10 bg-white/50"
        )}>
           <div className="relative">
             <Search className={cn(
               "absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3",
               isDark ? "text-stone-600" : "text-[#1A1A1A]/30"
             )} />
             <Input
               placeholder="Ask the Doctrine AI..."
               className={cn(
                 "pl-8 h-8 text-[10px] rounded-sm",
                 isDark 
                   ? "bg-stone-900 border-stone-800 text-stone-300 placeholder:text-stone-600" 
                   : "bg-white/50 border-[#C9941A]/20 placeholder:text-[#1A1A1A]/30"
               )}
               data-testid="input-doctrine-search"
               aria-label="Search doctrine AI"
             />
             <span className={cn(
               "absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px]",
               isDark ? "text-stone-600" : "text-[#1A1A1A]/20"
             )}>⌘K</span>
           </div>
        </div>

      </Tabs>
    </div>
  )
}
