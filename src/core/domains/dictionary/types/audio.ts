import { SourceType, LanguageCode } from '@/core/types';

/**
 * Audio types for dictionary domain
 */

// Basic audio file interface
export interface AudioFile {
  url: string;
  word?: string | null;
  audio_type?: string | null;
  phonetic_audio?: string | null;
  note?: string | null;
}

// Audio update data for API requests
export interface AudioUpdateData {
  id?: number | undefined;
  url: string;
  note?: string | null | undefined;
  source: SourceType;
  languageCode: LanguageCode;
  isPrimary?: boolean;
}
