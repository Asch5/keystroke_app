import { Metadata } from 'next';
import { TypingPracticeContent } from '@/components/features/practice/TypingPracticeContent';

export const metadata: Metadata = {
  title: 'Typing Practice | Keystroke App',
  description:
    'Practice typing words from your vocabulary to improve spelling and retention',
};

interface TypingPracticePageProps {
  searchParams: Promise<{
    userListId?: string;
    listId?: string;
    difficultyLevel?: string;
    wordsCount?: string;
  }>;
}

export default async function TypingPracticePage({
  searchParams,
}: TypingPracticePageProps) {
  const { userListId, listId, difficultyLevel, wordsCount } =
    await searchParams;

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <TypingPracticeContent
          {...(userListId && { userListId })}
          {...(listId && { listId })}
          {...(difficultyLevel && {
            difficultyLevel: parseInt(difficultyLevel),
          })}
          {...(wordsCount && { wordsCount: parseInt(wordsCount) })}
        />
      </div>
    </div>
  );
}
