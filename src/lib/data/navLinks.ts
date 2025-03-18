import {
    UserGroupIcon,
    HomeIcon,
    DocumentDuplicateIcon,
    UserCircleIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from '@/types/nav';

export const dashboardNavLinks: NavLink[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    {
        name: 'Dictionary',
        href: '/dashboard/dictionary',
        icon: DocumentDuplicateIcon,
    },

    { name: 'Lists', href: '/dashboard/lists', icon: UserGroupIcon },
    { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Admin', href: '/dashboard/admin', icon: UserCircleIcon },
];

export const dictionaryNavLinks: NavLink[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    {
        name: 'Statistics',
        href: '/dashboard/dictionary/statistics',
        icon: DocumentDuplicateIcon,
    },
    { name: 'Lists', href: '/dashboard/dictionary/lists', icon: UserGroupIcon },
    {
        name: 'My Dictionary',
        href: '/dashboard/dictionary/my-dictionary',
        icon: BookOpenIcon,
    },
];
