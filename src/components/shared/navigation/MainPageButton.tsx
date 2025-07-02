'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ButtonMainPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthenticated = session?.user;

  const handleClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      signIn();
    }
  };

  return (
    <button
      type="button"
      className="text-gray-900 bg-gradient-to-r from-red-200 via-red-300 to-yellow-200 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
      onClick={handleClick}
    >
      Get Started
    </button>
  );
}
