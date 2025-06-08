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
import { memo, useMemo } from 'react';

/**
 * Dashboard Layout Props Interface
 * Defines the structure for the dashboard layout component properties
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Component
 *
 * Main layout wrapper for all dashboard pages providing consistent structure
 * and navigation. Implements a sidebar-based layout with responsive design,
 * breadcrumb navigation, and scrollable content areas.
 *
 * Features:
 * - Responsive sidebar navigation with collapsible behavior
 * - Breadcrumb navigation for page hierarchy context
 * - Scrollable content area with proper overflow handling
 * - Consistent header structure across dashboard pages
 * - Accessible design with proper ARIA attributes and semantic HTML
 * - Performance optimized with memoization and stable references
 * - Integration with shadcn/ui sidebar components
 *
 * Layout Structure:
 * - Left sidebar with navigation links and user context
 * - Main content area with header containing breadcrumbs
 * - Scrollable content region for page-specific content
 * - Responsive behavior for mobile and desktop viewports
 *
 * @param {DashboardLayoutProps} props - Component properties
 * @param {React.ReactNode} props.children - Page content to render within layout
 * @returns {JSX.Element} The complete dashboard layout structure
 */
function DashboardLayout({ children }: DashboardLayoutProps) {
  /**
   * Memoized navigation links to prevent unnecessary re-computation
   * Stable reference improves performance of child components
   */
  const navigationLinks = useMemo(() => dictionaryNavLinks, []);

  return (
    <SidebarProvider>
      <AppSidebar links={navigationLinks} />
      <SidebarInset>
        {/* Dashboard Header with Navigation Controls */}
        <header
          className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
          role="banner"
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger
              className="-ml-1"
              aria-label="Toggle sidebar navigation"
            />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
              aria-hidden="true"
            />
            <PageBreadcrumb />
          </div>
        </header>

        {/* Main Content Container */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <main className="flex-1" role="main" id="main-content">
            <ScrollArea className="h-full" aria-label="Dashboard content area">
              <div
                className="flex-1 p-4"
                role="region"
                aria-label="Page content"
              >
                {children}
              </div>
            </ScrollArea>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Memoized Dashboard Layout Export
 * Prevents unnecessary re-renders when parent components update
 * but props remain the same, improving overall application performance
 */
export default memo(DashboardLayout);
