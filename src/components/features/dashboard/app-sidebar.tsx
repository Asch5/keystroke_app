'use client';

import { useSelector } from 'react-redux';
import { PowerIcon, BookOpen, Plus, List, Library } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { NavLink } from '@/core/types/nav';
import { RootState } from '@/core/lib/redux/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface AppSidebarProps {
  /**
   * Navigation links to display in the sidebar
   */
  links: NavLink[];
}

// Dictionary sub-navigation items
const dictionarySubItems = [
  {
    title: 'Overview',
    url: '/dashboard/dictionary',
    icon: Library,
  },
  {
    title: 'My Dictionary',
    url: '/dashboard/dictionary/my-dictionary',
    icon: BookOpen,
  },
  {
    title: 'Add New Word',
    url: '/dashboard/dictionary/add-word',
    icon: Plus,
  },
  {
    title: 'Word Lists',
    url: '/dashboard/dictionary/lists',
    icon: List,
  },
];

/**
 * Application sidebar component using shadcn/ui Sidebar primitives
 * Provides collapsible navigation with user profile and sign out functionality
 */
export function AppSidebar({ links }: AppSidebarProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const pathname = usePathname();

  // Add cache-busting for profile picture
  const profilePictureUrl = user?.profilePictureUrl
    ? `${user.profilePictureUrl}?t=${Date.now()}`
    : undefined;

  // Check if current path is in dictionary section
  const isDictionarySection = pathname.startsWith('/dashboard/dictionary');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Keystroke App</span>
                  <span className="truncate text-xs">Language Learning</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link: NavLink) => {
                const LinkIcon = link.icon;
                const isActive = pathname === link.href;
                const isDictionary = link.href === '/dashboard/dictionary';

                if (isDictionary) {
                  return (
                    <Collapsible
                      key={link.name}
                      asChild
                      defaultOpen={isDictionarySection}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={link.name}>
                            <LinkIcon className="h-4 w-4" />
                            <span>{link.name}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {dictionarySubItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive =
                                pathname === subItem.url ||
                                (pathname.startsWith(subItem.url) &&
                                  subItem.url !== '/dashboard/dictionary');

                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                  >
                                    <Link href={subItem.url}>
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={link.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.name}
                    >
                      <Link href={link.href}>
                        <LinkIcon className="h-4 w-4" />
                        <span>{link.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/settings">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profilePictureUrl} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: '/' })}
              tooltip="Sign Out"
            >
              <PowerIcon className="h-4 w-4" />
              <span className="truncate text-xs">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
