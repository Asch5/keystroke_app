import type {
  WordDetailWithDefinitions,
  DefinitionForExtraction,
  ExtractWordsBatchResult,
} from '@/core/domains/dictionary/actions/deepseek-actions';

export interface DeepSeekWordExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWordDetailIds: number[];
  onSuccess: () => void;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  results: ExtractWordsBatchResult | null;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

export interface LanguageOption {
  value: string;
  label: string;
}

export interface ConfigurationState {
  targetLanguages: string[];
  sourceLanguage: string;
  onlyShortDefinitions: boolean;
}

export interface DefinitionSelectionState {
  wordDetailsWithDefinitions: WordDetailWithDefinitions[];
  isLoadingDefinitions: boolean;
}

export interface CleanupActions {
  handleRemoveLastAttempt: () => Promise<void>;
  handleCleanupIncorrectWords: () => Promise<void>;
  isCleaningUp: boolean;
}

export interface ExtractionActions {
  handleExtractWords: () => Promise<void>;
  getSelectedDefinitions: () => DefinitionForExtraction[];
  calculateCostEstimate: () => number;
  toggleDefinitionSelection: (
    wordDetailId: number,
    definitionId: number,
  ) => void;
  toggleWordDetailSelection: (wordDetailId: number, selected: boolean) => void;
}

export {
  type WordDetailWithDefinitions,
  type DefinitionForExtraction,
  type ExtractWordsBatchResult,
};
