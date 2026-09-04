import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={palette.onSurface}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={palette.outline}
        style={[styles.input, !!error && styles.inputError, style]}
        {...rest}
      />
      {error && (
        <AppText variant="metadata" color={palette.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.base,
  },
  input: {
    height: 52,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    color: palette.onSurface,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  inputError: {
    borderColor: palette.error,
  },
});
