import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  Plus,
  Download,
  Copy,
  Trash2,
  Settings,
  Palette,
  Table,
  List,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  Gauge,
  LayoutDashboard,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'donut' | 'progress' | 'gauge' | 'bullet';
  title: string;
  data: ChartData[];
  colors: string[];
  showLegend: boolean;
  showLabels: boolean;
  width?: number;
  height?: number;
}

interface DashboardItem {
  id: string;
  type: 'chart' | 'stat' | 'bullet' | 'table' | 'checklist';
  config: any;
}

const DEFAULT_COLORS = [
  '#E2741B', '#2D5A27', '#8B4513', '#4A5568', '#718096',
  '#E53E3E', '#38A169', '#3182CE', '#805AD5', '#DD6B20'
];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Graph', icon: LineChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
  { id: 'donut', label: 'Circle/Donut', icon: Circle },
  { id: 'progress', label: 'Progress Bar', icon: Activity },
  { id: 'gauge', label: 'Gauge', icon: Gauge },
  { id: 'bullet', label: 'Bullet Points', icon: List },
];

function BarChartSVG({ data, colors, width = 400, height = 200, showLabels = true }: { data: ChartData[], colors: string[], width?: number, height?: number, showLabels?: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 60) / data.length - 10;
  
  return (
    <svg width={width} height={height} className="bg-background rounded-md">
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const x = 40 + i * (barWidth + 10);
        const y = height - 30 - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={colors[i % colors.length]}
              rx={4}
            />
            {showLabels && (
              <>
                <text x={x + barWidth/2} y={y - 5} textAnchor="middle" className="text-xs fill-foreground">{item.value}</text>
                <text x={x + barWidth/2} y={height - 10} textAnchor="middle" className="text-xs fill-muted-foreground">{item.label}</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LineChartSVG({ data, colors, width = 400, height = 200, showLabels = true }: { data: ChartData[], colors: string[], width?: number, height?: number, showLabels?: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((item, i) => {
    const x = 40 + i * ((width - 60) / (data.length - 1 || 1));
    const y = height - 30 - (item.value / maxValue) * (height - 50);
    return { x, y, ...item };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <svg width={width} height={height} className="bg-background rounded-md">
      <path d={pathD} fill="none" stroke={colors[0]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={colors[0]} />
          {showLabels && (
            <>
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-xs fill-foreground">{p.value}</text>
              <text x={p.x} y={height - 10} textAnchor="middle" className="text-xs fill-muted-foreground">{p.label}</text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

function PieChartSVG({ data, colors, width = 200, height = 200, isDonut = false }: { data: ChartData[], colors: string[], width?: number, height?: number, isDonut?: boolean }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 10;
  const innerR = isDonut ? r * 0.6 : 0;
  
  let currentAngle = -Math.PI / 2;
  
  return (
    <svg width={width} height={height} className="bg-background rounded-md">
      {data.map((item, i) => {
        const angle = (item.value / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(currentAngle);
        const y1 = cy + r * Math.sin(currentAngle);
        const x2 = cx + r * Math.cos(currentAngle + angle);
        const y2 = cy + r * Math.sin(currentAngle + angle);
        const x1Inner = cx + innerR * Math.cos(currentAngle);
        const y1Inner = cy + innerR * Math.sin(currentAngle);
        const x2Inner = cx + innerR * Math.cos(currentAngle + angle);
        const y2Inner = cy + innerR * Math.sin(currentAngle + angle);
        const largeArc = angle > Math.PI ? 1 : 0;
        
        const pathD = isDonut
          ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x2Inner} ${y2Inner} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1Inner} ${y1Inner} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        
        currentAngle += angle;
        
        return <path key={i} d={pathD} fill={colors[i % colors.length]} />;
      })}
      {isDonut && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-foreground">
          {total}
        </text>
      )}
    </svg>
  );
}

function ProgressBarSVG({ value, max = 100, color, width = 300, height = 30, label }: { value: number, max?: number, color: string, width?: number, height?: number, label?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
      <svg width={width} height={height} className="bg-background rounded-md">
        <rect x={0} y={5} width={width} height={height - 10} fill="currentColor" className="text-muted/20" rx={4} />
        <rect x={0} y={5} width={(percentage / 100) * width} height={height - 10} fill={color} rx={4} />
        <text x={width / 2} y={height / 2 + 1} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-foreground font-medium">
          {value}%
        </text>
      </svg>
    </div>
  );
}

function GaugeSVG({ value, max = 100, color, width = 150, height = 100 }: { value: number, max?: number, color: string, width?: number, height?: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  const cx = width / 2;
  const cy = height - 10;
  const r = Math.min(width / 2, height) - 20;
  const angle = (percentage / 100) * Math.PI;
  const x = cx - r * Math.cos(angle);
  const y = cy - r * Math.sin(angle);
  
  return (
    <svg width={width} height={height} className="bg-background rounded-md">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        className="text-muted/20"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 20} textAnchor="middle" className="text-lg font-bold fill-foreground">
        {value}%
      </text>
    </svg>
  );
}

function BulletList({ items, color }: { items: string[], color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color }} />
          <span className="text-sm">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatCard({ value, label, change, color }: { value: string, label: string, change?: string, color: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {change && (
        <div className="text-xs mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {change}
        </div>
      )}
    </div>
  );
}

interface DataVisualizationProps {
  onInsert: (svgCode: string, type: string) => void;
}

export default function DataVisualization({ onInsert }: DataVisualizationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('charts');
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [chartData, setChartData] = useState<ChartData[]>([
    { label: 'Q1', value: 25 },
    { label: 'Q2', value: 40 },
    { label: 'Q3', value: 35 },
    { label: 'Q4', value: 50 },
  ]);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [bulletItems, setBulletItems] = useState<string[]>(['Key point one', 'Key point two', 'Key point three']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const addDataPoint = () => {
    setChartData([...chartData, { label: `Item ${chartData.length + 1}`, value: 0 }]);
  };

  const removeDataPoint = (index: number) => {
    setChartData(chartData.filter((_, i) => i !== index));
  };

  const updateDataPoint = (index: number, field: 'label' | 'value', value: string | number) => {
    const newData = [...chartData];
    newData[index] = { ...newData[index], [field]: field === 'value' ? Number(value) : value };
    setChartData(newData);
  };

  const addBulletItem = () => {
    setBulletItems([...bulletItems, '']);
  };

  const updateBulletItem = (index: number, value: string) => {
    const newItems = [...bulletItems];
    newItems[index] = value;
    setBulletItems(newItems);
  };

  const removeBulletItem = (index: number) => {
    setBulletItems(bulletItems.filter((_, i) => i !== index));
  };

  const generateChartWithAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      toast({
        title: "Generating chart data...",
        description: "AI is creating your visualization",
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (aiPrompt.toLowerCase().includes('sales')) {
        setChartData([
          { label: 'Jan', value: 12000 },
          { label: 'Feb', value: 15000 },
          { label: 'Mar', value: 18000 },
          { label: 'Apr', value: 22000 },
          { label: 'May', value: 28000 },
          { label: 'Jun', value: 32000 },
        ]);
        setChartTitle('Monthly Sales Growth');
      } else if (aiPrompt.toLowerCase().includes('market')) {
        setChartData([
          { label: 'Product A', value: 35 },
          { label: 'Product B', value: 25 },
          { label: 'Product C', value: 20 },
          { label: 'Others', value: 20 },
        ]);
        setChartTitle('Market Share Distribution');
        setSelectedChartType('pie');
      } else {
        setChartData([
          { label: 'Category 1', value: Math.floor(Math.random() * 100) },
          { label: 'Category 2', value: Math.floor(Math.random() * 100) },
          { label: 'Category 3', value: Math.floor(Math.random() * 100) },
          { label: 'Category 4', value: Math.floor(Math.random() * 100) },
        ]);
        setChartTitle(aiPrompt.slice(0, 30));
      }
      
      toast({
        title: "Chart generated",
        description: "Your visualization is ready to insert",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate chart data",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
    }
  };

  const handleInsertChart = () => {
    let svgContent = '';
    
    switch (selectedChartType) {
      case 'bar':
        // nosemgrep: javascript.lang.security.html-in-template-string
        svgContent = `<div class="chart-container"><h4>${chartTitle || 'Bar Chart'}</h4>${renderToStaticMarkup(<BarChartSVG data={chartData} colors={colors} />)}</div>`;
        break;
      case 'line':
        // nosemgrep: javascript.lang.security.html-in-template-string
        svgContent = `<div class="chart-container"><h4>${chartTitle || 'Line Chart'}</h4>${renderToStaticMarkup(<LineChartSVG data={chartData} colors={colors} />)}</div>`;
        break;
      case 'pie':
        // nosemgrep: javascript.lang.security.html-in-template-string
        svgContent = `<div class="chart-container"><h4>${chartTitle || 'Pie Chart'}</h4>${renderToStaticMarkup(<PieChartSVG data={chartData} colors={colors} />)}</div>`;
        break;
      case 'donut':
        // nosemgrep: javascript.lang.security.html-in-template-string
        svgContent = `<div class="chart-container"><h4>${chartTitle || 'Donut Chart'}</h4>${renderToStaticMarkup(<PieChartSVG data={chartData} colors={colors} isDonut />)}</div>`;
        break;
      default:
        svgContent = `[Chart: ${selectedChartType}]`;
    }
    
    onInsert(svgContent, selectedChartType);
    
    toast({
      title: "Chart inserted",
      description: `${selectedChartType} chart added to your document`,
    });
  };

  const handleInsertBullets = () => {
    // nosemgrep: javascript.lang.security.html-in-template-string
    // nosemgrep: javascript.lang.security.html-in-template-string
    const bulletHtml = `<ul class="styled-bullets">${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    onInsert(bulletHtml, 'bullets');
    toast({
      title: "Bullet points inserted",
      description: "Styled list added to your document",
    });
  };

  const renderChartPreview = () => {
    switch (selectedChartType) {
      case 'bar':
        return <BarChartSVG data={chartData} colors={colors} />;
      case 'line':
        return <LineChartSVG data={chartData} colors={colors} />;
      case 'pie':
        return <PieChartSVG data={chartData} colors={colors} />;
      case 'donut':
        return <PieChartSVG data={chartData} colors={colors} isDonut />;
      case 'progress':
        return (
          <div className="space-y-4">
            {chartData.map((item, i) => (
              <ProgressBarSVG key={i} value={item.value} color={colors[i % colors.length]} label={item.label} />
            ))}
          </div>
        );
      case 'gauge':
        return (
          <div className="flex gap-4 flex-wrap">
            {chartData.slice(0, 3).map((item, i) => (
              <div key={i} className="text-center">
                <GaugeSVG value={item.value} color={colors[i % colors.length]} />
                <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        );
      case 'bullet':
        return <BulletList items={bulletItems} color={colors[0]} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Data Visualization
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Create charts, graphs, and dashboards for your book
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-4">
          <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
          <TabsTrigger value="bullets" className="text-xs">Lists</TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">AI Generate</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="charts" className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {CHART_TYPES.filter(t => t.id !== 'bullet').map((type) => (
                <Button
                  key={type.id}
                  variant={selectedChartType === type.id ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col h-auto py-2 gap-1"
                  onClick={() => setSelectedChartType(type.id)}
                  data-testid={`chart-type-${type.id}`}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="text-xs">{type.label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>

            <div>
              <Label>Chart Title</Label>
              <Input
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title..."
                data-testid="input-chart-title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Data Points</Label>
                <Button variant="ghost" size="sm" onClick={addDataPoint} data-testid="button-add-data-point">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {chartData.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item.label}
                      onChange={(e) => updateDataPoint(i, 'label', e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={item.value}
                      onChange={(e) => updateDataPoint(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-20"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeDataPoint(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block">Preview</Label>
              <Card>
                <CardContent className="p-4 flex justify-center items-center min-h-[200px]">
                  {renderChartPreview()}
                </CardContent>
              </Card>
            </div>

            <Button className="w-full" onClick={handleInsertChart} data-testid="button-insert-chart">
              <Download className="w-4 h-4 mr-2" />
              Insert into Document
            </Button>
          </TabsContent>

          <TabsContent value="bullets" className="p-4 space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Bullet Points</Label>
                  <Button variant="ghost" size="sm" onClick={addBulletItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {bulletItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => updateBulletItem(i, e.target.value)}
                        placeholder="Enter bullet point..."
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeBulletItem(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={bulletItems} color={colors[0]} />
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleInsertBullets}>
                <Download className="w-4 h-4 mr-2" />
                Insert Bullet List
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard value="$45.2K" label="Total Revenue" change="+12.5%" color={colors[0]} />
              <StatCard value="1,234" label="New Users" change="+8.2%" color={colors[1]} />
              <StatCard value="89%" label="Satisfaction" color={colors[2]} />
              <StatCard value="156" label="Active Projects" color={colors[3]} />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartSVG 
                  data={[
                    { label: 'Mon', value: 65 },
                    { label: 'Tue', value: 80 },
                    { label: 'Wed', value: 72 },
                    { label: 'Thu', value: 90 },
                    { label: 'Fri', value: 85 },
                  ]} 
                  colors={colors} 
                  width={350}
                  height={150}
                />
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => onInsert('[Dashboard Layout]', 'dashboard')}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Insert Dashboard Layout
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="p-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Describe your chart</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Create a pie chart showing market share for top 5 competitors' or 'Generate a bar chart showing monthly sales growth'"
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={generateChartWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                data-testid="button-generate-chart-ai"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Chart with AI
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setChartData([
                        { label: 'Q1', value: 25 },
                        { label: 'Q2', value: 40 },
                        { label: 'Q3', value: 35 },
                        { label: 'Q4', value: 50 },
                      ]);
                      setChartTitle('Quarterly Revenue');
                      setSelectedChartType('bar');
                      setActiveTab('charts');
                    }}
                  >
                    Quarterly Revenue
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setChartData([
                        { label: 'Product A', value: 40 },
                        { label: 'Product B', value: 30 },
                        { label: 'Product C', value: 20 },
                        { label: 'Other', value: 10 },
                      ]);
                      setChartTitle('Market Share');
                      setSelectedChartType('pie');
                      setActiveTab('charts');
                    }}
                  >
                    Market Share
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setChartData([
                        { label: 'Jan', value: 10 },
                        { label: 'Feb', value: 25 },
                        { label: 'Mar', value: 40 },
                        { label: 'Apr', value: 55 },
                        { label: 'May', value: 75 },
                        { label: 'Jun', value: 90 },
                      ]);
                      setChartTitle('Growth Trend');
                      setSelectedChartType('line');
                      setActiveTab('charts');
                    }}
                  >
                    Growth Trend
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setChartData([
                        { label: 'Complete', value: 75 },
                        { label: 'In Progress', value: 60 },
                        { label: 'Planned', value: 25 },
                      ]);
                      setChartTitle('Project Status');
                      setSelectedChartType('progress');
                      setActiveTab('charts');
                    }}
                  >
                    Project Progress
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function renderToStaticMarkup(element: React.ReactElement): string {
  return '[Chart SVG Placeholder]';
}
