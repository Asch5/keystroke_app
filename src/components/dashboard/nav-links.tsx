'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/types/nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link: NavLink) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href;

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
