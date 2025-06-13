'use server';

import { z } from 'zod';
import { prisma } from '@/core/lib/prisma';
import { deepSeekService } from '@/core/infrastructure/services/deepseek-service';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import type { LanguageCode, PartOfSpeech } from '@prisma/client';

// Validation schemas
const extractWordSchema = z.object({
  definitionId: z.number().positive(),
  targetLanguage: z.string().min(2).max(5),
  sourceLanguage: z.string().min(2).max(5).optional(),
});

const extractWordsBatchSchema = z.object({
  definitionIds: z.array(z.number().positive()).min(1).max(50), // Limit batch size
  targetLanguage: z.string().min(2).max(5),
  sourceLanguage: z.string().min(2).max(5).optional(),
});

// Response types
export interface ExtractWordResult {
  success: boolean;
  data?: {
    word: string;
    confidence: number;
    tokensUsed: number;
    cost: number;
  };
  error?: string;
}

export interface ExtractWordsBatchResult {
  success: boolean;
  data?: {
    results: Array<{
      definitionId: number;
      word: string | null;
      confidence: number;
      connected: boolean;
      error?: string;
    }>;
    totalTokensUsed: number;
    totalCost: number;
    successCount: number;
    failureCount: number;
  };
  error?: string;
}

/**
 * Interface for definition with selection state for DeepSeek dialog
 */
export interface DefinitionForExtraction {
  id: number;
  definition: string;
  languageCode: LanguageCode;
  wordDetailsId: number;
  wordText: string;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  selected: boolean; // For checkbox state
}

/**
 * Interface for WordDetail with its definitions for DeepSeek dialog
 */
export interface WordDetailWithDefinitions {
  id: number;
  wordText: string;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  definitions: DefinitionForExtraction[];
}

/**
 * Extract a single word from a definition using DeepSeek API
 */
