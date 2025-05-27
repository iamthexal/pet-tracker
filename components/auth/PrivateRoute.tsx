//components\auth\PrivateRoute.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Loading } from '@/components/ui/loading';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const publicPaths = ['/signin', '/signup', '/reset-password'];

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !publicPaths.includes(pathname)) {
      router.push('/signin');
    }
  }, [user, isLoading, router, pathname]);

  // Don't render anything during initial hydration
  if (!isClient) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size={32} />
      </div>
    );
  }

  // Show children only if authenticated or on public path
  if (user || publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}