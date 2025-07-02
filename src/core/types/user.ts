import { User } from '@/core/types';

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
