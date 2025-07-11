'use client';

import { Zap, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  extractWordsFromDefinitionsBatch,
  getDefinitionsForWordDetails,
  cleanupIncorrectDeepSeekWords,
  removeLastExtractionAttempt,
} from '@/core/domains/dictionary/actions/deepseek-actions';
import type {
  WordDetailWithDefinitions,
  DefinitionForExtraction,
} from '@/core/domains/dictionary/actions/deepseek-actions';
import { ConfigurationSection } from './deepseek-word-extraction-dialog/components/ConfigurationSection';
import {
  DeepSeekWordExtractionDialogProps,
  ProcessingState,
  ConfigurationState,
} from './deepseek-word-extraction-dialog/types';
import {
  DEFAULT_TARGET_LANGUAGES,
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_ONLY_SHORT_DEFINITIONS,
} from './deepseek-word-extraction-dialog/utils/constants';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';

export function DeepSeekWordExtractionDialog({
  open,
  onOpenChange,
  selectedWordDetailIds,
  onSuccess,
}: DeepSeekWordExtractionDialogProps) {
  const [configuration, setConfiguration] = useState<ConfigurationState>({
    targetLanguages: DEFAULT_TARGET_LANGUAGES,
    sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
    onlyShortDefinitions: DEFAULT_ONLY_SHORT_DEFINITIONS,
  });

  const [wordDetailsWithDefinitions, setWordDetailsWithDefinitions] = useState<
    WordDetailWithDefinitions[]
  >([]);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    results: null,
    currentBatch: 0,
    totalBatches: 0,
    processedCount: 0,
    totalCount: 0,
  });
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Load definitions when dialog opens, selected words change, or filter changes
  useEffect(() => {
    if (open && selectedWordDetailIds.length > 0) {
      loadDefinitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedWordDetailIds, configuration.onlyShortDefinitions]);

  const loadDefinitions = useCallback(async () => {
    setIsLoadingDefinitions(true);
    try {
      const data = await getDefinitionsForWordDetails(
        selectedWordDetailIds,
        configuration.onlyShortDefinitions,
      );
      setWordDetailsWithDefinitions(data);
    } catch (error) {
      await errorLog(
        'Error loading definitions',
        error instanceof Error ? error.message : String(error),
      );
      toast.error('Failed to extract definitions');
    } finally {
      setIsLoadingDefinitions(false);
    }
  }, [selectedWordDetailIds, configuration.onlyShortDefinitions]);

  // Toggle definition selection
  const toggleDefinitionSelection = (
    wordDetailId: number,
    definitionId: number,
  ) => {
    setWordDetailsWithDefinitions((prev) =>
      prev.map((wd) =>
        wd.id === wordDetailId
          ? {
              ...wd,
              definitions: wd.definitions.map((def) =>
                def.id === definitionId
                  ? { ...def, selected: !def.selected }
                  : def,
              ),
            }
          : wd,
      ),
    );
  };

  // Toggle all definitions for a WordDetail
  const toggleWordDetailSelection = (
    wordDetailId: number,
    selected: boolean,
  ) => {
    setWordDetailsWithDefinitions((prev) =>
      prev.map((wd) =>
        wd.id === wordDetailId
          ? {
              ...wd,
              definitions: wd.definitions.map((def) => ({
                ...def,
                selected,
              })),
            }
          : wd,
      ),
    );
  };

  // Get selected definitions
  const getSelectedDefinitions = (): DefinitionForExtraction[] => {
    return wordDetailsWithDefinitions.flatMap((wd) =>
      wd.definitions.filter((def) => def.selected),
    );
  };

  // Calculate cost estimate for multiple languages
  const calculateCostEstimate = () => {
    const selectedDefinitions = getSelectedDefinitions();
    const avgTokensPerDefinition = 25; // Conservative estimate
    const outputTokens = 2; // Single word output
    const totalTokensPerLanguage =
      selectedDefinitions.length * (avgTokensPerDefinition + outputTokens);
    const totalTokens =
      totalTokensPerLanguage * configuration.targetLanguages.length;
    const costPer1KTokens = 0.001; // DeepSeek pricing
    return (totalTokens / 1000) * costPer1KTokens;
  };

  // Handle removal of last extraction attempt
  const handleRemoveLastAttempt = async () => {
    setIsCleaningUp(true);
    try {
      const result = await removeLastExtractionAttempt();

      if (result.success) {
        const count = result.data?.removedCount ?? 0;
        if (count > 0) {
          toast.success(`Removed ${count} words from last extraction attempt`);
          onSuccess();
        } else {
          toast.info('No recent DeepSeek extractions found to remove');
        }
      } else {
        toast.error(result.error ?? 'Failed to remove last extraction');
      }
    } catch (error) {
      console.error('Error removing last attempt:', error);
      toast.error('Failed to remove last extraction attempt');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Handle cleanup of incorrect words (legacy fix)
  const handleCleanupIncorrectWords = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupIncorrectDeepSeekWords();

      if (result.success) {
        const count = result.data?.cleanedUp ?? 0;
        if (count > 0) {
          toast.success(`Cleaned up ${count} incorrect DeepSeek words`);
          onSuccess();
        } else {
          toast.info('No incorrect words found to clean up');
        }
      } else {
        toast.error(result.error ?? 'Failed to cleanup incorrect words');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('Failed to cleanup incorrect words');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Main extraction handler
  const handleExtractWords = async () => {
    const selectedDefinitions = getSelectedDefinitions();
    if (selectedDefinitions.length === 0) {
      toast.error('Please select at least one definition');
      return;
    }

    if (configuration.targetLanguages.length === 0) {
      toast.error('Please select at least one target language');
      return;
    }

    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: 'Starting extraction...',
      results: null,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: selectedDefinitions.length,
    });

    try {
      // Prepare form data for server action
      const formData = new FormData();
      formData.append(
        'definitionIds',
        JSON.stringify(selectedDefinitions.map((d) => d.id)),
      );
      formData.append(
        'targetLanguages',
        JSON.stringify(configuration.targetLanguages),
      );
      if (configuration.sourceLanguage) {
        formData.append('sourceLanguage', configuration.sourceLanguage);
      }
      formData.append(
        'onlyShortDefinitions',
        JSON.stringify(configuration.onlyShortDefinitions),
      );

      // Call server action with proper parameters
      const result = await extractWordsFromDefinitionsBatch(
        { success: false }, // prevState
        formData,
      );

      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        currentStep: 'Completed',
        results: result,
      }));

      if (result.success) {
        toast.success(
          `Successfully extracted ${result.data?.successCount ?? 0} words`,
        );
        onSuccess();
      } else {
        toast.error(result.error ?? 'Extraction failed');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        results: {
          success: false,
          error: 'Unexpected error during extraction',
        },
      }));
      toast.error('Unexpected error during extraction');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !processingState.isProcessing) {
      // Reset state when closing
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentStep: '',
        results: null,
        currentBatch: 0,
        totalBatches: 0,
        processedCount: 0,
        totalCount: 0,
      });
    }
    onOpenChange(newOpen);
  };

  const selectedDefinitions = getSelectedDefinitions();
  const costEstimate = calculateCostEstimate();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-info-foreground" />
            DeepSeek Word Extraction
          </DialogTitle>
          <DialogDescription>
            Extract words from definitions using AI. Select the definitions you
            want to process.
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Enhanced:</strong> Flexible prompts optimized for all
                language combinations with language-specific cleaning patterns.
              </AlertDescription>
            </Alert>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Configuration Section - Now using the modular component */}
            <ConfigurationSection
              configuration={configuration}
              onTargetLanguagesChange={(languages) =>
                setConfiguration((prev) => ({
                  ...prev,
                  targetLanguages: languages,
                }))
              }
              onSourceLanguageChange={(language) =>
                setConfiguration((prev) => ({
                  ...prev,
                  sourceLanguage: language,
                }))
              }
              onOnlyShortDefinitionsChange={(value) =>
                setConfiguration((prev) => ({
                  ...prev,
                  onlyShortDefinitions: value,
                }))
              }
            />

            {/* The rest of the component content remains the same for now */}
            {/* This section will be refactored in subsequent iterations */}

            {/* Remove Last Attempt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  ↩️ Remove Last Extraction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Wrong language chosen?</strong> Remove words created
                    in the last 10 minutes from DeepSeek extractions. Useful
                    when you selected the wrong target/source language
                    combination.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleRemoveLastAttempt}
                    disabled={isCleaningUp}
                    variant="outline"
                    className="w-full"
                  >
                    {isCleaningUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>🗑️ Remove Last Attempt</>
                    )}
                  </Button>
                  <Button
                    onClick={handleCleanupIncorrectWords}
                    disabled={isCleaningUp}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Legacy Fix
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Definitions Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>
                    Selected Definitions ({selectedDefinitions.length})
                  </span>
                  {isLoadingDefinitions && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDefinitions ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading definitions...
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {wordDetailsWithDefinitions.map((wordDetail) => {
                        const selectedCount = wordDetail.definitions.filter(
                          (def) => def.selected,
                        ).length;
                        const allSelected =
                          selectedCount === wordDetail.definitions.length;

                        return (
                          <div
                            key={wordDetail.id}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) =>
                                    toggleWordDetailSelection(
                                      wordDetail.id,
                                      !!checked,
                                    )
                                  }
                                />
                                <h4 className="font-medium">
                                  {wordDetail.wordText}
                                </h4>
                                <Badge variant="outline">
                                  {selectedCount}/
                                  {wordDetail.definitions.length}
                                </Badge>
                              </div>
                            </div>
                            <div className="ml-6 space-y-1">
                              {wordDetail.definitions.map((definition) => (
                                <div
                                  key={definition.id}
                                  className="flex items-start space-x-2"
                                >
                                  <Checkbox
                                    checked={definition.selected}
                                    onCheckedChange={() =>
                                      toggleDefinitionSelection(
                                        wordDetail.id,
                                        definition.id,
                                      )
                                    }
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                      {definition.definition}
                                    </p>
                                    {definition.isInShortDef && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs mt-1"
                                      >
                                        Short Definition
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Estimated Cost:</strong> ~${costEstimate.toFixed(4)}{' '}
                    USD
                  </span>
                  <span className="text-sm text-muted-foreground">
                    For {selectedDefinitions.length} definitions ×{' '}
                    {configuration.targetLanguages.length} languages (avg 25
                    input + 2 output tokens per definition)
                  </span>
                </div>
              </AlertDescription>
            </Alert>

            {/* API Status Warning */}
            {processingState.results && !processingState.results.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">DeepSeek API Error:</p>
                    <p>{processingState.results.error}</p>
                    {processingState.results.error?.includes(
                      'Insufficient balance',
                    ) && (
                      <div className="mt-2 p-2 bg-error-subtle rounded text-sm">
                        <p>
                          <strong>How to fix:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          <li>
                            Visit{' '}
                            <a
                              href="https://platform.deepseek.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              platform.deepseek.com
                            </a>
                          </li>
                          <li>Add credits to your account</li>
                          <li>Try the extraction again</li>
                        </ol>
                      </div>
                    )}
                    {processingState.results.error?.includes(
                      'DEEPSEEK_API_KEY not configured',
                    ) && (
                      <div className="mt-2 p-2 bg-error-subtle rounded text-sm">
                        <p>
                          <strong>How to fix:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          <li>
                            Get your API key from{' '}
                            <a
                              href="https://platform.deepseek.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              platform.deepseek.com
                            </a>
                          </li>
                          <li>
                            Add <code>DEEPSEEK_API_KEY=your_key_here</code> to
                            your .env.local file
                          </li>
                          <li>Restart the development server</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Processing State */}
            {processingState.isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {processingState.currentStep}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {processingState.progress}%
                      </span>
                    </div>
                    <Progress value={processingState.progress} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {processingState.results && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {processingState.results.success ? (
                      <CheckCircle className="h-4 w-4 text-success-foreground" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error-foreground" />
                    )}
                    Extraction Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {processingState.results.success &&
                  processingState.results.data ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-success-foreground">
                            {processingState.results.data.successCount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Successful
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-error-foreground">
                            {processingState.results.data.failureCount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Failed
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            ${processingState.results.data.totalCost.toFixed(4)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Cost
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {processingState.results.data.results.map(
                            (result) => {
                              const definition = selectedDefinitions.find(
                                (d) => d.id === result.definitionId,
                              );
                              return (
                                <div
                                  key={result.definitionId}
                                  className="flex items-center justify-between p-2 rounded border"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">
                                      {definition?.definition.substring(0, 60)}
                                      ...
                                    </p>
                                  </div>
                                  {result.word ? (
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="default"
                                        className="bg-success-subtle text-success-foreground"
                                      >
                                        &ldquo;{result.word}&rdquo;
                                      </Badge>
                                      {result.connected && (
                                        <CheckCircle className="h-4 w-4 text-success-foreground" />
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="destructive">Failed</Badge>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {processingState.results.error ?? 'Extraction failed'}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExtractWords}
            disabled={
              processingState.isProcessing ||
              selectedDefinitions.length === 0 ||
              configuration.targetLanguages.length === 0 ||
              isLoadingDefinitions
            }
            className="min-w-32"
          >
            {processingState.isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Extract Words
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
