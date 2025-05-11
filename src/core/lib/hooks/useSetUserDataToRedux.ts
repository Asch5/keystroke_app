import { useEffect } from 'react';
import { useAppDispatch } from '@/core/lib/redux/store';
import { setUser, clearUser } from '@/core/lib/redux/features/authSlice';
import { UserBasicData } from '@/core/types/user';
import { useSession } from 'next-auth/react';
import { getUserByEmail } from '@/core/lib/db/user';

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

    syncUserData();
  }, [session, status, dispatch]);
}
