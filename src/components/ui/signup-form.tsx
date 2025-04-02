'use client';

import { signUp, StateSignup } from '@/lib/actions/authActions';
import { LanguageCode } from '@prisma/client';
import { useActionState, useEffect, useState } from 'react';

// Language mapping based on LanguageCode enum
const LANGUAGE_MAP: Record<LanguageCode, string> = {
    en: 'English',
    ru: 'Russian',
    da: 'Danish',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
} as const;

export default function SignupForm() {
    const initialState: StateSignup = { message: null, errors: {} };
    const [state, formAction, isPending] = useActionState(signUp, initialState);

    const [languages, setLanguages] = useState<{ id: string; name: string }[]>(
        [],
    );

    useEffect(() => {
        // Convert language map to array format for the select inputs
        const languageArray = Object.entries(LANGUAGE_MAP).map(
            ([code, name]) => ({
                id: code,
                name: name,
            }),
        );
        setLanguages(languageArray);
    }, []);

    return (
        <form action={formAction} className="max-w-sm mx-auto">
            {state.message && (
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
                    name="email"
                    type="email"
                    id="email"
                    className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light"
                    placeholder="name@flowbite.com"
                    required
                />
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
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Password
                </label>
                <input
                    name="password"
                    type="password"
                    id="password"
                    className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light"
                    required
                    placeholder="Enter minimum 8 characters"
                />
            </div>
            <div className="mb-5">
                <label
                    htmlFor="repeatPassword"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                    Repeat password
                </label>
                <input
                    name="repeatPassword"
                    type="password"
                    id="repeatPassword"
                    className="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light"
                    required
                />
            </div>
            <div className="flex items-start mb-5">
                <div className="flex items-center h-5">
                    <input
                        id="terms"
                        type="checkbox"
                        value=""
                        className="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
                        required
                    />
                </div>
                <label
                    htmlFor="terms"
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                    I agree with the{' '}
                    <a
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-500"
                    >
                        terms and conditions
                    </a>
                </label>
            </div>
            <button
                type="submit"
                disabled={isPending}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
            >
                {isPending ? 'Registering...' : 'Register new account'}
            </button>
        </form>
    );
}
