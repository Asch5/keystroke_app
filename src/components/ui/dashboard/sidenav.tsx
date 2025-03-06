'use client';
import Link from 'next/link';

//import AcmeLogo from '@/app/ui/acme-logo';
import NavLinks from '@/components/ui/dashboard/nav-links';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

export default function SideNav() {
    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
            <Link
                className="mb-2 flex h-20 justify-center place-items-center rounded-md bg-blue-600 p-4 md:h-40 dark:bg-gray-800"
                href="/"
            >
                <div className="w-32 text-white md:w-40">
                    {/* <AcmeLogo /> */} Logo
                </div>
            </Link>
            <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
                <NavLinks />
                <div className="hidden h-auto w-full grow rounded-md bg-gray-50 dark:bg-gray-800  md:block"></div>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex justify-start place-items-center gap-1 py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                >
                    <PowerIcon className="w-6" />
                    <div className="hidden md:block">Sign Out</div>
                </button>
            </div>
        </div>
    );
}
