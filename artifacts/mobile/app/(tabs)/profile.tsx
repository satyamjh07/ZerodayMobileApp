import { Camera, LogOut, Shield, Zap } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useTheme } from "@/context/ThemeContext";
import { AppHeader } from "@/components/AppHeader";
import { ThemeName, THEMES } from "@/constants/colors";

const CLOUDINARY_CLOUD = "dn5uwablh";
const CLOUDINARY_PRESET = "study_aura_unsigned";

const THEME_OPTIONS: { name: ThemeName; label: string; emoji: string }[] = [
  { name: "dark",    label: "Dark",    emoji: "🌙" },
  { name: "light",   label: "Light",   emoji: "☀️" },
  { name: "ocean",   label: "Ocean",   emoji: "🌊" },
  { name: "forest",  label: "Forest",  emoji: "🌿" },
  { name: "sunset",  label: "Sunset",  emoji: "🌅" },
  { name: "rose",    label: "Rose",    emoji: "🌸" },
];

async function uploadAvatarToCloudinary(uri: string): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const formData = new FormData();
  formData.append("file", { uri, type, name: `avatar_${Date.now()}.${ext}` } as any);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "study_aura/avatars");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url as string;
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, profile, signOut, saveProfile, refreshProfile } = useAuth();
  const { themeName, setTheme } = useTheme();
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      { text: "Sign Out", style: "destructive", onPress: async () => { try { await signOut(); } catch {} router.replace("/auth"); } },
    ]);
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatarToCloudinary(result.assets[0].uri);
      const { error } = await saveProfile({ avatar_url: url });
      if (error) Alert.alert("Error", error);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
    }
    setUploadingAvatar(false);
  };

  const initials = (profile?.name || user?.email || "?").charAt(0).toUpperCase();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: { padding: 20 },
    avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
    avatarWrap: { position: "relative" },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.primary, overflow: "hidden" },
    avatarImg: { width: 80, height: 80, borderRadius: 40 },
    avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.primary },
    cameraBtn: { position: "absolute", bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
    nameText: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    emailText: { fontSize: 13, color: colors.text2, marginTop: 2, fontFamily: "Inter_400Regular" },
    roleTag: { marginTop: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
    roleTagText: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
    auraRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 },
    auraText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    label: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 18 },
    input: { backgroundColor: colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
    saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
    themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    themeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5 },
    themeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    themePreview: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    adminBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 14 },
    signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 12 },
    signOutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });

  const roleColor = profile?.role === "admin" ? colors.red : profile?.role === "mod" ? colors.orange : colors.primary;

  return (
    <View style={s.container}>
      <AppHeader title="PROFILE" />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={s.section}>
          {/* Avatar row */}
          <View style={s.avatarRow}>
            <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              <View style={s.avatar}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.primary} />
                ) : profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarText}>{initials}</Text>
                )}
              </View>
              <View style={s.cameraBtn}>
                <Camera size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.nameText}>{profile?.name || "No name set"}</Text>
              <Text style={s.emailText}>{user?.email}</Text>
              {profile?.role && profile.role !== "member" && (
                <View style={[s.roleTag, { backgroundColor: `${roleColor}18` }]}>
                  <Text style={[s.roleTagText, { color: roleColor }]}>{profile.role}</Text>
                </View>
              )}
              {profile?.aura_score != null && (
                <View style={s.auraRow}>
                  <Zap size={13} color={colors.cyan ?? colors.primary} />
                  <Text style={[s.auraText, { color: colors.cyan ?? colors.primary }]}>{profile.aura_score} Aura · {profile.aura_level || "Novice"}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Edit fields */}
          <Text style={s.label}>Display Name</Text>
          <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={colors.text3} />

          <Text style={s.label}>Bio</Text>
          <TextInput style={[s.input, { minHeight: 80, textAlignVertical: "top" }]} value={editBio} onChangeText={setEditBio} placeholder="Tell us about yourself" placeholderTextColor={colors.text3} multiline />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>

          {/* Theme picker */}
          <Text style={s.label}>Theme</Text>
          <View style={s.themeGrid}>
            {THEME_OPTIONS.map((t) => {
              const active = themeName === t.name;
              const palette = THEMES[t.name];
              return (
                <TouchableOpacity
                  key={t.name}
                  style={[s.themeChip, { borderColor: active ? palette.primary : colors.border, backgroundColor: active ? `${palette.primary}18` : colors.surface2 }]}
                  onPress={() => setTheme(t.name)}
                >
                  <View style={[s.themePreview, { backgroundColor: palette.background }]} />
                  <Text style={[s.themeChipText, { color: active ? palette.primary : colors.text2 }]}>{t.emoji} {t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Admin panel button */}
          {profile?.role === "admin" && (
            <TouchableOpacity style={[s.adminBtn, { borderColor: `${colors.red}40` }]} onPress={() => router.push("/admin")}>
              <Shield size={16} color={colors.red} />
              <Text style={[s.signOutText, { color: colors.red }]}>Admin Panel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.signOutBtn, { borderColor: "rgba(255,59,92,0.3)" }]} onPress={handleSignOut}>
            <LogOut size={16} color={colors.red} />
            <Text style={[s.signOutText, { color: colors.red }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
