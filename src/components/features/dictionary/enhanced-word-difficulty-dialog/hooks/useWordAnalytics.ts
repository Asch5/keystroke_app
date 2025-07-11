import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSimpleWordAnalytics } from '@/core/domains/user/actions/simple-word-analytics';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import { WordAnalyticsState } from '../types';

export function useWordAnalytics(
  isOpen: boolean,
  word: UserDictionaryItem | null,
) {
  const [state, setState] = useState<WordAnalyticsState>({
    analytics: null,
    loading: false,
    error: null,
  });

  const fetchWordAnalytics = useCallback(async () => {
    if (!word) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getSimpleWordAnalytics(word.userId, word.id);
      if (result.success && result.analytics) {
        setState({
          analytics: result.analytics,
          loading: false,
          error: null,
        });
      } else {
        setState({
          analytics: null,
          loading: false,
          error: result.error || 'Failed to load word analytics',
        });
      }
    } catch {
      setState({
        analytics: null,
        loading: false,
        error: 'Failed to analyze word performance',
      });
      toast.error('Failed to load word analytics');
    }
  }, [word]);

  useEffect(() => {
    if (isOpen && word) {
      fetchWordAnalytics();
    }
  }, [isOpen, word, fetchWordAnalytics]);

  return {
    ...state,
    refetch: fetchWordAnalytics,
  };
}
