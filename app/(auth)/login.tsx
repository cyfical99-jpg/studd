import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_EMPLOYEE_EMAIL, DEMO_MANAGER_EMAIL, DEMO_PASSWORD } from '@/services/seedData';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn(useEmail?: string, usePassword?: string) {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(useEmail ?? email, usePassword ?? password);
      // Root layout's Stack.Protected guards route us into the right
      // (employee)/(manager) group automatically once `user` is set.
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
            <AppText variant="displayXl" color={palette.primary}>
              Stud
            </AppText>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              Work around your life.
            </AppText>
          </View>

          <View style={styles.form}>
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
              autoComplete="password"
              placeholder="••••••••"
            />
            {error && (
              <AppText variant="caption" color={palette.error}>
                {error}
              </AppText>
            )}
            <Button label="Log In" onPress={() => handleSignIn()} disabled={submitting} />
          </View>

          <View style={styles.demoBlock}>
            <AppText variant="metadata" color={palette.onSurfaceVariant} style={styles.demoLabel}>
              Try it without an account
            </AppText>
            <View style={styles.demoRow}>
              <Button
                label="Demo: Employee"
                variant="secondary"
                onPress={() => handleSignIn(DEMO_EMPLOYEE_EMAIL, DEMO_PASSWORD)}
                disabled={submitting}
              />
              <Button
                label="Demo: Manager"
                variant="secondary"
                onPress={() => handleSignIn(DEMO_MANAGER_EMAIL, DEMO_PASSWORD)}
                disabled={submitting}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              New here?
            </AppText>
            <Link href="/(auth)/register" replace>
              <AppText variant="bodyMd" color={palette.primary}>
                Create an account
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
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: { alignItems: 'center', gap: spacing.base },
  form: { gap: spacing.md },
  demoBlock: { gap: spacing.sm },
  demoLabel: { textAlign: 'center', textTransform: 'uppercase' },
  demoRow: { flexDirection: 'row', gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
