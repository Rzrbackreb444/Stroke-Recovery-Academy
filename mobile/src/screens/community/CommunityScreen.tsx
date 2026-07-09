import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/apiFetch';
import { Endpoints } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography } from '../../constants/typography';

interface PodMember {
  userId: string;
  displayName: string | null;
  firstName: string | null;
  lastCheckinAt: string | null;
}

interface Pod {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  members?: PodMember[];
  activity?: ActivityItem[];
}

interface ActivityItem {
  userId: string;
  displayName: string | null;
  action: string;
  createdAt: string;
}

interface AllPod {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
}

export function CommunityScreen() {
  const [myPod, setMyPod] = useState<Pod | null>(null);
  const [allPods, setAllPods] = useState<AllPod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'my-pod' | 'discover'>('my-pod');

  const load = useCallback(async () => {
    try {
      const [podRes, podsRes] = await Promise.allSettled([
        apiFetch<Pod>(Endpoints.pod),
        apiFetch<AllPod[]>(Endpoints.pods),
      ]);
      if (podRes.status === 'fulfilled') setMyPod(podRes.value);
      if (podsRes.status === 'fulfilled') setAllPods(podsRes.value ?? []);
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

  const joinPod = useCallback(async (podId: number, podName: string) => {
    Alert.alert(
      `Join ${podName}?`,
      'You can only be in one accountability pod at a time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              await apiFetch(Endpoints.podJoin(podId), { method: 'POST' });
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not join pod.');
            }
          },
        },
      ],
    );
  }, [load]);

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.loadingText}>Loading community…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabBar}>
        {(['my-pod', 'discover'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={t === 'my-pod' ? 'My accountability pod' : 'Discover pods'}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'my-pod' ? 'My Squad' : 'Find a Squad'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {tab === 'my-pod' && (
          <>
            {myPod ? (
              <>
                <View style={styles.podCard}>
                  <Text style={styles.podName}>{myPod.name}</Text>
                  {myPod.description && (
                    <Text style={styles.podDescription}>{myPod.description}</Text>
                  )}
                  <View style={styles.podMeta}>
                    <Text style={styles.podMetaText}>{myPod.memberCount} members</Text>
                  </View>
                </View>

                {myPod.members && myPod.members.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    {myPod.members.map((m) => (
                      <View key={m.userId} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(m.firstName || m.displayName || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {m.displayName || m.firstName || 'Survivor'}
                          </Text>
                          <Text style={styles.memberLast}>
                            Last active: {formatRelative(m.lastCheckinAt)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No squad yet</Text>
                <Text style={styles.emptyText}>
                  Join an accountability pod to stay connected with other survivors.
                </Text>
                <TouchableOpacity
                  style={styles.discoverButton}
                  onPress={() => setTab('discover')}
                  accessibilityRole="button"
                  accessibilityLabel="Find a squad"
                >
                  <Text style={styles.discoverButtonText}>Find a Squad</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'discover' && (
          <>
            {allPods.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No pods available yet</Text>
                <Text style={styles.emptyText}>
                  Check back soon — the community is growing.
                </Text>
              </View>
            ) : (
              allPods.map((pod) => (
                <View key={pod.id} style={styles.podCard}>
                  <Text style={styles.podName}>{pod.name}</Text>
                  {pod.description && (
                    <Text style={styles.podDescription}>{pod.description}</Text>
                  )}
                  <View style={styles.podCardFooter}>
                    <Text style={styles.podMetaText}>{pod.memberCount} members</Text>
                    {!myPod || myPod.id !== pod.id ? (
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => joinPod(pod.id, pod.name)}
                        accessibilityRole="button"
                        accessibilityLabel={`Join ${pod.name}`}
                      >
                        <Text style={styles.joinButtonText}>Join</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.joinedBadge}>
                        <Text style={styles.joinedText}>Your squad</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.stone,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.orange,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.orange,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 32,
  },
  podCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  podName: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: Spacing.xs,
  },
  podDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  podMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  podMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  podCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  joinButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radii.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  joinedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  joinedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 14,
  },
  section: { marginTop: Spacing.md },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 56,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  memberLast: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  discoverButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
  },
  discoverButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
  },
});
