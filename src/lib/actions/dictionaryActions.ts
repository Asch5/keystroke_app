'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@/types/word';
import {
  LanguageCode,
  Prisma,
  PartOfSpeech,
  SourceType,
  RelationshipType,
  DifficultyLevel,
} from '@prisma/client';

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
    audioFiles: {
      include: {
        audio: true;
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
    phrases: {
      include: {
        examples: true;
        audio: {
          include: {
            audio: true;
          };
        };
      };
    };
    audioFiles: {
      include: {
        audio: true;
      };
    };
    variants: true;
  };
}>;

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
        audioFiles: {
          include: {
            audio: true,
          },
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
    });

    // Transform to match Word type
    return (entries as WordWithAudioAndDefinitions[]).map((entry) => ({
      id: String(entry.id),
      text: entry.word || '',
      translation: entry.wordDefinitions?.[0]?.definition?.definition || '',
      languageId: entry.languageCode,
      category: entry.wordDefinitions?.[0]?.definition?.partOfSpeech || '',
      difficulty: mapDifficultyLevel(entry.difficultyLevel.toString()),
      audioUrl: entry.audioFiles?.[0]?.audio?.url || '',
      exampleSentence:
        entry.wordDefinitions?.[0]?.definition?.examples?.[0]?.example || '',
    }));
  } catch (error) {
    console.error('Error fetching dictionary words:', error);
    throw new Error('Failed to fetch dictionary words');
  }
}

// Helper function to map difficulty levels (assuming input might be enum name)
function mapDifficultyLevel(level?: string): 'easy' | 'medium' | 'hard' {
  if (!level) return 'medium';

  // Map CEFR levels to our difficulty scale
  if (['A1', 'A2'].includes(level)) return 'easy';
  if (['B1', 'B2'].includes(level)) return 'medium';
  return 'hard'; // C1, C2 or unknown
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
    plural: boolean;
    pluralForm: string | null;
    difficultyLevel: DifficultyLevel;
    languageCode: LanguageCode;
    createdAt: Date;
  };
  relatedWords: {
    [RelationshipType.synonym]: Array<{ id: number; word: string }>;
    [RelationshipType.antonym]: Array<{ id: number; word: string }>;
    [RelationshipType.related]: Array<{ id: number; word: string }>;
    [RelationshipType.composition]: Array<{ id: number; word: string }>;
    [RelationshipType.plural_en]: Array<{ id: number; word: string }>;
    [RelationshipType.phrasal_verb]: Array<{ id: number; word: string }>;
    [RelationshipType.past_tense_en]: Array<{ id: number; word: string }>;
    [RelationshipType.past_participle_en]: Array<{ id: number; word: string }>;
    [RelationshipType.present_participle_en]: Array<{
      id: number;
      word: string;
    }>;
    [RelationshipType.third_person_en]: Array<{ id: number; word: string }>;
    [RelationshipType.alternative_spelling]: Array<{
      id: number;
      word: string;
    }>;
    [RelationshipType.variant_form_phrasal_verb_en]: Array<{
      id: number;
      word: string;
    }>;
  };
  definitions: Array<{
    id: number;
    text: string;
    partOfSpeech: PartOfSpeech;
    image: { id: number; url: string; description: string | null } | null;
    frequencyUsing: number;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
    generalLabels: string | null;
    grammaticalNote: string | null;
    isInShortDef: boolean;
    examples: Array<{
      id: number;
      text: string;
      audio: string | null;
    }>;
  }>;
  phrases: Array<{
    id: number;
    text: string;
    definition: string;
    examples: Array<{
      id: number;
      text: string;
      audio: string | null;
    }>;
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
    // Find the base word with all its relations
    const word = (await prisma.word.findUnique({
      where: {
        word_languageCode: {
          word: wordText,
          languageCode,
        },
      },
      include: {
        relatedFrom: {
          include: {
            toWord: true,
          },
        },
        relatedTo: {
          include: {
            fromWord: true,
          },
        },
        wordDefinitions: {
          include: {
            definition: {
              include: {
                image: true,
                examples: true,
              },
            },
          },
        },
        phrases: {
          include: {
            examples: true,
            audio: {
              include: {
                audio: true,
              },
              where: {
                isPrimary: true,
              },
              take: 1,
            },
          },
        },
        audioFiles: {
          include: {
            audio: true,
          },
        },
      },
    })) as WordWithFullRelations | null;

    if (!word) {
      return null;
    }

    // Initialize related words object
    const relatedWords: WordDetails['relatedWords'] = {
      [RelationshipType.synonym]: [],
      [RelationshipType.antonym]: [],
      [RelationshipType.related]: [],
      [RelationshipType.composition]: [],
      [RelationshipType.plural_en]: [],
      [RelationshipType.phrasal_verb]: [],
      [RelationshipType.past_tense_en]: [],
      [RelationshipType.past_participle_en]: [],
      [RelationshipType.present_participle_en]: [],
      [RelationshipType.third_person_en]: [],
      [RelationshipType.alternative_spelling]: [],
      [RelationshipType.variant_form_phrasal_verb_en]: [],
    };

    // Process related words from the word
    for (const relation of word.relatedFrom) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        relatedWords[relationType].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
        });
      } else {
        relatedWords[RelationshipType.related].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
        });
      }
    }

    // Process related words to the word
    for (const relation of word.relatedTo) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        relatedWords[relationType].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
        });
      } else {
        relatedWords[RelationshipType.related].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
        });
      }
    }

    // Process definitions
    const definitions = word.wordDefinitions.map((wd) => {
      const def = wd.definition;
      return {
        id: def.id,
        text: def.definition,
        partOfSpeech: def.partOfSpeech,
        image: def.image,
        frequencyUsing: def.frequencyUsing,
        languageCode: def.languageCode,
        source: def.source,
        subjectStatusLabels: def.subjectStatusLabels,
        generalLabels: def.generalLabels,
        grammaticalNote: def.grammaticalNote,
        isInShortDef: def.isInShortDef,
        examples: def.examples.map((ex) => ({
          id: ex.id,
          text: ex.example,
          audio: null, // Audio will be handled separately if needed
        })),
      };
    });

    // Process phrases
    const phrases = word.phrases.map((phrase) => ({
      id: phrase.id,
      text: phrase.phrase,
      definition: phrase.definition,
      examples: phrase.examples.map((ex) => ({
        id: ex.id,
        text: ex.example,
        audio: null, // Audio will be handled separately if needed
      })),
    }));

    // Find plural form (from related words)
    const pluralRelation = word.relatedFrom.find(
      (rel) => rel.type === RelationshipType.plural_en,
    );
    const pluralForm = pluralRelation ? pluralRelation.toWord.word : null;

    // Construct the full word details
    const wordDetails: WordDetails = {
      word: {
        id: word.id,
        text: word.word,
        phonetic: word.phonetic,
        audio: word.audioFiles?.find((a) => a.isPrimary)?.audio?.url || null,
        audioFiles: word.audioFiles.map((af) => ({
          id: af.audioId,
          url: af.audio.url,
          isPrimary: af.isPrimary,
        })),
        etymology: word.etymology,
        plural: !!pluralForm,
        pluralForm,
        difficultyLevel: word.difficultyLevel,
        languageCode: word.languageCode,
        createdAt: word.createdAt,
      },
      relatedWords,
      definitions,
      phrases,
    };

    return wordDetails;
  } catch (error) {
    console.error('Error fetching word details:', error);
    throw new Error(
      `Failed to fetch word details: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
