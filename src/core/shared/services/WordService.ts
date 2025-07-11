import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  fetchWordFrequency,
  getPartOfSpeechFrequency,
} from '@/core/lib/services/frequencyService';
import { clientLog } from '@/core/lib/utils/logUtils';
import {
  LanguageCode,
  PartOfSpeech,
  SourceType,
  Word,
  DifficultyLevel,
  Gender,
} from '@/core/types';
import { DatabaseTransactionClient } from '@/core/types/database';
import { AudioFile } from '@/core/types/dictionary';
import { FrequencyManager } from './FrequencyManager';

/**
 * Interface for WordDetails update data - only includes properties with meaningful values
 */
interface WordDetailsUpdateData {
  isPlural: boolean;
  source: SourceType;
  phonetic?: string;
  frequency?: number;
  etymology?: string;
  gender?: Gender;
  forms?: string;
}

/**
 * Configuration options for upsertWordDetails to handle language-specific differences
 */
export interface UpsertWordDetailsConfig {
  /** Whether to include gender and forms parameters (for Danish) */
  includeDanishFields?: boolean;
  /** Whether to use fallback frequency fetching when no frequency manager provided */
  useFallbackFrequency?: boolean;
  /** Whether to cleanup undefined PartOfSpeech records */
  cleanupUndefinedPos?: boolean;
}

/**
 * Options for upsertWord function
 */
export interface UpsertWordOptions {
  phonetic?: string | null;
  audio?: string | null;
  audioFiles?: AudioFile[] | null;
  etymology?: string | null;
  difficultyLevel?: DifficultyLevel;
  sourceEntityId?: string | null;
  partOfSpeech?: PartOfSpeech | null;
  variant?: string;
  isHighlighted?: boolean;
  frequencyGeneral?: number | null;
  frequencyManager?: FrequencyManager;
}

/**
 * Shared WordService class containing common word processing logic
 */
