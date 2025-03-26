import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { WordAnalysisResult } from '@/types/dictionary';

/**
 * Analyzes a word using OpenAI to get comprehensive language information
 * @param word - The word to analyze
 * @param baseLanguage - The base language code (e.g., 'en', 'es')
 * @param targetLanguage - The target language code
 */
export async function analyzeWord(
    word: string,
    baseLanguage: string,
    targetLanguage: string,
): Promise<WordAnalysisResult> {
    const prompt = `Analyze the following word: "${word}"
  Base language: ${baseLanguage}
  Target language: ${targetLanguage}

  Please provide a detailed analysis following this exact format:
  {
    "isCorrect": boolean (is the word spelled correctly),
    "isWord": boolean (is it a valid word in either language),
    "baseLanguage": "${baseLanguage}",
    "targetLanguage": "${targetLanguage}",
    "wordInBaseLanguage": string (the word in base language),
    "wordInTargetLanguage": string (the word in target language),
    "oneWordDefinitionInBaseLanguage": string (1-3 word definition),
    "oneWordDefinitionInTargetLanguage": string (1-3 word definition),
    "fullWordDescriptionInBaseLanguage": string (1-3 sentences),
    "fullWordDescriptionInTargetLanguage": string (1-3 sentences),
    "examplesInBaseLanguage": string[] (1-3 example sentences),
    "examplesInTargetLanguage": string[] (1-3 example sentences),
    "synonymsInBaseLanguage": string[] (1-6 most appropriate synonyms),
    "synonymsInTargetLanguage": string[] (1-6 most appropriate synonyms),
    "phoneticSpellingInBaseLanguage": string,
    "phoneticSpellingInTargetLanguage": string,
    "partOfSpeechInBaseLanguage": string (must be one of: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection),
    "partOfSpeechInTargetLanguage": string (must be one of: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection),
    "difficultyLevel": string (must be one of: A1, A2, B1, B2, C1, C2),
    "source": "ai_generated"
  }

  Ensure all text fields are properly escaped and the response is valid JSON.`;

    try {
        const { text } = await generateText({
            model: openai('gpt-4-turbo-preview'),
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a highly knowledgeable linguistics expert and translator.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
        });

        const result = JSON.parse(text) as WordAnalysisResult;
        return result;
    } catch (error) {
        console.error('Error analyzing word:', error);
        throw new Error('Failed to analyze word');
    }
}
