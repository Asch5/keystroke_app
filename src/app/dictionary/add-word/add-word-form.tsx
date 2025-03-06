'use client';

import { useState } from 'react';
import { Language, DifficultyLevel, PartOfSpeech } from '@prisma/client';

// Server action for adding a word
async function addWord(formData: FormData) {
    const response = await fetch('/api/dictionary/add-word', {
        method: 'POST',
        body: JSON.stringify({
            word: formData.get('word'),
            definition: formData.get('definition'),
            baseLanguageId: formData.get('baseLanguageId'),
            targetLanguageId: formData.get('targetLanguageId'),
            partOfSpeech: formData.get('partOfSpeech'),
            difficultyLevel: formData.get('difficultyLevel'),
            examples: formData
                .get('examples')
                ?.toString()
                .split('\n')
                .filter((e) => e.trim() !== ''),
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.json();
}

interface AddWordFormProps {
    languages: Language[];
}

interface AddWordResult {
    word: {
        id: string;
        word: string;
        languageId: string;
    };
    definition: {
        id: string;
        definition: string;
        languageId: string;
    };
    dictionaryEntry: {
        id: string;
        wordId: string;
        oneWordDefinitionId: string;
        baseLanguageId: string;
        targetLanguageId: string;
    };
    examples: Array<{
        id: string;
        dictionaryId: string;
        example: string;
        languageId: string;
    }>;
    userDictionaryEntry: {
        id: string;
        userId: string;
        mainDictionaryId: string;
    } | null;
}

export default function AddWordForm({ languages }: AddWordFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<AddWordResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await addWord(formData);

            if (result.success) {
                setResult(result.data);
                // Reset form
                e.currentTarget.reset();
            } else {
                setError(result.message || 'Failed to add word');
            }
        } catch (err) {
            setError('An error occurred while adding the word');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Word added successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="word"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Word
                    </label>
                    <input
                        type="text"
                        id="word"
                        name="word"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label
                        htmlFor="definition"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Definition
                    </label>
                    <textarea
                        id="definition"
                        name="definition"
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="baseLanguageId"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Base Language
                        </label>
                        <select
                            id="baseLanguageId"
                            name="baseLanguageId"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select a language</option>
                            {languages.map((language) => (
                                <option key={language.id} value={language.id}>
                                    {language.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="targetLanguageId"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Target Language
                        </label>
                        <select
                            id="targetLanguageId"
                            name="targetLanguageId"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select a language</option>
                            {languages.map((language) => (
                                <option key={language.id} value={language.id}>
                                    {language.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="partOfSpeech"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Part of Speech
                        </label>
                        <select
                            id="partOfSpeech"
                            name="partOfSpeech"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select part of speech</option>
                            {Object.values(PartOfSpeech).map((pos) => (
                                <option key={pos} value={pos}>
                                    {pos}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="difficultyLevel"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Difficulty Level
                        </label>
                        <select
                            id="difficultyLevel"
                            name="difficultyLevel"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Select difficulty level</option>
                            {Object.values(DifficultyLevel).map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="examples"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Examples (one per line)
                    </label>
                    <textarea
                        id="examples"
                        name="examples"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter examples, one per line"
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Word'}
                    </button>
                </div>
            </form>
        </div>
    );
}
