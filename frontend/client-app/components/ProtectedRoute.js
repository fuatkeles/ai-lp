import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { LoadingSpinner } from '@shared/components/ui/loading-spinner';

export default function ProtectedRoute({ children, requireAuth = true }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        router.push('/login');
      } else if (!requireAuth && user) {
        // Redirect to dashboard if user is logged in but trying to access public routes
        router.push('/');
      }
    }
  }, [user, loading, requireAuth, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children if auth requirements are not met
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return children;
}