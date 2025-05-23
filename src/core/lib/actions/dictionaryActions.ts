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
import {
  getWordFrequencyEnum,
  getFrequencyPartOfSpeechEnum,
  WordFrequency,
  FrequencyPartOfSpeech,
  //mapDifficultyLevelFromOrderIndex,
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
  // id: number; // ID of the DetailRelationship record - removing as it might not exist
  type: RelationshipType | string;
  description: string | null;
  toWordText: string;
  toWordAudio: string | null;
  toWordId: number; // ID of the target Word (from toWordDetails.word.id)
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
      translations?: Array<{
        id: number;
        languageCode: LanguageCode;
        content: string;
      }>;
    }>;
    translations?: Array<{
      id: number;
      languageCode: LanguageCode;
      content: string;
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
      translations?: Array<{
        id: number;
        languageCode: LanguageCode;
        content: string;
      }>;
    }>;
    audio: string | null;
    translations?: Array<{
      id: number;
      languageCode: LanguageCode;
      content: string;
    }>;
  }>;
  mistakes: Array<{
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
