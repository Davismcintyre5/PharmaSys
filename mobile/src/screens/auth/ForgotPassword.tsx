import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Input, FormField, Alert } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { authApi } from '@/api/axios';
import { isValidEmail } from '@/utils/validators';

interface Props {
  navigation: any;
}

export default function ForgotPassword({ navigation }: Props) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Check your inbox
          </Text>
        </View>

        <Alert variant="success" title="Email sent">
          If an account exists for {email}, a reset link is on the way.
        </Alert>

        <View style={styles.footer}>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>
              Back to sign in
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoid>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Forgot password
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          We'll send you a reset link
        </Text>
      </View>

      {error && <Alert variant="danger">{error}</Alert>}

      <FormField label="Email" required>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={
            <Ionicons name="mail-outline" size={16} color={theme.colors.textSubtle} />
          }
          editable={!submitting}
        />
      </FormField>

      <Button
        title="Send reset link"
        onPress={submit}
        loading={submitting}
        fullWidth
        size="lg"
      />

      <View style={styles.footer}>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>
            Back to sign in
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 32, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 6 },
  footer: { alignItems: 'center', marginTop: 24 },
  link: { fontSize: 14, fontWeight: '500' },
});