import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/features/dashboard/DashboardContent';

/**
 * Main Dashboard Overview Page
 *
 * Displays:
 * - Key learning metrics and progress
 * - Quick actions for common tasks
 * - Recent learning activity
 * - Progress visualization
 * - Navigation to detailed sections
 */
export default async function DashboardOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name || 'Learner'}!
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s your learning progress at a glance
          </p>
        </div>
      </div>

      <DashboardContent userId={session.user.id} />
    </div>
  );
}
