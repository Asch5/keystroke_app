'use server';

import { prisma } from '@/core/lib/prisma';
import {
  LanguageCode,
  Prisma,
  DifficultyLevel,
  PartOfSpeech,
  SourceType,
  Gender,
} from '@prisma/client';

// Add type definition for image data
// interface ImageData {
//   id: number;
//   url: string;
//   description: string | null;
// }

// Definition for translation data used in multiple places
// interface TranslationData {
//   id: number;
//   languageCode: LanguageCode;
//   content: string;
// }

// Definition for example data used in multiple places
// interface ExampleData {
//   id: number;
//   text: string;
//   grammaticalNote?: string | null;
//   audio: string | null;
//   translations?: TranslationData[];
// }

type WordWithAudioAndDefinitions = Prisma.WordGetPayload<{
  include: {
    details: {
      include: {
        definitions: {
          include: {
            definition: {
              include: {
                examples: true;
              };
            };
          };
        };
        audioLinks: {
          include: {
            audio: true;
          };
        };
      };
    };
  };
}>;

// Update the Word type to match the schema
interface DictionaryWord {
  id: string;
  text: string;
  translation: string;
  languageId: LanguageCode;
  category: string;
  difficulty: DifficultyLevel;
  audioUrl: string;
  exampleSentence: string;
}

// New interface for WordDetails items
export interface DictionaryWordDetails {
  id: number;
  wordText: string;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  frequencyGeneral: number | null;
  frequency: number | null;
  source: SourceType;
  definition: string;
  definitionFull: string;
  definitionId: number | null; // Added for list creation
  audioUrl: string | null;
  hasImage: boolean;
  imageUrl: string | null;
  wordId: number;
  gender: Gender | null;
  forms: string | null;
}

/**
 * Server action to fetch dictionary words
 * This provides a secure way to access the database from the client
 */
export async function fetchDictionaryWords(
  targetLanguageId: string,
): Promise<DictionaryWord[]> {
  try {
    const entries = await prisma.word.findMany({
      where: {
        languageCode: targetLanguageId as LanguageCode,
      },
      include: {
        details: {
          include: {
            definitions: {
              include: {
                definition: {
                  include: {
                    examples: true,
                  },
                },
              },
            },
            audioLinks: {
              where: {
                isPrimary: true,
              },
              take: 1,
              include: {
                audio: true,
              },
            },
          },
        },
      },
    });

    // Transform entries to match Word type
    const wordsWithFrequency = await Promise.all(
      (entries as WordWithAudioAndDefinitions[]).map(async (entry) => {
        // Get the primary WordDetails for this word
        const primaryDetails = entry.details[0];

        // Get the primary definition
        const primaryDefinition = primaryDetails?.definitions[0]?.definition;

        // Get the primary audio
        const primaryAudio = primaryDetails?.audioLinks[0]?.audio;

        return {
          id: String(entry.id),
          text: entry.word,
          translation: primaryDefinition?.definition || '',
          languageId: entry.languageCode,
          category: primaryDefinition?.source || '',
          difficulty: DifficultyLevel.intermediate,
          audioUrl: primaryAudio?.url || '',
          exampleSentence: primaryDefinition?.examples[0]?.example || '',
        };
      }),
    );

    return wordsWithFrequency;
  } catch (error) {
    console.error('Error fetching dictionary words:', error);
    throw new Error('Failed to fetch dictionary words');
  }
}

/**
 * New server action to fetch WordDetails items with comprehensive information
 */
