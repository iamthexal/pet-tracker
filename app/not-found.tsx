// app/not-found.tsx

import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-gray-600 mb-4">Could not find requested resource</p>
      <Link 
        href="/dashboard" 
        className="text-blue-500 hover:text-blue-700 underline"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}