export class WordService {
  /**
   * Create or update a Word record with frequency data
   */
  static async upsertWord(
    tx: DatabaseTransactionClient,
    source: SourceType,
    wordText: string,
    languageCode: LanguageCode,
    options?: UpsertWordOptions,
  ): Promise<Word> {
    // Get or create frequency manager
    const frequencyManager =
      options?.frequencyManager || new FrequencyManager();

    // Fetch frequency data if not provided
    let frequencyGeneral = options?.frequencyGeneral;
    if (frequencyGeneral === undefined) {
      const frequencyData = await frequencyManager.getFrequencyData(
        wordText,
        languageCode,
        options?.partOfSpeech ?? undefined,
      );
      frequencyGeneral = frequencyData.general;

      void serverLog(
        `Retrieved frequency data in upsertWord for "${wordText}": ${frequencyGeneral}`,
        'info',
      );
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
        sourceEntityId: options?.sourceEntityId ?? null,
        isHighlighted: options?.isHighlighted ?? false,
        frequencyGeneral: frequencyGeneral ?? null,
      },
    });

    return word;
  }

  /**
   * Create or update a WordDetails record
   */
  static async upsertWordDetails(
    tx: DatabaseTransactionClient,
    wordId: number,
    partOfSpeech: PartOfSpeech | null,
    source: SourceType = SourceType.user,
    isPlural: boolean = false,
    variant: string = '',
    phonetic: string | null = null,
    frequency: number | null = null,
    etymology: string | null = null,
    frequencyManager?: FrequencyManager,
    config: UpsertWordDetailsConfig = {},
    // Danish-specific fields
    gender: Gender | null = null,
    forms: string | null = null,
  ): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
    // Determine the definitive PartOfSpeech to be persisted in the DB
    const dbPoSToPersist: PartOfSpeech = partOfSpeech || PartOfSpeech.undefined;

    // Fetch frequency data if not provided
    let posFrequency = frequency;
    if (posFrequency === null || posFrequency === undefined) {
      if (frequencyManager) {
        // Use frequency manager if provided to avoid duplicate API calls
        try {
          const wordRecord = await tx.word.findUnique({
            where: { id: wordId },
            select: { word: true, languageCode: true },
          });

          if (wordRecord) {
            const frequencyData = await frequencyManager.getFrequencyData(
              wordRecord.word,
              wordRecord.languageCode as LanguageCode,
              dbPoSToPersist,
            );
            posFrequency = frequencyData.posSpecific;

            void serverLog(
              `Retrieved POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${dbPoSToPersist}: ${posFrequency}`,
              'info',
            );
          }
        } catch (error) {
          void serverLog(
            `Error retrieving POS frequency data in upsertWordDetails for word ID ${wordId}: ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
          posFrequency = null;
        }
      } else if (config.useFallbackFrequency) {
        // Fallback to direct API call if no frequency manager provided (Danish API style)
        try {
          const wordRecord = await tx.word.findUnique({
            where: { id: wordId },
            select: { word: true, languageCode: true },
          });

          if (wordRecord) {
            const frequencyData = await fetchWordFrequency(
              wordRecord.word,
              wordRecord.languageCode as LanguageCode,
            );
            posFrequency = getPartOfSpeechFrequency(
              frequencyData,
              dbPoSToPersist,
            );
            void serverLog(
              `Fetched POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${dbPoSToPersist}: ${posFrequency}`,
              'info',
            );
          }
        } catch (error) {
          void serverLog(
            `Error fetching POS frequency data in upsertWordDetails for word ID ${wordId}: ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
          posFrequency = null;
        }
      } else {
        // Merriam style - set to null with warning
        clientLog(
          `No frequency manager provided for word ID ${wordId}, POS ${dbPoSToPersist}. Setting frequency to null.`,
          'warn',
        );
        posFrequency = null;
      }
    }

    // Build updateData conditionally to avoid null/empty overwrites
    const updateData: WordDetailsUpdateData = {
      isPlural: isPlural, // Always update boolean values
      source: source, // Always update source
    };

    // Only add properties if they have meaningful values
    if (phonetic !== null && phonetic !== undefined && phonetic.trim() !== '') {
      updateData.phonetic = phonetic;
    }

    if (posFrequency !== null && posFrequency !== undefined) {
      updateData.frequency = posFrequency;
    }

    if (
      etymology !== null &&
      etymology !== undefined &&
      etymology.trim() !== ''
    ) {
      updateData.etymology = etymology;
    }

    // For Danish fields, only add if the config includes them and they have values
    if (config.includeDanishFields) {
      if (gender !== null && gender !== undefined) {
        updateData.gender = gender;
      }

      if (forms !== null && forms !== undefined && forms.trim() !== '') {
        updateData.forms = forms;
      }
    }

    /**
     * IMPROVEMENT: Prevent empty WordDetails accumulation
     *
     * Before creating a new WordDetails record with a variant, check if there's already
     * an existing WordDetails for the same wordId and partOfSpeech that has no linked definitions.
     * If found, reuse that empty record instead of creating a new variant-specific one.
     * This prevents the accumulation of empty WordDetails records in the database.
     */
    const existingEmptyWordDetails = await tx.wordDetails.findFirst({
      where: {
        wordId,
        partOfSpeech: dbPoSToPersist,

        definitions: {
          none: {}, // WordDetails with no linked definitions
        },
      },
      include: {
        _count: {
          select: {
            definitions: true,
          },
        },
      },
    });

    let wordDetails;

    if (
      existingEmptyWordDetails &&
      existingEmptyWordDetails._count.definitions === 0
    ) {
      // Reuse the existing empty WordDetails record by updating it
      void serverLog(
        `Reusing existing empty WordDetails record ${existingEmptyWordDetails.id} for wordId ${wordId}, partOfSpeech ${dbPoSToPersist}`,
        'info',
      );

      wordDetails = await tx.wordDetails.update({
        where: {
          id: existingEmptyWordDetails.id,
        },
        data: {
          ...updateData,
          variant: variant ?? '', // Update variant to the new one
        },
      });
    } else {
      // Upsert the WordDetails record using normal logic
      wordDetails = await tx.wordDetails.upsert({
        where: {
          wordId_partOfSpeech_variant: {
            wordId,
            partOfSpeech: dbPoSToPersist || PartOfSpeech.undefined,
            variant: variant ?? '',
          },
        },
        create: {
          wordId,
          partOfSpeech: dbPoSToPersist,
          phonetic: phonetic || (config.includeDanishFields ? null : ''),
          variant: variant ?? '',
          isPlural,
          source: source,
          frequency: posFrequency,
          etymology: etymology ?? null,
          ...(config.includeDanishFields && { gender, forms }),
        },
        update: updateData,
      });
    }

    return wordDetails;
  }

  /**
   * Convenience method for Danish API style upsertWordDetails
   */
  static async upsertWordDetailsDanish(
    tx: DatabaseTransactionClient,
    wordId: number,
    partOfSpeech: PartOfSpeech | null,
    source: SourceType = SourceType.user,
    isPlural: boolean = false,
    variant: string = '',
    phonetic: string | null = null,
    frequency: number | null = null,
    gender: Gender | null = null,
    forms: string | null = null,
    etymology: string | null = null,
    frequencyManager?: FrequencyManager,
  ): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
    return this.upsertWordDetails(
      tx,
      wordId,
      partOfSpeech,
      source,
      isPlural,
      variant,
      phonetic,
      frequency,
      etymology,
      frequencyManager,
      {
        includeDanishFields: true,
        useFallbackFrequency: true,
        cleanupUndefinedPos: true,
      },
      gender,
      forms,
    );
  }

  /**
   * Convenience method for Merriam API style upsertWordDetails
   */
  static async upsertWordDetailsMerriam(
    tx: DatabaseTransactionClient,
    wordId: number,
    partOfSpeech: PartOfSpeech | null,
    source: SourceType = SourceType.user,
    isPlural: boolean = false,
    variant: string = '',
    phonetic: string | null = null,
    frequency: number | null = null,
    etymology: string | null = null,
    frequencyManager?: FrequencyManager,
  ): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
    return this.upsertWordDetails(
      tx,
      wordId,
      partOfSpeech,
      source,
      isPlural,
      variant,
      phonetic,
      frequency,
      etymology,
      frequencyManager,
      {
        includeDanishFields: false,
        useFallbackFrequency: false,
        cleanupUndefinedPos: false,
      },
    );
  }
}
