import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Input, FormField, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { isValidEmail } from '@/utils/validators';

interface Props {
  navigation: any;
}

export default function Login({ navigation }: Props) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e: any) {
      setError(e?.message || 'Sign in failed');
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll keyboardAvoid>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Sign in</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Welcome back to PharmaSys
        </Text>
      </View>

      {error && <Alert variant="danger">{error}</Alert>}

      <View style={styles.form}>
        <FormField label="Email" required>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            leftIcon={
              <Ionicons name="mail-outline" size={16} color={theme.colors.textSubtle} />
            }
            editable={!submitting}
          />
        </FormField>

        <FormField label="Password" required>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPass}
            autoComplete="password"
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

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgot}
        >
          <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
            Forgot password?
          </Text>
        </Pressable>

        <Button
          title="Sign in"
          onPress={submit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          Don't have an account?{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
            Create one
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 32, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 6 },
  form: { marginTop: 8 },
  forgot: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});