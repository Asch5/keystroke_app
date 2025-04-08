'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import {
  fetchUserDictionary,
  selectUserDictionary,
  selectUserDictionaryStatus,
  selectUserDictionaryError,
  setSortBy,
} from '@/lib/redux/features/userDictionarySlice';
import { useSession } from 'next-auth/react';
import { Spinner, Alert } from 'flowbite-react';

type SortColumn =
  | 'word'
  | 'difficulty'
  | 'progress'
  | 'reviewCount'
  | 'lastReviewedAt';

export default function UserDictionaryTable() {
  const dispatch = useAppDispatch();
  const { data: session, status: sessionStatus } = useSession();
  const items = useAppSelector(selectUserDictionary);
  const status = useAppSelector(selectUserDictionaryStatus);
  const error = useAppSelector(selectUserDictionaryError);

  useEffect(() => {
    if (session?.user?.id) {
      dispatch(fetchUserDictionary(session.user.id));
    }
  }, [dispatch, session?.user?.id]);

  const handleSort = (column: SortColumn) => {
    dispatch(setSortBy(column));
  };

  const SortIconUniversal = () => (
    <>
      <svg
        className="w-3 h-3 ms-1.5"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
      </svg>
    </>
  );

  // const SortIcon = ({ column }: { column: typeof sortState.sortBy }) => {
  //     if (sortState.sortBy !== column) return null;
  //     return sortState.sortOrder === 'asc' ? (
  //         <HiArrowUp className="w-3 h-3 ms-1.5" />
  //     ) : (
  //         <HiArrowDown className="w-3 h-3 ms-1.5" />
  //     );
  // };

  if (sessionStatus === 'loading' || status === 'loading') {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="xl" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <Alert color="warning">
        <span>Please sign in to view your dictionary</span>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert color="failure">
        <span>{error}</span>
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Alert color="info">
        <span>
          Your dictionary is empty. Add words from the dictionary to start
          learning!
        </span>
      </Alert>
    );
  }

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('word')}
            >
              <div className="flex items-center">
                Word
                <SortIconUniversal />
              </div>
            </th>
            <th scope="col" className="px-6 py-3">
              Translation
            </th>
            <th scope="col" className="px-6 py-3">
              Category
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('difficulty')}
            >
              <div className="flex items-center">
                Difficulty
                <SortIconUniversal />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('progress')}
            >
              <div className="flex items-center">
                Progress
                <SortIconUniversal />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('reviewCount')}
            >
              <div className="flex items-center">
                Reviews
                <SortIconUniversal />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort('lastReviewedAt')}
            >
              <div className="flex items-center">
                Last Review
                <SortIconUniversal />
              </div>
            </th>
            <th scope="col" className="px-6 py-3">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
            >
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                {item.word}
              </th>
              <td className="px-6 py-4">{item.translation}</td>
              <td className="px-6 py-4">{item.category}</td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                    item.difficulty === 'A1' || item.difficulty === 'A2'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : item.difficulty === 'B1' || item.difficulty === 'B2'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}
                >
                  {item.difficulty}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs mt-1">
                  {Math.round(item.progress)}%
                </span>
              </td>
              <td className="px-6 py-4">{item.reviewCount}</td>
              <td className="px-6 py-4">
                {item.lastReviewedAt
                  ? new Date(item.lastReviewedAt).toLocaleDateString()
                  : 'Never'}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                    item.isLearned
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : item.isNeedsReview
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        : item.isDifficultToLearn
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  }`}
                >
                  {item.isLearned
                    ? 'Learned'
                    : item.isNeedsReview
                      ? 'Needs Review'
                      : item.isDifficultToLearn
                        ? 'Difficult'
                        : 'Learning'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
