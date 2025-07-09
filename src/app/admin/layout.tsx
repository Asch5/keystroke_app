'use client';

import { PageBreadcrumb } from '@/components/shared/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoleGate } from '@/components/features/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getNavigationLinks } from '@/core/lib/utils/navigation';
import { AppSidebar } from '@/components/features/dashboard';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Initialize router ready state
  useEffect(() => {
    // Add a small delay to ensure router is fully initialized
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Custom fallback component that uses client-side navigation safely
  const Fallback = () => {
    useEffect(() => {
      if (isRouterReady) {
        router.push('/dashboard');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRouterReady]);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={['admin']} fallback={<Fallback />}>
      <SidebarProvider>
        <AppSidebar links={getNavigationLinks(pathname)} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <PageBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <main className="flex-1">
              <ScrollArea className="h-full">
                <div className="flex-1 p-4">{children}</div>
              </ScrollArea>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGate>
  );
}
