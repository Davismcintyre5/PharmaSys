import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { publicApi } from '@/api/public';
import { formatDate } from '@/utils/format';
import type { LegalDoc, LegalType } from '@/types/public';

const TITLES: Record<LegalType, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  dpa: 'Data Processing Agreement',
  refund: 'Refund Policy',
  aup: 'Acceptable Use Policy',
};

const cache = new Map<string, LegalDoc>();

export function LegalModal({
  open,
  onClose,
  type,
}: {
  open: boolean;
  onClose: () => void;
  type: LegalType | null;
}) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !type) return;
    if (cache.has(type)) {
      setDoc(cache.get(type)!);
      return;
    }
    setLoading(true);
    publicApi.site
      .getLegalByType(type)
      .then((data) => {
        cache.set(type, data);
        setDoc(data);
      })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [open, type]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type ? TITLES[type] : ''}
      size="xl"
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !doc ? (
        <p className="text-sm text-text-muted">Document not available.</p>
      ) : (
        <div>
          <p className="mb-4 text-xs text-text-subtle">
            Version {doc.version}
            {doc.effectiveAt ? ` · Effective ${formatDate(doc.effectiveAt)}` : ''}
          </p>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-text">
            {doc.content}
          </div>
        </div>
      )}
    </Modal>
  );
}