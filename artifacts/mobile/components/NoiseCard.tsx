import { Play, Square } from "lucide-react-native";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

type NoiseCardProps = {
  id: string;
  name: string;
  url: string;
  emoji: string;
};

export function NoiseCard({ id, name, url, emoji }: NoiseCardProps) {
  const colors = useColors();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const toggle = async () => {
    if (loading) return;
    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }
    setLoading(true);
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: url }, { isLooping: true, volume: 0.6 });
        soundRef.current = sound;
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch {}
    setLoading(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: isPlaying ? colors.primary : colors.border }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: isPlaying ? colors.primary : colors.surface2 }]}
        onPress={toggle}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isPlaying ? (
          <Square size={16} color="#fff" />
        ) : (
          <Play size={16} color={colors.text2} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
