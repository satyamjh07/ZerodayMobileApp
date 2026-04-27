export type ThemeName = "dark" | "light" | "ocean" | "forest" | "sunset" | "rose";

export type ColorPalette = {
  text: string; tint: string; background: string; foreground: string;
  card: string; cardForeground: string; primary: string; primaryForeground: string;
  secondary: string; secondaryForeground: string; muted: string; mutedForeground: string;
  accent: string; accentForeground: string; destructive: string; destructiveForeground: string;
  border: string; input: string; surface2: string; surface3: string;
  cyan: string; green: string; orange: string; red: string; purple: string; gold: string;
  text2: string; text3: string;
};

export const THEMES: Record<ThemeName, ColorPalette> = {
  dark: {
    text: "#e8eaf6", tint: "#7c6fff", background: "#050508", foreground: "#e8eaf6",
    card: "#0c0d16", cardForeground: "#e8eaf6", primary: "#7c6fff", primaryForeground: "#ffffff",
    secondary: "#0d0e18", secondaryForeground: "#e8eaf6", muted: "#0d0e18", mutedForeground: "#6b7280",
    accent: "#7c6fff", accentForeground: "#ffffff", destructive: "#ff3b5c", destructiveForeground: "#ffffff",
    border: "rgba(124, 111, 255, 0.12)", input: "rgba(124, 111, 255, 0.12)",
    surface2: "#08090f", surface3: "#111220", cyan: "#00d4ff", green: "#00e5a0",
    orange: "#ff6b35", red: "#ff3b5c", purple: "#bd5dff", gold: "#ffd166", text2: "#6b7280", text3: "#3a3d52",
  },
  light: {
    text: "#1a1a2e", tint: "#6c5ce7", background: "#f5f5f8", foreground: "#1a1a2e",
    card: "#ffffff", cardForeground: "#1a1a2e", primary: "#6c5ce7", primaryForeground: "#ffffff",
    secondary: "#f0f0f5", secondaryForeground: "#1a1a2e", muted: "#f0f0f5", mutedForeground: "#6b7280",
    accent: "#6c5ce7", accentForeground: "#ffffff", destructive: "#e84393", destructiveForeground: "#ffffff",
    border: "rgba(108, 92, 231, 0.18)", input: "rgba(108, 92, 231, 0.1)",
    surface2: "#ececf5", surface3: "#e0e0ee", cyan: "#0097b2", green: "#00a878",
    orange: "#e8680a", red: "#e84393", purple: "#9b59b6", gold: "#d4a017", text2: "#6b7280", text3: "#9ca3af",
  },
  ocean: {
    text: "#cce7ff", tint: "#0ea5e9", background: "#03090f", foreground: "#cce7ff",
    card: "#071422", cardForeground: "#cce7ff", primary: "#0ea5e9", primaryForeground: "#ffffff",
    secondary: "#0a1928", secondaryForeground: "#cce7ff", muted: "#0a1928", mutedForeground: "#4b7a9f",
    accent: "#0ea5e9", accentForeground: "#ffffff", destructive: "#ff4f6d", destructiveForeground: "#ffffff",
    border: "rgba(14, 165, 233, 0.15)", input: "rgba(14, 165, 233, 0.12)",
    surface2: "#050e1a", surface3: "#0d1f33", cyan: "#22d3ee", green: "#10b981",
    orange: "#f97316", red: "#ff4f6d", purple: "#818cf8", gold: "#fbbf24", text2: "#4b7a9f", text3: "#254766",
  },
  forest: {
    text: "#d1fae5", tint: "#10b981", background: "#030a05", foreground: "#d1fae5",
    card: "#071510", cardForeground: "#d1fae5", primary: "#10b981", primaryForeground: "#ffffff",
    secondary: "#0a1f12", secondaryForeground: "#d1fae5", muted: "#0a1f12", mutedForeground: "#4a7a5f",
    accent: "#10b981", accentForeground: "#ffffff", destructive: "#f43f5e", destructiveForeground: "#ffffff",
    border: "rgba(16, 185, 129, 0.15)", input: "rgba(16, 185, 129, 0.12)",
    surface2: "#04100a", surface3: "#0c2016", cyan: "#06b6d4", green: "#34d399",
    orange: "#f97316", red: "#f43f5e", purple: "#a78bfa", gold: "#fbbf24", text2: "#4a7a5f", text3: "#1f4030",
  },
  sunset: {
    text: "#fff0e6", tint: "#f97316", background: "#0f0804", foreground: "#fff0e6",
    card: "#1c0f07", cardForeground: "#fff0e6", primary: "#f97316", primaryForeground: "#ffffff",
    secondary: "#251408", secondaryForeground: "#fff0e6", muted: "#251408", mutedForeground: "#8a5a3a",
    accent: "#f97316", accentForeground: "#ffffff", destructive: "#ef4444", destructiveForeground: "#ffffff",
    border: "rgba(249, 115, 22, 0.15)", input: "rgba(249, 115, 22, 0.12)",
    surface2: "#120a04", surface3: "#20100a", cyan: "#fb923c", green: "#84cc16",
    orange: "#f59e0b", red: "#ef4444", purple: "#c084fc", gold: "#fbbf24", text2: "#8a5a3a", text3: "#4a2c10",
  },
  rose: {
    text: "#ffe4e8", tint: "#f43f5e", background: "#0f0407", foreground: "#ffe4e8",
    card: "#1c080e", cardForeground: "#ffe4e8", primary: "#f43f5e", primaryForeground: "#ffffff",
    secondary: "#25080e", secondaryForeground: "#ffe4e8", muted: "#25080e", mutedForeground: "#8a3a4a",
    accent: "#f43f5e", accentForeground: "#ffffff", destructive: "#f97316", destructiveForeground: "#ffffff",
    border: "rgba(244, 63, 94, 0.15)", input: "rgba(244, 63, 94, 0.12)",
    surface2: "#120408", surface3: "#200810", cyan: "#fb7185", green: "#4ade80",
    orange: "#f97316", red: "#f97316", purple: "#e879f9", gold: "#fbbf24", text2: "#8a3a4a", text3: "#4a1020",
  },
};

const colors = {
  light: THEMES.dark,
  radius: 12,
};

export default colors;
