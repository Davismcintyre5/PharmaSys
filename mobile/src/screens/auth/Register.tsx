import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Button,
  Input,
  FormField,
  Alert,
  Select,
} from '@/components/ui';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { publicApi } from '@/api/axios';
import { isValidEmail, isStrongPassword } from '@/utils/validators';
import { formatMoney } from '@/utils/format';
import { COUNTRIES } from '@/utils/constants';
import type { PublicPlan } from '@/types';

interface Props {
  navigation: any;
  route?: { params?: { plan?: string } };
}

export default function Register({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { register } = useAuth();

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('KE');
  const [password, setPassword] = useState('');
  const [planCode, setPlanCode] = useState(route?.params?.plan ?? '');

  useEffect(() => {
    publicApi.site
      .getPlans()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPlans(arr);
        if (!planCode && arr.length) {
          setPlanCode(arr[1]?.code ?? arr[0].code);
        }
      })
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setError(null);

    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    const strength = isStrongPassword(password);
    if (!strength.ok) {
      setError(`Password too weak: ${strength.reasons.join(', ')}`);
      return;
    }
    if (!planCode) {
      setError('Please choose a plan');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        country,
        password,
        planCode,
      });
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
      setSubmitting(false);
    }
  }

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: `${c.name} (${c.dialCode})`,
  }));

  return (
    <Screen scroll keyboardAvoid>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Create your account
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Start your pharmacy on PharmaSys
        </Text>
      </View>

      {error && <Alert variant="danger">{error}</Alert>}

      <View style={styles.form}>
        <FormField label="Pharmacy name" required>
          <Input
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Kilimani Pharmacy"
            leftIcon={
              <Ionicons name="business-outline" size={16} color={theme.colors.textSubtle} />
            }
            editable={!submitting}
          />
        </FormField>

        <FormField label="Your name" required>
          <Input
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Davis Okoth"
            leftIcon={
              <Ionicons name="person-outline" size={16} color={theme.colors.textSubtle} />
            }
            editable={!submitting}
          />
        </FormField>

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

        <FormField label="Phone">
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="0712345678"
            keyboardType="phone-pad"
            leftIcon={
              <Ionicons name="call-outline" size={16} color={theme.colors.textSubtle} />
            }
            editable={!submitting}
          />
        </FormField>

        <FormField label="Country">
          <Select
            value={country}
            options={countryOptions}
            onChange={setCountry}
            disabled={submitting}
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

        <FormField label="Choose a plan" required>
          {loadingPlans ? (
            <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
              Loading plans…
            </Text>
          ) : (
            <View style={styles.plans}>
              {plans.map((plan) => {
                const active = plan.code === planCode;
                const isFree = !plan.price.amount;
                return (
                  <Pressable
                    key={plan.code}
                    onPress={() => setPlanCode(plan.code)}
                    disabled={submitting}
                    style={[
                      styles.planCard,
                      {
                        borderColor: active
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: active
                          ? theme.colors.primary + '10'
                          : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planName,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.text,
                        },
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <Text
                      style={[
                        styles.planPrice,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {isFree
                        ? 'Free'
                        : `${formatMoney(plan.price.amount, plan.price.currency)}/${plan.price.interval}`}
                    </Text>
                    {plan.trialDays > 0 && (
                      <Text
                        style={[
                          styles.planTrial,
                          { color: theme.colors.success },
                        ]}
                      >
                        {plan.trialDays}-day trial
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </FormField>

        <Button
          title="Create account"
          onPress={submit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          Already have an account?{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
            Sign in
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 24, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 6 },
  form: { marginTop: 8 },
  hint: { fontSize: 13 },
  plans: { gap: 8 },
  planCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  planName: { fontSize: 15, fontWeight: '600' },
  planPrice: { fontSize: 13, marginTop: 2 },
  planTrial: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '600' },
});