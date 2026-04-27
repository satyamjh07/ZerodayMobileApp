import { Flag, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Hate speech",
  "Other",
];

type Props = {
  visible: boolean;
  type: "post" | "comment";
  targetId: string | null;
  onClose: () => void;
};

export function ReportModal({ visible, type, targetId, onClose }: Props) {
  const colors = useColors();
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !targetId) return;
    const reason = selectedReason === "Other" ? otherText.trim() : selectedReason;
    if (!reason) return Alert.alert("Select a reason", "Please choose or describe a reason.");

    setSubmitting(true);
    const payload: any = {
      reporter_id: user.id,
      reason,
      status: "pending",
    };
    if (type === "post") payload.post_id = targetId;
    else payload.comment_id = targetId;

    const { error } = await supabase.from("reports").insert(payload);
    setSubmitting(false);
    if (error) return Alert.alert("Error", error.message);

    Alert.alert("Reported", "Thank you. Our moderators will review this.");
    setSelectedReason(null);
    setOtherText("");
    onClose();
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    title: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    closeBtn: { padding: 4 },
    subtitle: { fontSize: 13, color: colors.text2, fontFamily: "Inter_400Regular", marginBottom: 16 },
    reasonBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
    reasonText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    dotInner: { width: 9, height: 9, borderRadius: 5 },
    otherInput: { backgroundColor: colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 12, minHeight: 60 },
    submitBtn: { backgroundColor: colors.red, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
    submitText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={s.sheet}>
            <View style={s.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Flag size={16} color={colors.red} />
                <Text style={s.title}>Report {type === "post" ? "Post" : "Comment"}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <X size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>
            <Text style={s.subtitle}>Why are you reporting this?</Text>

            {REASONS.map((r) => {
              const selected = selectedReason === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[s.reasonBtn, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}18` : "transparent" }]}
                  onPress={() => setSelectedReason(r)}
                >
                  <Text style={[s.reasonText, { color: selected ? colors.foreground : colors.text2 }]}>{r}</Text>
                  <View style={[s.dot, { borderColor: selected ? colors.primary : colors.text3 }]}>
                    {selected && <View style={[s.dotInner, { backgroundColor: colors.primary }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {selectedReason === "Other" && (
              <TextInput
                style={s.otherInput}
                placeholder="Describe the issue..."
                placeholderTextColor={colors.text3}
                value={otherText}
                onChangeText={setOtherText}
                multiline
              />
            )}

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>Submit Report</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
