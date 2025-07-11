/**
 * Audio Download Service
 *
 * Downloads audio files from external URLs and stores them in Vercel Blob storage
 */

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { blobStorageService, type AudioMetadata } from './blobStorageService';

export interface ExternalAudioDownloadResult {
  success: boolean;
  localUrl?: string;
  originalUrl?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface ExternalAudioFile {
  url: string;
  note?: string;
  word?: string;
}

class AudioDownloadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  private readonly SUPPORTED_CONTENT_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/x-wav',
    'audio/x-mpeg',
  ];
  private readonly TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Download audio from external URL and store in blob storage
   */
  async downloadAndStoreAudio(
    externalUrl: string,
    metadata: AudioMetadata,
  ): Promise<ExternalAudioDownloadResult> {
    try {
      void serverLog(
        `Starting audio download from external URL: ${externalUrl}`,
        'info',
      );

      // Check if URL is already from our blob storage
      const audioInfo = blobStorageService.getAudioInfo(externalUrl);
      if (audioInfo.isVercelBlob) {
        void serverLog(
          `Audio is already in blob storage, skipping download: ${externalUrl}`,
          'info',
        );
        return {
          success: true,
          localUrl: externalUrl,
          originalUrl: externalUrl,
          skipped: true,
          reason: 'Already in blob storage',
        };
      }

      // Download the audio file
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const response = await fetch(externalUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Keystroke-App/1.0)',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          void serverLog(
            `Failed to fetch audio: ${response.status} ${response.statusText}`,
            'error',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (
          contentType &&
          !this.SUPPORTED_CONTENT_TYPES.includes(contentType)
        ) {
          void serverLog(
            `Unsupported content type: ${contentType} for URL: ${externalUrl}`,
            'warn',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: `Unsupported content type: ${contentType}`,
          };
        }

        // Check content length
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > this.MAX_FILE_SIZE) {
          void serverLog(
            `Audio file too large: ${contentLength} bytes for URL: ${externalUrl}`,
            'warn',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: `File too large: ${contentLength} bytes`,
          };
        }

        // Get the audio buffer
        const arrayBuffer = await response.arrayBuffer();

        // Double-check size after download
        if (arrayBuffer.byteLength > this.MAX_FILE_SIZE) {
          void serverLog(
            `Downloaded audio file too large: ${arrayBuffer.byteLength} bytes`,
            'warn',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: `Downloaded file too large: ${arrayBuffer.byteLength} bytes`,
          };
        }

        // Convert to base64 for blob storage
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        void serverLog(
          `Downloaded audio file: ${arrayBuffer.byteLength} bytes, uploading to blob storage`,
          'info',
        );

        // Enhance metadata with original URL info
        const enhancedMetadata: AudioMetadata = {
          ...metadata,
          // Add note about original source if not already present
        };

        // Upload to blob storage
        const uploadResult = await blobStorageService.uploadAudio(
          base64Audio,
          enhancedMetadata,
          contentType || 'audio/mp3',
        );

        if (!uploadResult.success) {
          void serverLog(
            `Failed to upload audio to blob storage: ${uploadResult.error}`,
            'error',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: `Upload failed: ${uploadResult.error}`,
          };
        }

        void serverLog(
          `Successfully downloaded and stored audio: ${externalUrl} -> ${uploadResult.url}`,
          'info',
        );

        return {
          success: true,
          localUrl: uploadResult.url!,
          originalUrl: externalUrl,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          void serverLog(
            `Audio download timeout for URL: ${externalUrl}`,
            'warn',
          );
          return {
            success: false,
            originalUrl: externalUrl,
            error: 'Download timeout',
          };
        }

        void serverLog(
          `Error downloading audio from ${externalUrl}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          'error',
        );
        return {
          success: false,
          originalUrl: externalUrl,
          error:
            fetchError instanceof Error
              ? fetchError.message
              : 'Download failed',
        };
      }
    } catch (error) {
      void serverLog(
        `Unexpected error in downloadAndStoreAudio: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
      return {
        success: false,
        originalUrl: externalUrl,
        error: error instanceof Error ? error.message : 'Unexpected error',
      };
    }
  }

  /**
   * Download multiple audio files and store them in blob storage
   */
  async downloadAndStoreBatchAudio(
    audioFiles: ExternalAudioFile[],
    baseMetadata: Omit<AudioMetadata, 'characterCount'>,
  ): Promise<ExternalAudioDownloadResult[]> {
    const results: ExternalAudioDownloadResult[] = [];

    for (const audioFile of audioFiles) {
      const metadata: AudioMetadata = {
        ...baseMetadata,
        characterCount: audioFile.word?.length || audioFile.note?.length || 0,
      };

      const result = await this.downloadAndStoreAudio(audioFile.url, metadata);

      results.push(result);

      // Add small delay between downloads to be respectful
      if (audioFiles.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter((r) => r.success).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.success && !r.skipped).length;

    void serverLog(
      `Batch audio download completed: ${successful} successful, ${skipped} skipped, ${failed} failed`,
      'info',
    );

    return results;
  }

  /**
   * Check if an external URL is downloadable (without actually downloading)
   */
  async checkAudioUrl(url: string): Promise<{
    downloadable: boolean;
    contentType?: string;
    contentLength?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        return {
          downloadable: false,
          error: `HTTP ${response.status}`,
        };
      }

      const contentType = response.headers.get('content-type');
      const contentLengthStr = response.headers.get('content-length');
      const contentLength = contentLengthStr
        ? parseInt(contentLengthStr)
        : undefined;

      return {
        downloadable: true,
        ...(contentType && { contentType }),
        ...(contentLength && { contentLength }),
      };
    } catch (error) {
      return {
        downloadable: false,
        error: error instanceof Error ? error.message : 'Check failed',
      };
    }
  }
}

// Export singleton instance
export const audioDownloadService = new AudioDownloadService();
