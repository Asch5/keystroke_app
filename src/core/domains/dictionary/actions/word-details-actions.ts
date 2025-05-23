'use server';

import { prisma } from '@/core/lib/prisma';
import {
  LanguageCode,
  Prisma,
  PartOfSpeech,
  SourceType,
  RelationshipType,
} from '@prisma/client';
import {
  getFrequencyPartOfSpeechEnum,
  FrequencyPartOfSpeech,
} from '@/core/lib/utils/commonDictUtils/frequencyUtils';
import { WordUpdateData, UpdateWordResult } from '@/core/types/dictionary';

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
    mistakeData: Prisma.JsonValue;
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
                audio: (ex.audioLinks && ex.audioLinks[0]?.audio.url) || null,
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
        mistakeData: mistake.mistakeData as Prisma.JsonValue,
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
    console.error('Error fetching word details:', error);
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
        console.log('Related words handling not fully implemented yet');
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
    console.error('Error updating word details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
