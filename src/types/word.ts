export type Word = {
    id: string;
    text: string; // Word in target language
    translation: string; // Word in base language
    languageId: string; // Target language ID
    category?: string; // Category of the word (optional)
    difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
    audioUrl?: string; // URL to pronunciation audio (optional)
    exampleSentence?: string; // Example usage (optional)
};
