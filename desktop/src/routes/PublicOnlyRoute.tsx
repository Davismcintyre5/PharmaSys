import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, scope, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (scope === 'active') return <Navigate to="/app/dashboard" replace />;
    if (scope === 'pending') return <Navigate to="/pending" replace />;
    // Authenticated but scope not resolved — err on pending
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}