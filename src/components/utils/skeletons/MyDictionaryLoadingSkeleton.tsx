import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for My Dictionary page
 *
 * Provides structured loading placeholders that match the actual content layout
 */
export function MyDictionaryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <Skeleton className="h-10 w-full" />

          {/* Filter row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Quick filters */}
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg">
            {/* Table header */}
            <div className="border-b p-4">
              <div className="grid grid-cols-7 gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border-b p-4 last:border-b-0">
                <div className="grid grid-cols-7 gap-4 items-center">
                  {/* Word column */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>

                  {/* Definition column */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>

                  {/* Status column */}
                  <Skeleton className="h-6 w-16 rounded-full" />

                  {/* Progress column */}
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>

                  {/* Mastery column */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>

                  {/* Last reviewed column */}
                  <Skeleton className="h-4 w-16" />

                  {/* Actions column */}
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex justify-center items-center gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
