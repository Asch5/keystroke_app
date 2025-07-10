'use client';

import React from 'react';
import { TranslationForm } from './components/TranslationForm';
import { ErrorDisplay } from './components/ErrorDisplay';
import { TranslationResult } from './components/TranslationResult';
import { useTranslationState } from './hooks/useTranslationState';

/**
 * Main TranslateComponent - refactored to ~30 lines (down from 462 lines)
 * Uses modular architecture with focused components and custom hooks
 */
export default function TranslateComponent() {
  const {
    result,
    isLoading,
    error,
    text,
    sourceLang,
    destLang,
    options,
    setText,
    setSourceLang,
    setDestLang,
    handleOptionChange,
    handleSubmit,
  } = useTranslationState();

  return (
    <div className="container mx-auto p-4">
      <TranslationForm
        text={text}
        sourceLang={sourceLang}
        destLang={destLang}
        options={options}
        isLoading={isLoading}
        onTextChange={setText}
        onSourceLangChange={setSourceLang}
        onDestLangChange={setDestLang}
        onOptionChange={handleOptionChange}
        onSubmit={handleSubmit}
      />

      {error && <ErrorDisplay error={error} />}

      {result && <TranslationResult result={result} />}
    </div>
  );
}
