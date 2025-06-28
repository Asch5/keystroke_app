import { LanguageCode, PartOfSpeech, SourceType } from '@prisma/client';

// Map for display names of language codes
export const languageDisplayNames: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

// Map for display names of parts of speech
export const partOfSpeechDisplayNames: Record<PartOfSpeech, string> = {
  first_part: 'First Part',
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
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

// Map for display names of source types
export const sourceTypeDisplayNames: Record<SourceType, string> = {
  ai_generated: 'AI Generated',
  merriam_learners: 'Merriam Learners',
  merriam_intermediate: 'Merriam Intermediate',
  helsinki_nlp: 'Helsinki NLP',
  danish_dictionary: 'Danish Dictionary',
  user: 'User',
  admin: 'Admin',
  frequency_import: 'Frequency Import',
};

export interface FilterState {
  partOfSpeech: PartOfSpeech[];
  source: SourceType[];
  hasAudio: boolean | null;
  hasImage: boolean | null;
  hasVariant: boolean | null;
  hasDefinition: boolean | null;
  // Frequency range filters (1-10 scale)
  frequencyGeneralMin: number | null;
  frequencyGeneralMax: number | null;
  frequencyMin: number | null;
  frequencyMax: number | null;
}
