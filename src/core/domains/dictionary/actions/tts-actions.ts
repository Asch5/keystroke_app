'use server';

import { revalidatePath } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/shared/database/client';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  blobStorageService,
  type AudioMetadata,
} from '@/core/shared/services/external-apis/blobStorageService';
import {
  textToSpeechService,
  getAvailableGendersForLanguage,
  getDefaultGenderForLanguage,
  type TTSRequest,
  type TTSUsageStats,
} from '@/core/shared/services/external-apis/textToSpeechService';
import { LanguageCode } from '@/core/types';

export interface GenerateTTSResult {
  success: boolean;
  audioUrl?: string;
  message: string;
  cached?: boolean;
  estimatedCost?: number;
  voiceUsed?: string;
}

export interface TTSBatchResult {
  success: boolean;
  processed: number;
  failed: number;
  totalCost: number;
  results: GenerateTTSResult[];
  message: string;
}

/**
 * Generate speech for a word and save to blob storage and database
 */
export async function generateWordTTS(
  wordId: number,
  languageCode: LanguageCode,
  options?: {
    qualityLevel?: 'standard' | 'high' | 'premium';
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    overwriteExisting?: boolean;
  },
): Promise<GenerateTTSResult> {
  try {
    void serverLog(
      `Starting TTS generation for word ID: ${wordId}, language: ${languageCode}`,
      'info',
    );

    // Get word details with audio relationships
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: {
        word: true,
        details: {
          select: {
            id: true,
            audioLinks: {
              select: {
                audio: {
                  select: {
                    url: true,
                    id: true,
                  },
                },
                isPrimary: true,
              },
            },
          },
        },
      },
    });

    if (!word) {
      void serverLog(`Word not found for ID: ${wordId}`, 'error');
      return {
        success: false,
        message: 'Word not found',
      };
    }

    void serverLog(
      `Found word: "${word.word}" with ${word.details.length} details`,
      'info',
    );

    // Check if audio already exists
    const existingAudio = word.details
      .flatMap((d) => d.audioLinks)
      .find((link) => link.isPrimary);

    if (existingAudio && !options?.overwriteExisting) {
      void serverLog(
        `Audio already exists for word "${word.word}", skipping`,
        'info',
      );
      return {
        success: false,
        message:
          'Audio already exists. Use overwriteExisting option to replace.',
      };
    }

    // Generate speech
    const ttsRequest: TTSRequest = {
      text: word.word,
      languageCode,
      qualityLevel: options?.qualityLevel ?? 'high',
      ...(options?.ssmlGender && { ssmlGender: options.ssmlGender }),
      cacheKey: `word_${wordId}_${languageCode}_${word.word}`,
    };

    void serverLog(
      `Generating TTS for "${word.word}" with quality: ${ttsRequest.qualityLevel}`,
      'info',
    );
    const ttsResponse = await textToSpeechService.generateSpeech(ttsRequest);
    void serverLog(
      `TTS response received, cached: ${ttsResponse.cached}, cost: $${ttsResponse.estimatedCost}`,
      'info',
    );

    // If not cached, upload to blob storage
    let audioUrl: string;

    if (!ttsResponse.cached || !existingAudio) {
      // Prepare metadata for blob storage
      const audioMetadata: AudioMetadata = {
        wordId,
        languageCode,
        qualityLevel: options?.qualityLevel ?? 'high',
        voiceGender: options?.ssmlGender ?? 'FEMALE',
        characterCount: ttsResponse.characterCount,
      };

      void serverLog(
        `Uploading audio to blob storage for word "${word.word}"`,
        'info',
      );
      // Upload to blob storage
      const uploadResult = await blobStorageService.uploadAudio(
        ttsResponse.audioContent,
        audioMetadata,
        'audio/mp3',
      );

      if (!uploadResult.success) {
        void serverLog(
          `Failed to upload audio: ${uploadResult.error}`,
          'error',
        );
        return {
          success: false,
          message: `Failed to upload audio: ${uploadResult.error}`,
        };
      }

      audioUrl = uploadResult.url!;
      void serverLog(`Audio uploaded successfully to: ${audioUrl}`, 'info');

      // Delete old audio if it exists and we're overwriting
      if (existingAudio && options?.overwriteExisting) {
        void serverLog(
          `Deleting existing audio for word "${word.word}"`,
          'info',
        );
        const audioInfo = blobStorageService.getAudioInfo(
          existingAudio.audio.url,
        );
        if (audioInfo.isVercelBlob) {
          await blobStorageService.deleteAudio(existingAudio.audio.url);
        }
        // Delete the old audio record
        await prisma.audio.delete({
          where: { id: existingAudio.audio.id },
        });
      }

      // Create new audio record and link it to word details
      void serverLog(
        `Creating audio record in database for word "${word.word}"`,
        'info',
      );
      const newAudio = await prisma.audio.create({
        data: {
          url: audioUrl,
          source: 'ai_generated',
          languageCode,
          note: `Generated by TTS (${options?.qualityLevel ?? 'high'} quality)`,
        },
      });

      // Link to the first word details
      if (word.details && word.details.length > 0) {
        const firstWordDetail = word.details[0];
        if (firstWordDetail) {
          await prisma.wordDetailsAudio.create({
            data: {
              wordDetailsId: firstWordDetail.id,
              audioId: newAudio.id,
              isPrimary: true,
            },
          });
          void serverLog(
            `Audio linked to word details for word "${word.word}"`,
            'info',
          );
        }
      } else {
        void serverLog(
          `Warning: No word details found for word "${word.word}" to link audio`,
          'warn',
        );
      }
    } else {
      audioUrl = existingAudio.audio.url;
      void serverLog(
        `Using existing audio URL for word "${word.word}": ${audioUrl}`,
        'info',
      );
    }

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    void serverLog(
      `TTS generation completed successfully for word "${word.word}"`,
      'info',
    );
    return {
      success: true,
      audioUrl,
      message: `Speech generated successfully for "${word.word}"`,
      cached: ttsResponse.cached,
      estimatedCost: ttsResponse.estimatedCost,
      voiceUsed: ttsResponse.voiceUsed,
    };
  } catch (error) {
    void serverLog(
      `Error generating word TTS for ID ${wordId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    const handledError = handlePrismaError(error);

    return {
      success: false,
      message: handledError.message,
    };
  }
}

/**
 * Generate speech for a definition and save to blob storage and database
 */
export async function generateDefinitionTTS(
  definitionId: number,
  languageCode: LanguageCode,
  options?: {
    qualityLevel?: 'standard' | 'high' | 'premium';
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    overwriteExisting?: boolean;
  },
): Promise<GenerateTTSResult> {
  try {
    // Get definition details with audio relationships
    const definition = await prisma.definition.findUnique({
      where: { id: definitionId },
      select: {
        definition: true,
        audioLinks: {
          select: {
            audio: {
              select: {
                url: true,
                id: true,
              },
            },
            isPrimary: true,
          },
        },
      },
    });

    if (!definition) {
      return {
        success: false,
        message: 'Definition not found',
      };
    }

    // Check if audio already exists
    const existingAudio = definition.audioLinks.find((link) => link.isPrimary);

    if (existingAudio && !options?.overwriteExisting) {
      return {
        success: false,
        message:
          'Audio already exists. Use overwriteExisting option to replace.',
      };
    }

    // Generate speech
    const ttsRequest: TTSRequest = {
      text: definition.definition,
      languageCode,
      qualityLevel: options?.qualityLevel ?? 'standard', // Use standard for definitions to save costs
      ...(options?.ssmlGender && { ssmlGender: options.ssmlGender }),
      cacheKey: `definition_${definitionId}_${languageCode}_${definition.definition.substring(0, 50)}`,
    };

    const ttsResponse = await textToSpeechService.generateSpeech(ttsRequest);

    // If not cached, upload to blob storage
    let audioUrl: string;

    if (!ttsResponse.cached || !existingAudio) {
      // Prepare metadata for blob storage
      const audioMetadata: AudioMetadata = {
        definitionId,
        languageCode,
        qualityLevel: options?.qualityLevel ?? 'standard',
        voiceGender: options?.ssmlGender ?? 'FEMALE',
        characterCount: ttsResponse.characterCount,
      };

      // Upload to blob storage
      const uploadResult = await blobStorageService.uploadAudio(
        ttsResponse.audioContent,
        audioMetadata,
        'audio/mp3',
      );

      if (!uploadResult.success) {
        return {
          success: false,
          message: `Failed to upload audio: ${uploadResult.error}`,
        };
      }

      audioUrl = uploadResult.url!;

      // Delete old audio if it exists and we're overwriting
      if (existingAudio && options?.overwriteExisting) {
        const audioInfo = blobStorageService.getAudioInfo(
          existingAudio.audio.url,
        );
        if (audioInfo.isVercelBlob) {
          await blobStorageService.deleteAudio(existingAudio.audio.url);
        }
        // Delete the old audio record
        await prisma.audio.delete({
          where: { id: existingAudio.audio.id },
        });
      }

      // Create new audio record and link it to definition
      const newAudio = await prisma.audio.create({
        data: {
          url: audioUrl,
          source: 'ai_generated',
          languageCode,
          note: `Generated by TTS (${options?.qualityLevel ?? 'standard'} quality)`,
        },
      });

      // Link to definition
      await prisma.definitionAudio.create({
        data: {
          definitionId,
          audioId: newAudio.id,
          isPrimary: true,
        },
      });
    } else {
      audioUrl = existingAudio.audio.url;
    }

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: true,
      audioUrl,
      message: `Speech generated successfully for definition`,
      cached: ttsResponse.cached,
      estimatedCost: ttsResponse.estimatedCost,
      voiceUsed: ttsResponse.voiceUsed,
    };
  } catch (error) {
    void serverLog(
      `Error generating definition TTS for ID ${definitionId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    const handledError = handlePrismaError(error);

    return {
      success: false,
      message: handledError.message,
    };
  }
}

/**
 * Generate speech for an example and save to blob storage and database
 */
export async function generateExampleTTS(
  exampleId: number,
  languageCode: LanguageCode,
  options?: {
    qualityLevel?: 'standard' | 'high' | 'premium';
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    overwriteExisting?: boolean;
  },
): Promise<GenerateTTSResult> {
  try {
    // Get example details with audio relationships
    const example = await prisma.definitionExample.findUnique({
      where: { id: exampleId },
      select: {
        example: true,
        audioLinks: {
          select: {
            audio: {
              select: {
                url: true,
                id: true,
              },
            },
            isPrimary: true,
          },
        },
      },
    });

    if (!example) {
      return {
        success: false,
        message: 'Example not found',
      };
    }

    // Check if audio already exists
    const existingAudio = example.audioLinks.find((link) => link.isPrimary);

    if (existingAudio && !options?.overwriteExisting) {
      return {
        success: false,
        message:
          'Audio already exists. Use overwriteExisting option to replace.',
      };
    }

    // Generate speech
    const ttsRequest: TTSRequest = {
      text: example.example,
      languageCode,
      qualityLevel: options?.qualityLevel ?? 'standard', // Use standard for examples to save costs
      ...(options?.ssmlGender && { ssmlGender: options.ssmlGender }),
      cacheKey: `example_${exampleId}_${languageCode}_${example.example.substring(0, 50)}`,
    };

    const ttsResponse = await textToSpeechService.generateSpeech(ttsRequest);

    // If not cached, upload to blob storage
    let audioUrl: string;

    if (!ttsResponse.cached || !existingAudio) {
      // Prepare metadata for blob storage
      const audioMetadata: AudioMetadata = {
        exampleId,
        languageCode,
        qualityLevel: options?.qualityLevel ?? 'standard',
        voiceGender: options?.ssmlGender ?? 'FEMALE',
        characterCount: ttsResponse.characterCount,
      };

      // Upload to blob storage
      const uploadResult = await blobStorageService.uploadAudio(
        ttsResponse.audioContent,
        audioMetadata,
        'audio/mp3',
      );

      if (!uploadResult.success) {
        return {
          success: false,
          message: `Failed to upload audio: ${uploadResult.error}`,
        };
      }

      audioUrl = uploadResult.url!;

      // Delete old audio if it exists and we're overwriting
      if (existingAudio && options?.overwriteExisting) {
        const audioInfo = blobStorageService.getAudioInfo(
          existingAudio.audio.url,
        );
        if (audioInfo.isVercelBlob) {
          await blobStorageService.deleteAudio(existingAudio.audio.url);
        }
        // Delete the old audio record
        await prisma.audio.delete({
          where: { id: existingAudio.audio.id },
        });
      }

      // Create new audio record and link it to example
      const newAudio = await prisma.audio.create({
        data: {
          url: audioUrl,
          source: 'ai_generated',
          languageCode,
          note: `Generated by TTS (${options?.qualityLevel ?? 'standard'} quality)`,
        },
      });

      // Link to example
      await prisma.exampleAudio.create({
        data: {
          exampleId,
          audioId: newAudio.id,
          isPrimary: true,
        },
      });
    } else {
      audioUrl = existingAudio.audio.url;
    }

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: true,
      audioUrl,
      message: `Speech generated successfully for example`,
      cached: ttsResponse.cached,
      estimatedCost: ttsResponse.estimatedCost,
      voiceUsed: ttsResponse.voiceUsed,
    };
  } catch (error) {
    void serverLog(
      `Error generating example TTS for ID ${exampleId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    const handledError = handlePrismaError(error);

    return {
      success: false,
      message: handledError.message,
    };
  }
}

/**
 * Generate TTS for multiple words in batch
 */
export async function generateBatchWordTTS(
  wordIds: number[],
  languageCode: LanguageCode,
  options?: {
    qualityLevel?: 'standard' | 'high' | 'premium';
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    overwriteExisting?: boolean;
    maxConcurrent?: number;
  },
): Promise<TTSBatchResult> {
  const maxConcurrent = options?.maxConcurrent ?? 5; // Respect API rate limits
  const results: GenerateTTSResult[] = [];
  let processed = 0;
  let failed = 0;
  let totalCost = 0;

  void serverLog(
    `Starting batch TTS generation for ${wordIds.length} words: [${wordIds.join(', ')}]`,
    'info',
  );
  void serverLog(`Batch options: ${JSON.stringify(options)}`, 'info');

  try {
    // First, validate that all word IDs exist in the database
    void serverLog('Validating word IDs exist in database...', 'info');
    const existingWords = await prisma.word.findMany({
      where: {
        id: { in: wordIds },
      },
      select: {
        id: true,
        word: true,
      },
    });

    const existingWordIds = new Set(existingWords.map((w) => w.id));
    const validWordIds = wordIds.filter((id) => existingWordIds.has(id));
    const invalidWordIds = wordIds.filter((id) => !existingWordIds.has(id));

    if (invalidWordIds.length > 0) {
      void serverLog(
        `Found ${invalidWordIds.length} invalid word IDs: [${invalidWordIds.join(', ')}]. These will be skipped.`,
        'warn',
      );

      // Add failed results for invalid IDs
      for (const invalidId of invalidWordIds) {
        results.push({
          success: false,
          message: 'Word not found in database',
        });
        failed++;
        void serverLog(
          `Word ${invalidId} result: FAILED - Word not found in database`,
          'error',
        );
      }
    }

    if (validWordIds.length === 0) {
      const errorMsg =
        'No valid word IDs found. All requested words have been deleted or do not exist.';
      void serverLog(errorMsg, 'error');
      return {
        success: false,
        processed: 0,
        failed: wordIds.length,
        totalCost: 0,
        results,
        message: errorMsg,
      };
    }

    void serverLog(
      `Processing ${validWordIds.length} valid words out of ${wordIds.length} requested`,
      'info',
    );

    // Process in batches to respect rate limits
    for (let i = 0; i < validWordIds.length; i += maxConcurrent) {
      const batch = validWordIds.slice(i, i + maxConcurrent);
      void serverLog(
        `Processing batch ${Math.floor(i / maxConcurrent) + 1}: words [${batch.join(', ')}]`,
        'info',
      );

      const batchPromises = batch.map((wordId) => {
        void serverLog(`Creating promise for word ID: ${wordId}`, 'info');
        return generateWordTTS(wordId, languageCode, options);
      });

      void serverLog(
        `Waiting for ${batchPromises.length} promises to resolve`,
        'info',
      );
      const batchResults = await Promise.allSettled(batchPromises);
      void serverLog(
        `Batch results received: ${batchResults.length} results`,
        'info',
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const wordId = batch[j];

        if (result && result.status === 'fulfilled') {
          void serverLog(
            `Word ${wordId} result: ${result.value.success ? 'SUCCESS' : 'FAILED'} - ${result.value.message}`,
            result.value.success ? 'info' : 'error',
          );
          results.push(result.value);
          if (result.value.success) {
            processed++;
            totalCost += result.value.estimatedCost ?? 0;
          } else {
            failed++;
            void serverLog(
              `Word ${wordId} failed with message: ${result.value.message}`,
              'error',
            );
          }
        } else if (result && result.status === 'rejected') {
          failed++;
          const errorMsg = `Error: ${result.reason}`;
          void serverLog(
            `Word ${wordId} promise rejected: ${errorMsg}`,
            'error',
          );
          results.push({
            success: false,
            message: errorMsg,
          });
        } else {
          failed++;
          const errorMsg = `Error: Unknown result status`;
          void serverLog(`Word ${wordId} unknown error: ${errorMsg}`, 'error');
          results.push({
            success: false,
            message: errorMsg,
          });
        }
      }

      void serverLog(
        `Batch ${Math.floor(i / maxConcurrent) + 1} completed. Processed: ${processed}, Failed: ${failed}`,
        'info',
      );

      // Add delay between batches to respect rate limits (1000 requests/minute = ~16 requests/second)
      if (i + maxConcurrent < validWordIds.length) {
        void serverLog(
          `Waiting 1 second before next batch to respect rate limits`,
          'info',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const finalMessage = `Batch TTS generation completed. ${processed} successful, ${failed} failed. Total cost: $${totalCost.toFixed(4)}`;
    void serverLog(finalMessage, processed > 0 ? 'info' : 'warn');

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: processed > 0,
      processed,
      failed,
      totalCost,
      results,
      message: finalMessage,
    };
  } catch (error) {
    const errorMsg = `Batch TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    void serverLog(errorMsg, 'error');
    console.error('Error in batch TTS generation:', error);
    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }
    return {
      success: false,
      processed,
      failed: wordIds.length - processed,
      totalCost,
      results,
      message: errorMsg,
    };
  }
}

