import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { todayIso } from '@/lib/date';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';

type Props = {
  workplaceId: string;
  onCreated: () => void;
  onCancel: () => void;
};

export function AddShiftForm({ workplaceId, onCreated, onCancel }: Props) {
  const [roleTitle, setRoleTitle] = useState('');
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    workplacesRepo.getEmploymentsForWorkplace(workplaceId).then(async (employments) => {
      const rows = await Promise.all(
        employments.map(async (e) => ({ userId: e.userId, name: (await workplacesRepo.getUserById(e.userId))?.name ?? 'Unknown' }))
      );
      setTeam(rows);
    });
  }, [workplaceId]);

  async function handleSubmit() {
    if (!roleTitle.trim()) return;
    setSubmitting(true);
    try {
      await shiftsRepo.createShift({
        workplaceId,
        roleTitle: roleTitle.trim(),
        date,
        startTime,
        endTime,
        assignedUserId: assigneeId ?? undefined,
      });
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <TextField label="Role" value={roleTitle} onChangeText={setRoleTitle} placeholder="e.g. Barista" />
      <DateField label="Date" value={date} onChange={setDate} minimumDate={new Date()} />
      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <TextField label="Start (HH:mm)" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="End (HH:mm)" value={endTime} onChangeText={setEndTime} placeholder="17:00" />
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" color={palette.onSurface}>
          Assign to (optional — leave unassigned to publish it as open)
        </AppText>
        <View style={styles.chipsRow}>
          {team.map((t) => (
            <Chip
              key={t.userId}
              label={t.name}
              selected={assigneeId === t.userId}
              onPress={() => setAssigneeId((prev) => (prev === t.userId ? null : t.userId))}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" size="md" variant="secondary" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Create Shift" size="md" onPress={handleSubmit} disabled={submitting || !roleTitle.trim()} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
