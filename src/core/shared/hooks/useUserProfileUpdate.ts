'use client';

import { useActionState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserProfile } from '@/core/domains/user/actions/user-settings-actions';
import type { UserProfileState } from '@/core/domains/user/types/user-settings';
import { updateUserProfile as updateReduxUserProfile } from '@/core/state/features/authSlice';

/**
 * Custom hook that handles user profile updates and syncs with Redux state
 */
export function useUserProfileUpdate() {
  const dispatch = useDispatch();

  const [state, formAction, isPending] = useActionState(updateUserProfile, {
    errors: {},
    message: null,
    success: false,
  } as UserProfileState);

  // Sync with Redux when profile is successfully updated
  useEffect(() => {
    if (state.success && state.updatedUser) {
      dispatch(updateReduxUserProfile(state.updatedUser));
    }
  }, [state.success, state.updatedUser, dispatch]);

  return { state, formAction, isPending };
}
