declare module 'extended-google-translate-api' {
  export interface TranslateOptions {
    returnRawResponse?: boolean;
    detailedTranslations?: boolean;
    definitionSynonyms?: boolean;
    detailedTranslationsSynonyms?: boolean;
    definitions?: boolean;
    definitionExamples?: boolean;
    examples?: boolean;
    removeStyles?: boolean;
  }

  export interface TranslationSynonym {
    translation: string;
    synonyms: string[];
    frequency?: number;
  }

  export interface Definition {
    definition: string;
    example?: string;
    synonyms?: Record<string, string[]>;
  }

  export interface TranslationResponse {
    word: string;
    translation: string;
    wordTranscription?: string;
    translationTranscription?: string;
    translations?: Record<string, (string | TranslationSynonym)[]>;
    definitions?: Record<string, (string | Definition)[]>;
    examples?: string[];
  }

  const translate: (
    text: string,
    sourceLang: string,
    destLang: string,
    options?: TranslateOptions,
  ) => Promise<TranslationResponse>;

  export default translate;
}
