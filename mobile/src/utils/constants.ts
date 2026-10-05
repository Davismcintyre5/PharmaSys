import { ENV } from './env';

export const APP_NAME = ENV.APP_NAME;
export const APP_VERSION = ENV.APP_VERSION;

export const STORAGE_KEYS = {
  token: 'token',
  refreshToken: 'pharmasys_refresh',
  user: 'user',
  theme: 'theme',
  activeBranch: 'pharmasys_active_branch',
  cookieConsent: 'pharmasys_cookie_consent',
} as const;

export const DRUG_CATEGORIES = [
  'Analgesics',
  'Antibiotics',
  'Antimalarials',
  'Antivirals',
  'Antifungals',
  'Antihistamines',
  'Antiseptics',
  'Cardiovascular',
  'Dermatological',
  'Diabetes',
  'Gastrointestinal',
  'Herbal & Supplements',
  'Ophthalmic',
  'Respiratory',
  'Vaccines',
  'Vitamins & Minerals',
  'Other',
] as const;

export const DRUG_FORMS = [
  'tablet',
  'capsule',
  'syrup',
  'suspension',
  'injection',
  'cream',
  'ointment',
  'drops',
  'inhaler',
  'other',
] as const;

export const DRUG_FORM_LABELS: Record<string, string> = {
  tablet: 'Tablet',
  capsule: 'Capsule',
  syrup: 'Syrup',
  suspension: 'Suspension',
  injection: 'Injection',
  cream: 'Cream',
  ointment: 'Ointment',
  drops: 'Drops',
  inhaler: 'Inhaler',
  other: 'Other',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: 'Stock in',
  out: 'Stock out',
  adjust: 'Adjustment',
  expired: 'Expired',
  returned: 'Returned',
};

export const EXPIRY_THRESHOLDS = {
  critical: 7,
  warning: 30,
} as const;

export const SALE_PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'insurance'] as const;
export const ROLES = ['owner', 'branch_manager', 'cashier'] as const;

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