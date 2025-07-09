// src/components/ui/dashboard/admin/users/Pagination.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type PaginationProps = {
  total: number;
  pages: number;
  current: number;
  limit: number;
};

export function Pagination({ total, pages, current }: PaginationProps) {
  console.log('total', total);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i + 1}
          onClick={() => handlePageChange(i + 1)}
          className={`px-3 py-2 rounded ${
            current === i + 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-content-soft hover:bg-content-border'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
