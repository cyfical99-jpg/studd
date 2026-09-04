/**
 * Spacing / typography / radius scale extracted from the Google Stitch
 * mockups' Tailwind config. Values are in density-independent pixels — use
 * them directly as RN style numbers (no rem conversion needed).
 */

export const spacing = {
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  gutter: 16,
  marginMobile: 20,
  lg: 24,
  xl: 32,
  marginDesktop: 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

// Font family: every screen used Inter exclusively. Loaded via
// @expo-google-fonts/inter in app/_layout.tsx as these exact family names —
// RN needs the specific weighted family (not `fontWeight`) to pick the right
// custom font file, so each token pins both.
export const typography = {
  displayXl: { fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 48, letterSpacing: -0.4 },
  headlineLg: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40, letterSpacing: -0.2 },
  headlineLgMobile: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  sectionSm: { fontFamily: 'Inter_600SemiBold', fontSize: 20, lineHeight: 28, letterSpacing: -0.1 },
  bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 18, lineHeight: 26 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  metadata: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
} as const;

export type TypographyToken = keyof typeof typography;
