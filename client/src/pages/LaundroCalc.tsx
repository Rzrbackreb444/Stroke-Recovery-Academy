import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  DollarSign,
  Wrench,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Minus,
  Plus,
  Home,
  ShoppingBag,
  MapPin,
  Zap,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";

const GOLD = "#C9941A";
const DARK = "#0D0D0D";
const CARD_BG = "#141414";
const BORDER = "#2a2a2a";

type RealEstate = "own" | "buy" | "lease";
type ProjectType = "new" | "existing";
type LocationType = "strip-mall" | "standalone" | "back-building" | "downtown" | "mixed-use";

interface WasherQty { id: string; qty: number }
interface DryerQty { id: string; qty: number }

const WASHERS = [
  { id: "w20", label: "20 lb Front-Load", sublabel: "Best for singles & couples", installedCost: 2200, vendPrice: 3.25, turnsPerDay: 7, utilityPerMonth: 42 },
  { id: "w30", label: "30 lb Front-Load", sublabel: "Most popular all-purpose", installedCost: 2900, vendPrice: 4.75, turnsPerDay: 6, utilityPerMonth: 62 },
  { id: "w40", label: "40 lb Front-Load", sublabel: "Large family loads", installedCost: 3900, vendPrice: 6.25, turnsPerDay: 6, utilityPerMonth: 80 },
  { id: "w60", label: "60 lb Front-Load", sublabel: "Comforters & bulk", installedCost: 6200, vendPrice: 8.50, turnsPerDay: 5, utilityPerMonth: 112 },
  { id: "w80", label: "80 lb Front-Load", sublabel: "Commercial overflow", installedCost: 8800, vendPrice: 11.00, turnsPerDay: 5, utilityPerMonth: 145 },
];

const DRYERS = [
  { id: "d30", label: "30 lb Dryer", sublabel: "Standard stacked unit", installedCost: 1800, vendPrice: 1.50, turnsPerDay: 7, utilityPerMonth: 55 },
  { id: "d45", label: "45 lb Dryer", sublabel: "Mid-size high-efficiency", installedCost: 2600, vendPrice: 2.00, turnsPerDay: 6, utilityPerMonth: 78 },
  { id: "d75", label: "75 lb Dryer", sublabel: "Heavy-duty commercial", installedCost: 4400, vendPrice: 2.75, turnsPerDay: 5, utilityPerMonth: 115 },
];

const BUILDOUT_COST: Record<ProjectType, number> = { new: 110, existing: 38 };

const LOCATION_MULTIPLIERS: Record<LocationType, number> = {
  "strip-mall": 1.0,
  "standalone": 1.05,
  "back-building": 0.85,
  "downtown": 1.15,
  "mixed-use": 1.0,
};

