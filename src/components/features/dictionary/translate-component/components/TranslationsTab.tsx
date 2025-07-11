import { TranslationSynonym } from 'extended-google-translate-api';
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TranslationsTabProps } from '../types';

/**
 * Translations tab component for detailed translations
 * Shows translations organized by part of speech with synonyms
 */
export function TranslationsTab({ translations }: TranslationsTabProps) {
  if (!translations || Object.keys(translations).length === 0) {
    return (
      <p className="text-content-secondary">
        No detailed translations available
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(translations).map(
        ([type, translationList]: [
          string,
          (string | TranslationSynonym)[],
        ]) => (
          <AccordionItem key={type} value={type}>
            <AccordionTrigger className="capitalize">{type}</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-6 space-y-1">
                {Array.isArray(translationList) &&
                  translationList.map(
                    (translation: string | TranslationSynonym, idx: number) => {
                      if (typeof translation === 'string') {
                        return <li key={idx}>{translation}</li>;
                      } else if (translation.translation) {
                        return (
                          <li key={idx}>
                            <div>
                              <span className="font-medium">
                                {translation.translation}
                              </span>
                              {translation.synonyms &&
                                translation.synonyms.length > 0 && (
                                  <span className="text-content-secondary ml-2">
                                    (Synonyms: {translation.synonyms.join(', ')}
                                    )
                                  </span>
                                )}
                            </div>
                          </li>
                        );
                      }
                      return null;
                    },
                  )}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ),
      )}
    </Accordion>
  );
}
