import { User } from '@prisma/client';

/**
 * User entity types for user domain
 */

export type UserBasicData = Pick<
  User,
  | 'id'
  | 'name'
  | 'email'
  | 'role'
  | 'status'
  | 'baseLanguageCode'
  | 'targetLanguageCode'
  | 'profilePictureUrl'
>;

export type Theme = ['light', 'dark'];

// User settings interface
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

// User profile update data
export interface UpdateData {
  name?: string;
  email?: string;
  profilePictureUrl?: string;
  baseLanguageCode?: string;
  targetLanguageCode?: string;
}
