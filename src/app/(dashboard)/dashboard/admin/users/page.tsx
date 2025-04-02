// src/app/dashboard/admin/users/page.tsx
import { getUsers } from '@/lib/db/user';
import { UsersTable } from '@/components/ui/dashboard/admin/users/UsersTable';
import { SearchBar } from '@/components/ui/dashboard/admin/users/SearchBar';
import { Pagination } from '@/components/ui/dashboard/admin/users/Pagination';

export const metadata = {
    title: 'User Management - Admin Dashboard',
};

const validSortFields = [
    'name',
    'email',
    'lastLogin',
    'createdAt',
    'status',
] as const;
type ValidSortField = (typeof validSortFields)[number];

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: {
        page?: string;
        search?: string;
        sort?: string;
        order?: string;
    };
}) {
    const page = Number(searchParams.page) || 1;
    const search = searchParams.search;
    const sort = validSortFields.includes(searchParams.sort as ValidSortField)
        ? (searchParams.sort as ValidSortField)
        : 'lastLogin';
    const order = (searchParams.order as 'asc' | 'desc') || 'desc';

    const { users, pagination } = await getUsers(page, 10, search, sort, order);

    return (
        <div className="p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    User Management
                </h1>
                <SearchBar defaultValue={search || ''} />
            </div>

            <UsersTable users={users} sortBy={sort} sortOrder={order} />

            <div className="mt-4">
                <Pagination {...pagination} />
            </div>
        </div>
    );
}
