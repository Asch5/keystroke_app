import {
  dashboardNavLinks,
  dictionaryNavLinks,
  adminNavLinks,
  adminDictionariesNavLinks,
} from '@/core/lib/data/navLinks';
import { NavLink } from '@/core/types/nav';

export const getNavigationLinks = (pathname: string): NavLink[] => {
  // Check if the path starts with specific routes
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/dictionaries')) {
      return adminDictionariesNavLinks;
    }
    return adminNavLinks;
  }

  if (pathname.startsWith('/dashboard')) {
    if (pathname.startsWith('/dashboard/dictionary')) {
      return dictionaryNavLinks;
    }
    return dashboardNavLinks;
  }

  // Default to dashboard links if no match
  return dashboardNavLinks;
};
