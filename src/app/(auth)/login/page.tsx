'use client';

import LoginForm from '@/components/forms/login-form';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const searchParams = useSearchParams();

  const showRegistrationSuccess = searchParams?.get('registered') === 'true';

  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-6 space-y-6">
        {showRegistrationSuccess && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>
              Registration successful! Please login with your credentials.
            </AlertDescription>
          </Alert>
        )}

        <Suspense fallback={<div className="text-center">Loading...</div>}>
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
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Register
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
