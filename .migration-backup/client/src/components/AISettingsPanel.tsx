import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, Brain, ShieldCheck, Zap, Globe, Lock, 
  Key, Database, Cpu, BarChart3, Cloud, Save, RefreshCcw,
  Network, Fingerprint, Activity, Terminal, Eye, MessageSquare,
  Package, Layout, FileText, Share2, AlertTriangle, CheckCircle2, Users
} from "lucide-react";

/**
 * INSTITUTIONAL AISettingsPanel v4.0 (Production Elite)
 * Logic: Neural Orchestration, 85% Margin Governance, Credential Sovereignty
 * Theme: Stone & Ink (#FAF8F3 / #E2741B)
 */

export default function AISettingsPanel() {
  // --- Institutional State Management ---
  const [contextDepth, setContextDepth] = useState([128]);
  const [modelTemperature, setModelTemperature] = useState([0.7]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [activeStatus, setActiveStatus] = useState('Optimal');
  const [revenueYield, setRevenueYield] = useState(2840490);

  // --- Neural Sync Logic ---
  const handleSync = useCallback(() => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-8 max-w-7xl mx-auto space-y-12 font-sans animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* --- Institutional Header --- */}
      <header className="flex justify-between items-end border-b-2 border-[#E2741B]/20 pb-10">
        <div className="space-y-4">
          <Badge className="bg-[#E2741B]/10 text-[#E2741B] text-[10px] uppercase tracking-[0.4em] font-black px-6 py-2 rounded-none border-[#E2741B]/30">
            Institutional Standard 2026
          </Badge>
          <h1 className="text-7xl font-black tracking-tighter uppercase italic text-[#1A1A1A] leading-none">
            Workspace <span className="text-[#E2741B]">Sovereignty</span>
          </h1>
          <p className="text-[12px] uppercase tracking-[0.6em] font-bold opacity-40 flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-[#E2741B]" /> 
            Neural Command & Control OS
          </p>
        </div>
        
        <div className="flex gap-4 items-center h-fit">
          <div className="text-right px-6 border-r-2 border-[#E2741B]/10">
            <span className="text-[10px] uppercase font-black opacity-30 block tracking-widest">System Pulse</span>
            <span className="text-sm font-black text-green-600 uppercase tracking-tighter">{activeStatus}</span>
          </div>
          <Button variant="outline" className="border-2 border-[#E2741B]/30 text-[11px] uppercase font-black tracking-widest px-8 h-14 rounded-none hover:bg-white transition-all">
            <RefreshCcw className="w-5 h-5 mr-3 opacity-50" /> Factory Reset
          </Button>
          <Button className="bg-[#1A1A1A] hover:bg-[#E2741B] text-white text-[11px] font-black uppercase tracking-widest px-14 h-14 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all">
            <Save className="w-5 h-5 mr-3" /> Save Protocol
          </Button>
        </div>
      </header>

      {/* --- Primary Command Navigation --- */}
      <Tabs defaultValue="intelligence" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white border-2 border-[#E2741B]/10 p-2 rounded-none h-24 mb-12 shadow-[0_10px_30px_rgba(226,116,27,0.05)]">
          <TabsTrigger value="intelligence" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white rounded-none h-full transition-all border-r border-[#E2741B]/10 last:border-0">
            <Brain className="w-5 h-5 mb-2 text-[#E2741B]" /> Neural Engine
          </TabsTrigger>
          <TabsTrigger value="security" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white rounded-none h-full transition-all border-r border-[#E2741B]/10 last:border-0">
            <Lock className="w-5 h-5 mb-2 text-[#E2741B]" /> Security Vault
          </TabsTrigger>
          <TabsTrigger value="monetization" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white rounded-none h-full transition-all border-r border-[#E2741B]/10 last:border-0">
            <Globe className="w-5 h-5 mb-2 text-[#E2741B]" /> Revenue Logic
          </TabsTrigger>
          <TabsTrigger value="collective" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white rounded-none h-full transition-all border-r border-[#E2741B]/10 last:border-0">
            <Network className="w-5 h-5 mb-2 text-[#E2741B]" /> Knowledge Exchange
          </TabsTrigger>
          <TabsTrigger value="export" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white rounded-none h-full transition-all last:border-0">
            <Package className="w-5 h-5 mb-2 text-[#E2741B]" /> Production Engine
          </TabsTrigger>
        </TabsList>

        {/* --- PILLAR 1: NEURAL ENGINE --- */}
        <TabsContent value="intelligence" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-12 gap-10">
            
            {/* Model Orchestration */}
            <div className="col-span-8 space-y-8">
              <Card className="border-2 border-[#E2741B]/10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] rounded-none bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Terminal className="w-64 h-64" />
                </div>
                <CardHeader className="border-b-2 border-[#E2741B]/5 p-10 bg-[#FAF8F3]/40">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-[#1A1A1A] text-white">
                      <Cpu className="w-8 h-8 text-[#E2741B]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-[0.2em]">Neural Orchestration</CardTitle>
                      <CardDescription className="text-[11px] uppercase font-bold opacity-50 tracking-widest mt-2">Configure primary reasoning and semantic monitoring layers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-12 space-y-12">
                  
                  {/* Semantic Monitoring Toggle */}
                  <div className="flex items-center justify-between p-8 bg-[#FAF8F3] border-2 border-[#E2741B]/10 group hover:border-[#E2741B]/40 transition-all">
                    <div className="space-y-2">
                      <Label className="text-[14px] font-black uppercase tracking-widest flex items-center gap-3">
                        Deep Semantic Monitoring 
                        <Badge className="bg-[#E2741B] text-white text-[9px]">Elite</Badge>
                      </Label>
                      <p className="text-[11px] opacity-60 font-serif italic leading-relaxed">Utilize Gemini 1.5 Pro to monitor recursive narrative consistency across all studios.</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#E2741B] h-8 w-14" />
                  </div>

                  {/* Context Window Slider */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <Label className="text-[14px] font-black uppercase tracking-widest">Context Memory Depth</Label>
                        <p className="text-[11px] opacity-50 font-serif italic">Total tokens available for the project-wide Author Brain</p>
                      </div>
                      <span className="text-3xl font-black text-[#E2741B] font-mono tracking-tighter">{contextDepth}k</span>
                    </div>
                    <Slider 
                      value={contextDepth} 
                      onValueChange={setContextDepth} 
                      max={256} 
                      step={32} 
                      className="[&>.relative>.bg-primary]:bg-[#E2741B] py-4" 
                    />
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 tracking-widest px-1">
                      <span>Standard (32k)</span>
                      <span>Pro (128k)</span>
                      <span>Institutional (256k)</span>
                    </div>
                  </div>

                  <Separator className="bg-[#E2741B]/10" />

                  {/* Temperature Slider */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <Label className="text-[14px] font-black uppercase tracking-widest">Creativity Variance (Temp)</Label>
                        <p className="text-[11px] opacity-50 font-serif italic">Adjust for factual doctrines (low) or cinematic fiction (high)</p>
                      </div>
                      <span className="text-3xl font-black text-[#E2741B] font-mono tracking-tighter">{modelTemperature}</span>
                    </div>
                    <Slider 
                      value={modelTemperature} 
                      onValueChange={setModelTemperature} 
                      max={1.5} 
                      step={0.1} 
                      className="[&>.relative>.bg-primary]:bg-[#E2741B] py-4" 
                    />
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 tracking-widest px-1">
                      <span>Analytical (0.1)</span>
                      <span>Standard (0.7)</span>
                      <span>Exploratory (1.5)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel: Recursive Learning */}
            <div className="col-span-4 space-y-10">
              <Card className="border-2 border-[#E2741B]/10 shadow-2xl rounded-none bg-white overflow-hidden">
                <CardHeader className="bg-[#1A1A1A] text-white p-8">
                  <CardTitle className="text-xs uppercase tracking-[0.3em] font-black flex items-center gap-4">
                    <RefreshCcw className={`w-5 h-5 text-[#E2741B] ${isSyncing ? 'animate-spin' : ''}`} /> 
                    Recursive Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <p className="text-[14px] opacity-60 leading-relaxed font-serif italic text-justify">
                    Synchronize the global project brain. This cross-references your current manuscript with character bibles, image prompts, and course curriculum nodes.
                  </p>
                  
                  {isSyncing && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>Indexing Codex...</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-2 bg-[#E2741B]/10" />
                    </div>
                  )}

                  <Button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.2em] py-8 hover:bg-[#E2741B] transition-all shadow-xl rounded-none relative group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isSyncing ? "Synchronizing Brain..." : "Synchronize Project Brain"}
                      {!isSyncing && <Zap className="w-5 h-5 text-[#E2741B]" />}
                    </span>
                    <div className="absolute inset-0 bg-[#E2741B] translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0" />
                  </Button>
                </CardContent>
                <CardFooter className="p-8 bg-[#FAF8F3] border-t-2 border-[#E2741B]/5">
                  <div className="flex items-center gap-4 opacity-40 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 text-green-600" /> 
                    Last Sync: 14m ago
                  </div>
                </CardFooter>
              </Card>

              <div className="p-10 bg-[#E2741B]/5 border-2 border-[#E2741B]/10 space-y-6">
                <h4 className="text-[11px] uppercase tracking-[0.3em] font-black flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#E2741B]" /> AI Compliance
                </h4>
                <p className="text-[12px] opacity-60 leading-relaxed font-serif text-justify italic">
                  All intelligence models are configured in **Sovereignty Mode**. Your manuscript data is never used for training external models.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- PILLAR 2: SECURITY VAULT --- */}
        <TabsContent value="security" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
          <Card className="border-2 border-[#E2741B]/10 shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-none bg-white overflow-hidden">
            <CardHeader className="border-b-2 border-[#E2741B]/5 bg-[#FAF8F3]/50 p-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-[#1A1A1A] text-white shadow-2xl">
                    <Lock className="w-10 h-10 text-[#E2741B]" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black uppercase tracking-[0.3em]">Credential Sovereign</CardTitle>
                    <CardDescription className="text-[12px] uppercase font-bold opacity-40 tracking-widest mt-2">Manage encrypted institutional access keys</CardDescription>
                  </div>
                </div>
                <Badge className="bg-[#E2741B] text-white px-6 py-2 rounded-none text-[10px] tracking-widest font-black uppercase">
                  Vault Secured: AES-256
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-16 grid grid-cols-2 gap-20">
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label className="text-[12px] uppercase font-black tracking-[0.2em] opacity-40">Gemini Institutional Key</Label>
                  <div className="relative group">
                    <Input type="password" value="••••••••••••••••" className="rounded-none border-2 border-[#E2741B]/20 bg-[#FAF8F3]/30 h-16 text-lg px-8 pr-16 focus:border-[#E2741B] transition-all" />
                    <Button variant="ghost" className="absolute right-0 top-0 h-full px-6 hover:bg-transparent group-hover:text-[#E2741B] transition-colors">
                      <Eye className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-[12px] uppercase font-black tracking-[0.2em] opacity-40">Stripe Live Production Key</Label>
                  <div className="relative group">
                    <Input type="password" value="••••••••••••••••" className="rounded-none border-2 border-[#E2741B]/20 bg-[#FAF8F3]/30 h-16 text-lg px-8 pr-16 focus:border-[#E2741B] transition-all" />
                    <Button variant="ghost" className="absolute right-0 top-0 h-full px-6 hover:bg-transparent group-hover:text-[#E2741B] transition-colors">
                      <Lock className="w-6 h-6 opacity-30 group-hover:opacity-100" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[12px] uppercase font-black tracking-[0.2em] opacity-40">Amazon S3 Storage Secret</Label>
                  <Input type="password" value="••••••••••••••••" className="rounded-none border-2 border-[#E2741B]/20 bg-[#FAF8F3]/30 h-16 text-lg px-8" />
                </div>
              </div>

              <div className="space-y-10 bg-[#FAF8F3] p-12 border-2 border-[#E2741B]/5 shadow-inner">
                <div className="space-y-6">
                  <h4 className="text-xl font-black uppercase tracking-widest flex items-center gap-4 text-[#1A1A1A]">
                    <ShieldCheck className="w-8 h-8 text-green-600" /> Security Protocol
                  </h4>
                  <p className="text-[14px] opacity-60 leading-[1.8] font-serif text-justify italic">
                    All institutional credentials are encrypted at rest using AES-256 standards. Keys never touch the browser; all API calls are proxied through the Stroke Recovery Academy hardened backend to ensure absolute sovereignty over your creative assets.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8 border-t border-[#E2741B]/10">
                  <Button variant="outline" className="w-full h-16 border-2 border-[#1A1A1A] text-[11px] font-black uppercase tracking-widest rounded-none hover:bg-[#1A1A1A] hover:text-white transition-all">
                    Download Security Audit Log
                  </Button>
                  <Button variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest text-[#E2741B]">
                    Revoke All Active Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PILLAR 3: REVENUE LOGIC --- */}
        <TabsContent value="monetization" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-3 gap-10">
            
            <Card className="col-span-2 border-2 border-[#E2741B]/10 shadow-2xl rounded-none bg-white">
              <CardHeader className="p-10 border-b-2 border-[#E2741B]/5 bg-[#FAF8F3]/30">
                <CardTitle className="text-2xl font-black uppercase tracking-[0.2em]">85% Margin Governance</CardTitle>
                <CardDescription className="text-[11px] uppercase font-bold opacity-40 tracking-widest mt-2">Institutional Payout Configuration</CardDescription>
              </CardHeader>
              <CardContent className="p-12 space-y-12">
                 
                 <div className="flex items-center justify-between p-10 bg-[#FAF8F3] border-2 border-[#E2741B]/10">
                    <div className="space-y-2">
                      <Label className="text-lg font-black uppercase tracking-widest">Auto-Apply Profit Strategy</Label>
                      <p className="text-[12px] opacity-50 font-serif italic">Dynamically adjusts marketplace pricing based on real-time 2026 industry trends.</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-[#E2741B] h-10 w-16" />
                 </div>

                 <div className="grid grid-cols-2 gap-12 pt-10 border-t-2 border-[#E2741B]/10">
                    <div className="p-8 bg-white border-2 border-[#E2741B]/5 space-y-4">
                      <Label className="text-[12px] uppercase font-black opacity-30 tracking-[0.3em]">Platform Fee Cap</Label>
                      <div className="text-5xl font-black text-[#1A1A1A] tracking-tighter">15.00<span className="text-xl opacity-20">%</span></div>
                      <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Locked: Institutional Tier</p>
                    </div>
                    <div className="p-8 bg-green-50 border-2 border-green-600/10 space-y-4 shadow-inner">
                      <Label className="text-[12px] uppercase font-black opacity-30 tracking-[0.3em] text-green-900">Net Creator Yield</Label>
                      <div className="text-5xl font-black text-green-600 tracking-tighter">85.00<span className="text-xl opacity-40">%</span></div>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3" /> High-Density Profit Mode
                      </p>
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="p-10 bg-[#1A1A1A] text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <BarChart3 className="w-6 h-6 text-[#E2741B]" />
                  <span className="text-[11px] uppercase tracking-widest font-black opacity-70">Payout Schedule: Instant to Connect Account</span>
                </div>
                <Button className="bg-[#E2741B] hover:bg-white hover:text-[#E2741B] text-white rounded-none px-10 py-6 text-[11px] font-black uppercase tracking-widest transition-all">
                  Configure Connect
                </Button>
              </CardFooter>
            </Card>
            
            <div className="space-y-10">
              <Card className="bg-[#1A1A1A] text-white border-none shadow-[0_40px_80px_rgba(0,0,0,0.3)] rounded-none flex flex-col justify-between overflow-hidden relative group min-h-[400px]">
                 <div className="absolute top-[-40px] right-[-40px] opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                   <Globe className="w-80 h-80" />
                 </div>
                 <CardHeader className="p-10">
                    <CardTitle className="text-[12px] uppercase tracking-[0.4em] text-[#E2741B] font-black">Global Impact</CardTitle>
                 </CardHeader>
                 <CardContent className="p-10 pb-20 pt-10">
                    <div className="text-5xl font-black tracking-tighter mb-6 font-mono text-[#E2741B]">
                      ${revenueYield.toLocaleString()}
                    </div>
                    <p className="text-[14px] opacity-50 font-serif italic leading-[1.8] text-justify">
                      Total community revenue processed through the Stroke Recovery Academy 85/15 Split Engine since Jan 2026. Institutional members have kept 85% of this total yield.
                    </p>
                 </CardContent>
                 <div className="p-8 bg-white/10 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#E2741B]">
                   Marketplace Sync: ACTIVE
                 </div>
              </Card>

              <div className="p-10 bg-white border-2 border-[#E2741B]/10 space-y-6 shadow-xl relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#E2741B]" />
                <h4 className="text-[12px] uppercase tracking-[0.3em] font-black flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#E2741B]" /> Yield Analysis
                </h4>
                <p className="text-[12px] opacity-60 leading-relaxed font-serif italic">
                  Institutional members see a 42% higher net margin compared to standard creators using legacy platforms.
                </p>
                <Button variant="ghost" className="p-0 text-[10px] font-black uppercase tracking-widest text-[#E2741B]">
                  View Yield Report →
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- PILLAR 4: KNOWLEDGE EXCHANGE --- */}
        <TabsContent value="collective" className="mt-0 space-y-10 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-4 gap-10">
            <Card className="col-span-1 border-2 border-[#E2741B]/10 bg-white rounded-none p-10 flex flex-col items-center text-center space-y-6">
              <Users className="w-16 h-16 text-[#E2741B] mb-4" />
              <h3 className="text-2xl font-black uppercase tracking-widest">10,242</h3>
              <p className="text-[11px] uppercase font-bold opacity-40 tracking-widest">Active Strategists</p>
              <Separator />
              <p className="text-[12px] font-serif italic opacity-60">Verified institutional members sharing doctrines and frameworks globally.</p>
            </Card>

            <div className="col-span-3 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                {[
                  { icon: <FileText />, title: 'Shared Doctrines', count: '4,284', desc: 'Expert frameworks and manuscript templates.' },
                  { icon: <MessageSquare />, title: 'Logic Threads', count: '12,042', desc: 'Peer-reviewed strategy discussions.' },
                  { icon: <Share2 />, title: 'Asset Portfolios', count: '8,291', desc: 'Community-generated image and music stems.' },
                  { icon: <Layout />, title: 'Studio Templates', count: '1,542', desc: 'Custom workspace configurations.' }
                ].map((item, i) => (
                  <Card key={i} className="border-2 border-[#E2741B]/5 bg-white rounded-none p-8 hover:border-[#E2741B]/20 transition-all cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-[#FAF8F3] text-[#E2741B] group-hover:bg-[#1A1A1A] group-hover:text-white transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-[13px] font-black uppercase tracking-widest">{item.title}</h4>
                          <Badge variant="outline" className="text-[10px] opacity-50 border-none px-0 font-mono">{item.count}</Badge>
                        </div>
                        <p className="text-[11px] opacity-50 mt-1 font-serif italic">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="bg-[#FAF8F3] border-2 border-[#E2741B]/10 p-10 flex justify-between items-center rounded-none shadow-inner">
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-widest">Collaborative Intelligence</h4>
                  <p className="text-[12px] opacity-50 font-serif italic">Contribute your research to the project-wide collective memory.</p>
                </div>
                <Button className="bg-[#1A1A1A] text-white rounded-none px-12 h-14 text-[11px] font-black uppercase tracking-widest hover:bg-[#E2741B] transition-all">
                  Access Forum
                </Button>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- PILLAR 5: PRODUCTION ENGINE --- */}
        <TabsContent value="export" className="mt-0 space-y-10 animate-in fade-in-50 duration-500">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-4 space-y-8">
              <Card className="border-2 border-[#E2741B]/10 bg-white rounded-none overflow-hidden shadow-2xl">
                <CardHeader className="p-10 bg-[#1A1A1A] text-white">
                  <CardTitle className="text-xs uppercase tracking-[0.4em] font-black text-[#E2741B]">Elite Templates</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {['Institutional Doctrine', 'Cinematic Fiction', 'Technical Protocol', 'Premium Courseware'].map((t, i) => (
                    <div key={i} className="p-8 border-b border-[#E2741B]/5 hover:bg-[#FAF8F3] cursor-pointer flex items-center justify-between transition-all group last:border-0">
                      <span className="text-[12px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:text-[#E2741B]">{t}</span>
                      <CheckCircle2 className="w-4 h-4 text-[#E2741B] opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-8 space-y-10">
              <Card className="border-2 border-[#E2741B]/10 bg-white rounded-none p-12 shadow-xl">
                 <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Production Orchestration</h3>
                      <p className="text-[12px] opacity-50 font-serif italic">Format your assets for global distribution: KDP, Spotify, & YouTube.</p>
                    </div>
                    <Badge className="bg-[#E2741B]/10 text-[#E2741B] px-6 py-2 rounded-none border-2 border-[#E2741B]/20 font-black uppercase tracking-widest text-[9px]">
                      KDP PRINT-READY (6x9)
                    </Badge>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-8 mb-12">
                   {[
                     { label: 'EPUB Format', icon: <FileText />, status: 'Optimized' },
                     { icon: <Activity />, label: '300 DPI Images', status: 'Verified' },
                     { icon: <Lock />, label: 'Rights Management', status: 'Secured' }
                   ].map((item, i) => (
                     <div key={i} className="p-6 bg-[#FAF8F3] border-2 border-[#E2741B]/5 text-center space-y-4 shadow-sm hover:scale-105 transition-transform duration-500">
                       <div className="flex justify-center text-[#E2741B]">{item.icon}</div>
                       <div className="text-[10px] font-black uppercase tracking-widest">{item.label}</div>
                       <div className="text-[9px] text-green-600 font-bold uppercase tracking-widest">{item.status}</div>
                     </div>
                   ))}
                 </div>

                 <Button className="w-full bg-[#1A1A1A] hover:bg-[#E2741B] text-white h-24 text-[14px] font-black uppercase tracking-[0.5em] rounded-none shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all">
                   Trigger Institutional Export
                 </Button>
              </Card>

              <div className="flex gap-6 items-center p-8 bg-amber-50 border-2 border-[#E2741B]/20">
                <AlertTriangle className="w-10 h-10 text-[#E2741B]" />
                <p className="text-[12px] font-serif italic leading-relaxed opacity-60">
                  Exporting for **The Laundromat Doctrine**. The system has detected that 4 images are currently below 300 DPI. Please regenerate in the Image Studio before final orchestration.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Institutional Footer --- */}
      <footer className="pt-20 border-t-2 border-[#E2741B]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity duration-1000 group">
        <div className="flex items-center gap-12 grayscale group-hover:grayscale-0 transition-all duration-700">
          <Cloud className="w-14 h-14" />
          <Database className="w-14 h-14" />
          <ShieldCheck className="w-14 h-14" />
          <Network className="w-14 h-14" />
        </div>
        <div className="text-right space-y-2">
          <div className="text-[12px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]">Institutional Platform v4.0.8</div>
          <div className="text-[10px] uppercase tracking-[0.5em] font-bold text-[#E2741B]">
            © 2026 Stroke Recovery Academy • All Rights Reserved
          </div>
        </div>
      </footer>
    </div>
  );
}