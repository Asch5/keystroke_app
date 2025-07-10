import React from 'react';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import { DefinitionCellProps } from '../types';

/**
 * Definition cell component for displaying word definitions and translations
 * Handles translation display based on user language preferences
 */
export function DefinitionCell({ word, userLanguages }: DefinitionCellProps) {
  return (
    <div className="max-w-xs">
      <p className="text-sm truncate">
        {userLanguages &&
        shouldShowTranslations(userLanguages.base, userLanguages.target)
          ? getDisplayDefinition(
              {
                definition: word.definition,
                targetLanguageCode: userLanguages.target,
                translations: word.translations,
              },
              userLanguages.base,
            ).content
          : word.definition}
      </p>
      {word.customNotes && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          Note: {word.customNotes}
        </p>
      )}
    </div>
  );
}
