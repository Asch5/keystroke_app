'use client';

import SideNav from '@/components/dashboard/sidenav';
import {
  dashboardNavLinks,
  dictionaryNavLinks,
  adminNavLinks,
} from '@/lib/data/navLinks';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isDictionary = pathname.startsWith('/dashboard/dictionary');
  const isAdmin = pathname.startsWith('/dashboard/admin');
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <SideNav
        links={
          isDictionary
            ? dictionaryNavLinks
            : isAdmin
              ? adminNavLinks
              : dashboardNavLinks
        }
      />

      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}
