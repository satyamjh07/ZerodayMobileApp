import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTimer } from "@/context/TimerContext";
import { useColors } from "@/hooks/useColors";
import { supabase, StudySession } from "@/lib/supabase";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isRunning, elapsedSeconds, startTimer, stopTimer, pendingResume, resumeInfo, resumeSession, discardSession } = useTimer();
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [stopping, setStopping] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .gte("start_time", start.toISOString())
      .order("start_time", { ascending: false });
    setTodaySessions((data || []) as StudySession[]);
  }, [user]);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => {
    if (!isRunning) loadSessions();
  }, [isRunning, loadSessions]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTimer();
  };

  const handleStop = async () => {
    setStopping(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await stopTimer();
    setStopping(false);
    loadSessions();
  };

  const progress = Math.min(elapsedSeconds / 7200, 1);
  const circumference = 2 * Math.PI * 100;
  const offset = circumference - circumference * progress;

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
    headerTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: colors.text2, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
    timerSection: { alignItems: "center", paddingVertical: 40 },
    timerDisplay: { fontSize: 56, fontWeight: "900", color: colors.foreground, fontFamily: "Inter_700Bold", letterSpacing: -2 },
    timerStatus: { fontSize: 12, color: isRunning ? colors.green : colors.text2, textTransform: "uppercase", letterSpacing: 2, marginTop: 8 },
    ringContainer: { width: 240, height: 240, marginBottom: 24, position: "relative", alignItems: "center", justifyContent: "center" },
    btnStart: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 40, flexDirection: "row", alignItems: "center", gap: 8 },
    btnStop: { backgroundColor: colors.red, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 40, flexDirection: "row", alignItems: "center", gap: 8 },
    btnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
    sessionsSection: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 11, fontWeight: "700", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    sessionItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    sessionTime: { fontSize: 14, color: colors.text2 },
    sessionDuration: { fontSize: 14, fontWeight: "600", color: colors.primary },
    emptyText: { fontSize: 14, color: colors.text3, textAlign: "center", paddingVertical: 20 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
    modalCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, width: "100%", borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
    modalBody: { fontSize: 14, color: colors.text2, marginBottom: 20, lineHeight: 21 },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalBtnPrimary: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignItems: "center" },
    modalBtnSecondary: { flex: 1, backgroundColor: colors.surface2, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: colors.border },
    modalBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
    modalBtnTextSec: { fontSize: 14, fontWeight: "600", color: colors.text2 },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TIMER</Text>
          <Text style={styles.headerSub}>Track your focus sessions</Text>
        </View>

        <View style={styles.timerSection}>
          <View style={styles.ringContainer}>
            <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <Text style={styles.timerStatus}>{isRunning ? "Studying..." : "Ready"}</Text>
          <View style={{ height: 24 }} />
          {isRunning ? (
            <TouchableOpacity style={styles.btnStop} onPress={handleStop} disabled={stopping}>
              <Feather name="square" size={18} color="#fff" />
              <Text style={styles.btnText}>{stopping ? "Saving..." : "Stop Session"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnStart} onPress={handleStart}>
              <Feather name="play" size={18} color="#fff" />
              <Text style={styles.btnText}>Start Studying</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sessionsSection}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          {todaySessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet today. Start studying!</Text>
          ) : (
            todaySessions.map((s) => {
              const start = new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const end = s.end_time ? new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <View key={s.id} style={styles.sessionItem}>
                  <Text style={styles.sessionTime}>{start}{end ? ` → ${end}` : ""}</Text>
                  <Text style={styles.sessionDuration}>{formatDuration(s.duration_seconds || 0)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={pendingResume} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resume Session?</Text>
            <Text style={styles.modalBody}>
              You have an unfinished session from {resumeInfo ? formatDuration(resumeInfo.elapsedSeconds) : "earlier"} ago. Save it as a complete session?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={discardSession}>
                <Text style={styles.modalBtnTextSec}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={resumeSession}>
                <Text style={styles.modalBtnText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
