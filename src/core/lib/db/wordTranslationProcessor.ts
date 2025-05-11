import {
  LanguageCode,
  Prisma,
  SourceType,
  RelationshipType,
  EntityType,
  PartOfSpeech,
} from '@prisma/client';
import { TranslationService } from '../services/translationService';
import { serverLog, LogLevel } from '../utils/logUtils';
import {
  DanishDictionaryObject,
  WordVariant,
} from '@/core/types/translationDanishTypes';
import {
  mapDanishPosToEnum,
  mapDanishGenderToEnum,
  extractUsageNote,
  extractGrammaticalNote,
  extractGeneralLabels,
  extractSubjectStatusLabels,
} from '@/core/lib/utils/daishDictionary/mapDaEng';
import { validateDanishDictionary } from '@/core/lib/utils/validations/danishDictionaryValidator';

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
        phonetic: english_word_data.word.phonetic_translation || null,
      },
      create: {
        word: english_word_data.word.word_translation,
        languageCode: LanguageCode.da,
        phonetic: english_word_data.word.phonetic_translation || null,
        etymology: null,
        additionalInfo: {},
        sourceEntityId: SourceType.helsinki_nlp,
      },
    });

    // Create relationship between original and translated word
    await tx.wordRelationship.upsert({
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

    // 2. Process stems
    for (let i = 0; i < english_word_data.stems.length; i++) {
      const translatedStemText = english_word_data.stems_translation[i];
      const originalStemText = english_word_data.stems[i];

      if (
        translatedStemText &&
        typeof translatedStemText === 'string' &&
        originalStemText
      ) {
        //? Find or create English stem
        // const englishStem = await tx.word.upsert({
        //   where: {
        //     word_languageCode: {
        //       word: originalStemText,
        //       languageCode: LanguageCode.en,
        //     },
        //   },
        //   create: {
        //     word: originalStemText,
        //     languageCode: LanguageCode.en,
        //     sourceEntityId: sourceType,
        //     additionalInfo: {},
        //   },
        //   update: {},
        // });
        //? Find or create Danish stem
        // const danishStem = await tx.word.upsert({
        //   where: {
        //     word_languageCode: {
        //       word: translatedStemText,
        //       languageCode: LanguageCode.da,
        //     },
        //   },
        //   update: {},
        //   create: {
        //     word: translatedStemText,
        //     languageCode: LanguageCode.da,
        //     phonetic: null,
        //     etymology: null,
        //     additionalInfo: {},
        //     sourceEntityId: SourceType.helsinki_nlp,
        //   },
        // });
        //? Create/update relationship between English and Danish stems
        // await tx.wordRelationship.upsert({
        //   where: {
        //     fromWordId_toWordId_type: {
        //       fromWordId: englishStem.id,
        //       toWordId: danishStem.id,
        //       type: RelationshipType.translation,
        //     },
        //   },
        //   update: {},
        //   create: {
        //     fromWordId: englishStem.id,
        //     toWordId: danishStem.id,
        //     type: RelationshipType.translation,
        //   },
        // });
        //! Create/update stem relationships with main words
        // await tx.wordRelationship.upsert({
        //   where: {
        //     fromWordId_toWordId_type: {
        //       fromWordId: translatedWord.id,
        //       toWordId: danishStem.id,
        //       type: RelationshipType.related,
        //     },
        //   },
        //   update: {},
        //   create: {
        //     fromWordId: translatedWord.id,
        //     toWordId: danishStem.id,
        //     type: RelationshipType.related,
        //   },
        // });
      }
    }

    // 3. Process definitions and examples
    for (const translatedDef of english_word_data.definitions) {
      const definitionTranslation = translatedDef.definition_translation;
      if (definitionTranslation && typeof definitionTranslation === 'string') {
        await tx.translation.upsert({
          where: {
            entityType_entityId_languageCode: {
              entityType: EntityType.definition,
              entityId: translatedDef.definitionId,
              languageCode: LanguageCode.da,
            },
          },
          update: {
            content: definitionTranslation,
          },
          create: {
            entityType: EntityType.definition,
            entityId: translatedDef.definitionId,
            languageCode: LanguageCode.da,
            content: definitionTranslation,
            source: SourceType.helsinki_nlp,
          },
        });

        // Process examples
        for (const translatedExample of translatedDef.examples) {
          const exampleTranslation = translatedExample.example_translation;
          if (exampleTranslation && typeof exampleTranslation === 'string') {
            await tx.translation.upsert({
              where: {
                entityType_entityId_languageCode: {
                  entityType: EntityType.example,
                  entityId: translatedExample.exampleId,
                  languageCode: LanguageCode.da,
                },
              },
              update: {
                content: exampleTranslation,
              },
              create: {
                entityType: EntityType.example,
                entityId: translatedExample.exampleId,
                languageCode: LanguageCode.da,
                content: exampleTranslation,
                source: SourceType.helsinki_nlp,
              },
            });
          }
        }
      }
    }

    //!Process danish word data
    if (danish_word_data && Object.keys(danish_word_data).length > 0) {
      try {
        // Process main Danish word
        const danishWord = await processDanishMainWord(tx, danish_word_data);

        // Process definitions
        if (
          danish_word_data.definition &&
          danish_word_data.definition.length > 0
        ) {
          await processDanishDefinitions(
            tx,
            danishWord.id,
            danish_word_data.definition,
            danish_word_data,
          );
        }

        // Process fixed expressions
        if (
          danish_word_data.fixed_expressions &&
          danish_word_data.fixed_expressions.length > 0
        ) {
          await processDanishFixedExpressions(
            tx,
            danishWord.id,
            danish_word_data.fixed_expressions,
            danish_word_data,
          );
        }

        // Process stems
        if (danish_word_data.stems && danish_word_data.stems.length > 0) {
          await processDanishStems(tx, danishWord.id, danish_word_data.stems);
        }

        // Process compositions
        if (
          danish_word_data.compositions &&
          danish_word_data.compositions.length > 0
        ) {
          await processDanishCompositions(
            tx,
            danishWord.id,
            danish_word_data.compositions,
          );
        }

        // Process synonyms and antonyms - primarily handled via Labels in processDanishDefinitions
        // Still process any synonyms directly on the word for backward compatibility
        if (danish_word_data.synonyms && danish_word_data.synonyms.length > 0) {
          await processDanishRelatedWords(
            tx,
            danishWord.id,
            danish_word_data.synonyms,
            RelationshipType.synonym,
          );
        }

        // if (danish_word_data.antonyms && danish_word_data.antonyms.length > 0) {
        //   await processDanishRelatedWords(
        //     tx,
        //     danishWord.id,
        //     danish_word_data.antonyms,
        //     RelationshipType.antonym,
        //   );
        // }

        // Process variants
        if (danish_word_data.variants && danish_word_data.variants.length > 0) {
          await processDanishVariants(
            tx,
            danishWord.id,
            danish_word_data.variants,
            danish_word_data,
          );
        }

        // Create relationship between original English word and translated Danish word
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: mainWordId,
              toWordId: danishWord.id,
              type: RelationshipType.translation,
            },
          },
          update: {},
          create: {
            fromWordId: mainWordId,
            toWordId: danishWord.id,
            type: RelationshipType.translation,
          },
        });

        serverLog(
          `Successfully processed Danish translation for word: ${mainWordText}`,
          LogLevel.INFO,
        );
      } catch (error) {
        serverLog(
          `Error processing Danish translation data for word ${mainWordText}: ${error}`,
          LogLevel.ERROR,
        );
      }
    }

    async function processDanishMainWord(
      tx: Prisma.TransactionClient,
      danishData: DanishDictionaryObject,
    ) {
      // Create or update Danish word
      return tx.word.upsert({
        where: {
          word_languageCode: {
            word: danishData.word.word,
            languageCode: LanguageCode.da,
          },
        },
        update: {
          phonetic: danishData.word.phonetic || null,
          etymology: danishData.word.etymology || null,
        },
        create: {
          word: danishData.word.word,
          languageCode: LanguageCode.da,
          phonetic: danishData.word.phonetic || null,
          etymology: danishData.word.etymology || null,
          additionalInfo: {},
          sourceEntityId: SourceType.helsinki_nlp,
        },
      });
    }

    /**
     * Determines if a definition should be marked as primary based on existing definitions
     * @param tx Prisma transaction client
     * @param wordId ID of the word
     * @param partOfSpeech Part of speech for the current definition
     * @returns Boolean indicating if the definition should be marked as primary
     */
    async function shouldBeMarkedAsPrimary(
      tx: Prisma.TransactionClient,
      wordId: number,
      partOfSpeech: PartOfSpeech,
    ): Promise<boolean> {
      // Find existing definitions for this word with the same part of speech
      const existingDefinitions = await tx.wordDefinition.findMany({
        where: {
          wordId: wordId,
          definition: {
            partOfSpeech: partOfSpeech,
          },
        },
        include: {
          definition: true,
        },
      });

      // If there are no existing definitions with this part of speech, mark as primary
      return existingDefinitions.length === 0;
    }

    //*Definitions processing function
    async function processDanishDefinitions(
      tx: Prisma.TransactionClient,
      wordId: number,
      definitions: Array<{
        id: string;
        definition: string;
        definition_translation_en: string;
        examples: string[];
        examples_translation_en: string[];
        labels?: Record<string, string[] | boolean | string>;
        labels_translation_en?: Record<string, string[] | boolean | string>;
      }>,
      danish_word_data: DanishDictionaryObject,
    ) {
      for (const def of definitions) {
        // Map the part of speech
        const partOfSpeech = mapDanishPosToEnum(
          danish_word_data.word.partOfSpeech &&
            danish_word_data.word.partOfSpeech.length > 0
            ? danish_word_data.word.partOfSpeech[0]
            : 'undefined',
        );

        // Determine if this definition should be marked as primary
        const isPrimary = await shouldBeMarkedAsPrimary(
          tx,
          wordId,
          partOfSpeech,
        );

        // Create definition
        const definitionEntity = await tx.definition.create({
          data: {
            definition: def.definition,
            partOfSpeech: partOfSpeech,
            languageCode: LanguageCode.da,
            source: SourceType.danish_dictionary,
            usageNote: extractUsageNote(def.labels),
            grammaticalNote: extractGrammaticalNote(def.labels),
            generalLabels: extractGeneralLabels(def.labels),
            subjectStatusLabels: extractSubjectStatusLabels(def.labels),
            gender:
              danish_word_data.word.partOfSpeech?.length > 1
                ? mapDanishGenderToEnum(danish_word_data.word.partOfSpeech?.[1])
                : null,
            isPlural: false,
            isInShortDef: false,
          },
        });

        // Link definition to word
        await tx.wordDefinition.create({
          data: {
            wordId: wordId,
            definitionId: definitionEntity.id,
            isPrimary: isPrimary,
          },
        });

        // Process "Se også" related words from labels
        if (def.labels && Array.isArray(def.labels['Se også'])) {
          for (const relatedWord of def.labels['Se også']) {
            // Create related word
            const relatedWordEntity = await tx.word.upsert({
              where: {
                word_languageCode: {
                  word: relatedWord,
                  languageCode: LanguageCode.da,
                },
              },
              update: {},
              create: {
                word: relatedWord,
                languageCode: LanguageCode.da,
                additionalInfo: {},
                sourceEntityId: SourceType.danish_dictionary,
              },
            });

            // Create relationship with definitionId
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: wordId,
                  toWordId: relatedWordEntity.id,
                  type: RelationshipType.related,
                },
              },
              update: {
                definitionId: definitionEntity.id,
              },
              create: {
                fromWordId: wordId,
                toWordId: relatedWordEntity.id,
                type: RelationshipType.related,
                definitionId: definitionEntity.id,
              },
            });
          }
        }

        // Process synonyms from labels
        if (def.labels && Array.isArray(def.labels['Synonymer'])) {
          for (const synonym of def.labels['Synonymer']) {
            // Create synonym word
            const synonymWord = await tx.word.upsert({
              where: {
                word_languageCode: {
                  word: synonym,
                  languageCode: LanguageCode.da,
                },
              },
              update: {},
              create: {
                word: synonym,
                languageCode: LanguageCode.da,
                additionalInfo: {},
                sourceEntityId: SourceType.danish_dictionary,
              },
            });

            // Create relationship with definitionId
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: wordId,
                  toWordId: synonymWord.id,
                  type: RelationshipType.synonym,
                },
              },
              update: {
                definitionId: definitionEntity.id,
              },
              create: {
                fromWordId: wordId,
                toWordId: synonymWord.id,
                type: RelationshipType.synonym,
                definitionId: definitionEntity.id,
              },
            });
          }
        }

        // Process antonyms from labels
        if (def.labels && Array.isArray(def.labels['Antonymer'])) {
          for (const antonym of def.labels['Antonymer']) {
            // Create antonym word
            const antonymWord = await tx.word.upsert({
              where: {
                word_languageCode: {
                  word: antonym,
                  languageCode: LanguageCode.da,
                },
              },
              update: {},
              create: {
                word: antonym,
                languageCode: LanguageCode.da,
                additionalInfo: {},
                sourceEntityId: SourceType.danish_dictionary,
              },
            });

            // Create relationship with definitionId
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: wordId,
                  toWordId: antonymWord.id,
                  type: RelationshipType.antonym,
                },
              },
              update: {
                definitionId: definitionEntity.id,
              },
              create: {
                fromWordId: wordId,
                toWordId: antonymWord.id,
                type: RelationshipType.antonym,
                definitionId: definitionEntity.id,
              },
            });
          }
        }

        // Compile examples by combining label examples and regular examples
        const allExamples: string[] = [];
        const allExamplesTranslations: string[] = [];

        // First add examples from labels.Eksempler if they exist
        if (def.labels && Array.isArray(def.labels['Eksempler'])) {
          allExamples.push(...def.labels['Eksempler']);

          // Add corresponding translations if they exist
          if (
            def.labels_translation_en &&
            Array.isArray(def.labels_translation_en['Eksempler'])
          ) {
            allExamplesTranslations.push(
              ...def.labels_translation_en['Eksempler'],
            );
          } else {
            // Add empty translations to maintain index alignment
            for (let i = 0; i < def.labels['Eksempler'].length; i++) {
              allExamplesTranslations.push('');
            }
          }
        }

        // Then add regular examples
        if (def.examples && def.examples.length > 0) {
          allExamples.push(...def.examples);

          if (
            def.examples_translation_en &&
            def.examples_translation_en.length > 0
          ) {
            allExamplesTranslations.push(...def.examples_translation_en);
          }
        }

        // Create examples for the definition
        if (allExamples.length > 0) {
          for (let i = 0; i < allExamples.length; i++) {
            await tx.definitionExample.create({
              data: {
                example: allExamples[i] || '',
                languageCode: LanguageCode.da,
                definitionId: definitionEntity.id,
              },
            });
          }
        }

        // Create English translation for the definition
        await tx.translation.create({
          data: {
            entityType: EntityType.definition,
            entityId: definitionEntity.id,
            languageCode: LanguageCode.en,
            content: def.definition_translation_en,
            source: SourceType.helsinki_nlp,
          },
        });

        // Create English translations for examples
        if (allExamples.length > 0 && allExamplesTranslations.length > 0) {
          const examples = await tx.definitionExample.findMany({
            where: {
              definitionId: definitionEntity.id,
            },
            orderBy: {
              id: 'asc',
            },
          });

          for (
            let i = 0;
            i < Math.min(examples.length, allExamplesTranslations.length);
            i++
          ) {
            await tx.translation.create({
              data: {
                entityType: EntityType.example,
                entityId: examples[i]?.id || 0,
                languageCode: LanguageCode.en,
                content: allExamplesTranslations[i] || '',
                source: SourceType.helsinki_nlp,
              },
            });
          }
        }
      }
    }

    //*Fixed expressions processing function
    async function processDanishFixedExpressions(
      tx: Prisma.TransactionClient,
      wordId: number,
      expressions: Array<{
        expression: string;
        expression_translation_en: string;
        definition: string;
        definition_translation_en: string;
        examples: string[];
        examples_translation_en: string[];
        labels?: Record<string, string[] | boolean | string>;
        labels_translation_en?: Record<string, string[] | boolean | string>;
      }>,
      danish_word_data: DanishDictionaryObject,
    ) {
      for (const expr of expressions) {
        // Create the fixed expression as a new word
        const expressionWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: expr.expression,
              languageCode: LanguageCode.da,
            },
          },
          update: {},
          create: {
            word: expr.expression,
            languageCode: LanguageCode.da,
            additionalInfo: {},
            sourceEntityId: SourceType.danish_dictionary,
          },
        });

        // Create relationship between main word and expression
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: wordId,
              toWordId: expressionWord.id,
              type: RelationshipType.phrase,
            },
          },
          update: {},
          create: {
            fromWordId: wordId,
            toWordId: expressionWord.id,
            type: RelationshipType.phrase,
          },
        });

        // Create expression translation in Translation table
        await tx.translation.create({
          data: {
            entityType: EntityType.phrase,
            entityId: expressionWord.id,
            languageCode: LanguageCode.en,
            content: expr.expression_translation_en,
            source: SourceType.helsinki_nlp,
          },
        });

        // Map the part of speech
        const partOfSpeech = mapDanishPosToEnum(
          danish_word_data.word.partOfSpeech &&
            danish_word_data.word.partOfSpeech.length > 0
            ? danish_word_data.word.partOfSpeech[0]
            : 'undefined',
        );

        // Determine if this definition should be marked as primary
        const isPrimary = await shouldBeMarkedAsPrimary(
          tx,
          expressionWord.id,
          partOfSpeech,
        );

        // Create definition for the expression
        const definitionEntity = await tx.definition.create({
          data: {
            definition: expr.definition,
            partOfSpeech: partOfSpeech,
            languageCode: LanguageCode.da,
            source: SourceType.danish_dictionary,
            usageNote: extractUsageNote(expr.labels),
            grammaticalNote: extractGrammaticalNote(expr.labels),
            generalLabels: extractGeneralLabels(expr.labels),
            subjectStatusLabels: extractSubjectStatusLabels(expr.labels),
            isPlural: false,
            isInShortDef: false,
          },
        });

        // Link definition to expression word
        await tx.wordDefinition.create({
          data: {
            wordId: expressionWord.id,
            definitionId: definitionEntity.id,
            isPrimary: isPrimary,
          },
        });

        // Compile examples by combining label examples and regular examples
        const allExamples: string[] = [];
        const allExamplesTranslations: string[] = [];

        // First add examples from labels.Eksempler if they exist
        if (expr.labels && Array.isArray(expr.labels['Eksempler'])) {
          allExamples.push(...expr.labels['Eksempler']);

          // Add corresponding translations if they exist
          if (
            expr.labels_translation_en &&
            Array.isArray(expr.labels_translation_en['Eksempler'])
          ) {
            allExamplesTranslations.push(
              ...expr.labels_translation_en['Eksempler'],
            );
          } else {
            // Add empty translations to maintain index alignment
            for (let i = 0; i < expr.labels['Eksempler'].length; i++) {
              allExamplesTranslations.push('');
            }
          }
        }

        // Then add regular examples
        if (expr.examples && expr.examples.length > 0) {
          allExamples.push(...expr.examples);

          if (
            expr.examples_translation_en &&
            expr.examples_translation_en.length > 0
          ) {
            allExamplesTranslations.push(...expr.examples_translation_en);
          }
        }

        // Create examples for the definition
        if (allExamples.length > 0) {
          for (let i = 0; i < allExamples.length; i++) {
            await tx.definitionExample.create({
              data: {
                example: allExamples[i] || '',
                languageCode: LanguageCode.da,
                definitionId: definitionEntity.id,
              },
            });
          }
        }

        // Create English translation for the definition
        await tx.translation.create({
          data: {
            entityType: EntityType.definition,
            entityId: definitionEntity.id,
            languageCode: LanguageCode.en,
            content: expr.definition_translation_en,
            source: SourceType.helsinki_nlp,
          },
        });

        // Create English translations for examples
        if (allExamples.length > 0 && allExamplesTranslations.length > 0) {
          const examples = await tx.definitionExample.findMany({
            where: {
              definitionId: definitionEntity.id,
            },
            orderBy: {
              id: 'asc',
            },
          });

          for (
            let i = 0;
            i < Math.min(examples.length, allExamplesTranslations.length);
            i++
          ) {
            await tx.translation.create({
              data: {
                entityType: EntityType.example,
                entityId: examples[i]?.id || 0,
                languageCode: LanguageCode.en,
                content: allExamplesTranslations[i] || '',
                source: SourceType.helsinki_nlp,
              },
            });
          }
        }
      }
    }

    //*Stems processing function
    async function processDanishStems(
      tx: Prisma.TransactionClient,
      wordId: number,
      stems: Array<{
        stem: string;
        stem_translation_en: string;
        partOfSpeech: string;
      }>,
    ) {
      for (const stem of stems) {
        // Create stem word
        const stemWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: stem.stem,
              languageCode: LanguageCode.da,
            },
          },
          update: {},
          create: {
            word: stem.stem,
            languageCode: LanguageCode.da,
            additionalInfo: {},
            sourceEntityId: SourceType.helsinki_nlp,
          },
        });

        // Create stem relationship
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: wordId,
              toWordId: stemWord.id,
              type: RelationshipType.stem,
            },
          },
          update: {},
          create: {
            fromWordId: wordId,
            toWordId: stemWord.id,
            type: RelationshipType.stem,
          },
        });

        //? Create English translation word for stem
        // const englishStemWord = await tx.word.upsert({
        //   where: {
        //     word_languageCode: {
        //       word: stem.stem_translation_en,
        //       languageCode: LanguageCode.en,
        //     },
        //   },
        //   update: {},
        //   create: {
        //     word: stem.stem_translation_en,
        //     languageCode: LanguageCode.en,
        //     additionalInfo: {},
        //     sourceEntityId: SourceType.helsinki_nlp,
        //   },
        // });

        //? Create translation relationship between Danish and English stem
        // await tx.wordRelationship.upsert({
        //   where: {
        //     fromWordId_toWordId_type: {
        //       fromWordId: stemWord.id,
        //       toWordId: englishStemWord.id,
        //       type: RelationshipType.translation,
        //     },
        //   },
        //   update: {},
        //   create: {
        //     fromWordId: stemWord.id,
        //     toWordId: englishStemWord.id,
        //     type: RelationshipType.translation,
        //   },
        // });
      }
    }

    //*Compositions processing function
    async function processDanishCompositions(
      tx: Prisma.TransactionClient,
      wordId: number,
      compositions: Array<{
        composition: string;
        composition_translation_en: string;
      }>,
    ) {
      for (const [index, comp] of compositions.entries()) {
        // Create composition word
        const compositionWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: comp.composition,
              languageCode: LanguageCode.da,
            },
          },
          update: {},
          create: {
            word: comp.composition,
            languageCode: LanguageCode.da,
            additionalInfo: {},
            sourceEntityId: SourceType.helsinki_nlp,
          },
        });

        // Create composition relationship with order index
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: wordId,
              toWordId: compositionWord.id,
              type: RelationshipType.composition,
            },
          },
          update: {
            orderIndex: index,
          },
          create: {
            fromWordId: wordId,
            toWordId: compositionWord.id,
            type: RelationshipType.composition,
            orderIndex: index,
          },
        });

        // Create English translation word for composition
        const englishCompWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: comp.composition_translation_en,
              languageCode: LanguageCode.en,
            },
          },
          update: {},
          create: {
            word: comp.composition_translation_en,
            languageCode: LanguageCode.en,
            additionalInfo: {},
            sourceEntityId: SourceType.helsinki_nlp,
          },
        });

        // Create translation relationship between Danish and English composition
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: compositionWord.id,
              toWordId: englishCompWord.id,
              type: RelationshipType.translation,
            },
          },
          update: {},
          create: {
            fromWordId: compositionWord.id,
            toWordId: englishCompWord.id,
            type: RelationshipType.translation,
          },
        });
      }
    }

    //*Related words processing function
    async function processDanishRelatedWords(
      tx: Prisma.TransactionClient,
      wordId: number,
      words: string[],
      relationType: RelationshipType,
    ) {
      for (const word of words) {
        // Create related word
        const relatedWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: word,
              languageCode: LanguageCode.da,
            },
          },
          update: {},
          create: {
            word: word,
            languageCode: LanguageCode.da,
            additionalInfo: {},
            sourceEntityId: SourceType.helsinki_nlp,
          },
        });

        // Create relationship
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: wordId,
              toWordId: relatedWord.id,
              type: relationType,
            },
          },
          update: {},
          create: {
            fromWordId: wordId,
            toWordId: relatedWord.id,
            type: relationType,
          },
        });
      }
    }

    async function processDanishVariants(
      tx: Prisma.TransactionClient,
      mainWordId: number,
      variants: WordVariant[],
      danish_word_data: DanishDictionaryObject,
    ) {
      for (const variant of variants) {
        // Create variant word
        const variantWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: variant.word.word,
              languageCode: LanguageCode.da,
            },
          },
          update: {
            phonetic: variant.word.phonetic || null,
            etymology: variant.word.etymology || null,
          },
          create: {
            word: variant.word.word,
            languageCode: LanguageCode.da,
            phonetic: variant.word.phonetic || null,
            etymology: variant.word.etymology || null,
            additionalInfo: {},
            sourceEntityId: SourceType.danish_dictionary,
          },
        });

        // Create relationship between main word and variant
        await tx.wordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: mainWordId,
              toWordId: variantWord.id,
              type: RelationshipType.related,
            },
          },
          update: {},
          create: {
            fromWordId: mainWordId,
            toWordId: variantWord.id,
            type: RelationshipType.related,
          },
        });

        // Process definitions
        if (variant.definition && variant.definition.length > 0) {
          await processDanishDefinitions(
            tx,
            variantWord.id,
            variant.definition,
            danish_word_data,
          );
        }

        // Process fixed expressions
        if (variant.fixed_expressions && variant.fixed_expressions.length > 0) {
          await processDanishFixedExpressions(
            tx,
            variantWord.id,
            variant.fixed_expressions,
            danish_word_data,
          );
        }

        // Process stems
        if (variant.stems && variant.stems.length > 0) {
          await processDanishStems(tx, variantWord.id, variant.stems);
        }

        // Process compositions
        if (variant.compositions && variant.compositions.length > 0) {
          await processDanishCompositions(
            tx,
            variantWord.id,
            variant.compositions,
          );
        }

        // Process synonyms and antonyms - primarily handled via Labels in processDanishDefinitions
        // Still process any synonyms directly on the word for backward compatibility
        if (variant.synonyms && variant.synonyms.length > 0) {
          await processDanishRelatedWords(
            tx,
            variantWord.id,
            variant.synonyms,
            RelationshipType.synonym,
          );
        }

        // if (variant.antonyms && variant.antonyms.length > 0) {
        //   await processDanishRelatedWords(
        //     tx,
        //     variantWord.id,
        //     variant.antonyms,
        //     RelationshipType.antonym,
        //   );
        // }
      }
    }
  } catch (error) {
    serverLog(
      `Error processing translations for word ${mainWordText}: ${error}`,
      LogLevel.ERROR,
    );
    // Don't throw, just log the error and continue
  }
}
