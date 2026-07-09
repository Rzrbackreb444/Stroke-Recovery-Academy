import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { useOffline } from '../../contexts/OfflineContext';
import { apiFetch } from '../../lib/apiFetch';
import { Endpoints } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography } from '../../constants/typography';
import { OfflineBanner } from '../../components/OfflineBanner';

interface ArcPoint {
  date: string;
  mood: number | null;
  energy: number | null;
  reps: number;
}

interface ProgressArc {
  arc: ArcPoint[];
  totalDays: number;
}

const CHART_HEIGHT = 160;
const CHART_PAD = 12;

function buildPoints(
  arc: ArcPoint[],
  key: 'mood' | 'energy',
  width: number,
): string {
  const usable = arc.filter((p) => p[key] != null);
  if (usable.length < 2) return '';
  const step = (width - CHART_PAD * 2) / Math.max(arc.length - 1, 1);
  return arc
    .map((p, i) => {
      const v = p[key];
      if (v == null) return null;
      const x = CHART_PAD + i * step;
      const y = CHART_HEIGHT - CHART_PAD - ((v - 1) / 9) * (CHART_HEIGHT - CHART_PAD * 2);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');
}

export function ProgressScreen() {
  const { isOnline } = useOffline();
  const [data, setData] = useState<ProgressArc | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<ProgressArc>(Endpoints.progressArc);
      setData(d);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.loadingText}>Loading your progress…</Text>
      </SafeAreaView>
    );
  }

  const arc = data?.arc ?? [];
  const logged = arc.filter((p) => p.mood != null || p.energy != null || p.reps > 0);
  const totalReps = arc.reduce((s, p) => s + (p.reps || 0), 0);
  const moodVals = arc.filter((p) => p.mood != null).map((p) => p.mood as number);
  const avgMood = moodVals.length
    ? (moodVals.reduce((s, v) => s + v, 0) / moodVals.length).toFixed(1)
    : '—';
  const last = logged[logged.length - 1];

  const moodPts = chartWidth > 0 ? buildPoints(arc, 'mood', chartWidth) : '';
  const energyPts = chartWidth > 0 ? buildPoints(arc, 'energy', chartWidth) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfflineBanner visible={!isOnline} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          {data ? `Last ${data.totalDays} days` : 'Your recovery arc'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard} accessible accessibilityLabel={`${logged.length} days logged`}>
            <Text style={styles.statValue}>{logged.length}</Text>
            <Text style={styles.statLabel}>Days Logged</Text>
          </View>
          <View style={styles.statCard} accessible accessibilityLabel={`${totalReps} total reps`}>
            <Text style={styles.statValue}>{totalReps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </View>
          <View style={styles.statCard} accessible accessibilityLabel={`Average mood ${avgMood} out of 10`}>
            <Text style={styles.statValue}>{avgMood}</Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
        </View>

        {error && !data && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn't load your progress. Pull down to try again.
            </Text>
          </View>
        )}

        {arc.length >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood & Energy</Text>
            <View
              style={styles.chartCard}
              onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
              accessible
              accessibilityLabel={`Line chart of mood and energy over the last ${arc.length} days. Average mood ${avgMood} out of 10.`}
            >
              {chartWidth > 0 && (
                <Svg width={chartWidth} height={CHART_HEIGHT}>
                  {[1, 5, 10].map((v) => {
                    const y = CHART_HEIGHT - CHART_PAD - ((v - 1) / 9) * (CHART_HEIGHT - CHART_PAD * 2);
                    return (
                      <Line
                        key={v}
                        x1={CHART_PAD}
                        y1={y}
                        x2={chartWidth - CHART_PAD}
                        y2={y}
                        stroke={Colors.border}
                        strokeWidth={1}
                      />
                    );
                  })}
                  {energyPts !== '' && (
                    <Polyline
                      points={energyPts}
                      fill="none"
                      stroke={Colors.gold}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {moodPts !== '' && (
                    <Polyline
                      points={moodPts}
                      fill="none"
                      stroke={Colors.orange}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {last && last.mood != null && moodPts !== '' && (
                    <Circle
                      cx={moodPts.split(' ').pop()?.split(',')[0]}
                      cy={moodPts.split(' ').pop()?.split(',')[1]}
                      r={5}
                      fill={Colors.orange}
                    />
                  )}
                </Svg>
              )}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.orange }]} />
                  <Text style={styles.legendText}>Mood</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.gold }]} />
                  <Text style={styles.legendText}>Energy</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Days</Text>
          {logged.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No check-ins yet. Your progress shows up here after your first daily check-in.
              </Text>
            </View>
          ) : (
            [...logged].reverse().slice(0, 14).map((p, i) => (
              <View
                key={`${p.date}-${i}`}
                style={styles.dayRow}
                accessible
                accessibilityLabel={`${p.date}: mood ${p.mood ?? 'not logged'}, energy ${p.energy ?? 'not logged'}, ${p.reps} reps`}
              >
                <Text style={styles.dayDate}>{p.date}</Text>
                <View style={styles.dayMetrics}>
                  <Text style={styles.dayMetric}>
                    Mood <Text style={styles.dayMetricValue}>{p.mood ?? '—'}</Text>
                  </Text>
                  <Text style={styles.dayMetric}>
                    Energy <Text style={styles.dayMetricValue}>{p.energy ?? '—'}</Text>
                  </Text>
                  <Text style={styles.dayMetric}>
                    Reps <Text style={styles.dayMetricValue}>{p.reps}</Text>
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  centered: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: { ...Typography.body, color: Colors.textSecondary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 32 },
  title: { ...Typography.h2 },
  subtitle: { ...Typography.caption, marginTop: 2, marginBottom: Spacing.lg },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.orange,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#991B1B', textAlign: 'center' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  dayRow: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    minHeight: 52,
  },
  dayDate: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  dayMetrics: { flexDirection: 'row', gap: Spacing.md },
  dayMetric: { fontSize: 13, color: Colors.textSecondary },
  dayMetricValue: { fontWeight: '700', color: Colors.ink },
});
