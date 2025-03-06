// src/components/testReduxComponent.tsx

import { useAppSelector, useAppDispatch } from '@/lib/redux/store';
import { Button } from './ui/button';
import { setUser, clearUser } from '@/lib/redux/features/authSlice';

export default function TestReduxComponent() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const isAuthenticated = useAppSelector(
        (state) => state.auth.isAuthenticated
    );

    return (
        <div className="flex flex-col gap-2">
            <p>User: {user?.name}</p>
            <p>Is Authenticated: {isAuthenticated ? 'true' : 'false'}</p>
            <Button
                onClick={() =>
                    dispatch(
                        setUser({
                            id: 'test',
                            name: 'test',
                            email: 'test',
                        })
                    )
                }
            >
                Set User
            </Button>
            <Button onClick={() => dispatch(clearUser())}>Clear User</Button>
        </div>
    );
}
