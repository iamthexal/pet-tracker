// app/pets/[id]/layout.tsx

import { Suspense } from 'react'
import PetOverviewLoading from './loading'

export default function PetOverviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<PetOverviewLoading />}>
      {children}
    </Suspense>
  )
}