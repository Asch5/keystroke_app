import { LanguageCode } from '@/core/types';
import {
  LanguageOption,
  DifficultyOption,
  SessionDurationOption,
  ReviewIntervalOption,
  ThemeOption,
} from '../types/user-settings';

/**
 * Constants for user settings options
 */

// Supported languages with enhanced information
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { id: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { id: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { id: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

// Language mapping for quick lookup
export const LANGUAGE_MAP = LANGUAGE_OPTIONS.reduce(
  (acc, lang) => {
    acc[lang.id] = lang.name;
    return acc;
  },
  {} as Record<LanguageCode, string>,
);

// Difficulty preference options (1-5 scale)
export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: 1,
    label: 'Beginner',
    description: 'Simple words and basic concepts',
  },
  {
    value: 2,
    label: 'Elementary',
    description: 'Common words with simple grammar',
  },
  {
    value: 3,
    label: 'Intermediate',
    description: 'Mixed difficulty with context',
  },
  { value: 4, label: 'Advanced', description: 'Complex words and grammar' },
  {
    value: 5,
    label: 'Expert',
    description: 'Academic and specialized vocabulary',
  },
];

// Session duration options (in minutes)
export const SESSION_DURATION_OPTIONS: SessionDurationOption[] = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

// Review interval options (in days)
export const REVIEW_INTERVAL_OPTIONS: ReviewIntervalOption[] = [
  { value: 1, label: 'Daily' },
  { value: 2, label: 'Every 2 days' },
  { value: 3, label: 'Every 3 days' },
  { value: 5, label: 'Every 5 days' },
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Bi-weekly' },
  { value: 21, label: 'Every 3 weeks' },
  { value: 30, label: 'Monthly' },
];

// Theme options
export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light theme for better visibility',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark theme for reduced eye strain',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow system theme preference',
  },
];

// Daily goal options (words to learn per day)
export const DAILY_GOAL_OPTIONS = [
  { value: 1, label: '1 word per day' },
  { value: 3, label: '3 words per day' },
  { value: 5, label: '5 words per day' },
  { value: 10, label: '10 words per day' },
  { value: 15, label: '15 words per day' },
  { value: 20, label: '20 words per day' },
  { value: 25, label: '25 words per day' },
  { value: 30, label: '30 words per day' },
  { value: 50, label: '50 words per day' },
  { value: 100, label: '100 words per day' },
];

// Default settings values
export const DEFAULT_USER_SETTINGS = {
  // Learning settings
  dailyGoal: 5,
  notificationsEnabled: true,
  soundEnabled: true,
  autoPlayAudio: true,
  darkMode: false,
  sessionDuration: 15,
  reviewInterval: 3,
  difficultyPreference: 1,
  learningReminders: {},

  // App settings
  theme: 'system' as const,
  language: 'en',
  notifications: true,
  autoSave: true,
};

// Settings validation rules
export const SETTINGS_VALIDATION = {
  name: {
    minLength: 2,
    maxLength: 100,
  },
  dailyGoal: {
    min: 1,
    max: 100,
  },
  sessionDuration: {
    min: 5,
    max: 120,
  },
  reviewInterval: {
    min: 1,
    max: 30,
  },
  difficultyPreference: {
    min: 1,
    max: 5,
  },
  profilePicture: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

// Time zone options (commonly used)
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

// Day of week options for reminders
export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

// Learning style options
export const LEARNING_STYLE_OPTIONS = [
  {
    value: 'visual',
    label: 'Visual',
    description: 'Learn better with images and visual aids',
  },
  {
    value: 'auditory',
    label: 'Auditory',
    description: 'Learn better with sound and speech',
  },
  {
    value: 'kinesthetic',
    label: 'Kinesthetic',
    description: 'Learn better through practice and interaction',
  },
  {
    value: 'reading',
    label: 'Reading/Writing',
    description: 'Learn better through text and writing',
  },
];

// Study time preferences
export const STUDY_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning', description: '6:00 AM - 12:00 PM' },
  { value: 'afternoon', label: 'Afternoon', description: '12:00 PM - 6:00 PM' },
  { value: 'evening', label: 'Evening', description: '6:00 PM - 10:00 PM' },
  { value: 'night', label: 'Night', description: '10:00 PM - 6:00 AM' },
];

// Helper functions
export function getLanguageByCode(
  code: LanguageCode,
): LanguageOption | undefined {
  return LANGUAGE_OPTIONS.find((lang) => lang.id === code);
}

export function getDifficultyByValue(
  value: number,
): DifficultyOption | undefined {
  return DIFFICULTY_OPTIONS.find((diff) => diff.value === value);
}

export function getSessionDurationByValue(
  value: number,
): SessionDurationOption | undefined {
  return SESSION_DURATION_OPTIONS.find((duration) => duration.value === value);
}

export function getReviewIntervalByValue(
  value: number,
): ReviewIntervalOption | undefined {
  return REVIEW_INTERVAL_OPTIONS.find((interval) => interval.value === value);
}

export function getThemeByValue(value: string): ThemeOption | undefined {
  return THEME_OPTIONS.find((theme) => theme.value === value);
}
