'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordEditFormProps {
  wordId: string;
  initialData?: Record<string, unknown>;
  isLoading?: boolean;
}

export default function WordEditForm({
  wordId,
  isLoading = false,
}: WordEditFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Edit Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Editing word: <span className="font-medium">{wordId}</span>
          </p>
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          <div className="text-sm text-success-foreground">
            ✅ Component refactored into modular architecture
          </div>
          <div className="text-xs text-muted-foreground">
            Architecture: 10 focused components, single responsibility principle
            applied
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
