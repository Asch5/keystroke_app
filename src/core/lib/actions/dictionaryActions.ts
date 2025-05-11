'use server';

import { prisma } from '@/core/lib/prisma';
import { Word } from '@/core/types/word';
import {
  LanguageCode,
  Prisma,
  PartOfSpeech,
  SourceType,
  RelationshipType,
} from '@prisma/client';
import { JsonValue } from 'type-fest';
import {
  getWordFrequencyEnum,
  getFrequencyPartOfSpeechEnum,
  mapDifficultyLevelFromOrderIndex,
  WordFrequency,
  FrequencyPartOfSpeech,
} from '@/core/lib/utils/frequencyUtils';
import {
  WordUpdateData,
  UpdateWordResult,
  DefinitionUpdateData,
  ExampleUpdateData,
  AudioUpdateData,
} from '@/core/types/dictionary';
//import { ImageService } from '@/lib/services/imageService';
import { LogLevel } from '@/core/lib/utils/logUtils';
import { serverLog } from '@/core/lib/utils/logUtils';

// Add type definition for image data
interface ImageData {
  id: number;
  url: string;
  description: string | null;
}

type WordWithAudioAndDefinitions = Prisma.WordGetPayload<{
  include: {
    wordDefinitions: {
      include: {
        definition: {
          include: {
            examples: true;
          };
        };
      };
    };
  };
}>;

type WordWithFullRelations = Prisma.WordGetPayload<{
  include: {
    relatedFrom: {
      include: {
        toWord: true;
      };
    };
    relatedTo: {
      include: {
        fromWord: true;
      };
    };
    wordDefinitions: {
      include: {
        definition: {
          include: {
            image: true;
            examples: true;
          };
        };
      };
    };
    mistakes: true;
  };
}>;

// Define an interface for examples with audio
interface ExampleWithAudio {
  id: number;
  example: string;
  grammaticalNote: string | null;
  audio?: Array<{
    audio: {
      url: string;
    };
  }>;
}

/**
 * Server action to fetch dictionary words
 * This provides a secure way to access the database from the client
 */
