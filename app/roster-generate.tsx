import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h } from '@/lib/date';
import * as rosterRepo from '@/services/repositories/rosterRepo';
import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import type { RosterDraft, RosterDraftShift } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/ui/TextField';

type Step = 'config' | 'generating' | 'draft';

/** Next Monday, as an ISO date. */
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 1 ? 7 : ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function RosterGenerateScreen() {
  const { workplaceId } = useLocalSearchParams<{ workplaceId: string }>();
  const [step, setStep] = useState<Step>('config');
  const [roleTitle, setRoleTitle] = useState('Barista');
  const [weekStart] = useState(nextMonday());
  const [draft, setDraft] = useState<RosterDraft | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!workplaceId) return;
    workplacesRepo.getEmploymentsForWorkplace(workplaceId).then(async (employments) => {
      const entries = await Promise.all(
        employments.map(async (e) => [e.userId, (await workplacesRepo.getUserById(e.userId))?.name ?? 'Unknown'] as const)
      );
      setNames(Object.fromEntries(entries));
    });
  }, [workplaceId]);

  async function handleGenerate() {
    setStep('generating');
    // A short artificial delay — the generator below is a deterministic
    // rule-based algorithm (see rosterRepo.ts), not a live AI call, but a
    // beat of "thinking" reads better than an instant swap.
    const [generated] = await Promise.all([
      rosterRepo.generateDraft({ workplaceId, weekStart, roleTitle }),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    setDraft(generated);
    setStep('draft');
  }

  function removeShift(id: string) {
    if (!draft) return;
    const updated = { ...draft, shifts: draft.shifts.filter((s) => s.id !== id) };
    setDraft(updated);
    rosterRepo.saveDraftEdits(draft.id, updated.shifts);
  }

  async function handlePublish() {
    if (!draft) return;
    setPublishing(true);
    try {
      await rosterRepo.publishDraft(draft.id);
      router.back();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={styles.flex}>
      <BackHeader title="AI Roster Assistant" />
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'config' && (
          <>
            <View style={styles.introBlock}>
              <View style={styles.introIcon}>
                <Icon name="auto_awesome" size={28} color={palette.primary} />
              </View>
              <AppText variant="headlineLgMobile" color={palette.onSurface}>
                Let Stud draft your roster
              </AppText>
              <AppText variant="bodyMd" color={palette.onSurfaceVariant} style={styles.introCopy}>
                A rule-based assistant matches team availability, existing shifts, and each
                person&apos;s own hour limit for the week of {weekStart}. You review and can edit
                everything before anything goes live.
              </AppText>
            </View>
            <TextField label="Role to schedule" value={roleTitle} onChangeText={setRoleTitle} />
            <Button label="Generate Draft" icon="auto_awesome" onPress={handleGenerate} disabled={!roleTitle.trim()} />
          </>
        )}

        {step === 'generating' && (
          <View style={styles.introBlock}>
            <View style={styles.introIcon}>
              <Icon name="progress_activity" size={28} color={palette.primary} />
            </View>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Building your draft…
            </AppText>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              Checking availability, existing shifts, and hour limits.
            </AppText>
          </View>
        )}

        {step === 'draft' && draft && (
          <>
            <View style={styles.headerRow}>
              <AppText variant="sectionSm" color={palette.onSurface}>
                Draft — week of {draft.weekStart}
              </AppText>
              <AppText variant="caption" color={palette.primary}>
                {draft.shifts.length} shifts
              </AppText>
            </View>

            {draft.shifts.length === 0 && (
              <Card>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  No one was available to fill any slots — check the team&apos;s availability, or add
                  shifts manually from the Roster tab.
                </AppText>
              </Card>
            )}

            {draft.shifts.map((shift: RosterDraftShift) => (
              <Card key={shift.id} style={{ gap: spacing.xs }}>
                <View style={styles.rowBetween}>
                  <AppText variant="caption" color={palette.onSurface}>
                    {shift.date} · {formatTime12h(shift.startTime)}–{formatTime12h(shift.endTime)}
                  </AppText>
                  {shift.aiSuggested && (
                    <View style={styles.aiChip}>
                      <Icon name="auto_awesome" size={12} color={palette.primary} />
                      <AppText variant="metadata" color={palette.primary}>
                        AI Choice
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText variant="bodyMd" color={palette.onSurface}>
                  {shift.assignedUserId ? (names[shift.assignedUserId] ?? '…') : 'Unassigned'}
                </AppText>
                {shift.aiReason && (
                  <AppText variant="metadata" color={palette.onSurfaceVariant}>
                    {shift.aiReason}
                  </AppText>
                )}
                <Button label="Remove" size="md" variant="secondary" onPress={() => removeShift(shift.id)} />
              </Card>
            ))}

            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <Button label="Regenerate" variant="secondary" onPress={handleGenerate} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Approve & Publish"
                  icon="check_circle"
                  onPress={handlePublish}
                  disabled={publishing || draft.shifts.length === 0}
                />
              </View>
            </View>
            <View style={styles.footnoteRow}>
              <Icon name="lock" size={14} color={palette.onSurfaceVariant} />
              <AppText variant="metadata" color={palette.onSurfaceVariant}>
                Nothing is scheduled or sent to employees until you tap Approve &amp; Publish.
              </AppText>
            </View>
          </>
        )}
      </ScrollView>
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
  introBlock: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  introCopy: { textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
});
