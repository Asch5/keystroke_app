'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/core/types/nav';
import { cn } from '@/core/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function NavLinks({
  links,
  collapsed = false,
}: {
  links: NavLink[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link: NavLink) => {
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
      })}
    </nav>
  );
}
