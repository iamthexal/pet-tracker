// app/page.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui/loading';

const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Loading size={32} />
    </div>
  ),
  ssr: false,
});

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loading size={32} />
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  );
}