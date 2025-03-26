// Types for dictionary-related data structures

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type PartOfSpeech =
    | 'noun'
    | 'verb'
    | 'adjective'
    | 'adverb'
    | 'pronoun'
    | 'preposition'
    | 'conjunction'
    | 'interjection';

export type SourceType = 'user' | 'import' | 'ai_generated';

export interface WordAnalysisResult {
    isCorrect: boolean;
    isWord: boolean;
    baseLanguage: string;
    targetLanguage: string;
    wordInBaseLanguage: string;
    wordInTargetLanguage: string;
    oneWordDefinitionInBaseLanguage: string;
    oneWordDefinitionInTargetLanguage: string;
    fullWordDescriptionInBaseLanguage: string;
    fullWordDescriptionInTargetLanguage: string;
    examplesInBaseLanguage: string[];
    examplesInTargetLanguage: string[];
    synonymsInBaseLanguage: string[];
    synonymsInTargetLanguage: string[];
    phoneticSpellingInBaseLanguage: string;
    phoneticSpellingInTargetLanguage: string;
    partOfSpeechInBaseLanguage: PartOfSpeech;
    partOfSpeechInTargetLanguage: PartOfSpeech;
    difficultyLevel: DifficultyLevel;
    source: SourceType;
}
