'use client';

import { AppSidebar } from '@/components/features/dashboard';
import { PageBreadcrumb } from '@/components/shared/navigation';
import { dictionaryNavLinks } from '@/core/lib/data/navLinks';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar links={dictionaryNavLinks} />
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
  );
}
