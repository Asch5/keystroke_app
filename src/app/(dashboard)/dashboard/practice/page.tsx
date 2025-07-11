import { Metadata } from 'next';
import { PracticeOverviewContent } from '@/components/features/practice';
import { PracticeErrorBoundary } from '@/components/shared/error-boundaries';

/**
 * Practice Overview Page
 *
 * Main entry point for practice selection and session management.
 * Provides access to different practice types and vocabulary selection.
 *
 * Features:
 * - Practice type selection (unified practice, typing, etc.)
 * - Vocabulary list selection for targeted practice
 * - Progress tracking and session history
 * - Comprehensive error boundary protection
 */
export const metadata: Metadata = {
  title: 'Practice | Keystroke App',
  description:
    'Choose from different practice types to improve your vocabulary skills',
};

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <PracticeErrorBoundary>
          <PracticeOverviewContent />
        </PracticeErrorBoundary>
      </div>
    </div>
  );
}
