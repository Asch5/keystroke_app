import {
  LanguageCode,
  UserSettings as PrismaUserSettings,
  User,
} from '@prisma/client';

/**
 * Enhanced user settings types for the user domain
 */

// Complete user settings interface combining User and UserSettings models
export interface CompleteUserSettings {
  // User profile information
  user: {
    id: string;
    name: string;
    email: string;
    baseLanguageCode: LanguageCode;
    targetLanguageCode: LanguageCode;
    profilePictureUrl: string | null;
    role: string;
    status: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date;
  };

  // Learning settings from UserSettings model
  learningSettings: {
    dailyGoal: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    autoPlayAudio: boolean;
    darkMode: boolean;
    sessionDuration: number; // in minutes
    reviewInterval: number; // in days
    difficultyPreference: number; // 1-5 scale
    learningReminders: Record<string, unknown>;
  } | null;

  // App settings from User.settings JSON field
  appSettings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    autoSave: boolean;
  };
}

// User profile update data
export interface UserProfileUpdateData {
  name?: string;
  email?: string;
  baseLanguageCode?: LanguageCode;
  targetLanguageCode?: LanguageCode;
  profilePicture?: File;
}

// Learning settings update data
export interface LearningSettingsUpdateData {
  dailyGoal?: number;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  autoPlayAudio?: boolean;
  darkMode?: boolean;
  sessionDuration?: number;
  reviewInterval?: number;
  difficultyPreference?: number;
  learningReminders?: Record<string, unknown>;
}

// App settings update data
export interface AppSettingsUpdateData {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  autoSave?: boolean;
}

// Language option for dropdowns
export interface LanguageOption {
  id: LanguageCode;
  name: string;
  nativeName?: string;
  flag?: string;
}

// Difficulty levels for user preferences
export interface DifficultyOption {
  value: number;
  label: string;
  description: string;
}

// Session duration options
export interface SessionDurationOption {
  value: number;
  label: string;
}

// Review interval options
export interface ReviewIntervalOption {
  value: number;
  label: string;
}

// Theme options
export interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
}

// Notification settings structure
export interface NotificationSettings {
  email: {
    dailyReminders: boolean;
    weeklyProgress: boolean;
    achievements: boolean;
    newFeatures: boolean;
  };
  push: {
    studyReminders: boolean;
    streakReminders: boolean;
    goalReminders: boolean;
  };
  inApp: {
    soundEffects: boolean;
    visualEffects: boolean;
    autoPlayAudio: boolean;
  };
}

// Learning reminder settings
export interface LearningReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
  frequency: 'daily' | 'weekly' | 'custom';
}

// User settings form data
export interface UserSettingsFormData {
  profile: UserProfileUpdateData;
  learning: LearningSettingsUpdateData;
  app: AppSettingsUpdateData;
}

// Settings section for navigation
export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

// Settings validation result
export interface SettingsValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

// User preferences for learning
export interface UserLearningPreferences {
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyProgression: 'slow' | 'normal' | 'fast';
  reviewFrequency: 'high' | 'medium' | 'low';
  goalOriented: boolean;
  competitiveMode: boolean;
}

// Export types for external use
export type UserWithSettings = User & {
  userSettings: PrismaUserSettings | null;
};

// Server action state types
export interface UserSettingsState {
  errors?: {
    [key: string]: string[];
  };
  message?: string | null;
  success?: boolean;
}

export interface UserProfileState {
  errors?: {
    name?: string[];
    email?: string[];
    baseLanguageCode?: string[];
    targetLanguageCode?: string[];
    profilePicture?: string[];
  };
  message?: string | null;
  success?: boolean;
  updatedUser?: {
    name?: string;
    email?: string;
    baseLanguageCode?: LanguageCode;
    targetLanguageCode?: LanguageCode;
    profilePictureUrl?: string;
  };
}
