import { clientLog } from '@/core/lib/utils/logUtils';
import { LanguageCode } from '@/core/types';
import {
  TranslationCombinedResponse,
  TranslationRequest,
} from '@/core/types/translationDanishTypes';

export class TranslationService {
  private readonly API_URL = 'http://127.0.0.1:5000/process_dictionary';

  async translateWordData(
    wordId: number,
    word: string,
    phonetic: string | null,
    definitions: Array<{
      id: number;
      partOfSpeech: string;
      definition: string;
      examples: Array<{
        id: number;
        example: string;
      }>;
    }>,
    stems: string[],
    relatedWords: Array<{
      type: string;
      word: string;
    }>,
  ): Promise<TranslationCombinedResponse | null> {
    try {
      const translationRequest: TranslationRequest = {
        metadata: {
          languageCode: LanguageCode.en,
          languageCode_translation: LanguageCode.da,
          sourceTranslator: 'Helsinki-NLP',
        },
        word: {
          wordId,
          word,
          phonetic,
          word_translation: '',
          phonetic_translation: '',
          sourceTranslator: 'Helsinki-NLP',
          word_variants: [],
          relatedWords: relatedWords.map((related) => ({
            type: related.type,
            word: related.word,
            ...(related.type === 'synonym'
              ? { synonym_translation: '' }
              : { antonym_translation: '' }),
          })),
        },
        definitions: definitions.map((def) => ({
          definitionId: def.id,
          partOfSpeech: def.partOfSpeech,
          definition: def.definition,
          definition_translation: '',
          examples: def.examples.map((ex) => ({
            exampleId: ex.id,
            example: ex.example,
            example_translation: '',
          })),
        })),
        stems,
        stems_translation: stems.map(() => ''),
      };

      const requestPayload = [translationRequest];

      void clientLog(`Sent request: ${JSON.stringify(requestPayload)}`, 'info');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const translatedDataArray: unknown = await response.json();
      const translatedData: TranslationCombinedResponse | null =
        Array.isArray(translatedDataArray) && translatedDataArray.length > 0
          ? (translatedDataArray[0] as TranslationCombinedResponse)
          : null;
      void clientLog(
        `FROM TRANSLATION SERVICE: Translated data: ${JSON.stringify(
          translatedData,
        )}`,
        'info',
      );
      return translatedData;
    } catch (error) {
      void clientLog(
        `Translation error for word ${word}: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
      return null;
    }
  }
}
