import { Suspense } from 'react'
import { NotesClient } from './notes-client'
import { Loading } from '@/components/ui/loading'

interface NotesPageProps {
  params: Promise<{ id: string }>
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<Loading />}>
      <NotesClient petId={id} />
    </Suspense>
  )
}

