import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Users,
  QrCode,
  Globe,
  Smartphone,
  Clock,
  Flame,
  Trophy,
  ScanLine,
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
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/quote-studio/analytics"],
  });

  const { data: streakData } = useQuery({
    queryKey: ["/api/quote-studio/streaks"],
  });

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

  const StatCardSkeleton = () => (
    <Card className="bg-[#1a1a1a] border-white/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-white/10" />
            <Skeleton className="h-8 w-24 bg-white/10" />
            <Skeleton className="h-3 w-16 bg-white/10" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="analytics-dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full bg-white/10" />
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/10" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/10" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16" data-testid="analytics-dashboard-error">
        <ScanLine className="w-16 h-16 text-white/20 mb-4" />
        <p className="text-white/60 text-lg">Failed to load analytics</p>
        <p className="text-white/40 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  const data = analytics;
  const hasNoData = !data || data.totalScans === 0;

  if (hasNoData) {
    return (
      <div className="space-y-6" data-testid="analytics-dashboard-empty">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={QrCode}
            title="Total Scans"
            value="0"
            subtitle="No scans yet"
            color={GOLD}
          />
          <StatCard
            icon={Users}
            title="Unique Visitors"
            value="0"
            subtitle="No visitors yet"
            color={FOREST_GREEN}
          />
          <StatCard
            icon={TrendingUp}
            title="Daily Average"
            value="0"
            subtitle="Start scanning"
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

        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${GOLD}20` }}>
                <ScanLine className="w-12 h-12" style={{ color: GOLD }} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Scan Data Yet</h3>
              <p className="text-white/60 max-w-md">
                Once your QR codes start getting scanned, you'll see detailed analytics here including
                scan trends, device breakdowns, and top performing projects.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            {data.scansByDay.length > 0 ? (
              <div className="flex items-end justify-between h-40 gap-2">
                {data.scansByDay.map((day) => {
                  const maxCount = Math.max(...data.scansByDay.map((d) => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full rounded-t transition-all hover:opacity-80"
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          backgroundColor: day.count > 0 ? GOLD : `${GOLD}30`,
                          minHeight: "4px",
                        }}
                      />
                      <p className="text-white/60 text-xs mt-2">{day.date}</p>
                      <p className="text-white text-xs font-medium">{day.count}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-white/40">No weekly data available</p>
              </div>
            )}
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
            {data.topProjects.length > 0 ? (
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
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-white/40">No project data available</p>
              </div>
            )}
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
            {data.deviceBreakdown.length > 0 ? (
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
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-white/40 text-sm">No device data</p>
              </div>
            )}
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
