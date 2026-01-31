import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  QrCode,
  Calendar,
  Globe,
  Smartphone,
  Clock,
  Flame,
  Trophy,
} from "lucide-react";

const GOLD = "#C9941A";
const FOREST_GREEN = "#1B4332";

interface AnalyticsData {
  totalScans: number;
  uniqueVisitors: number;
  avgScansPerDay: number;
  topProjects: { name: string; scans: number }[];
  scansByDay: { date: string; count: number }[];
  deviceBreakdown: { device: string; percentage: number }[];
}

export default function SquatchQRAnalytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/quote-studio/analytics"],
    // Fallback to mock data while endpoint is developed
  });

  const { data: streakData } = useQuery({
    queryKey: ["/api/quote-studio/streaks"],
  });

  // Mock data for demo
  const mockData: AnalyticsData = {
    totalScans: 12847,
    uniqueVisitors: 4521,
    avgScansPerDay: 428,
    topProjects: [
      { name: "Squatch Mix Daily Spark", scans: 4821 },
      { name: "WashBizHub Tips", scans: 3215 },
      { name: "Recovery Rituals", scans: 2890 },
      { name: "Entrepreneur Mindset", scans: 1921 },
    ],
    scansByDay: [
      { date: "Mon", count: 380 },
      { date: "Tue", count: 420 },
      { date: "Wed", count: 510 },
      { date: "Thu", count: 445 },
      { date: "Fri", count: 390 },
      { date: "Sat", count: 320 },
      { date: "Sun", count: 382 },
    ],
    deviceBreakdown: [
      { device: "iPhone", percentage: 52 },
      { device: "Android", percentage: 38 },
      { device: "Other", percentage: 10 },
    ],
  };

  const data = analytics || mockData;

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <Card className="bg-[#1a1a1a] border-white/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {subtitle && <p className="text-white/40 text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={QrCode}
          title="Total Scans"
          value={data.totalScans.toLocaleString()}
          subtitle="All time"
          color={GOLD}
        />
        <StatCard
          icon={Users}
          title="Unique Visitors"
          value={data.uniqueVisitors.toLocaleString()}
          subtitle="Distinct scanners"
          color={FOREST_GREEN}
        />
        <StatCard
          icon={TrendingUp}
          title="Daily Average"
          value={data.avgScansPerDay.toLocaleString()}
          subtitle="Scans per day"
          color="#8B5CF6"
        />
        <StatCard
          icon={Flame}
          title="Your Streak"
          value={(streakData as any)?.currentStreak || 0}
          subtitle={`Best: ${(streakData as any)?.longestStreak || 0} days`}
          color="#DC2626"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: GOLD }} />
              Weekly Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {data.scansByDay.map((day) => {
                const maxCount = Math.max(...data.scansByDay.map((d) => d.count));
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        backgroundColor: GOLD,
                        minHeight: "10px",
                      }}
                    />
                    <p className="text-white/60 text-xs mt-2">{day.date}</p>
                    <p className="text-white text-xs font-medium">{day.count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: GOLD }} />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProjects.map((project, i) => (
                <div key={project.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: i === 0 ? GOLD : `${GOLD}40`,
                      color: i === 0 ? "#0D0D0D" : GOLD,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{project.name}</p>
                    <div className="h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(project.scans / data.topProjects[0].scans) * 100}%`,
                          backgroundColor: FOREST_GREEN,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">{project.scans.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Smartphone className="w-4 h-4" style={{ color: GOLD }} />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.deviceBreakdown.map((device) => (
                <div key={device.device} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{device.device}</span>
                      <span className="text-white/60">{device.percentage}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${device.percentage}%`, backgroundColor: GOLD }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" style={{ color: GOLD }} />
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["8-9 AM", "12-1 PM", "7-8 PM"].map((time, i) => (
                <div key={time} className="flex items-center justify-between">
                  <span className="text-white text-sm">{time}</span>
                  <Badge variant="outline" className="text-white/60 border-white/20">
                    {["Peak", "High", "Moderate"][i]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Globe className="w-4 h-4" style={{ color: GOLD }} />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { country: "United States", pct: 68 },
                { country: "Canada", pct: 12 },
                { country: "United Kingdom", pct: 8 },
              ].map((loc) => (
                <div key={loc.country} className="flex items-center justify-between">
                  <span className="text-white text-sm">{loc.country}</span>
                  <span className="text-white/60 text-sm">{loc.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
