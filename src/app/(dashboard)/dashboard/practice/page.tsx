import { Metadata } from 'next';
import { PracticeOverviewContent } from '@/components/features/practice/PracticeOverviewContent';

export const metadata: Metadata = {
  title: 'Practice | Keystroke App',
  description:
    'Choose from different practice types to improve your vocabulary skills',
};

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <PracticeOverviewContent />
      </div>
    </div>
  );
}
