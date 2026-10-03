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
    return <Navigate to={scope === 'pending' ? '/pending' : '/app/dashboard'} replace />;
  }

  return <>{children}</>;
}