import { ColorValue, StyleProp, Text, TextStyle } from 'react-native';

import { materialSymbolsCodepoints } from '@/constants/materialSymbolsCodepoints';

export type IconName = keyof typeof materialSymbolsCodepoints;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
};

/**
 * Renders a Material Symbols Outlined glyph by name (same names used across
 * the Stitch mockups, e.g. "auto_awesome", "event_available").
 *
 * Known limitation: the bundled font is a variable font, but RN has no
 * stable cross-platform way to set its FILL axis per-glyph at runtime, so
 * every icon renders at the font's default instance (FILL 0 / outlined,
 * weight 400) — mockups that use the filled variant for an active/selected
 * state (`font-variation-settings: 'FILL' 1`) will show the outlined glyph
 * here instead. Revisit by bundling a second static FILL-1 font instance
 * under its own family name if that distinction becomes important.
 */
export function Icon({ name, size = 24, color = '#1b1b24', style }: IconProps) {
  const codepoint = materialSymbolsCodepoints[name];

  if (codepoint === undefined) {
    if (__DEV__) {
      console.warn(`Icon: unknown Material Symbols name "${name}"`);
    }
    return null;
  }

  return (
    <Text
      allowFontScaling={false}
      selectable={false}
      style={[
        {
          fontFamily: 'MaterialSymbolsOutlined',
          fontSize: size,
          color,
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        style,
      ]}
    >
      {String.fromCodePoint(codepoint)}
    </Text>
  );
}
