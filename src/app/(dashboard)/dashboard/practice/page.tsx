import { Metadata } from 'next';
import { TypingPracticeContent } from '@/components/features/practice/TypingPracticeContent';

export const metadata: Metadata = {
  title: 'Typing Practice | Keystroke App',
  description:
    'Practice typing words from your vocabulary to improve spelling and retention',
};

export default function TypingPracticePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <TypingPracticeContent />
      </div>
    </div>
  );
}
