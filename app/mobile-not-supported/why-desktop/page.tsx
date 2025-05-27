'use client';

import { ArrowLeft, Smile } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WhyDesktopPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="flex flex-col items-center">
          <Smile className="h-12 w-12 text-blue-500 mb-4" />
          <CardTitle className="text-2xl font-bold">
            Why Desktop Only?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Hey there! 👋 I&apos;m a 25-year-old tech enthusiast who loves tinkering with technology in my free time. This pet logging website started as a personal project to manage my pets&apos; health and records. 
            </p>
            <p className="text-muted-foreground">
              I thought, &quot;Why not make it public?&quot; so here it is! 🐾 While I&apos;ve done my best to make this app functional, it&apos;s still a work-in-progress and may have a few bugs 🐛.
            </p>
            <p className="text-muted-foreground">
              For now, I&apos;ve optimized it for desktops and laptops to focus on the core features. Mobile support might come in the future, but for now, please use a larger screen for the best experience.
            </p>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mobile-not-supported'}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Mobile Info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}