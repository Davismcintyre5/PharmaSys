import { reportApi } from '@/api/report';
import { customerApi } from '@/api/customer';
import { patientApi } from '@/api/patient';
import { inventoryApi } from '@/api/inventory';
import {
  formatMoney,
  formatDate,
  formatDateTime,
} from '@/utils/format';
import { roleLabel, paymentMethodLabel, drugFormLabel } from '@/utils/enums';
import type { ReportColumn, ReportKpi } from '@/utils/reportHtml';

/* ═════════════════════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════════════════════ */

export interface ReportFilters {
  from?: string;
  to?: string;
  date?: string;
  limit?: number;
  days?: number;
}

export interface ReportDef {
  title: string;
  category: 'inventory' | 'sales' | 'customers' | 'patients' | 'staff' | 'general';
  description: string;
  filterType: 'date-range' | 'date' | 'none' | 'days';
  fetcher: (filters: ReportFilters) => Promise<any>;
  buildKpis?: (data: any, filters: ReportFilters) => ReportKpi[];
  buildColumns: (data: any) => ReportColumn<any>[];
  buildRows: (data: any) => any[];
  buildTotals?: (data: any) => Record<string, string>;
  filtersSummary?: (filters: ReportFilters) => string | undefined;
  orientation?: 'landscape' | 'portrait';
}

/* ═════════════════════════════════════════════════════════════════
   Shared defaults
   ═════════════════════════════════════════════════════════════════ */

