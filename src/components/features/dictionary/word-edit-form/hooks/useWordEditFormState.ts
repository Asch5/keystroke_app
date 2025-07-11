import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { WordFormValues } from '../index';

// Schema aligned with WordFormValues type (with explicit undefined support)
const wordFormSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  phonetic: z.string().optional(),
  etymology: z.string().optional(),
  definitions: z.array(
    z.object({
      text: z.string().min(1, 'Definition is required'),
      partOfSpeech: z.string(),
      subjectStatusLabels: z.string().optional(),
      isPlural: z.boolean(),
      generalLabels: z.string().optional(),
      grammaticalNote: z.string().optional(),
      usageNote: z.string().optional(),
      isInShortDef: z.boolean(),
      examples: z.array(
        z.object({
          text: z.string().min(1, 'Example is required'),
          grammaticalNote: z.string().optional(),
          audio: z.string().optional(),
        }),
      ),
    }),
  ),
  audioFiles: z.array(
    z.object({
      url: z.string().min(1, 'Audio URL is required'),
      isPrimary: z.boolean(),
    }),
  ),
  relatedWords: z
    .record(
      z.array(
        z.object({
          word: z.string().min(1, 'Related word is required'),
          phonetic: z.string().optional(),
          audio: z.string().optional(),
        }),
      ),
    )
    .optional(),
});

// Interface aligned with database schema (null instead of undefined)
interface BasicWordDetails {
  word: {
    text: string;
    phoneticGeneral?: string | null;
    etymology?: string | null;
  };
  definitions?: Array<{
    text: string;
    partOfSpeech: string;
    subjectStatusLabels?: string | null;
    isPlural: boolean;
    generalLabels?: string | null;
    grammaticalNote?: string | null;
    usageNote?: string | null;
    isInShortDef: boolean;
    examples: Array<{
      text: string;
      grammaticalNote?: string | null;
      audio?: string | null;
    }>;
  }>;
  audioFiles?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  relatedWords?: Record<
    string,
    Array<{
      word: string;
      phoneticGeneral?: string | null;
      audio?: string | null;
    }>
  >;
}

// Helper function to convert null to undefined for form compatibility
function convertNullToUndefined(
  value: string | null | undefined,
): string | undefined {
  return value === null ? undefined : value;
}

// Helper function to omit undefined values for exactOptionalPropertyTypes compliance
function omitUndefinedProperties<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

export function useWordEditFormState(
  wordDetails: BasicWordDetails | null,
  isLoading?: boolean,
) {
  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordFormSchema),
    defaultValues: {
      word: '',
      phonetic: undefined,
      etymology: undefined,
      definitions: [],
      audioFiles: [],
      relatedWords: undefined,
    },
  });

  useEffect(() => {
    if (wordDetails && !isLoading) {
      // Convert database format (null) to form format (undefined), omitting undefined values
      const formData: WordFormValues = omitUndefinedProperties({
        word: wordDetails.word.text || '',
        phonetic: convertNullToUndefined(wordDetails.word.phoneticGeneral),
        etymology: convertNullToUndefined(wordDetails.word.etymology),
        definitions: (wordDetails.definitions || []).map((def) =>
          omitUndefinedProperties({
            text: def.text,
            partOfSpeech: def.partOfSpeech,
            subjectStatusLabels: convertNullToUndefined(
              def.subjectStatusLabels,
            ),
            isPlural: def.isPlural,
            generalLabels: convertNullToUndefined(def.generalLabels),
            grammaticalNote: convertNullToUndefined(def.grammaticalNote),
            usageNote: convertNullToUndefined(def.usageNote),
            isInShortDef: def.isInShortDef,
            examples: def.examples.map((ex) =>
              omitUndefinedProperties({
                text: ex.text,
                grammaticalNote: convertNullToUndefined(ex.grammaticalNote),
                audio: convertNullToUndefined(ex.audio),
              }),
            ),
          }),
        ),
        audioFiles: wordDetails.audioFiles || [],
        relatedWords: wordDetails.relatedWords
          ? Object.fromEntries(
              Object.entries(wordDetails.relatedWords).map(([key, words]) => [
                key,
                words.map((word) =>
                  omitUndefinedProperties({
                    word: word.word,
                    phonetic: convertNullToUndefined(word.phoneticGeneral),
                    audio: convertNullToUndefined(word.audio),
                  }),
                ),
              ]),
            )
          : undefined,
      });

      form.reset(formData);
    }
  }, [wordDetails, isLoading, form]);

  return {
    form,
  };
}
