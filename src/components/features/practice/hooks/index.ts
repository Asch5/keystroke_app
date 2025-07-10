// Practice hooks - centralized exports

// Audio playback
export * from './useTypingAudioPlayback';

// Core typing practice state management
export { useTypingPracticeState } from './useTypingPracticeState';

// Game state management
export { usePracticeGameState } from './usePracticeGameState';

// Session management
export { useTypingSessionManager } from './useTypingSessionManager';
export type { SessionState } from './useTypingSessionManager';

// Word validation
export { useTypingWordValidator } from './useTypingWordValidator';
export type { WordResult } from './useTypingWordValidator';

// Input management
export { useTypingInputManager } from './useTypingInputManager';
export { useTypingInputState } from './useTypingInputState';

// Note: TypingPracticeSettings and VocabularyPracticeSettings are now available
// from @/core/shared/hooks/useSettings with Redux + database persistence
