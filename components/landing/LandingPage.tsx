// components/landing/LandingPage.tsx

'use client';

import { useAuth } from '@/lib/context/auth-context';
import Link from 'next/link';
import { Activity, Calendar, Weight, Pill, ClipboardList, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <PawPrint className="h-12 w-12 text-blue-500" />,
      title: "Pet Profiles",
      description: "Create detailed profiles for all your pets, including photos, breed info, and medical history."
    },
    {
      icon: <Calendar className="h-12 w-12 text-green-500" />,
      title: "Appointment Tracking",
      description: "Never miss a vet visit with our appointment management system."
    },
    {
      icon: <Pill className="h-12 w-12 text-purple-500" />,
      title: "Medication Management",
      description: "Track medications, set reminders, and monitor treatment progress."
    },
    {
      icon: <Weight className="h-12 w-12 text-orange-500" />,
      title: "Weight Monitoring",
      description: "Track your pet&apos;s weight over time with visual charts and trends."
    },
    {
      icon: <Activity className="h-12 w-12 text-red-500" />,
      title: "Health Records",
      description: "Keep all your pet&apos;s health records in one secure place."
    },
    {
      icon: <ClipboardList className="h-12 w-12 text-indigo-500" />,
      title: "Feeding Schedules",
      description: "Manage feeding times and track dietary requirements."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-white border-b fixed w-full z-50">
        <div className="px-8 h-16 flex items-center justify-between">
          {/* Logo - Left side with no max-width constraint */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <PawPrint className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">PetLogger</span>
            </Link>
          </div>
          
          {/* Navigation Links - Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/signin" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <Button 
                    className="ml-4" 
                    variant="default"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content wrapper - Added margin-top for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Keep track of your</span>
                <span className="block text-blue-600">pet&apos;s health journey</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                The complete solution for managing your pet&apos;s health records, appointments, medications, and more - all in one place.
              </p>
              {!user && (
                <div className="mt-5 max-w-md mx-auto flex justify-center gap-4 md:mt-8">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/signin">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Everything you need to manage your pet&apos;s health
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Comprehensive tools to keep your pets healthy and happy.
              </p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-blue-200">Start managing your pet&apos;s health today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              {user ? (
                <div className="inline-flex rounded-md shadow">
                  <Link href="/dashboard">
                    <Button size="lg" variant="secondary">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="inline-flex rounded-md shadow">
                  <Link href="/signup">
                    <Button size="lg" variant="secondary">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-base text-gray-400">
                &copy; {new Date().getFullYear()} PetLogger. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}