import { PartOfSpeech, SourceType, LanguageCode } from '@/core/types';
import { WordDefinition } from '@/core/types/wordDefinition';

export interface Definition {
  id: number;
  word?: string; // Not in DB schema, but used in some methods
  definition: string;
  imageId: number | null;
  source: SourceType;
  languageCode: LanguageCode;
  subjectStatusLabels?: string | null;
  generalLabels?: string | null;
  grammaticalNote?: string | null;
  usageNote?: string | null;
  isInShortDef: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  wordDetails?: WordDefinition[];
  partOfSpeech?: PartOfSpeech; // For backward compatibility
  isPlural?: boolean; // For backward compatibility
}
