'use client';

import { useState, useCallback, useEffect } from 'react';

export interface VocabularyPracticeSettings {
  // Session Configuration
  wordsCount: number;
  difficultyLevel: number;

  // Exercise Type Selection
  enableRememberTranslation: boolean;
  enableChooseRightWord: boolean;
  enableMakeUpWord: boolean;
  enableWriteByDefinition: boolean;
  enableWriteBySound: boolean;

  // Exercise Configuration
  makeUpWordMaxAttempts: number;
  makeUpWordTimeLimit: number; // seconds per word for Make Up Word exercise
  makeUpWordAdditionalCharacters: number; // extra characters beyond what's needed
  showWordCardFirst: boolean;
  autoAdvanceFromWordCard: boolean;
  autoAdvanceDelaySeconds: number;

  // Time Settings
  enableTimeLimit: boolean;
  timeLimitSeconds: number;

  // Audio Settings
  autoPlayAudioOnWordCard: boolean;
  autoPlayAudioOnGameStart: boolean;
  enableGameSounds: boolean;
  gameSoundVolume: number;

  // Display Settings
  showProgressBar: boolean;
  showDefinitionImages: boolean;
  showPhoneticPronunciation: boolean;
  showPartOfSpeech: boolean;
  showLearningStatus: boolean;

  // Behavior Settings
  pauseOnIncorrectAnswer: boolean;
  showCorrectAnswerOnMistake: boolean;
  allowSkipDifficultWords: boolean;
  adaptiveDifficulty: boolean;
}

const DEFAULT_SETTINGS: VocabularyPracticeSettings = {
  // Session Configuration
  wordsCount: 10,
  difficultyLevel: 3,

  // Exercise Type Selection (all enabled by default)
  enableRememberTranslation: true,
  enableChooseRightWord: true,
  enableMakeUpWord: true,
  enableWriteByDefinition: true,
  enableWriteBySound: true,

  // Exercise Configuration
  makeUpWordMaxAttempts: 3,
  makeUpWordTimeLimit: 30,
  makeUpWordAdditionalCharacters: 5,
  showWordCardFirst: true,
  autoAdvanceFromWordCard: false,
  autoAdvanceDelaySeconds: 3,

  // Time Settings
  enableTimeLimit: false,
  timeLimitSeconds: 60,

  // Audio Settings
  autoPlayAudioOnWordCard: true,
  autoPlayAudioOnGameStart: true,
  enableGameSounds: true,
  gameSoundVolume: 0.5,

  // Display Settings
  showProgressBar: true,
  showDefinitionImages: true,
  showPhoneticPronunciation: true,
  showPartOfSpeech: true,
  showLearningStatus: true,

  // Behavior Settings
  pauseOnIncorrectAnswer: false,
  showCorrectAnswerOnMistake: true,
  allowSkipDifficultWords: true,
  adaptiveDifficulty: true,
};

const STORAGE_KEY = 'vocabulary-practice-settings';

/**
 * Custom hook for managing vocabulary practice settings
 * Provides comprehensive configuration for all aspects of vocabulary practice
 */
export function useVocabularyPracticeSettings() {
  const [settings, setSettings] =
    useState<VocabularyPracticeSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        }
      } catch (error) {
        console.warn('Failed to load vocabulary practice settings:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save vocabulary practice settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = useCallback(
    <K extends keyof VocabularyPracticeSettings>(
      key: K,
      value: VocabularyPracticeSettings[K],
    ) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const updateMultipleSettings = useCallback(
    (updates: Partial<VocabularyPracticeSettings>) => {
      setSettings((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Helper function to get enabled exercise types
  const getEnabledExerciseTypes = useCallback(() => {
    const exerciseTypes = [];
    if (settings.enableRememberTranslation)
      exerciseTypes.push('remember-translation');
    if (settings.enableChooseRightWord) exerciseTypes.push('choose-right-word');
    if (settings.enableMakeUpWord) exerciseTypes.push('make-up-word');
    if (settings.enableWriteByDefinition)
      exerciseTypes.push('write-by-definition');
    if (settings.enableWriteBySound) exerciseTypes.push('write-by-sound');
    return exerciseTypes;
  }, [settings]);

  // Helper function to validate settings
  const validateSettings = useCallback(() => {
    const enabledExercises = getEnabledExerciseTypes();
    const isValid = enabledExercises.length > 0;

    return {
      isValid,
      errors: isValid ? [] : ['At least one exercise type must be enabled'],
      enabledExercises,
    };
  }, [getEnabledExerciseTypes]);

  return {
    settings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    isLoaded,
    getEnabledExerciseTypes,
    validateSettings,
  };
}
