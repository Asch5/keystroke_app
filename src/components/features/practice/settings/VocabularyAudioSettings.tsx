'use client';

import { Volume2, VolumeX, Play } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

interface VocabularyAudioSettingsProps {
  settings: VocabularyPracticeSettings;
  onAutoPlayAudioOnWordCardToggle: (checked: boolean) => void;
  onAutoPlayAudioOnGameStartToggle: (checked: boolean) => void;
  onGameSoundsToggle: (checked: boolean) => void;
  onGameSoundVolumeChange: (value: number[]) => void;
}

/**
 * Component for vocabulary practice audio settings
 */
export function VocabularyAudioSettings({
  settings,
  onAutoPlayAudioOnWordCardToggle,
  onAutoPlayAudioOnGameStartToggle,
  onGameSoundsToggle,
  onGameSoundVolumeChange,
}: VocabularyAudioSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        Audio Settings
      </div>

      {/* Auto Play Audio on Word Card */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <Label
              htmlFor="auto-play-word-card"
              className="text-sm font-medium"
            >
              Auto-play audio on Word Card
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically play word pronunciation when Word Card appears
          </p>
        </div>
        <Switch
          id="auto-play-word-card"
          checked={settings.autoPlayAudioOnWordCard}
          onCheckedChange={onAutoPlayAudioOnWordCardToggle}
        />
      </div>

      {/* Auto Play Audio on Game Start */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            <Label
              htmlFor="auto-play-game-start"
              className="text-sm font-medium"
            >
              Auto-play audio when exercises start
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically play word pronunciation at the beginning of each
            exercise
          </p>
        </div>
        <Switch
          id="auto-play-game-start"
          checked={settings.autoPlayAudioOnGameStart}
          onCheckedChange={onAutoPlayAudioOnGameStartToggle}
        />
      </div>

      {/* Game Sounds */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {settings.enableGameSounds ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <Label htmlFor="game-sounds" className="text-sm font-medium">
              Game sound effects
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Play success/error sounds when answering exercises
          </p>
        </div>
        <Switch
          id="game-sounds"
          checked={settings.enableGameSounds}
          onCheckedChange={onGameSoundsToggle}
        />
      </div>

      {/* Game Sound Volume */}
      {settings.enableGameSounds && (
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label className="text-sm font-medium">
              Sound effects volume: {Math.round(settings.gameSoundVolume * 100)}
              %
            </Label>
            <p className="text-xs text-muted-foreground">
              Adjust the volume of game sound effects
            </p>
          </div>
          <div className="w-32">
            <Slider
              value={[settings.gameSoundVolume * 100]}
              onValueChange={onGameSoundVolumeChange}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
