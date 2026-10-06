import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Card,
  Alert,
  Spinner,
  Button,
  Divider,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { publicApi } from '@/api/axios';
import { formatMoney, formatDate } from '@/utils/format';
import type { PublicInvoice } from '@/types';

interface Props {
  navigation: any;
  route: { params: { invoiceNumber: string } };
}

export default function Invoice({ navigation, route }: Props) {
  const { theme } = useTheme();
  const invoiceNumber = route.params?.invoiceNumber ?? '';

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceNumber) {
      setError('Missing invoice number');
      setLoading(false);
      return;
    }

    publicApi.invoices
      .getByNumber(invoiceNumber)
      .then((data) => setInvoice(data))
      .catch((e) => setError(e?.message || 'Invoice not found'))
      .finally(() => setLoading(false));
  }, [invoiceNumber]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Spinner size="large" />
        </View>
      </Screen>
    );
  }

  if (error || !invoice) {
    return (
      <Screen scroll>
        <Alert variant="danger">{error ?? 'Invoice not found.'}</Alert>
        <View style={styles.footer}>
          <Button
            title="Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </Screen>
    );
  }

  const isPaid = invoice.status === 'paid';
  const instructions = invoice.paymentInstructions ?? [];

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isPaid
                ? theme.colors.success + '15'
                : theme.colors.primary + '15',
            },
          ]}
        >
          <Ionicons
            name={isPaid ? 'checkmark-circle' : 'receipt-outline'}
            size={28}
            color={isPaid ? theme.colors.success : theme.colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Invoice {invoice.invoiceNumber}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {isPaid ? 'Paid' : 'Awaiting payment'}
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            Billed to
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {invoice.customerSnapshot?.name ?? '—'}
          </Text>
        </View>
        {invoice.issuedAt && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Issued
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatDate(invoice.issuedAt)}
            </Text>
          </View>
        )}
        {invoice.dueDate && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Due
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatDate(invoice.dueDate)}
            </Text>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        {invoice.items.map((item, i) => (
          <View key={i} style={styles.lineItem}>
            <View style={styles.lineLeft}>
              <Text style={[styles.lineName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text
                  style={[styles.lineDesc, { color: theme.colors.textSubtle }]}
                >
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.lineQty, { color: theme.colors.textMuted }]}>
                Qty {item.qty}
              </Text>
            </View>
            <Text style={[styles.lineTotal, { color: theme.colors.text }]}>
              {formatMoney(item.subtotal, invoice.currency)}
            </Text>
          </View>
        ))}

        <Divider style={styles.divider} />

        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            Subtotal
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {formatMoney(invoice.subtotal, invoice.currency)}
          </Text>
        </View>

        {invoice.discount > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Discount
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              -{formatMoney(invoice.discount, invoice.currency)}
            </Text>
          </View>
        )}

        {invoice.tax > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              Tax
            </Text>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatMoney(invoice.tax, invoice.currency)}
            </Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.text }]}>
            {formatMoney(invoice.total, invoice.currency)}
          </Text>
        </View>

        {!isPaid && (
          <View style={styles.totalRow}>
            <Text
              style={[styles.totalLabel, { color: theme.colors.warning }]}
            >
              Amount due
            </Text>
            <Text
              style={[styles.totalValue, { color: theme.colors.warning }]}
            >
              {formatMoney(invoice.amountDue, invoice.currency)}
            </Text>
          </View>
        )}
      </Card>

      {isPaid && (
        <Alert variant="success">
          Paid{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ''}
        </Alert>
      )}

      {!isPaid && instructions.length > 0 && (
        <View style={styles.instructions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            How to pay
          </Text>

          {instructions.map((inst) => {
            const isStk = inst.code === 'mpesa_stk';
            const steps = inst.steps ?? [];
            const recipientEntries = inst.recipient
              ? Object.entries(inst.recipient).filter(
                  ([, v]) => v !== null && v !== undefined && v !== ''
                )
              : [];

            return (
              <Card key={inst.code} style={styles.payCard}>
                <Text style={[styles.payTitle, { color: theme.colors.text }]}>
                  {inst.title}
                </Text>
                {inst.description ? (
                  <Text
                    style={[styles.payDesc, { color: theme.colors.textMuted }]}
                  >
                    {inst.description}
                  </Text>
                ) : null}

                {isStk && (
                  <Text
                    style={[styles.payHint, { color: theme.colors.textMuted }]}
                  >
                    Open the PharmaSys app to send the STK push from your phone.
                  </Text>
                )}

                {!isStk && recipientEntries.length > 0 && (
                  <View style={styles.recipient}>
                    {recipientEntries.map(([k, v]) => (
                      <Text
                        key={k}
                        style={[
                          styles.recipientLine,
                          { color: theme.colors.text },
                        ]}
                      >
                        <Text style={{ color: theme.colors.textMuted }}>
                          {k}:{' '}
                        </Text>
                        {String(v)}
                      </Text>
                    ))}
                  </View>
                )}

                {!isStk && steps.length > 0 && (
                  <View style={styles.steps}>
                    {steps.map((s, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.stepLine,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {i + 1}. {s}
                      </Text>
                    ))}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {invoice.notes ? (
        <Text style={[styles.notes, { color: theme.colors.textMuted }]}>
          {invoice.notes}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button
          title="Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '500' },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  lineLeft: { flex: 1, paddingRight: 12 },
  lineName: { fontSize: 14, fontWeight: '500' },
  lineDesc: { fontSize: 11, marginTop: 2 },
  lineQty: { fontSize: 11, marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '600' },
  divider: { marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: 15, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '700' },
  instructions: { gap: 12, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  payCard: { marginBottom: 0 },
  payTitle: { fontSize: 14, fontWeight: '600' },
  payDesc: { fontSize: 12, marginTop: 4 },
  payHint: { fontSize: 12, marginTop: 8 },
  recipient: { marginTop: 8, gap: 4 },
  recipientLine: { fontSize: 12 },
  steps: { marginTop: 8, gap: 4 },
  stepLine: { fontSize: 12 },
  notes: { fontSize: 12, marginTop: 8 },
  footer: { marginTop: 24, marginBottom: 32 },
});