import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Input, FormField, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { authApi } from '@/api/axios';
import { isStrongPassword } from '@/utils/validators';

interface Props {
  navigation: any;
  route: { params: { token: string } };
}

export default function AcceptInvite({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { setSession } = useAuth();
  const token = route.params?.token ?? '';

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!token) {
      setError('Missing invitation token. Use the link from your email.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const strength = isStrongPassword(password);
    if (!strength.ok) {
      setError(`Password too weak: ${strength.reasons.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const session = await authApi.acceptInvite({
        token,
        password,
        fullName: fullName.trim() || undefined,
      });
      setSession(session);
    } catch (e: any) {
      setError(e?.message || 'Could not accept invitation');
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll keyboardAvoid>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Accept invitation
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Set up your account to continue
        </Text>
      </View>

      {error && <Alert variant="danger">{error}</Alert>}

      <FormField label="Full name">
        <Input
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          leftIcon={
            <Ionicons name="person-outline" size={16} color={theme.colors.textSubtle} />
          }
          editable={!submitting}
        />
      </FormField>

      <FormField
        label="Password"
        required
        hint="At least 8 characters with letters, numbers, and a symbol"
      >
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Enter a strong password"
          secureTextEntry={!showPass}
          autoCapitalize="none"
          leftIcon={
            <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textSubtle} />
          }
          rightIcon={
            <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={theme.colors.textSubtle}
              />
            </Pressable>
          }
          editable={!submitting}
        />
      </FormField>

      <FormField label="Confirm password" required>
        <Input
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat your password"
          secureTextEntry={!showPass}
          autoCapitalize="none"
          editable={!submitting}
        />
      </FormField>

      <Button
        title="Set password and continue"
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