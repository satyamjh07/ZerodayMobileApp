import { VolumeX, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const DURATIONS = [
  { label: "15 minutes", minutes: 15 },
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 360 },
  { label: "24 hours", minutes: 1440 },
  { label: "7 days", minutes: 10080 },
];

type Props = {
  visible: boolean;
  targetUserId: string | null;
  targetUserName: string | null;
  onClose: () => void;
  onMuted?: () => void;
};

export function MuteModal({ visible, targetUserId, targetUserName, onClose, onMuted }: Props) {
  const colors = useColors();
  const { user } = useAuth();
  const [applying, setApplying] = useState(false);

  const applyMute = async (minutes: number, label: string) => {
    if (!targetUserId || !user) return;
    setApplying(true);
    const muteUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const { error } = await supabase.from("profiles").update({ muted_until: muteUntil }).eq("id", targetUserId);
    if (error) {
      setApplying(false);
      return Alert.alert("Error", error.message);
    }
    await supabase.from("notifications").insert({
      title: "🔇 You have been muted",
      message: `You have been muted for ${label} by a moderator.`,
      user_id: targetUserId,
    });
    setApplying(false);
    Alert.alert("Muted", `${targetUserName} has been muted for ${label}.`);
    onMuted?.();
    onClose();
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    title: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    closeBtn: { padding: 4 },
    subtitle: { fontSize: 13, color: colors.text2, fontFamily: "Inter_400Regular", marginBottom: 16 },
    durationBtn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 8, alignItems: "center" },
    durationText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={s.sheet}>
            <View style={s.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <VolumeX size={16} color={colors.orange} />
                <Text style={s.title}>Mute {targetUserName}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <X size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>
            <Text style={s.subtitle}>Select mute duration</Text>
            {applying ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              DURATIONS.map((d) => (
                <TouchableOpacity key={d.minutes} style={s.durationBtn} onPress={() => applyMute(d.minutes, d.label)}>
                  <Text style={s.durationText}>{d.label}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
