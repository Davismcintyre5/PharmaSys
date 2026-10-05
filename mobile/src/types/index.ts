export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type SortOrder = 'asc' | 'desc';

export type Currency =
  | 'KES'
  | 'UGX'
  | 'TZS'
  | 'NGN'
  | 'GHS'
  | 'ZAR'
  | 'USD'
  | string;

export type CountryCode =
  | 'KE'
  | 'UG'
  | 'TZ'
  | 'NG'
  | 'GH'
  | 'ZA'
  | string;

/* ──────────────────────────────────────────────────────────────
   Public / brand
   ────────────────────────────────────────────────────────────── */

export type ID = string;

export interface Brand {
  name: string;
  logoUrl: string | null;
  website: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  supportWhatsapp: string | null;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  dialCode: string;
}

export interface PublicSettings {
  defaultCurrency: string;
  defaultCountry: string;
  defaultTaxRate: number;
  registrationOpen: boolean;
  businessTypes: string[];
  countries: Country[];
  currencies: string[];
}

export type PlanInterval = 'once' | 'month' | 'year';
export type PlanCode = 'free' | 'starter' | 'pro' | 'business' | string;

export interface PlanPrice {
  amount: number;
  currency: string;
  interval: PlanInterval;
}

export interface PlanLimits {
  maxOwners: number;
  maxBranches: number;
  maxManagersPerBranch: number;
  maxCashiersPerBranch: number;
  maxProducts: number;
  maxTransactionsPerMonth: number;
  maxAiCallsPerDay: number;
  maxSmsPerMonth: number;
}

export interface PlanFeatures {
  aiInsights: boolean;
  multiBranch: boolean;
  api: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
  prescriptions: boolean;
  interactionCheck: boolean;
}

export interface PublicPlan {
  code: PlanCode;
  name: string;
  description: string;
  price: PlanPrice;
  limits: PlanLimits;
  features: PlanFeatures;
  trialDays: number;
  sortOrder: number;
}

export type LegalType = 'terms' | 'privacy' | 'dpa' | 'refund' | 'aup';

export interface LegalSummary {
  type: LegalType;
  title: string;
  version: number;
  effectiveAt: string | null;
}

export interface LegalDoc extends LegalSummary {
  content: string;
}

export type DownloadPlatform = 'windows' | 'macos' | 'linux' | 'android' | 'ios';

export interface PublicDownload {
  id: string;
  name: string;
  type: DownloadPlatform;
  version: string;
  arch: string | null;
  link: string;
  size: string | null;
  minOS: string | null;
  releaseNotes: string | null;
}

export interface AiInfo {
  landingAi: boolean;
  clientAi: boolean;
  fileUpload: boolean;
  providers: Array<{ key: string; label: string }>;
  defaultProvider: string;
}

/* ──────────────────────────────────────────────────────────────
   Auth
   ────────────────────────────────────────────────────────────── */

export type Scope = 'active' | 'pending';
export type UserRole = 'owner' | 'branch_manager' | 'cashier';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  country?: string;
  password: string;
  planCode: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface AcceptInvitePayload {
  token: string;
  password: string;
  fullName?: string;
}

export interface ImpersonateExchangePayload {
  impToken: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: string;
  mustChangePassword?: boolean;
  branchIds?: string[];
}

export interface AuthTenantSettings {
  currency?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  address?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  logoPublicId?: string | null;
  logoUrl?: string | null;
  aiEnabled?: boolean;
  smsEnabled?: boolean;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug?: string;
  status: string;
  planCode: PlanCode;
  settings?: AuthTenantSettings;
}

export interface AuthPlan {
  code: PlanCode;
  name: string;
  limits: PlanLimits;
  features: PlanFeatures;
}

export interface AuthSession {
  user: AuthUser;
  tenant: AuthTenant;
  plan: AuthPlan | null;
  scope: Scope;
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: AuthUser;
  tenant: AuthTenant;
  plan: AuthPlan | null;
  scope: Scope;
}

/* ──────────────────────────────────────────────────────────────
   Invoices + payments
   ────────────────────────────────────────────────────────────── */

