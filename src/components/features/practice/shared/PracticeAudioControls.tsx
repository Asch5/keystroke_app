'use client';

import { Volume2, VolumeX, Play, Pause, RotateCcw, Waves } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import {
  warnLog,
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';
import { cn } from '@/core/shared/utils/common/cn';

type AudioType = 'word' | 'success' | 'error' | 'achievement';

interface PracticeAudioControlsProps {
  audioUrl?: string;
  audioType?: AudioType;
  maxReplays?: number; // For 'write-by-sound' game
  showVolumeControl?: boolean;
  showReplayCounter?: boolean;
  showWaveform?: boolean;
  disabled?: boolean;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onReplayCountChange?: (count: number) => void;
  className?: string;
}

/**
 * Enhanced audio controls for practice games
 * Uses AudioService for proper URL handling and proxy support
 * Supports word pronunciation, game sounds, replay limits, and volume control
 */
export function PracticeAudioControls({
  audioUrl,
  audioType = 'word',
  maxReplays,
  showVolumeControl = true,
  showReplayCounter = false,
  showWaveform = false,
  disabled = false,
  autoPlay = false,
  onPlay,
  onPause,
  onReplayCountChange,
  className,
}: PracticeAudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [replayCount, setReplayCount] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const handlePlay = useCallback(async () => {
    if (!audioUrl) {
      await warnLog('Audio playback failed: No audio URL provided');
      return;
    }

    // Check replay limit for write-by-sound game
    if (maxReplays && replayCount >= maxReplays) {
      toast.warning(`Maximum ${maxReplays} replays reached`);
      return;
    }

    try {
      await infoLog('Playing audio via AudioService', { audioUrl });

      setIsPlaying(true);
      await AudioService.playAudioFromDatabase(audioUrl);

      // Increment replay count
      const newCount = replayCount + 1;
      setReplayCount(newCount);
      onReplayCountChange?.(newCount);
      onPlay?.();

      await infoLog('Audio playback started successfully via AudioService');
    } catch (error) {
      await errorLog('AudioService playback failed', {
        errorMessage: error instanceof Error ? error.message : String(error),
        audioUrl,
      });

      setIsPlaying(false);

      // The AudioService already provides user-friendly error messages
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to play audio';
      toast.error(errorMessage);
    }
  }, [audioUrl, maxReplays, replayCount, onReplayCountChange, onPlay]);

  const handlePause = useCallback(async () => {
    await infoLog('Stopping audio via AudioService');
    AudioService.stopCurrentAudio();
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  // Monitor AudioService state for UI updates
  useEffect(() => {
    if (!audioUrl) return;

    const checkAudioState = () => {
      const isServicePlaying = AudioService.isPlaying();
      if (!isServicePlaying && isPlaying) {
        // Audio ended naturally
        setIsPlaying(false);
        onPause?.();
      }
    };

    // Check audio state periodically
    const interval = setInterval(checkAudioState, 100);

    return () => {
      clearInterval(interval);
    };
  }, [audioUrl, isPlaying, onPause]);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && !hasAutoPlayed && audioUrl) {
      setHasAutoPlayed(true);
      void infoLog('Auto-playing audio');
      handlePlay();
    }
  }, [autoPlay, hasAutoPlayed, audioUrl, handlePlay]);

  // Reset auto-play flag when audio URL changes
  useEffect(() => {
    setHasAutoPlayed(false);
    setReplayCount(0);
  }, [audioUrl]);

  const handleVolumeChange = (newVolume: number[]) => {
    // Note: AudioService doesn't currently support volume control
    // This is kept for UI consistency but doesn't affect playback
    const volumeValue = newVolume[0] ?? volume;
    setVolume(volumeValue);
  };

  const getAudioTypeIcon = () => {
    switch (audioType) {
      case 'success':
        return '🎉';
      case 'error':
        return '😅';
      case 'achievement':
        return '🏆';
      default:
        return null;
    }
  };

  const getAudioTypeColor = () => {
    switch (audioType) {
      case 'success':
        return 'text-success-foreground';
      case 'error':
        return 'text-error-foreground';
      case 'achievement':
        return 'text-warning-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-muted/30 rounded-lg',
        className,
      )}
    >
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? handlePause : handlePlay}
        disabled={disabled || (maxReplays ? replayCount >= maxReplays : false)}
        className="h-8 w-8 p-0 shrink-0"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {getAudioTypeIcon() ? (
          <span className="text-sm">{getAudioTypeIcon()}</span>
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Audio Progress/Waveform */}
      <div className="flex-1 space-y-1">
        {showWaveform ? (
          <div className="h-8 flex items-center justify-center bg-muted rounded">
            <Waves className={cn('h-4 w-4', getAudioTypeColor())} />
            <span className="ml-2 text-xs text-muted-foreground">
              Audio ready
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Audio ready for playback.
          </div>
        )}
      </div>

      {/* Replay Counter */}
      {showReplayCounter && maxReplays && (
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            replayCount >= maxReplays
              ? 'text-error-foreground'
              : 'text-muted-foreground',
          )}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {replayCount}/{maxReplays}
        </Badge>
      )}

      {/* Volume Control */}
      {showVolumeControl && (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVolume(volume > 0 ? 0 : 80)}
            className="h-6 w-6 p-0 shrink-0"
            aria-label={volume > 0 ? 'Mute audio' : 'Unmute audio'}
          >
            {volume > 0 ? (
              <Volume2 className="h-3 w-3" />
            ) : (
              <VolumeX className="h-3 w-3" />
            )}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={10}
            className="w-16"
            aria-label="Volume control"
          />
        </div>
      )}
    </div>
  );
}
