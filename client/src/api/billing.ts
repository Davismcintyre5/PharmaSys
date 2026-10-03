import axios from './axios';
import type { BillingStatus, PublicInvoice, StkPushResponse } from '@/types';

export const billingApi = {
  status: () => axios.get<BillingStatus>('/app/billing/status'),
  renew: (planCode: string) =>
    axios.post<{ invoiceNumber: string }>('/app/billing/renew', { planCode }),
  invoice: () => axios.get<PublicInvoice | null>('/app/billing/invoice'),
  stkPush: (phone: string) =>
    axios.post<StkPushResponse>('/app/billing/mpesa/stk', { phone }),
};