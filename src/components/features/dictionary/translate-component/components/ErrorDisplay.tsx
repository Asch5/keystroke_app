import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplayProps } from '../types';

/**
 * Error display component for translation errors
 * Shows error messages in a styled card
 */
export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Card className="mb-8 border-error-border">
      <CardHeader className="bg-error-subtle">
        <CardTitle className="text-error-foreground">Error</CardTitle>
      </CardHeader>
      <CardContent className="text-error-foreground pt-4">
        <p>{error}</p>
      </CardContent>
    </Card>
  );
}
