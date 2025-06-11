'use client';

import { useSelector } from 'react-redux';
import { selectUser } from '@/core/state/features/authSlice';
import type { UserBasicData } from '@/core/types/user';

/**
 * Hook to get the current authenticated user from Redux state
 */
export function useUser() {
  const user = useSelector(selectUser);

  return {
    user,
    isAuthenticated: !!user,
  };
}

export type UseUserReturn = {
  user: UserBasicData | null;
  isAuthenticated: boolean;
};
