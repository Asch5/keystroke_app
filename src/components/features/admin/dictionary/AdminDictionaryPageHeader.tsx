'use client';

import React from 'react';
import { ActionButtonsToolbar } from '@/components/features/admin';
import { CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DictionaryWordDetails } from '@/core/domains/dictionary/actions';
import { LanguageCode } from '@/core/types';
import { languageDisplayNames } from './AdminDictionaryConstants';

interface AdminDictionaryPageHeaderProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  selectedWords: Set<string>;
  filteredWordDetails: DictionaryWordDetails[];
  onCreateWordList: () => void;
  onDeleteSelected: () => void;
  onAudioGenerated: () => void;
  onAddWordsToList: () => void;
  onDeepSeekExtract: () => void;
}

/**
 * Header component for the admin dictionaries page
 * Contains title, language selector and action buttons toolbar
 */
export function AdminDictionaryPageHeader({
  selectedLanguage,
  onLanguageChange,
  selectedWords,
  filteredWordDetails,
  onCreateWordList,
  onDeleteSelected,
  onAudioGenerated,
  onAddWordsToList,
  onDeepSeekExtract,
}: AdminDictionaryPageHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Dictionary Word Details</CardTitle>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Language:</span>
          <Select
            value={selectedLanguage}
            onValueChange={(value) => onLanguageChange(value as LanguageCode)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageDisplayNames).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <ActionButtonsToolbar
            selectedLanguage={selectedLanguage}
            selectedWords={selectedWords}
            filteredWordDetails={filteredWordDetails}
            onCreateWordList={onCreateWordList}
            onDeleteSelected={onDeleteSelected}
            onAudioGenerated={onAudioGenerated}
            onAddWordsToList={onAddWordsToList}
            onDeepSeekExtract={onDeepSeekExtract}
          />
        </div>
      </div>
    </CardHeader>
  );
}
