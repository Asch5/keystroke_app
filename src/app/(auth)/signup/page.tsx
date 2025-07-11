import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { SignupForm } from '@/components/features/auth';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Loading fallback component for the signup form
 * Provides accessible loading state while form is being loaded
 */
function SignupFormSkeleton() {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-muted rounded mx-auto" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="grid md:grid-cols-2 md:gap-6 space-y-2 md:space-y-0">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="flex items-start space-x-2">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    </Card>
  );
}

/**
 * SignupPage component renders the main registration interface
 *
 * Provides user registration form with language selection, proper loading states,
 * and navigation to login page. Includes accessibility features and responsive design.
 *
 * @returns {JSX.Element} The complete signup page
 */
export default function SignupPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Join us to start your language learning journey
          </p>
        </div>

        <Suspense fallback={<SignupFormSkeleton />}>
          <SignupForm />
        </Suspense>

        <div className="text-center space-y-2">
          <Separator />
          <div className="flex items-center justify-center gap-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Log In
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
