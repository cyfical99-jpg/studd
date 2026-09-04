import { Text, TextProps } from 'react-native';

import { typography, TypographyToken } from '@/constants/theme';

type Props = TextProps & {
  variant?: TypographyToken;
  color?: string;
};

/** Text bound to the Stitch typography scale (see constants/theme.ts). */
export function AppText({ variant = 'bodyMd', color, style, ...rest }: Props) {
  return <Text style={[typography[variant], color ? { color } : null, style]} {...rest} />;
}
