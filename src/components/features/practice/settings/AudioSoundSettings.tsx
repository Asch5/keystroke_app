'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2 } from 'lucide-react';
import type { TypingPracticeSettings } from '../hooks';

interface AudioSoundSettingsProps {
  settings: TypingPracticeSettings;
  onPlayAudioOnStartToggle: (checked: boolean) => void;
  onGameSoundsToggle: (checked: boolean) => void;
  onGameSoundVolumeChange: (value: number[]) => void;
  onKeystrokeSoundsToggle: (checked: boolean) => void;
}

/**
 * Component for audio and sound settings
 */
export function AudioSoundSettings({
  settings,
  onPlayAudioOnStartToggle,
  onGameSoundsToggle,
  onGameSoundVolumeChange,
  onKeystrokeSoundsToggle,
}: AudioSoundSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        Audio & Sound Settings
      </div>

      {/* Play Audio on Start */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="play-audio-start" className="text-sm font-medium">
            Play audio when word appears
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatically play pronunciation when a new word is shown
          </p>
        </div>
        <Switch
          id="play-audio-start"
          checked={settings.playAudioOnStart}
          onCheckedChange={onPlayAudioOnStartToggle}
        />
      </div>

      {/* Enable Game Sounds */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="enable-game-sounds" className="text-sm font-medium">
            Enable game feedback sounds
          </Label>
          <p className="text-xs text-muted-foreground">
            Play sounds for correct/incorrect typing feedback
          </p>
        </div>
        <Switch
          id="enable-game-sounds"
          checked={settings.enableGameSounds}
          onCheckedChange={onGameSoundsToggle}
        />
      </div>

      {/* Game Sound Volume */}
      {settings.enableGameSounds && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Feedback volume: {Math.round(settings.gameSoundVolume * 100)}%
            </Label>
          </div>
          <Slider
            value={[settings.gameSoundVolume * 100]}
            onValueChange={onGameSoundVolumeChange}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Enable Keystroke Sounds */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label
            htmlFor="enable-keystroke-sounds"
            className="text-sm font-medium"
          >
            Enable keystroke sounds
          </Label>
          <p className="text-xs text-muted-foreground">
            Play a subtle sound for each character typed
          </p>
        </div>
        <Switch
          id="enable-keystroke-sounds"
          checked={settings.enableKeystrokeSounds}
          onCheckedChange={onKeystrokeSoundsToggle}
        />
      </div>
    </div>
  );
}
