'use client';

import SideNav from '@/components/dashboard/sidenav';
import {
  dashboardNavLinks,
  dictionaryNavLinks,
  adminNavLinks,
} from '@/lib/data/navLinks';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDictionary = pathname.startsWith('/dashboard/dictionary');
  const isAdmin = pathname.startsWith('/dashboard/admin');

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div className="border-r bg-background w-[250px] min-w-[250px]">
        <SideNav
          links={
            isDictionary
              ? dictionaryNavLinks
              : isAdmin
                ? adminNavLinks
                : dashboardNavLinks
          }
        />
      </div>
      <main className="flex-1">
        <ScrollArea className="h-full">
          <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
        </ScrollArea>
      </main>
    </div>
  );
}
