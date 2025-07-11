// import {
//     BanknotesIcon,
//     ClockIcon,
//     UserGroupIcon,
//     InboxIcon,
// } from '@heroicons/react/24/outline';
// import { auth } from '@/auth';
// import { geistSans } from '@/components/ui/fonts';
// import {
//     getWordsAddedByUser,
//     getWordsAddedFromLists,
//     getWordsInProgress,
//     getAllUserWords,
// } from '@/lib/db/dictionary';

// const iconMap = {
//     allUserWords: BanknotesIcon,
//     wordsAddedByUser: UserGroupIcon,
//     wordsAddedFromLists: ClockIcon,
//     wordsInProgress: InboxIcon,
// };

// export default async function CardWrapper() {
//     const session = await auth();
//     if (!session?.user?.email) {
//         return null; // Handle unauthenticated state
//     }

//     const userId = session.user.id;
//     const allUserWords = await getAllUserWords(userId);
//     const wordsAddedByUser = await getWordsAddedByUser(userId);
//     const wordsAddedFromLists = await getWordsAddedFromLists(userId);
//     const wordsInProgress = await getWordsInProgress(userId);

//     return (
//         <>
//             <Card
//                 title="All words"
//                 value={allUserWords.length}
//                 type="allUserWords"
//             />
//             <Card
//                 title="Added by me"
//                 value={wordsAddedByUser.length}
//                 type="wordsAddedByUser"
//             />
//             <Card
//                 title="Added from catalogs"
//                 value={wordsAddedFromLists.length}
//                 type="wordsAddedFromLists"
//             />
//             <Card
//                 title="My vocabulary"
//                 value={wordsInProgress.length}
//                 type="wordsInProgress"
//             />
//         </>
//     );
// }

// export function Card({
//     title,
//     value,
//     type,
// }: {
//     title: string;
//     value: number | string;
//     type:
//         | 'allUserWords'
//         | 'wordsAddedByUser'
//         | 'wordsAddedFromLists'
//         | 'wordsInProgress';
// }) {
//     const Icon = iconMap[type];

//     return (
//         <div className="rounded-xl bg-gray-50 p-2 shadow-sm dark:bg-gray-800">
//             <div className="flex p-4 ">
//                 {Icon ? (
//                     <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
//                 ) : null}
//                 <h3 className="ml-2 text-sm font-medium">{title}</h3>
//             </div>
//             <p
//                 className={`${geistSans.className}
//           truncate rounded-xl bg-white px-4 py-8 text-center text-2xl  dark:bg-gray-800`}
//             >
//                 {value}
//             </p>
//         </div>
//     );
// }
