import {
    DocumentDuplicateIcon,
    PresentationChartBarIcon,
    ChartPieIcon,
    Cog6ToothIcon,
    BookOpenIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from '@/types/nav';

export const dashboardNavLinks: NavLink[] = [
    {
        name: 'Dictionary',
        href: '/dashboard/dictionary',
        icon: BookOpenIcon,
    },

    {
        name: 'Practice',
        href: '/dashboard/practice',
        icon: PresentationChartBarIcon,
    },
    { name: 'Statistics', href: '/dashboard/statistics', icon: ChartPieIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export const dictionaryNavLinks: NavLink[] = [
    {
        name: 'Practice',
        href: '/dashboard/practice',
        icon: PresentationChartBarIcon,
    },
    {
        name: 'Catalogue',
        href: '/dashboard/dictionary/catalogue',
        icon: DocumentDuplicateIcon,
    },
    {
        name: 'New Word',
        href: '/dashboard/dictionary/add-new-word',
        icon: UserGroupIcon,
    },
];
