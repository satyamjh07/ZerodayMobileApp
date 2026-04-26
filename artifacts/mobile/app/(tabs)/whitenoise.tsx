import { Audio } from "expo-av";
import { AppHeader } from "@/components/AppHeader";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { NoiseCard } from "@/components/NoiseCard";

const BUILT_IN_SOUNDS = [
  { id: "rain", name: "Rain", emoji: "🌧", url: "https://www.soundjay.com/nature/rain-02.mp3" },
  { id: "fire", name: "Campfire", emoji: "🔥", url: "https://www.soundjay.com/nature/camp-fire-1.mp3" },
  { id: "ocean", name: "Ocean Waves", emoji: "🌊", url: "https://www.soundjay.com/nature/waves-1.mp3" },
  { id: "wind", name: "Forest Wind", emoji: "🌲", url: "https://www.soundjay.com/nature/wind-in-trees-1.mp3" },
  { id: "cafe", name: "Cafe", emoji: "☕", url: "https://www.soundjay.com/human/coffee-shop-1.mp3" },
  { id: "keyboard", name: "Typing", emoji: "⌨️", url: "https://www.soundjay.com/computer/keyboard-typing-1.mp3" },
];

type SoundItem = {
  id: string;
  name: string;
  emoji: string;
  url: string;
};

export default function WhitenoiseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [adminSounds, setAdminSounds] = useState<SoundItem[]>([]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    loadAdminSounds();
  }, []);

  const loadAdminSounds = async () => {
    try {
      const { data: files } = await supabase.storage.from("whitenoise").list("admin", { limit: 20 });
      if (files) {
        const sounds: SoundItem[] = files.map((f) => {
          const { data: { publicUrl } } = supabase.storage.from("whitenoise").getPublicUrl(`admin/${f.name}`);
          return {
            id: `admin_${f.name}`,
            name: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            emoji: "🎵",
            url: publicUrl,
          };
        });
        setAdminSounds(sounds);
      }
    } catch {}
  };

  const allSounds = [...BUILT_IN_SOUNDS, ...adminSounds];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 67 + insets.top : insets.top + 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: colors.text2, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
    grid: { paddingHorizontal: 16, paddingTop: 16 },
    row: { flexDirection: "row", justifyContent: "space-between" },
  });

  return (
    <View style={styles.container}>
      <AppHeader title="WHITE NOISE" subtitle="Focus Ambient Sounds" />
      <FlatList
        data={allSounds}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        scrollEnabled={!!allSounds.length}
        renderItem={({ item }) => (
          <NoiseCard id={item.id} name={item.name} url={item.url} emoji={item.emoji} />
        )}
      />
    </View>
  );
}
