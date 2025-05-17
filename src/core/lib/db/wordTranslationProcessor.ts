import {
  LanguageCode,
  Prisma,
  SourceType,
  RelationshipType,
} from '@prisma/client';
import { TranslationService } from '@/core/lib/services/translationService';
import { serverLog, LogLevel } from '@/core/lib/utils/logUtils';

import { validateDanishDictionary } from '@/core/lib/utils/validations/danishDictionaryValidator';
import { processAndSaveDanishWord } from '@/core/lib/db/processOrdnetApi';

/**
 * Process translations for a word and its related data
 * @param tx Prisma transaction client
 * @param mainWordId ID of the main word
 * @param mainWordText Text of the main word
 * @param wordData Word data including phonetics, stems and definitions
 * @param sourceType Source of the word
 */
export async function processTranslationsForWord(
  tx: Prisma.TransactionClient,
  mainWordId: number,
  mainWordText: string,
  wordData: {
    phonetic: string | null;
    stems: string[];
    definitions: Array<{
      id: number;
      partOfSpeech: string;
      definition: string;
      examples: Array<{
        id: number;
        example: string;
      }>;
    }>;
  },
): Promise<void> {
  try {
    // Initialize translation service
    const translationService = new TranslationService();

    // Prepare the data for translation
    const translationResponse = await translationService.translateWordData(
      mainWordId,
      mainWordText,
      wordData.phonetic,
      wordData.definitions,
      wordData.stems,
      [], // No related words for now, we'll handle them separately if needed
    );

    if (!translationResponse) {
      serverLog(
        `No translation data returned for word: ${mainWordText}`,
        LogLevel.WARN,
      );
      return;
    }

    const { english_word_data, translation_word_for_danish_dictionary } =
      translationResponse;
    const danish_word_data = translation_word_for_danish_dictionary;

    // Validate the Danish dictionary data to catch any unknown entities
    validateDanishDictionary(danish_word_data, `word: ${mainWordText}`);

    if (!english_word_data) {
      serverLog(
        `No translation data returned for word: ${mainWordText}`,
        LogLevel.WARN,
      );
      return;
    }
    //!Process english word data
    // 1. Find or create translated main word - use upsert instead of create
    const translatedWord = await tx.word.upsert({
      where: {
        word_languageCode: {
          word: english_word_data.word.word_translation,
          languageCode: LanguageCode.da,
        },
      },
      update: {
        phoneticGeneral: english_word_data.word.phonetic_translation || null,
      },
      create: {
        word: english_word_data.word.word_translation,
        languageCode: LanguageCode.da,
        phoneticGeneral: english_word_data.word.phonetic_translation || null,
        etymology: null,
        sourceEntityId: SourceType.helsinki_nlp,
      },
    });

    // Create relationship between original and translated word
    await tx.wordToWordRelationship.upsert({
      where: {
        fromWordId_toWordId_type: {
          fromWordId: mainWordId,
          toWordId: translatedWord.id,
          type: RelationshipType.translation,
        },
      },
      update: {},
      create: {
        fromWordId: mainWordId,
        toWordId: translatedWord.id,
        type: RelationshipType.translation,
      },
    });

    // 3. Process definitions and examples
    for (const translatedDef of english_word_data.definitions) {
      const definitionTranslation = translatedDef.definition_translation;
      if (definitionTranslation && typeof definitionTranslation === 'string') {
        // Create the translation
        const translation = await tx.translation.create({
          data: {
            languageCode: LanguageCode.da,
            content: definitionTranslation,
            source: SourceType.helsinki_nlp,
          },
        });

        // Link translation to definition
        await tx.definitionTranslation.create({
          data: {
            definitionId: translatedDef.definitionId,
            translationId: translation.id,
          },
        });

        // Process examples
        for (const translatedExample of translatedDef.examples) {
          const exampleTranslation = translatedExample.example_translation;
          if (exampleTranslation && typeof exampleTranslation === 'string') {
            // Create the translation
            const exampleTrans = await tx.translation.create({
              data: {
                languageCode: LanguageCode.da,
                content: exampleTranslation,
                source: SourceType.helsinki_nlp,
              },
            });

            // Link translation to example
            await tx.exampleTranslation.create({
              data: {
                exampleId: translatedExample.exampleId,
                translationId: exampleTrans.id,
              },
            });
          }
        }
      }
    }

    //!Process danish word data
    if (danish_word_data && Object.keys(danish_word_data).length > 0) {
      if (danish_word_data.variants && danish_word_data.variants.length > 0) {
        for (const variant of danish_word_data.variants) {
          if (variant) {
            await processAndSaveDanishWord(variant);
          }
        }
      }
    }
  } catch (error) {
    serverLog(
      `Error processing translations for word: ${mainWordText}`,
      LogLevel.ERROR,
    );
    throw error;
  }
}
