import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase, Notification } from "@/lib/supabase";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signOut, saveProfile, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">("profile");

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditBio(profile.bio || "");
    }
  }, [profile]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data || []) as Notification[]);
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadNotifications()]);
    setRefreshing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveProfile({ name: editName, bio: editBio });
    setSaving(false);
    if (error) Alert.alert("Error", error);
    else Alert.alert("Saved", "Profile updated successfully.");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch {}
          // Explicitly navigate to auth regardless — handles edge cases where
          // onAuthStateChange might be slow or the session clear didn't fire navigation
          router.replace("/auth");
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? 16 : insets.top + 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: 1 },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.text2 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabTextActive: { color: colors.primary },
    section: { padding: 20 },
    avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: colors.surface2, alignItems: "center",
      justifyContent: "center", borderWidth: 2, borderColor: colors.primary,
    },
    avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.primary },
    nameText: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    emailText: { fontSize: 13, color: colors.text2, marginTop: 2, fontFamily: "Inter_400Regular" },
    roleTag: { marginTop: 5, backgroundColor: "rgba(124,111,255,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
    roleTagText: { fontSize: 11, color: colors.primary, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
    auraRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
    auraText: { fontSize: 13, color: (colors as any).cyan ?? colors.primary, fontFamily: "Inter_600SemiBold" },
    label: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 18 },
    input: { backgroundColor: colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
    saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
    signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,59,92,0.3)", marginTop: 14 },
    signOutText: { color: colors.red, fontSize: 14, fontFamily: "Inter_600SemiBold" },
    notifCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    notifTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 },
    notifBody: { fontSize: 13, color: colors.text2, lineHeight: 19, fontFamily: "Inter_400Regular" },
    notifDate: { fontSize: 11, color: colors.text3, marginTop: 4, fontFamily: "Inter_400Regular" },
    emptyText: { color: colors.text3, textAlign: "center", paddingVertical: 30, fontFamily: "Inter_400Regular" },
  });

  const initials = (profile?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === "profile" && styles.tabActive]} onPress={() => setActiveTab("profile")}>
          <Text style={[styles.tabText, activeTab === "profile" && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "notifications" && styles.tabActive]} onPress={() => setActiveTab("notifications")}>
          <Text style={[styles.tabText, activeTab === "notifications" && styles.tabTextActive]}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === "profile" ? (
          <View style={styles.section}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{profile?.name || "No name set"}</Text>
                <Text style={styles.emailText}>{user?.email}</Text>
                {profile?.role && profile.role !== "member" && (
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{profile.role}</Text>
                  </View>
                )}
                {profile?.aura_score != null && (
                  <View style={styles.auraRow}>
                    <Feather name="zap" size={13} color={(colors as any).cyan ?? colors.primary} />
                    <Text style={styles.auraText}>
                      {profile.aura_score} Aura · {profile.aura_level || "Novice"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.text3}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.text3}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Feather name="log-out" size={16} color={colors.red} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>No notifications yet</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={styles.notifCard}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody}>{n.message}</Text>
                  <Text style={styles.notifDate}>
                    {new Date(n.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
