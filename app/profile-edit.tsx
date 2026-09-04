import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getConfiguredWeeklyLimit, setConfiguredWeeklyLimit } from '@/services/repositories/payrollRepo';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/Icon';
import { LabeledSlider } from '@/components/ui/LabeledSlider';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';

// Role/commute/break preferences aren't backed by a persisted entity yet
// (only the weekly-hour limit is, via payrollRepo) — kept as local UI state
// for now; a real "user preferences" table is a small follow-up once this
// matters for actual shift matching.
const DEFAULT_ROLES = [
  { id: 'hospitality', label: 'Hospitality', selected: true },
  { id: 'retail', label: 'Retail', selected: true },
  { id: 'customer_service', label: 'Customer Service', selected: false },
  { id: 'logistics', label: 'Logistics', selected: false },
];

export default function ProfileEditScreen() {
  const { user } = useAuth();
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(24);
  const [maxCommuteMiles, setMaxCommuteMiles] = useState(10);
  const [requireMinBreak, setRequireMinBreak] = useState(true);
  const [preferAfternoonBreaks, setPreferAfternoonBreaks] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getConfiguredWeeklyLimit(user.id).then(setMaxWeeklyHours);
  }, [user]);

  function toggleRole(id: string) {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  }

  async function handleSave() {
    if (!user) return;
    await setConfiguredWeeklyLimit(user.id, maxWeeklyHours);
    setSaved(true);
  }

  return (
    <View style={styles.flex}>
      <BackHeader title="Edit Profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            Role Preferences
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Select the industries you want to receive shifts for.
          </AppText>
          <View style={styles.chipsRow}>
            {roles.map((role) => (
              <Chip
                key={role.id}
                label={role.label}
                selected={role.selected}
                onPress={() => toggleRole(role.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <LabeledSlider
            label="Maximum Weekly Hours"
            value={maxWeeklyHours}
            onValueChange={setMaxWeeklyHours}
            minimumValue={5}
            maximumValue={40}
            formatValue={(v) => `${v}h`}
            minLabel="5h"
            maxLabel="40h"
          />

          <Card surface="containerLow" style={styles.disclaimerCard}>
            <Icon name="info" size={18} color={palette.onSurfaceVariant} style={styles.disclaimerIcon} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" color={palette.onSurface}>
                Work-hour limit tracker
              </AppText>
              <AppText variant="bodyMd" color={palette.onSurfaceVariant} style={styles.disclaimerText}>
                We&apos;ll flag shifts that would put you over the limit you set here. This is a
                tracking tool, not legal advice — you&apos;re responsible for confirming your own
                visa or work-permit conditions.
              </AppText>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <LabeledSlider
            label="Maximum Commute"
            value={maxCommuteMiles}
            onValueChange={setMaxCommuteMiles}
            minimumValue={1}
            maximumValue={25}
            formatValue={(v) => `${v} miles`}
            minLabel="1 mi"
            maxLabel="25 mi"
          />
        </View>

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            Break Preferences
          </AppText>
          <View style={styles.toggleList}>
            <ToggleRow
              title="Minimum 30-min break"
              subtitle="Required for shifts over 5 hours"
              value={requireMinBreak}
              onValueChange={setRequireMinBreak}
            />
            <ToggleRow
              title="Prefer afternoon breaks"
              subtitle="Prioritize 2PM - 4PM windows"
              value={preferAfternoonBreaks}
              onValueChange={setPreferAfternoonBreaks}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={saved ? 'Saved ✓' : 'Save Preferences'} icon="arrow_forward" onPress={handleSave} />
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Card style={styles.toggleRow}>
      <View style={{ gap: 2, flex: 1 }}>
        <AppText variant="caption" color={palette.onSurface}>
          {title}
        </AppText>
        <AppText variant="metadata" color={palette.onSurfaceVariant}>
          {subtitle}
        </AppText>
      </View>
      <ThemedSwitch value={value} onValueChange={onValueChange} />
    </Card>
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  disclaimerCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    lineHeight: 20,
  },
  toggleList: { gap: spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    padding: spacing.marginMobile,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.surfaceContainerHighest,
    backgroundColor: palette.surface,
  },
});
