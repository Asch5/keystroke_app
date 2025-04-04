'use client';

import { useState } from 'react';
import { getWordDetails, WordDetails } from '@/lib/actions/dictionaryActions';
import { LanguageCode } from '@prisma/client';

export default function CheckWordForm() {
    const [wordText, setWordText] = useState<string>('');
    const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!wordText.trim()) {
            setError('Please enter a word');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const details = await getWordDetails(
                wordText.trim(),
                LanguageCode.en,
            );
            setWordDetails(details);
            if (!details) {
                setError(`Word "${wordText}" not found in database`);
            }
        } catch (err) {
            console.error('Error fetching word details:', err);
            setError('Failed to fetch word details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-10 border-t pt-10 border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center">
                Word Checker
            </h2>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={wordText}
                        onChange={(e) => setWordText(e.target.value)}
                        placeholder="Enter word to check"
                        className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 disabled:opacity-50"
                    >
                        {loading ? 'Checking...' : 'Check word'}
                    </button>
                </div>
                {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                        {error}
                    </p>
                )}
            </form>

            {wordDetails && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-center uppercase mb-4">
                            WORD
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Name
                                </p>
                                <p className="text-lg">
                                    {wordDetails.word.text}
                                </p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Phonetic
                                </p>
                                <p className="text-lg">
                                    {wordDetails.word.phonetic || '—'}
                                </p>
                            </div>
                            {wordDetails.word.audio && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Audio
                                    </p>
                                    <audio
                                        controls
                                        src={wordDetails.word.audio}
                                        className="w-full mt-1"
                                    />
                                </div>
                            )}
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Etymology
                                </p>
                                <p>{wordDetails.word.etymology || '—'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Plural
                                </p>
                                <p>
                                    {wordDetails.word.plural ? 'true' : 'false'}
                                </p>
                            </div>
                            {wordDetails.word.pluralForm && (
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Plural Form
                                    </p>
                                    <p>{wordDetails.word.pluralForm}</p>
                                </div>
                            )}
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Difficulty Level
                                </p>
                                <p>{wordDetails.word.difficultyLevel}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Language Code
                                </p>
                                <p>{wordDetails.word.languageCode}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Created At
                                </p>
                                <p>
                                    {new Date(
                                        wordDetails.word.createdAt,
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Related Words Section */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <details>
                            <summary className="text-xl font-bold text-center cursor-pointer mb-4 focus:outline-none">
                                Related Words
                            </summary>
                            <div className="grid gap-4 mt-4">
                                <RelatedWordsList
                                    title="Synonym"
                                    words={wordDetails.relatedWords.synonym}
                                />
                                <RelatedWordsList
                                    title="Antonym"
                                    words={wordDetails.relatedWords.antonym}
                                />
                                <RelatedWordsList
                                    title="Related"
                                    words={wordDetails.relatedWords.related}
                                />
                                <RelatedWordsList
                                    title="Composition"
                                    words={wordDetails.relatedWords.composition}
                                />
                                <RelatedWordsList
                                    title="Plural Form"
                                    words={wordDetails.relatedWords.plural_en}
                                />
                            </div>
                        </details>
                    </div>

                    {/* Definitions Section */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <details>
                            <summary className="text-xl font-bold text-center cursor-pointer mb-4 focus:outline-none">
                                Definitions
                            </summary>
                            <div className="space-y-6 mt-4">
                                {wordDetails.definitions.map((def, index) => (
                                    <div
                                        key={def.id}
                                        className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0"
                                    >
                                        <h4 className="text-lg font-medium mb-3">
                                            Definition {index + 1}: {def.text}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Part of speech
                                                </p>
                                                <p>{def.partOfSpeech}</p>
                                            </div>
                                            {def.image && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        Image
                                                    </p>
                                                    <a
                                                        href={def.image.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {def.image
                                                            .description ||
                                                            'View image'}
                                                    </a>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Frequency Using
                                                </p>
                                                <p>{def.frequencyUsing}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Language Code
                                                </p>
                                                <p>{def.languageCode}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Source
                                                </p>
                                                <p>{def.source}</p>
                                            </div>
                                        </div>
                                        {def.examples.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Examples
                                                </p>
                                                <ol className="list-decimal pl-6 space-y-1">
                                                    {def.examples.map((ex) => (
                                                        <li
                                                            key={ex.id}
                                                            className="text-sm"
                                                        >
                                                            {ex.text}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>

                    {/* Related Phrases Section */}
                    {wordDetails.phrases.length > 0 && (
                        <div className="p-6">
                            <details>
                                <summary className="text-xl font-bold text-center cursor-pointer mb-4 focus:outline-none">
                                    Related Phrases
                                </summary>
                                <div className="space-y-6 mt-4">
                                    {wordDetails.phrases.map((phrase) => (
                                        <div
                                            key={phrase.id}
                                            className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0"
                                        >
                                            <h4 className="text-lg font-medium mb-2">
                                                {phrase.text}
                                            </h4>
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Definition
                                                </p>
                                                <p>{phrase.definition}</p>
                                            </div>
                                            {phrase.examples.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                        Examples
                                                    </p>
                                                    <ol className="list-decimal pl-6 space-y-1">
                                                        {phrase.examples.map(
                                                            (ex) => (
                                                                <li
                                                                    key={ex.id}
                                                                    className="text-sm"
                                                                >
                                                                    {ex.text}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ol>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

type RelatedWordsListProps = {
    title: string;
    words: Array<{ id: number; word: string }>;
};

function RelatedWordsList({ title, words }: RelatedWordsListProps) {
    if (words.length === 0) return null;

    return (
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {title}
            </p>
            <ol className="list-decimal pl-6 space-y-1">
                {words.map((word) => (
                    <li key={word.id} className="text-sm">
                        {word.word}
                    </li>
                ))}
            </ol>
        </div>
    );
}
