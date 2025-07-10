'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AuthenticatedImage } from '@/components/shared/AuthenticatedImage';
import type { SessionState } from './hooks';
import type { TypingPracticeSettings } from '@/core/state/features/settingsSlice';

interface TypingWordDisplayProps {
  sessionState: SessionState;
  showResult: boolean;
  settings: TypingPracticeSettings;
}

/**
 * Component for displaying the word, definition, and image during typing practice
 */
export function TypingWordDisplay({
  sessionState,
  showResult,
  settings,
}: TypingWordDisplayProps) {
  if (!sessionState.currentWord) return null;

  const word = sessionState.currentWord.wordText;

  return (
    <div className="space-y-6">
      {/* Word display */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-muted-foreground mb-2">
          Type this word:
        </h2>
        {!showResult ? (
          /* Show one-word translation or "-" during typing */
          <div className="text-4xl font-bold mb-4">
            {sessionState.currentWord.oneWordTranslation || '-'}
          </div>
        ) : (
          /* Show target word with phonetic after completion */
          <div className="space-y-2 mb-4">
            <div className="text-4xl font-bold">{word}</div>
            {sessionState.currentWord.phonetic && (
              <div className="text-lg text-muted-foreground font-mono">
                /{sessionState.currentWord.phonetic}/
              </div>
            )}
          </div>
        )}
      </div>

      {/* Definition */}
      {sessionState.currentWord.definition && (
        <div className="text-center">
          <p className="text-muted-foreground max-w-lg mx-auto">
            {sessionState.currentWord.definition}
          </p>
        </div>
      )}

      {/* Image */}
      {settings.showDefinitionImages && sessionState.currentWord.imageUrl && (
        <div className="flex justify-center">
          <div className="w-48 h-32">
            <AspectRatio ratio={3 / 2}>
              <AuthenticatedImage
                src={sessionState.currentWord.imageUrl}
                alt={`Visual representation of ${word}`}
                fill
                className="rounded-md object-cover"
                onImageError={(error) => {
                  console.error('🖼️ Image loading error:', {
                    word: sessionState.currentWord?.wordText,
                    imageUrl: sessionState.currentWord?.imageUrl,
                    imageId: sessionState.currentWord?.imageId,
                    error,
                  });
                }}
              />
            </AspectRatio>
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && sessionState.currentWord && (
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <div>🔧 Debug Info:</div>
          <div>Show Images: {settings.showDefinitionImages ? '✅' : '❌'}</div>
          <div>Image ID: {sessionState.currentWord.imageId || 'None'}</div>
          <div>Image URL: {sessionState.currentWord.imageUrl || 'None'}</div>
        </div>
      )}
    </div>
  );
}
