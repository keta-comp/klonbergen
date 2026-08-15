import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/LanguageContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PendingApproval from '@/components/auth/PendingApproval';

interface ProtectedRouteProps {
  allow: AppRole[];
  children: ReactNode;
}

/**
 * Role based access control gate.
 * Unauthorised visitors are sent to the public 404 page so that the very
 * existence of privileged areas (like the super admin panel) stays hidden.
 */
export default function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { loading, user, role, approved } = useAuth();
  const { locale } = useTranslation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to={`/${locale}/404`} replace />;
  if (!approved) return <PendingApproval />;
  if (!allow.includes(role)) return <Navigate to={`/${locale}/404`} replace />;

  return <>{children}</>;
}

