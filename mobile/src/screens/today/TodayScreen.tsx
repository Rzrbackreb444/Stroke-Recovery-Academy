import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { apiFetch } from '../../lib/apiFetch';
import { Endpoints } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography } from '../../constants/typography';
import { OfflineBanner } from '../../components/OfflineBanner';

interface DashboardData {
  streak: { currentStreak: number; longestStreak: number; totalActiveDays: number } | null;
  todayCheckin: unknown | null;
  habits: Habit[];
  totalPoints: number;
  recoveryScore: number;
  recentCheckins: unknown[];
}

interface Habit {
  id: number;
  name: string;
  category: string;
  targetReps: number;
  completedToday?: boolean;
}

interface Props {
  onGoCheckIn: () => void;
  onGoHabits: () => void;
}

export function TodayScreen({ onGoCheckIn, onGoHabits }: Props) {
  const { user } = useAuth();
  const { isOnline, cachedDashboard, setCachedDashboard } = useOffline();
  const [data, setData] = useState<DashboardData | null>(
    cachedDashboard as DashboardData | null,
  );
  const [loading, setLoading] = useState(!cachedDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [habitLogs, setHabitLogs] = useState<Record<number, boolean>>({});

  const load = useCallback(async (isRefresh = false) => {
    if (!isOnline && !isRefresh) return;
    try {
      const d = await apiFetch<DashboardData>(Endpoints.dashboard);
      setData(d);
      setCachedDashboard(d);
    } catch (e) {
      if (!data && cachedDashboard) {
        setData(cachedDashboard as DashboardData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline, cachedDashboard, setCachedDashboard]);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const logHabit = useCallback(async (habitId: number) => {
    setHabitLogs((prev) => ({ ...prev, [habitId]: true }));
    try {
      await apiFetch(Endpoints.habitLog(habitId), {
        method: 'POST',
        body: JSON.stringify({ reps: 1 }),
      });
    } catch {
      setHabitLogs((prev) => ({ ...prev, [habitId]: false }));
    }
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.firstName || user?.displayName || 'Survivor';
  const checkedIn = !!(data?.todayCheckin);
  const streak = data?.streak?.currentStreak ?? 0;

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.loadingText}>Loading your day…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfflineBanner visible={!isOnline} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{greeting()}, {firstName}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard} accessible accessibilityLabel={`${streak}-day streak`}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard} accessible accessibilityLabel={`${data?.totalPoints ?? 0} points earned`}>
            <Text style={styles.statValue}>{data?.totalPoints ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard} accessible accessibilityLabel={`${data?.recoveryScore ?? 0} recovery score`}>
            <Text style={styles.statValue}>{data?.recoveryScore ?? 0}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Check-In</Text>
          {checkedIn ? (
            <View style={styles.checkedInCard} accessibilityRole="none" accessible accessibilityLabel="Check-in complete">
              <Text style={styles.checkedInIcon}>✓</Text>
              <View>
                <Text style={styles.checkedInTitle}>Check-in complete</Text>
                <Text style={styles.checkedInSub}>You've logged your day. Keep it up.</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={onGoCheckIn}
              accessibilityRole="button"
              accessibilityLabel="Start today's check-in"
              accessibilityHint="Opens the daily mood, energy, and wins check-in form"
            >
              <Text style={styles.checkInButtonText}>Start Today's Check-In</Text>
              <Text style={styles.checkInSub}>Mood · Energy · Pain · Your win</Text>
            </TouchableOpacity>
          )}
        </View>

        {data && data.habits && data.habits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Reps</Text>
              <TouchableOpacity
                onPress={onGoHabits}
                accessibilityRole="button"
                accessibilityLabel="Manage habits"
                style={styles.seeAll}
              >
                <Text style={styles.seeAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {data.habits.slice(0, 5).map((habit) => {
              const done = habitLogs[habit.id] ?? habit.completedToday;
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitRow, done && styles.habitRowDone]}
                  onPress={() => !done && logHabit(habit.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!done }}
                  accessibilityLabel={`${habit.name}${done ? ', completed' : ', tap to log a rep'}`}
                  disabled={!!done}
                >
                  <View style={[styles.habitCheck, done && styles.habitCheckDone]}>
                    {done && <Text style={styles.habitCheckMark}>✓</Text>}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, done && styles.habitNameDone]}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitCategory}>{habit.category}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineNote}>
            <Text style={styles.offlineNoteText}>
              Showing cached data. Check-ins entered while offline will sync automatically.
            </Text>
          </View>
        )}
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
  greeting: { marginBottom: Spacing.lg },
  greetingText: { ...Typography.h2 },
  dateText: { ...Typography.caption, marginTop: 2 },
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
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  seeAll: { minHeight: 32, justifyContent: 'center' },
  seeAllText: { color: Colors.orange, fontWeight: '600', fontSize: 15 },
  checkInButton: {
    backgroundColor: Colors.orange,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  checkInButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  checkInSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  checkedInCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  checkedInIcon: {
    fontSize: 28,
    color: Colors.success,
    fontWeight: '700',
  },
  checkedInTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#166534',
  },
  checkedInSub: {
    fontSize: 14,
    color: '#166534',
    opacity: 0.8,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    minHeight: 56,
  },
  habitRowDone: {
    backgroundColor: '#F0FDF4',
  },
  habitCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  habitCheckMark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  habitInfo: { flex: 1 },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  habitNameDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  habitCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  offlineNote: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  offlineNoteText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
});
