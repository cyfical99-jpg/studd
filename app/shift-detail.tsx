import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import { getWorkplaceById } from '@/services/repositories/workplacesRepo';
import type { Shift, ShiftReleaseRequest } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextField } from '@/components/ui/TextField';

const STATUS_LABEL: Record<Shift['status'], string> = {
  draft: 'Draft',
  published: 'Open',
  awaiting_confirmation: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  requires_attention: 'Requires attention',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ShiftDetailScreen() {
  const { shiftId } = useLocalSearchParams<{ shiftId: string }>();
  const { user } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [workplaceName, setWorkplaceName] = useState('');
  const [releaseRequest, setReleaseRequest] = useState<ShiftReleaseRequest | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const shifts = await shiftsRepo.getAllShifts();
    const found = shifts.find((s) => s.id === shiftId) ?? null;
    setShift(found);
    if (found) {
      const workplace = await getWorkplaceById(found.workplaceId);
      setWorkplaceName(workplace?.name ?? 'Workplace');
      const requests = await shiftsRepo.getReleaseRequestsForWorkplace(found.workplaceId);
      setReleaseRequest(requests.find((r) => r.shiftId === found.id && r.status !== 'declined') ?? null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId]);

  if (!shift || !user) {
    return (
      <View style={styles.flex}>
        <BackHeader title="Shift Details" />
      </View>
    );
  }

  const isMine = shift.assignedUserId === user.id;
  const canRelease = isMine && (shift.status === 'confirmed' || shift.status === 'awaiting_confirmation') && !releaseRequest;

  async function handleConfirm() {
    setBusy(true);
    try {
      await shiftsRepo.confirmShift(shift!.id, user!.id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitRelease() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await shiftsRepo.requestRelease({ shiftId: shift!.id, userId: user!.id, reason: reason.trim() });
      setReleasing(false);
      setReason('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.flex}>
      <BackHeader title="Shift Details" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ gap: 2 }}>
              <AppText variant="headlineLgMobile" color={palette.onSurface}>
                {workplaceName}
              </AppText>
              <View style={styles.metaRow}>
                <Icon name="badge" size={18} color={palette.onSurfaceVariant} />
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  {shift.roleTitle}
                </AppText>
              </View>
            </View>
            <StatusPill
              label={STATUS_LABEL[shift.status]}
              tone={
                shift.status === 'confirmed' || shift.status === 'completed'
                  ? 'success'
                  : shift.status === 'requires_attention'
                    ? 'error'
                    : 'tertiary'
              }
              withDot
            />
          </View>
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <Row icon="calendar_today" label="Date" value={shift.date} />
          <Row icon="schedule" label="Time" value={`${formatTime12h(shift.startTime)} - ${formatTime12h(shift.endTime)}`} />
        </Card>

        {releaseRequest && (
          <Card surface="containerLow" style={{ gap: spacing.xs }}>
            <AppText variant="caption" color={palette.onSurface}>
              Release request
            </AppText>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              {releaseRequest.status === 'pending_manager_review'
                ? 'Waiting for your manager to review your request.'
                : releaseRequest.status === 'approved_open_for_claims'
                  ? 'Approved — this shift is open for a teammate to claim.'
                  : 'This shift has been filled by a teammate.'}
            </AppText>
          </Card>
        )}

        {isMine && shift.status === 'awaiting_confirmation' && (
          <Button label="Confirm Shift" onPress={handleConfirm} disabled={busy} />
        )}

        {canRelease && !releasing && (
          <Button label="Release This Shift" variant="secondary" icon="sync_alt" onPress={() => setReleasing(true)} />
        )}

        {releasing && (
          <Card style={{ gap: spacing.sm }}>
            <TextField
              label="Why can't you work this shift?"
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Exam clash, family emergency..."
              multiline
              numberOfLines={3}
              style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.sm }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" size="md" variant="secondary" onPress={() => setReleasing(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Send Request" size="md" onPress={handleSubmitRelease} disabled={busy || !reason.trim()} />
              </View>
            </View>
          </Card>
        )}

        {!isMine && (
          <Button
            label="Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={20} color={palette.onSurfaceVariant} />
      <AppText variant="metadata" color={palette.onSurfaceVariant}>
        {label}
      </AppText>
      <AppText variant="bodyMd" color={palette.onSurface} style={{ marginLeft: 'auto' }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerCard: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
