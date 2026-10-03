import type { ID, PlanCode, PlanLimits, PlanFeatures } from './public';

/* ─── Tenant (internal view) ─── */
export type TenantStatus = 'pending_user' | 'active' | 'rejected' | 'suspended' | 'expired';

export interface Tenant {
  id: ID;
  name: string;
  slug: string;
  country: string;
  status: TenantStatus;
  planCode: PlanCode;
  branchMode: 'single' | 'multi';
  createdAt: string;
}

/* ─── Plan (internal view) ─── */
export interface Plan {
  code: PlanCode;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    interval: 'once' | 'month' | 'year';
  };
  limits: PlanLimits;
  features: PlanFeatures;
}

/* ─── User ─── */
export type UserStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface User {
  _id: ID;
  tenantId: ID;
  branchIds: ID[];
  fullName: string;
  email: string;
  phone: string | null;
  role: 'owner' | 'branch_manager' | 'cashier';
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  role: 'owner' | 'branch_manager' | 'cashier';
  branchId?: ID;
}

/* ─── Branch ─── */
export interface Branch {
  _id: ID;
  tenantId: ID;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  managerId: ID | null;
  isActive: boolean;
  createdAt: string;
}

export interface BranchPayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

/* ─── Customer ─── */
export interface Customer {
  _id: ID;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchaseAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/* ─── Drug ─── */
export type DrugForm =
  | 'tablet' | 'capsule' | 'syrup' | 'suspension'
  | 'injection' | 'cream' | 'ointment' | 'drops'
  | 'inhaler' | 'other';

export interface Drug {
  _id: ID;
  tenantId: ID;
  name: string;
  generic: string | null;
  brand: string | null;
  barcode: string | null;
  category: string | null;
  form: DrugForm;
  strength: string | null;
  unit: string;
  taxRate: number;
  reorderLevel: number;
  prescriptionRequired: boolean;
  controlled: boolean;
  imagePublicId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DrugPayload {
  name: string;
  generic?: string;
  brand?: string;
  barcode?: string;
  category?: string;
  form: DrugForm;
  strength?: string;
  unit?: string;
  taxRate?: number;
  reorderLevel?: number;
  prescriptionRequired?: boolean;
  controlled?: boolean;
  imagePublicId?: string;
  imageUrl?: string;
}

/* ─── Batch ─── */
export interface Batch {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  drugId: ID;
  lotNo: string | null;
  qty: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  supplierId: ID | null;
  receivedAt: string;
  createdAt: string;
}

export interface BatchPayload {
  lotNo?: string;
  qty: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  supplierId?: ID;
}

export type MovementType = 'in' | 'out' | 'adjust' | 'expired' | 'returned';

export interface StockMovement {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  drugId: ID;
  batchId: ID | null;
  type: MovementType;
  qty: number;
  ref: string | null;
  userId: ID | null;
  note: string | null;
  createdAt: string;
}

export interface StockAdjustPayload {
  drugId: ID;
  batchId?: ID;
  type: MovementType;
  qty: number;
  note?: string;
}

/* ─── Sale ─── */
export type SaleStatus = 'completed' | 'partially_refunded' | 'refunded' | 'voided';
export type SalePaymentMethod = 'cash' | 'mpesa' | 'card' | 'insurance';

export interface SaleItem {
  drugId: ID;
  batchId: ID;
  name: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SaleReturnItem {
  saleItemIndex: number;
  drugId: ID;
  batchId: ID;
  qty: number;
  refundAmount: number;
}

export interface SaleReturn {
  _id: ID;
  items: SaleReturnItem[];
  reason: string | null;
  refundAmount: number;
  processedBy: ID | null;
  processedAt: string | null;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  createdAt: string;
}

export interface Sale {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  invoiceNo: string;
  cashierId: ID;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: SalePaymentMethod;
  customerId: ID | null;
  patientId: ID | null;
  prescriptionId: ID | null;
  status: SaleStatus;
  returns: SaleReturn[];
  receiptPublicId: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface SalePayload {
  items: Array<{
    drugId: ID;
    batchId: ID;
    qty: number;
    unitPrice: number;
    discount?: number;
  }>;
  customerId?: ID;
  patientId?: ID;
  prescriptionId?: ID;
  paymentMethod: SalePaymentMethod;
  discount?: number;
  note?: string;
}

export interface RefundPayload {
  items: Array<{
    saleItemIndex: number;
    qty: number;
  }>;
  reason?: string;
  note?: string;
}

/* ─── Cart ─── */
export interface CartItem {
  drugId: ID;
  drugName: string;
  batchId: ID;
  lotNo: string | null;
  unitPrice: number;
  qty: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  expiryDate: string;
  availableQty: number;
}

/* ─── Patient ─── */
export type Gender = 'male' | 'female' | 'other';

export interface Patient {
  _id: ID;
  tenantId: ID;
  customerId: ID | null;
  name: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  gender: Gender | null;
  allergies: string[];
  chronicConditions: string[];
  insurance: Record<string, unknown>;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PatientPayload {
  name: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: Gender;
  allergies?: string[];
  chronicConditions?: string[];
  notes?: string;
}

/* ─── Prescription ─── */
export type PrescriptionStatus = 'pending' | 'dispensed' | 'partial' | 'cancelled';

export interface PrescriptionItem {
  drugId: ID;
  dosage: string | null;
  duration: string | null;
  qty: number;
  refills: number;
  notes: string | null;
}

export interface Prescription {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  patientId: ID;
  doctorId: ID | null;
  refNo: string | null;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  dispensedBy: ID | null;
  dispensedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PrescriptionPayload {
  patientId: ID;
  doctorId?: ID;
  refNo?: string;
  items: PrescriptionItem[];
  notes?: string;
}

/* ─── Doctor ─── */
export interface Doctor {
  _id: ID;
  tenantId: ID;
  name: string;
  licenseNo: string | null;
  phone: string | null;
  email: string | null;
  clinic: string | null;
  isActive: boolean;
}

/* ─── Supplier ─── */
export interface Supplier {
  _id: ID;
  tenantId: ID;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierPayload {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/* ─── Purchase Order ─── */
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  drugId: ID;
  qty: number;
  costPrice: number;
  total: number;
}

export interface PurchaseOrder {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  supplierId: ID;
  poNo: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdBy: ID | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface PurchaseOrderPayload {
  supplierId: ID;
  items: PurchaseOrderItem[];
  notes?: string;
}

export interface ReceivePayload {
  items: Array<{
    drugId: ID;
    qty: number;
    costPrice: number;
    sellingPrice: number;
    lotNo?: string;
    expiryDate: string;
  }>;
}

/* ─── Reports ─── */
export interface SalesSummary {
  total: number;
  count: number;
  averageBasket: number;
  currency: string;
}

export interface SalesRangePoint {
  date: string;
  total: number;
  count: number;
}

export interface TopDrug {
  name: string;
  qty: number;
  revenue: number;
}

export interface ExpiryLoss {
  totalLoss: number;
  items: Array<{
    drugName: string;
    lotNo: string | null;
    qty: number;
    costPrice: number;
    expiryDate: string;
    loss: number;
  }>;
}

export interface TaxReport {
  taxCollected: number;
  taxableAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

/* ─── Dashboard ─── */
export interface KpiCard {
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface DashboardSummary {
  salesToday: number;
  salesTodayCount: number;
  currency: string;
  lowStockCount: number;
  expiringSoonCount: number;
  newPatientsToday: number;
  kpis: KpiCard[];
  recentSales: Sale[];
}

/* ─── Notifications (in-app) ─── */
export type NotificationType =
  | 'info' | 'success' | 'warning' | 'error'
  | 'sale' | 'inventory' | 'prescription' | 'subscription' | 'system';

export interface AppNotification {
  _id: ID;
  tenantId: ID;
  userId: ID;
  branchId: ID | null;
  type: NotificationType;
  title: string;
  body: string | null;
  icon: string | null;
  link: string | null;
  meta: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

/* ─── AI ─── */
export type AiInsightType = 'weekly_insight' | 'stock_forecast' | 'expiry_risk' | 'reorder_suggestion';

export interface AiInsight {
  _id: ID;
  tenantId: ID;
  branchId: ID | null;
  type: AiInsightType;
  payload: { text: string; [k: string]: unknown };
  confidence: number | null;
  model: string | null;
  generatedAt: string;
  expiresAt: string | null;
}

export interface AiChatResponse {
  reply: string;
  model?: string;
}

export interface AiQuota {
  unlimited: boolean;
  used: number;
  max: number;
  remaining: number | null;
}

/* ─── Settings ─── */
export interface TenantSettings {
  currency: string;
  taxRate: number;
  taxInclusive: boolean;
  receiptHeader: string | null;
  receiptFooter: string | null;
  logoPublicId: string | null;
  logoUrl: string | null;
  aiEnabled: boolean;
  smsEnabled: boolean;
}

export interface UpdateSettingsPayload {
  currency?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  logoPublicId?: string;
  logoUrl?: string;
  aiEnabled?: boolean;
  smsEnabled?: boolean;
}

export interface UploadSignature {
  timestamp: number;
  signature: string;
  folder: string;
  public_id: string;
  resource_type: string;
  cloud_name: string;
  api_key: string;
  upload_preset: string;
}

/* ─── Billing ─── */
export interface BillingStatus {
  planCode: PlanCode;
  planName: string;
  status: 'active' | 'past_due' | 'expired' | 'cancelled' | 'perpetual';
  currency: string;
  amountMinor: number;
  periodStart: string | null;
  periodEnd: string | null;
  autoRenew: boolean;
  daysLeft: number | null;
}

export interface RenewPayload {
  planCode: PlanCode;
}

export interface StkPushPayload {
  phone: string;
}

export interface StkPushResponse {
  checkoutRequestId: string;
  message?: string;
}