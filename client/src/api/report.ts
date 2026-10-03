import axios from './axios';
import type { SalesSummary, SalesRangePoint, TopDrug, ExpiryLoss, TaxReport } from '@/types';

export const reportApi = {
  salesDaily: (params?: { date?: string }) =>
    axios.get<SalesSummary>('/app/reports/sales-daily', { params }),
  salesRange: (params: { from: string; to: string; groupBy?: 'day' | 'week' | 'month' }) =>
    axios.get<SalesRangePoint[]>('/app/reports/sales-range', { params }),
  topDrugs: (params?: { from?: string; to?: string; limit?: number }) =>
    axios.get<TopDrug[]>('/app/reports/top-drugs', { params }),
  expiryLoss: (params?: { from?: string; to?: string }) =>
    axios.get<ExpiryLoss>('/app/reports/expiry-loss', { params }),
  tax: (params: { from: string; to: string }) =>
    axios.get<TaxReport>('/app/reports/tax', { params }),
};