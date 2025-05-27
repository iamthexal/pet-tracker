// app/(protected)/pets/[id]/medications/page.tsx

import { Suspense } from 'react';
import { MedicationsClient } from './medications-client';
import { Loading } from '@/components/ui/loading';

interface MedicationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MedicationsPage({ params }: MedicationsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <MedicationsClient petId={id} />
    </Suspense>
  );
}