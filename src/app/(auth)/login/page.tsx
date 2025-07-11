'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/features/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Loading fallback component for the login form
 * Provides accessible loading state while form is being loaded
 */
function LoginFormSkeleton() {
  return (
    <Card className="w-full">
      <div className="p-6 space-y-4">
        <div className="h-8 w-24 bg-muted rounded mx-auto" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </Card>
  );
}

/**
 * LoginPage component renders the main login interface
 *
 * Provides user authentication form with registration success messaging,
 * proper loading states, error boundaries, and navigation to signup.
 * Includes accessibility features and responsive design.
 *
 * @returns {JSX.Element} The complete login page
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const showRegistrationSuccess = searchParams?.get('registered') === 'true';

  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {showRegistrationSuccess && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>
              Registration successful! Please login with your credentials.
            </AlertDescription>
          </Alert>
        )}

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>

        <div className="text-center space-y-2">
          <Separator />
          <div className="flex items-center justify-center gap-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Register
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
