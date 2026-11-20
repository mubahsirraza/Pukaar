export const colors = {
  primary: "#0F5132",
  secondary: "#228B45",
  accent: "#D4A017",
  terracotta: "#A3470C",

  background: "#F8F7F4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F0EEE8",

  text: "#1F2937",
  textSecondary: "#647067",
  textInverse: "#FFFFFF",

  border: "#E7E2D9",

  success: "#228B45",
  successBackground: "#E8F5EC",

  warning: "#D4A017",
  warningBackground: "#FFF5DB",

  error: "#DC2626",
  errorBackground: "#FEECEC",

  info: "#2563EB",
  infoBackground: "#EFF6FF",
} as const;

export type ColorName = keyof typeof colors;
