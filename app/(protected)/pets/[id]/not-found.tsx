// app/pets/[id]/not-found.tsx

import Link from 'next/link'
import { Button } from "@/components/ui/button"
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Pet Not Found</h2>
        <p className="text-muted-foreground">
          Could not find the requested pet.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          Return to Dashboard
        </Link>
      </Button>
    </div>
  )
}