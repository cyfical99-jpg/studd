import { Switch, SwitchProps } from 'react-native';

import { palette } from '@/constants/Colors';

/** RN Switch pre-themed to the app's primary color. */
export function ThemedSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={{ false: palette.surfaceContainerHighest, true: palette.primary }}
      thumbColor="#ffffff"
      ios_backgroundColor={palette.surfaceContainerHighest}
      {...props}
    />
  );
}
