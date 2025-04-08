import { Suspense } from 'react';
import ProfileForm from '@/components/forms/profile-form';

export default function ProfileSettingsPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative flex w-full max-w-[600px] flex-col space-y-2.5 p-4 md:-mt-32">
        <h1 className="text-2xl font-bold text-center mb-5">
          Complete Your Profile
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Please provide additional information to complete your profile.
        </p>
        <Suspense fallback={<div>Loading...</div>}>
          <ProfileForm />
        </Suspense>
      </div>
    </main>
  );
}
