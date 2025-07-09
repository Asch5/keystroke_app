// src/app/dashboard/admin/users/components/UsersTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithStatsAndMeta } from '@/core/lib/db/user';
import { formatDistance } from 'date-fns';

export function UsersTable({
  users,
  sortBy,
  sortOrder,
}: {
  users: UserWithStatsAndMeta[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    router.push(`?sort=${field}&order=${newOrder}`);
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-content-secondary">
        <thead className="text-xs text-content-secondary uppercase bg-content-soft">
          <tr>
            <th scope="col" className="p-4">
              <input
                type="checkbox"
                onChange={(e) => {
                  setSelectedUsers(
                    e.target.checked ? users.map((u) => u.id) : [],
                  );
                }}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('name')}
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('email')}
            >
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              Progress
            </th>
            <th scope="col" className="px-6 py-3">
              Last Active
            </th>
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="bg-background border-b border-content-border"
            >
              <td className="w-4 p-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    setSelectedUsers((prev) =>
                      e.target.checked
                        ? [...prev, user.id]
                        : prev.filter((id) => id !== user.id),
                    );
                  }}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
              </td>
              <td className="px-6 py-4 font-medium text-foreground">
                {user.name}
              </td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active'
                      ? 'bg-success-subtle text-success-foreground'
                      : user.status === 'inactive'
                        ? 'bg-content-soft text-content-secondary'
                        : 'bg-error-subtle text-error-foreground'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-content-soft rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${user.stats.averageProgress * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs mt-1">
                  {Math.round(user.stats.averageProgress * 100)}%
                </span>
              </td>
              <td className="px-6 py-4">
                {user.stats.lastActive
                  ? formatDistance(user.stats.lastActive, new Date(), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() =>
                    router.push(`/dashboard/admin/users/${user.id}`)
                  }
                  className="font-medium text-primary hover:underline mr-3"
                >
                  View
                </button>
                <button
                  onClick={() => {
                    /* Handle edit */
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
