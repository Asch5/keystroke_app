'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@/types/word';
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
} from '@/lib/utils/frequencyUtils';

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
        toWord: {
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
        };
      };
    };
    relatedTo: {
      include: {
        fromWord: {
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
        };
      };
    };
    wordDefinitions: {
      include: {
        definition: {
          include: {
            image: true;
            examples: {
              include: {
                audio: {
                  include: {
                    audio: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    phrases: {
      include: {
        examples: {
          include: {
            audio: {
              include: {
                audio: true;
              };
            };
          };
        };
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
          audioUrl: entry.audioFiles?.[0]?.audio?.url || '',
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
    plural: boolean;
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
    image: { id: number; url: string; description: string | null } | null;
    frequencyPartOfSpeech: FrequencyPartOfSpeech;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
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
                image: true,
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
          image: def.image,
          frequencyPartOfSpeech: posFrequencyEnum,
          languageCode: def.languageCode,
          source: def.source,
          subjectStatusLabels: def.subjectStatusLabels,
          generalLabels: def.generalLabels,
          grammaticalNote: def.grammaticalNote,
          usageNote: def.usageNote,
          isInShortDef: def.isInShortDef,
          isPrimary: wd.isPrimary,
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
        plural: !!pluralForm,
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
