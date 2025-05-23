import * as React from 'react';

/**
 * Navigation types for shared infrastructure
 * Extracted from nav.ts for better organization
 */

export type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
};

// Extended navigation types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  isDisabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};
