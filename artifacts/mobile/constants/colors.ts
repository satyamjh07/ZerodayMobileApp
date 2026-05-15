export type ThemeName = "dark" | "light" | "ocean" | "forest" | "sunset" | "rose";

export type ColorPalette = {
  text: string;
  text2: string;
  text3: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  accentGlow: string;
  accentGrad: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  borderHover: string;
  input: string;
  surface2: string;
  surface3: string;
  cyan: string;
  green: string;
  orange: string;
  red: string;
  purple: string;
  gold: string;
  tint: string;
};

export const THEMES: Record<ThemeName, ColorPalette> = {
  dark: {
    text: "#e2e8f0",
    text2: "#94a3b8",
    text3: "#64748b",
    background: "#050508",
    foreground: "#ffffff",
    card: "rgba(13, 14, 24, 0.7)",
    cardForeground: "#ffffff",
    primary: "#7c3aed",
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#ffffff",
    muted: "#0f172a",
    mutedForeground: "#94a3b8",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
    accentGlow: "rgba(124, 58, 237, 0.15)",
    accentGrad: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(124, 58, 237, 0.3)",
    input: "rgba(255, 255, 255, 0.05)",
    surface2: "#0f111a",
    surface3: "#1a1d2e",
    cyan: "#22d3ee",
    green: "#22c55e",
    orange: "#f59e0b",
    red: "#ef4444",
    purple: "#a855f7",
    gold: "#eab308",
    tint: "#7c3aed",
  },
  light: {
    text: "#1e293b",
    text2: "#64748b",
    text3: "#94a3b8",
    background: "#f8fafc",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    primary: "#7c3aed",
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#0f172a",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#7c3aed",
    accentForeground: "#ffffff",
    accentGlow: "rgba(124, 58, 237, 0.1)",
    accentGrad: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "rgba(0, 0, 0, 0.08)",
    borderHover: "rgba(124, 58, 237, 0.2)",
    input: "rgba(0, 0, 0, 0.05)",
    surface2: "#f1f5f9",
    surface3: "#e2e8f0",
    cyan: "#0891b2",
    green: "#16a34a",
    orange: "#d97706",
    red: "#dc2626",
    purple: "#9333ea",
    gold: "#ca8a04",
    tint: "#7c3aed",
  },
  ocean: {
    text: "#e0f2fe",
    text2: "#7dd3fc",
    text3: "#38bdf8",
    background: "#020617",
    foreground: "#ffffff",
    card: "rgba(7, 14, 30, 0.8)",
    cardForeground: "#ffffff",
    primary: "#0ea5e9",
    primaryForeground: "#ffffff",
    secondary: "#0c4a6e",
    secondaryForeground: "#ffffff",
    muted: "#082f49",
    mutedForeground: "#7dd3fc",
    accent: "#0ea5e9",
    accentForeground: "#ffffff",
    accentGlow: "rgba(14, 165, 233, 0.2)",
    accentGrad: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
    destructive: "#f43f5e",
    destructiveForeground: "#ffffff",
    border: "rgba(14, 165, 233, 0.15)",
    borderHover: "rgba(14, 165, 233, 0.4)",
    input: "rgba(14, 165, 233, 0.1)",
    surface2: "#071422",
    surface3: "#0d2138",
    cyan: "#22d3ee",
    green: "#10b981",
    orange: "#f97316",
    red: "#ef4444",
    purple: "#818cf8",
    gold: "#fbbf24",
    tint: "#0ea5e9",
  },
  forest: {
    text: "#d1fae5",
    text2: "#6ee7b7",
    text3: "#34d399",
    background: "#022c22",
    foreground: "#ffffff",
    card: "rgba(6, 30, 25, 0.8)",
    cardForeground: "#ffffff",
    primary: "#10b981",
    primaryForeground: "#ffffff",
    secondary: "#064e3b",
    secondaryForeground: "#ffffff",
    muted: "#064e3b",
    mutedForeground: "#6ee7b7",
    accent: "#10b981",
    accentForeground: "#ffffff",
    accentGlow: "rgba(16, 185, 129, 0.2)",
    accentGrad: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    destructive: "#f43f5e",
    destructiveForeground: "#ffffff",
    border: "rgba(16, 185, 129, 0.15)",
    borderHover: "rgba(16, 185, 129, 0.4)",
    input: "rgba(16, 185, 129, 0.1)",
    surface2: "#061f1a",
    surface3: "#0b3d32",
    cyan: "#22d3ee",
    green: "#10b981",
    orange: "#f97316",
    red: "#ef4444",
    purple: "#a78bfa",
    gold: "#fbbf24",
    tint: "#10b981",
  },
  sunset: {
    text: "#ffedd5",
    text2: "#fdba74",
    text3: "#fb923c",
    background: "#2c1a0f",
    foreground: "#ffffff",
    card: "rgba(40, 20, 10, 0.8)",
    cardForeground: "#ffffff",
    primary: "#f97316",
    primaryForeground: "#ffffff",
    secondary: "#7c2d12",
    secondaryForeground: "#ffffff",
    muted: "#431407",
    mutedForeground: "#fdba74",
    accent: "#f97316",
    accentForeground: "#ffffff",
    accentGlow: "rgba(249, 115, 22, 0.2)",
    accentGrad: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "rgba(249, 115, 22, 0.15)",
    borderHover: "rgba(249, 115, 22, 0.4)",
    input: "rgba(249, 115, 22, 0.1)",
    surface2: "#251408",
    surface3: "#4a2c10",
    cyan: "#fb923c",
    green: "#84cc16",
    orange: "#f59e0b",
    red: "#ef4444",
    purple: "#c084fc",
    gold: "#fbbf24",
    tint: "#f97316",
  },
  rose: {
    text: "#ffe4e6",
    text2: "#fecdd3",
    text3: "#fb7185",
    background: "#2d0a12",
    foreground: "#ffffff",
    card: "rgba(45, 10, 20, 0.8)",
    cardForeground: "#ffffff",
    primary: "#f43f5e",
    primaryForeground: "#ffffff",
    secondary: "#881337",
    secondaryForeground: "#ffffff",
    muted: "#4c0519",
    mutedForeground: "#fecdd3",
    accent: "#f43f5e",
    accentForeground: "#ffffff",
    accentGlow: "rgba(244, 63, 94, 0.2)",
    accentGrad: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
    destructive: "#f97316",
    destructiveForeground: "#ffffff",
    border: "rgba(244, 63, 94, 0.15)",
    borderHover: "rgba(244, 63, 94, 0.4)",
    input: "rgba(244, 63, 94, 0.1)",
    surface2: "#250812",
    surface3: "#4a1020",
    cyan: "#fb7185",
    green: "#4ade80",
    orange: "#f97316",
    red: "#ef4444",
    purple: "#e879f9",
    gold: "#fbbf24",
    tint: "#f43f5e",
  },
};

const colors = {
  light: THEMES.dark, // Default to dark theme tokens
  radius: 12,
};

export default colors;

