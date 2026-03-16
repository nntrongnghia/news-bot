import { Navigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children, requireAdmin }: { children: ReactNode; requireAdmin?: boolean }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#141414]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && session.user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
