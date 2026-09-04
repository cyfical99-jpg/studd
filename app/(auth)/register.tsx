import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { TextField } from '@/components/ui/TextField';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Role>('employee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ email, password, name, role });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppText variant="headlineLgMobile" color={palette.onBackground}>
              How will you use Stud?
            </AppText>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              Choose your primary role. This will set up your default workspace.
            </AppText>
          </View>

          <View style={styles.cards}>
            <SelectableCard
              title="Student / Employee"
              description="Manage availability, view your shifts, track work hours, and monitor earnings."
              icon="school"
              iconBackgroundColor="rgba(79, 70, 229, 0.2)"
              iconColor={palette.primary}
              selected={role === 'employee'}
              onPress={() => setRole('employee')}
            />
            <SelectableCard
              title="Business / Manager"
              description="Create complex rosters, manage your workforce, and track labor costs."
              icon="storefront"
              iconBackgroundColor="rgba(226, 223, 224, 0.3)"
              iconColor={palette.onSecondaryContainer}
              selected={role === 'manager'}
              onPress={() => setRole('manager')}
            />
          </View>

          <View style={styles.form}>
            <TextField label="Full name" value={name} onChangeText={setName} placeholder="Alex Johnson" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 characters"
            />
            {error && (
              <AppText variant="caption" color={palette.error}>
                {error}
              </AppText>
            )}
            <Button label="Continue" icon="arrow_forward" onPress={handleSubmit} disabled={submitting} />
          </View>

          <View style={styles.footer}>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              Already have an account?
            </AppText>
            <Link href="/(auth)/login" replace>
              <AppText variant="bodyMd" color={palette.primary}>
                Log in
              </AppText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    flexGrow: 1,
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { gap: spacing.base },
  cards: { gap: spacing.md },
  form: { gap: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
