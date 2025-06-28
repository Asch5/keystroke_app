import React from 'react';

import { checkRole } from '@/core/lib/auth/checkRole';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import for better code splitting
const AdminDictionaryPageContent = dynamic(
  () =>
    import(
      '@/components/features/admin/dictionary/AdminDictionaryPageContent'
    ).then((mod) => ({ default: mod.AdminDictionaryPageContent })),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    ),
  },
);

/**
 * Admin dictionaries page - main dictionary management interface
 * Refactored to use modular components following Cursor Rules for maintainability
 * Enhanced with performance optimizations and dynamic imports
 */
export default async function AdminDictionariesPage() {
  // checkRole handles authorization and redirects internally if unauthorized
  await checkRole(['admin']);

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <AdminDictionaryPageContent />
      </Suspense>
    </div>
  );
}
