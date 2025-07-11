'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/core/lib/utils';
import { NavLink } from '@/core/types/nav';

interface NavLinksProps {
  links: NavLink[];
  collapsed?: boolean;
}

const NavLinks = memo(function NavLinks({
  links,
  collapsed = false,
}: NavLinksProps) {
  const pathname = usePathname();

  // Memoize navigation items to prevent recreation on every render
  const navItems = useMemo(() => {
    return links.map((link: NavLink) => {
      const LinkIcon = link.icon;
      const isActive = pathname === link.href;

      if (collapsed) {
        return (
          <TooltipProvider key={link.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-center',
                    isActive && 'bg-muted font-medium',
                  )}
                  asChild
                >
                  <Link href={link.href}>
                    <LinkIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{link.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <Button
          key={link.name}
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start',
            isActive && 'bg-muted font-medium',
          )}
          asChild
        >
          <Link href={link.href}>
            <LinkIcon className="mr-2 h-4 w-4" />
            {link.name}
          </Link>
        </Button>
      );
    });
  }, [links, collapsed, pathname]);

  return <nav className="space-y-1">{navItems}</nav>;
});

export default NavLinks;
