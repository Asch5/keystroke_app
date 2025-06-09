'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

/**
 * Getting started component for typing practice
 * Displays helpful information when no session is active
 */
export function TypingGettingStarted() {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Ready to Practice?</h3>
          <p className="text-muted-foreground mb-4">
            Practice typing words from your vocabulary to improve your spelling
            and retention.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>• Real-time feedback</div>
            <div>• Adaptive difficulty</div>
            <div>• Progress tracking</div>
            <div>• Achievement system</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
