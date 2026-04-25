import React from "react";
import { Text, TextStyle } from "react-native";

type GradientTextProps = {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
};

export function GradientText({ style, children }: GradientTextProps) {
  return <Text style={[{ color: "#7c6fff" }, style]}>{children}</Text>;
}
