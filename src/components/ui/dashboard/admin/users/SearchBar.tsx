// src/components/ui/dashboard/admin/users/SearchBar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = useCallback(
        (term: string) => {
            const params = new URLSearchParams(searchParams);
            if (term) {
                params.set('search', term);
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.push(`?${params.toString()}`);
        },
        [router, searchParams],
    );

    return (
        <div className="relative">
            <input
                type="search"
                defaultValue={defaultValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
        </div>
    );
}
