import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { getUserByEmail } from '@/core/lib/db/user';
import { setUser, clearUser } from '@/core/state/features/authSlice';
import { useAppDispatch } from '@/core/state/store';
import { UserBasicData } from '@/core/types/user';

export function useSetUserDataToRedux() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  // Clear previous user data when component mounts
  useEffect(() => {
    dispatch(clearUser());
  }, [dispatch]);

  // Handle authentication state changes
  useEffect(() => {
    const syncUserData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const user = await getUserByEmail(session.user.email);

          if (!user) {
            console.error('User not found in database');
            dispatch(clearUser());
            return;
          }

          const userBasicData: UserBasicData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            baseLanguageCode: user.baseLanguageCode,
            targetLanguageCode: user.targetLanguageCode,
            profilePictureUrl: user.profilePictureUrl,
          };

          dispatch(setUser(userBasicData));
        } catch (error) {
          console.error('Error fetching user data:', error);
          dispatch(clearUser());
        }
      }
    };

    void syncUserData();
  }, [session, status, dispatch]);
}
