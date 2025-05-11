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
import { NavLink } from '@/core/types/nav';

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
    href: '/admin/users',
    icon: UserGroupIcon,
  },
  {
    name: 'Languages',
    href: '/admin/languages',
    icon: LanguageIcon,
  },
  {
    name: 'Dictionaries',
    href: '/admin/dictionaries',
    icon: BookOpenIcon,
  },
];

export const adminDictionariesNavLinks: NavLink[] = [
  {
    name: 'Check Word',
    href: '/admin/dictionaries/check-word',
    icon: BookOpenIcon,
  },
  {
    name: 'Add New Word',
    href: '/admin/dictionaries/add-new-word',
    icon: BookOpenIcon,
  },
  {
    name: 'Frequency',
    href: '/admin/dictionaries/frequency',
    icon: BookOpenIcon,
  },
  {
    name: 'Edit Word',
    href: '/admin/dictionaries/edit-word',
    icon: BookOpenIcon,
  },
];
