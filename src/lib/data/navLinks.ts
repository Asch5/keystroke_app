import {
  DocumentDuplicateIcon,
  PresentationChartBarIcon,
  ChartPieIcon,
  BookOpenIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  LanguageIcon,
  UserCircleIcon,
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
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
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
