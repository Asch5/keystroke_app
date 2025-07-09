'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';

interface WordFieldsSectionProps {
  formData: WordDetailEditData;
  onInputChange: (
    field: keyof WordDetailEditData,
    value: string | number | boolean | null,
  ) => void;
}

/**
 * WordFieldsSection component for editing shared Word fields
 * Memoized to prevent unnecessary re-renders
 */
const WordFieldsSection = memo(function WordFieldsSection({
  formData,
  onInputChange,
}: WordFieldsSectionProps) {
  return (
    <>
      {/* Warning Section */}
      <Card className="mb-6 border-warning-border bg-warning-subtle">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <div>
              <h3 className="font-medium text-warning-foreground">
                Important Note
              </h3>
              <p className="text-sm text-warning-foreground">
                Fields in this section are shared across all WordDetails for
                this word. Changes here will affect other variants of the same
                word.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Word Fields</span>
            <Badge variant="outline">Shared</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Word Text */}
            <div className="space-y-2">
              <Label htmlFor="word-text">Word Text *</Label>
              <Input
                id="word-text"
                value={formData.wordText || ''}
                onChange={(e) => onInputChange('wordText', e.target.value)}
                placeholder="Enter the word"
                required
              />
            </div>

            {/* Language Code */}
            <div className="space-y-2">
              <Label htmlFor="language-code">Language Code</Label>
              <Input
                id="language-code"
                value={formData.languageCode || ''}
                onChange={(e) => onInputChange('languageCode', e.target.value)}
                placeholder="e.g., da, en, de"
              />
            </div>

            {/* Phonetic General */}
            <div className="space-y-2">
              <Label htmlFor="phonetic-general">Phonetic General</Label>
              <Input
                id="phonetic-general"
                value={formData.phoneticGeneral || ''}
                onChange={(e) =>
                  onInputChange('phoneticGeneral', e.target.value)
                }
                placeholder="General phonetic transcription"
              />
            </div>

            {/* Etymology */}
            <div className="space-y-2">
              <Label htmlFor="etymology">Etymology</Label>
              <Input
                id="etymology"
                value={formData.etymology || ''}
                onChange={(e) => onInputChange('etymology', e.target.value)}
                placeholder="Word origin/etymology"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <Label htmlFor="variants">Variants</Label>
            <Textarea
              id="variants"
              value={formData.variant || ''}
              onChange={(e) => onInputChange('variant', e.target.value)}
              placeholder="Alternative forms or spellings"
              className="min-h-[80px]"
            />
          </div>

          {/* Forms */}
          <div className="space-y-2">
            <Label htmlFor="forms">Forms</Label>
            <Textarea
              id="forms"
              value={formData.forms || ''}
              onChange={(e) => onInputChange('forms', e.target.value)}
              placeholder="Grammatical forms (plural, past tense, etc.)"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
});

export default WordFieldsSection;
