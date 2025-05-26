import {
  LanguageCode,
  PartOfSpeech,
  Prisma,
  SourceType,
  Word,
  DifficultyLevel,
  Gender,
} from '@prisma/client';
import { LogLevel, clientLog } from '@/core/lib/utils/logUtils';
import { serverLog } from '@/core/lib/server/serverLogger';
import {
  fetchWordFrequency,
  getPartOfSpeechFrequency,
} from '@/core/lib/services/frequencyService';
import { FrequencyManager } from './FrequencyManager';
import { AudioFile } from '@/core/types/dictionary';

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
    tx: Prisma.TransactionClient,
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
        options?.partOfSpeech || undefined,
      );
      frequencyGeneral = frequencyData.general;

      serverLog(
        `Retrieved frequency data in upsertWord for "${wordText}": ${frequencyGeneral}`,
        LogLevel.INFO,
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
    tx: Prisma.TransactionClient,
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

            serverLog(
              `Retrieved POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${dbPoSToPersist}: ${posFrequency}`,
              LogLevel.INFO,
            );
          }
        } catch (error) {
          serverLog(
            `Error retrieving POS frequency data in upsertWordDetails for word ID ${wordId}: ${error}`,
            LogLevel.ERROR,
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
            serverLog(
              `Fetched POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${dbPoSToPersist}: ${posFrequency}`,
              LogLevel.INFO,
            );
          }
        } catch (error) {
          serverLog(
            `Error fetching POS frequency data in upsertWordDetails for word ID ${wordId}: ${error}`,
            LogLevel.ERROR,
          );
          posFrequency = null;
        }
      } else {
        // Merriam style - set to null with warning
        clientLog(
          `No frequency manager provided for word ID ${wordId}, POS ${dbPoSToPersist}. Setting frequency to null.`,
          LogLevel.WARN,
        );
        posFrequency = null;
      }
    }

    // Prepare create/update data
    const createData = {
      wordId,
      partOfSpeech: dbPoSToPersist,
      phonetic: phonetic || (config.includeDanishFields ? null : ''),
      variant: variant || '',
      isPlural,
      source: source,
      frequency: posFrequency,
      etymology: etymology || null,
      ...(config.includeDanishFields && { gender, forms }),
    };

    const updateData = {
      isPlural: isPlural,
      phonetic: phonetic !== null ? phonetic : null,
      source: source,
      frequency: posFrequency !== null ? posFrequency : null,
      etymology: etymology !== null ? etymology : null,
      ...(config.includeDanishFields && {
        gender: gender !== null ? gender : null,
        forms: forms !== null ? forms : null,
      }),
    };

    // Upsert the WordDetails record
    const wordDetails = await tx.wordDetails.upsert({
      where: {
        wordId_partOfSpeech_variant: {
          wordId,
          partOfSpeech: dbPoSToPersist,
          variant: variant || '',
        },
      },
      create: createData,
      update: updateData,
    });

    // Clean up alternative PoS state if configured (Danish style)
    if (dbPoSToPersist !== PartOfSpeech.undefined) {
      await tx.wordDetails.deleteMany({
        where: {
          wordId: wordId,
          variant: variant || '',
          partOfSpeech: PartOfSpeech.undefined,
        },
      });
    }

    return wordDetails;
  }

  /**
   * Convenience method for Danish API style upsertWordDetails
   */
  static async upsertWordDetailsDanish(
    tx: Prisma.TransactionClient,
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
    tx: Prisma.TransactionClient,
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