export async function fetchDictionaryWordDetails(
  targetLanguageId: string,
): Promise<DictionaryWordDetails[]> {
  try {
    const wordDetails = await prisma.wordDetails.findMany({
      where: {
        word: {
          languageCode: targetLanguageId as LanguageCode,
        },
      },
      include: {
        word: true,
        definitions: {
          include: {
            definition: {
              include: {
                image: true,
              },
            },
          },
          take: 1, // Get first definition
        },
        audioLinks: {
          where: {
            isPrimary: true,
          },
          include: {
            audio: true,
          },
          take: 1, // Get first audio
        },
      },
      orderBy: [
        { word: { word: 'asc' } },
        { partOfSpeech: 'asc' },
        { variant: 'asc' },
      ],
    });

    // Transform entries to match WordDetails type
    const transformedWordDetails: DictionaryWordDetails[] = wordDetails.map(
      (details) => {
        const firstDefinition = details.definitions[0]?.definition;
        const firstAudio = details.audioLinks[0]?.audio;
        const hasImage = !!firstDefinition?.image;

        // Truncate definition to 3 words for display
        const definitionText = firstDefinition?.definition || '';
        const definitionWords = definitionText.split(' ');
        const truncatedDefinition =
          definitionWords.length > 3
            ? definitionWords.slice(0, 3).join(' ') + '...'
            : definitionText;

        return {
          id: details.id,
          wordText: details.word.word,
          partOfSpeech: details.partOfSpeech,
          variant: details.variant,
          frequencyGeneral: details.word.frequencyGeneral,
          frequency: details.frequency,
          source: details.source,
          definition: truncatedDefinition,
          definitionFull: definitionText,
          definitionId: firstDefinition?.id || null, // Added for list creation
          audioUrl: firstAudio?.url || null,
          hasImage,
          imageUrl: firstDefinition?.image?.url || null,
          wordId: details.wordId,
          gender: details.gender,
          forms: details.forms,
        };
      },
    );

    return transformedWordDetails;
  } catch (error) {
    console.error('Error fetching dictionary word details:', error);
    throw new Error('Failed to fetch dictionary word details');
  }
}

/**
 * Server action to add a word to user's dictionary
 */
export async function addWordToUserDictionary(
  userId: string,
  mainDictionaryId: string,
  baseLanguageId: string,
  targetLanguageId: string,
) {
  try {
    const userDictionary = await prisma.userDictionary.upsert({
      where: {
        userId_definitionId: {
          userId,
          definitionId: parseInt(mainDictionaryId),
        },
      },
      update: {},
      create: {
        userId,
        definitionId: parseInt(mainDictionaryId),
        baseLanguageCode: baseLanguageId as LanguageCode,
        targetLanguageCode: targetLanguageId as LanguageCode,
        learningStatus: 'notStarted',
        progress: 0,
        isModified: false,
        reviewCount: 0,
        timeWordWasStartedToLearn: new Date(),
        jsonbData: {},
        customDifficultyLevel: null,
      },
    });

    return userDictionary;
  } catch (error) {
    console.error('Error adding word to user dictionary:', error);
    throw new Error('Failed to add word to user dictionary');
  }
}

/**
 * Checks if a word exists in the database by comparing sourceEntityId with UUID from Merriam-Webster
 * @param uuid The UUID from the Merriam-Webster API response
 * @returns The word record if found, null otherwise
 */
