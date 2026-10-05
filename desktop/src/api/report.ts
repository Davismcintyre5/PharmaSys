import axios from './axios';
import type {
  SalesSummary,
  SalesRangePoint,
  TopDrug,
  ExpiryLoss,
  TaxReport,
} from '@/types';

export const reportApi = {
  /* Sales */
  salesDaily: (params?: { date?: string }) =>
    axios.get<SalesSummary>('/app/reports/sales-daily', { params }),

  salesRange: (params: {
    from: string;
    to: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => axios.get<SalesRangePoint[]>('/app/reports/sales-range', { params }),

  topDrugs: (params?: { from?: string; to?: string; limit?: number }) =>
    axios.get<TopDrug[]>('/app/reports/top-drugs', { params }),

  /* Inventory */
  inventoryStock: () =>
    axios.get<{
      items: Array<{
        _id: string;
        name: string;
        generic: string | null;
        form: string;
        strength: string | null;
        unit: string;
        category: string | null;
        reorderLevel: number;
        qty: number;
        valueCost: number;
        valueSell: number;
        batches: number;
      }>;
      summary: {
        drugs: number;
        totalQty: number;
        totalValue: number;
        totalValueSell: number;
        outOfStock: number;
        lowStock: number;
      };
    }>('/app/reports/inventory-stock'),

  /* Customers */
  customersTop: (params?: { limit?: number }) =>
    axios.get<{
      items: Array<{
        _id: string;
        name: string;
        phone: string | null;
        email: string | null;
        loyaltyPoints: number;
        totalSpent: number;
        lastPurchaseAt: string | null;
        createdAt: string;
      }>;
      summary: {
        count: number;
        totalSpent: number;
        totalLoyaltyPoints: number;
        avgSpent: number;
      };
    }>('/app/reports/customers-top', { params }),

  /* Patients */
  patientsDemographics: () =>
    axios.get<{
      total: number;
      byGender: Record<string, number>;
      ageBands: Record<string, number>;
      withAllergies: number;
      withChronic: number;
      topVisits: Array<{
        patient: { _id: string; name: string; phone: string | null } | null;
        visits: number;
        total: number;
      }>;
      patients: Array<{
        _id: string;
        name: string;
        phone: string | null;
        gender: string | null;
        dob: string | null;
        allergies: string[];
        chronicConditions: string[];
        createdAt: string;
      }>;
    }>('/app/reports/patients-demographics'),

  /* Staff */
  staffSummary: () =>
    axios.get<{
      items: Array<{
        _id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: 'owner' | 'branch_manager' | 'cashier';
        status: string;
        branchIds: string[];
        lastLoginAt: string | null;
        createdAt: string;
        salesCount30d: number;
        salesTotal30d: number;
      }>;
      summary: {
        total: number;
        byRole: Record<string, number>;
        byStatus: Record<string, number>;
        activeLast7d: number;
      };
    }>('/app/reports/staff-summary'),

  /* General */
  expiryLoss: (params?: { from?: string; to?: string; days?: number }) =>
    axios.get<ExpiryLoss>('/app/reports/expiry-loss', { params }),

  tax: (params: { from: string; to: string }) =>
    axios.get<TaxReport>('/app/reports/tax', { params }),
};