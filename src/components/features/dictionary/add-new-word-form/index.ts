// Barrel exports for AddNewWordForm modular components
export { default as AddNewWordForm } from './AddNewWordForm';
export { AddWordFormTabs } from './components/AddWordFormTabs';
export { SingleWordForm } from './components/SingleWordForm';
export { FileUploadForm } from './components/FileUploadForm';
export { ProcessedWordsHistory } from './components/ProcessedWordsHistory';
export { LanguageSettings } from './components/LanguageSettings';
export { useAddNewWordState } from './hooks/useAddNewWordState';
export { useFileProcessor } from './hooks/useFileProcessor';
export { useWordProcessor } from './hooks/useWordProcessor';
export type { ProcessedWord, AddNewWordFormProps } from './types';