function defaultRange(filters: ReportFilters) {
  const to = filters.to || new Date().toISOString().slice(0, 10);
  const from =
    filters.from ||
    new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

function rangeSummary(filters: ReportFilters): string | undefined {
  const { from, to } = defaultRange(filters);
  return `Range: ${formatDate(from)} → ${formatDate(to)}`;
}

/* ═════════════════════════════════════════════════════════════════
   The registry
   ═════════════════════════════════════════════════════════════════ */

export const REPORTS: Record<string, ReportDef> = {
  /* ─────────── INVENTORY ─────────── */

  'inventory/stock': {
    title: 'Stock on hand',
    category: 'inventory',
    description: 'Every drug and its current stock',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => reportApi.inventoryStock(),
    buildKpis: (data) => [
      { label: 'Drugs', value: String(data.summary.drugs) },
      { label: 'Total units', value: data.summary.totalQty.toLocaleString() },
      { label: 'Out of stock', value: String(data.summary.outOfStock) },
      { label: 'Low stock', value: String(data.summary.lowStock) },
    ],
    buildColumns: () => [
      { label: 'Drug', accessor: 'name' },
      { label: 'Generic', accessor: 'generic', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Form', accessor: 'form', format: (v) => drugFormLabel(String(v)) },
      { label: 'Strength', accessor: 'strength', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Qty', accessor: 'qty', align: 'right' },
      { label: 'Reorder', accessor: 'reorderLevel', align: 'right' },
      {
        label: 'Cost value',
        accessor: 'valueCost',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
      {
        label: 'Retail value',
        accessor: 'valueSell',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data.items,
    buildTotals: (data) => ({
      name: 'TOTAL',
      qty: data.summary.totalQty.toLocaleString(),
      valueCost: formatMoney(data.summary.totalValue, 'KES'),
      valueSell: formatMoney(data.summary.totalValueSell, 'KES'),
    }),
  },

  'inventory/valuation': {
    title: 'Stock valuation',
    category: 'inventory',
    description: 'Cost and retail value of current stock',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => reportApi.inventoryStock(),
    buildKpis: (data) => [
      { label: 'Total cost value', value: formatMoney(data.summary.totalValue, 'KES') },
      { label: 'Total retail value', value: formatMoney(data.summary.totalValueSell, 'KES') },
      {
        label: 'Potential margin',
        value: formatMoney(data.summary.totalValueSell - data.summary.totalValue, 'KES'),
      },
    ],
    buildColumns: () => [
      { label: 'Drug', accessor: 'name' },
      { label: 'Qty', accessor: 'qty', align: 'right' },
      {
        label: 'Cost value',
        accessor: 'valueCost',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
      {
        label: 'Retail value',
        accessor: 'valueSell',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
      {
        label: 'Margin',
        accessor: (r) => r.valueSell - r.valueCost,
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) =>
      data.items.filter((i: any) => i.qty > 0).sort((a: any, b: any) => b.valueCost - a.valueCost),
    buildTotals: (data) => ({
      name: 'TOTAL',
      qty: data.summary.totalQty.toLocaleString(),
      valueCost: formatMoney(data.summary.totalValue, 'KES'),
      valueSell: formatMoney(data.summary.totalValueSell, 'KES'),
      valueSell2: formatMoney(data.summary.totalValueSell - data.summary.totalValue, 'KES'),
    }),
  },

  'inventory/low-stock': {
    title: 'Low stock',
    category: 'inventory',
    description: 'Drugs at or below reorder level',
    filterType: 'none',
    fetcher: () => inventoryApi.drugs.lowStock(),
    buildKpis: (data) => [
      { label: 'Low stock items', value: String(data.length) },
      {
        label: 'Out of stock',
        value: String(data.filter((d: any) => (d.currentQty ?? 0) === 0).length),
      },
    ],
    buildColumns: () => [
      { label: 'Drug', accessor: 'name' },
      { label: 'Form', accessor: 'form', format: (v) => drugFormLabel(String(v)) },
      { label: 'Current qty', accessor: 'currentQty', align: 'right' },
      { label: 'Reorder level', accessor: 'reorderLevel', align: 'right' },
      {
        label: 'Gap',
        accessor: (r) => Math.max(0, (r.reorderLevel || 0) - (r.currentQty || 0)),
        align: 'right',
      },
    ],
    buildRows: (data) => data,
  },

  'inventory/expiring': {
    title: 'Expiring soon',
    category: 'inventory',
    description: 'Batches approaching expiry',
    filterType: 'days',
    fetcher: (filters) => inventoryApi.drugs.expiring({ days: filters.days ?? 30 }),
    buildKpis: (data) => {
      const totalValue = data.reduce(
        (s: number, b: any) => s + (b.qty || 0) * (b.costPrice || 0),
        0
      );
      return [
        { label: 'Batches', value: String(data.length) },
        { label: 'Value at risk', value: formatMoney(totalValue, 'KES') },
      ];
    },
    buildColumns: () => [
      { label: 'Drug', accessor: (r) => r.drugId?.name || '—' },
      { label: 'Lot', accessor: 'lotNo', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Qty', accessor: 'qty', align: 'right' },
      { label: 'Expiry', accessor: 'expiryDate', format: (v) => formatDate(String(v)) },
      {
        label: 'Value',
        accessor: (r) => (r.qty || 0) * (r.costPrice || 0),
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data,
    filtersSummary: (f) => `Window: next ${f.days ?? 30} days`,
  },

  /* ─────────── SALES ─────────── */

  'sales/daily': {
    title: 'Daily sales summary',
    category: 'sales',
    description: "Today's sales and transactions",
    filterType: 'date',
    fetcher: (filters) => reportApi.salesDaily({ date: filters.date }),
    buildKpis: (data) => [
      { label: 'Total sales', value: formatMoney(data.total, data.currency) },
      { label: 'Transactions', value: String(data.count) },
      { label: 'Average basket', value: formatMoney(data.averageBasket, data.currency) },
    ],
    buildColumns: () => [
      { label: 'Metric', accessor: 'label' },
      { label: 'Value', accessor: 'value', align: 'right' },
    ],
    buildRows: (data) => [
      { label: 'Total sales', value: formatMoney(data.total, data.currency) },
      { label: 'Transactions', value: String(data.count) },
      { label: 'Average basket', value: formatMoney(data.averageBasket, data.currency) },
    ],
    filtersSummary: (f) => `Date: ${formatDate(f.date || new Date().toISOString())}`,
  },

  'sales/range': {
    title: 'Sales range',
    category: 'sales',
    description: 'Sales over a chosen date range',
    filterType: 'date-range',
    orientation: 'landscape',
    fetcher: (filters) =>
      reportApi.salesRange({
        from: defaultRange(filters).from,
        to: defaultRange(filters).to,
        groupBy: 'day',
      }),
    buildKpis: (data) => {
      const total = data.reduce((s: number, r: any) => s + r.total, 0);
      const count = data.reduce((s: number, r: any) => s + r.count, 0);
      return [
        { label: 'Period total', value: formatMoney(total, 'KES') },
        { label: 'Transactions', value: String(count) },
        { label: 'Days', value: String(data.length) },
      ];
    },
    buildColumns: () => [
      { label: 'Date', accessor: 'date' },
      { label: 'Transactions', accessor: 'count', align: 'right' },
      {
        label: 'Total',
        accessor: 'total',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data,
    buildTotals: (data) => ({
      date: 'TOTAL',
      count: data.reduce((s: number, r: any) => s + r.count, 0).toLocaleString(),
      total: formatMoney(
        data.reduce((s: number, r: any) => s + r.total, 0),
        'KES'
      ),
    }),
    filtersSummary: rangeSummary,
  },

  'sales/top-drugs': {
    title: 'Top selling drugs',
    category: 'sales',
    description: 'Best sellers by units and revenue',
    filterType: 'date-range',
    fetcher: (filters) =>
      reportApi.topDrugs({
        from: defaultRange(filters).from,
        to: defaultRange(filters).to,
        limit: 50,
      }),
    buildKpis: (data) => [
      { label: 'Drugs sold', value: String(data.length) },
      {
        label: 'Units',
        value: data.reduce((s: number, d: any) => s + d.qty, 0).toLocaleString(),
      },
      {
        label: 'Revenue',
        value: formatMoney(
          data.reduce((s: number, d: any) => s + d.revenue, 0),
          'KES'
        ),
      },
    ],
    buildColumns: () => [
      { label: '#', accessor: (_row, index) => String((index ?? 0) + 1), align: 'right', width: '40px' },
      { label: 'Drug', accessor: 'name' },
      {
        label: 'Units sold',
        accessor: 'qty',
        align: 'right',
        format: (v) => Number(v).toLocaleString(),
      },
      {
        label: 'Revenue',
        accessor: 'revenue',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data,
    filtersSummary: rangeSummary,
  },

  'sales/by-method': {
    title: 'Sales by payment method',
    category: 'sales',
    description: 'Sales grouped by payment type',
    filterType: 'date-range',
    fetcher: async (filters) => {
      const { from, to } = defaultRange(filters);
      const sales = await import('@/api/sale').then((m) =>
        m.saleApi.list({ from, to })
      );
      const list = Array.isArray(sales) ? sales : ((sales as any).items ?? []);
      const byMethod: Record<string, { count: number; total: number }> = {};
      for (const s of list) {
        const m = s.paymentMethod;
        if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
        byMethod[m].count++;
        byMethod[m].total += s.grandTotal || 0;
      }
      return Object.entries(byMethod).map(([method, v]) => ({
        method,
        count: v.count,
        total: v.total,
      }));
    },
    buildKpis: (data) => [
      { label: 'Methods used', value: String(data.length) },
      {
        label: 'Total transactions',
        value: data.reduce((s: number, r: any) => s + r.count, 0).toLocaleString(),
      },
    ],
    buildColumns: () => [
      { label: 'Method', accessor: 'method', format: (v) => paymentMethodLabel(String(v)) },
      { label: 'Transactions', accessor: 'count', align: 'right' },
      {
        label: 'Total',
        accessor: 'total',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data,
    filtersSummary: rangeSummary,
  },

  /* ─────────── CUSTOMERS ─────────── */

  'customers/list': {
    title: 'Customer list',
    category: 'customers',
    description: 'All active customers',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => customerApi.list({}),
    buildKpis: (data) => [
      { label: 'Customers', value: String(data.length) },
      {
        label: 'Total lifetime spend',
        value: formatMoney(
          data.reduce((s: number, c: any) => s + (c.totalSpent || 0), 0),
          'KES'
        ),
      },
    ],
    buildColumns: () => [
      { label: 'Name', accessor: 'name' },
      { label: 'Phone', accessor: 'phone', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Email', accessor: 'email', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      {
        label: 'Lifetime spend',
        accessor: 'totalSpent',
        align: 'right',
        format: (v) => formatMoney(Number(v || 0), 'KES'),
      },
      { label: 'Loyalty pts', accessor: 'loyaltyPoints', align: 'right' },
      {
        label: 'Last purchase',
        accessor: 'lastPurchaseAt',
        format: (v) => (v ? formatDate(String(v)) : '—'),
      },
    ],
    buildRows: (data) => data,
  },

  'customers/top': {
    title: 'Top spenders',
    category: 'customers',
    description: 'Customers ranked by lifetime spend',
    filterType: 'none',
    fetcher: () => reportApi.customersTop({ limit: 100 }),
    buildKpis: (data) => [
      { label: 'Customers', value: String(data.summary.count) },
      { label: 'Total spend', value: formatMoney(data.summary.totalSpent, 'KES') },
      { label: 'Average spend', value: formatMoney(data.summary.avgSpent, 'KES') },
    ],
    buildColumns: () => [
      { label: '#', accessor: (_row, index) => String((index ?? 0) + 1), align: 'right', width: '40px' },
      { label: 'Name', accessor: 'name' },
      { label: 'Phone', accessor: 'phone', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      {
        label: 'Lifetime spend',
        accessor: 'totalSpent',
        align: 'right',
        format: (v) => formatMoney(Number(v || 0), 'KES'),
      },
      { label: 'Loyalty pts', accessor: 'loyaltyPoints', align: 'right' },
    ],
    buildRows: (data) => data.items,
    buildTotals: (data) => ({
      name: 'TOTAL',
      totalSpent: formatMoney(data.summary.totalSpent, 'KES'),
      loyaltyPoints: data.summary.totalLoyaltyPoints.toLocaleString(),
    }),
  },

  'customers/history': {
    title: 'Customer purchase history',
    category: 'customers',
    description: 'Recent purchases across all customers',
    filterType: 'date-range',
    fetcher: async (filters) => {
      const { from, to } = defaultRange(filters);
      const sales = await import('@/api/sale').then((m) =>
        m.saleApi.list({ from, to })
      );
      const list = Array.isArray(sales) ? sales : ((sales as any).items ?? []);
      return list.filter((s: any) => s.customerId);
    },
    buildKpis: (data) => [
      { label: 'Sales with customer', value: String(data.length) },
      {
        label: 'Total',
        value: formatMoney(
          data.reduce((s: number, x: any) => s + (x.grandTotal || 0), 0),
          'KES'
        ),
      },
    ],
    buildColumns: () => [
      { label: 'Invoice', accessor: 'invoiceNo', format: (v) => String(v) },
      {
        label: 'Date',
        accessor: 'createdAt',
        format: (v) => formatDateTime(String(v)),
      },
      {
        label: 'Customer',
        accessor: (r) =>
          typeof r.customerId === 'object' ? r.customerId?.name : '—',
      },
      {
        label: 'Total',
        accessor: 'grandTotal',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data,
    filtersSummary: rangeSummary,
  },

  /* ─────────── PATIENTS ─────────── */

  'patients/list': {
    title: 'Patient list',
    category: 'patients',
    description: 'All active patient records',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => patientApi.list({}),
    buildKpis: (data) => [
      { label: 'Patients', value: String(data.length) },
      {
        label: 'With allergies',
        value: String(data.filter((p: any) => p.allergies?.length).length),
      },
      {
        label: 'With chronic conditions',
        value: String(data.filter((p: any) => p.chronicConditions?.length).length),
      },
    ],
    buildColumns: () => [
      { label: 'Name', accessor: 'name' },
      { label: 'Phone', accessor: 'phone', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      {
        label: 'Gender',
        accessor: 'gender',
        format: (v) => (v ? String(v) : '—'),
      },
      {
        label: 'Allergies',
        accessor: (r) => (r.allergies?.length ? r.allergies.join(', ') : '—'),
      },
      {
        label: 'Chronic',
        accessor: (r) =>
          r.chronicConditions?.length ? r.chronicConditions.join(', ') : '—',
      },
      {
        label: 'Added',
        accessor: 'createdAt',
        format: (v) => formatDate(String(v)),
      },
    ],
    buildRows: (data) => data,
  },

  'patients/demographics': {
    title: 'Patient demographics',
    category: 'patients',
    description: 'Age and gender breakdown',
    filterType: 'none',
    fetcher: () => reportApi.patientsDemographics(),
    buildKpis: (data) => [
      { label: 'Total patients', value: String(data.total) },
      { label: 'With allergies', value: String(data.withAllergies) },
      { label: 'With chronic conditions', value: String(data.withChronic) },
    ],
    buildColumns: () => [
      { label: 'Category', accessor: 'label' },
      { label: 'Count', accessor: 'count', align: 'right' },
      {
        label: '%',
        accessor: 'pct',
        align: 'right',
        format: (v) => `${v}%`,
      },
    ],
    buildRows: (data) => {
      const out: Array<{ label: string; count: number; pct: number }> = [];
      const total = data.total || 1;
      for (const [k, v] of Object.entries(data.byGender)) {
        out.push({ label: `Gender · ${k}`, count: v as number, pct: Math.round(((v as number) / total) * 100) });
      }
      for (const [k, v] of Object.entries(data.ageBands)) {
        out.push({ label: `Age · ${k}`, count: v as number, pct: Math.round(((v as number) / total) * 100) });
      }
      return out;
    },
  },

  'patients/visits': {
    title: 'Patient visit history',
    category: 'patients',
    description: 'Most frequent visitors (last 30 days)',
    filterType: 'none',
    fetcher: () => reportApi.patientsDemographics(),
    buildKpis: (data) => [
      { label: 'Patients with visits', value: String(data.topVisits.length) },
    ],
    buildColumns: () => [
      { label: 'Patient', accessor: (r) => r.patient?.name || '—' },
      { label: 'Phone', accessor: (r) => r.patient?.phone || '—' },
      { label: 'Visits', accessor: 'visits', align: 'right' },
      {
        label: 'Total spent',
        accessor: 'total',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data.topVisits,
  },

  /* ─────────── STAFF ─────────── */

  'staff/list': {
    title: 'Staff list',
    category: 'staff',
    description: 'Every team member and role',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => reportApi.staffSummary(),
    buildKpis: (data) => [
      { label: 'Total staff', value: String(data.summary.total) },
      { label: 'Active (last 7d)', value: String(data.summary.activeLast7d) },
    ],
    buildColumns: () => [
      { label: 'Name', accessor: 'fullName' },
      { label: 'Email', accessor: 'email' },
      { label: 'Phone', accessor: 'phone', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Role', accessor: 'role', format: (v) => roleLabel(String(v)) },
      { label: 'Status', accessor: 'status' },
      {
        label: 'Last login',
        accessor: 'lastLoginAt',
        format: (v) => (v ? formatDate(String(v)) : 'Never'),
      },
    ],
    buildRows: (data) => data.items,
  },

  'staff/by-role': {
    title: 'Staff by role',
    category: 'staff',
    description: 'Headcount grouped by role',
    filterType: 'none',
    fetcher: () => reportApi.staffSummary(),
    buildKpis: (data) => [
      { label: 'Total', value: String(data.summary.total) },
      { label: 'Owners', value: String(data.summary.byRole.owner || 0) },
      { label: 'Managers', value: String(data.summary.byRole.branch_manager || 0) },
      { label: 'Cashiers', value: String(data.summary.byRole.cashier || 0) },
    ],
    buildColumns: () => [
      { label: 'Role', accessor: 'role' },
      { label: 'Count', accessor: 'count', align: 'right' },
    ],
    buildRows: (data) =>
      Object.entries(data.summary.byRole).map(([role, count]) => ({
        role: roleLabel(role),
        count,
      })),
  },

  'staff/activity': {
    title: 'Staff activity',
    category: 'staff',
    description: 'Logins and sales per cashier (last 30 days)',
    filterType: 'none',
    orientation: 'landscape',
    fetcher: () => reportApi.staffSummary(),
    buildKpis: (data) => [
      {
        label: 'Active last 7d',
        value: String(data.summary.activeLast7d),
      },
    ],
    buildColumns: () => [
      { label: 'Name', accessor: 'fullName' },
      { label: 'Role', accessor: 'role', format: (v) => roleLabel(String(v)) },
      { label: 'Status', accessor: 'status' },
      {
        label: 'Last login',
        accessor: 'lastLoginAt',
        format: (v) => (v ? formatDateTime(String(v)) : 'Never'),
      },
      { label: 'Sales (30d)', accessor: 'salesCount30d', align: 'right' },
      {
        label: 'Revenue (30d)',
        accessor: 'salesTotal30d',
        align: 'right',
        format: (v) => formatMoney(Number(v || 0), 'KES'),
      },
    ],
    buildRows: (data) => data.items,
  },

  /* ─────────── GENERAL ─────────── */

  'general/summary': {
    title: 'Business summary',
    category: 'general',
    description: 'High-level pharmacy overview',
    filterType: 'date-range',
    fetcher: async (filters) => {
      const { from, to } = defaultRange(filters);
      const [salesDaily, topDrugs, invStock, custTop] = await Promise.all([
        reportApi.salesDaily({ date: to }),
        reportApi.topDrugs({ from, to, limit: 10 }),
        reportApi.inventoryStock(),
        reportApi.customersTop({ limit: 10 }),
      ]);
      return { salesDaily, topDrugs, invStock, custTop, from, to };
    },
    buildKpis: (data) => [
      { label: "Today's sales", value: formatMoney(data.salesDaily.total, data.salesDaily.currency) },
      { label: 'Stock value', value: formatMoney(data.invStock.summary.totalValue, 'KES') },
      { label: 'Low stock', value: String(data.invStock.summary.lowStock) },
      { label: 'Top customers', value: String(data.custTop.summary.count) },
    ],
    buildColumns: () => [
      { label: 'Metric', accessor: 'label' },
      { label: 'Value', accessor: 'value', align: 'right' },
    ],
    buildRows: (data) => [
      { label: 'Sales today', value: formatMoney(data.salesDaily.total, data.salesDaily.currency) },
      { label: 'Transactions today', value: String(data.salesDaily.count) },
      { label: 'Average basket', value: formatMoney(data.salesDaily.averageBasket, data.salesDaily.currency) },
      { label: 'Total drugs in catalog', value: String(data.invStock.summary.drugs) },
      { label: 'Stock value (cost)', value: formatMoney(data.invStock.summary.totalValue, 'KES') },
      { label: 'Stock value (retail)', value: formatMoney(data.invStock.summary.totalValueSell, 'KES') },
      { label: 'Out of stock', value: String(data.invStock.summary.outOfStock) },
      { label: 'Low stock', value: String(data.invStock.summary.lowStock) },
      { label: 'Top drug', value: data.topDrugs[0]?.name || '—' },
      { label: 'Top customer', value: data.custTop.items[0]?.name || '—' },
    ],
    filtersSummary: rangeSummary,
  },

  'general/tax': {
    title: 'Tax report',
    category: 'general',
    description: 'Tax collected over a period',
    filterType: 'date-range',
    fetcher: (filters) => {
      const { from, to } = defaultRange(filters);
      return reportApi.tax({ from, to });
    },
    buildKpis: (data) => [
      { label: 'Tax collected', value: formatMoney(data.taxCollected, data.currency) },
      { label: 'Taxable amount', value: formatMoney(data.taxableAmount, data.currency) },
    ],
    buildColumns: () => [
      { label: 'Metric', accessor: 'label' },
      { label: 'Value', accessor: 'value', align: 'right' },
    ],
    buildRows: (data) => [
      { label: 'Tax collected', value: formatMoney(data.taxCollected, data.currency) },
      { label: 'Taxable amount', value: formatMoney(data.taxableAmount, data.currency) },
      { label: 'Period start', value: formatDate(data.periodStart) },
      { label: 'Period end', value: formatDate(data.periodEnd) },
    ],
    filtersSummary: rangeSummary,
  },

  'general/expiry-loss': {
    title: 'Expiry loss',
    category: 'general',
    description: 'Value lost to expiring stock',
    filterType: 'days',
    orientation: 'landscape',
    fetcher: (filters) => reportApi.expiryLoss({ days: filters.days ?? 30 }),
    buildKpis: (data) => [
      { label: 'Total loss', value: formatMoney(data.totalLoss, 'KES') },
      { label: 'Batches at risk', value: String(data.items.length) },
    ],
    buildColumns: () => [
      { label: 'Drug', accessor: 'drugName' },
      { label: 'Lot', accessor: 'lotNo', format: (v) => (v == null || v === '' ? '—' : String(v)) },
      { label: 'Qty', accessor: 'qty', align: 'right' },
      {
        label: 'Cost price',
        accessor: 'costPrice',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
      {
        label: 'Expiry',
        accessor: 'expiryDate',
        format: (v) => formatDate(String(v)),
      },
      {
        label: 'Loss',
        accessor: 'loss',
        align: 'right',
        format: (v) => formatMoney(Number(v), 'KES'),
      },
    ],
    buildRows: (data) => data.items,
    buildTotals: (data) => ({
      drugName: 'TOTAL LOSS',
      loss: formatMoney(data.totalLoss, 'KES'),
    }),
    filtersSummary: (f) => `Window: next ${f.days ?? 30} days`,
  },
};