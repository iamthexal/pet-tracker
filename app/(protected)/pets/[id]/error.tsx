// app/pets/[id]/error.tsx

'use client'
 
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          There was a problem loading the pet information.
        </p>
      </div>
      <Button
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  )
}