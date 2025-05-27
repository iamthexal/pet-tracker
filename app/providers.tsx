// app\providers.tsx
'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/context/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  // Handle hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster />
    </AuthProvider>
  );
}