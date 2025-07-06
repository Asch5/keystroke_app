// Session Management
export { useTypingSessionManager } from './useTypingSessionManager';
export type { SessionState } from './useTypingSessionManager';

// Word Validation
export { useTypingWordValidator } from './useTypingWordValidator';
export type { WordResult } from './useTypingWordValidator';

// Input Management
export { useTypingInputManager } from './useTypingInputManager';

// Original Hook (for backward compatibility)
export { useTypingPracticeState } from './useTypingPracticeState';

export * from './useTypingPracticeState';
export * from './useTypingAudioPlayback';
export * from './useTypingPracticeSettings';
export * from './usePracticeGameState';
export * from './useTypingInputState';
export type { TypingPracticeSettings } from './useTypingPracticeSettings';
