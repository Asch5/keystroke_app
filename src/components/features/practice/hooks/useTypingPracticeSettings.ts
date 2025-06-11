'use client';

import { useState, useCallback, useEffect } from 'react';

export interface TypingPracticeSettings {
  autoSubmitAfterCorrect: boolean;
  showDefinitionImages: boolean;
}

const DEFAULT_SETTINGS: TypingPracticeSettings = {
  autoSubmitAfterCorrect: false,
  showDefinitionImages: true,
};

const STORAGE_KEY = 'typing-practice-settings';

/**
 * Custom hook for managing typing practice settings
 * Persists settings to localStorage for user preferences
 */
export function useTypingPracticeSettings() {
  const [settings, setSettings] =
    useState<TypingPracticeSettings>(DEFAULT_SETTINGS);
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
        console.warn('Failed to load typing practice settings:', error);
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
        console.warn('Failed to save typing practice settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = useCallback(
    <K extends keyof TypingPracticeSettings>(
      key: K,
      value: TypingPracticeSettings[K],
    ) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
  };
}
