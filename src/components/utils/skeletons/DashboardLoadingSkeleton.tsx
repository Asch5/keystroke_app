import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Dashboard Loading Skeleton Component
 *
 * Provides a comprehensive loading skeleton that matches the structure and layout
 * of the main dashboard content. Displays animated placeholders for all major
 * dashboard sections while data is being fetched.
 *
 * Features:
 * - Matches exact structure of DashboardContent component
 * - Responsive grid layouts for different screen sizes
 * - Smooth CSS animations with proper reduced motion support
 * - Accessible loading state with proper ARIA attributes
 * - Performance optimized with efficient DOM structure
 *
 * Skeleton Sections:
 * - Key metrics overview (4-column grid)
 * - Quick actions section
 * - Progress overview and recent activity (2-column grid)
 * - Achievement highlights (3-column grid)
 * - Language learning status
 *
 * @returns {JSX.Element} The complete dashboard loading skeleton
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6" role="presentation" aria-hidden="true">
      {/* Key Metrics Overview Skeleton */}
      <section aria-label="Loading key metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={`metric-${i}`} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions Skeleton */}
      <section aria-label="Loading quick actions">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={`action-${i}`}
                  className="h-20 bg-muted rounded"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Progress Overview & Recent Activity Skeleton */}
      <section aria-label="Loading progress and activity">
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Card key={`progress-${i}`} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="h-6 bg-muted rounded w-40"></div>
                <div className="h-8 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }, (_, j) => (
                  <div key={`progress-item-${j}`} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Achievement Highlights Skeleton */}
      <section aria-label="Loading achievements">
        <Card className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-6 bg-muted rounded w-40"></div>
            <div className="h-8 bg-muted rounded w-20"></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={`achievement-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="h-5 w-5 bg-muted rounded"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-12"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Language Learning Status Skeleton */}
      <section aria-label="Loading language status">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={`language-${i}`} className="space-y-2">
                  {Array.from({ length: 2 }, (_, j) => (
                    <div
                      key={`language-item-${j}`}
                      className="flex items-center justify-between"
                    >
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
