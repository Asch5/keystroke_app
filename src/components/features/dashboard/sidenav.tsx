'use client';

import { PowerIcon, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NavLinks } from '@/components/features/dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RootState } from '@/core/state/store';
import { NavLink } from '@/core/types/nav';

interface SideNavContentProps {
  links: NavLink[];
  collapsed: boolean;
}

const SideNavContent = memo(function SideNavContent({
  links,
  collapsed,
}: SideNavContentProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  // Memoize profile picture URL with cache-busting
  const profilePictureUrl = useMemo(() => {
    return user?.profilePictureUrl
      ? `${user.profilePictureUrl}?t=${Date.now()}`
      : undefined;
  }, [user?.profilePictureUrl]);

  // Memoized sign out handler
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="flex h-full flex-col space-y-4 py-4">
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profilePictureUrl} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-2">
          <Avatar>
            <AvatarImage src={profilePictureUrl} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <ScrollArea className="flex-1 px-3">
        <NavLinks links={links} collapsed={collapsed} />
      </ScrollArea>
      <div className="px-3">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <PowerIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <PowerIcon className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
});

const SideNav = memo(function SideNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Memoized handlers
  const handleToggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  const handleSheetOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
  }, []);

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          <SideNavContent links={links} collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div
        className={`hidden md:flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[200px]'}`}
      >
        <SideNavContent links={links} collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          className="self-end mt-2 mr-2"
          onClick={handleToggleCollapse}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
});

export default SideNav;
