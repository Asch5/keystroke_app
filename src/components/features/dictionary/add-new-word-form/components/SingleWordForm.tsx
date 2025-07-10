import React, { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LanguageSettings } from './LanguageSettings';
import { LanguageType, DictionaryType, WordProcessorState } from '../types';

interface SingleWordFormProps {
  state: WordProcessorState;
  onWordChange: (word: string) => void;
  onLanguageChange: (language: LanguageType) => void;
  onDictionaryTypeChange: (type: DictionaryType) => void;
  onProcessOneWordOnlyChange: (checked: boolean) => void;
  onSubmit: (e: FormEvent) => void;
}

/**
 * Form component for processing single words
 * Includes input field, settings, and processing options
 */
export function SingleWordForm({
  state,
  onWordChange,
  onLanguageChange,
  onDictionaryTypeChange,
  onProcessOneWordOnlyChange,
  onSubmit,
}: SingleWordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="word">Word</Label>
        <Input
          id="word"
          value={state.word}
          onChange={(e) => onWordChange(e.target.value)}
          placeholder="Enter word"
          required
        />
      </div>

      <LanguageSettings
        language={state.language}
        dictionaryType={state.dictionaryType as DictionaryType}
        onLanguageChange={onLanguageChange}
        onDictionaryTypeChange={onDictionaryTypeChange}
      />

      <div className="flex items-start space-x-3 rounded-md border p-4">
        <Checkbox
          id="processOneWordOnly"
          checked={state.processOneWordOnly}
          onCheckedChange={(checked) =>
            onProcessOneWordOnlyChange(checked === true)
          }
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="processOneWordOnly" className="text-sm font-medium">
            Process only one word
          </Label>
          <p className="text-sm text-muted-foreground">
            When enabled, only the first matching word will be processed
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={state.loading}>
        {state.loading ? 'Processing...' : 'Add Word'}
      </Button>
    </form>
  );
}
