'use client';

import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function ButtonMainPage() {
  const { data: session } = useSession();
  const isAuthenticated = session?.user;
  return (
    <button
      type="button"
      className="text-gray-900 bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      onClick={() => {
        if (isAuthenticated) {
          redirect('/dashboard');
        } else {
          signIn();
        }
      }}
    >
      Get Started
    </button>
  );
}