const FAQ = [
  {
    q: "How much does it cost to open a laundromat from scratch?",
    a: "Opening a new laundromat typically costs $200,000–$500,000+, depending on square footage, equipment mix, location, and whether you own or lease the space. A 2,000 sq ft location with 20 washers and 20 dryers often runs $250,000–$350,000 all-in.",
  },
  {
    q: "Is owning a laundromat a good investment?",
    a: "Yes — laundromats are among the most recession-resistant small businesses, with failure rates under 5%. A well-run location can generate 20–35% cash-on-cash return annually, with break-even typically in 3–6 years.",
  },
  {
    q: "Should I buy or lease a building for a laundromat?",
    a: "Leasing lowers your startup cost significantly and lets you test the market. Buying builds equity and removes rent risk — critical for a 20+ year operation. For most first-time owners, leasing with a 10-year option is the recommended path.",
  },
  {
    q: "How many machines do I need for a 2,000 sq ft laundromat?",
    a: "A rough rule: 1 washer per 100 sq ft of usable floor space. A 2,000 sq ft space can fit roughly 18–22 washers and 16–20 dryers, leaving room for folding tables, seating, and utilities.",
  },
  {
    q: "How long does it take to break even on a laundromat investment?",
    a: "Average break-even is 3–5 years for a well-located, properly priced laundromat. High-traffic urban locations can achieve break-even in 2–3 years. Rural or low-traffic areas may take 5–7 years.",
  },
  {
    q: "What is a good ROI for a laundromat?",
    a: "Industry benchmarks: 20–35% cash-on-cash return is considered good. Anything above 25% annually with a sub-4-year break-even is an excellent deal. The national average is around 20–25%.",
  },
  {
    q: "How do laundromats make money?",
    a: "Revenue comes primarily from coin/card-operated washers and dryers. Additional income streams include vending machines, wash-dry-fold drop-off service, commercial laundry accounts, and ATM fees. Wash-dry-fold alone can add 30–40% to a laundromat's gross revenue.",
  },
  {
    q: "What are the biggest ongoing expenses for a laundromat?",
    a: "Utilities (water, sewer, gas/electric) are the largest cost — typically 25–35% of revenue. Rent is usually 15–25%. Maintenance, labor, insurance, and supplies make up the rest.",
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function StepDot({ active, completed, n }: { active: boolean; completed: boolean; n: number }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
      style={{
        background: completed ? GOLD : active ? GOLD : "#222",
        color: completed || active ? DARK : "#666",
        border: `2px solid ${completed || active ? GOLD : "#333"}`,
      }}
    >
      {completed ? <CheckCircle size={14} /> : n}
    </div>
  );
}

function QtyControl({
  label, sublabel, cost, qty, onChange,
}: { label: string; sublabel: string; cost: number; qty: number; onChange: (n: number) => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg p-4"
      style={{ background: "#1a1a1a", border: `1px solid ${qty > 0 ? GOLD + "55" : BORDER}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#888" }}>{sublabel}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: GOLD }}>{formatCurrency(cost)} installed</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onChange(Math.max(0, qty - 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#2a2a2a", color: "#aaa" }}
          data-testid={`btn-minus-${label}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-bold text-white text-base">{qty}</span>
        <button
          onClick={() => onChange(qty + 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: qty > 0 ? GOLD : "#2a2a2a", color: qty > 0 ? DARK : "#aaa" }}
          data-testid={`btn-plus-${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{ background: highlight ? GOLD + "18" : "#1a1a1a", border: `1px solid ${highlight ? GOLD + "55" : BORDER}` }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: highlight ? GOLD : "#888" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: highlight ? GOLD : "white" }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: "#666" }}>{sub}</p>}
    </div>
  );
}

export default function LaundroCalc() {
  const [step, setStep] = useState(0);

  // Step 0 — project type
  const [projectType, setProjectType] = useState<ProjectType>("new");

  // Step 1 — real estate
  const [realEstate, setRealEstate] = useState<RealEstate>("lease");
  const [monthlyRent, setMonthlyRent] = useState(3500);
  const [purchasePrice, setPurchasePrice] = useState(350000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [existingAcqCost, setExistingAcqCost] = useState(150000);

  // Step 2 — location
  const [sqft, setSqft] = useState(2000);
  const [locationType, setLocationType] = useState<LocationType>("strip-mall");

  // Step 3 — equipment
  const [washers, setWashers] = useState<WasherQty[]>(WASHERS.map(w => ({ id: w.id, qty: 0 })));
  const [dryers, setDryers] = useState<DryerQty[]>(DRYERS.map(d => ({ id: d.id, qty: 0 })));

  // Step 4 — financials
  const [utilization, setUtilization] = useState(45);
  const [staffCost, setStaffCost] = useState(2000);
  const [insurance, setInsurance] = useState(600);
  const [additionalRevenue, setAdditionalRevenue] = useState(500);

  const setWasherQty = (id: string, qty: number) =>
    setWashers(prev => prev.map(w => w.id === id ? { ...w, qty } : w));
  const setDryerQty = (id: string, qty: number) =>
    setDryers(prev => prev.map(d => d.id === id ? { ...d, qty } : d));

  const results = useMemo(() => {
    const locMult = LOCATION_MULTIPLIERS[locationType];

    // Equipment costs
    const equipCost = washers.reduce((s, w) => {
      const m = WASHERS.find(x => x.id === w.id)!;
      return s + m.installedCost * w.qty;
    }, 0) + dryers.reduce((s, d) => {
      const m = DRYERS.find(x => x.id === d.id)!;
      return s + m.installedCost * d.qty;
    }, 0);

    // Buildout / renovation
    const buildoutCost = sqft * BUILDOUT_COST[projectType] * locMult;

    // Real estate upfront
    let reUpfront = 0;
    let reMonthly = 0;
    if (realEstate === "lease") {
      reUpfront = monthlyRent * 3; // first + last + security
      reMonthly = monthlyRent;
    } else if (realEstate === "buy") {
      const down = purchasePrice * (downPaymentPct / 100);
      const loanAmt = purchasePrice - down;
      const monthlyRate = 0.07 / 12;
      const n = 25 * 12;
      const mortgage = loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      reUpfront = down;
      reMonthly = mortgage + purchasePrice * 0.012 / 12; // + property tax estimate
    } else {
      reUpfront = 0;
      reMonthly = 0;
    }

    // Acquisition cost (existing laundromat)
    const acqCost = projectType === "existing" ? existingAcqCost : 0;

    // Misc startup (permits, signage, POS, working capital)
    const miscStartup = equipCost * 0.08 + 5000;
    const workingCapital = 3 * (reMonthly + staffCost + insurance + 1000);

    const totalStartup = equipCost + buildoutCost + reUpfront + acqCost + miscStartup + workingCapital;

    // Monthly revenue
    const washerRev = washers.reduce((s, w) => {
      const m = WASHERS.find(x => x.id === w.id)!;
      return s + m.vendPrice * m.turnsPerDay * 30 * (utilization / 100) * w.qty;
    }, 0);
    const dryerRev = dryers.reduce((s, d) => {
      const m = DRYERS.find(x => x.id === d.id)!;
      return s + m.vendPrice * m.turnsPerDay * 30 * (utilization / 100) * d.qty;
    }, 0);
    const totalRevenue = washerRev + dryerRev + additionalRevenue;

    // Monthly expenses
    const utilities = washers.reduce((s, w) => {
      const m = WASHERS.find(x => x.id === w.id)!;
      return s + m.utilityPerMonth * w.qty;
    }, 0) + dryers.reduce((s, d) => {
      const m = DRYERS.find(x => x.id === d.id)!;
      return s + m.utilityPerMonth * d.qty;
    }, 0);
    const maintenance = totalRevenue * 0.05;
    const supplies = 200;
    const totalExpenses = reMonthly + utilities + staffCost + insurance + maintenance + supplies;

    const netProfit = totalRevenue - totalExpenses;
    const breakEvenMonths = netProfit > 0 ? Math.ceil(totalStartup / netProfit) : 0;
    const breakEvenYears = breakEvenMonths / 12;
    const fiveYearReturn = netProfit > 0 ? netProfit * 60 - totalStartup : 0;
    const roi = totalStartup > 0 && netProfit > 0 ? (netProfit * 12 / totalStartup) * 100 : 0;

    const totalMachines = washers.reduce((s, w) => s + w.qty, 0) + dryers.reduce((s, d) => s + d.qty, 0);

    return {
      equipCost, buildoutCost, reUpfront, acqCost, miscStartup, workingCapital,
      totalStartup, washerRev, dryerRev, totalRevenue, utilities, maintenance,
      totalExpenses, netProfit, breakEvenMonths, breakEvenYears, fiveYearReturn,
      roi, reMonthly, totalMachines,
    };
  }, [projectType, realEstate, monthlyRent, purchasePrice, downPaymentPct, existingAcqCost,
    sqft, locationType, washers, dryers, utilization, staffCost, insurance, additionalRevenue]);

  const hasEquipment = results.totalMachines > 0;
  const STEPS = ["Project Type", "Real Estate", "Location", "Equipment", "Financials", "Results"];

  const schemaOrg = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "Laundromat Investment Calculator",
        "description": "Free laundromat startup cost and ROI calculator. Enter your location, equipment, and financing to get a complete financial projection.",
        "url": "https://strokerecoveryacademy.com/washbiz/calculator",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "publisher": { "@type": "Organization", "name": "WashBizHub", "url": "https://strokerecoveryacademy.com/washbiz/calculator" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": FAQ.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
      {
        "@type": "HowTo",
        "name": "How to Calculate Your Laundromat Investment",
        "description": "Use this step-by-step calculator to estimate startup costs, monthly profit, and ROI for a new or existing laundromat.",
        "step": [
          { "@type": "HowToStep", "name": "Choose Project Type", "text": "Select whether you are building a new laundromat from scratch or acquiring an existing one." },
          { "@type": "HowToStep", "name": "Set Up Real Estate", "text": "Decide if you will lease a space, buy a building, or already own the property." },
          { "@type": "HowToStep", "name": "Enter Location Details", "text": "Input the square footage and location type to estimate buildout costs." },
          { "@type": "HowToStep", "name": "Build Your Equipment Mix", "text": "Select the number and size of washers and dryers for your layout." },
          { "@type": "HowToStep", "name": "Set Financial Inputs", "text": "Enter your expected utilization rate, staffing costs, and insurance." },
          { "@type": "HowToStep", "name": "Review Your Results", "text": "See total startup cost, monthly profit, break-even timeline, and 5-year ROI." },
        ],
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "WashBizHub", "item": "https://strokerecoveryacademy.com" },
          { "@type": "ListItem", "position": 2, "name": "Laundromat Calculator", "item": "https://strokerecoveryacademy.com/washbiz/calculator" },
        ],
      },
    ],
  };

  return (
    <div style={{ background: DARK, minHeight: "100vh", color: "white" }}>
      <Helmet>
        <title>Laundromat Investment Calculator — Startup Cost & ROI | WashBizHub</title>
        <meta name="description" content="Free laundromat startup cost calculator. Enter your location, equipment mix, and financing type to get a full financial projection: total investment, monthly profit, break-even date, and 5-year ROI." />
        <meta name="keywords" content="laundromat investment calculator, laundromat startup cost, how much to open a laundromat, laundromat ROI calculator, laundromat equipment cost, coin laundry business plan" />
        <link rel="canonical" href="https://strokerecoveryacademy.com/washbiz/calculator" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Laundromat Investment Calculator — Is Your Location Worth It?" />
        <meta property="og:description" content="Get a complete financial projection for your laundromat business in 5 minutes. Free tool by WashBizHub." />
        <meta property="og:url" content="https://strokerecoveryacademy.com/washbiz/calculator" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Laundromat Investment Calculator | WashBizHub" />
        <meta name="twitter:description" content="Free tool: calculate startup costs, monthly profit, and break-even for a laundromat business." />
        <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
      </Helmet>

      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-10" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6" style={{ background: GOLD + "20", color: GOLD, border: `1px solid ${GOLD}40` }}>
          <BadgeCheck size={13} /> WashBizHub — Free Tool
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ lineHeight: 1.15 }}>
          Laundromat Investment<br />
          <span style={{ color: GOLD }}>Calculator</span>
        </h1>
        <p className="text-base max-w-xl mx-auto" style={{ color: "#aaa" }}>
          Is your location worth it? Enter your space, equipment, and financing — get a full financial projection in 5 minutes. No spreadsheet needed.
        </p>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <StepDot active={i === step} completed={i < step} n={i + 1} />
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px hidden sm:block" style={{ background: i < step ? GOLD : BORDER }} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "#555" }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {/* Calculator body */}
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Step 0: Project Type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">What kind of project is this?</h2>
            {[
              { type: "new" as ProjectType, icon: Building2, label: "New Build / Vacant Space", desc: "You have an empty space and are building a laundromat from scratch." },
              { type: "existing" as ProjectType, icon: ShoppingBag, label: "Acquiring an Existing Laundromat", desc: "Buying an already-operating laundromat, with or without equipment." },
            ].map(opt => (
              <button
                key={opt.type}
                onClick={() => setProjectType(opt.type)}
                className="w-full text-left rounded-xl p-5 transition-all"
                style={{ background: projectType === opt.type ? GOLD + "18" : CARD_BG, border: `2px solid ${projectType === opt.type ? GOLD : BORDER}` }}
                data-testid={`btn-project-${opt.type}`}
              >
                <div className="flex items-start gap-4">
                  <opt.icon size={22} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="font-semibold text-white">{opt.label}</p>
                    <p className="text-sm mt-1" style={{ color: "#888" }}>{opt.desc}</p>
                  </div>
                  {projectType === opt.type && <CheckCircle size={18} style={{ color: GOLD, marginLeft: "auto", flexShrink: 0 }} />}
                </div>
              </button>
            ))}

            {projectType === "existing" && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm" style={{ color: "#aaa" }}>Acquisition / purchase price of the existing business</Label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                  <Input
                    type="number"
                    value={existingAcqCost}
                    onChange={e => setExistingAcqCost(Number(e.target.value))}
                    className="pl-9 border-0 text-white"
                    style={{ background: "#1a1a1a" }}
                    data-testid="input-acq-cost"
                  />
                </div>
                <p className="text-xs" style={{ color: "#666" }}>Typical range: $50K–$400K depending on age, volume, and location.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Real Estate */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">What is your real estate situation?</h2>
            {[
              { type: "lease" as RealEstate, icon: MapPin, label: "Leasing the Space", desc: "Paying monthly rent. Lowest upfront cost." },
              { type: "buy" as RealEstate, icon: Building2, label: "Buying a Building", desc: "Purchasing the real estate. Builds equity long-term." },
              { type: "own" as RealEstate, icon: Home, label: "Already Own the Building", desc: "No real estate purchase needed. Best ROI scenario." },
            ].map(opt => (
              <button
                key={opt.type}
                onClick={() => setRealEstate(opt.type)}
                className="w-full text-left rounded-xl p-5 transition-all"
                style={{ background: realEstate === opt.type ? GOLD + "18" : CARD_BG, border: `2px solid ${realEstate === opt.type ? GOLD : BORDER}` }}
                data-testid={`btn-re-${opt.type}`}
              >
                <div className="flex items-start gap-4">
                  <opt.icon size={22} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="font-semibold text-white">{opt.label}</p>
                    <p className="text-sm mt-1" style={{ color: "#888" }}>{opt.desc}</p>
                  </div>
                  {realEstate === opt.type && <CheckCircle size={18} style={{ color: GOLD, marginLeft: "auto", flexShrink: 0 }} />}
                </div>
              </button>
            ))}

            {realEstate === "lease" && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm" style={{ color: "#aaa" }}>Monthly rent (NNN)</Label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                  <Input type="number" value={monthlyRent} onChange={e => setMonthlyRent(Number(e.target.value))} className="pl-9 border-0 text-white" style={{ background: "#1a1a1a" }} data-testid="input-monthly-rent" />
                </div>
                <p className="text-xs" style={{ color: "#666" }}>Include NNN (taxes, insurance, maintenance) if applicable. Typical: $2,000–$8,000/mo.</p>
              </div>
            )}

            {realEstate === "buy" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: "#aaa" }}>Building purchase price</Label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                    <Input type="number" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="pl-9 border-0 text-white" style={{ background: "#1a1a1a" }} data-testid="input-purchase-price" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: "#aaa" }}>Down payment: {downPaymentPct}%</Label>
                  <Slider value={[downPaymentPct]} onValueChange={([v]) => setDownPaymentPct(v)} min={10} max={40} step={5} className="w-full" />
                  <div className="flex justify-between text-xs" style={{ color: "#555" }}>
                    <span>10%</span><span>Down: {formatCurrency(purchasePrice * downPaymentPct / 100)}</span><span>40%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6">Tell us about the location</h2>
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#aaa" }}>Usable square footage</Label>
              <div className="relative">
                <Input type="number" value={sqft} onChange={e => setSqft(Number(e.target.value))} className="border-0 text-white pr-16" style={{ background: "#1a1a1a" }} data-testid="input-sqft" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#666" }}>sq ft</span>
              </div>
              <p className="text-xs" style={{ color: "#666" }}>
                Typical laundromats: 1,000–4,000 sq ft. Your space fits roughly {Math.floor(sqft / 100)} washers.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm" style={{ color: "#aaa" }}>Location type</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { type: "strip-mall" as LocationType, label: "Strip Mall / Shopping Center", mult: "Standard buildout" },
                  { type: "standalone" as LocationType, label: "Standalone Building", mult: "+5% buildout" },
                  { type: "back-building" as LocationType, label: "Back of Building / Secondary Space", mult: "-15% buildout" },
                  { type: "downtown" as LocationType, label: "Downtown / High-Foot-Traffic", mult: "+15% buildout" },
                  { type: "mixed-use" as LocationType, label: "Mixed-Use / Commercial Building", mult: "Standard buildout" },
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setLocationType(opt.type)}
                    className="w-full text-left rounded-lg px-4 py-3 flex items-center justify-between transition-all"
                    style={{ background: locationType === opt.type ? GOLD + "18" : "#1a1a1a", border: `1px solid ${locationType === opt.type ? GOLD : BORDER}` }}
                    data-testid={`btn-loc-${opt.type}`}
                  >
                    <span className="text-sm font-medium text-white">{opt.label}</span>
                    <span className="text-xs ml-3" style={{ color: GOLD }}>{opt.mult}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-4 flex gap-3" style={{ background: GOLD + "10", border: `1px solid ${GOLD}30` }}>
              <AlertCircle size={16} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: "#ccc" }}>
                Buildout estimate for {sqft.toLocaleString()} sq ft {projectType === "new" ? "new build" : "renovation"}: <strong style={{ color: GOLD }}>{formatCurrency(sqft * BUILDOUT_COST[projectType] * LOCATION_MULTIPLIERS[locationType])}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Build your equipment mix</h2>
            <p className="text-sm -mt-2" style={{ color: "#888" }}>
              Prices include delivery, installation, and hookups. Tip: aim for a 1:1 washer-to-dryer ratio.
            </p>

            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: GOLD }}>Washers</p>
              <div className="space-y-3">
                {WASHERS.map(w => {
                  const qty = washers.find(x => x.id === w.id)!.qty;
                  return <QtyControl key={w.id} label={w.label} sublabel={w.sublabel} cost={w.installedCost} qty={qty} onChange={n => setWasherQty(w.id, n)} />;
                })}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: GOLD }}>Dryers</p>
              <div className="space-y-3">
                {DRYERS.map(d => {
                  const qty = dryers.find(x => x.id === d.id)!.qty;
                  return <QtyControl key={d.id} label={d.label} sublabel={d.sublabel} cost={d.installedCost} qty={qty} onChange={n => setDryerQty(d.id, n)} />;
                })}
              </div>
            </div>

            {hasEquipment && (
              <div className="rounded-lg p-4" style={{ background: "#1a1a1a", border: `1px solid ${BORDER}` }}>
                <p className="text-sm font-semibold text-white">Equipment subtotal</p>
                <p className="text-2xl font-bold mt-1" style={{ color: GOLD }}>{formatCurrency(results.equipCost)}</p>
                <p className="text-xs mt-1" style={{ color: "#666" }}>
                  {washers.reduce((s, w) => s + w.qty, 0)} washers + {dryers.reduce((s, d) => s + d.qty, 0)} dryers
                </p>
              </div>
            )}

            {!hasEquipment && (
              <div className="rounded-lg p-4 text-center" style={{ border: `1px dashed ${BORDER}` }}>
                <p className="text-sm" style={{ color: "#555" }}>Add at least one machine to continue</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Financials */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-2">Financial assumptions</h2>

            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: "#aaa" }}>
                Expected utilization rate: <span style={{ color: GOLD }}>{utilization}%</span>
              </Label>
              <Slider value={[utilization]} onValueChange={([v]) => setUtilization(v)} min={20} max={80} step={5} />
              <div className="flex justify-between text-xs" style={{ color: "#555" }}>
                <span>20% — Slow market</span>
                <span>50% — Average</span>
                <span>80% — Busy urban</span>
              </div>
              <p className="text-xs" style={{ color: "#666" }}>This is the % of daily capacity actually used across all machines. New locations average 35–50%.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#aaa" }}>Monthly staff / labor cost</Label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                <Input type="number" value={staffCost} onChange={e => setStaffCost(Number(e.target.value))} className="pl-9 border-0 text-white" style={{ background: "#1a1a1a" }} data-testid="input-staff-cost" />
              </div>
              <p className="text-xs" style={{ color: "#666" }}>Unattended: $0. Part-time attendant: $1,500–$2,500. Full-time: $3,000+.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#aaa" }}>Monthly insurance</Label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                <Input type="number" value={insurance} onChange={e => setInsurance(Number(e.target.value))} className="pl-9 border-0 text-white" style={{ background: "#1a1a1a" }} data-testid="input-insurance" />
              </div>
              <p className="text-xs" style={{ color: "#666" }}>Typical: $400–$900/mo depending on size and coverage.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" style={{ color: "#aaa" }}>Additional monthly revenue (vending, drop-off, ATM, etc.)</Label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
                <Input type="number" value={additionalRevenue} onChange={e => setAdditionalRevenue(Number(e.target.value))} className="pl-9 border-0 text-white" style={{ background: "#1a1a1a" }} data-testid="input-add-revenue" />
              </div>
              <p className="text-xs" style={{ color: "#666" }}>Wash-dry-fold alone can add $1,500–$5,000/mo in high-demand areas.</p>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: GOLD }}>Your Financial Projection</p>
              <h2 className="text-2xl font-bold">
                {results.netProfit > 0
                  ? results.roi > 20
                    ? "Strong Investment Potential"
                    : "Viable with Optimization"
                  : "Needs Adjustment"}
              </h2>
            </div>

            {/* Verdict banner */}
            <div
              className="rounded-xl p-5"
              style={{ background: results.netProfit > 0 ? "#0a2a0a" : "#2a0a0a", border: `1px solid ${results.netProfit > 0 ? "#1a5c1a" : "#5c1a1a"}` }}
            >
              <div className="flex items-center gap-3 mb-2">
                {results.netProfit > 0
                  ? <TrendingUp size={20} style={{ color: "#4ade80" }} />
                  : <AlertCircle size={20} style={{ color: "#f87171" }} />}
                <span className="font-bold text-white">
                  {results.netProfit > 0
                    ? `${formatCurrency(results.netProfit)}/mo net profit at ${utilization}% utilization`
                    : "Expenses exceed revenue at current settings"}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#aaa" }}>
                {results.netProfit > 0
                  ? `Break-even in ~${results.breakEvenMonths} months (${results.breakEvenYears.toFixed(1)} years). 5-year net return: ${formatCurrency(results.fiveYearReturn)}.`
                  : "Try increasing utilization, reducing staff costs, or adjusting your equipment mix."}
              </p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Total Startup Cost" value={formatCurrency(results.totalStartup)} sub="Equipment + buildout + working capital" highlight />
              <StatBox label="Monthly Net Profit" value={formatCurrency(results.netProfit)} sub={`At ${utilization}% utilization`} highlight={results.netProfit > 0} />
              <StatBox label="Break-Even" value={results.netProfit > 0 ? `${results.breakEvenYears.toFixed(1)} yrs` : "N/A"} sub={results.netProfit > 0 ? `${results.breakEvenMonths} months` : "Adjust inputs"} />
              <StatBox label="Annual Cash-on-Cash ROI" value={results.netProfit > 0 ? `${results.roi.toFixed(1)}%` : "N/A"} sub="Net profit / total invested" />
              <StatBox label="5-Year Net Return" value={results.netProfit > 0 ? formatCurrency(results.fiveYearReturn) : "N/A"} sub="After recovering investment" />
              <StatBox label="Monthly Revenue" value={formatCurrency(results.totalRevenue)} sub={`Washers + dryers + add-ons`} />
            </div>

            {/* Cost breakdown */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <p className="font-bold text-sm uppercase tracking-wider" style={{ color: GOLD }}>Startup Cost Breakdown</p>
              {[
                { label: "Equipment (installed)", value: results.equipCost },
                { label: "Buildout / Renovation", value: results.buildoutCost },
                ...(results.acqCost > 0 ? [{ label: "Business Acquisition", value: results.acqCost }] : []),
                { label: "Real Estate Upfront", value: results.reUpfront },
                { label: "Permits, Signage & POS", value: results.miscStartup },
                { label: "Working Capital Reserve (3mo)", value: results.workingCapital },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#aaa" }}>{row.label}</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="font-bold text-white">Total</span>
                <span className="font-bold text-lg" style={{ color: GOLD }}>{formatCurrency(results.totalStartup)}</span>
              </div>
            </div>

            {/* Monthly P&L */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <p className="font-bold text-sm uppercase tracking-wider" style={{ color: GOLD }}>Monthly P&L</p>
              {[
                { label: "Washer Revenue", value: results.washerRev, positive: true },
                { label: "Dryer Revenue", value: results.dryerRev, positive: true },
                { label: "Additional Revenue", value: additionalRevenue, positive: true },
                { label: "Rent / Mortgage", value: -results.reMonthly, positive: false },
                { label: "Utilities (water + electric/gas)", value: -results.utilities, positive: false },
                { label: "Staff / Labor", value: -staffCost, positive: false },
                { label: "Insurance", value: -insurance, positive: false },
                { label: "Maintenance Reserve (5%)", value: -results.maintenance, positive: false },
                { label: "Supplies", value: -200, positive: false },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#aaa" }}>{row.label}</span>
                  <span className="text-sm font-semibold" style={{ color: row.positive ? "#4ade80" : "#f87171" }}>
                    {row.positive ? "+" : ""}{formatCurrency(row.value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="font-bold text-white">Net Profit / Month</span>
                <span className="font-bold text-lg" style={{ color: results.netProfit >= 0 ? "#4ade80" : "#f87171" }}>
                  {formatCurrency(results.netProfit)}
                </span>
              </div>
            </div>

            <div className="rounded-xl p-5 text-center" style={{ background: GOLD + "10", border: `1px solid ${GOLD}30` }}>
              <p className="text-sm font-semibold" style={{ color: GOLD }}>Want expert guidance on your specific location?</p>
              <p className="text-sm mt-1" style={{ color: "#aaa" }}>Join 75,000+ laundromat owners in the WashBizHub community.</p>
            </div>

            <Button
              onClick={() => setStep(0)}
              variant="outline"
              className="w-full border-0"
              style={{ background: "#1a1a1a", color: "#aaa" }}
            >
              Start Over with New Numbers
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                onClick={() => setStep(s => s - 1)}
                variant="outline"
                className="flex-1 border-0"
                style={{ background: "#1a1a1a", color: "#aaa" }}
                data-testid="btn-prev"
              >
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
            )}
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 font-semibold"
              style={{ background: GOLD, color: DARK }}
              disabled={step === 3 && !hasEquipment}
              data-testid="btn-next"
            >
              {step === 4 ? "See My Results" : "Continue"} <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* SEO / AEO FAQ Section */}
      <div style={{ borderTop: `1px solid ${BORDER}` }} className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Zap size={20} style={{ color: GOLD }} />
          <h2 className="text-xl font-bold">Laundromat Investment — Common Questions</h2>
        </div>
        <div className="space-y-6">
          {FAQ.map((f, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-semibold text-white text-base">{f.q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#999" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer trust strip */}
      <div className="text-center py-8 px-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: "#444" }}>
          WashBizHub Laundromat Calculator • Equipment prices are 2025 industry estimates. Always get multiple quotes. This tool does not constitute financial advice.
        </p>
      </div>
    </div>
  );
}
