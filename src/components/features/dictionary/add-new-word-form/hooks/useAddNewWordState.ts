'use client';

import { useState, useRef } from 'react';
import {
  ProcessedWord,
  WordProcessorState,
  FileProcessorState,
} from '../types';

/**
 * Main state management hook for AddNewWordForm
 * Consolidates all state logic for the form
 */
export function useAddNewWordState() {
  // Word processing state
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState<'en' | 'da'>('en');
  const [dictionaryType, setDictionaryType] = useState('learners');
  const [processOneWordOnly, setProcessOneWordOnly] = useState(true);
  const [processedWords, setProcessedWords] = useState<ProcessedWord[]>([]);

  // File processing state
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actions
  const clearWordHistory = () => {
    setProcessedWords([]);
  };

  const addProcessedWord = (processedWord: ProcessedWord) => {
    setProcessedWords((prev) => [processedWord, ...prev]);
  };

  const addProcessedWords = (newProcessedWords: ProcessedWord[]) => {
    setProcessedWords((prev) => [...newProcessedWords, ...prev]);
  };

  const resetForm = () => {
    setWord('');
    setLoading(false);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const wordProcessorState: WordProcessorState = {
    loading,
    word,
    language,
    dictionaryType,
    processOneWordOnly,
    processedWords,
  };

  const fileProcessorState: FileProcessorState = {
    fileUploading,
    uploadedFileName,
  };

  return {
    // State
    wordProcessorState,
    fileProcessorState,
    fileInputRef,

    // Word processing actions
    setLoading,
    setWord,
    setLanguage,
    setDictionaryType,
    setProcessOneWordOnly,
    addProcessedWord,
    addProcessedWords,
    clearWordHistory,
    resetForm,

    // File processing actions
    setFileUploading,
    setUploadedFileName,
    triggerFileUpload,
  };
}
