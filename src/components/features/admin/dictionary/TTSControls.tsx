'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  generateBatchWordTTS,
  getTTSUsageStats,
  getTTSQualityLevels,
  getAvailableVoiceGenders,
  getDefaultVoiceGender,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { Volume2, Zap, DollarSign, Activity, Clock } from 'lucide-react';
import { LanguageCode } from '@prisma/client';

interface TTSControlsProps {
  selectedWords: Set<string>;
  selectedLanguage: LanguageCode;
  wordDetails: DictionaryWordDetails[];
  onAudioGenerated?: () => void;
}

interface TTSStats {
  totalCharacters: number;
  charactersByVoiceType: Record<string, number>;
  estimatedCost: number;
  remainingFreeQuota: Record<string, number>;
  lastReset: Date;
}

interface QualityLevel {
  name: string;
  description: string;
  costPerCharacter: number;
  freeLimit: number;
}

export function TTSControls({
  selectedWords,
  selectedLanguage,
  wordDetails,
  onAudioGenerated,
}: TTSControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qualityLevel, setQualityLevel] = useState<
    'standard' | 'high' | 'premium'
  >('high');
  const [ssmlGender, setSSMLGender] = useState<'MALE' | 'FEMALE' | 'NEUTRAL'>(
    'FEMALE',
  );
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // State for language-specific gender options
  const [availableGenders, setAvailableGenders] = useState<
    ('MALE' | 'FEMALE' | 'NEUTRAL')[]
  >([]);

  // TTS statistics and quality levels
  const [ttsStats, setTTSStats] = useState<TTSStats | null>(null);
  const [qualityLevels, setQualityLevels] = useState<
    Record<string, QualityLevel>
  >({});

  // Update available genders when language changes
  useEffect(() => {
    const updateGenders = async () => {
      try {
        const genders = await getAvailableVoiceGenders(selectedLanguage);
        setAvailableGenders(genders);

        // Auto-select default gender for the language
        const defaultGender = await getDefaultVoiceGender(selectedLanguage);
        if (defaultGender && genders.includes(defaultGender)) {
          setSSMLGender(defaultGender);
        } else if (genders.length > 0) {
          setSSMLGender(genders[0] as 'MALE' | 'FEMALE' | 'NEUTRAL');
        }
      } catch (error) {
        console.error('Failed to load voice genders:', error);
        // Fallback to FEMALE if there's an error
        setAvailableGenders(['FEMALE']);
        setSSMLGender('FEMALE');
      }
    };

    updateGenders();
  }, [selectedLanguage]);

  // Load TTS stats and quality levels
  useEffect(() => {
    const loadTTSData = async () => {
      try {
        const [stats, levels] = await Promise.all([
          getTTSUsageStats(),
          getTTSQualityLevels(),
        ]);
        setTTSStats(stats);
        setQualityLevels(levels);
      } catch (error) {
        console.error('Failed to load TTS data:', error);
      }
    };

    if (isDialogOpen) {
      loadTTSData();
    }
  }, [isDialogOpen]);

  const handleBatchTTS = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus(
        `Starting batch generation for ${selectedWords.size} words...`,
      );

      // Convert WordDetails IDs to Word IDs
      const selectedWordDetailsIds = Array.from(selectedWords);
      const wordIdsMap = new Map(
        wordDetails.map((detail) => [detail.id.toString(), detail.wordId]),
      );

      const wordIds = selectedWordDetailsIds
        .map((detailId) => wordIdsMap.get(detailId))
        .filter((wordId): wordId is number => wordId !== undefined);

      // Validate that word IDs are valid numbers
      const validWordIds = wordIds.filter((id) => !isNaN(id) && id > 0);

      if (validWordIds.length === 0) {
        toast.error('No valid word IDs found');
        return;
      }

      if (validWordIds.length < selectedWords.size) {
        const skippedCount = selectedWords.size - validWordIds.length;
        toast.warning(
          `${skippedCount} selected items could not be mapped to valid words`,
        );
      }

      setGenerationStatus(`Validating ${validWordIds.length} word IDs...`);

      // Start batch generation
      const result = await generateBatchWordTTS(
        validWordIds,
        selectedLanguage,
        {
          qualityLevel,
          ssmlGender,
          overwriteExisting,
          maxConcurrent: 3, // Conservative to respect rate limits
        },
      );

      // Provide detailed feedback based on results
      if (result.processed > 0) {
        const successMsg = `Successfully generated audio for ${result.processed} words`;
        const failureNote =
          result.failed > 0 ? ` (${result.failed} failed)` : '';
        const costNote = ` • Cost: $${result.totalCost.toFixed(4)}`;

        toast.success(successMsg + failureNote, {
          description: costNote,
          duration: 5000,
        });

        onAudioGenerated?.();
        setIsDialogOpen(false);
      } else if (result.failed > 0) {
        const failureReasons = new Set(result.results.map((r) => r.message));
        const reasonsList = Array.from(failureReasons).join(', ');

        toast.error(`All ${result.failed} words failed to generate audio`, {
          description: `Common reasons: ${reasonsList}`,
          duration: 7000,
        });
      } else {
        toast.error(result.message);
      }

      // Update stats
      const updatedStats = await getTTSUsageStats();
      setTTSStats(updatedStats);
    } catch (error) {
      toast.error('Batch TTS generation failed');
      console.error('Batch TTS error:', error);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  };

  const getQualityInfo = () => {
    if (!qualityLevels[qualityLevel]) return null;

    const level = qualityLevels[qualityLevel];
    return {
      name: level.name,
      description: level.description,
      costPerChar: level.costPerCharacter,
      freeLimit: level.freeLimit,
      remaining: ttsStats?.remainingFreeQuota[qualityLevel] || 0,
    };
  };

  const qualityInfo = getQualityInfo();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedWords.size === 0}
          className="flex items-center gap-2"
        >
          <Volume2 className="h-4 w-4" />
          Generate Audio ({selectedWords.size})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Text-to-Speech Generation
          </DialogTitle>
          <DialogDescription>
            Generate high-quality speech audio for {selectedWords.size} selected
            words using Google Cloud TTS. Audio files are stored securely in
            Vercel Blob Storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quality Level Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Voice Quality</h3>
              {qualityInfo && (
                <Badge variant="outline">
                  ${qualityInfo.costPerChar.toFixed(6)}/char
                </Badge>
              )}
            </div>

            <Select
              value={qualityLevel}
              onValueChange={(value: 'standard' | 'high' | 'premium') =>
                setQualityLevel(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Standard - Most Cost-Effective
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    High Quality - Neural Voices (Recommended for Words)
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Premium - Studio Quality
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {qualityInfo && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>
                      <p className="font-medium">{qualityInfo.description}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Free Quota Remaining:
                      </span>
                      <p className="font-medium text-green-600">
                        {qualityInfo.remaining.toLocaleString()} chars
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Voice Gender Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Voice Gender</h3>
            <Select
              value={ssmlGender}
              onValueChange={(value: 'MALE' | 'FEMALE' | 'NEUTRAL') =>
                setSSMLGender(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableGenders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Options</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overwrite"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="overwrite" className="text-sm">
                Overwrite existing audio files
              </label>
            </div>
          </div>

          {/* Usage Statistics */}
          {ttsStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Total Characters:
                    </span>
                    <p className="font-medium">
                      {ttsStats.totalCharacters.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Estimated Cost:
                    </span>
                    <p className="font-medium">
                      ${ttsStats.estimatedCost.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Reset:</span>
                    <p className="font-medium">
                      {new Date(ttsStats.lastReset).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Standard Quota:
                    </span>
                    <p className="font-medium text-green-600">
                      {ttsStats.remainingFreeQuota.standard?.toLocaleString() ||
                        0}{' '}
                      remaining
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Generating Audio...
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(generationProgress)}%
                    </span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                  {generationStatus && (
                    <p className="text-sm text-muted-foreground">
                      {generationStatus}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBatchTTS}
              disabled={isGenerating || selectedWords.size === 0}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Generate Audio for {selectedWords.size} Words
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
