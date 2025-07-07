'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Eye,
  Pause,
  CheckCircle,
  SkipForward,
  TrendingUp,
  FileText,
  Phone,
  Hash,
  Award,
} from 'lucide-react';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

interface VocabularyBehaviorSettingsProps {
  settings: VocabularyPracticeSettings;
  onPauseOnIncorrectAnswerToggle: (checked: boolean) => void;
  onShowCorrectAnswerOnMistakeToggle: (checked: boolean) => void;
  onAllowSkipDifficultWordsToggle: (checked: boolean) => void;
  onAdaptiveDifficultyToggle: (checked: boolean) => void;
  onShowProgressBarToggle: (checked: boolean) => void;
  onShowDefinitionImagesToggle: (checked: boolean) => void;
  onShowPhoneticPronunciationToggle: (checked: boolean) => void;
  onShowPartOfSpeechToggle: (checked: boolean) => void;
  onShowLearningStatusToggle: (checked: boolean) => void;
}

/**
 * Component for vocabulary practice behavior and display settings
 */
export function VocabularyBehaviorSettings({
  settings,
  onPauseOnIncorrectAnswerToggle,
  onShowCorrectAnswerOnMistakeToggle,
  onAllowSkipDifficultWordsToggle,
  onAdaptiveDifficultyToggle,
  onShowProgressBarToggle,
  onShowDefinitionImagesToggle,
  onShowPhoneticPronunciationToggle,
  onShowPartOfSpeechToggle,
  onShowLearningStatusToggle,
}: VocabularyBehaviorSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Behavior Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="h-4 w-4" />
          Behavior Settings
        </div>

        {/* Pause on Incorrect Answer */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              <Label htmlFor="pause-incorrect" className="text-sm font-medium">
                Pause on incorrect answer
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Require manual confirmation before moving to next word after
              mistakes
            </p>
          </div>
          <Switch
            id="pause-incorrect"
            checked={settings.pauseOnIncorrectAnswer}
            onCheckedChange={onPauseOnIncorrectAnswerToggle}
          />
        </div>

        {/* Show Correct Answer on Mistake */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <Label
                htmlFor="show-correct-answer"
                className="text-sm font-medium"
              >
                Show correct answer on mistake
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display the correct answer when user makes an error
            </p>
          </div>
          <Switch
            id="show-correct-answer"
            checked={settings.showCorrectAnswerOnMistake}
            onCheckedChange={onShowCorrectAnswerOnMistakeToggle}
          />
        </div>

        {/* Allow Skip Difficult Words */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <SkipForward className="h-4 w-4" />
              <Label htmlFor="skip-difficult" className="text-sm font-medium">
                Allow skip difficult words
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Enable skip option for challenging words during practice
            </p>
          </div>
          <Switch
            id="skip-difficult"
            checked={settings.allowSkipDifficultWords}
            onCheckedChange={onAllowSkipDifficultWordsToggle}
          />
        </div>

        {/* Adaptive Difficulty */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <Label
                htmlFor="adaptive-difficulty"
                className="text-sm font-medium"
              >
                Adaptive difficulty
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically adjust exercise difficulty based on performance
            </p>
          </div>
          <Switch
            id="adaptive-difficulty"
            checked={settings.adaptiveDifficulty}
            onCheckedChange={onAdaptiveDifficultyToggle}
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Eye className="h-4 w-4" />
          Display Settings
        </div>

        {/* Show Progress Bar */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <Label htmlFor="progress-bar" className="text-sm font-medium">
                Show progress bar
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display session progress and statistics at the top
            </p>
          </div>
          <Switch
            id="progress-bar"
            checked={settings.showProgressBar}
            onCheckedChange={onShowProgressBarToggle}
          />
        </div>

        {/* Show Definition Images */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Label
                htmlFor="definition-images"
                className="text-sm font-medium"
              >
                Show definition images
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display visual aids and images when available
            </p>
          </div>
          <Switch
            id="definition-images"
            checked={settings.showDefinitionImages}
            onCheckedChange={onShowDefinitionImagesToggle}
          />
        </div>

        {/* Show Phonetic Pronunciation */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <Label
                htmlFor="phonetic-pronunciation"
                className="text-sm font-medium"
              >
                Show phonetic pronunciation
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display phonetic symbols for word pronunciation
            </p>
          </div>
          <Switch
            id="phonetic-pronunciation"
            checked={settings.showPhoneticPronunciation}
            onCheckedChange={onShowPhoneticPronunciationToggle}
          />
        </div>

        {/* Show Part of Speech */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <Label htmlFor="part-of-speech" className="text-sm font-medium">
                Show part of speech
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display grammatical category (noun, verb, adjective, etc.)
            </p>
          </div>
          <Switch
            id="part-of-speech"
            checked={settings.showPartOfSpeech}
            onCheckedChange={onShowPartOfSpeechToggle}
          />
        </div>

        {/* Show Learning Status */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <Label htmlFor="learning-status" className="text-sm font-medium">
                Show learning status
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Display current learning progress badges (learned, in progress,
              etc.)
            </p>
          </div>
          <Switch
            id="learning-status"
            checked={settings.showLearningStatus}
            onCheckedChange={onShowLearningStatusToggle}
          />
        </div>
      </div>
    </div>
  );
}
