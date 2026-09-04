import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/ui/TextField';

type Props = {
  label: string;
  /** ISO date "YYYY-MM-DD" */
  value: string;
  onChange: (isoDate: string) => void;
  minimumDate?: Date;
};

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Native date picker on iOS/Android; a plain text field on web, where
 * @react-native-community/datetimepicker has no supported renderer. */
export function DateField({ label, value, onChange, minimumDate }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return <TextField label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />;
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={palette.onSurface}>
        {label}
      </AppText>
      <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
        <AppText variant="bodyMd" color={palette.onSurface}>
          {value || 'Select date...'}
        </AppText>
        <Icon name="calendar_today" size={20} color={palette.onSurfaceVariant} />
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          minimumDate={minimumDate}
          onChange={(_event, date) => {
            setShowPicker(Platform.OS === 'ios'); // iOS shows inline; Android is a modal that self-dismisses
            if (date) onChange(toIso(date));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.base },
  field: {
    height: 52,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
