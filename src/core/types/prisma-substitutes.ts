// Internal types to substitute for Prisma namespace types
// This prevents Prisma namespace from being bundled into client code

import {
  PartOfSpeech,
  SourceType,
  Gender,
  LanguageCode,
  DifficultyLevel,
} from '@/core/types';

// Substitute for Prisma.WordDetailsUpdateInput
export interface WordDetailsUpdateInput {
  partOfSpeech?: PartOfSpeech;
  variant?: string | null;
  gender?: Gender | null;
  etymology?: string | null;
  phonetic?: string | null;
  forms?: string | null;
  frequency?: number | null;
  isPlural?: boolean;
  source?: SourceType;
}

// Substitute for Prisma.WordUpdateInput
export interface WordUpdateInput {
  word?: string;
  phoneticGeneral?: string | null;
  frequencyGeneral?: number | null;
  languageCode?: LanguageCode;
  isHighlighted?: boolean;
  additionalInfo?: Record<string, unknown>;
}

// Substitute for Prisma.UserUpdateInput
export interface UserUpdateInput {
  name?: string;
  email?: string;
  baseLanguageCode?: LanguageCode | null;
  targetLanguageCode?: LanguageCode | null;
  profilePictureUrl?: string | null;
  settings?: Record<string, unknown>;
  status?: string;
  deletedAt?: Date | null;
}

// Substitute for Prisma.UserSettingsUpdateInput
export interface UserSettingsUpdateInput {
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

// Substitute for Prisma.UserSettingsUncheckedCreateInput
export interface UserSettingsUncheckedCreateInput {
  userId: string;
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

// Substitute for Prisma.UserListWhereInput
export interface UserListWhereInput {
  userId?: string;
  deletedAt?: null | { not?: null };
  listId?: string | null | { not?: null };
  customDifficulty?: DifficultyLevel | null;
  OR?: UserListWhereInput[];
  AND?: UserListWhereInput[];
  list?: {
    difficultyLevel?: DifficultyLevel;
  };
}

// Substitute for Prisma.DefinitionUpdateInput
export interface DefinitionUpdateInput {
  definition?: string;
  languageCode?: LanguageCode;
  source?: SourceType;
  subjectStatusLabels?: string | null;
  generalLabels?: string | null;
  grammaticalNote?: string | null;
  usageNote?: string | null;
  isInShortDef?: boolean;
  imageId?: number | null;
}

// Substitute for Prisma.AudioUpdateInput
export interface AudioUpdateInput {
  url?: string;
  languageCode?: LanguageCode;
  source?: SourceType;
  note?: string | null;
}

// Substitute for Prisma.DefinitionExampleUpdateInput
export interface DefinitionExampleUpdateInput {
  example?: string;
  languageCode?: LanguageCode;
  grammaticalNote?: string | null;
  sourceOfExample?: string | null;
}

// Substitute for Prisma.MiddlewareParams
export interface MiddlewareParams {
  model?: string;
  action: string;
  args: Record<string, unknown>;
}

// Substitute for Prisma.InputJsonValue
export type InputJsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: InputJsonValue }
  | InputJsonValue[];

// Generic where input for filtering
export interface WhereInput {
  [key: string]: unknown;
}

// Generic select input for field selection
export interface SelectInput {
  [key: string]: boolean | SelectInput;
}

// Generic include input for relations
export interface IncludeInput {
  [key: string]: boolean | { select?: SelectInput; include?: IncludeInput };
}

// Generic order by input for sorting
export interface OrderByInput {
  [key: string]: 'asc' | 'desc' | OrderByInput;
}

// Database operation result types
export interface DatabaseOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface DatabaseBatchResult {
  count: number;
}

// Common database query options
export interface DatabaseQueryOptions {
  where?: WhereInput;
  select?: SelectInput;
  include?: IncludeInput;
  orderBy?: OrderByInput | OrderByInput[];
  take?: number;
  skip?: number;
}

// Transaction options
export interface DatabaseTransactionOptions {
  timeout?: number;
  maxWait?: number;
}
