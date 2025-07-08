import { Metadata } from 'next';
import { VocabularyPracticeContent } from '@/components/features/practice/VocabularyPracticeContent';

export const metadata: Metadata = {
  title: 'Vocabulary Practice | Keystroke App',
  description:
    'Practice vocabulary with different modes: learn new words, continue learning, refresh, or mix all types',
};

interface VocabularyPracticePageProps {
  searchParams: Promise<{
    userListId?: string;
    listId?: string;
    mode?: string;
    difficultyLevel?: string;
    wordsCount?: string;
  }>;
}

export default async function VocabularyPracticePage({
  searchParams,
}: VocabularyPracticePageProps) {
  const { userListId, listId, mode, difficultyLevel, wordsCount } =
    await searchParams;

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <VocabularyPracticeContent
          {...(userListId && { userListId })}
          {...(listId && { listId })}
          {...(mode && { mode })}
          {...(difficultyLevel && {
            difficultyLevel: parseInt(difficultyLevel),
          })}
          {...(wordsCount && { wordsCount: parseInt(wordsCount) })}
        />
      </div>
    </div>
  );
}
