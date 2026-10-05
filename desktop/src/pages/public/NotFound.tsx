import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="text-6xl font-bold text-primary">404</div>
        <h1 className="mt-4 text-xl font-semibold text-text">Page not found</h1>
        <p className="mt-2 text-sm text-text-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/">
            <Button leftIcon={<Home size={14} />}>Back to home</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" leftIcon={<Search size={14} />}>
              Contact support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}