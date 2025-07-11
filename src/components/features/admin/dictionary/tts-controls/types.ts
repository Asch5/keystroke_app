/**
 * Types for TTSControls modular components
 */

import { DictionaryWordDetails } from '@/core/domains/dictionary/actions';
import { LanguageCode } from '@/core/types';

export interface TTSControlsProps {
  selectedWords: Set<string>;
  selectedLanguage: LanguageCode;
  wordDetails: DictionaryWordDetails[];
  onAudioGenerated?: () => void;
}

export interface TTSStats {
  totalCharacters: number;
  charactersByVoiceType: Record<string, number>;
  estimatedCost: number;
  remainingFreeQuota: Record<string, number>;
  lastReset: Date;
}

export interface QualityLevel {
  name: string;
  description: string;
  costPerCharacter: number;
  freeLimit: number;
}

export type QualityLevelType = 'standard' | 'high' | 'premium';
export type VoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export interface TTSSettings {
  qualityLevel: QualityLevelType;
  ssmlGender: VoiceGender;
  overwriteExisting: boolean;
}

export interface QualitySelectionProps {
  qualityLevel: QualityLevelType;
  onQualityChange: (level: QualityLevelType) => void;
  qualityLevels: Record<string, QualityLevel>;
  ttsStats: TTSStats | null;
}

export interface VoiceGenderSelectionProps {
  ssmlGender: VoiceGender;
  onGenderChange: (gender: VoiceGender) => void;
  availableGenders: VoiceGender[];
}

export interface GenerationOptionsProps {
  overwriteExisting: boolean;
  onOverwriteChange: (overwrite: boolean) => void;
}

export interface UsageStatsProps {
  ttsStats: TTSStats | null;
}

export interface GenerationProgressProps {
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
}

export interface TTSActionsProps {
  selectedWords: Set<string>;
  isGenerating: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}
