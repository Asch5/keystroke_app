import { LanguageCode } from '@/core/types';

/**
 * API response types for Danish translation
 * Split from translationDanishTypes.ts for better maintainability
 */

// Import types from core files
import type {
  PartOfSpeechDanish,
  GenderTypeDanish,
  PartOfSpeechForStems,
  SourceOfExample,
  TranslationRequest,
} from './danish-core';
import type { DetailCategoryDanish } from './danish-labels';
import type { RelationshipTypeVerbsInAudio } from './danish-audio';

export interface DanishDictionaryObject {
  metadata?: {
    languageCode: LanguageCode;
    languageCode_translation: LanguageCode;
    sourceTranslator: string;
    sourceWord: string;
  };
  word: {
    word: string;
    word_variants: string[] | null;
    phonetic: string;
    partOfSpeech:
      | [PartOfSpeechDanish, GenderTypeDanish]
      | [PartOfSpeechDanish]
      | [];
    forms?: string[];
    contextual_forms?: string[] | null;
    audio: {
      audio_type: string;
      audio_url: string;
      phonetic_audio: string;
      word: RelationshipTypeVerbsInAudio | null;
    }[];
    etymology: string;
    colloquialism?: string[];
  };
  definition: {
    id: string;
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  fixed_expressions: {
    expression: string;
    expression_translation_en: string;
    expression_variants: string[];
    definition: {
      id: string;
      definition: string;
      definition_translation_en: string;
      examples: string[];
      examples_translation_en: string[];
      sources: SourceOfExample[];
      labels: {
        [key in DetailCategoryDanish]?: string[] | boolean | string;
      };
      labels_translation_en?: {
        [key in DetailCategoryDanish]?: string[] | boolean | string;
      };
    }[];
  }[];
  stems?: {
    stem: string;
    stem_translation_en: string;
    partOfSpeech: PartOfSpeechForStems;
  }[];
  compositions?: {
    composition: string;
    composition_translation_en: string;
  }[];
  synonyms: string[];
  synonyms_translation_en: string[];
  antonyms: string[];
  antonyms_translation_en?: string[];
  variants?: WordVariant[];
  related_words?: string[];
  error?: string;
}

export interface WordVariant {
  word: {
    word: string;
    word_variants: string[] | null;
    phonetic: string;
    partOfSpeech: [PartOfSpeechDanish, GenderTypeDanish] | [PartOfSpeechDanish];
    forms: string[];
    contextual_forms?: string[] | null;
    audio: {
      audio_type: string;
      audio_url: string;
      phonetic_audio: string;
      word: RelationshipTypeVerbsInAudio | null | string;
    }[];
    etymology: string | null;
    colloquialism: string[];
    variant: string;
    variant_pos: string;
  };
  definition: {
    id: string;
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  fixed_expressions: {
    expression: string;
    expression_translation_en: string;
    expression_variants: string[];
    definition: {
      id: string;
      definition: string;
      definition_translation_en: string;
      examples: string[];
      examples_translation_en: string[];
      sources: SourceOfExample[];
      labels: {
        [key in DetailCategoryDanish]?: string[] | boolean | string;
      };
      labels_translation_en?: {
        [key in DetailCategoryDanish]?: string[] | boolean | string;
      };
    }[];
  }[];
  stems: {
    stem: string;
    stem_translation_en: string;
    partOfSpeech: PartOfSpeechForStems;
  }[];
  compositions: {
    composition: string;
    composition_translation_en: string;
  }[];
  synonyms: string[];
  synonyms_translation_en: string[];
  antonyms: string[];
  antonyms_translation_en: string[];
}

export interface FixedExpressionDefinition {
  id: string;
  definition: string;
  definition_translation_en: string;
  examples: string[];
  examples_translation_en: string[];
  sources: SourceOfExample[];
  labels?: {
    [key in DetailCategoryDanish]?: string[] | boolean | string;
  };
  labels_translation_en?: {
    [key in DetailCategoryDanish]?: string[] | boolean | string;
  };
}

export interface FixedExpression {
  expression: string;
  expression_translation_en: string;
  expression_variants: string[];
  definition: FixedExpressionDefinition[];
}

export interface TranslationCombinedResponse {
  english_word_data: TranslationRequest;
  translation_word_for_danish_dictionary: DanishDictionaryObject;
}
