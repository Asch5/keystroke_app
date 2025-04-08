// src/app/(dashboard)/dashboard/admin/users/[userId]/page.tsx
import { getUserDetails } from '@/lib/db/user';
import { formatDistance } from 'date-fns';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default async function UserDetailsPage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await getUserDetails(params.userId).catch(() => null);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Details
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage user information and view statistics
        </p>
      </div>

      {/* User Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              {user.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl text-gray-600 dark:text-gray-300">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status:{' '}
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status}
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Learning Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Words
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {user.stats.totalWords}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Words Learned
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {user.stats.wordsLearned}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average Progress
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {Math.round(user.stats.averageProgress * 100)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Learning Streak
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {user.stats.learningStreak}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Progress
        </h3>
        <div className="space-y-4">
          {user.learningProgress.weeklyProgress.map((day) => (
            <div
              key={day.date.toISOString()}
              className="flex items-center space-x-4"
            >
              <div className="w-24 text-sm text-gray-500 dark:text-gray-400">
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                })}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(day.wordsLearned * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-24 text-sm text-gray-500 dark:text-gray-400">
                {day.wordsLearned} words
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daily Goal
            </p>
            <p className="text-lg text-gray-900 dark:text-white">
              {user.userSettings?.dailyGoal || 'Not set'} words
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notifications
            </p>
            <p className="text-lg text-gray-900 dark:text-white">
              {user.userSettings?.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Languages
            </p>
            <p className="text-lg text-gray-900 dark:text-white">
              {user.baseLanguageCode} → {user.targetLanguageCode}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session Duration
            </p>
            <p className="text-lg text-gray-900 dark:text-white">
              {user.userSettings?.sessionDuration || 'Default'} minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
