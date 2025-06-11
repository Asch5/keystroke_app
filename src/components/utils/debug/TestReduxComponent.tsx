// src/components/testReduxComponent.tsx
import { useSelector } from 'react-redux';
import {
  selectUser,
  selectIsAuthenticated,
} from '@/core/state/features/authSlice';
import Image from 'next/image';

export default function TestReduxComponent() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1>Welcome, {user?.name}</h1>
        <p>ID: {user?.id}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        <p>Status: {user?.status}</p>
        <p>Base Language: {user?.baseLanguageCode}</p>
        <p>Target Language: {user?.targetLanguageCode}</p>
        <p>Profile Picture: {user?.profilePictureUrl}</p>
      </div>
      {user?.profilePictureUrl &&
        user.profilePictureUrl.includes('public.blob.vercel-storage.com') && (
          <Image
            className="w-30 h-30 rounded-full"
            src={user.profilePictureUrl}
            alt={`${user.name}'s profile picture`}
            width={100}
            height={100}
          />
        )}
    </>
  );
}
