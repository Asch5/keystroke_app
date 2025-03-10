// src/components/testReduxComponent.tsx
import { useSelector } from 'react-redux';
import {
    selectUser,
    selectIsAuthenticated,
} from '@/lib/redux/features/authSlice';
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
                <p>Base Language: {user?.baseLanguageId}</p>
                <p>Target Language: {user?.targetLanguageId}</p>
                <p>Profile Picture: {user?.profilePictureUrl}</p>
            </div>
            <Image
                className="w-30 h-30 rounded-full"
                src={user?.profilePictureUrl || ''}
                alt="Rounded avatar"
                width={100}
                height={100}
            />
        </>
    );
}
