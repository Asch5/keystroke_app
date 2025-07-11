// src/app/(dashboard)/dashboard/admin/users/[userId]/page.tsx
import { formatDistance } from 'date-fns';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getUserDetails } from '@/core/lib/db/user';

export default async function UserDetailsPage({
  params,
}: {
  params: { userId: string };
}) {
  // Convert userId to string explicitly to ensure type safety
  const userId = String(params.userId);
  const user = await getUserDetails(userId).catch(() => null);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Details</h1>
        <p className="text-content-secondary">
          Manage user information and view statistics
        </p>
      </div>

      {/* User Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-content-soft flex items-center justify-center">
                  <span className="text-2xl text-content-secondary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {user.name}
                </h2>
                <p className="text-content-secondary">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-content-border">
              <p className="text-sm text-content-secondary">
                Status:{' '}
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    user.status === 'active'
                      ? 'bg-success-subtle text-success-foreground'
                      : user.status === 'inactive'
                        ? 'bg-content-soft text-content-secondary'
                        : 'bg-error-subtle text-error-foreground'
                  }`}
                >
                  {user.status}
                </span>
              </p>
              <p className="text-sm text-content-secondary mt-2">
                Joined:{' '}
                {formatDistance(new Date(user.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Learning Statistics */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Learning Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-content-soft rounded-lg">
                <p className="text-sm text-content-secondary">Total Words</p>
                <p className="text-2xl font-semibold text-foreground">
                  {user.stats.totalWords}
                </p>
              </div>
              <div className="p-4 bg-content-soft rounded-lg">
                <p className="text-sm text-content-secondary">Words Learned</p>
                <p className="text-2xl font-semibold text-foreground">
                  {user.stats.wordsLearned}
                </p>
              </div>
              <div className="p-4 bg-content-soft rounded-lg">
                <p className="text-sm text-content-secondary">
                  Average Progress
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {Math.round(user.stats.averageProgress * 100)}%
                </p>
              </div>
              <div className="p-4 bg-content-soft rounded-lg">
                <p className="text-sm text-content-secondary">
                  Learning Streak
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {user.stats.learningStreak}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Weekly Progress
        </h3>
        <div className="space-y-4">
          {user.learningProgress.weeklyProgress.map((day) => (
            <div
              key={day.date.toISOString()}
              className="flex items-center space-x-4"
            >
              <div className="w-24 text-sm text-content-secondary">
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                })}
              </div>
              <div className="flex-1">
                <div className="w-full bg-content-soft rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(day.wordsLearned * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-24 text-sm text-content-secondary">
                {day.wordsLearned} words
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Settings */}
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          User Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-content-secondary">Daily Goal</p>
            <p className="text-lg text-foreground">
              {user.userSettings?.dailyGoal || 'Not set'} words
            </p>
          </div>
          <div>
            <p className="text-sm text-content-secondary">Notifications</p>
            <p className="text-lg text-foreground">
              {user.userSettings?.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-sm text-content-secondary">Languages</p>
            <p className="text-lg text-foreground">
              {user.baseLanguageCode} → {user.targetLanguageCode}
            </p>
          </div>
          <div>
            <p className="text-sm text-content-secondary">Session Duration</p>
            <p className="text-lg text-foreground">
              {user.userSettings?.sessionDuration || 'Default'} minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
