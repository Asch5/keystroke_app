// src/app/dashboard/admin/users/components/UsersTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithStatsAndMeta } from '@/lib/db/user';
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
        const newOrder =
            sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
        router.push(`?sort=${field}&order=${newOrder}`);
    };

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="p-4">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    setSelectedUsers(
                                        e.target.checked
                                            ? users.map((u) => u.id)
                                            : [],
                                    );
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
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
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                        >
                            <td className="w-4 p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={(e) => {
                                        setSelectedUsers((prev) =>
                                            e.target.checked
                                                ? [...prev, user.id]
                                                : prev.filter(
                                                      (id) => id !== user.id,
                                                  ),
                                        );
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
                                />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {user.name}
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                        user.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : user.status === 'inactive'
                                              ? 'bg-gray-100 text-gray-800'
                                              : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{
                                            width: `${user.stats.averageProgress * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs mt-1">
                                    {Math.round(
                                        user.stats.averageProgress * 100,
                                    )}
                                    %
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {user.stats.lastActive
                                    ? formatDistance(
                                          user.stats.lastActive,
                                          new Date(),
                                          { addSuffix: true },
                                      )
                                    : 'Never'}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/admin/users/${user.id}`,
                                        )
                                    }
                                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        /* Handle edit */
                                    }}
                                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
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