export async function checkWordExistsByUuid(
  id: string,
  uuid: string,
): Promise<Prisma.WordGetPayload<{ select: object }> | null> {
  try {
    // Create the sourceEntityId format as it appears in the database
    const sourceEntityIdLearners = `merriam_learners-${id}-${uuid}`;
    const sourceEntityIdIntermediate = `merriam_intermediate-${id}-${uuid}`;

    // Look for a word with this sourceEntityId
    const existingWord = await prisma.word.findFirst({
      where: {
        sourceEntityId: {
          in: [sourceEntityIdLearners, sourceEntityIdIntermediate],
        },
      },
      select: {
        id: true,
        word: true,
        phoneticGeneral: true,
        frequencyGeneral: true,
        languageCode: true,
        isHighlighted: true,
        additionalInfo: true,
        sourceEntityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return existingWord;
  } catch (error) {
    console.error('Error checking word existence by UUID:', error);
    throw new Error('Failed to check word existence by UUID');
  }
}

/**
 * Fetch a word by its ID
 * @param wordId ID of the word to fetch
 * @returns The word record or null if not found
 */
export async function fetchWordById(wordId: string) {
  try {
    const id = parseInt(wordId);
    if (isNaN(id)) {
      throw new Error('Invalid word ID');
    }

    const word = await prisma.word.findUnique({
      where: { id },
      select: { word: true, languageCode: true },
    });

    return word;
  } catch (error) {
    console.error('Error fetching word by ID:', error);
    throw new Error(
      `Failed to fetch word: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Delete word details by their IDs with comprehensive cleanup
 * This function handles the deletion of word details and all related data
 * @param wordDetailIds Array of word detail IDs to delete
 * @returns Promise with deletion results
 */
export async function deleteWordDetails(
  wordDetailIds: number[],
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      for (const wordDetailId of wordDetailIds) {
        try {
          // First, collect information about related files before deletion
          const wordDetailWithFiles = await tx.wordDetails.findUnique({
            where: { id: wordDetailId },
            include: {
              word: true,
              definitions: {
                include: {
                  definition: {
                    include: {
                      image: true,
                      audioLinks: {
                        include: {
                          audio: true,
                        },
                      },
                      examples: {
                        include: {
                          audioLinks: {
                            include: {
                              audio: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              audioLinks: {
                include: {
                  audio: true,
                },
              },
            },
          });

          if (!wordDetailWithFiles) {
            errors.push(`Word detail with ID ${wordDetailId} not found`);
            continue;
          }

          // Collect all audio URLs that will be orphaned
          const audioUrls = new Set<string>();

          // Audio from word details
          wordDetailWithFiles.audioLinks.forEach((link) => {
            if (link.audio.url) audioUrls.add(link.audio.url);
          });

          // Audio from definitions and examples
          wordDetailWithFiles.definitions.forEach((wordDef) => {
            const def = wordDef.definition;
            def.audioLinks.forEach((link) => {
              if (link.audio.url) audioUrls.add(link.audio.url);
            });
            def.examples.forEach((example) => {
              example.audioLinks.forEach((link) => {
                if (link.audio.url) audioUrls.add(link.audio.url);
              });
            });
          });

          // Collect image URLs
          const imageUrls = new Set<string>();
          wordDetailWithFiles.definitions.forEach((wordDef) => {
            if (wordDef.definition.image?.url) {
              imageUrls.add(wordDef.definition.image.url);
            }
          });

          // Delete the word detail (cascading deletes will handle most relations)
          await tx.wordDetails.delete({
            where: { id: wordDetailId },
          });

          // After deletion, clean up orphaned audio and image records
          // Check for orphaned audio files
          for (const audioUrl of audioUrls) {
            const audioUsageCount = await tx.audio.count({
              where: { url: audioUrl },
            });

            if (audioUsageCount === 0) {
              // Audio is orphaned, can be cleaned up
              // Note: Actual file deletion would happen here in a real implementation
              console.log(`Audio file can be cleaned up: ${audioUrl}`);
            }
          }

          // Check for orphaned images
          for (const imageUrl of imageUrls) {
            const imageUsageCount = await tx.image.count({
              where: { url: imageUrl },
            });

            if (imageUsageCount === 0) {
              // Image is orphaned, can be cleaned up
              // Note: Actual file deletion would happen here in a real implementation
              console.log(`Image file can be cleaned up: ${imageUrl}`);
            }
          }

          // Check if the parent word has any remaining word details
          const remainingWordDetails = await tx.wordDetails.count({
            where: { wordId: wordDetailWithFiles.wordId },
          });

          // If no word details remain, delete the parent word
          if (remainingWordDetails === 0) {
            await tx.word.delete({
              where: { id: wordDetailWithFiles.wordId },
            });
          }

          deletedCount++;
        } catch (error) {
          console.error(`Error deleting word detail ${wordDetailId}:`, error);
          errors.push(
            `Failed to delete word detail ${wordDetailId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    });

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  } catch (error) {
    console.error('Error in deleteWordDetails transaction:', error);
    return {
      success: false,
      deletedCount,
      errors: [
        ...errors,
        `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Delete words by their IDs with comprehensive cleanup
 * This function handles the deletion of entire words and all related data
 * @param wordIds Array of word IDs to delete
 * @returns Promise with deletion results
 */
export async function deleteWords(
  wordIds: number[],
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      for (const wordId of wordIds) {
        try {
          // First, collect information about related files before deletion
          const wordWithFiles = await tx.word.findUnique({
            where: { id: wordId },
            include: {
              details: {
                include: {
                  definitions: {
                    include: {
                      definition: {
                        include: {
                          image: true,
                          audioLinks: {
                            include: {
                              audio: true,
                            },
                          },
                          examples: {
                            include: {
                              audioLinks: {
                                include: {
                                  audio: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  audioLinks: {
                    include: {
                      audio: true,
                    },
                  },
                },
              },
            },
          });

          if (!wordWithFiles) {
            errors.push(`Word with ID ${wordId} not found`);
            continue;
          }

          // Collect all audio URLs that will be orphaned
          const audioUrls = new Set<string>();

          // Audio from word details
          wordWithFiles.details.forEach((detail) => {
            detail.audioLinks.forEach((link) => {
              if (link.audio.url) audioUrls.add(link.audio.url);
            });

            // Audio from definitions and examples
            detail.definitions.forEach((wordDef) => {
              const def = wordDef.definition;
              def.audioLinks.forEach((link) => {
                if (link.audio.url) audioUrls.add(link.audio.url);
              });
              def.examples.forEach((example) => {
                example.audioLinks.forEach((link) => {
                  if (link.audio.url) audioUrls.add(link.audio.url);
                });
              });
            });
          });

          // Collect image URLs
          const imageUrls = new Set<string>();
          wordWithFiles.details.forEach((detail) => {
            detail.definitions.forEach((wordDef) => {
              if (wordDef.definition.image?.url) {
                imageUrls.add(wordDef.definition.image.url);
              }
            });
          });

          // Delete the word (cascading deletes will handle most relations)
          await tx.word.delete({
            where: { id: wordId },
          });

          // After deletion, clean up orphaned audio and image records
          // Check for orphaned audio files
          for (const audioUrl of audioUrls) {
            const audioUsageCount = await tx.audio.count({
              where: { url: audioUrl },
            });

            if (audioUsageCount === 0) {
              // Audio is orphaned, can be cleaned up
              // Note: Actual file deletion would happen here in a real implementation
              console.log(`Audio file can be cleaned up: ${audioUrl}`);
            }
          }

          // Check for orphaned images
          for (const imageUrl of imageUrls) {
            const imageUsageCount = await tx.image.count({
              where: { url: imageUrl },
            });

            if (imageUsageCount === 0) {
              // Image is orphaned, can be cleaned up
              // Note: Actual file deletion would happen here in a real implementation
              console.log(`Image file can be cleaned up: ${imageUrl}`);
            }
          }

          deletedCount++;
        } catch (error) {
          console.error(`Error deleting word ${wordId}:`, error);
          errors.push(
            `Failed to delete word ${wordId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    });

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  } catch (error) {
    console.error('Error in deleteWords transaction:', error);
    return {
      success: false,
      deletedCount,
      errors: [
        ...errors,
        `Transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Server action to delete selected word details from dictionary
 * @param wordDetailIds Array of word detail IDs to delete
 * @returns Deletion result with success status and details
 */
export async function deleteSelectedWords(
  wordDetailIds: string[],
): Promise<{ success: boolean; message: string; deletedCount: number }> {
  try {
    // Validate input
    if (!wordDetailIds || wordDetailIds.length === 0) {
      return {
        success: false,
        message: 'No words selected for deletion',
        deletedCount: 0,
      };
    }

    // Convert string IDs to numbers
    const numericIds: number[] = [];
    const invalidIds: string[] = [];

    wordDetailIds.forEach((id) => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) {
        invalidIds.push(id);
      } else {
        numericIds.push(numId);
      }
    });

    if (invalidIds.length > 0) {
      return {
        success: false,
        message: `Invalid word detail IDs: ${invalidIds.join(', ')}`,
        deletedCount: 0,
      };
    }

    // Perform deletion
    const result = await deleteWordDetails(numericIds);

    if (result.success) {
      return {
        success: true,
        message: `Successfully deleted ${result.deletedCount} word${result.deletedCount !== 1 ? 's' : ''}`,
        deletedCount: result.deletedCount,
      };
    } else {
      return {
        success: false,
        message: `Deletion partially failed. Deleted: ${result.deletedCount}, Errors: ${result.errors.join('; ')}`,
        deletedCount: result.deletedCount,
      };
    }
  } catch (error) {
    console.error('Error in deleteSelectedWords:', error);
    return {
      success: false,
      message: `Failed to delete words: ${error instanceof Error ? error.message : String(error)}`,
      deletedCount: 0,
    };
  }
}
