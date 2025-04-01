'use client';

import {
    getWordFromMerriamWebster,
    StateMerriamWebster,
} from '@/lib/actions/dictionaryActions';
import { useActionState } from 'react';

export default function AddNewWordForm() {
    const initialState: StateMerriamWebster = {
        message: null,
        errors: { word: [] },
    };
    const [state, formAction] = useActionState(
        getWordFromMerriamWebster,
        initialState,
    );

    return (
        <div className="flex flex-col gap-6">
            <form className="flex flex-col gap-4" action={formAction}>
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
                    {state?.errors?.word && (
                        <p className="mt-1 text-sm text-red-500">
                            {state.errors.word.join(', ')}
                        </p>
                    )}
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
                    className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                    Submit
                </button>
            </form>

            {state?.data && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">
                        API Response:
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                        {JSON.stringify(state.data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
