'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Waves } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { toast } from 'sonner';

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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;

    // Check replay limit for write-by-sound game
    if (maxReplays && replayCount >= maxReplays) {
      toast.warning(`Maximum ${maxReplays} replays reached`);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);

      // Increment replay count
      const newCount = replayCount + 1;
      setReplayCount(newCount);
      onReplayCountChange?.(newCount);
      onPlay?.();
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast.error('Failed to play audio');
    }
  }, [audioUrl, maxReplays, replayCount, onReplayCountChange, onPlay]);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [onPause]);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPause?.();
      };

      const handleError = (e: Event) => {
        console.error('Audio error:', e);
        toast.error('Failed to load audio');
        setIsPlaying(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Set volume
      audio.volume = volume / 100;

      // Auto-play if enabled
      if (autoPlay && !hasAutoPlayed) {
        setHasAutoPlayed(true);
        handlePlay();
      }

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
      };
    }
  }, [audioUrl, volume, autoPlay, hasAutoPlayed, handlePlay, onPause]);

  // Reset auto-play flag when audio URL changes
  useEffect(() => {
    setHasAutoPlayed(false);
    setReplayCount(0);
  }, [audioUrl]);

  const handleVolumeChange = (newVolume: number[]) => {
    // Ensure volumeValue is not undefined by providing a default value
    const volumeValue = newVolume[0] ?? volume;
    setVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue / 100;
    }
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
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'achievement':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          <div className="space-y-1">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{
                  width:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
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
              ? 'text-red-600 dark:text-red-400'
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
