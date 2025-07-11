'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { TranslationResponse, TranslationOptions } from '../types';
import { defaultOptions } from '../constants';

/**
 * State management hook for TranslateComponent
 * Handles form state, API calls, and error management
 */
export function useTranslationState() {
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [destLang, setDestLang] = useState('en');
  const [options, setOptions] = useState<TranslationOptions>(defaultOptions);

  // Handle option change
  const handleOptionChange = (
    option: keyof TranslationOptions,
    value: boolean,
  ) => {
    setOptions((prev) => ({
      ...prev,
      [option]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text) {
      toast({
        title: 'Error',
        description: 'Please enter text to translate',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call our API route
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          destLang,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation request failed');
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: 'Translation complete',
        description: 'Translation has been successfully completed.',
      });
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: 'Translation failed',
        description:
          err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    result,
    isLoading,
    error,
    text,
    sourceLang,
    destLang,
    options,
    // Actions
    setText,
    setSourceLang,
    setDestLang,
    handleOptionChange,
    handleSubmit,
  };
}
