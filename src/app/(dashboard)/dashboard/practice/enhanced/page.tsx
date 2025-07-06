import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EnhancedPracticePageContent } from '@/components/features/practice/EnhancedPracticePageContent';

export const metadata: Metadata = {
  title: 'Practice | Keystroke App',
  description: 'Unified vocabulary practice with adaptive exercise selection',
};

export default function EnhancedPracticePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading practice session...
              </p>
            </div>
          }
        >
          <EnhancedPracticePageContent />
        </Suspense>
      </div>
    </div>
  );
}
