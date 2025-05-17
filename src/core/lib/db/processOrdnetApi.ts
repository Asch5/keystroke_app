'use server';

import { prisma } from '@/core/lib/prisma';
import {
  ProcessedWordData,
  SubWordData,
  RelationshipFromTo,
} from '@/core/types/dictionary';
import {
  LanguageCode,
  PartOfSpeech,
  Prisma,
  RelationshipType,
  SourceType,
  Word,
  DifficultyLevel,
} from '@prisma/client';
import { LogLevel, serverLog } from '@/core/lib/utils/logUtils';
import {
  fetchWordFrequency,
  getGeneralFrequency,
  getPartOfSpeechFrequency,
} from '../services/frequencyService';
import { TranslationService } from '../services/translationService';
import { validateDanishDictionary } from '../utils/validations/danishDictionaryValidator';
import { mapDanishPosToEnum } from '../utils/danishDictionary/mapDaEng';
import { transformDanishForms } from '../utils/danishDictionary/transformDanishForms';
import {
  WordVariant,
  PartOfSpeechDanish,
  DetailCategoryDanish,
} from '@/core/types/translationDanishTypes';
//import { processTranslationsForWord } from '@/core/lib/db/wordTranslationProcessor';

/**Definitions:
 * generalLabels "lbs" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs. (like capitalization indicators, usage notes, etc.)
 *
 * subjectStatusLabels "sls" - A subject/status label describes the subject area (eg, "computing") or regional/usage status (eg, "British", "formal", "slang") of a headword or a particular sense of a headword. A set of one or more subject/status labels is contained in an sls.
 *
 * grammaticalNote "gram" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs.
 *
 
 *
 *
 */

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
    console.error('Error in processOrdnetApi.ts:', error);
    throw error;
  }
}

/**
 * Processes and links audio files for a word
 * @param tx Transaction client
 * @param wordDetailsId Word details ID to link audio to
 * @param audioFiles Array of audio file URLs
 * @param isPrimary Whether this is the primary audio for the word
 */
async function processAudioForWord(
  tx: Prisma.TransactionClient,
  wordDetailsId: number,
  audioFiles: string[],
  isPrimary: boolean = false,
  languageCode: LanguageCode = LanguageCode.en,
  source: SourceType = SourceType.merriam_learners,
): Promise<void> {
  for (const [index, audioUrl] of audioFiles.entries()) {
    // Use upsert instead of create to handle duplicate audio URLs
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: {
          url: audioUrl,
          languageCode: languageCode,
        },
      },
      update: {}, // No updates needed if it already exists
      create: {
        url: audioUrl,
        source: source,
        languageCode: languageCode,
      },
    });

    // Link audio to word details
    await tx.wordDetailsAudio.upsert({
      where: {
        wordDetailsId_audioId: {
          wordDetailsId,
          audioId: audio.id,
        },
      },
      update: {
        isPrimary: isPrimary && index === 0, // Update primary status if it exists
      },
      create: {
        wordDetailsId,
        audioId: audio.id,
        isPrimary: isPrimary && index === 0, // Only first audio file is primary if isPrimary is true
      },
    });
  }
}

