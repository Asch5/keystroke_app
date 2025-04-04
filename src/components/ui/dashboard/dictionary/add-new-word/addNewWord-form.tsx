'use client';

import { useState } from 'react';
import {
    getWordFromMerriamWebster,
    processAndSaveWord,
} from '@/lib/db/processMerriamApi';
import { ProcessedWordData } from '@/types/dictionary';

export default function AddNewWordForm() {
    const [processedData, setProcessedData] =
        useState<ProcessedWordData | null>(null);
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
                const processed = await processAndSaveWord(result.data);
                setProcessedData(processed);
            }
        } catch (error) {
            console.error('Error processing word:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-80  md:w-80 gap-6">
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

                {loading && <div>Processing...</div>}

                {processedData && (
                    <div className="mt-8 space-y-6">
                        <WordSection data={processedData.word} />
                        <DefinitionsSection
                            definitions={processedData.definitions}
                        />
                        <PhrasesSection phrases={processedData.phrases} />
                        <StemsSection stems={processedData.stems} />
                    </div>
                )}
            </form>
        </div>
    );
}

// Similar components for Definitions, Phrases, and Stems sections...
// src/components/ui/dashboard/dictionary/add-new-word/addNewWord-form.tsx
// ... existing imports ...

function DefinitionsSection({
    definitions,
}: {
    definitions: ProcessedWordData['definitions'];
}) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Definitions</h3>
            <div className="space-y-4">
                {definitions.map((def, index) => (
                    <div
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700 pb-4"
                    >
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            {def.partOfSpeech} {def.isPlural && '(plural)'}
                        </p>
                        <p className="text-base mt-1">{def.definition}</p>
                        {def.examples.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                {def.examples.map((ex, i) => (
                                    <p
                                        key={i}
                                        className="text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        {ex.example}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function PhrasesSection({
    phrases,
}: {
    phrases: ProcessedWordData['phrases'];
}) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Related Phrases</h3>
            <div className="space-y-4">
                {phrases.map((phrase, index) => (
                    <div
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700 pb-4"
                    >
                        <p className="text-base font-medium">{phrase.phrase}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {phrase.definition}
                        </p>
                        {phrase.examples.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                {phrase.examples.map((ex, i) => (
                                    <p
                                        key={i}
                                        className="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {ex.example}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function StemsSection({ stems }: { stems: string[] }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Related Forms</h3>
            <div className="flex flex-wrap gap-2">
                {stems.map((stem, index) => (
                    <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                    >
                        {stem}
                    </span>
                ))}
            </div>
        </div>
    );
}

// Update WordSection to show all word information
function WordSection({ data }: { data: ProcessedWordData['word'] }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Word Information</h3>
            <dl className="grid grid-cols-2 gap-4">
                <div>
                    <dt className="text-sm text-gray-500">Word</dt>
                    <dd className="text-lg">{data.word}</dd>
                </div>
                <div>
                    <dt className="text-sm text-gray-500">Phonetic</dt>
                    <dd className="text-lg">{data.phonetic || '-'}</dd>
                </div>
                {data.audio && (
                    <div className="col-span-2">
                        <dt className="text-sm text-gray-500">Audio</dt>
                        <dd className="mt-1">
                            <audio
                                controls
                                src={data.audio}
                                className="w-full"
                            />
                        </dd>
                    </div>
                )}
                {data.relatedWords.length > 0 && (
                    <div className="col-span-2">
                        <dt className="text-sm text-gray-500 mb-2">
                            Related Words
                        </dt>
                        <dd className="flex flex-wrap gap-2">
                            {data.relatedWords.map((rel, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm"
                                >
                                    {rel.word} ({rel.type})
                                </span>
                            ))}
                        </dd>
                    </div>
                )}
            </dl>
        </div>
    );
}

// ... rest of the AddNewWordForm component ...
