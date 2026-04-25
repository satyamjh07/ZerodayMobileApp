import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase, StudySession } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";

const SUPABASE_URL = "https://biqdrsqirzxnznyucwtz.supabase.co";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type DashData = {
  todaySeconds: number;
  weekSeconds: number;
  totalSessions: number;
  streak: number;
  auraScore: number | null;
  auraLevel: string;
  dayTotals: number[];
};

export default function DashboardScreen() {
  const colors = useColors();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .order("start_time", { ascending: false });

    const all = (sessions || []) as StudySession[];
    const today = all.filter((s) => new Date(s.start_time) >= todayStart);
    const week = all.filter((s) => new Date(s.start_time) >= weekStart);

    let streak = 0;
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const studyDates = new Set(all.map((s) => { const dt = new Date(s.start_time); dt.setHours(0,0,0,0); return dt.getTime(); }));
    while (studyDates.has(d.getTime())) { streak++; d.setDate(d.getDate() - 1); }

    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const dayTotals = Array(7).fill(0);
    all.forEach((s) => {
      const sd = new Date(s.start_time);
      sd.setHours(0, 0, 0, 0);
      const diff = Math.floor((sd.getTime() - monday.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) dayTotals[diff] += s.duration_seconds || 0;
    });

    let auraScore: number | null = null;
    let auraLevel = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/calculate-aura`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const json = await res.json();
          auraScore = json.aura_score ?? null;
          auraLevel = json.aura_level ?? "";
        }
      }
    } catch {}

    setData({
      todaySeconds: today.reduce((a, s) => a + (s.duration_seconds || 0), 0),
      weekSeconds: week.reduce((a, s) => a + (s.duration_seconds || 0), 0),
      totalSessions: all.length,
      streak,
      auraScore,
      auraLevel,
      dayTotals,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = profile?.name?.split(" ")[0] || "friend";

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 67 + insets.top : insets.top + 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    greeting: { fontSize: 12, color: colors.text2, textTransform: "uppercase", letterSpacing: 1 },
    userName: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginTop: 2, fontFamily: "Inter_700Bold" },
    section: { paddingHorizontal: 20, paddingTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: "700", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    statsRow: { flexDirection: "row", gap: 10 },
    auraCard: { backgroundColor: colors.card, borderRadius: 14, padding: 20, marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
    auraLabel: { fontSize: 11, color: colors.text2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    auraScore: { fontSize: 48, fontWeight: "900", color: colors.primary },
    auraLevel: { fontSize: 13, color: colors.cyan, marginTop: 4, fontWeight: "600" },
    barsSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
    barsContainer: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
    barWrap: { flex: 1, height: "100%", justifyContent: "flex-end" },
    bar: { borderRadius: 4, minHeight: 4 },
    dayLabel: { fontSize: 9, color: colors.text3, textAlign: "center", marginTop: 4 },
    loadingText: { color: colors.text2, textAlign: "center", marginTop: 60 },
  });

  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{name}</Text>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading your stats...</Text>
        ) : data ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today</Text>
              <View style={styles.statsRow}>
                <StatCard label="Study Time" value={formatDuration(data.todaySeconds) || "0m"} />
                <StatCard label="Streak" value={`${data.streak}🔥`} accent={colors.orange} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <View style={styles.statsRow}>
                <StatCard label="Total Time" value={formatDuration(data.weekSeconds) || "0h"} />
                <StatCard label="Sessions" value={String(data.totalSessions)} accent={colors.green} />
              </View>
            </View>

            <View style={styles.auraCard}>
              <Text style={styles.auraLabel}>Aura Score</Text>
              <Text style={styles.auraScore}>{data.auraScore ?? "—"}</Text>
              {data.auraLevel ? <Text style={styles.auraLevel}>{data.auraLevel}</Text> : null}
            </View>

            <View style={styles.barsSection}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Weekly Activity</Text>
              <View style={styles.barsContainer}>
                {data.dayTotals.map((secs, i) => {
                  const max = Math.max(...data.dayTotals, 1);
                  const pct = Math.max((secs / max) * 100, 4);
                  const isToday = i === todayIdx;
                  return (
                    <View key={i} style={styles.barWrap}>
                      <View
                        style={[styles.bar, {
                          height: `${pct}%` as any,
                          backgroundColor: isToday ? colors.primary : colors.surface3,
                        }]}
                      />
                      <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
