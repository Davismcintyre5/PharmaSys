export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PharmaSys';

export const CURRENCIES = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
] as const;

export const COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'KES', dialCode: '+254' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', dialCode: '+256' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', dialCode: '+255' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', dialCode: '+233' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', dialCode: '+27' },
] as const;

export const DRUG_FORMS = [
  'tablet', 'capsule', 'syrup', 'suspension',
  'injection', 'cream', 'ointment', 'drops',
  'inhaler', 'other',
] as const;

export const SALE_PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'insurance'] as const;

export const ROLES = ['owner', 'branch_manager', 'cashier'] as const;

export const GENDERS = ['male', 'female', 'other'] as const;

export const NOTIFICATION_TYPES = [
  'info', 'success', 'warning', 'error',
  'sale', 'inventory', 'prescription', 'subscription', 'system',
] as const;

export const MOVEMENT_TYPES = ['in', 'out', 'adjust', 'expired', 'returned'] as const;

export const SALE_STATUSES = ['completed', 'partially_refunded', 'refunded', 'voided'] as const;

export const PRESCRIPTION_STATUSES = ['pending', 'dispensed', 'partial', 'cancelled'] as const;

export const PURCHASE_ORDER_STATUSES = ['draft', 'ordered', 'received', 'cancelled'] as const;

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const STORAGE_KEYS = {
  theme: 'theme',
  refreshToken: 'pharmasys_refresh',
  activeBranch: 'pharmasys_active_branch',
  cookieConsent: 'pharmasys_cookie_consent',
  impersonation: 'pharmasys_imp',
} as const;