import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { formatTime12h } from '@/lib/date';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/ui/TextField';

type Props = {
  /** "HH:MM" 24-hour */
  value: string;
  onChange: (hhmm: string) => void;
  style?: object;
};

function toDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function toHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Native time picker on iOS/Android; a plain "HH:MM" text field on web,
 * mirroring components/ui/DateField.tsx's platform split. */
export function TimeField({ value, onChange, style }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <TextField
        label=""
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        style={style}
      />
    );
  }

  return (
    <View style={style}>
      <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
        <AppText variant="bodyMd" color={palette.onSurface}>
          {formatTime12h(value)}
        </AppText>
        <Icon name="schedule" size={16} color={palette.onSurfaceVariant} />
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          is24Hour={false}
          onChange={(_event, date) => {
            setShowPicker(Platform.OS === 'ios');
            if (date) onChange(toHhmm(date));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 44,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
});
