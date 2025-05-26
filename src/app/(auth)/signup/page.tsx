import { SignupForm } from '@/components/features/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-md p-6 space-y-6">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
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
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Log In
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
