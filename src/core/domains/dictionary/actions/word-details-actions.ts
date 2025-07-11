'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';
import {
  getFrequencyPartOfSpeechEnum,
  FrequencyPartOfSpeech,
} from '@/core/lib/utils/commonDictUtils/frequencyUtils';
import {
  LanguageCode,
  PartOfSpeech,
  SourceType,
  RelationshipType,
  Gender,
} from '@/core/types';
import { DatabaseJsonValue } from '@/core/types/database';
import { WordUpdateData, UpdateWordResult } from '@/core/types/dictionary';
import { WordDetailsUpdateInput } from '@/core/types/prisma-substitutes';

// Add type definition for image data
interface ImageData {
  id: number;
  url: string;
  description: string | null;
}

// Definition for translation data used in multiple places
interface TranslationData {
  id: number;
  languageCode: LanguageCode;
  content: string;
}

// Definition for example data used in multiple places
interface ExampleData {
  id: number;
  text: string;
  grammaticalNote?: string | null;
  audio: string | null;
  translations?: TranslationData[];
}

// Definition for audio file data
export interface AudioFileData {
  id: number;
  url: string;
  isPrimary: boolean;
  note?: string | null;
}

// Definition for definition data
export interface DefinitionData {
  id: number;
  text: string;
  image: ImageData | null;
  frequencyPartOfSpeech: FrequencyPartOfSpeech;
  languageCode: LanguageCode;
  source: SourceType;
  subjectStatusLabels: string | null;
  generalLabels: string | null;
  grammaticalNote: string | null;
  usageNote: string | null;
  isInShortDef: boolean;
  examples: ExampleData[];
  translations?: TranslationData[];
}

// Interface for related forms/details specific to a POS variant
export interface DetailRelationForPOS {
  type: RelationshipType | string;
  description: string | null;
  toWordText: string;
  toWordAudio: string | null;
  toWordId: number;
  targetPartOfSpeech?: PartOfSpeech | string;
}

// Part of speech specific details
export interface WordPartOfSpeechDetails {
  id: number;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  gender: string | null;
  etymology: string | null;
  phonetic: string | null;
  forms: string | null;
  frequency: number;
  isPlural: boolean;
  source: string;
  definitions: DefinitionData[];
  audioFiles: AudioFileData[];
  detailRelations: DetailRelationForPOS[];
}

// Main word entry data that will be returned by getWordDetails
export interface WordEntryData {
  id: number;
  word: string;
  phoneticGeneral: string | null;
  frequencyGeneral: number;
  languageCode: LanguageCode;
  createdAt: Date;
  updatedAt: Date;
  isHighlighted: boolean;
  additionalInfo: Record<string, unknown>;
  details: WordPartOfSpeechDetails[];
  relatedWords: {
    [key in RelationshipType]?: Array<{
      id: number;
      word: string;
      phoneticGeneral?: string | null;
      audio?: string | null;
    }>;
  };
  mistakes?: Array<{
    id: string;
    type: string;
    context: string | null;
    incorrectValue: string | null;
    mistakeData: DatabaseJsonValue;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    wordId: number;
    wordDetailsId: number | null;
    definitionId: number | null;
    userDictionaryId: string | null;
  }>;
}

/**
 * Retrieves comprehensive information about a word for the Word Checker component
 * @param wordText The exact text of the word to look up
 * @param languageCode The language code of the word (default: 'en')
 * @returns Complete word details including related words, definitions, and phrases
 */
