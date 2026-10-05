import { useAuth } from '@/context/AuthProvider';
import { useSite } from '@/context/SiteProvider';

interface ReceiptBrand {
  logoUrl: string;
  businessName: string;
  storeAddress: string | null;
  receiptHeader: string | null;
  receiptFooter: string | null;
  currency: string;
}

/**
 * Resolve the brand to print on receipts.
 * Priority: tenant settings → platform brand → hardcoded fallback.
 */
export function useReceiptBrand(): ReceiptBrand {
  const { tenant } = useAuth();
  const { brand } = useSite();

  const settings = tenant?.settings || {};

  return {
    logoUrl: settings.logoUrl || brand?.logoUrl || '/brand/logo.svg',
    businessName: tenant?.name || brand?.name || 'PharmaSys',
    storeAddress: settings.address || null,
    receiptHeader: settings.receiptHeader || null,
    receiptFooter: settings.receiptFooter || null,
    currency: settings.currency || 'KES',
  };
}