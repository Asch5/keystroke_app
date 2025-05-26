'use client';

import { SideNav } from '@/components/features/dashboard';
import { PageBreadcrumb } from '@/components/shared/navigation';
import { dictionaryNavLinks } from '@/core/lib/data/navLinks';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div>
        <SideNav links={dictionaryNavLinks} />
      </div>
      <main className="flex-1">
        <ScrollArea className="h-full">
          <div className="flex-1 p-8 pt-6">
            <PageBreadcrumb />
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