export async function extractWordFromDefinition(
  input: z.infer<typeof extractWordSchema>,
): Promise<ExtractWordResult> {
  try {
    // TODO: Add admin authentication validation once auth is properly configured

    // Validate input
    const validatedInput = extractWordSchema.parse(input);
    const { definitionId, targetLanguage, sourceLanguage } = validatedInput;

    await serverLog('Starting single word extraction', 'info', {
      definitionId,
      targetLanguage,
      sourceLanguage,
    });

    // Fetch definition
    const definition = await prisma.definition.findUnique({
      where: { id: definitionId },
      select: {
        id: true,
        definition: true,
        languageCode: true,
      },
    });

    if (!definition) {
      return { success: false, error: 'Definition not found' };
    }

    // Extract word using DeepSeek API
    const result = await deepSeekService.extractWord({
      definition: definition.definition,
      targetLanguage,
      sourceLanguage: sourceLanguage || definition.languageCode,
    });

    if (!result.word) {
      return { success: false, error: 'No word extracted from definition' };
    }

    // Calculate cost (approximate)
    const cost = (result.tokensUsed.total / 1000) * 0.001;

    await serverLog('Word extraction completed successfully', 'info', {
      definitionId,
      extractedWord: result.word,
      tokensUsed: result.tokensUsed.total,
      cost,
    });

    return {
      success: true,
      data: {
        word: result.word,
        confidence: result.confidence,
        tokensUsed: result.tokensUsed.total,
        cost,
      },
    };
  } catch (error) {
    await serverLog('Word extraction failed', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input parameters' };
    }

    // Handle specific DeepSeek API errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient balance')) {
        return {
          success: false,
          error:
            'DeepSeek API: Insufficient balance. Please add credits to your DeepSeek account to continue using word extraction.',
        };
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          error:
            'DeepSeek API: Rate limit exceeded. Please wait a moment and try again.',
        };
      }

      if (error.message.includes('No valid word extracted')) {
        return {
          success: false,
          error:
            'Could not extract a valid word from this definition. The definition may be too complex or unclear.',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract words from multiple definitions and connect them via DefinitionToOneWord
 */
export async function extractWordsFromDefinitionsBatch(
  prevState: ExtractWordsBatchResult,
  formData: FormData,
): Promise<ExtractWordsBatchResult> {
  // Parse form data outside try block to access in catch
  const definitionIds = JSON.parse(formData.get('definitionIds') as string);
  const targetLanguage = formData.get('targetLanguage') as string;
  const sourceLanguage =
    (formData.get('sourceLanguage') as string) || undefined;

  try {
    // TODO: Add admin authentication validation once auth is properly configured

    // Validate input
    const validatedInput = extractWordsBatchSchema.parse({
      definitionIds,
      targetLanguage,
      sourceLanguage,
    });

    await serverLog('Starting batch word extraction', 'info', {
      definitionCount: validatedInput.definitionIds.length,
      targetLanguage: validatedInput.targetLanguage,
      sourceLanguage: validatedInput.sourceLanguage,
    });

    // Fetch definitions
    const definitions = await prisma.definition.findMany({
      where: { id: { in: validatedInput.definitionIds } },
      select: {
        id: true,
        definition: true,
        languageCode: true,
      },
    });

    if (definitions.length === 0) {
      return { success: false, error: 'No definitions found' };
    }

    // Extract words using DeepSeek API
    const batchRequest: Parameters<
      typeof deepSeekService.extractWordsBatch
    >[0] = {
      definitions: definitions.map((def) => ({
        id: def.id,
        definition: def.definition,
      })),
      targetLanguage: validatedInput.targetLanguage,
    };
    if (validatedInput.sourceLanguage) {
      batchRequest.sourceLanguage = validatedInput.sourceLanguage;
    }
    const batchResult = await deepSeekService.extractWordsBatch(batchRequest);

    // Process results and connect words to definitions
    const processedResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const result of batchResult.results) {
      if (result.word && !result.error) {
        try {
          // Find or create the word
          const word = await findOrCreateWord(
            result.word,
            validatedInput.targetLanguage as LanguageCode,
          );

          // Connect definition to word via DefinitionToOneWord table
          await connectDefinitionToWord(result.definitionId, word.id);

          processedResults.push({
            definitionId: result.definitionId,
            word: result.word,
            confidence: result.confidence,
            connected: true,
          });
          successCount++;
        } catch (error) {
          await serverLog('Failed to connect definition to word', 'error', {
            definitionId: result.definitionId,
            word: result.word,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          processedResults.push({
            definitionId: result.definitionId,
            word: result.word,
            confidence: result.confidence,
            connected: false,
            error: 'Failed to connect to database',
          });
          failureCount++;
        }
      } else {
        processedResults.push({
          definitionId: result.definitionId,
          word: null,
          confidence: 0,
          connected: false,
          error: result.error || 'Word extraction failed',
        });
        failureCount++;
      }
    }

    await serverLog('Batch word extraction completed', 'info', {
      totalProcessed: processedResults.length,
      successCount,
      failureCount,
      totalTokens: batchResult.totalTokensUsed.total,
      totalCost: batchResult.cost,
    });

    return {
      success: true,
      data: {
        results: processedResults,
        totalTokensUsed: batchResult.totalTokensUsed.total,
        totalCost: batchResult.cost,
        successCount,
        failureCount,
      },
    };
  } catch (error) {
    await serverLog('Batch word extraction failed', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      definitionIds: definitionIds,
    });

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input parameters' };
    }

    // Handle specific DeepSeek API errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient balance')) {
        return {
          success: false,
          error:
            'DeepSeek API: Insufficient balance. Please add credits to your DeepSeek account to continue using word extraction.',
        };
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          success: false,
          error:
            'DeepSeek API: Rate limit exceeded. Please wait a moment and try again.',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Find existing word or create new one
 */
async function findOrCreateWord(wordText: string, languageCode: LanguageCode) {
  try {
    // Try to find existing word
    let word = await prisma.word.findFirst({
      where: {
        word: wordText.toLowerCase().trim(),
        languageCode,
      },
    });

    // Create new word if not found
    if (!word) {
      word = await prisma.word.create({
        data: {
          word: wordText.toLowerCase().trim(),
          languageCode,
          sourceEntityId: `deepseek-${Date.now()}`,
        },
      });

      await serverLog('Created new word via DeepSeek', 'info', {
        wordId: word.id,
        word: word.word,
        languageCode,
      });
    }

    return word;
  } catch (error) {
    await serverLog('Failed to find or create word', 'error', {
      wordText,
      languageCode,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw handlePrismaError(error);
  }
}

/**
 * Connect definition to word via DefinitionToOneWord table
 */
async function connectDefinitionToWord(definitionId: number, wordId: number) {
  try {
    // Check if connection already exists
    const existingConnection = await prisma.definitionToOneWord.findUnique({
      where: {
        definitionId_wordId: {
          definitionId,
          wordId,
        },
      },
    });

    if (existingConnection) {
      await serverLog('Definition-word connection already exists', 'info', {
        definitionId,
        wordId,
      });
      return existingConnection;
    }

    // Create new connection
    const connection = await prisma.definitionToOneWord.create({
      data: {
        definitionId,
        wordId,
      },
    });

    await serverLog('Created definition-word connection', 'info', {
      definitionId,
      wordId,
    });

    return connection;
  } catch (error) {
    await serverLog('Failed to connect definition to word', 'error', {
      definitionId,
      wordId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw handlePrismaError(error);
  }
}

/**
 * Get existing word connections for definitions
 */
export async function getDefinitionWordConnections(definitionIds: number[]) {
  try {
    const connections = await prisma.definitionToOneWord.findMany({
      where: {
        definitionId: { in: definitionIds },
      },
      include: {
        word: {
          select: {
            id: true,
            word: true,
            languageCode: true,
          },
        },
      },
    });

    return connections.reduce(
      (acc, conn) => {
        acc[conn.definitionId] = {
          wordId: conn.word.id,
          word: conn.word.word,
          languageCode: conn.word.languageCode,
        };
        return acc;
      },
      {} as Record<
        number,
        { wordId: number; word: string; languageCode: string }
      >,
    );
  } catch (error) {
    await serverLog('Failed to get definition-word connections', 'error', {
      definitionIds,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw handlePrismaError(error);
  }
}

/**
 * Fetch all definitions for selected WordDetails
 * Used by DeepSeek dialog to show all definitions with checkboxes
 */
export async function getDefinitionsForWordDetails(
  wordDetailIds: number[],
): Promise<WordDetailWithDefinitions[]> {
  try {
    await serverLog('Fetching definitions for WordDetails', 'info', {
      wordDetailIds,
      count: wordDetailIds.length,
    });

    const wordDetails = await prisma.wordDetails.findMany({
      where: {
        id: {
          in: wordDetailIds,
        },
      },
      include: {
        word: {
          select: {
            word: true,
          },
        },
        definitions: {
          include: {
            definition: {
              select: {
                id: true,
                definition: true,
                languageCode: true,
              },
            },
          },
        },
      },
      orderBy: [
        { word: { word: 'asc' } },
        { partOfSpeech: 'asc' },
        { variant: 'asc' },
      ],
    });

    const result: WordDetailWithDefinitions[] = wordDetails.map((wd) => ({
      id: wd.id,
      wordText: wd.word.word,
      partOfSpeech: wd.partOfSpeech,
      variant: wd.variant,
      definitions: wd.definitions.map((def) => ({
        id: def.definition.id,
        definition: def.definition.definition,
        languageCode: def.definition.languageCode,
        wordDetailsId: wd.id,
        wordText: wd.word.word,
        partOfSpeech: wd.partOfSpeech,
        variant: wd.variant,
        selected: true, // Default to selected
      })),
    }));

    await serverLog(
      'Successfully fetched definitions for WordDetails',
      'info',
      {
        wordDetailsCount: result.length,
        totalDefinitions: result.reduce(
          (sum, wd) => sum + wd.definitions.length,
          0,
        ),
      },
    );

    return result;
  } catch (error) {
    await serverLog('Error fetching definitions for WordDetails', 'error', {
      error: error instanceof Error ? error.message : String(error),
      wordDetailIds,
    });
    throw new Error('Failed to fetch definitions for WordDetails');
  }
}
