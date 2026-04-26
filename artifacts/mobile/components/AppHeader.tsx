import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  showBell?: boolean;
  showBack?: boolean;
};

export function AppHeader({ title, subtitle, showBell = true, showBack = false }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        s.container,
        {
          paddingTop: Platform.OS === "android" ? 16 : insets.top + 8,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={s.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? <Text style={[s.subtitle, { color: colors.text2 }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {showBell && (
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={[s.bellBtn, { backgroundColor: colors.surface2 }]}
          hitSlop={8}
        >
          <Feather name="bell" size={18} color={colors.text2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  backBtn: { marginRight: 4 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  subtitle: { fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  bellBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