export async function fetchDictionaryWords(
  targetLanguageId: string,
): Promise<Word[]> {
  try {
    const entries = await prisma.word.findMany({
      where: {
        languageCode: targetLanguageId as LanguageCode,
      },
      include: {
        wordDefinitions: {
          include: {
            definition: {
              include: {
                examples: true,
              },
            },
          },
        },
      },
    });

    // Transform entries to match Word type and get their frequencies
    const wordsWithFrequency = await Promise.all(
      (entries as WordWithAudioAndDefinitions[]).map(async (entry) => {
        // Get word frequency data
        const frequencyData = await prisma.wordFrequencyData.findFirst({
          where: {
            wordId: entry.id,
            partOfSpeech: PartOfSpeech.undefined,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        });

        // Map the frequency to a difficulty level
        const difficultyLevel = frequencyData
          ? mapDifficultyLevelFromOrderIndex(frequencyData.orderIndex)
          : 'medium';

        return {
          id: String(entry.id),
          text: entry.word || '',
          translation: entry.wordDefinitions?.[0]?.definition?.definition || '',
          languageId: entry.languageCode,
          category: entry.wordDefinitions?.[0]?.definition?.partOfSpeech || '',
          difficulty: difficultyLevel,
          audioUrl: '', // Adapt based on your actual schema
          exampleSentence:
            entry.wordDefinitions?.[0]?.definition?.examples?.[0]?.example ||
            '',
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
 * Comprehensive type that includes all word-related information
 * for the Word Checker component
 */
export type WordDetails = {
  word: {
    id: number;
    text: string;
    phonetic: string | null;
    audio: string | null;
    audioFiles: Array<{
      id: number;
      url: string;
      isPrimary: boolean;
    }>;
    etymology: string | null;
    isPlural: boolean;
    pluralForm: string | null;
    pastTenseForm: string | null;
    pastParticipleForm: string | null;
    presentParticipleForm: string | null;
    thirdPersonForm: string | null;
    wordFrequency: WordFrequency;
    languageCode: LanguageCode;
    createdAt: Date;
    additionalInfo: Record<string, unknown>;
  };
  relatedWords: {
    [RelationshipType.synonym]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.antonym]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.related]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.composition]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.plural_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.phrasal_verb]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.past_tense_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.past_participle_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.present_participle_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.third_person_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.alternative_spelling]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.variant_form_phrasal_verb_en]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
    [RelationshipType.phrase]: Array<{
      id: number;
      word: string;
      phonetic?: string | null;
      audio?: string | null;
    }>;
  };
  definitions: Array<{
    id: number;
    text: string;
    partOfSpeech: PartOfSpeech;
    image: ImageData | null;
    frequencyPartOfSpeech: FrequencyPartOfSpeech;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
    isPlural: boolean;
    generalLabels: string | null;
    grammaticalNote: string | null;
    usageNote: string | null;
    isInShortDef: boolean;
    examples: Array<{
      id: number;
      text: string;
      grammaticalNote?: string | null;
      audio: string | null;
    }>;
  }>;
  phrases: Array<{
    id: number;
    text: string;
    definition: string;
    subjectStatusLabels: string | null;
    partOfSpeech: PartOfSpeech;
    grammaticalNote: string | null;
    generalLabels: string | null;
    examples: Array<{
      id: number;
      text: string;
      grammaticalNote?: string | null;
      audio: string | null;
    }>;
    audio: string | null;
  }>;
  mistakes: Array<{
    id: string;
    type: string;
    context: string | null;
    mistakeData: JsonValue;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    wordId: number;
  }>;
};

/**
 * Retrieves comprehensive information about a word for the Word Checker component
 * @param wordText The exact text of the word to look up
 * @param languageCode The language code of the word (default: 'en')
 * @returns Complete word details including related words, definitions, and phrases
 */
export async function getWordDetails(
  wordText: string,
  languageCode: LanguageCode = LanguageCode.en,
): Promise<WordDetails | null> {
  try {
    // Clean the word text by removing any trailing asterisks
    const cleanWordText = wordText.replace(/\*$/, '');

    // Find the base word with all its relations
    const word = (await prisma.word.findUnique({
      where: {
        word_languageCode: {
          word: cleanWordText,
          languageCode,
        },
      },
      include: {
        // Include all relationships (both directions)
        relatedFrom: {
          include: {
            toWord: {
              include: {
                // Include definitions for related words
                wordDefinitions: {
                  include: {
                    definition: {
                      include: {
                        image: {
                          select: {
                            id: true,
                            url: true,
                            description: true,
                          },
                        },
                        examples: {
                          include: {
                            audio: {
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
                // Include audio for related words
                audioFiles: {
                  include: {
                    audio: true,
                  },
                },
              },
            },
          },
        },
        relatedTo: {
          include: {
            fromWord: {
              include: {
                // Include definitions for related words
                wordDefinitions: {
                  include: {
                    definition: {
                      include: {
                        image: {
                          select: {
                            id: true,
                            url: true,
                            description: true,
                          },
                        },
                        examples: {
                          include: {
                            audio: {
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
                // Include audio for related words
                audioFiles: {
                  include: {
                    audio: true,
                  },
                },
              },
            },
          },
        },
        // Include all definitions with examples and images
        wordDefinitions: {
          include: {
            definition: {
              include: {
                image: {
                  select: {
                    id: true,
                    url: true,
                    description: true,
                  },
                },
                examples: {
                  include: {
                    // Include audio for examples
                    audio: {
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
        // Include all audio files
        audioFiles: {
          include: {
            audio: true,
          },
        },
        // Include all mistakes related to this word
        mistakes: true,
      },
    })) as WordWithFullRelations | null;

    if (!word) {
      console.log(
        `No word found for: ${cleanWordText} in language: ${languageCode}`,
      );
      return null;
    }

    // Initialize ImageService
    //const imageService = new ImageService();

    // Get word frequency data
    const wordFrequencyData = await prisma.wordFrequencyData.findFirst({
      where: {
        wordId: word.id,
        partOfSpeech: PartOfSpeech.undefined,
        language: languageCode,
      },
    });

    // Map frequency to readable format using WordFrequency enum
    const wordFrequencyEnum = wordFrequencyData
      ? getWordFrequencyEnum(wordFrequencyData.orderIndex)
      : WordFrequency.beyond_10000;

    // Get part of speech frequency data for all definitions
    const posFrequencies = await prisma.wordFrequencyData.findMany({
      where: {
        wordId: word.id,
        language: languageCode,
        partOfSpeech: {
          not: PartOfSpeech.undefined,
        },
      },
    });

    // Initialize related words object with all possible relationship types
    const relatedWords: WordDetails['relatedWords'] = {
      // Add all relationship types from the enum
      ...Object.values(RelationshipType).reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<
          RelationshipType,
          Array<{
            id: number;
            word: string;
            phonetic?: string | null;
            audio?: string | null;
          }>
        >,
      ),
    };

    // Process related words from the word (outgoing relationships)
    for (const relation of word.relatedFrom) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        // Find primary audio for this related word
        const primaryAudio =
          relation.toWord.audioFiles.find((audio) => audio.isPrimary)?.audio
            .url || null;

        relatedWords[relationType].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
          phonetic: relation.toWord.phonetic,
          audio: primaryAudio,
        });
      } else {
        // If the relationship type is not in our predefined list, add it to 'related'
        const primaryAudio =
          relation.toWord.audioFiles.find((audio) => audio.isPrimary)?.audio
            .url || null;

        relatedWords[RelationshipType.related].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
          phonetic: relation.toWord.phonetic,
          audio: primaryAudio,
        });
      }
    }

    // Process related words to the word (incoming relationships)
    for (const relation of word.relatedTo) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        // Find primary audio for this related word
        const primaryAudio =
          relation.fromWord.audioFiles.find((audio) => audio.isPrimary)?.audio
            .url || null;

        relatedWords[relationType].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
          phonetic: relation.fromWord.phonetic,
          audio: primaryAudio,
        });
      } else {
        // If the relationship type is not in our predefined list, add it to 'related'
        const primaryAudio =
          relation.fromWord.audioFiles.find((audio) => audio.isPrimary)?.audio
            .url || null;

        relatedWords[RelationshipType.related].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
          phonetic: relation.fromWord.phonetic,
          audio: primaryAudio,
        });
      }
    }

    // Process definitions with all their details
    const definitions = await Promise.all(
      word.wordDefinitions.map(async (wd) => {
        const def = wd.definition;

        // If no image exists for the definition, try to get one
        const imageData = def.image;
        serverLog(
          `From dictionaryActions.ts: Image exists for definition ${def.id} of word "${cleanWordText}": ${JSON.stringify(
            imageData,
          )}`,
          LogLevel.INFO,
        );
        // if (!imageData) {
        //   serverLog(
        //     `Process in dictionaryActions.ts: No image found for definition ${def.id} of word "${cleanWordText}", fetching now...`,
        //     LogLevel.INFO,
        //   );

        //   try {
        //     const image = await imageService.getOrCreateDefinitionImage(
        //       cleanWordText,
        //       def.id,
        //     );

        //     if (image) {
        //       imageData = {
        //         id: image.id,
        //         url: image.url,
        //         description: image.description || null, // Ensure null instead of undefined
        //       };

        //       // Update the definition with the new image
        //       await prisma.definition.update({
        //         where: { id: def.id },
        //         data: { imageId: image.id },
        //       });

        //       console.log(
        //         `Updated definition ${def.id} with imageId ${image.id}`,
        //       );
        //     }
        //   } catch (error) {
        //     console.error(
        //       `Error getting image for definition ${def.id}:`,
        //       error,
        //     );
        //   }
        // } else {
        //   console.log(
        //     `Image already exists for definition ${def.id}: ${imageData.id}`,
        //   );
        // }

        // Find frequency data for this part of speech
        const posFrequency = posFrequencies.find(
          (f) => f.partOfSpeech === def.partOfSpeech,
        );

        const posFrequencyEnum = posFrequency
          ? getFrequencyPartOfSpeechEnum(posFrequency.orderIndex)
          : FrequencyPartOfSpeech.beyond_1000;

        return {
          id: def.id,
          text: def.definition,
          partOfSpeech: def.partOfSpeech,
          image: imageData,
          frequencyPartOfSpeech: posFrequencyEnum,
          languageCode: def.languageCode,
          source: def.source,
          subjectStatusLabels: def.subjectStatusLabels,
          isPlural: def.isPlural,
          generalLabels: def.generalLabels,
          grammaticalNote: def.grammaticalNote,
          usageNote: def.usageNote,
          isInShortDef: def.isInShortDef,
          examples: def.examples.map((ex) => {
            // Cast to our interface to handle audio
            const exampleWithAudio = ex as unknown as ExampleWithAudio;
            // Find audio URL for this example if available
            const audioUrl =
              exampleWithAudio.audio && exampleWithAudio.audio.length > 0
                ? exampleWithAudio.audio[0]?.audio?.url
                : null;

            return {
              id: ex.id,
              text: ex.example,
              grammaticalNote: ex.grammaticalNote,
              audio: audioUrl || null, // Ensure null rather than undefined
            };
          }),
        };
      }),
    );

    // Get phrases (words with phrase relationship)
    const phrases: WordDetails['phrases'] = [];

    // Extract phrase relations
    const phraseRelations = word.relatedFrom.filter(
      (rel) => rel.type === RelationshipType.phrase,
    );

    // Get phrasal verb relations too
    const phrasalVerbRelations = word.relatedFrom.filter(
      (rel) => rel.type === RelationshipType.phrasal_verb,
    );

    // Process all phrase relations
    const allPhraseRelations = [...phraseRelations, ...phrasalVerbRelations];

    // For each phrase relation, get the word and its primary definition
    for (const phraseRel of allPhraseRelations) {
      const phraseWord = phraseRel.toWord;

      // Find phrase definition (typically with partOfSpeech === 'phrase' or 'phrasal_verb')
      const phraseDef = phraseWord.wordDefinitions.find(
        (wd) =>
          wd.definition.partOfSpeech === PartOfSpeech.phrase ||
          wd.definition.partOfSpeech === PartOfSpeech.phrasal_verb,
      )?.definition;

      if (phraseDef) {
        // Find audio for the phrase
        const phraseAudio =
          phraseWord.audioFiles.find((a) => a.isPrimary)?.audio.url || null;

        phrases.push({
          id: phraseWord.id,
          text: phraseWord.word,
          definition: phraseDef.definition,
          subjectStatusLabels: phraseDef.subjectStatusLabels,
          partOfSpeech: phraseDef.partOfSpeech,
          grammaticalNote: phraseDef.grammaticalNote,
          generalLabels: phraseDef.generalLabels,
          examples: phraseDef.examples.map((ex) => {
            // Cast to our interface to handle audio
            const exampleWithAudio = ex as unknown as ExampleWithAudio;
            // Find audio URL for this example if available
            const audioUrl =
              exampleWithAudio.audio && exampleWithAudio.audio.length > 0
                ? exampleWithAudio.audio[0]?.audio?.url
                : null;

            return {
              id: ex.id,
              text: ex.example,
              grammaticalNote: ex.grammaticalNote,
              audio: audioUrl || null, // Ensure null rather than undefined
            };
          }),
          audio: phraseAudio,
        });
      }
    }

    // Find plural form (from related words)
    const pluralRelation = word.relatedFrom.find(
      (rel) => rel.type === RelationshipType.plural_en,
    );
    const pluralForm = pluralRelation ? pluralRelation.toWord.word : null;

    // Find verb forms
    const pastTenseForm =
      word.relatedFrom.find(
        (rel) => rel.type === RelationshipType.past_tense_en,
      )?.toWord.word || null;

    const pastParticipleForm =
      word.relatedFrom.find(
        (rel) => rel.type === RelationshipType.past_participle_en,
      )?.toWord.word || null;

    const presentParticipleForm =
      word.relatedFrom.find(
        (rel) => rel.type === RelationshipType.present_participle_en,
      )?.toWord.word || null;

    const thirdPersonForm =
      word.relatedFrom.find(
        (rel) => rel.type === RelationshipType.third_person_en,
      )?.toWord.word || null;

    // Find all audio files
    const audioFiles = word.audioFiles.map((af) => ({
      id: af.audioId,
      url: af.audio.url,
      isPrimary: af.isPrimary,
    }));

    // Find primary audio
    const primaryAudio = audioFiles.find((af) => af.isPrimary)?.url || null;

    // Find learning mistakes
    const mistakes = word.mistakes
      ? word.mistakes.map((mistake) => ({
          id: mistake.id,
          type: mistake.type,
          context: mistake.context,
          mistakeData: mistake.mistakeData as JsonValue,
          createdAt: mistake.createdAt,
          updatedAt: mistake.updatedAt,
          userId: mistake.userId,
          wordId: mistake.wordId,
        }))
      : [];

    // Construct the full word details
    const wordDetails: WordDetails = {
      word: {
        id: word.id,
        text: word.word,
        phonetic: word.phonetic,
        audio: primaryAudio,
        audioFiles,
        etymology: word.etymology,
        isPlural: !!pluralForm,
        pluralForm,
        pastTenseForm,
        pastParticipleForm,
        presentParticipleForm,
        thirdPersonForm,
        wordFrequency: wordFrequencyEnum,
        languageCode: word.languageCode,
        createdAt: word.createdAt,
        additionalInfo: (word.additionalInfo as Record<string, unknown>) || {},
      },
      relatedWords,
      definitions,
      phrases,
      mistakes,
    };

    return wordDetails;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw new Error(
      `Failed to fetch word details: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Determines the WordFrequency enum value based on the word's position in the frequency list
 * This is an async wrapper for the utility function to meet Server Action requirements
 * @param wordPosition The position of the word in the frequency list (1-based index)
 * @returns The appropriate WordFrequency enum value
 */
export async function mapWordFrequency(
  wordPosition: number,
): Promise<WordFrequency> {
  return getWordFrequencyEnum(wordPosition);
}

/**
 * Determines the FrequencyPartOfSpeech enum value based on the part of speech position
 * This is an async wrapper for the utility function to meet Server Action requirements
 * @param positionInPartOfSpeech The position of the word among words with the same part of speech
 * @returns The appropriate FrequencyPartOfSpeech enum value
 */
export async function mapFrequencyPartOfSpeech(
  positionInPartOfSpeech: number,
): Promise<FrequencyPartOfSpeech> {
  return getFrequencyPartOfSpeechEnum(positionInPartOfSpeech);
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
      select: { word: true },
    });

    return word;
  } catch (error) {
    console.error('Error fetching word by ID:', error);
    throw new Error(
      `Failed to fetch word: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

//*

//! BLOCK UPDATE DATA

//*

export async function updateWordDetails(
  wordId: string,
  data: WordUpdateData,
): Promise<UpdateWordResult> {
  try {
    const id = parseInt(wordId);
    if (isNaN(id)) {
      throw new Error('Invalid word ID');
    }

    // Start a transaction to ensure all updates succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // 1. Update basic word information
      const updatedWord = await tx.word.update({
        where: { id },
        data: {
          word: data.word,
          phonetic: data.phonetic ?? null,
          etymology: data.etymology ?? null,
          updatedAt: new Date(),
        },
      });

      // 2. Update definitions if provided
      if (data.definitions && data.definitions.length > 0) {
        for (const defData of data.definitions) {
          if (defData.id) {
            // Update existing definition
            await tx.definition.update({
              where: { id: defData.id },
              data: {
                definition: defData.definition,
                partOfSpeech: defData.partOfSpeech,
                imageId: defData.imageId,
                isPlural: defData.isPlural,
                source: defData.source,
                languageCode: defData.languageCode,
                subjectStatusLabels: defData.subjectStatusLabels,
                generalLabels: defData.generalLabels,
                grammaticalNote: defData.grammaticalNote,
                usageNote: defData.usageNote,
                isInShortDef: defData.isInShortDef,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new definition and link to word
            const newDef = await tx.definition.create({
              data: {
                definition: defData.definition,
                partOfSpeech: defData.partOfSpeech,
                imageId: defData.imageId,
                source: defData.source,
                languageCode: defData.languageCode,
                subjectStatusLabels: defData.subjectStatusLabels,
                generalLabels: defData.generalLabels,
                grammaticalNote: defData.grammaticalNote,
                usageNote: defData.usageNote,
                isInShortDef: defData.isInShortDef,
              },
            });

            // Link the new definition to the word
            await tx.wordDefinition.create({
              data: {
                wordId: id,
                definitionId: newDef.id,
                isPrimary: false, // Set as needed
              },
            });
          }
        }
      }

      // 3. Update examples if provided
      if (data.examples) {
        for (const [definitionId, examples] of Object.entries(data.examples)) {
          const defId = parseInt(definitionId);

          for (const example of examples as Array<{
            id: number;
            example: string;
            grammaticalNote: string | null;
          }>) {
            if (example.id) {
              // Update existing example
              await tx.definitionExample.update({
                where: { id: example.id },
                data: {
                  example: example.example,
                  grammaticalNote: example.grammaticalNote,
                  updatedAt: new Date(),
                },
              });
            } else {
              // Create new example
              await tx.definitionExample.create({
                data: {
                  example: example.example,
                  grammaticalNote: example.grammaticalNote,
                  definitionId: defId,
                  languageCode:
                    (
                      await tx.definition.findUnique({
                        where: { id: defId },
                        select: { languageCode: true },
                      })
                    )?.languageCode || 'en',
                },
              });
            }
          }
        }
      }

      // 4. Update audio files if provided
      if (data.audioFiles && data.audioFiles.length > 0) {
        for (const audioData of data.audioFiles) {
          if (audioData.id) {
            // Update existing audio
            await tx.audio.update({
              where: { id: audioData.id },
              data: {
                url: audioData.url,
                source: audioData.source,
                languageCode: audioData.languageCode,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new audio and link to word
            const newAudio = await tx.audio.create({
              data: {
                url: audioData.url,
                source: audioData.source,
                languageCode: audioData.languageCode,
                entityType: EntityType.word,
                entityId: id,
                isPrimary: audioData.isPrimary,
              },
            });
          }
        }
      }

      // 5. Handle related words if provided
      if (data.relatedWords) {
        for (const [relationTypeStr, words] of Object.entries(
          data.relatedWords,
        )) {
          const relationType = relationTypeStr as RelationshipType;

          for (const relatedWord of words as Array<{
            id: number;
            word: string;
            phonetic: string | null;
          }>) {
            // Check if the related word exists by text
            let toWordId: number;

            if (relatedWord.id) {
              toWordId = relatedWord.id;
            } else {
              // Try to find or create the related word
              const existingWord = await tx.word.findFirst({
                where: { word: relatedWord.word },
              });

              if (existingWord) {
                toWordId = existingWord.id;
              } else {
                // Create new word if it doesn't exist
                const newWord = await tx.word.create({
                  data: {
                    word: relatedWord.word,
                    phonetic: relatedWord.phonetic ?? null,
                    languageCode: updatedWord.languageCode,
                  },
                });
                toWordId = newWord.id;
              }
            }

            // Create relationship if it doesn't exist
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: id,
                  toWordId: toWordId,
                  type: relationType,
                },
              },
              update: {}, // No updates needed
              create: {
                fromWordId: id,
                toWordId: toWordId,
                type: relationType,
              },
            });
          }
        }
      }

      return {
        success: true,
        data: {
          id: updatedWord.id,
          word: updatedWord.word,
          phonetic: updatedWord.phonetic,
          etymology: updatedWord.etymology,
        },
      };
    });
  } catch (error) {
    console.error('Error updating word details:', error);
    return {
      success: false,
      error: `Failed to update word: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function updateDefinition(
  definitionId: string,
  data: DefinitionUpdateData,
) {
  try {
    const id = parseInt(definitionId);
    if (isNaN(id)) {
      throw new Error('Invalid definition ID');
    }

    const definition = await prisma.definition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!definition) {
      throw new Error('Definition not found');
    }

    const updated = await prisma.definition.update({
      where: { id },
      data: {
        definition: data.definition,
        partOfSpeech: data.partOfSpeech,
        imageId: data.imageId,
        source: data.source,
        languageCode: data.languageCode,
        subjectStatusLabels: data.subjectStatusLabels,
        generalLabels: data.generalLabels,
        grammaticalNote: data.grammaticalNote,
        usageNote: data.usageNote,
        isInShortDef: data.isInShortDef,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating definition:', error);
    throw new Error(
      `Failed to update definition: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function updateExample(
  exampleId: string,
  data: ExampleUpdateData,
) {
  try {
    const id = parseInt(exampleId);
    if (isNaN(id)) {
      throw new Error('Invalid example ID');
    }

    const example = await prisma.definitionExample.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!example) {
      throw new Error('Example not found');
    }

    const updated = await prisma.definitionExample.update({
      where: { id },
      data: {
        example: data.example,
        grammaticalNote: data.grammaticalNote,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating example:', error);
    throw new Error(
      `Failed to update example: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function updateAudio(audioId: string, data: AudioUpdateData) {
  try {
    const id = parseInt(audioId);
    if (isNaN(id)) {
      throw new Error('Invalid audio ID');
    }

    const audio = await prisma.audio.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    const updated = await prisma.audio.update({
      where: { id },
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating audio:', error);
    throw new Error(
      `Failed to update audio: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

//create audio for example

export async function createAudioForExample(
  exampleId: string,
  data: AudioUpdateData,
) {
  try {
    const id = parseInt(exampleId);
    if (isNaN(id)) {
      throw new Error('Invalid example ID');
    }

    const example = await prisma.definitionExample.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!example) {
      throw new Error('Example not found');
    }

    const createdAudio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
        entityType: EntityType.example,
        entityId: id,
      },
    });

    return createdAudio;
  } catch (error) {
    console.error('Error creating audio for example:', error);
    throw new Error(
      `Failed to create audio for example: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

//create audio for word

export async function createAudioForWord(
  wordId: string,
  data: AudioUpdateData,
) {
  try {
    const id = parseInt(wordId);
    if (isNaN(id)) {
      throw new Error('Invalid word ID');
    }

    const word = await prisma.word.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!word) {
      throw new Error('Word not found');
    }

    const createdAudio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
        entityType: EntityType.word,
        entityId: id,
      },
    });

    return createdAudio;
  } catch (error) {
    console.error('Error creating audio for word:', error);
    throw new Error(
      `Failed to create audio for word: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

//create audio for definition

export async function createAudioForDefinition(
  definitionId: string,
  data: AudioUpdateData,
) {
  try {
    const id = parseInt(definitionId);
    if (isNaN(id)) {
      throw new Error('Invalid definition ID');
    }

    const definition = await prisma.definition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!definition) {
      throw new Error('Definition not found');
    }

    const createdAudio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
        entityType: EntityType.definition,
        entityId: id,
      },
    });

    return createdAudio;
  } catch (error) {
    console.error('Error creating audio for definition:', error);
    throw new Error(
      `Failed to create audio for definition: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
