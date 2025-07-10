import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageType, DictionaryType } from '../types';

interface LanguageSettingsProps {
  language: LanguageType;
  dictionaryType: DictionaryType;
  onLanguageChange: (language: LanguageType) => void;
  onDictionaryTypeChange: (type: DictionaryType) => void;
  showDictionaryType?: boolean;
}

/**
 * Language and dictionary type selection component
 * Reusable across both single word and file upload tabs
 */
export function LanguageSettings({
  language,
  dictionaryType,
  onLanguageChange,
  onDictionaryTypeChange,
  showDictionaryType = true,
}: LanguageSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={language}
          onValueChange={(value) => onLanguageChange(value as LanguageType)}
        >
          <SelectTrigger id="language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="da">Danish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {language === 'en' && showDictionaryType && (
        <div className="space-y-2">
          <Label htmlFor="dictionaryType">Dictionary Type</Label>
          <Select
            value={dictionaryType}
            onValueChange={(value) =>
              onDictionaryTypeChange(value as DictionaryType)
            }
          >
            <SelectTrigger id="dictionaryType">
              <SelectValue placeholder="Select dictionary" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="learners">
                Learner&apos;s Dictionary
              </SelectItem>
              <SelectItem value="intermediate">
                Intermediate Dictionary
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
