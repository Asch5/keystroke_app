import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generateBatchWordTTS,
  getTTSUsageStats,
  getTTSQualityLevels,
  getAvailableVoiceGenders,
  getDefaultVoiceGender,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { LanguageCode } from '@/core/types';
import {
  TTSStats,
  QualityLevel,
  QualityLevelType,
  VoiceGender,
} from '../types';

/**
 * Main state management hook for TTSControls
 * Handles all TTS-related state and operations
 */
export function useTTSState(
  selectedWords: Set<string>,
  selectedLanguage: LanguageCode,
  wordDetails: DictionaryWordDetails[],
  onAudioGenerated?: () => void,
) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qualityLevel, setQualityLevel] = useState<QualityLevelType>('high');
  const [ssmlGender, setSSMLGender] = useState<VoiceGender>('FEMALE');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // State for language-specific gender options
  const [availableGenders, setAvailableGenders] = useState<VoiceGender[]>([]);

  // TTS statistics and quality levels
  const [ttsStats, setTTSStats] = useState<TTSStats | null>(null);
  const [qualityLevels, setQualityLevels] = useState<
    Record<string, QualityLevel>
  >({});

  // Update available genders when language changes
  useEffect(() => {
    const updateGenders = async () => {
      try {
        const genders = await getAvailableVoiceGenders(selectedLanguage);
        setAvailableGenders(genders);

        // Auto-select default gender for the language
        const defaultGender = await getDefaultVoiceGender(selectedLanguage);
        if (defaultGender && genders.includes(defaultGender)) {
          setSSMLGender(defaultGender);
        } else if (genders.length > 0) {
          setSSMLGender(genders[0] as VoiceGender);
        }
      } catch (error) {
        console.error('Failed to load voice genders:', error);
        // Fallback to FEMALE if there's an error
        setAvailableGenders(['FEMALE']);
        setSSMLGender('FEMALE');
      }
    };

    updateGenders();
  }, [selectedLanguage]);

  // Load TTS stats and quality levels
  useEffect(() => {
    const loadTTSData = async () => {
      try {
        const [stats, levels] = await Promise.all([
          getTTSUsageStats(),
          getTTSQualityLevels(),
        ]);
        setTTSStats(stats);
        setQualityLevels(levels);
      } catch (error) {
        console.error('Failed to load TTS data:', error);
      }
    };

    if (isDialogOpen) {
      loadTTSData();
    }
  }, [isDialogOpen]);

  const handleBatchTTS = useCallback(async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus(
        `Starting batch generation for ${selectedWords.size} words...`,
      );

      // Convert WordDetails IDs to Word IDs
      const selectedWordDetailsIds = Array.from(selectedWords);
      const wordIdsMap = new Map(
        wordDetails.map((detail) => [detail.id.toString(), detail.wordId]),
      );

      const wordIds = selectedWordDetailsIds
        .map((detailId) => wordIdsMap.get(detailId))
        .filter((wordId): wordId is number => wordId !== undefined);

      // Validate that word IDs are valid numbers
      const validWordIds = wordIds.filter((id) => !isNaN(id) && id > 0);

      if (validWordIds.length === 0) {
        toast.error('No valid word IDs found');
        return;
      }

      if (validWordIds.length < selectedWords.size) {
        const skippedCount = selectedWords.size - validWordIds.length;
        toast.warning(
          `${skippedCount} selected items could not be mapped to valid words`,
        );
      }

      setGenerationStatus(`Validating ${validWordIds.length} word IDs...`);

      // Start batch generation
      const result = await generateBatchWordTTS(
        validWordIds,
        selectedLanguage,
        {
          qualityLevel,
          ssmlGender,
          overwriteExisting,
          maxConcurrent: 3, // Conservative to respect rate limits
        },
      );

      // Provide detailed feedback based on results
      if (result.processed > 0) {
        const successMsg = `Successfully generated audio for ${result.processed} words`;
        const failureNote =
          result.failed > 0 ? ` (${result.failed} failed)` : '';
        const costNote = ` • Cost: $${result.totalCost.toFixed(4)}`;

        toast.success(successMsg + failureNote, {
          description: costNote,
          duration: 5000,
        });

        onAudioGenerated?.();
        setIsDialogOpen(false);
      } else if (result.failed > 0) {
        const failureReasons = new Set(result.results.map((r) => r.message));
        const reasonsList = Array.from(failureReasons).join(', ');

        toast.error(`All ${result.failed} words failed to generate audio`, {
          description: `Common reasons: ${reasonsList}`,
          duration: 7000,
        });
      } else {
        toast.error(result.message);
      }

      // Update stats
      const updatedStats = await getTTSUsageStats();
      setTTSStats(updatedStats);
    } catch (error) {
      toast.error('Batch TTS generation failed');
      console.error('Batch TTS error:', error);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  }, [
    selectedWords,
    selectedLanguage,
    wordDetails,
    qualityLevel,
    ssmlGender,
    overwriteExisting,
    onAudioGenerated,
  ]);

  const getQualityInfo = useCallback(() => {
    if (!qualityLevels[qualityLevel]) return null;

    const level = qualityLevels[qualityLevel];
    return {
      name: level.name,
      description: level.description,
      costPerChar: level.costPerCharacter,
      freeLimit: level.freeLimit,
      remaining: ttsStats?.remainingFreeQuota[qualityLevel] ?? 0,
    };
  }, [qualityLevels, qualityLevel, ttsStats]);

  return {
    // Dialog state
    isDialogOpen,
    setIsDialogOpen,

    // TTS settings
    qualityLevel,
    setQualityLevel,
    ssmlGender,
    setSSMLGender,
    overwriteExisting,
    setOverwriteExisting,

    // Generation state
    isGenerating,
    generationStatus,
    generationProgress,

    // Data
    availableGenders,
    ttsStats,
    qualityLevels,

    // Actions
    handleBatchTTS,
    getQualityInfo,
  };
}
