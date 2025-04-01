'use client';

import { useSelector } from 'react-redux';

//import AcmeLogo from '@/app/ui/acme-logo';
import NavLinks from '@/components/ui/dashboard/nav-links';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import { NavLink } from '@/types/nav';
import Image from 'next/image';
import { RootState } from '@/lib/redux/store';

export default function SideNav({ links }: { links: NavLink[] }) {
    const user = useSelector((state: RootState) => state.auth.user);
    return (
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
            <div className="flex w-40 gap-6 mb-4  justify-start">
                {user?.profilePictureUrl ? (
                    <Image
                        className="h-10 w-10 rounded-full"
                        src={user?.profilePictureUrl || ''}
                        alt="profile picture"
                        width={40}
                        height={40}
                    />
                ) : (
                    <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                            {user?.name?.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="font-medium dark:text-white">
                    <div>{user?.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.role}
                    </div>
                </div>
            </div>
            <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
                <NavLinks links={links} />
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