/**
 * Delete audio file associated with a word
 */
export async function deleteWordAudio(
  wordId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: {
        word: true,
        details: {
          select: {
            audioLinks: {
              select: {
                audio: {
                  select: {
                    url: true,
                    id: true,
                  },
                },
                isPrimary: true,
              },
            },
          },
        },
      },
    });

    if (!word) {
      return {
        success: false,
        message: 'Word not found',
      };
    }

    // Find primary audio
    const primaryAudio = word.details
      .flatMap((d) => d.audioLinks)
      .find((link) => link.isPrimary);

    if (!primaryAudio) {
      return {
        success: false,
        message: 'No audio file found for this word',
      };
    }

    // Delete from blob storage if it's a Vercel blob
    const audioInfo = blobStorageService.getAudioInfo(primaryAudio.audio.url);
    if (audioInfo.isVercelBlob) {
      await blobStorageService.deleteAudio(primaryAudio.audio.url);
    }

    // Delete the audio record (this will cascade delete the relationship)
    await prisma.audio.delete({
      where: { id: primaryAudio.audio.id },
    });

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: true,
      message: 'Audio file deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting word audio:', error);
    return {
      success: false,
      message: `Failed to delete audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get TTS usage statistics
 */
export async function getTTSUsageStats(): Promise<TTSUsageStats> {
  return textToSpeechService.getUsageStats();
}

/**
 * Reset TTS usage statistics (admin only)
 */
export async function resetTTSUsageStats(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    textToSpeechService.resetUsageStats();
    return {
      success: true,
      message: 'TTS usage statistics reset successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to reset statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get available TTS quality levels
 */
export async function getTTSQualityLevels() {
  return textToSpeechService.getQualityLevels();
}

/**
 * Validate that word IDs exist in the database
 */
export async function validateWordIdsExist(wordIds: number[]): Promise<{
  validIds: number[];
  invalidIds: number[];
  existingWords: { id: number; word: string }[];
}> {
  try {
    const existingWords = await prisma.word.findMany({
      where: {
        id: { in: wordIds },
      },
      select: {
        id: true,
        word: true,
      },
    });

    const existingWordIds = new Set(existingWords.map((w) => w.id));
    const validIds = wordIds.filter((id) => existingWordIds.has(id));
    const invalidIds = wordIds.filter((id) => !existingWordIds.has(id));

    return {
      validIds,
      invalidIds,
      existingWords,
    };
  } catch (error) {
    void serverLog(
      `Error validating word IDs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error',
    );
    // If there's an error, assume all IDs are invalid for safety
    return {
      validIds: [],
      invalidIds: wordIds,
      existingWords: [],
    };
  }
}

/**
 * Clean up orphaned audio files (admin utility)
 */
export async function cleanupOrphanedAudio(): Promise<{
  success: boolean;
  message: string;
  cleaned: number;
}> {
  try {
    // This would require implementing a blob listing feature
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Audio cleanup functionality not yet implemented',
      cleaned: 0,
    };
  } catch (error) {
    return {
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      cleaned: 0,
    };
  }
}

/**
 * Get available voice genders for a specific language
 */
export async function getAvailableVoiceGenders(
  languageCode: string,
): Promise<('MALE' | 'FEMALE' | 'NEUTRAL')[]> {
  return getAvailableGendersForLanguage(languageCode);
}

/**
 * Get the default voice gender for a specific language
 */
export async function getDefaultVoiceGender(
  languageCode: string,
): Promise<'MALE' | 'FEMALE' | 'NEUTRAL' | null> {
  return getDefaultGenderForLanguage(languageCode);
}
