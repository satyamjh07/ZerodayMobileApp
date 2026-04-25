import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useColors } from "@/hooks/useColors";

type ThemedViewProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  card?: boolean;
};

export function ThemedView({ children, style, card }: ThemedViewProps) {
  const colors = useColors();
  return (
    <View style={[{ backgroundColor: card ? colors.card : colors.background }, style]}>
      {children}
    </View>
  );
}
