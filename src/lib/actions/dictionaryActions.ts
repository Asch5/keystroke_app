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
    additionalInfo: Record<string, unknown>;
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
    usageNote: string | null;
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
    subjectStatusLabels: string | null;
    examples: Array<{
      id: number;
      text: string;
      audio: string | null;
    }>;
    audio: string | null;
  }>;
  mistakes: Array<{
    id: string;
    type: string;
    context: string | null;
    mistakeData: Record<string, unknown>;
    createdAt: Date;
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
                        examples: true,
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
                        examples: true,
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
        // Include all phrases with examples and audio
        phrases: {
          include: {
            examples: {
              include: {
                // Include audio for phrase examples
                audio: {
                  include: {
                    audio: true,
                  },
                },
              },
            },
            audio: {
              include: {
                audio: true,
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

    // Initialize related words object with all possible relationship types
    const relatedWords: WordDetails['relatedWords'] = {
      // Add all relationship types from the enum
      ...Object.values(RelationshipType).reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<RelationshipType, Array<{ id: number; word: string }>>,
      ),
    };

    // Process related words from the word (outgoing relationships)
    for (const relation of word.relatedFrom) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        relatedWords[relationType].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
        });
      } else {
        // If the relationship type is not in our predefined list, add it to 'related'
        relatedWords[RelationshipType.related].push({
          id: relation.toWord.id,
          word: relation.toWord.word,
        });
      }
    }

    // Process related words to the word (incoming relationships)
    for (const relation of word.relatedTo) {
      const relationType = relation.type as keyof typeof relatedWords;
      if (relationType in relatedWords) {
        relatedWords[relationType].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
        });
      } else {
        // If the relationship type is not in our predefined list, add it to 'related'
        relatedWords[RelationshipType.related].push({
          id: relation.fromWord.id,
          word: relation.fromWord.word,
        });
      }
    }

    // Process definitions with all their details
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
        usageNote: def.usageNote,
        isInShortDef: def.isInShortDef,
        examples: def.examples.map((ex) => ({
          id: ex.id,
          text: ex.example,
          grammaticalNote: ex.grammaticalNote,
          audio: null, // We'll handle audio separately
        })),
      };
    });

    // Process phrases with all their details
    const phrases = word.phrases.map((phrase) => ({
      id: phrase.id,
      text: phrase.phrase,
      definition: phrase.definition,
      subjectStatusLabels: phrase.subjectStatusLabels,
      examples: phrase.examples.map((ex) => ({
        id: ex.id,
        text: ex.example,
        audio: null, // We'll handle audio separately
      })),
      audio: null, // We'll handle audio separately
    }));

    // Find plural form (from related words)
    const pluralRelation = word.relatedFrom.find(
      (rel) => rel.type === RelationshipType.plural_en,
    );
    const pluralForm = pluralRelation ? pluralRelation.toWord.word : null;

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
          mistakeData: mistake.mistakeData as Record<string, unknown>,
          createdAt: mistake.createdAt,
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
        difficultyLevel: word.difficultyLevel,
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