// Update the upsertWord function to use the new audio processing
async function upsertWord(
  tx: Prisma.TransactionClient,
  source: SourceType,
  wordText: string,
  languageCode: LanguageCode,
  options?: {
    phonetic?: string | null;
    audio?: string | null;
    audioFiles?: string[] | null;
    etymology?: string | null;
    difficultyLevel?: DifficultyLevel;
    sourceEntityId?: string | null;
    partOfSpeech?: PartOfSpeech | null; // This can be PartOfSpeech, null, or undefined if not in options
    variant?: string;
    isHighlighted?: boolean;
    frequencyGeneral?: number | null;
  },
): Promise<Word> {
  // Fetch frequency data if not provided
  let frequencyGeneral = options?.frequencyGeneral;
  if (frequencyGeneral === undefined) {
    try {
      const frequencyData = await fetchWordFrequency(wordText, languageCode);
      frequencyGeneral = getGeneralFrequency(frequencyData);
      serverLog(
        `Fetched frequency data in upsertWord for "${wordText}": ${frequencyGeneral}`,
        LogLevel.INFO,
      );
    } catch (error) {
      serverLog(
        `Error fetching frequency data in upsertWord for "${wordText}": ${error}`,
        LogLevel.ERROR,
      );
      frequencyGeneral = null;
    }
  }

  // Create word record
  const word = await tx.word.upsert({
    where: {
      word_languageCode: {
        word: wordText,
        languageCode,
      },
    },
    update: {
      etymology: options?.etymology ?? null,
      sourceEntityId: options?.sourceEntityId ?? null,
      updatedAt: new Date(),
      isHighlighted: options?.isHighlighted ?? false,
      phoneticGeneral: options?.phonetic ?? null,
      frequencyGeneral: frequencyGeneral ?? null,
    },
    create: {
      word: wordText,
      phoneticGeneral: options?.phonetic ?? null,
      languageCode,
      etymology: options?.etymology ?? null,
      sourceEntityId: options?.sourceEntityId ?? null,
      isHighlighted: options?.isHighlighted ?? false,
      frequencyGeneral: frequencyGeneral ?? null,
    },
  });

  // Ensure that partOfSpeech passed to upsertWordDetails is PartOfSpeech | null
  const partOfSpeechForDetails: PartOfSpeech | null =
    options?.partOfSpeech === undefined ? null : options?.partOfSpeech || null;

  const wordDetails = await upsertWordDetails(
    tx,
    word.id,
    partOfSpeechForDetails, // Explicitly PartOfSpeech | null
    source,
    false,
    options?.variant ?? '', // Ensure this is an empty string for the variant argument
    options?.phonetic ?? null,
  );
  serverLog(
    `From upsertWord in processMerriamApi.ts (upsertWord section): wordDetails: ${JSON.stringify(wordDetails)} for word "${wordText}" with PoS option: ${options?.partOfSpeech}, passed to details: ${partOfSpeechForDetails}`,
    LogLevel.INFO,
  );

  // Process audio files if present
  if (options?.audioFiles?.length) {
    await processAudioForWord(
      tx,
      wordDetails.id,
      options.audioFiles,
      true,
      languageCode,
      source,
    );
  }

  return word;
}

/**
 * Create or update a WordDetails record
 * This is needed to establish relationships between words based on part of speech
 */
async function upsertWordDetails(
  tx: Prisma.TransactionClient,
  wordId: number,
  partOfSpeech: PartOfSpeech | null,
  source: SourceType = SourceType.user,
  isPlural: boolean = false,
  variant: string = '',
  phonetic: string | null = null,
  frequency: number | null = null,
): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
  // Ensure we have a valid part of speech, using the API's part of speech if available
  const pos: PartOfSpeech = partOfSpeech || PartOfSpeech.undefined;

  // Fetch the word text for frequency lookup if frequency is not provided
  let posFrequency = frequency;
  if (posFrequency === null || posFrequency === undefined) {
    try {
      // Get the word text from the database
      const wordRecord = await tx.word.findUnique({
        where: { id: wordId },
        select: { word: true, languageCode: true },
      });

      if (wordRecord) {
        const frequencyData = await fetchWordFrequency(
          wordRecord.word,
          wordRecord.languageCode as LanguageCode,
        );

        posFrequency = getPartOfSpeechFrequency(frequencyData, pos);

        serverLog(
          `Fetched POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${pos}: ${posFrequency}`,
          LogLevel.INFO,
        );
      }
    } catch (error) {
      serverLog(
        `Error fetching POS frequency data in upsertWordDetails for word ID ${wordId}: ${error}`,
        LogLevel.ERROR,
      );
      posFrequency = null;
    }
  }

  // Create or find the WordDetails record
  const wordDetails = await tx.wordDetails.upsert({
    where: {
      wordId_partOfSpeech_variant: {
        wordId,
        partOfSpeech: pos,
        variant: variant || '',
      },
    },
    create: {
      wordId,
      partOfSpeech: pos,
      phonetic: phonetic || '',
      variant: variant || '',
      isPlural,
      source: source,
      frequency: posFrequency,
    },
    update: {
      isPlural: isPlural ?? undefined,
      phonetic: phonetic !== null ? phonetic : null,
      ...(source !== null && { source: source }),
      ...(posFrequency !== null && { frequency: posFrequency }),
    },
  });

  return wordDetails;
}

