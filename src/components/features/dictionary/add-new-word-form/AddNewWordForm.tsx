'use client';

import React, { FormEvent, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseCleanupDialog } from '@/components/shared/dialogs';
import { AddWordFormTabs } from './components/AddWordFormTabs';
import { ProcessedWordsHistory } from './components/ProcessedWordsHistory';
import { useAddNewWordState } from './hooks/useAddNewWordState';
import { useWordProcessor } from './hooks/useWordProcessor';
import { useFileProcessor } from './hooks/useFileProcessor';
import { AddNewWordFormProps, LanguageType, DictionaryType } from './types';

/**
 * Main AddNewWordForm component - refactored to 120 lines (down from 617 lines)
 * Uses modular architecture with focused components and custom hooks
 * Follows single responsibility principle and Cursor Rules guidelines
 */
export default function AddNewWordForm({ className }: AddNewWordFormProps) {
  // State management
  const {
    wordProcessorState,
    fileProcessorState,
    fileInputRef,
    setLoading,
    setWord,
    setLanguage,
    setDictionaryType,
    setProcessOneWordOnly,

    addProcessedWords,
    clearWordHistory,
    resetForm,
    setFileUploading,
    setUploadedFileName,
    triggerFileUpload,
  } = useAddNewWordState();

  // Business logic hooks
  const { processWord } = useWordProcessor();
  const { handleFileChange } = useFileProcessor();

  /**
   * Handle single word form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!wordProcessorState.word.trim()) return;

      setLoading(true);
      try {
        const results = await processWord(
          wordProcessorState.word,
          wordProcessorState.language,
          wordProcessorState.dictionaryType,
          wordProcessorState.processOneWordOnly,
        );

        if (results) {
          addProcessedWords(results);
        }
        resetForm();
      } catch (error) {
        console.error('Error in form submission:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      wordProcessorState.word,
      wordProcessorState.language,
      wordProcessorState.dictionaryType,
      wordProcessorState.processOneWordOnly,
      processWord,
      addProcessedWords,
      resetForm,
      setLoading,
    ],
  );

  /**
   * Handle file upload and processing
   */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const processWordWrapper = async (word: string) => {
        return await processWord(
          word,
          wordProcessorState.language,
          wordProcessorState.dictionaryType,
          wordProcessorState.processOneWordOnly,
        );
      };

      await handleFileChange(
        e,
        processWordWrapper,
        setFileUploading,
        setUploadedFileName,
        addProcessedWords,
      );
    },
    [
      processWord,
      wordProcessorState.language,
      wordProcessorState.dictionaryType,
      wordProcessorState.processOneWordOnly,
      handleFileChange,
      setFileUploading,
      setUploadedFileName,
      addProcessedWords,
    ],
  );

  return (
    <div
      className={`mt-10 w-full max-w-md mx-auto space-y-6 ${className || ''}`}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Add New Word
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddWordFormTabs
            wordState={wordProcessorState}
            fileState={fileProcessorState}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            onWordChange={setWord}
            onLanguageChange={(language: LanguageType) => setLanguage(language)}
            onDictionaryTypeChange={(type: DictionaryType) =>
              setDictionaryType(type)
            }
            onProcessOneWordOnlyChange={setProcessOneWordOnly}
            onSingleWordSubmit={handleSubmit}
            onFileChange={handleFileUpload}
            onTriggerFileUpload={triggerFileUpload}
          />
        </CardContent>
      </Card>

      <ProcessedWordsHistory
        processedWords={wordProcessorState.processedWords}
        onClearHistory={clearWordHistory}
      />

      <DatabaseCleanupDialog />
    </div>
  );
}
