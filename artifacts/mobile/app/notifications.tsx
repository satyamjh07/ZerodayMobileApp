import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { supabase, Notification } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";

export default function NotificationsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 },
    cardBody: { fontSize: 13, color: colors.text2, lineHeight: 19, fontFamily: "Inter_400Regular" },
    cardDate: { fontSize: 11, color: colors.text3, marginTop: 6, fontFamily: "Inter_400Regular" },
    empty: { color: colors.text3, textAlign: "center", paddingVertical: 60, fontFamily: "Inter_400Regular", fontSize: 14 },
  });

  return (
    <View style={s.container}>
      <AppHeader title="NOTIFICATIONS" showBell={false} showBack />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={s.empty}>No notifications yet</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardBody}>{item.message}</Text>
              <Text style={s.cardDate}>
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
