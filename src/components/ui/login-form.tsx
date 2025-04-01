'use client';

import { authenticate, StateAuth } from '@/lib/actions/authActions';
import { useActionState } from 'react';
import { useAppDispatch } from '@/lib/redux/store';
import { useEffect } from 'react';
import { setUser } from '@/lib/redux/features/authSlice';
import { UserBasicData } from '@/types/user';

export default function LoginForm() {
    const initialState: StateAuth = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(
        authenticate,
        initialState,
    );
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (state?.user) {
            const userBasicData: UserBasicData = {
                id: state.user.id,
                name: state.user.name,
                email: state.user.email,
                role: state.user.role,
                status: state.user.status,
                baseLanguageId: state.user.baseLanguageId,
                targetLanguageId: state.user.targetLanguageId,
                profilePictureUrl: state.user.profilePictureUrl,
            };

            dispatch(setUser(userBasicData));
            //Hard redirect to dashboard to avoid any issues with the router
            window.location.href = '/dashboard';
        }
    }, [state, dispatch]);

    return (
        <form action={formAction} className="max-w-sm mx-auto">
            {state?.message && (
                <div
                    className="p-4 mb-5 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                >
                    {state.message}
                </div>
            )}
            <div className="mb-5">
                <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Your email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    className={`shadow-xs bg-gray-50 border ${
                        state?.errors?.email && state.errors.email.length > 0
                            ? 'border-red-500'
                            : 'border-gray-300'
                    } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                    placeholder="name@flowbite.com"
                    disabled={isPending}
                />
                {state?.errors?.email && state.errors.email.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {state.errors.email[0]}
                    </p>
                )}
            </div>
            <div className="mb-5">
                <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Your password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    className={`shadow-xs bg-gray-50 border ${
                        state?.errors?.password &&
                        state.errors.password.length > 0
                            ? 'border-red-500'
                            : 'border-gray-300'
                    } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                    disabled={isPending}
                />
                {state?.errors?.password &&
                    state.errors.password.length > 0 && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                            {state.errors.password[0]}
                        </p>
                    )}
            </div>
            <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 w-full"
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <svg
                            className="inline w-4 h-4 mr-3 text-white animate-spin"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="#E5E7EB"
                            />
                            <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentColor"
                            />
                        </svg>
                        Loading...
                    </>
                ) : (
                    'Login'
                )}
            </button>
        </form>
    );
}
