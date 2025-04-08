'use client';

import UserDictionaryTable from '@/components/ui/dashboard/dictionary/user-dictionary-table';
import { Suspense } from 'react';

/**
 * My Dictionary page component
 *
 * Displays a user's personal dictionary with the ability to view and sort their words
 */
export default function MyDictionaryPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-6">My Dictionary</h1>
      <div className="relative overflow-x-auto">
        {/* Table component for displaying user dictionary entries */}
        <Suspense fallback={<div>Loading...</div>}>
          <UserDictionaryTable />
        </Suspense>
      </div>
    </main>
  );
}
