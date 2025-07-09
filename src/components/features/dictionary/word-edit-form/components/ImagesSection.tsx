'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

interface ImagesSectionProps {
  isLoading: boolean;
}

export function ImagesSection({ isLoading }: ImagesSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="text-center p-8 border border-dashed rounded-md">
      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Images Management</h3>
      <p className="text-muted-foreground">
        Image management functionality will be implemented in a future update.
      </p>
    </div>
  );
}