export interface PublicInvoiceItem {
  name: string;
  description?: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentInstructionRecipient {
  [key: string]: string | null;
}

export interface PaymentInstruction {
  code: string;
  mode: 'auto' | 'manual';
  title: string;
  description?: string | null;
  steps?: string[];
  recipient?: PaymentInstructionRecipient;
  action?: {
    type: 'stk' | 'stripe';
    label: string;
    phoneField?: boolean;
  };
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoicePurpose = 'registration' | 'renewal' | 'upgrade' | 'sale';

export interface PublicInvoice {
  invoiceNumber: string;
  purpose?: InvoicePurpose;
  planCode?: string | null;
  customerSnapshot: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: PublicInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  notes?: string | null;
  paymentInstructions?: PaymentInstruction[];
}

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
  limits?: PlanLimits | null;
  features?: PlanFeatures | null;
}

export interface PendingInvoice {
  invoiceNumber: string;
  purpose: InvoicePurpose;
  planCode: PlanCode | null;
  items: PublicInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueDate: string | null;
  notes?: string | null;
  paymentInstructions?: PaymentInstruction[];
}

export interface RenewPayload {
  planCode: PlanCode;
}

export interface RenewResponse {
  activated?: boolean;
  amount?: number;
  periodEnd?: string;
  invoiceNumber?: string;
  purpose?: InvoicePurpose;
  planCode?: PlanCode;
  items?: PublicInvoiceItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  amountDue?: number;
  currency?: string;
  status?: InvoiceStatus;
  dueDate?: string;
  issuedAt?: string;
  paymentInstructions?: PaymentInstruction[];
  cycle?: 'once' | 'month' | 'year';
  isUpgrade?: boolean;
}

export interface StkPushResponse {
  checkoutRequestId: string;
  message?: string;
}

export interface ChatInfo {
  enabled: boolean;
  greeting: string;
  disclaimer: string;
  defaultProvider: string;
}

export interface ChatReply {
  reply: string;
  fallback: boolean;
}

/* ──────────────────────────────────────────────────────────────
   Tenant / user / branch
   ────────────────────────────────────────────────────────────── */

export type TenantStatus =
  | 'pending_user'
  | 'active'
  | 'rejected'
  | 'suspended'
  | 'expired';

export interface Tenant {
  id: ID;
  name: string;
  slug: string;
  country: string;
  status: TenantStatus;
  planCode: PlanCode;
  branchMode: 'single' | 'multi';
  createdAt: string;
  settings?: TenantSettings;
}

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

export type UserStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface User {
  _id: ID;
  tenantId: ID;
  branchIds: ID[];
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  branchId?: ID;
}

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

/* ──────────────────────────────────────────────────────────────
   Customers
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Inventory
   ────────────────────────────────────────────────────────────── */

export type DrugForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'suspension'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'drops'
  | 'inhaler'
  | 'other';

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
  currentQty?: number;
  totalQtyAllBranches?: number;
  lastSellingPrice?: number;
  lastCostPrice?: number;
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

export interface Batch {
  _id: ID;
  tenantId: ID;
  branchId: ID;
  drugId: ID | Drug;
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
  costPrice?: number;
  sellingPrice?: number;
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

/* ──────────────────────────────────────────────────────────────
   Sales
   ────────────────────────────────────────────────────────────── */

export type SaleStatus =
  | 'completed'
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

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
  branchId:
    | ID
    | {
        _id: ID;
        name: string;
        code?: string;
        address: string | null;
        phone: string | null;
      };
  invoiceNo: string;
  cashierId:
    | ID
    | {
        _id: ID;
        fullName: string;
        email?: string;
      };
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: SalePaymentMethod;
  customerId:
    | ID
    | {
        _id: ID;
        name: string;
        phone?: string | null;
        email?: string | null;
      }
    | null;
  patientId:
    | ID
    | {
        _id: ID;
        name: string;
        phone?: string | null;
      }
    | null;
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
    batchId?: ID;
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

/* ──────────────────────────────────────────────────────────────
   Patients
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Prescriptions
   ────────────────────────────────────────────────────────────── */

export type PrescriptionStatus =
  | 'pending'
  | 'dispensed'
  | 'partial'
  | 'cancelled';

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
  patientId: ID | Patient;
  doctorId: ID | Doctor | null;
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

/* ──────────────────────────────────────────────────────────────
   Suppliers
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Purchase orders
   ────────────────────────────────────────────────────────────── */

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
  supplierId: ID | Supplier;
  poNo: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdBy: ID | null;
  sentAt: string | null;
  sentBy: ID | null;
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

/* ──────────────────────────────────────────────────────────────
   Reports
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Dashboard
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Notifications
   ────────────────────────────────────────────────────────────── */

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'sale'
  | 'inventory'
  | 'prescription'
  | 'subscription'
  | 'system';

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

/* ──────────────────────────────────────────────────────────────
   AI
   ────────────────────────────────────────────────────────────── */

export type AiInsightType =
  | 'weekly_insight'
  | 'stock_forecast'
  | 'expiry_risk'
  | 'reorder_suggestion';

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

/* ──────────────────────────────────────────────────────────────
   Settings
   ────────────────────────────────────────────────────────────── */

export interface TenantSettings {
  currency: string;
  taxRate: number;
  taxInclusive: boolean;
  address: string | null;
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
  address?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  logoPublicId?: string | null;
  logoUrl?: string | null;
  aiEnabled?: boolean;
  smsEnabled?: boolean;
}

export interface UploadSignature {
  timestamp: number;
  signature: string;
  folder: string;
  public_id: string;
  cloud_name: string;
  api_key: string;
}

export interface StkPushPayload {
  phone: string;
}