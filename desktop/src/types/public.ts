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