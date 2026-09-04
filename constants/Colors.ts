/**
 * Design tokens extracted from the Google Stitch mockups ("Stud" app).
 * These are Material Design 3 token names/values — only a LIGHT scheme was
 * provided by the designs, so `dark` currently mirrors `light`. Revisit once
 * a dark scheme is designed (do not invent values).
 *
 * `light`/`dark` below keep the shape the Expo Router template's
 * useColorScheme()/Themed.tsx expects (text/background/tint/tabIcon*).
 * `palette` exposes the full M3 token set for direct use in screens.
 */

export const palette = {
  primary: '#3525cd',
  onPrimary: '#ffffff',
  primaryContainer: '#4f46e5',
  onPrimaryContainer: '#dad7ff',
  primaryFixed: '#e2dfff',
  onPrimaryFixed: '#0f0069',
  primaryFixedDim: '#c3c0ff',
  onPrimaryFixedVariant: '#3323cc',

  secondary: '#5f5e5f',
  onSecondary: '#ffffff',
  secondaryContainer: '#e2dfe0',
  onSecondaryContainer: '#636263',
  secondaryFixed: '#e5e2e3',
  onSecondaryFixed: '#1b1b1c',
  secondaryFixedDim: '#c8c6c7',
  onSecondaryFixedVariant: '#474647',

  tertiary: '#7e3000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#a44100',
  onTertiaryContainer: '#ffd2be',
  tertiaryFixed: '#ffdbcc',
  onTertiaryFixed: '#351000',
  tertiaryFixedDim: '#ffb695',
  onTertiaryFixedVariant: '#7b2f00',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  background: '#fcf8ff',
  onBackground: '#1b1b24',

  surface: '#fcf8ff',
  onSurface: '#1b1b24',
  surfaceVariant: '#e4e1ee',
  onSurfaceVariant: '#464555',
  surfaceBright: '#fcf8ff',
  surfaceDim: '#dcd8e5',
  surfaceTint: '#4d44e3',

  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f2ff',
  surfaceContainer: '#f0ecf9',
  surfaceContainerHigh: '#eae6f4',
  surfaceContainerHighest: '#e4e1ee',

  outline: '#777587',
  outlineVariant: '#c7c4d8',

  inverseSurface: '#302f39',
  inverseOnSurface: '#f3effc',
  inversePrimary: '#c3c0ff',

  // Semantic accents used ad-hoc across mockups (not formal M3 tokens, but
  // reused consistently for status pills etc.)
  success: '#146c2e',
  successContainer: '#e6f4ea',
  warning: '#a44100', // same as tertiary-container, used for "Approaching"/overtime pills
} as const;

const tintColorLight = palette.primary;
const tintColorDark = palette.primary;

export default {
  light: {
    text: palette.onBackground,
    background: palette.background,
    tint: tintColorLight,
    tabIconDefault: palette.outlineVariant,
    tabIconSelected: tintColorLight,
  },
  dark: {
    // TODO: no dark scheme was provided in the Stitch designs — mirrors
    // light for now so the app doesn't look broken in dark mode.
    text: palette.onBackground,
    background: palette.background,
    tint: tintColorDark,
    tabIconDefault: palette.outlineVariant,
    tabIconSelected: tintColorDark,
  },
};
