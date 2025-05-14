'use server';

import { prisma } from '@/core/lib/prisma';
//import { Word } from '@/core/types/word';
import {
  LanguageCode,
  Prisma,
  PartOfSpeech,
  SourceType,
  RelationshipType,
  DifficultyLevel,
} from '@prisma/client';
import { JsonValue } from 'type-fest';
import {
  getWordFrequencyEnum,
  getFrequencyPartOfSpeechEnum,
  //mapDifficultyLevelFromOrderIndex,
  WordFrequency,
  FrequencyPartOfSpeech,
} from '@/core/lib/utils/commonDictUtils/frequencyUtils';
import {
  WordUpdateData,
  UpdateWordResult,
  DefinitionUpdateData,
  ExampleUpdateData,
  AudioUpdateData,
} from '@/core/types/dictionary';

// Add type definition for image data
interface ImageData {
  id: number;
  url: string;
  description: string | null;
}

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

// Update the WordDetails type to match the schema
export interface WordDetails {
  word: {
    id: number;
    text: string;
    phoneticGeneral: string | null;
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
    [key in RelationshipType]?: Array<{
      id: number;
      word: string;
      phoneticGeneral?: string | null;
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
    incorrectValue: string | null;
    mistakeData: JsonValue;
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
    const word = await prisma.word.findFirst({
      where: {
        word: wordText,
        languageCode,
      },
      include: {
        details: {
          include: {
            definitions: {
              include: {
                definition: {
                  include: {
                    examples: {
                      include: {
                        audioLinks: {
                          include: {
                            audio: true,
                          },
                        },
                      },
                    },
                    image: true,
                  },
                },
              },
            },
            audioLinks: {
              include: {
                audio: true,
              },
            },
            relatedFrom: {
              include: {
                toWordDetails: {
                  include: {
                    word: true,
                    audioLinks: {
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
                fromWordDetails: {
                  include: {
                    word: true,
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
        mistakes: true,
      },
    });

    if (!word) return null;

    const wordFrequency = await mapWordFrequency(word.frequencyGeneral || 0);

    // Process definitions with async operations first
    const processedDefinitions = await Promise.all(
      word.details.flatMap((detail) =>
        detail.definitions.map(async (def) => ({
          id: def.definition.id,
          text: def.definition.definition,
          partOfSpeech: detail.partOfSpeech,
          image: def.definition.image,
          frequencyPartOfSpeech: await mapFrequencyPartOfSpeech(
            detail.frequency || 0,
          ),
          languageCode: def.definition.languageCode,
          source: def.definition.source,
          subjectStatusLabels: def.definition.subjectStatusLabels,
          isPlural: detail.isPlural,
          generalLabels: def.definition.generalLabels,
          grammaticalNote: def.definition.grammaticalNote,
          usageNote: def.definition.usageNote,
          isInShortDef: def.definition.isInShortDef,
          examples: def.definition.examples.map((ex) => ({
            id: ex.id,
            text: ex.example,
            grammaticalNote: ex.grammaticalNote,
            audio: ex.audioLinks[0]?.audio.url || null,
          })),
        })),
      ),
    );

    // Transform the data to match WordDetails type
    const details: WordDetails = {
      word: {
        id: word.id,
        text: word.word,
        phoneticGeneral: word.phoneticGeneral,
        audio: word.details[0]?.audioLinks[0]?.audio?.url || null,
        audioFiles: word.details.flatMap((detail) =>
          detail.audioLinks.map((link) => ({
            id: link.audio.id,
            url: link.audio.url,
            isPrimary: link.isPrimary,
          })),
        ),
        etymology: word.etymology,
        isPlural: word.details[0]?.isPlural || false,
        pluralForm: null,
        pastTenseForm: null,
        pastParticipleForm: null,
        presentParticipleForm: null,
        thirdPersonForm: null,
        wordFrequency,
        languageCode: word.languageCode,
        createdAt: word.createdAt,
        additionalInfo: word.additionalInfo as Record<string, unknown>,
      },
      relatedWords: {},
      definitions: processedDefinitions,
      phrases: [],
      mistakes: word.mistakes.map((mistake) => ({
        ...mistake,
        mistakeData: mistake.mistakeData as JsonValue,
      })),
    };

    // Populate related words
    for (const detail of word.details) {
      // Process WordDetailsRelationships
      for (const rel of detail.relatedFrom) {
        const relatedWord = rel.toWordDetails.word;
        const relatedAudio = rel.toWordDetails.audioLinks[0]?.audio.url || null;

        details.relatedWords[rel.type] = details.relatedWords[rel.type] || [];
        details.relatedWords[rel.type]?.push({
          id: relatedWord.id,
          word: relatedWord.word,
          phoneticGeneral: relatedWord.phoneticGeneral,
          audio: relatedAudio,
        });
      }
    }

    return details;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw new Error('Failed to fetch word details');
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

export async function updateWord(
  wordId: string,
  data: WordUpdateData,
): Promise<UpdateWordResult> {
  try {
    await prisma.word.update({
      where: { id: parseInt(wordId) },
      data: {
        word: data.word,
        phoneticGeneral: data.phonetic,
        etymology: data.etymology,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating word:', error);
    throw new Error('Failed to update word');
  }
}

export async function updateDefinition(
  definitionId: string,
  data: DefinitionUpdateData,
) {
  try {
    await prisma.definition.update({
      where: { id: parseInt(definitionId) },
      data: {
        definition: data.definition,
        subjectStatusLabels: data.subjectStatusLabels,
        generalLabels: data.generalLabels,
        grammaticalNote: data.grammaticalNote,
        usageNote: data.usageNote,
        isInShortDef: data.isInShortDef,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating definition:', error);
    throw new Error('Failed to update definition');
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
    const wordDetails = await prisma.wordDetails.findFirst({
      where: { wordId: parseInt(wordId) },
    });

    if (!wordDetails) {
      throw new Error('Word details not found');
    }

    const audio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    await prisma.wordDetailsAudio.create({
      data: {
        wordDetailsId: wordDetails.id,
        audioId: audio.id,
        isPrimary: data.isPrimary ?? false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating audio for word:', error);
    throw new Error('Failed to create audio for word');
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
