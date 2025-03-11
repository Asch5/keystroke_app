'use client';

import { useState } from 'react';
import { Word } from '@/types/word';

type DictionaryTableProps = {
    words: Word[];
};

/**
 * Dictionary table component that displays words and their translations
 * Includes pagination for better performance with large dictionaries
 */
export default function DictionaryTable({ words }: DictionaryTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentWords = words.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(words.length / itemsPerPage);

    // Handle page changes
    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            {words.length === 0 ? (
                <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        No words found. Try a different search term.
                    </p>
                </div>
            ) : (
                <>
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Word
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Translation
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Category
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Difficulty
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentWords.map((word) => (
                                <tr
                                    key={word.id}
                                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <th
                                        scope="row"
                                        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                    >
                                        {word.text}
                                    </th>
                                    <td className="px-6 py-4">
                                        {word.translation}
                                    </td>
                                    <td className="px-6 py-4">
                                        {word.category || 'General'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium
                                            ${
                                                word.difficulty === 'easy'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : word.difficulty ===
                                                      'medium'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}
                                        >
                                            {word.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline me-3">
                                            Add to Practice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination controls */}
                    <nav
                        className="flex items-center justify-between p-4"
                        aria-label="Table navigation"
                    >
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Showing{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {indexOfFirstItem + 1}-
                                {Math.min(indexOfLastItem, words.length)}
                            </span>{' '}
                            of{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {words.length}
                            </span>
                        </span>
                        <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                            <li>
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg ${
                                        currentPage === 1
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                    }`}
                                >
                                    Previous
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg ${
                                        currentPage === totalPages
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                    }`}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </>
            )}
        </div>
    );
}
