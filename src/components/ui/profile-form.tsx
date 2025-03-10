'use client';

import { useState, useEffect, useActionState, useCallback } from 'react';
import { updateUserProfile } from '@/lib/actions/userActions';
import { getLanguages, getUserByEmail } from '@/lib/db/user';
import { Theme } from '@/types/user';
import { setUser } from '@/lib/redux/features/authSlice';
import { useAppDispatch } from '@/lib/redux/store';
import { useSession } from 'next-auth/react';
const arrTheme: Theme = ['light', 'dark'];

export default function ProfileForm() {
    const [languages, setLanguages] = useState<{ id: string; name: string }[]>(
        []
    );
    const dispatch = useAppDispatch();
    const { data: session } = useSession();

    const [state, formAction, isPending] = useActionState(updateUserProfile, {
        errors: {},
        message: null,
        success: false,
    });
    console.log('state', state);

    // Function to manually refresh user data in Redux
    const refreshUserData = useCallback(async () => {
        if (session?.user?.email) {
            try {
                const user = await getUserByEmail(session.user.email);
                if (user) {
                    const userBasicData = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status,
                        baseLanguageId: user.baseLanguageId,
                        targetLanguageId: user.targetLanguageId,
                        profilePictureUrl: user.profilePictureUrl,
                    };
                    dispatch(setUser(userBasicData));
                }
            } catch (error) {
                console.error('Error refreshing user data:', error);
            }
        }
    }, [session, dispatch]);

    useEffect(() => {
        // Fetch available languages
        console.log('fetching languages');
        const fetchLanguages = async () => {
            try {
                const response = await getLanguages();
                setLanguages(response);
            } catch (err) {
                console.error('Error fetching languages:', err);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (state.success) {
            refreshUserData();
        }
    }, [state, refreshUserData]);

    return (
        <form action={formAction} className="max-w-lg mx-auto">
            {state.message && (
                <div
                    className={`p-4 mb-5 text-sm rounded-lg ${
                        state.success
                            ? 'text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400'
                            : 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400'
                    }`}
                    role="alert"
                >
                    {state.message}
                </div>
            )}

            <div className="mb-5">
                <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Your Name
                </label>
                <input
                    name="name"
                    type="text"
                    id="name"
                    className={`shadow-xs bg-gray-50 border ${
                        state.errors?.name
                            ? 'border-red-500'
                            : 'border-gray-300'
                    } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                    placeholder="John Doe"
                />
                {state.errors?.name && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {state.errors.name[0]}
                    </p>
                )}
            </div>

            <div className="grid md:grid-cols-2 md:gap-6">
                <div className="mb-5">
                    <label
                        htmlFor="baseLanguage"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Native Language
                    </label>
                    <select
                        name="baseLanguageId"
                        id="baseLanguage"
                        className={`shadow-xs bg-gray-50 border ${
                            state.errors?.baseLanguageId
                                ? 'border-red-500'
                                : 'border-gray-300'
                        } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                    >
                        <option value="">Select your native language</option>
                        {languages.map((lang) => (
                            <option key={`base-${lang.id}`} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    {state.errors?.baseLanguageId && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                            {state.errors.baseLanguageId[0]}
                        </p>
                    )}
                </div>

                <div className="mb-5">
                    <label
                        htmlFor="targetLanguage"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Language to Learn
                    </label>
                    <select
                        name="targetLanguageId"
                        id="targetLanguage"
                        className={`shadow-xs bg-gray-50 border ${
                            state.errors?.targetLanguageId
                                ? 'border-red-500'
                                : 'border-gray-300'
                        } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                    >
                        <option value="">Select language to learn</option>
                        {languages.map((lang) => (
                            <option key={`target-${lang.id}`} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    {state.errors?.targetLanguageId && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                            {state.errors.targetLanguageId[0]}
                        </p>
                    )}
                </div>
            </div>
            <div className="mb-5">
                <label
                    htmlFor="targetLanguage"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Theme
                </label>
                <select
                    name="theme"
                    id="theme"
                    className={`shadow-xs bg-gray-50 border ${
                        state.errors?.theme
                            ? 'border-red-500'
                            : 'border-gray-300'
                    } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light`}
                >
                    <option value="">Select preferred theme</option>
                    {arrTheme.map((theme) => (
                        <option key={`theme-${theme}`} value={theme}>
                            {theme}
                        </option>
                    ))}
                </select>
                {state.errors?.theme && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {state.errors.theme[0]}
                    </p>
                )}
            </div>
            <div className="mb-5">
                <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="file_input"
                >
                    Upload file
                </label>
                <input
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    id="file_input"
                    type="file"
                    name="photo"
                ></input>
                {state.errors?.photo && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {state.errors.photo[0]}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 w-full"
            >
                {isPending ? 'Saving...' : 'Save Profile'}
            </button>
        </form>
    );
}
