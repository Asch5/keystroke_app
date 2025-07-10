import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Definition } from 'extended-google-translate-api';
import { DefinitionsTabProps } from '../types';

/**
 * Definitions tab component for word definitions
 * Shows definitions organized by part of speech with examples and synonyms
 */
export function DefinitionsTab({ definitions }: DefinitionsTabProps) {
  if (!definitions || Object.keys(definitions).length === 0) {
    return <p className="text-content-secondary">No definitions available</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(definitions).map(
        ([type, definitionList]: [string, (string | Definition)[]]) => (
          <AccordionItem key={type} value={type}>
            <AccordionTrigger className="capitalize">{type}</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-6 space-y-2">
                {Array.isArray(definitionList) &&
                  definitionList.map(
                    (def: string | Definition, idx: number) => {
                      if (typeof def === 'string') {
                        return <li key={idx}>{def}</li>;
                      } else if (def.definition) {
                        return (
                          <li key={idx}>
                            <div className="mb-1">{def.definition}</div>
                            {def.example && (
                              <div className="text-content-secondary text-sm ml-2 italic">
                                Example: {def.example}
                              </div>
                            )}
                            {def.synonyms &&
                              Object.keys(def.synonyms).length > 0 && (
                                <div className="text-content-secondary text-sm ml-2">
                                  <span className="font-medium">
                                    Synonyms:{' '}
                                  </span>
                                  {Object.entries(def.synonyms).map(
                                    ([type, words]: [string, string[]]) => (
                                      <span key={type} className="mr-2">
                                        {type !== 'normal' && (
                                          <span className="italic">
                                            ({type})
                                          </span>
                                        )}
                                        {Array.isArray(words) &&
                                          words.join(', ')}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
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
