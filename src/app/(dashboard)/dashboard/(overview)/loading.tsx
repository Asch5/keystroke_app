import { DashboardLoadingSkeleton } from '@/components/utils/skeletons';

/**
 * Dashboard Overview Loading Component
 *
 * Provides accessible loading state for the dashboard overview page while
 * the main content is being fetched and rendered. Uses a detailed skeleton
 * component that matches the structure of the actual dashboard content.
 *
 * This component is automatically used by Next.js App Router during page
 * loading transitions and Suspense boundaries.
 *
 * Features:
 * - Accessible loading state with proper ARIA attributes
 * - Visual skeleton matching dashboard structure
 * - Smooth transition experience for users
 * - Responsive design matching main dashboard layout
 *
 * @returns {JSX.Element} The loading skeleton component
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard content"
      aria-live="polite"
      className="animate-pulse"
    >
      <span className="sr-only">Loading your dashboard...</span>
      <DashboardLoadingSkeleton />
    </div>
  );
}
