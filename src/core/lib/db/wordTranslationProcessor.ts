'use server';

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
import { prisma } from '@/core/lib/prisma';
import { ProcessedWordData } from '@/core/types/dictionary';
import type { WordVariant } from '@/core/types/translationDanishTypes';
import { logToFile } from '../server/serverLogger';

/**
 * Process translations for a word and its related data
 * @param mainWordId ID of the main word
 * @param mainWordText Text of the main word
 * @param wordData Word data including phonetics, stems and definitions
 * @param sourceType Source of the word
 */
export async function processTranslationsForWord(
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
    const translationService = new TranslationService();

    const translationResponse = await translationService.translateWordData(
      mainWordId,
      mainWordText,
      wordData.phonetic,
      wordData.definitions,
      wordData.stems,
      [],
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

    validateDanishDictionary(danish_word_data, `word: ${mainWordText}`);

    await prisma.$transaction(
      async (transactionPrisma) => {
        if (english_word_data && english_word_data.word) {
          const translatedWord = await transactionPrisma.word.upsert({
            where: {
              word_languageCode: {
                word: english_word_data.word.word_translation,
                languageCode: LanguageCode.da,
              },
            },
            update: {
              phoneticGeneral:
                english_word_data.word.phonetic_translation || null,
            },
            create: {
              word: english_word_data.word.word_translation,
              languageCode: LanguageCode.da,
              phoneticGeneral:
                english_word_data.word.phonetic_translation || null,
              etymology: null,
              sourceEntityId: SourceType.helsinki_nlp,
            },
          });

          await transactionPrisma.wordToWordRelationship.upsert({
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

          for (const translatedDef of english_word_data.definitions) {
            const definitionTranslationText =
              translatedDef.definition_translation;
            if (
              definitionTranslationText &&
              typeof definitionTranslationText === 'string'
            ) {
              let translation = await transactionPrisma.translation.findFirst({
                where: {
                  content: definitionTranslationText,
                  languageCode: LanguageCode.da,
                  source: SourceType.helsinki_nlp,
                },
              });

              if (!translation) {
                translation = await transactionPrisma.translation.create({
                  data: {
                    languageCode: LanguageCode.da,
                    content: definitionTranslationText,
                    source: SourceType.helsinki_nlp,
                  },
                });
              }

              await transactionPrisma.definitionTranslation.upsert({
                where: {
                  definitionId_translationId: {
                    definitionId: translatedDef.definitionId,
                    translationId: translation.id,
                  },
                },
                update: {},
                create: {
                  definitionId: translatedDef.definitionId,
                  translationId: translation.id,
                },
              });

              for (const translatedExample of translatedDef.examples) {
                const exampleTranslationText =
                  translatedExample.example_translation;
                if (
                  exampleTranslationText &&
                  typeof exampleTranslationText === 'string'
                ) {
                  let exampleTrans =
                    await transactionPrisma.translation.findFirst({
                      where: {
                        content: exampleTranslationText,
                        languageCode: LanguageCode.da,
                        source: SourceType.helsinki_nlp,
                      },
                    });

                  if (!exampleTrans) {
                    exampleTrans = await transactionPrisma.translation.create({
                      data: {
                        languageCode: LanguageCode.da,
                        content: exampleTranslationText,
                        source: SourceType.helsinki_nlp,
                      },
                    });
                  }

                  await transactionPrisma.exampleTranslation.upsert({
                    where: {
                      exampleId_translationId: {
                        exampleId: translatedExample.exampleId,
                        translationId: exampleTrans.id,
                      },
                    },
                    update: {},
                    create: {
                      exampleId: translatedExample.exampleId,
                      translationId: exampleTrans.id,
                    },
                  });
                }
              }
            }
          }
        }

        if (danish_word_data && Object.keys(danish_word_data).length > 0) {
          if (
            danish_word_data.variants &&
            danish_word_data.variants.length > 0
          ) {
            for (const variant of danish_word_data.variants) {
              if (variant) {
                const savedDanishWord = await processAndSaveDanishWord(
                  variant,
                  transactionPrisma,
                );

                await processEnglishTranslationsForDanishWord(
                  savedDanishWord,
                  variant,
                  transactionPrisma,
                );
              }
            }
          }
        }
      },
      {
        maxWait: 60000,
        timeout: 120000,
      },
    );
  } catch (error) {
    serverLog(
      `Error processing translations for word: ${mainWordText} - ${error instanceof Error ? error.message : String(error)}`,
      LogLevel.ERROR,
    );
    if (
      !(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2028'
      )
    ) {
      throw error;
    }
  }
}

/**
 * Process and save English translations of Danish word content
 * @param danishWordData The saved Danish word data with DB IDs
 * @param variantData Raw variant data containing translations
 * @param tx Transaction client for database operations
 */
export async function processEnglishTranslationsForDanishWord(
  danishWordData: ProcessedWordData,
  variantData: WordVariant,
  tx: Prisma.TransactionClient,
): Promise<void> {
  try {
    if (!danishWordData || !variantData || !danishWordData.word) return;

    const danishWordId = danishWordData.word.id;
    if (!danishWordId) {
      logToFile(
        `Missing Danish word ID (danishWordData.word.id) for translation processing.`,
        LogLevel.WARN,
      );
      return;
    }

    if (variantData.definition && variantData.definition.length > 0) {
      for (let i = 0; i < variantData.definition.length; i++) {
        const danishDef = variantData.definition[i];
        if (!danishDef) continue;

        const defId = danishWordData.definitions?.[i]?.id;
        if (!defId) {
          logToFile(
            `Missing definition ID for Danish definition index ${i}`,
            LogLevel.WARN,
          );
          continue;
        }

        if (danishDef.definition_translation_en) {
          let englishTranslation = await tx.translation.findFirst({
            where: {
              content: danishDef.definition_translation_en,
              languageCode: LanguageCode.en,
              source: SourceType.helsinki_nlp,
            },
          });

          if (!englishTranslation) {
            englishTranslation = await tx.translation.create({
              data: {
                languageCode: LanguageCode.en,
                content: danishDef.definition_translation_en,
                source: SourceType.helsinki_nlp,
              },
            });
          }

          await tx.definitionTranslation.upsert({
            where: {
              definitionId_translationId: {
                definitionId: defId,
                translationId: englishTranslation.id,
              },
            },
            update: {},
            create: {
              definitionId: defId,
              translationId: englishTranslation.id,
            },
          });

          const processedDefinitionExamples =
            danishWordData.definitions?.[i]?.examples;

          // Combine English translations for examples according to the structure in response_translation.json
          const combinedEnglishExampleTranslations: string[] = [];
          if (
            danishDef.labels_translation_en?.Eksempler &&
            Array.isArray(danishDef.labels_translation_en.Eksempler)
          ) {
            combinedEnglishExampleTranslations.push(
              ...danishDef.labels_translation_en.Eksempler.map(String),
            ); // Ensure they are strings
          }
          if (
            danishDef.examples_translation_en &&
            Array.isArray(danishDef.examples_translation_en)
          ) {
            combinedEnglishExampleTranslations.push(
              ...danishDef.examples_translation_en.map(String),
            ); // Ensure they are strings
          }

          if (
            processedDefinitionExamples &&
            Array.isArray(processedDefinitionExamples) &&
            combinedEnglishExampleTranslations.length > 0 // Check if we have any translations to process
          ) {
            if (
              processedDefinitionExamples.length !==
              combinedEnglishExampleTranslations.length
            ) {
              serverLog(
                `Mismatch in length between processed examples (${processedDefinitionExamples.length}) and their combined English translations (${combinedEnglishExampleTranslations.length}) for definition index ${i} of word ID ${danishWordId}. Translations may be misaligned. Check input data structure and Helsinki NLP response.`,
                LogLevel.WARN,
              );
            }

            const loopLength = Math.min(
              processedDefinitionExamples.length,
              combinedEnglishExampleTranslations.length,
            );
            for (let j = 0; j < loopLength; j++) {
              const currentProcessedExample = processedDefinitionExamples[j];
              const englishExampleTranslationText =
                combinedEnglishExampleTranslations[j];

              if (
                !currentProcessedExample ||
                !currentProcessedExample.id ||
                !englishExampleTranslationText
              ) {
                serverLog(
                  `Skipping example translation due to missing data. Def Index: ${i}, Ex Index: ${j}, Word ID: ${danishWordId}, Example ID: ${currentProcessedExample?.id}, Translation: '${englishExampleTranslationText}'`,
                  LogLevel.INFO,
                );
                continue;
              }

              const exampleId = currentProcessedExample.id;

              let exampleTranslation = await tx.translation.findFirst({
                where: {
                  content: englishExampleTranslationText,
                  languageCode: LanguageCode.en,
                  source: SourceType.helsinki_nlp,
                },
              });

              if (!exampleTranslation) {
                exampleTranslation = await tx.translation.create({
                  data: {
                    languageCode: LanguageCode.en,
                    content: englishExampleTranslationText,
                    source: SourceType.helsinki_nlp,
                  },
                });
              }

              await tx.exampleTranslation.upsert({
                where: {
                  exampleId_translationId: {
                    exampleId: exampleId,
                    translationId: exampleTranslation.id,
                  },
                },
                update: {},
                create: {
                  exampleId: exampleId,
                  translationId: exampleTranslation.id,
                },
              });
            }
          }
        }
      }
    }

    if (
      variantData.fixed_expressions &&
      variantData.fixed_expressions.length > 0
    ) {
      serverLog(
        `Processing ${variantData.fixed_expressions.length} fixed expressions with translations for Danish word ID ${danishWordId}`,
        LogLevel.INFO,
      );

      for (const expression of variantData.fixed_expressions) {
        // Find all subwords with this expression text
        const expressionSubWords = await tx.word.findMany({
          where: {
            word: expression.expression,
            languageCode: LanguageCode.da,
          },
        });

        if (!expressionSubWords || expressionSubWords.length === 0) {
          serverLog(
            `Could not find expression "${expression.expression}" in database for translation processing`,
            LogLevel.WARN,
          );
          continue;
        }

        serverLog(
          `Processing translations for expression "${expression.expression}" with ${expression.definition.length} definition(s)`,
          LogLevel.INFO,
        );

        // For each definition in the expression
        for (let i = 0; i < expression.definition.length; i++) {
          const expressionDef = expression.definition[i];
          if (!expressionDef) continue;

          serverLog(
            `Processing expression definition ${i + 1}/${expression.definition.length}: "${expressionDef.definition?.substring(0, 30)}..."`,
            LogLevel.INFO,
          );

          // Skip if no translation available
          if (!expressionDef.definition_translation_en) {
            serverLog(
              `No English translation found for definition ${i + 1} of expression "${expression.expression}"`,
              LogLevel.INFO,
            );
            continue;
          }

          // Find matching definition in the database
          const matchingDefinition = await tx.definition.findFirst({
            where: {
              definition: expressionDef.definition,
              languageCode: LanguageCode.da,
            },
          });

          if (!matchingDefinition) {
            serverLog(
              `Could not find definition "${expressionDef.definition.substring(0, 30)}..." in database for expression "${expression.expression}"`,
              LogLevel.WARN,
            );
            continue;
          }

          // Find all examples for this definition
          const definitionExamples = await tx.definitionExample.findMany({
            where: {
              definitionId: matchingDefinition.id,
            },
          });

          if (!definitionExamples || definitionExamples.length === 0) {
            serverLog(
              `No examples found in the database for definition "${matchingDefinition.definition.substring(0, 30)}..." of expression "${expression.expression}"`,
              LogLevel.WARN,
            );
            continue;
          }

          // Log found examples for debugging
          serverLog(
            `Found ${definitionExamples.length} examples in database for definition ID ${matchingDefinition.id}`,
            LogLevel.INFO,
          );

          for (const dbEx of definitionExamples) {
            serverLog(
              `  - Example: "${dbEx.example.substring(0, 30)}..." (ID: ${dbEx.id})`,
              LogLevel.INFO,
            );
          }

          // Save definition translation
          let englishTranslation = await tx.translation.findFirst({
            where: {
              content: expressionDef.definition_translation_en,
              languageCode: LanguageCode.en,
              source: SourceType.helsinki_nlp,
            },
          });

          if (!englishTranslation) {
            englishTranslation = await tx.translation.create({
              data: {
                languageCode: LanguageCode.en,
                content: expressionDef.definition_translation_en,
                source: SourceType.helsinki_nlp,
              },
            });
          }

          await tx.definitionTranslation.upsert({
            where: {
              definitionId_translationId: {
                definitionId: matchingDefinition.id,
                translationId: englishTranslation.id,
              },
            },
            update: {},
            create: {
              definitionId: matchingDefinition.id,
              translationId: englishTranslation.id,
            },
          });

          // Process examples - combine translations from both sources
          const combinedExampleTranslations: string[] = [];

          // Add translations from labels_translation_en.Eksempler if they exist
          if (
            expressionDef.labels_translation_en?.Eksempler &&
            Array.isArray(expressionDef.labels_translation_en.Eksempler)
          ) {
            combinedExampleTranslations.push(
              ...expressionDef.labels_translation_en.Eksempler.map(String),
            );
            serverLog(
              `Added ${expressionDef.labels_translation_en.Eksempler.length} Eksempler translations for expression "${expression.expression}"`,
              LogLevel.INFO,
            );
          }

          // Add translations from examples_translation_en if they exist
          if (
            expressionDef.examples_translation_en &&
            Array.isArray(expressionDef.examples_translation_en)
          ) {
            combinedExampleTranslations.push(
              ...expressionDef.examples_translation_en.map(String),
            );
            serverLog(
              `Added ${expressionDef.examples_translation_en.length} examples translations for expression "${expression.expression}"`,
              LogLevel.INFO,
            );
          }

          // Log the translations we've found for debugging
          serverLog(
            `Collected ${combinedExampleTranslations.length} translations for examples:`,
            LogLevel.INFO,
          );

          for (const trans of combinedExampleTranslations) {
            serverLog(
              `  - Translation: "${trans.substring(0, 30)}..."`,
              LogLevel.INFO,
            );
          }

          // Skip if no example translations
          if (combinedExampleTranslations.length === 0) {
            serverLog(
              `No example translations found for definition "${matchingDefinition.definition.substring(0, 30)}..." of expression "${expression.expression}"`,
              LogLevel.WARN,
            );
            continue;
          }

          // Match examples with translations directly
          if (
            expressionDef.examples &&
            Array.isArray(expressionDef.examples) &&
            expressionDef.examples_translation_en &&
            Array.isArray(expressionDef.examples_translation_en) &&
            expressionDef.examples.length ===
              expressionDef.examples_translation_en.length
          ) {
            // When we have a perfect match between examples and translations, we can match them directly
            serverLog(
              `Direct matching of ${expressionDef.examples.length} examples to translations`,
              LogLevel.INFO,
            );

            for (let j = 0; j < expressionDef.examples.length; j++) {
              const exampleText = expressionDef.examples[j];
              const translationText = expressionDef.examples_translation_en[j];

              // Skip if we don't have both example and translation
              if (!exampleText || !translationText) {
                serverLog(
                  `Skipping example at index ${j} due to undefined example or translation`,
                  LogLevel.INFO,
                );
                continue;
              }

              // Find the matching example in the database
              const dbExample = definitionExamples.find(
                (ex) => ex.example === exampleText,
              );

              if (!dbExample) {
                serverLog(
                  `Could not find example "${exampleText.substring(0, 30)}..." in database`,
                  LogLevel.WARN,
                );
                continue;
              }

              // Save the translation
              let exampleTranslation = await tx.translation.findFirst({
                where: {
                  content: translationText,
                  languageCode: LanguageCode.en,
                  source: SourceType.helsinki_nlp,
                },
              });

              if (!exampleTranslation) {
                exampleTranslation = await tx.translation.create({
                  data: {
                    languageCode: LanguageCode.en,
                    content: translationText,
                    source: SourceType.helsinki_nlp,
                  },
                });
              }

              await tx.exampleTranslation.upsert({
                where: {
                  exampleId_translationId: {
                    exampleId: dbExample.id,
                    translationId: exampleTranslation.id,
                  },
                },
                update: {},
                create: {
                  exampleId: dbExample.id,
                  translationId: exampleTranslation.id,
                },
              });

              serverLog(
                `Saved DIRECT translation for example "${dbExample.example.substring(0, 30)}..." → "${translationText.substring(0, 30)}..."`,
                LogLevel.INFO,
              );
            }
          } else {
            // Fall back to the existing index-based matching
            serverLog(
              `Falling back to index-based matching for examples (DB: ${definitionExamples.length}, Translations: ${combinedExampleTranslations.length})`,
              LogLevel.INFO,
            );

            // Match examples with translations
            const loopLength = Math.min(
              definitionExamples.length,
              combinedExampleTranslations.length,
            );

            for (let j = 0; j < loopLength; j++) {
              const dbExample = definitionExamples[j];
              const translationText = combinedExampleTranslations[j];

              if (!dbExample || !translationText) {
                serverLog(
                  `Skipping example at index ${j} due to missing data for expression "${expression.expression}"`,
                  LogLevel.INFO,
                );
                continue;
              }

              // Save the translation
              let exampleTranslation = await tx.translation.findFirst({
                where: {
                  content: translationText,
                  languageCode: LanguageCode.en,
                  source: SourceType.helsinki_nlp,
                },
              });

              if (!exampleTranslation) {
                exampleTranslation = await tx.translation.create({
                  data: {
                    languageCode: LanguageCode.en,
                    content: translationText,
                    source: SourceType.helsinki_nlp,
                  },
                });
              }

              await tx.exampleTranslation.upsert({
                where: {
                  exampleId_translationId: {
                    exampleId: dbExample.id,
                    translationId: exampleTranslation.id,
                  },
                },
                update: {},
                create: {
                  exampleId: dbExample.id,
                  translationId: exampleTranslation.id,
                },
              });

              serverLog(
                `Saved INDEX-BASED translation for example "${dbExample.example.substring(0, 30)}..." → "${translationText.substring(0, 30)}..."`,
                LogLevel.INFO,
              );
            }
          }
        }
      }
    }

    if (variantData.compositions && variantData.compositions.length > 0) {
      serverLog(
        `Note: English translations of compositions are available but not currently saved`,
        LogLevel.INFO,
      );
    }
  } catch (error) {
    serverLog(
      `Error processing English translations for Danish word: ${error instanceof Error ? error.message : String(error)}`,
      LogLevel.ERROR,
    );
  }
}
