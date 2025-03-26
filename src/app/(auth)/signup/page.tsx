import SignupForm from '@/components/ui/signup-form';
import Link from 'next/link';
import { Suspense } from 'react';
export default function SignupPage() {
    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative sflex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <h1 className="text-2xl font-bold text-center mb-5">
                    Register
                </h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <SignupForm />
                </Suspense>
                <div className="flex flex-row items-center justify-start gap-2 pt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Already have an account?{' '}
                    </p>
                    <svg
                        className="w-4 h-4 text-gray-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                    </svg>
                    <Link
                        href="/login"
                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        </main>
    );
}
