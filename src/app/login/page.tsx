'use client';

import LoginForm from '@/components/ui/login-form';
import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const showRegistrationSuccess = searchParams.get('registered') === 'true';

    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative sflex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
                <h1 className="text-2xl font-bold text-center mb-5">Login</h1>

                {showRegistrationSuccess && (
                    <div
                        className="p-4 mb-5 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400"
                        role="alert"
                    >
                        Registration successful! Please login with your
                        credentials.
                    </div>
                )}

                <Suspense fallback={<div>Loading...</div>}>
                    <LoginForm />
                </Suspense>

                <div className="flex flex-row items-center justify-start gap-2 pt-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Don't have an account?{' '}
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
                        href="/signup"
                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </main>
    );
}
