'use client';

import SideNav from '@/components/ui/dashboard/sidenav';
import { dashboardNavLinks, dictionaryNavLinks } from '@/lib/data/navLinks';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isDictionary = pathname.startsWith('/dashboard/dictionary');
    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <SideNav
                links={isDictionary ? dictionaryNavLinks : dashboardNavLinks}
            />

            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
