/**
 * Vercel Blob Storage Service
 *
 * Handles uploading and managing audio files in Vercel Blob storage
 */

import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export interface AudioUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface AudioMetadata {
  wordId?: number;
  definitionId?: number;
  exampleId?: number;
  languageCode: string;
  qualityLevel: string;
  voiceGender: string;
  characterCount: number;
}

class BlobStorageService {
  private readonly token: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
    }
  }

  /**
   * Upload audio content to Vercel Blob storage
   */
  async uploadAudio(
    audioContent: string, // base64 encoded audio
    metadata: AudioMetadata,
    contentType: string = 'audio/mp3',
  ): Promise<AudioUploadResult> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioContent, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID for shorter filename

      let filename: string;
      if (metadata.wordId) {
        filename = `audio/words/${metadata.languageCode}/word-${metadata.wordId}-${timestamp}-${uniqueId}.mp3`;
      } else if (metadata.definitionId) {
        filename = `audio/definitions/${metadata.languageCode}/def-${metadata.definitionId}-${timestamp}-${uniqueId}.mp3`;
      } else if (metadata.exampleId) {
        filename = `audio/examples/${metadata.languageCode}/ex-${metadata.exampleId}-${timestamp}-${uniqueId}.mp3`;
      } else {
        filename = `audio/misc/${metadata.languageCode}/audio-${timestamp}-${uniqueId}.mp3`;
      }

      // Upload to Vercel Blob
      const blob = await put(filename, audioBuffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false, // We're already adding our own unique identifier
      });

      return {
        success: true,
        url: blob.url,
      };
    } catch (error) {
      console.error('Error uploading audio to blob storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Delete audio file from Vercel Blob storage
   */
  async deleteAudio(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error('Error deleting audio from blob storage:', error);
      return false;
    }
  }

  /**
   * Get optimized filename for audio file
   */
  private generateFilename(metadata: AudioMetadata): string {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];

    if (metadata.wordId) {
      return `audio/words/${metadata.languageCode}/word-${metadata.wordId}-${timestamp}-${uniqueId}.mp3`;
    } else if (metadata.definitionId) {
      return `audio/definitions/${metadata.languageCode}/def-${metadata.definitionId}-${timestamp}-${uniqueId}.mp3`;
    } else if (metadata.exampleId) {
      return `audio/examples/${metadata.languageCode}/ex-${metadata.exampleId}-${timestamp}-${uniqueId}.mp3`;
    } else {
      return `audio/misc/${metadata.languageCode}/audio-${timestamp}-${uniqueId}.mp3`;
    }
  }

  /**
   * Validate audio content
   */
  private validateAudioContent(audioContent: string): boolean {
    // Basic validation for base64 audio content
    if (!audioContent || audioContent.length === 0) {
      return false;
    }

    // Check if it's valid base64
    try {
      Buffer.from(audioContent, 'base64');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get audio file info from URL
   */
  getAudioInfo(url: string): {
    isVercelBlob: boolean;
    filename?: string;
    type?: 'word' | 'definition' | 'example' | 'misc';
  } {
    const isVercelBlob = url.includes('public.blob.vercel-storage.com');

    if (!isVercelBlob) {
      return { isVercelBlob: false };
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Determine type from path
    let type: 'word' | 'definition' | 'example' | 'misc' = 'misc';
    if (url.includes('/words/')) {
      type = 'word';
    } else if (url.includes('/definitions/')) {
      type = 'definition';
    } else if (url.includes('/examples/')) {
      type = 'example';
    }

    return {
      isVercelBlob: true,
      ...(filename && { filename }),
      type,
    };
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();