export async function processAndSaveDanishWord(
  danishWordData: WordVariant,
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  const mainWordText = danishWordData.word.word;
  const language = LanguageCode.da;
  const source = SourceType.danish_dictionary;

  // Get part of speech from API response
  const partOfSpeech = mapDanishPosToEnum(danishWordData.word.partOfSpeech[0]);

  // Extract audio files
  const audioFiles = danishWordData.word.audio || [];
  const etymology = danishWordData.word.etymology;

  const variant = danishWordData.word.variant || '';

  const sourceEntityId = `${source}-${mainWordText}-${partOfSpeech}-${variant}`;

  // Fetch frequency data
  let frequencyGeneral = null;
  let frequency = null;
  try {
    const frequencyData = await fetchWordFrequency(mainWordText, language);
    frequencyGeneral = getGeneralFrequency(frequencyData);
    frequency = getPartOfSpeechFrequency(frequencyData, partOfSpeech);
  } catch (error) {
    serverLog(
      `Error fetching frequency data for "${mainWordText}": ${error}`,
      LogLevel.ERROR,
    );
  }

  const processedData: ProcessedWordData = {
    word: {
      word: mainWordText,
      variant: '',
      isHighlighted: false,
      frequencyGeneral: frequencyGeneral,
      frequency: frequency,
      languageCode: language,
      source: source,
      partOfSpeech: partOfSpeech,
      phonetic: danishWordData.word.phonetic,
      audioFiles: (() => {
        const audio = audioFiles.find((a) => a.word === 'grundform');
        return audio ? [audio.audio_url] : null;
      })(),
      etymology: etymology,
      relatedWords: [],
      sourceEntityId: sourceEntityId,
    },
    definitions: [],
    phrases: [],
    stems: [],
  };

  // Process definitions
  if (danishWordData.definition && danishWordData.definition.length > 0) {
    for (const def of danishWordData.definition) {
      const examples = def.examples.map((example, index) => {
        // Format sourceOfExample if available
        let sourceExampleText = null;
        if (def.sourceOfExample && def.sourceOfExample[index]) {
          const source = def.sourceOfExample[index];
          sourceExampleText = `{bc}short {it}${source.short}{/it} {bc}full {it}${source.full}{/it}`;
        }

        return {
          example,
          languageCode: language,
          grammaticalNote: null,
          sourceOfExample: sourceExampleText,
        };
      });

      processedData.definitions.push({
        source,
        languageCode: language,
        definition: def.definition,
        subjectStatusLabels: extractSubjectLabels(def.labels),
        generalLabels: extractGeneralLabels(def.labels),
        grammaticalNote: extractGrammaticalNote(def.labels),
        usageNote: extractUsageNote(def.labels),
        isInShortDef: false,
        examples,
      });
    }
  }

  // --- 2. Process Word Forms Using transformDanishForms ---
  let subWordsArray: SubWordData[] = [];

  // Convert Danish dictionary word to format needed by transformDanishForms
  if (danishWordData.word) {
    const danishEntry = {
      word: mainWordText,
      word_variants: [],
      variant: danishWordData.word.variant || '',
      variant_pos: '',
      phonetic: danishWordData.word.phonetic,
      partOfSpeech: Array.isArray(danishWordData.word.partOfSpeech)
        ? danishWordData.word.partOfSpeech.filter(
            (p: PartOfSpeechDanish) => typeof p === 'string',
          )
        : [],
      forms: danishWordData.word.forms || [],
      contextual_forms: {},
      audio: danishWordData.word.audio.map((a) => ({
        audio_url: a.audio_url,
        audio_type: a.audio_type,
        word: a.word || '',
        phonetic_audio: a.phonetic_audio,
      })),
    };

    const formsData = transformDanishForms(danishEntry);

    // Convert the returned related words to SubWordData format
    subWordsArray = formsData.relatedWords.map((relatedWord) => {
      return {
        word: relatedWord.word,
        languageCode: language,
        source,
        partOfSpeech: mapDanishPosToEnum(relatedWord.partOfSpeech),
        phonetic: relatedWord.phonetic || null,
        audioFiles: relatedWord.audio?.map((a) => a.audio_url) || null,
        etymology: mainWordText,
        definitions: [],
        relationship: [
          ...relatedWord.relationships.map((rel) => ({
            fromWord: 'mainWordDetails' as const,
            toWord: 'subWordDetails' as const,
            type: rel.relationshipType,
          })),
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.related,
          },
        ],
        sourceData: ['form'],
      };
    });
  }

  // --- 3. Process Stems ---
  if (danishWordData.stems && danishWordData.stems.length > 0) {
    for (const stem of danishWordData.stems) {
      subWordsArray.push({
        word: stem.stem,
        languageCode: language,
        source,
        partOfSpeech: mapStemPosToEnum(stem.partOfSpeech),
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWord' as const,
            toWord: 'subWord' as const,
            type: RelationshipType.stem,
          },
          {
            fromWord: 'mainWord' as const,
            toWord: 'subWord' as const,
            type: RelationshipType.related,
          },
        ],
        sourceData: ['stem'],
      });
    }
  }

  // --- 4. Process Synonyms and Antonyms ---
  if (danishWordData.synonyms && danishWordData.synonyms.length > 0) {
    for (const synonym of danishWordData.synonyms) {
      subWordsArray.push({
        word: synonym,
        languageCode: language,
        source,
        partOfSpeech: partOfSpeech,
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWordDetails' as RelationshipFromTo,
            toWord: 'subWordDetails' as RelationshipFromTo,
            type: RelationshipType.synonym,
          },
        ],
        sourceData: ['synonym'],
      });
    }
  }

  if (danishWordData.antonyms && danishWordData.antonyms.length > 0) {
    for (const antonym of danishWordData.antonyms) {
      subWordsArray.push({
        word: antonym,
        languageCode: language,
        source,
        partOfSpeech: partOfSpeech,
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWordDetails' as RelationshipFromTo,
            toWord: 'subWordDetails' as RelationshipFromTo,
            type: RelationshipType.antonym,
          },
        ],
        sourceData: ['antonym'],
      });
    }
  }

  // --- 5. Process Fixed Expressions ---
  if (
    danishWordData.fixed_expressions &&
    danishWordData.fixed_expressions.length > 0
  ) {
    for (const expression of danishWordData.fixed_expressions) {
      // Add to phrases in processedData
      processedData.phrases.push({
        phrase: expression.expression,
        definition: expression.definition,
        examples: expression.examples.map((ex, index) => {
          // Format sourceOfExample if available
          let sourceExampleText = null;
          if (
            'sourceOfExample' in expression &&
            Array.isArray(expression.sourceOfExample) &&
            expression.sourceOfExample[index] &&
            typeof expression.sourceOfExample[index] === 'object' &&
            expression.sourceOfExample[index] !== null &&
            'short' in expression.sourceOfExample[index] &&
            'full' in expression.sourceOfExample[index]
          ) {
            const source = expression.sourceOfExample[index] as {
              short: string;
              full: string;
            };
            sourceExampleText = `{bc}short {it}${source.short}{/it} {bc}full {it}${source.full}{/it}`;
          }

          return {
            example: ex,
            languageCode: language,
            grammaticalNote: null,
            sourceOfExample: sourceExampleText,
          };
        }),
      });

      // Also add as a subword with phrase relationship
      subWordsArray.push({
        word: expression.expression,
        languageCode: language,
        source,
        partOfSpeech: PartOfSpeech.phrase,
        definitions: [
          {
            source,
            languageCode: language,
            definition: expression.definition,
            examples: expression.examples.map((ex) => ({
              example: ex,
              languageCode: language,
              grammaticalNote: null,
            })),
          },
        ],
        relationship: [
          {
            fromWord: 'mainWordDetails',
            toWord: 'subWordDetails',
            type: RelationshipType.phrase,
          },
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.related,
          },
        ],
        sourceData: ['expression'],
      });
    }
  }

  try {
    // Save to database using transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Create or update the main Word
        const mainWord = await upsertWord(tx, source, mainWordText, language, {
          phonetic: processedData.word.phonetic || null,
          audioFiles: processedData.word.audioFiles || null,
          etymology: processedData.word.etymology || null,
          sourceEntityId: processedData.word.sourceEntityId || null,
          partOfSpeech,
          variant: processedData.word.variant || '',
          isHighlighted: false,
          frequencyGeneral: frequencyGeneral,
        });

        // Create WordDetails for the main word with the default part of speech
        const mainWordDetails = await upsertWordDetails(
          tx,
          mainWord.id,
          partOfSpeech,
          source,
          false,
          processedData.word.variant || '',
          processedData.word.phonetic,
          frequency,
        );

        // 2. Process and save definitions
        for (const definitionData of processedData.definitions) {
          // Upsert the definition
          const definition = await tx.definition.upsert({
            where: {
              definition_languageCode_source: {
                definition: definitionData.definition,
                languageCode: definitionData.languageCode as LanguageCode,
                source: definitionData.source as SourceType,
              },
            },
            update: {
              subjectStatusLabels: definitionData.subjectStatusLabels || null,
              generalLabels: definitionData.generalLabels || null,
              grammaticalNote: definitionData.grammaticalNote || null,
              usageNote: definitionData.usageNote || null,
              isInShortDef: definitionData.isInShortDef || false,
            },
            create: {
              definition: definitionData.definition,
              source: definitionData.source as SourceType,
              languageCode: definitionData.languageCode as LanguageCode,
              subjectStatusLabels: definitionData.subjectStatusLabels || null,
              generalLabels: definitionData.generalLabels || null,
              grammaticalNote: definitionData.grammaticalNote || null,
              usageNote: definitionData.usageNote || null,
              isInShortDef: definitionData.isInShortDef || false,
            },
          });

          // Link definition to word details
          await tx.wordDefinition.upsert({
            where: {
              wordDetailsId_definitionId: {
                wordDetailsId: mainWordDetails.id,
                definitionId: definition.id,
              },
            },
            create: {
              wordDetailsId: mainWordDetails.id,
              definitionId: definition.id,
              isPrimary: false,
            },
            update: {},
          });

          // Create examples for the definition
          if (definitionData.examples && definitionData.examples.length > 0) {
            for (const example of definitionData.examples) {
              await tx.definitionExample.upsert({
                where: {
                  definitionId_example: {
                    definitionId: definition.id,
                    example: example.example,
                  },
                },
                create: {
                  example: example.example,
                  languageCode: example.languageCode as LanguageCode,
                  definitionId: definition.id,
                  grammaticalNote: example.grammaticalNote || null,
                },
                update: {
                  grammaticalNote: example.grammaticalNote || null,
                },
              });
            }
          }
        }

        // 3. Process sub-words
        for (const subWord of subWordsArray) {
          // Create or update the sub-word
          const subWordEntity = await upsertWord(
            tx,
            source,
            subWord.word,
            subWord.languageCode as LanguageCode,
            {
              phonetic: subWord.phonetic || null,
              audioFiles: subWord.audioFiles || null,
              etymology: subWord.etymology || null,
              partOfSpeech: subWord.partOfSpeech,
            },
          );

          // Update the ID in the subWordsArray
          subWordsArray = subWordsArray.map((word) => {
            if (word.word === subWord.word) {
              return {
                ...word,
                id: subWordEntity.id,
              };
            }
            return word;
          });

          // Process definitions for subword
          for (const defData of subWord.definitions) {
            // Upsert subword definition
            const subWordDef = await tx.definition.upsert({
              where: {
                definition_languageCode_source: {
                  definition: defData.definition,
                  languageCode: defData.languageCode as LanguageCode,
                  source: defData.source as SourceType,
                },
              },
              update: {
                subjectStatusLabels: defData.subjectStatusLabels || null,
                generalLabels: defData.generalLabels || null,
                grammaticalNote: defData.grammaticalNote || null,
                usageNote: defData.usageNote || null,
                isInShortDef: defData.isInShortDef || false,
              },
              create: {
                definition: defData.definition,
                source: defData.source as SourceType,
                languageCode: defData.languageCode as LanguageCode,
                subjectStatusLabels: defData.subjectStatusLabels || null,
                generalLabels: defData.generalLabels || null,
                grammaticalNote: defData.grammaticalNote || null,
                usageNote: defData.usageNote || null,
                isInShortDef: defData.isInShortDef || false,
              },
            });

            // Create WordDetails for the subword
            const subWordDetails = await upsertWordDetails(
              tx,
              subWordEntity.id,
              subWord.partOfSpeech || null,
              source,
            );

            // Link definition to word details
            await tx.wordDefinition.upsert({
              where: {
                wordDetailsId_definitionId: {
                  wordDetailsId: subWordDetails.id,
                  definitionId: subWordDef.id,
                },
              },
              create: {
                wordDetailsId: subWordDetails.id,
                definitionId: subWordDef.id,
                isPrimary: false,
              },
              update: {},
            });

            // Create examples for the sub-word definition
            if (defData.examples && defData.examples.length > 0) {
              for (const example of defData.examples) {
                await tx.definitionExample.upsert({
                  where: {
                    definitionId_example: {
                      definitionId: subWordDef.id,
                      example: example.example,
                    },
                  },
                  create: {
                    example: example.example,
                    languageCode: example.languageCode as LanguageCode,
                    definitionId: subWordDef.id,
                    grammaticalNote: example.grammaticalNote || null,
                  },
                  update: {
                    grammaticalNote: example.grammaticalNote || null,
                  },
                });
              }
            }
          }
        }

        // 4. Create relationships between words
        const allPopulatedSubWords = [...subWordsArray];

        for (const currentSubWord of allPopulatedSubWords) {
          if (!currentSubWord.id) {
            serverLog(
              `Skipping relationships for subWord '${currentSubWord.word}' as it has no ID.`,
              LogLevel.ERROR,
            );
            continue;
          }

          if (
            currentSubWord.relationship &&
            currentSubWord.relationship.length > 0
          ) {
            for (const relation of currentSubWord.relationship) {
              // Determine from and to IDs
              let fromWordId = null;
              let toWordId = null;

              if (
                relation.fromWord === 'mainWord' ||
                relation.fromWord === 'mainWordDetails'
              ) {
                fromWordId = mainWord.id;
              } else if (
                relation.fromWord === 'subWord' ||
                relation.fromWord === 'subWordDetails'
              ) {
                fromWordId = currentSubWord.id;
              }

              if (
                relation.toWord === 'mainWord' ||
                relation.toWord === 'mainWordDetails'
              ) {
                toWordId = mainWord.id;
              } else if (
                relation.toWord === 'subWord' ||
                relation.toWord === 'subWordDetails'
              ) {
                toWordId = currentSubWord.id;
              }

              if (!fromWordId || !toWordId) {
                serverLog(
                  `Missing wordId for relationship: from='${relation.fromWord}'(id:${fromWordId}) to='${relation.toWord}'(id:${toWordId}), for subWord '${currentSubWord.word}'. Skipping.`,
                  LogLevel.WARN,
                );
                continue;
              }

              // Determine if it's a WordDetailsRelationship
              const createDetailsRelation =
                relation.fromWord === 'mainWordDetails' ||
                relation.toWord === 'mainWordDetails' ||
                relation.fromWord === 'subWordDetails' ||
                relation.toWord === 'subWordDetails';

              if (createDetailsRelation) {
                // For plural_en, isPlural is true if the WordDetail IS the plural noun form
                const isFromPlural =
                  relation.type === RelationshipType.plural_da &&
                  currentSubWord.partOfSpeech === PartOfSpeech.noun;

                const fromWordDetails = await upsertWordDetails(
                  tx,
                  fromWordId,
                  relation.fromWord === 'mainWordDetails'
                    ? partOfSpeech
                    : currentSubWord.partOfSpeech,
                  source,
                  isFromPlural,
                );

                const toWordDetails = await upsertWordDetails(
                  tx,
                  toWordId,
                  relation.toWord === 'mainWordDetails'
                    ? partOfSpeech
                    : currentSubWord.partOfSpeech,
                  source,
                  !isFromPlural,
                );

                await tx.wordDetailsRelationship.upsert({
                  where: {
                    fromWordDetailsId_toWordDetailsId_type: {
                      fromWordDetailsId: fromWordDetails.id,
                      toWordDetailsId: toWordDetails.id,
                      type: relation.type,
                    },
                  },
                  create: {
                    fromWordDetailsId: fromWordDetails.id,
                    toWordDetailsId: toWordDetails.id,
                    type: relation.type,
                    description: getRelationshipDescription(relation.type),
                  },
                  update: {},
                });
              } else {
                // Create WordToWordRelationship
                await tx.wordToWordRelationship.upsert({
                  where: {
                    fromWordId_toWordId_type: {
                      fromWordId: fromWordId,
                      toWordId: toWordId,
                      type: relation.type,
                    },
                  },
                  create: {
                    fromWordId: fromWordId,
                    toWordId: toWordId,
                    type: relation.type,
                    description: getRelationshipDescription(relation.type),
                  },
                  update: {},
                });
              }
            }
          }
        }
      },
      {
        maxWait: 60000,
        timeout: 200000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return processedData;
  } catch (error) {
    console.error('Error saving word data for:', mainWordText, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
    }
    throw new Error(
      `Failed to save Danish word data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper functions for extracting data from labels
function extractSubjectLabels(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  const subjectLabels = [
    'MEDICIN',
    'JURA',
    'TEKNIK',
    'KEMI',
    'MATEMATIK',
    'MUSIK',
    'SPORT',
    'BOTANIK',
    'ZOOLOGI',
    'ØKONOMI',
    'POLITIK',
    'RELIGION',
    'MILITÆR',
    'LITTERATUR',
    'ASTRONOMI',
    'GASTRONOMI',
    'SØFART',
    'slang',
  ];

  const found = Object.keys(labels).filter((key) =>
    subjectLabels.includes(key),
  );

  return found.length > 0 ? found.join(', ') : null;
}

function extractGeneralLabels(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  if (labels['talemåde']) {
    return 'talemåde (idiom/proverb)';
  }

  return null;
}

function extractGrammaticalNote(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels || !labels['grammatik']) return null;

  return typeof labels['grammatik'] === 'string'
    ? labels['grammatik']
    : 'grammatik';
}

function extractUsageNote(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  if (labels['SPROGBRUG']) {
    return typeof labels['SPROGBRUG'] === 'string'
      ? labels['SPROGBRUG']
      : 'SPROGBRUG';
  }

  if (labels['overført']) {
    return 'overført (figurative/metaphorical usage)';
  }

  return null;
}

function mapStemPosToEnum(stemPos: string): PartOfSpeech {
  switch (stemPos.toLowerCase()) {
    case 'sb.':
      return PartOfSpeech.noun;
    case 'vb.':
      return PartOfSpeech.verb;
    case 'adj.':
      return PartOfSpeech.adjective;
    case 'adv.':
      return PartOfSpeech.adverb;
    case 'præp.':
      return PartOfSpeech.preposition;
    case 'konj.':
      return PartOfSpeech.conjunction;
    case 'pron.':
      return PartOfSpeech.pronoun;
    case 'interj.':
      return PartOfSpeech.interjection;
    case 'num.':
      return PartOfSpeech.numeral;
    default:
      return PartOfSpeech.undefined;
  }
}

function getRelationshipDescription(
  relationType: RelationshipType,
): string | null {
  // Danish-specific relationships
  switch (relationType) {
    case RelationshipType.definite_form_da:
      return 'Definite form (bestemt form)';
    case RelationshipType.plural_da:
      return 'Plural form (flertal)';
    case RelationshipType.plural_definite_da:
      return 'Plural definite form (bestemt form flertal)';
    case RelationshipType.present_tense_da:
      return 'Present tense form (nutid)';
    case RelationshipType.past_tense_da:
      return 'Past tense form (datid)';
    case RelationshipType.past_participle_da:
      return 'Past participle form (tillægsform)';
    case RelationshipType.imperative_da:
      return 'Imperative form (bydeform)';
    case RelationshipType.comparative_da:
      return 'Comparative form (komparativ)';
    case RelationshipType.superlative_da:
      return 'Superlative form (superlativ)';
    // General relationships
    case RelationshipType.synonym:
      return 'Synonym relationship';
    case RelationshipType.antonym:
      return 'Antonym relationship';
    case RelationshipType.stem:
      return 'Stem relationship';
    case RelationshipType.phrase:
      return 'Phrase';
    default:
      return null;
  }
}
