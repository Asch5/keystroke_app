import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * DeepSeek API Service for dictionary word extraction
 * Provides cost-effective word retrieval from definitions
 */

export interface DeepSeekWordRequest {
  definition: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface DeepSeekWordResponse {
  word: string;
  confidence: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

export interface DeepSeekBatchRequest {
  definitions: Array<{
    id: number;
    definition: string;
  }>;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface DeepSeekBatchResponse {
  results: Array<{
    definitionId: number;
    word: string | null;
    confidence: number;
    error?: string;
  }>;
  totalTokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
}

export class DeepSeekService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.deepseek.com/v1';
  private readonly model = 'deepseek-chat';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';

    if (!this.apiKey) {
      console.warn(
        '⚠️  DEEPSEEK_API_KEY not found in environment variables. DeepSeek word extraction will not work.',
      );
    }
  }

  /**
   * Extract a single word from a definition
   */
  async extractWord({
    definition,
    targetLanguage,
    sourceLanguage,
  }: DeepSeekWordRequest): Promise<DeepSeekWordResponse> {
    try {
      const prompt = this.buildPrompt(
        definition,
        targetLanguage,
        sourceLanguage,
      );

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0, // Deterministic output
          max_tokens: 3, // Single word should be 1-3 tokens
          stop: ['\n', '.', ',', ' ', '"'], // Stop after word, prevent quotes
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle specific error cases
        if (response.status === 402) {
          throw new Error(
            'DeepSeek API: Insufficient balance. Please add credits to your account.',
          );
        }

        if (response.status === 429) {
          throw new Error(
            'DeepSeek API: Rate limit exceeded. Please try again later.',
          );
        }

        throw new Error(
          `DeepSeek API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      // Clean the extracted word
      let extractedWord = data.choices[0].message.content.trim();

      // Remove any quotes, punctuation, or extra characters
      extractedWord = extractedWord
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .replace(/[.,;:!?]+$/g, '') // Remove trailing punctuation
        .replace(/^\w+:\s*/, '') // Remove "Word:" prefix if present
        .trim()
        .toLowerCase(); // Normalize to lowercase

      // Validate the extracted word
      if (!extractedWord || extractedWord.length === 0) {
        throw new Error('No valid word extracted from definition');
      }

      // Check if it's actually a word (not a sentence)
      if (extractedWord.split(' ').length > 2) {
        throw new Error(
          'Extracted text appears to be a phrase, not a single word',
        );
      }

      const tokensUsed = {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      };

      return {
        word: extractedWord,
        confidence: 0.9, // High confidence for clean extraction
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unexpected error during word extraction: ${String(error)}`,
      );
    }
  }

  /**
   * Extract words from multiple definitions in batch
   * Uses sequential processing to respect rate limits
   */
  async extractWordsBatch({
    definitions,
    targetLanguage,
    sourceLanguage,
  }: DeepSeekBatchRequest): Promise<DeepSeekBatchResponse> {
    const results = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;

    serverLog('Starting DeepSeek batch processing', 'info', {
      definitionCount: definitions.length,
      targetLanguage,
      sourceLanguage,
    });

    for (const definition of definitions) {
      try {
        // Add delay to respect rate limits (5 requests/second max)
        await this.delay(250);

        const extractRequest: DeepSeekWordRequest = {
          definition: definition.definition,
          targetLanguage,
        };
        if (sourceLanguage) {
          extractRequest.sourceLanguage = sourceLanguage;
        }
        const result = await this.extractWord(extractRequest);

        results.push({
          definitionId: definition.id,
          word: result.word,
          confidence: result.confidence,
        });

        totalInputTokens += result.tokensUsed.input;
        totalOutputTokens += result.tokensUsed.output;
        totalTokens += result.tokensUsed.total;
      } catch (error) {
        serverLog('Failed to process definition in batch', 'error', {
          definitionId: definition.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        results.push({
          definitionId: definition.id,
          word: null,
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate approximate cost (DeepSeek pricing: ~$0.001 per 1K tokens)
    const cost = (totalTokens / 1000) * 0.001;

    serverLog('DeepSeek batch processing completed', 'info', {
      processedCount: results.length,
      successCount: results.filter((r) => r.word).length,
      totalTokens,
      estimatedCost: cost,
    });

    return {
      results,
      totalTokensUsed: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalTokens,
      },
      cost,
    };
  }

  /**
   * Build optimized prompt for word extraction
   * Based on DeepSeek best practices for cost-effective usage
   */
  private buildPrompt(
    definition: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): string {
    // Clean definition to reduce tokens
    const cleanDefinition = definition
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/\(.*?\)/g, '') // Remove parenthetical content
      .replace(/dvs\.|f\.x\.|etc\./g, '') // Remove Danish abbreviations
      .trim()
      .substring(0, 200); // Limit definition length

    const langContext =
      sourceLanguage && sourceLanguage !== targetLanguage
        ? `${sourceLanguage.toUpperCase()} definition → ${targetLanguage.toUpperCase()} word`
        : `Extract the ${targetLanguage.toUpperCase()} word`;

    // Optimized prompt for minimal tokens and clean output
    return `${langContext}. Return ONLY the word, no quotes or explanations.
Definition: ${cleanDefinition}
Word:`;
  }

  /**
   * Utility method for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate API connection and balance
   */
  async validateConnection(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return {
        valid: false,
        error:
          'DEEPSEEK_API_KEY not configured. Please add your API key to .env.local',
      };
    }

    try {
      // Test with a minimal request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });

      if (response.status === 402) {
        return {
          valid: false,
          error:
            'DeepSeek API: Insufficient balance. Please add credits to your account.',
        };
      }

      if (response.status === 401) {
        return {
          valid: false,
          error:
            'DeepSeek API: Invalid API key. Please check your DEEPSEEK_API_KEY.',
        };
      }

      if (!response.ok) {
        return {
          valid: false,
          error: `DeepSeek API error: ${response.status}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Singleton instance
export const deepSeekService = new DeepSeekService();
