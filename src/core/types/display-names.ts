import {
  PartOfSpeech,
  LanguageCode,
  DifficultyLevel,
  RelationshipType,
  SourceType,
  Gender,
  LearningStatus,
} from './index';

/**
 * Centralized Display Name Mappings
 *
 * This file contains all human-readable display names for enum values
 * to maintain consistency and eliminate duplication across components.
 *
 * Usage:
 * import { DISPLAY_NAMES } from '@/core/types/display-names';
 * const label = DISPLAY_NAMES.partOfSpeech[value];
 */

// Part of Speech Display Names (matching Prisma schema)
export const PART_OF_SPEECH_DISPLAY_NAMES: Record<PartOfSpeech, string> = {
  noun: 'Noun',
  verb: 'Verb',
  phrasal_verb: 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  numeral: 'Numeral',
  article: 'Article',
  exclamation: 'Exclamation',
  abbreviation: 'Abbreviation',
  suffix: 'Suffix',
  first_part: 'First Part',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

// Language Display Names (matching Prisma schema)
export const LANGUAGE_DISPLAY_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese Mandarin',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian (Farsi)',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
};

// Difficulty Level Display Names (matching Prisma schema)
export const DIFFICULTY_DISPLAY_NAMES: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

// Relationship Type Display Names (matching Prisma schema)
export const RELATIONSHIP_TYPE_DISPLAY_NAMES: Record<RelationshipType, string> =
  {
    synonym: 'Synonym',
    antonym: 'Antonym',
    related: 'Related',
    stem: 'Stem',
    composition: 'Composition',
    phrasal_verb: 'Phrasal Verb',
    phrase: 'Phrase',
    alternative_spelling: 'Alternative Spelling',
    abbreviation: 'Abbreviation',
    derived_form: 'Derived Form',
    dialect_variant: 'Dialect Variant',
    translation: 'Translation',
    // English-specific inflections
    plural_en: 'Plural (English)',
    past_tense_en: 'Past Tense (English)',
    past_participle_en: 'Past Participle (English)',
    present_participle_en: 'Present Participle (English)',
    third_person_en: 'Third Person (English)',
    variant_form_phrasal_verb_en: 'Phrasal Verb Variant (English)',
    // Danish-specific inflections
    definite_form_da: 'Definite Form (Danish)',
    plural_da: 'Plural (Danish)',
    plural_definite_da: 'Plural Definite (Danish)',
    present_tense_da: 'Present Tense (Danish)',
    past_tense_da: 'Past Tense (Danish)',
    past_participle_da: 'Past Participle (Danish)',
    imperative_da: 'Imperative (Danish)',
    adjective_neuter_da: 'Adjective Neuter (Danish)',
    adjective_plural_da: 'Adjective Plural (Danish)',
    comparative_da: 'Comparative (Danish)',
    superlative_da: 'Superlative (Danish)',
    adverb_comparative_da: 'Adverb Comparative (Danish)',
    adverb_superlative_da: 'Adverb Superlative (Danish)',
    pronoun_accusative_da: 'Pronoun Accusative (Danish)',
    pronoun_genitive_da: 'Pronoun Genitive (Danish)',
    genitive_form_da: 'Genitive Form (Danish)',
    common_gender_da: 'Common Gender (Danish)',
    neuter_gender_da: 'Neuter Gender (Danish)',
    neuter_form_da: 'Neuter Form (Danish)',
    adverbial_form_da: 'Adverbial Form (Danish)',
    other_form_da: 'Other Form (Danish)',
    neuter_pronoun_da: 'Neuter Pronoun (Danish)',
    plural_pronoun_da: 'Plural Pronoun (Danish)',
    contextual_usage_da: 'Contextual Usage (Danish)',
  };

// Source Type Display Names (matching Prisma schema)
export const SOURCE_TYPE_DISPLAY_NAMES: Record<SourceType, string> = {
  ai_generated: 'AI Generated',
  merriam_learners: "Merriam-Webster Learner's",
  merriam_intermediate: 'Merriam-Webster Intermediate',
  helsinki_nlp: 'Helsinki NLP',
  danish_dictionary: 'Danish Dictionary',
  user: 'User Created',
  admin: 'Admin Created',
  frequency_import: 'Frequency Import',
};

// Gender Display Names (matching Prisma schema)
export const GENDER_DISPLAY_NAMES: Record<Gender, string> = {
  masculine: 'Masculine',
  feminine: 'Feminine',
  common: 'Common (n-word)',
  neuter: 'Neuter (t-word)',
  common_neuter: 'Common/Neuter (n-t-word)',
};

// Learning Status Display Names (matching Prisma schema)
export const LEARNING_STATUS_DISPLAY_NAMES: Record<LearningStatus, string> = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  learned: 'Learned',
  needsReview: 'Needs Review',
  difficult: 'Difficult',
};

// Consolidated Display Names Object
export const DISPLAY_NAMES = {
  partOfSpeech: PART_OF_SPEECH_DISPLAY_NAMES,
  language: LANGUAGE_DISPLAY_NAMES,
  difficulty: DIFFICULTY_DISPLAY_NAMES,
  relationshipType: RELATIONSHIP_TYPE_DISPLAY_NAMES,
  sourceType: SOURCE_TYPE_DISPLAY_NAMES,
  gender: GENDER_DISPLAY_NAMES,
  learningStatus: LEARNING_STATUS_DISPLAY_NAMES,
} as const;

// Utility Functions for Display Names
export const getPartOfSpeechDisplayName = (value: PartOfSpeech): string =>
  PART_OF_SPEECH_DISPLAY_NAMES[value];

export const getLanguageDisplayName = (value: LanguageCode): string =>
  LANGUAGE_DISPLAY_NAMES[value];

export const getDifficultyDisplayName = (value: DifficultyLevel): string =>
  DIFFICULTY_DISPLAY_NAMES[value];

export const getRelationshipTypeDisplayName = (
  value: RelationshipType,
): string => RELATIONSHIP_TYPE_DISPLAY_NAMES[value];

export const getSourceTypeDisplayName = (value: SourceType): string =>
  SOURCE_TYPE_DISPLAY_NAMES[value];

export const getGenderDisplayName = (value: Gender): string =>
  GENDER_DISPLAY_NAMES[value];

export const getLearningStatusDisplayName = (value: LearningStatus): string =>
  LEARNING_STATUS_DISPLAY_NAMES[value];

// Type-safe helper for getting any display name
export function getDisplayName<T extends keyof typeof DISPLAY_NAMES>(
  category: T,
  value: keyof (typeof DISPLAY_NAMES)[T],
): string {
  const displayNameMap = DISPLAY_NAMES[category];
  return (
    (displayNameMap as Record<string, string>)[value as string] || String(value)
  );
}
