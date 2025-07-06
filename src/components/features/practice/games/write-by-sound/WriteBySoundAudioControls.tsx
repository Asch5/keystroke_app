'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Pause, VolumeX, Volume2 } from 'lucide-react';

interface WriteBySoundAudioControlsProps {
  isPlaying: boolean;
  replaysRemaining: number;
  replayProgress: number;
  replayCount: number;
  maxReplays: number;
  showHint: boolean;
  hasSubmitted: boolean;
  onAudioPlay: () => void;
  onToggleHint: () => void;
}

/**
 * Audio controls component for Write by Sound game
 */
export function WriteBySoundAudioControls({
  isPlaying,
  replaysRemaining,
  replayProgress,
  replayCount,
  maxReplays,
  showHint,
  hasSubmitted,
  onAudioPlay,
  onToggleHint,
}: WriteBySoundAudioControlsProps) {
  return (
    <div className="space-y-4">
      {/* Audio Controls */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <Button
            onClick={onAudioPlay}
            disabled={isPlaying || replaysRemaining === 0}
            variant={replaysRemaining > 0 ? 'default' : 'secondary'}
            size="lg"
            className="flex items-center gap-2 px-6 py-3"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5" />
                Playing...
              </>
            ) : replaysRemaining > 0 ? (
              <>
                <RotateCcw className="h-5 w-5" />
                Replay Audio ({replaysRemaining} left)
              </>
            ) : (
              <>
                <VolumeX className="h-5 w-5" />
                No Replays Left
              </>
            )}
          </Button>
        </div>

        {/* Replay Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Audio Replays Used</span>
            <span>
              {replayCount}/{maxReplays}
            </span>
          </div>
          <Progress value={replayProgress} className="h-2" />
        </div>
      </div>

      {/* Hint Toggle */}
      {!hasSubmitted && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleHint}
            className="flex items-center gap-1"
          >
            <Volume2 className="h-3 w-3" />
            {showHint ? 'Hide' : 'Show'} Length Hint
          </Button>
        </div>
      )}
    </div>
  );
}
