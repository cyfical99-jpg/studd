import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { todayIso } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as timeOffRepo from '@/services/repositories/timeOffRepo';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';

const REASONS = ['Vacation', 'Sick Leave', 'Study / Exam Prep', 'Personal'];

export default function TimeOffRequestScreen() {
  const { user } = useAuth();
  const [reasonType, setReasonType] = useState(REASONS[0]);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      await timeOffRepo.create({ userId: user.id, startDate, endDate, reasonType, note: note.trim() || undefined });
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flex}>
      <BackHeader title="Request Time Off" />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          Request time away from your upcoming shifts.
        </AppText>

        <View style={styles.section}>
          <AppText variant="metadata" color={palette.primary} style={styles.eyebrow}>
            Reason
          </AppText>
          <View style={styles.chipsRow}>
            {REASONS.map((r) => (
              <Chip key={r} label={r} selected={reasonType === r} onPress={() => setReasonType(r)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="metadata" color={palette.primary} style={styles.eyebrow}>
            Dates
          </AppText>
          <DateField label="Starts" value={startDate} onChange={setStartDate} minimumDate={new Date()} />
          <DateField label="Ends" value={endDate} onChange={setEndDate} minimumDate={new Date(startDate)} />
        </View>

        <TextField
          label="Message to manager (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Add any context here..."
          multiline
          numberOfLines={3}
          style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.sm }}
        />

        <Button label="Submit Request" icon="send" onPress={handleSubmit} disabled={submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: { gap: spacing.sm },
  eyebrow: { textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
