import { LogOut, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { AppHeader } from "@/components/AppHeader";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, profile, signOut, saveProfile, refreshProfile } = useAuth();
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) { setEditName(profile.name || ""); setEditBio(profile.bio || ""); }
  }, [profile]);

  const onRefresh = async () => { setRefreshing(true); await refreshProfile(); setRefreshing(false); };

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
          try { await signOut(); } catch {}
          router.replace("/auth");
        },
      },
    ]);
  };

  const initials = (profile?.name || user?.email || "?").charAt(0).toUpperCase();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: { padding: 20 },
    avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.primary },
    avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.primary },
    nameText: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    emailText: { fontSize: 13, color: colors.text2, marginTop: 2, fontFamily: "Inter_400Regular" },
    roleTag: { marginTop: 5, backgroundColor: "rgba(124,111,255,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
    roleTagText: { fontSize: 11, color: colors.primary, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
    auraRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
    auraText: { fontSize: 13, color: colors.cyan ?? colors.primary, fontFamily: "Inter_600SemiBold" },
    label: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 18 },
    input: { backgroundColor: colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
    saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
    signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,59,92,0.3)", marginTop: 14 },
    signOutText: { color: colors.red, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });

  return (
    <View style={s.container}>
      <AppHeader title="PROFILE" />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={s.section}>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nameText}>{profile?.name || "No name set"}</Text>
              <Text style={s.emailText}>{user?.email}</Text>
              {profile?.role && profile.role !== "member" && (
                <View style={s.roleTag}><Text style={s.roleTagText}>{profile.role}</Text></View>
              )}
              {profile?.aura_score != null && (
                <View style={s.auraRow}>
                  <Zap size={13} color={colors.cyan ?? colors.primary} />
                  <Text style={s.auraText}>{profile.aura_score} Aura · {profile.aura_level || "Novice"}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={s.label}>Display Name</Text>
          <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={colors.text3} />

          <Text style={s.label}>Bio</Text>
          <TextInput style={[s.input, { minHeight: 80, textAlignVertical: "top" }]} value={editBio} onChangeText={setEditBio} placeholder="Tell us about yourself" placeholderTextColor={colors.text3} multiline />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
            <LogOut size={16} color={colors.red} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
