import { PartOfSpeech, SourceType } from '@prisma/client';

export interface Definition {
  id: number;
  word: string;
  definition: string;
  partOfSpeech: PartOfSpeech;
  generalLabels?: string | null;
  subjectStatusLabels?: string | null;
  grammaticalNote?: string | null;
  usageNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
  source: SourceType;
  isPlural: boolean;
  imageId: number | null;
  isInShortDef: boolean;
}
