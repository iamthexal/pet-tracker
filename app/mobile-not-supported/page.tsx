// app/mobile-not-supported/page.tsx

'use client';

import { AlertTriangle, Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MobileNotSupportedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="flex flex-col items-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <CardTitle className="text-2xl font-bold">
            Mobile Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This application is not available on mobile devices. Please access it from a desktop or laptop computer for the best experience.
          </p>
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/mobile-not-supported/why-desktop'}
            >
              <Monitor className="mr-2 h-5 w-5" />
              Why Desktop Only?
            </Button>
    
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