export async function getWordDetails(
  wordText: string,
  languageCode: LanguageCode = LanguageCode.en,
): Promise<WordEntryData | null> {
  try {
    const wordRecord = await prisma.word.findFirst({
      where: {
        word: wordText,
        languageCode,
      },
      include: {
        // Include WordToWordRelationship records at Word level
        relatedFromWords: {
          // WordToWordRelationship where this word is the source
          include: {
            toWord: {
              include: {
                details: {
                  include: {
                    audioLinks: {
                      include: { audio: true },
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                  take: 1, // Get primary WordDetails for phonetic info
                },
              },
            },
          },
        },
        relatedToWords: {
          // WordToWordRelationship where this word is the target
          include: {
            fromWord: {
              include: {
                details: {
                  include: {
                    audioLinks: {
                      include: { audio: true },
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
        details: {
          include: {
            audioLinks: { include: { audio: true } },
            definitions: {
              include: {
                definition: {
                  include: {
                    image: true,
                    translationLinks: { include: { translation: true } },
                    examples: {
                      include: {
                        audioLinks: { include: { audio: true } },
                        translationLinks: { include: { translation: true } },
                      },
                    },
                  },
                },
              },
            },
            relatedFrom: {
              // DetailRelationship where this WordDetails is the source
              include: {
                toWordDetails: {
                  include: {
                    word: true,
                    audioLinks: {
                      include: { audio: true },
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
            relatedTo: {
              // DetailRelationship where this WordDetails is the target
              include: {
                fromWordDetails: {
                  include: {
                    word: true,
                    audioLinks: {
                      include: { audio: true },
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        mistakes: true,
      },
    });

    if (!wordRecord) return null;

    // Map word details to the new structure (DetailRelationship processing remains the same)
    const wordPartOfSpeechDetails: WordPartOfSpeechDetails[] =
      wordRecord.details.map((detail) => {
        const definitions: DefinitionData[] = detail.definitions.map(
          (defJunction) => {
            const actualDefinition = defJunction.definition;
            return {
              id: actualDefinition.id,
              text: actualDefinition.definition,
              image: actualDefinition.image,
              frequencyPartOfSpeech: getFrequencyPartOfSpeechEnum(
                detail.frequency || 0,
              ),
              languageCode: actualDefinition.languageCode,
              source: actualDefinition.source,
              subjectStatusLabels: actualDefinition.subjectStatusLabels,
              generalLabels: actualDefinition.generalLabels,
              grammaticalNote: actualDefinition.grammaticalNote,
              usageNote: actualDefinition.usageNote,
              isInShortDef: actualDefinition.isInShortDef,
              examples: actualDefinition.examples.map((ex) => ({
                id: ex.id,
                text: ex.example,
                grammaticalNote: ex.grammaticalNote,
                audio: ex.audioLinks?.[0]?.audio.url || null,
                translations: ex.translationLinks.map((tl) => ({
                  id: tl.translation.id,
                  languageCode: tl.translation.languageCode,
                  content: tl.translation.content,
                })),
              })),
              translations: actualDefinition.translationLinks.map((tl) => ({
                id: tl.translation.id,
                languageCode: tl.translation.languageCode,
                content: tl.translation.content,
              })),
            };
          },
        );

        const audioFiles: AudioFileData[] = detail.audioLinks.map((link) => ({
          id: link.audio.id,
          url: link.audio.url,
          isPrimary: link.isPrimary,
          note: link.audio.note,
        }));

        // Process detail-specific relationships (DetailRelationship)
        const detailRelations: DetailRelationForPOS[] = detail.relatedFrom
          .map((rel) => {
            const targetDetails = rel.toWordDetails;
            const targetAudioUrl =
              targetDetails?.audioLinks?.[0]?.audio?.url || null;
            if (!targetDetails || !targetDetails.word) {
              return null;
            }
            return {
              type: rel.type,
              description: rel.description,
              toWordText: targetDetails.word.word,
              toWordAudio: targetAudioUrl,
              toWordId: targetDetails.word.id,
              targetPartOfSpeech: targetDetails.partOfSpeech,
            };
          })
          .filter(Boolean) as DetailRelationForPOS[];

        return {
          id: detail.id,
          partOfSpeech: detail.partOfSpeech,
          variant: detail.variant,
          gender: detail.gender,
          etymology: detail.etymology,
          phonetic: detail.phonetic,
          forms: detail.forms,
          frequency: detail.frequency || 0,
          isPlural: detail.isPlural || false,
          source: detail.source || 'unknown',
          definitions,
          audioFiles,
          detailRelations,
        };
      });

    const finalWordEntry: WordEntryData = {
      id: wordRecord.id,
      word: wordRecord.word,
      phoneticGeneral: wordRecord.phoneticGeneral,
      frequencyGeneral: wordRecord.frequencyGeneral || 0,
      languageCode: wordRecord.languageCode,
      createdAt: wordRecord.createdAt,
      updatedAt: wordRecord.updatedAt,
      isHighlighted: wordRecord.isHighlighted || false,
      additionalInfo: wordRecord.additionalInfo as Record<string, unknown>,
      details: wordPartOfSpeechDetails,
      relatedWords: {},
      mistakes: wordRecord.mistakes.map((mistake) => ({
        ...mistake,
        mistakeData: mistake.mistakeData as DatabaseJsonValue,
      })),
    };

    // Process related words - UPDATED to include both WordToWordRelationship and DetailRelationship
    const aggregatedRelatedWords: WordEntryData['relatedWords'] = {};

    // 1. Process WordToWordRelationship records (Word-to-Word semantic relationships)
    // From this word to other words
    for (const rel of wordRecord.relatedFromWords) {
      if (rel.toWord) {
        const relatedWordData = rel.toWord;
        const relatedAudio =
          rel.toWord.details?.[0]?.audioLinks?.[0]?.audio?.url || null;

        const typeKey = rel.type as RelationshipType;
        aggregatedRelatedWords[typeKey] = aggregatedRelatedWords[typeKey] || [];
        if (
          !aggregatedRelatedWords[typeKey]?.find(
            (rw) => rw.id === relatedWordData.id,
          )
        ) {
          aggregatedRelatedWords[typeKey]?.push({
            id: relatedWordData.id,
            word: relatedWordData.word,
            phoneticGeneral: relatedWordData.phoneticGeneral,
            audio: relatedAudio,
          });
        }
      }
    }

    // From other words to this word (reverse relationships)
    for (const rel of wordRecord.relatedToWords) {
      if (rel.fromWord) {
        const relatedWordData = rel.fromWord;
        const relatedAudio =
          rel.fromWord.details?.[0]?.audioLinks?.[0]?.audio?.url || null;

        // For reverse relationships, we might want to show them under a different category
        // or use the same category depending on the relationship type
        const typeKey = rel.type as RelationshipType;
        aggregatedRelatedWords[typeKey] = aggregatedRelatedWords[typeKey] || [];
        if (
          !aggregatedRelatedWords[typeKey]?.find(
            (rw) => rw.id === relatedWordData.id,
          )
        ) {
          aggregatedRelatedWords[typeKey]?.push({
            id: relatedWordData.id,
            word: relatedWordData.word,
            phoneticGeneral: relatedWordData.phoneticGeneral,
            audio: relatedAudio,
          });
        }
      }
    }

    // 2. Process DetailRelationship records (WordDetails-to-WordDetails morphological relationships)
    for (const detail of wordRecord.details) {
      for (const rel of detail.relatedFrom) {
        if (rel.toWordDetails && rel.toWordDetails.word) {
          const relatedWordData = rel.toWordDetails.word;
          const relatedAudio =
            rel.toWordDetails.audioLinks?.[0]?.audio?.url || null;

          const typeKey = rel.type as RelationshipType;
          aggregatedRelatedWords[typeKey] =
            aggregatedRelatedWords[typeKey] || [];
          if (
            !aggregatedRelatedWords[typeKey]?.find(
              (rw) => rw.id === relatedWordData.id,
            )
          ) {
            aggregatedRelatedWords[typeKey]?.push({
              id: relatedWordData.id,
              word: relatedWordData.word,
              phoneticGeneral: relatedWordData.phoneticGeneral,
              audio: relatedAudio,
            });
          }
        }
      }
    }

    finalWordEntry.relatedWords = aggregatedRelatedWords;

    return finalWordEntry;
  } catch (error) {
    await serverLog('Error fetching word details', 'error', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch word details: ${error.message}`);
    }
    throw new Error('Failed to fetch word details due to an unknown error');
  }
}

export async function updateWordDetails(
  wordId: string,
  updateData: WordUpdateData,
): Promise<UpdateWordResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the main Word record (etymology is in WordDetails, not Word)
      const updatedWord = await tx.word.update({
        where: { id: parseInt(wordId) },
        data: {
          word: updateData.word,
          phoneticGeneral: updateData.phonetic,
          updatedAt: new Date(),
        },
      });

      // 2. Update or create WordDetails with etymology
      if (updateData.etymology !== undefined) {
        await tx.wordDetails.updateMany({
          where: { wordId: parseInt(wordId) },
          data: {
            etymology: updateData.etymology,
          },
        });
      }

      // 3. Handle definitions
      if (updateData.definitions) {
        for (const defData of updateData.definitions) {
          if (defData.id && defData.id > 0) {
            // Update existing definition
            await tx.definition.update({
              where: { id: defData.id },
              data: {
                definition: defData.definition,
                subjectStatusLabels: defData.subjectStatusLabels,
                generalLabels: defData.generalLabels,
                grammaticalNote: defData.grammaticalNote,
                usageNote: defData.usageNote,
                isInShortDef: defData.isInShortDef,
                imageId: defData.imageId,
              },
            });
          } else {
            // Create new definition
            const newDefinition = await tx.definition.create({
              data: {
                definition: defData.definition,
                source: defData.source,
                languageCode: defData.languageCode,
                subjectStatusLabels: defData.subjectStatusLabels,
                generalLabels: defData.generalLabels,
                grammaticalNote: defData.grammaticalNote,
                usageNote: defData.usageNote,
                isInShortDef: defData.isInShortDef,
                imageId: defData.imageId,
              },
            });

            // Link to word through WordDetails
            const wordDetails = await tx.wordDetails.findFirst({
              where: {
                wordId: parseInt(wordId),
                partOfSpeech: defData.partOfSpeech,
              },
            });

            if (wordDetails) {
              await tx.wordDefinition.create({
                data: {
                  wordDetailsId: wordDetails.id,
                  definitionId: newDefinition.id,
                  isPrimary: false,
                },
              });
            }
          }
        }
      }

      // 4. Handle examples
      if (updateData.examples) {
        for (const [definitionId, examples] of Object.entries(
          updateData.examples,
        )) {
          const defId = parseInt(definitionId);

          for (const exampleData of examples) {
            if (exampleData.id && exampleData.id > 0) {
              // Update existing example
              await tx.definitionExample.update({
                where: { id: exampleData.id },
                data: {
                  example: exampleData.example,
                  grammaticalNote: exampleData.grammaticalNote,
                },
              });
            } else {
              // Create new example
              await tx.definitionExample.create({
                data: {
                  example: exampleData.example,
                  languageCode: 'en' as LanguageCode,
                  definitionId: defId,
                  grammaticalNote: exampleData.grammaticalNote,
                },
              });
            }
          }
        }
      }

      // 5. Handle audio files
      if (updateData.audioFiles) {
        // Get WordDetails for this word
        const wordDetails = await tx.wordDetails.findFirst({
          where: { wordId: parseInt(wordId) },
        });

        if (wordDetails) {
          for (const audioData of updateData.audioFiles) {
            if (audioData.id && audioData.id > 0) {
              // Update existing audio - handle optional note properly
              await tx.audio.update({
                where: { id: audioData.id },
                data: {
                  url: audioData.url,
                  ...(audioData.note !== undefined && { note: audioData.note }),
                },
              });

              // Update the link
              await tx.wordDetailsAudio.upsert({
                where: {
                  wordDetailsId_audioId: {
                    wordDetailsId: wordDetails.id,
                    audioId: audioData.id,
                  },
                },
                update: {
                  isPrimary: audioData.isPrimary || false,
                },
                create: {
                  wordDetailsId: wordDetails.id,
                  audioId: audioData.id,
                  isPrimary: audioData.isPrimary || false,
                },
              });
            } else {
              // Create new audio - handle optional note properly
              const newAudio = await tx.audio.create({
                data: {
                  url: audioData.url,
                  source: audioData.source,
                  languageCode: audioData.languageCode,
                  ...(audioData.note !== undefined && { note: audioData.note }),
                },
              });

              // Link to word details
              await tx.wordDetailsAudio.create({
                data: {
                  wordDetailsId: wordDetails.id,
                  audioId: newAudio.id,
                  isPrimary: audioData.isPrimary || false,
                },
              });
            }
          }
        }
      }

      // 6. Handle related words (simplified for now - this would need more complex logic)
      if (updateData.relatedWords) {
        // Note: This is a simplified implementation
        // In a full implementation, you'd need to handle WordToWordRelationship
        // and WordDetailsRelationship tables properly
        await serverLog(
          'Related words handling not fully implemented yet',
          'warn',
        );
      }

      return updatedWord;
    });

    return {
      success: true,
      data: {
        id: result.id,
        word: result.word,
        phonetic: result.phoneticGeneral,
        etymology: updateData.etymology, // Return the etymology from input since it's stored in WordDetails
      },
    };
  } catch (error) {
    await serverLog('Error updating word details', 'error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Interface for WordDetail edit form data
 */
export interface WordDetailEditData {
  // WordDetail fields
  id: number;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  gender: Gender | null;
  etymology: string | null;
  phonetic: string | null;
  forms: string | null;
  frequency: number | null;
  isPlural: boolean;
  source: SourceType;

  // Word fields (shared across all WordDetails)
  wordText: string;
  phoneticGeneral: string | null;
  frequencyGeneral: number | null;
  languageCode: LanguageCode;

  // Enhanced definitions with examples
  definitions: Array<{
    id: number | null; // null for new definitions
    definition: string;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
    generalLabels: string | null;
    grammaticalNote: string | null;
    usageNote: string | null;
    isInShortDef: boolean;
    imageId: number | null;
    imageUrl: string | null;
    examples: Array<{
      id: number | null; // null for new examples
      example: string;
      grammaticalNote: string | null;
      sourceOfExample: string | null;
    }>;
    _toDelete?: boolean; // Flag for deletion
  }>;

  audioFiles: Array<{
    id: number | null; // null for new audio files
    url: string;
    isPrimary: boolean;
    languageCode: LanguageCode;
    source: SourceType;
    note: string | null;
    _toDelete?: boolean; // Flag for deletion
  }>;

  // WordDetails relationships (from this WordDetail to others)
  wordDetailRelationships: Array<{
    id: string | null; // composite key as string or null for new
    toWordDetailsId: number;
    toWordText: string;
    toPartOfSpeech: PartOfSpeech;
    toVariant: string | null;
    type: RelationshipType;
    description: string | null;
    orderIndex: number | null;
    _toDelete?: boolean; // Flag for deletion
  }>;

  // Word relationships (from this Word to others - affects all WordDetails)
  wordRelationships: Array<{
    id: string | null; // composite key as string or null for new
    toWordId: number;
    toWordText: string;
    type: RelationshipType;
    description: string | null;
    orderIndex: number | null;
    _toDelete?: boolean; // Flag for deletion
  }>;
}

/**
 * Fetch a specific WordDetail by ID for editing
 */
export async function fetchWordDetailById(
  wordDetailId: number,
): Promise<WordDetailEditData | null> {
  try {
    const wordDetail = await prisma.wordDetails.findUnique({
      where: { id: wordDetailId },
      include: {
        word: {
          include: {
            // Word-level relationships
            relatedFromWords: {
              include: {
                toWord: true,
              },
            },
          },
        },
        definitions: {
          include: {
            definition: {
              include: {
                image: true,
                examples: true,
              },
            },
          },
        },
        audioLinks: {
          include: {
            audio: true,
          },
        },
        // WordDetail-level relationships
        relatedFrom: {
          include: {
            toWordDetails: {
              include: {
                word: true,
              },
            },
          },
        },
      },
    });

    if (!wordDetail) {
      return null;
    }

    return {
      // WordDetail fields
      id: wordDetail.id,
      partOfSpeech: wordDetail.partOfSpeech,
      variant: wordDetail.variant,
      gender: wordDetail.gender,
      etymology: wordDetail.etymology,
      phonetic: wordDetail.phonetic,
      forms: wordDetail.forms,
      frequency: wordDetail.frequency,
      isPlural: wordDetail.isPlural,
      source: wordDetail.source,

      // Word fields
      wordText: wordDetail.word.word,
      phoneticGeneral: wordDetail.word.phoneticGeneral,
      frequencyGeneral: wordDetail.word.frequencyGeneral,
      languageCode: wordDetail.word.languageCode,

      // Enhanced definitions with examples
      definitions: wordDetail.definitions.map((wd) => ({
        id: wd.definition.id,
        definition: wd.definition.definition,
        languageCode: wd.definition.languageCode,
        source: wd.definition.source,
        subjectStatusLabels: wd.definition.subjectStatusLabels,
        generalLabels: wd.definition.generalLabels,
        grammaticalNote: wd.definition.grammaticalNote,
        usageNote: wd.definition.usageNote,
        isInShortDef: wd.definition.isInShortDef,
        imageId: wd.definition.imageId,
        imageUrl: wd.definition.image?.url || null,
        examples: wd.definition.examples.map((ex) => ({
          id: ex.id,
          example: ex.example,
          grammaticalNote: ex.grammaticalNote,
          sourceOfExample: ex.sourceOfExample,
        })),
      })),

      // Audio files
      audioFiles: wordDetail.audioLinks.map((al) => ({
        id: al.audio.id,
        url: al.audio.url,
        isPrimary: al.isPrimary,
        languageCode: al.audio.languageCode,
        source: al.audio.source,
        note: al.audio.note,
      })),

      // WordDetail relationships
      wordDetailRelationships: wordDetail.relatedFrom.map((rel) => ({
        id: `${rel.fromWordDetailsId}-${rel.toWordDetailsId}-${rel.type}`,
        toWordDetailsId: rel.toWordDetailsId,
        toWordText: rel.toWordDetails.word.word,
        toPartOfSpeech: rel.toWordDetails.partOfSpeech,
        toVariant: rel.toWordDetails.variant,
        type: rel.type,
        description: rel.description,
        orderIndex: rel.orderIndex,
      })),

      // Word relationships
      wordRelationships: wordDetail.word.relatedFromWords.map((rel) => ({
        id: `${rel.fromWordId}-${rel.toWordId}-${rel.type}`,
        toWordId: rel.toWordId,
        toWordText: rel.toWord.word,
        type: rel.type,
        description: rel.description,
        orderIndex: rel.orderIndex,
      })),
    };
  } catch (error) {
    await serverLog('Error fetching word detail by ID', 'error', error);
    return null;
  }
}

/**
 * Helper function to validate audio data
 */
function validateAudioData(audioData: {
  url: string;
  languageCode: LanguageCode;
  source: SourceType;
  note: string | null;
}): boolean {
  return !!(
    audioData.url &&
    typeof audioData.url === 'string' &&
    audioData.url.trim().length > 0 &&
    audioData.languageCode &&
    audioData.source
  );
}

/**
 * Update a specific WordDetail by ID
 */
export async function updateWordDetailById(
  wordDetailId: number,
  updateData: Partial<WordDetailEditData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // Update WordDetail fields
        const wordDetailUpdates: WordDetailsUpdateInput = {};

        if (updateData.partOfSpeech !== undefined)
          wordDetailUpdates.partOfSpeech = updateData.partOfSpeech;
        if (updateData.variant !== undefined)
          wordDetailUpdates.variant = updateData.variant;
        if (updateData.gender !== undefined)
          wordDetailUpdates.gender = updateData.gender;
        if (updateData.etymology !== undefined)
          wordDetailUpdates.etymology = updateData.etymology;
        if (updateData.phonetic !== undefined)
          wordDetailUpdates.phonetic = updateData.phonetic;
        if (updateData.forms !== undefined)
          wordDetailUpdates.forms = updateData.forms;
        if (updateData.frequency !== undefined)
          wordDetailUpdates.frequency = updateData.frequency;
        if (updateData.isPlural !== undefined)
          wordDetailUpdates.isPlural = updateData.isPlural;
        if (updateData.source !== undefined)
          wordDetailUpdates.source = updateData.source;

        if (Object.keys(wordDetailUpdates).length > 0) {
          await tx.wordDetails.update({
            where: { id: wordDetailId },
            data: wordDetailUpdates,
          });
        }

        // Update Word fields (this will affect all WordDetails of this word)
        const wordDetail = await tx.wordDetails.findUnique({
          where: { id: wordDetailId },
          select: { wordId: true },
        });

        if (
          wordDetail &&
          (updateData.wordText ||
            updateData.phoneticGeneral !== undefined ||
            updateData.frequencyGeneral !== undefined)
        ) {
          const wordUpdates: Partial<{
            word: string;
            phoneticGeneral: string | null;
            frequencyGeneral: number | null;
          }> = {};

          if (updateData.wordText) wordUpdates.word = updateData.wordText;
          if (updateData.phoneticGeneral !== undefined)
            wordUpdates.phoneticGeneral = updateData.phoneticGeneral;
          if (updateData.frequencyGeneral !== undefined)
            wordUpdates.frequencyGeneral = updateData.frequencyGeneral;

          if (Object.keys(wordUpdates).length > 0) {
            await tx.word.update({
              where: { id: wordDetail.wordId },
              data: wordUpdates,
            });
          }
        }

        // Handle definitions updates
        if (updateData.definitions) {
          for (const defData of updateData.definitions) {
            if (defData._toDelete) {
              // Delete definition and its relationships
              if (defData.id) {
                await tx.wordDefinition.deleteMany({
                  where: { definitionId: defData.id },
                });
                await tx.definition.delete({
                  where: { id: defData.id },
                });
              }
            } else if (defData.id) {
              // Update existing definition
              await tx.definition.update({
                where: { id: defData.id },
                data: {
                  definition: defData.definition,
                  subjectStatusLabels: defData.subjectStatusLabels,
                  generalLabels: defData.generalLabels,
                  grammaticalNote: defData.grammaticalNote,
                  usageNote: defData.usageNote,
                  isInShortDef: defData.isInShortDef,
                  imageId: defData.imageId,
                },
              });

              // Handle examples
              if (defData.examples) {
                for (const exampleData of defData.examples) {
                  if (exampleData.id) {
                    // Update existing example
                    await tx.definitionExample.update({
                      where: { id: exampleData.id },
                      data: {
                        example: exampleData.example,
                        grammaticalNote: exampleData.grammaticalNote,
                        sourceOfExample: exampleData.sourceOfExample,
                      },
                    });
                  } else {
                    // Create new example
                    await tx.definitionExample.create({
                      data: {
                        definitionId: defData.id,
                        example: exampleData.example,
                        languageCode: defData.languageCode,
                        grammaticalNote: exampleData.grammaticalNote,
                        sourceOfExample: exampleData.sourceOfExample,
                      },
                    });
                  }
                }
              }
            } else {
              // Create new definition
              const newDef = await tx.definition.create({
                data: {
                  definition: defData.definition,
                  languageCode: defData.languageCode,
                  source: defData.source,
                  subjectStatusLabels: defData.subjectStatusLabels,
                  generalLabels: defData.generalLabels,
                  grammaticalNote: defData.grammaticalNote,
                  usageNote: defData.usageNote,
                  isInShortDef: defData.isInShortDef,
                  imageId: defData.imageId,
                },
              });

              // Link to WordDetail
              await tx.wordDefinition.create({
                data: {
                  wordDetailsId: wordDetailId,
                  definitionId: newDef.id,
                },
              });

              // Create examples for new definition
              if (defData.examples) {
                for (const exampleData of defData.examples) {
                  await tx.definitionExample.create({
                    data: {
                      definitionId: newDef.id,
                      example: exampleData.example,
                      languageCode: defData.languageCode,
                      grammaticalNote: exampleData.grammaticalNote,
                      sourceOfExample: exampleData.sourceOfExample,
                    },
                  });
                }
              }
            }
          }
        }

        // Handle audio files updates
        if (updateData.audioFiles) {
          for (const audioData of updateData.audioFiles) {
            if (audioData._toDelete) {
              // Delete audio and its relationships
              if (audioData.id) {
                await tx.wordDetailsAudio.deleteMany({
                  where: { audioId: audioData.id },
                });
                await tx.audio.delete({
                  where: { id: audioData.id },
                });
              }
            } else if (audioData.id) {
              // Update existing audio
              await tx.audio.update({
                where: { id: audioData.id },
                data: {
                  url: audioData.url.trim(),
                  note: audioData.note,
                },
              });

              // Update the link
              await tx.wordDetailsAudio.updateMany({
                where: {
                  wordDetailsId: wordDetailId,
                  audioId: audioData.id,
                },
                data: {
                  isPrimary: audioData.isPrimary,
                },
              });
            } else {
              // Validate audio data before processing
              if (!validateAudioData(audioData)) {
                void serverLog('Skipping invalid audio data', 'warn', {
                  audioData,
                });
                continue; // Skip invalid audio data
              }

              // Find or create audio file
              let audioFile = await tx.audio.findFirst({
                where: {
                  url: audioData.url.trim(),
                  languageCode: audioData.languageCode,
                },
              });

              if (!audioFile) {
                // Create new audio if it doesn't exist
                audioFile = await tx.audio.create({
                  data: {
                    url: audioData.url.trim(),
                    languageCode: audioData.languageCode,
                    source: audioData.source,
                    note: audioData.note,
                  },
                });
              } else {
                // Update existing audio file with new note and source if provided
                audioFile = await tx.audio.update({
                  where: { id: audioFile.id },
                  data: {
                    source: audioData.source,
                    note: audioData.note,
                  },
                });
              }

              // Check if link already exists to avoid duplicate relationship
              const existingLink = await tx.wordDetailsAudio.findUnique({
                where: {
                  wordDetailsId_audioId: {
                    wordDetailsId: wordDetailId,
                    audioId: audioFile.id,
                  },
                },
              });

              if (!existingLink) {
                // Create link to WordDetail
                await tx.wordDetailsAudio.create({
                  data: {
                    wordDetailsId: wordDetailId,
                    audioId: audioFile.id,
                    isPrimary: audioData.isPrimary,
                  },
                });
              } else {
                // Update existing link
                await tx.wordDetailsAudio.update({
                  where: {
                    wordDetailsId_audioId: {
                      wordDetailsId: wordDetailId,
                      audioId: audioFile.id,
                    },
                  },
                  data: {
                    isPrimary: audioData.isPrimary,
                  },
                });
              }
            }
          }
        }

        // Handle WordDetail relationships
        if (updateData.wordDetailRelationships) {
          for (const relData of updateData.wordDetailRelationships) {
            if (relData._toDelete && relData.id) {
              // Parse composite key and delete relationship
              const [fromId, toId, type] = relData.id.split('-');
              if (fromId && toId && type) {
                await tx.wordDetailsRelationship.delete({
                  where: {
                    fromWordDetailsId_toWordDetailsId_type: {
                      fromWordDetailsId: parseInt(fromId),
                      toWordDetailsId: parseInt(toId),
                      type: type as RelationshipType,
                    },
                  },
                });
              }
            } else if (!relData.id) {
              // Check if relationship already exists to avoid duplicates
              const existingRelationship =
                await tx.wordDetailsRelationship.findUnique({
                  where: {
                    fromWordDetailsId_toWordDetailsId_type: {
                      fromWordDetailsId: wordDetailId,
                      toWordDetailsId: relData.toWordDetailsId,
                      type: relData.type,
                    },
                  },
                });

              if (!existingRelationship) {
                // Create new relationship
                await tx.wordDetailsRelationship.create({
                  data: {
                    fromWordDetailsId: wordDetailId,
                    toWordDetailsId: relData.toWordDetailsId,
                    type: relData.type,
                    description: relData.description,
                    orderIndex: relData.orderIndex,
                  },
                });
              }
            } else {
              // Update existing relationship
              const [fromId, toId, type] = relData.id.split('-');
              if (fromId && toId && type) {
                await tx.wordDetailsRelationship.update({
                  where: {
                    fromWordDetailsId_toWordDetailsId_type: {
                      fromWordDetailsId: parseInt(fromId),
                      toWordDetailsId: parseInt(toId),
                      type: type as RelationshipType,
                    },
                  },
                  data: {
                    description: relData.description,
                    orderIndex: relData.orderIndex,
                  },
                });
              }
            }
          }
        }

        // Handle Word relationships (affects all WordDetails)
        if (updateData.wordRelationships) {
          const currentWordDetail = await tx.wordDetails.findUnique({
            where: { id: wordDetailId },
            select: { wordId: true },
          });

          if (currentWordDetail) {
            for (const relData of updateData.wordRelationships) {
              if (relData._toDelete && relData.id) {
                // Parse composite key and delete relationship
                const [fromId, toId, type] = relData.id.split('-');
                if (fromId && toId && type) {
                  await tx.wordToWordRelationship.delete({
                    where: {
                      fromWordId_toWordId_type: {
                        fromWordId: parseInt(fromId),
                        toWordId: parseInt(toId),
                        type: type as RelationshipType,
                      },
                    },
                  });
                }
              } else if (!relData.id) {
                // Check if relationship already exists to avoid duplicates
                const existingWordRelationship =
                  await tx.wordToWordRelationship.findUnique({
                    where: {
                      fromWordId_toWordId_type: {
                        fromWordId: currentWordDetail.wordId,
                        toWordId: relData.toWordId,
                        type: relData.type,
                      },
                    },
                  });

                if (!existingWordRelationship) {
                  // Create new relationship
                  await tx.wordToWordRelationship.create({
                    data: {
                      fromWordId: currentWordDetail.wordId,
                      toWordId: relData.toWordId,
                      type: relData.type,
                      description: relData.description,
                      orderIndex: relData.orderIndex,
                    },
                  });
                }
              } else {
                // Update existing relationship
                const [fromId, toId, type] = relData.id.split('-');
                if (fromId && toId && type) {
                  await tx.wordToWordRelationship.update({
                    where: {
                      fromWordId_toWordId_type: {
                        fromWordId: parseInt(fromId),
                        toWordId: parseInt(toId),
                        type: type as RelationshipType,
                      },
                    },
                    data: {
                      description: relData.description,
                      orderIndex: relData.orderIndex,
                    },
                  });
                }
              }
            }
          }
        }
      },
      {
        timeout: 30000, // 30 second timeout
      },
    );

    return { success: true };
  } catch (error) {
    await serverLog('Error updating word detail', 'error', error);

    // Provide more specific error messages for common issues
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint failed')) {
        if (
          error.message.includes('url') &&
          error.message.includes('language_code')
        ) {
          errorMessage =
            'An audio file with this URL and language already exists in the system.';
        } else {
          errorMessage =
            'A record with these values already exists. Please check for duplicates.';
        }
      } else if (error.message.includes('Record to update not found')) {
        errorMessage = 'The record you are trying to update no longer exists.';
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage =
          'Invalid reference to another record. Please check your data.';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Search for words to create relationships with
 */
export async function searchWordsForRelationships(
  query: string,
  languageCode: LanguageCode,
  excludeWordId?: number,
  limit: number = 10,
): Promise<
  Array<{
    wordId: number;
    wordText: string;
    phoneticGeneral: string | null;
    wordDetails: Array<{
      id: number;
      partOfSpeech: PartOfSpeech;
      variant: string | null;
    }>;
  }>
> {
  try {
    const words = await prisma.word.findMany({
      where: {
        word: {
          contains: query,
          mode: 'insensitive',
        },
        languageCode,
        ...(excludeWordId && { id: { not: excludeWordId } }),
      },
      include: {
        details: {
          select: {
            id: true,
            partOfSpeech: true,
            variant: true,
          },
        },
      },
      take: limit,
      orderBy: {
        word: 'asc',
      },
    });

    return words.map((word) => ({
      wordId: word.id,
      wordText: word.word,
      phoneticGeneral: word.phoneticGeneral,
      wordDetails: word.details,
    }));
  } catch (error) {
    await serverLog('Error searching words for relationships', 'error', error);
    return [];
  }
}

/**
 * Update only definitions for a specific WordDetail
 */
export async function updateWordDetailDefinitions(
  wordDetailId: number,
  definitions: WordDetailEditData['definitions'],
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Handle definitions updates
      for (const defData of definitions) {
        if (defData._toDelete) {
          // Delete definition and its relationships
          if (defData.id) {
            await tx.wordDefinition.deleteMany({
              where: { definitionId: defData.id },
            });
            await tx.definition.delete({
              where: { id: defData.id },
            });
          }
        } else if (defData.id) {
          // Update existing definition
          await tx.definition.update({
            where: { id: defData.id },
            data: {
              definition: defData.definition,
              subjectStatusLabels: defData.subjectStatusLabels,
              generalLabels: defData.generalLabels,
              grammaticalNote: defData.grammaticalNote,
              usageNote: defData.usageNote,
              isInShortDef: defData.isInShortDef,
              imageId: defData.imageId,
            },
          });

          // Handle examples
          if (defData.examples) {
            for (const exampleData of defData.examples) {
              if (exampleData.id) {
                // Update existing example
                await tx.definitionExample.update({
                  where: { id: exampleData.id },
                  data: {
                    example: exampleData.example,
                    grammaticalNote: exampleData.grammaticalNote,
                    sourceOfExample: exampleData.sourceOfExample,
                  },
                });
              } else {
                // Create new example
                await tx.definitionExample.create({
                  data: {
                    definitionId: defData.id,
                    example: exampleData.example,
                    languageCode: defData.languageCode,
                    grammaticalNote: exampleData.grammaticalNote,
                    sourceOfExample: exampleData.sourceOfExample,
                  },
                });
              }
            }
          }
        } else {
          // Create new definition
          const newDef = await tx.definition.create({
            data: {
              definition: defData.definition,
              languageCode: defData.languageCode,
              source: defData.source,
              subjectStatusLabels: defData.subjectStatusLabels,
              generalLabels: defData.generalLabels,
              grammaticalNote: defData.grammaticalNote,
              usageNote: defData.usageNote,
              isInShortDef: defData.isInShortDef,
              imageId: defData.imageId,
            },
          });

          // Link to WordDetail
          await tx.wordDefinition.create({
            data: {
              wordDetailsId: wordDetailId,
              definitionId: newDef.id,
            },
          });

          // Create examples for new definition
          if (defData.examples) {
            for (const exampleData of defData.examples) {
              await tx.definitionExample.create({
                data: {
                  definitionId: newDef.id,
                  example: exampleData.example,
                  languageCode: defData.languageCode,
                  grammaticalNote: exampleData.grammaticalNote,
                  sourceOfExample: exampleData.sourceOfExample,
                },
              });
            }
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    await serverLog('Error updating definitions', 'error', error);
    return { success: false, error: 'Failed to update definitions' };
  }
}

/**
 * Update only audio files for a specific WordDetail
 */
export async function updateWordDetailAudioFiles(
  wordDetailId: number,
  audioFiles: WordDetailEditData['audioFiles'],
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Handle audio files updates
      for (const audioData of audioFiles) {
        if (audioData._toDelete) {
          // Delete audio and its relationships
          if (audioData.id) {
            await tx.wordDetailsAudio.deleteMany({
              where: { audioId: audioData.id },
            });
            await tx.audio.delete({
              where: { id: audioData.id },
            });
          }
        } else if (audioData.id) {
          // Update existing audio
          await tx.audio.update({
            where: { id: audioData.id },
            data: {
              url: audioData.url.trim(),
              note: audioData.note,
            },
          });

          // Update the link
          await tx.wordDetailsAudio.updateMany({
            where: {
              wordDetailsId: wordDetailId,
              audioId: audioData.id,
            },
            data: {
              isPrimary: audioData.isPrimary,
            },
          });
        } else {
          // Validate audio data before processing
          if (!validateAudioData(audioData)) {
            void serverLog('Skipping invalid audio data', 'warn', {
              audioData,
            });
            continue; // Skip invalid audio data
          }

          // Find or create audio file
          let audioFile = await tx.audio.findFirst({
            where: {
              url: audioData.url.trim(),
              languageCode: audioData.languageCode,
            },
          });

          if (!audioFile) {
            // Create new audio if it doesn't exist
            audioFile = await tx.audio.create({
              data: {
                url: audioData.url.trim(),
                languageCode: audioData.languageCode,
                source: audioData.source,
                note: audioData.note,
              },
            });
          } else {
            // Update existing audio file with new note and source if provided
            audioFile = await tx.audio.update({
              where: { id: audioFile.id },
              data: {
                source: audioData.source,
                note: audioData.note,
              },
            });
          }

          // Check if link already exists to avoid duplicate relationship
          const existingLink = await tx.wordDetailsAudio.findUnique({
            where: {
              wordDetailsId_audioId: {
                wordDetailsId: wordDetailId,
                audioId: audioFile.id,
              },
            },
          });

          if (!existingLink) {
            // Create link to WordDetail
            await tx.wordDetailsAudio.create({
              data: {
                wordDetailsId: wordDetailId,
                audioId: audioFile.id,
                isPrimary: audioData.isPrimary,
              },
            });
          } else {
            // Update existing link
            await tx.wordDetailsAudio.update({
              where: {
                wordDetailsId_audioId: {
                  wordDetailsId: wordDetailId,
                  audioId: audioFile.id,
                },
              },
              data: {
                isPrimary: audioData.isPrimary,
              },
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    await serverLog('Error updating audio files', 'error', error);
    return { success: false, error: 'Failed to update audio files' };
  }
}

/**
 * Update only images (within definitions) for a specific WordDetail
 */
export async function updateWordDetailImages(
  wordDetailId: number,
  definitions: WordDetailEditData['definitions'],
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Handle only imageId updates for existing definitions
      for (const defData of definitions) {
        if (defData.id && !defData._toDelete) {
          // Update only the imageId for existing definitions
          await tx.definition.update({
            where: { id: defData.id },
            data: {
              imageId: defData.imageId,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    await serverLog('Error updating definition images', 'error', error);
    return { success: false, error: 'Failed to update definition images' };
  }
}

/**
 * Update only relationships for a specific WordDetail
 */
export async function updateWordDetailRelationships(
  wordDetailId: number,
  wordDetailRelationships: WordDetailEditData['wordDetailRelationships'],
  wordRelationships: WordDetailEditData['wordRelationships'],
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Handle WordDetail relationships
      for (const relData of wordDetailRelationships) {
        if (relData._toDelete && relData.id) {
          // Parse composite key and delete relationship
          const [fromId, toId, type] = relData.id.split('-');
          if (fromId && toId && type) {
            await tx.wordDetailsRelationship.delete({
              where: {
                fromWordDetailsId_toWordDetailsId_type: {
                  fromWordDetailsId: parseInt(fromId),
                  toWordDetailsId: parseInt(toId),
                  type: type as RelationshipType,
                },
              },
            });
          }
        } else if (!relData.id) {
          // Check if relationship already exists to avoid duplicates
          const existingRelationship =
            await tx.wordDetailsRelationship.findUnique({
              where: {
                fromWordDetailsId_toWordDetailsId_type: {
                  fromWordDetailsId: wordDetailId,
                  toWordDetailsId: relData.toWordDetailsId,
                  type: relData.type,
                },
              },
            });

          if (!existingRelationship) {
            // Create new relationship
            await tx.wordDetailsRelationship.create({
              data: {
                fromWordDetailsId: wordDetailId,
                toWordDetailsId: relData.toWordDetailsId,
                type: relData.type,
                description: relData.description,
                orderIndex: relData.orderIndex,
              },
            });
          }
        } else {
          // Update existing relationship
          const [fromId, toId, type] = relData.id.split('-');
          if (fromId && toId && type) {
            await tx.wordDetailsRelationship.update({
              where: {
                fromWordDetailsId_toWordDetailsId_type: {
                  fromWordDetailsId: parseInt(fromId),
                  toWordDetailsId: parseInt(toId),
                  type: type as RelationshipType,
                },
              },
              data: {
                description: relData.description,
                orderIndex: relData.orderIndex,
              },
            });
          }
        }
      }

      // Handle Word relationships (affects all WordDetails)
      const currentWordDetail = await tx.wordDetails.findUnique({
        where: { id: wordDetailId },
        select: { wordId: true },
      });

      if (currentWordDetail) {
        for (const relData of wordRelationships) {
          if (relData._toDelete && relData.id) {
            // Parse composite key and delete relationship
            const [fromId, toId, type] = relData.id.split('-');
            if (fromId && toId && type) {
              await tx.wordToWordRelationship.delete({
                where: {
                  fromWordId_toWordId_type: {
                    fromWordId: parseInt(fromId),
                    toWordId: parseInt(toId),
                    type: type as RelationshipType,
                  },
                },
              });
            }
          } else if (!relData.id) {
            // Check if relationship already exists to avoid duplicates
            const existingWordRelationship =
              await tx.wordToWordRelationship.findUnique({
                where: {
                  fromWordId_toWordId_type: {
                    fromWordId: currentWordDetail.wordId,
                    toWordId: relData.toWordId,
                    type: relData.type,
                  },
                },
              });

            if (!existingWordRelationship) {
              // Create new relationship
              await tx.wordToWordRelationship.create({
                data: {
                  fromWordId: currentWordDetail.wordId,
                  toWordId: relData.toWordId,
                  type: relData.type,
                  description: relData.description,
                  orderIndex: relData.orderIndex,
                },
              });
            }
          } else {
            // Update existing relationship
            const [fromId, toId, type] = relData.id.split('-');
            if (fromId && toId && type) {
              await tx.wordToWordRelationship.update({
                where: {
                  fromWordId_toWordId_type: {
                    fromWordId: parseInt(fromId),
                    toWordId: parseInt(toId),
                    type: type as RelationshipType,
                  },
                },
                data: {
                  description: relData.description,
                  orderIndex: relData.orderIndex,
                },
              });
            }
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    await serverLog('Error updating relationships', 'error', error);
    return { success: false, error: 'Failed to update relationships' };
  }
}
