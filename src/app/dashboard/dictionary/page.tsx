'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/redux/store';
import { selectUser } from '@/lib/redux/features/authSlice';
import DictionaryTable from '@/components/ui/dashboard/dictionary-table';
import { Word } from '@/types/word';
import { fetchDictionaryWords } from '@/lib/actions/dictionaryActions';

/**
 * Dictionary page component in the dashboard
 * Displays a searchable dictionary table showing words in the user's target language
 */
export default function DictionaryPage() {
    const user = useAppSelector(selectUser);
    const [words, setWords] = useState<Word[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dictionary words based on user's target language
    useEffect(() => {
        const loadWords = async () => {
            if (!user?.targetLanguageId) {
                setError(
                    'No target language selected. Please update your profile.'
                );
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const fetchedWords = await fetchDictionaryWords(
                    user.targetLanguageId,
                    user.baseLanguageId
                );
                setWords(fetchedWords);
                setError(null);
            } catch (err) {
                console.error('Error fetching dictionary words:', err);
                setError('Failed to load dictionary. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadWords();
    }, [user?.targetLanguageId, user?.baseLanguageId]);

    // Filter words based on search term
    const filteredWords = words.filter((word) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            word.text.toLowerCase().includes(searchLower) ||
            word.translation.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Dictionary</h1>

            {/* Search input */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg
                            className="w-4 h-4 text-gray-500 dark:text-gray-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                            />
                        </svg>
                    </div>
                    <input
                        type="search"
                        className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Search words in any language..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div
                    className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* Loading state */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div role="status">
                        <svg
                            aria-hidden="true"
                            className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                            />
                            <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                            />
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            ) : (
                // Dictionary table component
                <DictionaryTable words={filteredWords} />
            )}
        </div>
    );
}
