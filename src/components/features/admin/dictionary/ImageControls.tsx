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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  generateBatchWordImages,
  getImageStats,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { Image as ImageIcon, Zap, Activity, Clock, Info } from 'lucide-react';

interface ImageControlsProps {
  selectedWords: Set<string>;
  wordDetails: DictionaryWordDetails[];
  onImagesGenerated?: () => void;
}

interface ImageStats {
  totalImages: number;
  definitionsWithImages: number;
  definitionsWithoutImages: number;
  recentlyGenerated: number;
}

export function ImageControls({
  selectedWords,
  wordDetails,
  onImagesGenerated,
}: ImageControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [imageStats, setImageStats] = useState<ImageStats | null>(null);

  // Load image stats
  useEffect(() => {
    const loadImageStats = async () => {
      try {
        const stats = await getImageStats();
        setImageStats(stats);
      } catch (error) {
        console.error('Failed to load image stats:', error);
      }
    };

    if (isDialogOpen) {
      loadImageStats();
    }
  }, [isDialogOpen]);

  const handleBatchImageGeneration = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus(
        `Starting batch image generation for ${selectedWords.size} words...`,
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
      const result = await generateBatchWordImages(validWordIds, {
        overwriteExisting,
        maxConcurrent: 2, // Conservative to respect Pexels API rate limits
      });

      // Provide detailed feedback based on results
      if (result.processed > 0) {
        const successMsg = `Successfully generated images for ${result.processed} words`;
        const failureNote =
          result.failed > 0 ? ` (${result.failed} failed)` : '';

        toast.success(successMsg + failureNote, {
          description: 'Images have been generated and linked to definitions',
          duration: 5000,
        });

        onImagesGenerated?.();
        setIsDialogOpen(false);
      } else if (result.failed > 0) {
        const failureReasons = new Set(result.results.map((r) => r.message));
        const reasonsList = Array.from(failureReasons).join(', ');

        toast.error(`All ${result.failed} words failed to generate images`, {
          description: `Common reasons: ${reasonsList}`,
          duration: 7000,
        });
      } else {
        toast.error(result.message);
      }

      // Update stats
      const updatedStats = await getImageStats();
      setImageStats(updatedStats);
    } catch (error) {
      toast.error('Batch image generation failed');
      console.error('Batch image generation error:', error);
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  };

  const wordsWithoutImages = wordDetails.filter(
    (detail) => selectedWords.has(detail.id.toString()) && !detail.hasImage,
  ).length;

  const wordsWithImages = wordDetails.filter(
    (detail) => selectedWords.has(detail.id.toString()) && detail.hasImage,
  ).length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedWords.size === 0}
          className="min-w-[140px]"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Generate Images ({selectedWords.size})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Generate Images for Selected Words
          </DialogTitle>
          <DialogDescription>
            Generate images for word definitions using Pexels API. Images help
            with visual learning and memory retention.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stats */}
          {imageStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-info-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {imageStats.totalImages}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Images
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-success-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {imageStats.definitionsWithImages}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        With Images
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-warning-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {imageStats.definitionsWithoutImages}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Without Images
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-accent-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {imageStats.recentlyGenerated}
                      </p>
                      <p className="text-xs text-muted-foreground">Last 24h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Selection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Words without images:</span>
                  <Badge variant="secondary">{wordsWithoutImages}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Words with images:</span>
                  <Badge variant="default">{wordsWithImages}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) =>
                      setOverwriteExisting(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="overwrite"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Overwrite existing images
                  </label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {overwriteExisting
                    ? 'All selected words will get new images'
                    : 'Only words without images will be processed'}
                </p>
              </div>

              <div className="p-3 bg-info-subtle rounded-lg">
                <p className="text-sm text-info-foreground">
                  <Info className="h-4 w-4 inline mr-1" />
                  Images are sourced from Pexels and automatically selected
                  based on word definitions and translations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Generating Images...
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
              onClick={handleBatchImageGeneration}
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
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generate Images for {selectedWords.size} Words
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
