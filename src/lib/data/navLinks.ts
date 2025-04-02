import {
    DocumentDuplicateIcon,
    PresentationChartBarIcon,
    ChartPieIcon,
    Cog6ToothIcon,
    BookOpenIcon,
    UserGroupIcon,
    BuildingLibraryIcon,
    LanguageIcon,
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
    { name: 'Admin', href: '/dashboard/admin', icon: BuildingLibraryIcon },
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

export const adminNavLinks: NavLink[] = [
    {
        name: 'Users',
        href: '/dashboard/admin/users',
        icon: UserGroupIcon,
    },
    {
        name: 'Languages',
        href: '/dashboard/admin/languages',
        icon: LanguageIcon,
    },
    {
        name: 'Dictionaries',
        href: '/dashboard/admin/dictionaries',
        icon: BookOpenIcon,
    },
];
