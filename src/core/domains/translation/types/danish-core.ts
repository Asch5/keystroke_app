// Core Danish word and definition types - no external imports needed for this file

/**
 * Core Danish word and definition types
 * Split from translationDanishTypes.ts for better maintainability
 */

// Basic Danish part of speech types
export type PartOfSpeechDanish =
  //default Part Of Speech for a Definitions (if we do not have Labels like this "'som adjektiv'")
  | 'substantiv'
  | 'verbum'
  | 'adjektiv'
  | 'adj. pl.'
  | 'adverbium'
  | 'pronomen'
  | 'præposition'
  | 'konjunktion'
  | 'interjektion'
  | 'artikel'
  | 'talord'
  | 'talord (mængdetal)'
  | 'talord (ordenstal)'
  | 'udråbsord'
  | 'forkortelse'
  | 'suffiks'
  | 'sidsteled' //last letter
  | 'undefined'
  //gender
  | 'fælleskøn'
  | 'intetkøn'
  | 'fælleskønellerintetkøn';

export type PartOfSpeechForStems =
  | 'vb.'
  | 'adj.'
  | 'adv.'
  | 'sb.'
  | 'præp.'
  | 'konj.'
  | 'pron.'
  | 'num.'
  | 'interj.';

export type GenderTypeDanish =
  | 'fælleskøn'
  | 'intetkøn'
  | 'fælleskønellerintetkøn';

// Source of examples
export type SourceOfExample = {
  short: string;
  full: string;
};

// Basic example interface
export interface Example {
  example: string;
  translation?: string;
  notes?: string;
}

// Translation request structure
export interface TranslationRequest {
  metadata: {
    languageCode: string;
    languageCode_translation: string;
    sourceTranslator: string;
  };
  word: {
    wordId: number;
    word: string;
    word_variants: string[] | null;
    phonetic: string | null;
    word_translation: string;
    phonetic_translation: string;
    sourceTranslator: string;
    relatedWords: Array<{
      type: string;
      word: string;
      synonym_translation?: string;
      antonym_translation?: string;
    }>;
  };
  definitions: Array<{
    definitionId: number;
    partOfSpeech: string;
    definition: string;
    definition_translation: string;
    examples: Array<{
      exampleId: number;
      example: string;
      example_translation: string;
      source?: string | null;
    }>;
  }>;
  stems: string[];
  stems_translation: string[];
}
