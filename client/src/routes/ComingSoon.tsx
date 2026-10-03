import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface ComingSoonProps {
  title?: string;
  back?: string;
}

export default function ComingSoon({ title, back = '/' }: ComingSoonProps) {
  const { pathname } = useLocation();
  const pageTitle = title || pathname.replace(/^\//, '').replace(/[-/]/g, ' ') || 'Page';

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">
      <EmptyState
        icon={<Construction size={22} />}
        title={`${pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)} — coming soon`}
        description="This screen is under construction. Check back shortly."
        action={
          <Button variant="outline" onClick={() => (window.location.href = back)}>
            Go back
          </Button>
        }
      />
    </div>
  );
}