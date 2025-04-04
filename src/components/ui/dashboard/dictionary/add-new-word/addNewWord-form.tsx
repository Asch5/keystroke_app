'use client';

import { useState } from 'react';
import {
    getWordFromMerriamWebster,
    processAndSaveWord,
} from '@/lib/db/processMerriamApi';

export default function AddNewWordForm() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            const result = await getWordFromMerriamWebster(
                {
                    message: null,
                    errors: { word: [] },
                },
                formData,
            );

            if (result.data) {
                await processAndSaveWord(result.data);
            }
        } catch (error) {
            console.error('Error processing word:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full justify-center max-w-md  md:w-80 gap-6">
            <form className="flex flex-col gap-4" action={handleSubmit}>
                <div>
                    <label
                        htmlFor="word"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Word
                    </label>
                    <input
                        type="text"
                        id="word"
                        name="word"
                        placeholder="Enter word"
                        className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                </div>

                <div>
                    <label
                        htmlFor="dictionaryType"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Dictionary Type
                    </label>
                    <select
                        id="dictionaryType"
                        name="dictionaryType"
                        className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                        <option value="learners">
                            Learner&apos;s Dictionary
                        </option>
                        <option value="intermediate">
                            Intermediate Dictionary
                        </option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Add Word'}
                </button>
            </form>
        </div>
    );
}
