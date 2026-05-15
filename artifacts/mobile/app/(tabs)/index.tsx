import { Bell, Flame, Trophy, Target, ChevronRight, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { GlassCard } from "@/components/ui/GlassCard";

export default function DashboardScreen() {
  const colors = useColors();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useDashboardAnalytics();
  const { entries: leaderboard, loading: leaderLoading, refetch: refetchLeader } = useLeaderboard(3);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchLeader()]);
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = profile?.name?.split(" ")[0] || "friend";

  if (statsLoading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.text2 }]}>{greeting}</Text>
              <Text style={[styles.userName, { color: colors.foreground }]}>{name}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/notifications")} 
              style={[styles.notifBtn, { backgroundColor: colors.surface2 }]}
            >
              <Bell size={20} color={colors.text2} />
              <View style={[styles.dot, { backgroundColor: colors.red }]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topRow}>
          <GlassCard style={styles.mainCard}>
            <View style={styles.streakRow}>
              <View>
                <Text style={[styles.statLabel, { color: colors.text3 }]}>AURA STREAK</Text>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{stats?.streak || 0}</Text>
                  <Flame size={20} color={colors.orange} style={{ marginLeft: 6 }} />
                </View>
              </View>
              <View style={[styles.auraPill, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                <Zap size={14} color={colors.primary} />
                <Text style={[styles.auraText, { color: colors.primary }]}>{stats?.score || 0} XP</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.statsGrid}>
            <GlassCard style={styles.smallCard}>
              <Target size={16} color={colors.cyan} />
              <Text style={[styles.smallValue, { color: colors.foreground }]}>{stats?.accuracy || 0}%</Text>
              <Text style={[styles.smallLabel, { color: colors.text3 }]}>ACCURACY</Text>
            </GlassCard>
            <GlassCard style={styles.smallCard}>
              <Trophy size={16} color={colors.gold} />
              <Text style={[styles.smallValue, { color: colors.foreground }]}>{stats?.totalSolved || 0}</Text>
              <Text style={[styles.smallLabel, { color: colors.text3 }]}>SOLVED</Text>
            </GlassCard>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text2 }]}>Subject Breakdown</Text>
          </View>
          <GlassCard style={{ gap: 16 }}>
            {stats?.subjectBreakdown.map((sub: any) => (
              <View key={sub.subject}>
                <View style={styles.subLabelRow}>
                  <Text style={[styles.subName, { color: colors.foreground }]}>{sub.subject.toUpperCase()}</Text>
                  <Text style={[styles.subStats, { color: colors.text2 }]}>{sub.correct}/{sub.total} Correct</Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.surface2 }]}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        backgroundColor: sub.subject === 'physics' ? colors.cyan : sub.subject === 'chemistry' ? colors.orange : colors.primary,
                        width: `${(sub.correct / Math.max(sub.total, 1)) * 100}%`
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
            {(!stats?.subjectBreakdown || stats.subjectBreakdown.length === 0) && (
              <Text style={[styles.emptyText, { color: colors.text3 }]}>Start solving to see breakdown</Text>
            )}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text2 }]}>Top Performers</Text>
            <TouchableOpacity onPress={() => router.push("/community")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={{ padding: 0 }}>
            {leaderboard.map((user, i) => (
              <View key={user.userId} style={[styles.leaderRow, i < leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={[styles.rank, { color: i === 0 ? colors.gold : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>#{user.rank}</Text>
                <View style={styles.userInfo}>
                  <Text style={[styles.userNameLeader, { color: colors.foreground }]}>{user.name}</Text>
                  <Text style={[styles.userAccuracy, { color: colors.text3 }]}>{user.accuracy}% Accuracy</Text>
                </View>
                <Text style={[styles.userScore, { color: colors.primary }]}>{user.score} XP</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text2 }]}>Recent Attempts</Text>
          </View>
          <View style={{ gap: 10 }}>
            {stats?.recentActivity.map((act: any, i: number) => (
              <GlassCard key={i} style={styles.activityCard}>
                <View style={[styles.statusDot, { backgroundColor: act.is_correct ? colors.green : colors.red }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actTitle, { color: colors.foreground }]}>{act.chapter || 'Question'}</Text>
                  <Text style={[styles.actMeta, { color: colors.text3 }]}>{act.subject?.toUpperCase()} · {new Date(act.created_at).toLocaleDateString()}</Text>
                </View>
                <ChevronRight size={16} color={colors.text3} />
              </GlassCard>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5 },
  userName: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 12, right: 12, borderWidth: 2, borderColor: '#000' },
  topRow: { paddingHorizontal: 20, gap: 12 },
  mainCard: { padding: 24 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statValue: { fontSize: 40, fontFamily: 'Inter_700Bold' },
  auraPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  auraText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  smallValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  smallLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subName: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  subStats: { fontSize: 10 },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  emptyText: { textAlign: 'center', fontSize: 12, paddingVertical: 10 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rank: { fontSize: 14, fontFamily: 'Inter_700Bold', width: 30 },
  userInfo: { flex: 1 },
  userNameLeader: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userAccuracy: { fontSize: 11 },
  userScore: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  actTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  actMeta: { fontSize: 11, marginTop: 2 },
});
