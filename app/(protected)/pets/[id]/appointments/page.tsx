// app/pets/[id]/appointments/page.tsx

import { Suspense } from 'react';
import { AppointmentsClient } from './appointments-client';
import { Loading } from '@/components/ui/loading';

interface AppointmentsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={<Loading />}>
      <AppointmentsClient petId={resolvedParams.id} />
    </Suspense>
  );
}
