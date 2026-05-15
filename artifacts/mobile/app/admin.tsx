import { AlertTriangle, CheckCircle, Shield, Trash2, Users, XCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase, Profile } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";

type TabType = "reports" | "users" | "posts";

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
  post_id?: string;
  comment_id?: string;
  reporter?: { name: string };
  post?: { id: string; content: string; user_id: string };
  comment?: { id: string; content: string; user_id: string };
};

type AdminPost = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { name: string; role: string };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("reports");
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  if (!profile || profile.role !== "admin") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Shield size={40} color={colors.red} />
        <Text style={{ color: colors.red, fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 12 }}>Access Denied</Text>
      </View>
    );
  }

  const loadStats = useCallback(async () => {
    const [{ count: uc }, { count: pc }, { count: rc }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setStats({ users: uc || 0, posts: pc || 0, reports: rc || 0 });
  }, []);

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("*, reporter:reporter_id(name), post:post_id(id, content, user_id), comment:comment_id(id, content, user_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    setReports((data || []) as Report[]);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    setUsers((data || []) as Profile[]);
  }, []);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase.from("posts").select("*, profiles(name, role)").order("created_at", { ascending: false }).limit(50);
    setPosts((data || []) as AdminPost[]);
  }, []);

  useEffect(() => {
    Promise.all([loadStats(), loadReports(), loadUsers(), loadPosts()]).finally(() => setLoading(false));
  }, []);

  const resolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    await supabase.from("reports").update({ status, resolved_by: user?.id }).eq("id", reportId);
    loadReports(); loadStats();
  };

  const deletePost = async (postId: string, reportId?: string) => {
    Alert.alert("Delete Post", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from("posts").delete().eq("id", postId);
          if (reportId) await supabase.from("reports").update({ status: "resolved", resolved_by: user?.id }).eq("id", reportId);
          loadPosts(); loadReports(); loadStats();
        },
      },
    ]);
  };

  const deleteComment = async (commentId: string, reportId?: string) => {
    Alert.alert("Delete Comment", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from("comments").delete().eq("id", commentId);
          if (reportId) await supabase.from("reports").update({ status: "resolved", resolved_by: user?.id }).eq("id", reportId);
          loadReports(); loadStats();
        },
      },
    ]);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (userId === user?.id) return Alert.alert("Cannot change your own role");
    Alert.alert("Change Role", `Set to "${newRole}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm", onPress: async () => {
          await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
          const msg = newRole === "mod" ? "You have been promoted to Moderator!" : newRole === "admin" ? "You have been granted Admin access." : "Your role has been updated to Member.";
          await supabase.from("notifications").insert({ title: "🛡️ Role Updated", message: msg, user_id: userId });
          loadUsers();
        },
      },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    statsRow: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
    statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: "center" },
    statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.primary },
    statLabel: { fontSize: 11, color: colors.text2, fontFamily: "Inter_500Medium", marginTop: 2 },
    tabRow: { flexDirection: "row", marginHorizontal: 16, marginVertical: 8, backgroundColor: colors.surface2, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    tabBtnActive: { backgroundColor: colors.card },
    tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.text2 },
    tabTextActive: { color: colors.foreground },
    section: { paddingHorizontal: 16 },
    reportCard: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
    reportHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "rgba(124,111,255,0.15)" },
    typeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: colors.primary, textTransform: "uppercase" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    reportContent: { fontSize: 13, color: colors.text2, fontFamily: "Inter_400Regular", marginBottom: 4, lineHeight: 18 },
    reportMeta: { fontSize: 11, color: colors.text3, fontFamily: "Inter_400Regular" },
    actionsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    userCard: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
    userAvatarImg: { width: 44, height: 44, borderRadius: 22 },
    userInitial: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.primary },
    userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    userEmail: { fontSize: 12, color: colors.text2, fontFamily: "Inter_400Regular" },
    userMeta: { fontSize: 11, color: colors.text3, fontFamily: "Inter_400Regular", marginTop: 1 },
    roleBtns: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
    roleBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
    roleBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    postCard: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8 },
    postAuthor: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary, marginBottom: 4 },
    postSnippet: { fontSize: 13, color: colors.text2, fontFamily: "Inter_400Regular", lineHeight: 18 },
    postTime: { fontSize: 11, color: colors.text3, fontFamily: "Inter_400Regular", marginTop: 4 },
    deleteBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderColor: colors.red, borderWidth: 1, alignSelf: "flex-start" },
    deleteBtnText: { color: colors.red, fontSize: 12, fontFamily: "Inter_600SemiBold" },
    emptyText: { color: colors.text3, textAlign: "center", paddingVertical: 30, fontFamily: "Inter_400Regular" },
  });

  const ROLES = ["member", "mod", "admin"];
  const ROLE_COLORS: Record<string, string> = { admin: colors.red, mod: colors.orange, member: colors.text2 };

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <AppHeader title="ADMIN PANEL" showBack />

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{stats.users}</Text>
          <Text style={s.statLabel}>Users</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{stats.posts}</Text>
          <Text style={s.statLabel}>Posts</Text>
        </View>
        <View style={[s.statCard, stats.reports > 0 && { borderColor: colors.red }]}>
          <Text style={[s.statNum, stats.reports > 0 && { color: colors.red }]}>{stats.reports}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["reports", "users", "posts"] as TabType[]).map((t) => (
          <TouchableOpacity key={t} style={[s.tabBtn, activeTab === t && s.tabBtnActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={s.section} showsVerticalScrollIndicator={false}>
          {activeTab === "reports" && (
            <>
              {reports.length === 0 && <Text style={s.emptyText}>No reports 🎉</Text>}
              {reports.map((r) => {
                const isPost = !!r.post;
                const target = isPost ? r.post : r.comment;
                const snippet = (target?.content || "Deleted content").substring(0, 120);
                const statusColor = r.status === "pending" ? colors.orange : r.status === "resolved" ? colors.green : colors.text3;
                return (
                  <View key={r.id} style={s.reportCard}>
                    <View style={s.reportHeader}>
                      <View style={s.typeBadge}><Text style={s.typeBadgeText}>{isPost ? "Post" : "Comment"}</Text></View>
                      <View style={[s.statusBadge, { backgroundColor: `${statusColor}22` }]}>
                        <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: statusColor, textTransform: "uppercase" }}>{r.status}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.text3, fontFamily: "Inter_400Regular", marginLeft: "auto" }}>{timeAgo(r.created_at)}</Text>
                    </View>
                    <Text style={s.reportContent}>"{snippet}{snippet.length >= 120 ? "…" : ""}"</Text>
                    <Text style={s.reportMeta}>Reason: {r.reason} · By: {r.reporter?.name || "Unknown"}</Text>
                    {r.status === "pending" && (
                      <View style={s.actionsRow}>
                        {isPost && r.post && (
                          <TouchableOpacity style={[s.actionBtn, { borderColor: colors.red }]} onPress={() => deletePost(r.post!.id, r.id)}>
                            <Trash2 size={12} color={colors.red} />
                            <Text style={[s.actionBtnText, { color: colors.red }]}>Del Post</Text>
                          </TouchableOpacity>
                        )}
                        {!isPost && r.comment && (
                          <TouchableOpacity style={[s.actionBtn, { borderColor: colors.red }]} onPress={() => deleteComment(r.comment!.id, r.id)}>
                            <Trash2 size={12} color={colors.red} />
                            <Text style={[s.actionBtnText, { color: colors.red }]}>Del Comment</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[s.actionBtn, { borderColor: colors.green }]} onPress={() => resolveReport(r.id, "resolved")}>
                          <CheckCircle size={12} color={colors.green} />
                          <Text style={[s.actionBtnText, { color: colors.green }]}>Resolve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.actionBtn, { borderColor: colors.text3 }]} onPress={() => resolveReport(r.id, "dismissed")}>
                          <XCircle size={12} color={colors.text3} />
                          <Text style={[s.actionBtnText, { color: colors.text3 }]}>Dismiss</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {activeTab === "users" && (
            <>
              {users.length === 0 && <Text style={s.emptyText}>No users yet</Text>}
              {users.map((u) => {
                const role = u.role || "member";
                const initial = (u.name || "?").charAt(0).toUpperCase();
                const isSelf = u.id === user?.id;
                const muteActive = u.muted_until && new Date(u.muted_until) > new Date();
                return (
                  <View key={u.id} style={s.userCard}>
                    <View style={s.userAvatar}>
                      {u.avatar_url
                        ? <Image source={{ uri: u.avatar_url }} style={s.userAvatarImg} />
                        : <Text style={s.userInitial}>{initial}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.userName}>{u.name || "No name"}</Text>
                      <Text style={s.userEmail}>{u.email || ""}</Text>
                      <Text style={s.userMeta}>
                        {u.class || ""}{u.class && " · "}
                        <Text style={{ color: ROLE_COLORS[role] }}>{role.toUpperCase()}</Text>
                        {muteActive ? " · 🔇 Muted" : ""}
                      </Text>
                      {!isSelf && (
                        <View style={s.roleBtns}>
                          {ROLES.map((r) => (
                            <TouchableOpacity key={r} style={[s.roleBtn, { borderColor: role === r ? ROLE_COLORS[r] : colors.border, backgroundColor: role === r ? `${ROLE_COLORS[r]}22` : "transparent" }]} onPress={() => changeRole(u.id, r)}>
                              <Text style={[s.roleBtnText, { color: role === r ? ROLE_COLORS[r] : colors.text2 }]}>{r}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    {isSelf && <Users size={16} color={colors.text3} />}
                  </View>
                );
              })}
            </>
          )}

          {activeTab === "posts" && (
            <>
              {posts.length === 0 && <Text style={s.emptyText}>No posts yet</Text>}
              {posts.map((p) => (
                <View key={p.id} style={s.postCard}>
                  <Text style={s.postAuthor}>
                    {p.profiles?.name || "Unknown"}
                    {p.profiles?.role && p.profiles.role !== "member" ? ` [${p.profiles.role.toUpperCase()}]` : ""}
                  </Text>
                  <Text style={s.postSnippet} numberOfLines={3}>{p.content}</Text>
                  <Text style={s.postTime}>{timeAgo(p.created_at)}</Text>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => deletePost(p.id)}>
                    <Trash2 size={12} color={colors.red} />
                    <Text style={s.deleteBtnText}>Delete Post</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}
