'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractWordsFromDefinitionsBatch } from '@/core/domains/dictionary/actions/deepseek-actions';
import { getDefinitionsForWordDetails } from '@/core/domains/dictionary/actions/deepseek-actions';
import {
  cleanupIncorrectDeepSeekWords,
  removeLastExtractionAttempt,
} from '@/core/domains/dictionary/actions/deepseek-actions';
import type {
  WordDetailWithDefinitions,
  DefinitionForExtraction,
  ExtractWordsBatchResult,
} from '@/core/domains/dictionary/actions/deepseek-actions';

interface DeepSeekWordExtractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWordDetailIds: number[];
  onSuccess: () => void;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  results: ExtractWordsBatchResult | null;
  currentBatch: number;
  totalBatches: number;
  processedCount: number;
  totalCount: number;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'da', label: 'Danish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'no', label: 'Norwegian' },
];

export function DeepSeekWordExtractionDialog({
  open,
  onOpenChange,
  selectedWordDetailIds,
  onSuccess,
}: DeepSeekWordExtractionDialogProps) {
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['en']);
  const [sourceLanguage, setSourceLanguage] = useState<string>('da');
  const [onlyShortDefinitions, setOnlyShortDefinitions] =
    useState<boolean>(false);
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
  }, [open, selectedWordDetailIds, onlyShortDefinitions]);

  const loadDefinitions = useCallback(async () => {
    setIsLoadingDefinitions(true);
    try {
      const data = await getDefinitionsForWordDetails(
        selectedWordDetailIds,
        onlyShortDefinitions,
      );
      setWordDetailsWithDefinitions(data);
    } catch (error) {
      console.error('Error loading definitions:', error);
      toast.error('Failed to load definitions');
    } finally {
      setIsLoadingDefinitions(false);
    }
  }, [selectedWordDetailIds, onlyShortDefinitions]);

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
    const totalTokens = totalTokensPerLanguage * targetLanguages.length;
    const costPer1KTokens = 0.001; // DeepSeek pricing
    return (totalTokens / 1000) * costPer1KTokens;
  };

  // Handle removal of last extraction attempt
  const handleRemoveLastAttempt = async () => {
    setIsCleaningUp(true);
    try {
      const result = await removeLastExtractionAttempt();

      if (result.success) {
        const count = result.data?.removedCount || 0;
        if (count > 0) {
          toast.success(`Removed ${count} words from last extraction attempt`);
          onSuccess();
        } else {
          toast.info('No recent words found to remove');
        }
      } else {
        toast.error(result.error || 'Removal failed');
      }
    } catch (error) {
      console.error('Error during removal:', error);
      toast.error('An error occurred during removal');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Handle cleanup of incorrect words (legacy fix for Danish-English bug)
  const handleCleanupIncorrectWords = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupIncorrectDeepSeekWords();

      if (result.success) {
        toast.success(
          `Cleaned up ${result.data?.cleanedUp || 0} incorrect words`,
        );
        onSuccess();
      } else {
        toast.error(result.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('An error occurred during cleanup');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Handle extraction
  const handleExtractWords = async () => {
    const selectedDefinitions = getSelectedDefinitions();

    if (selectedDefinitions.length === 0) {
      toast.error('Please select at least one definition to process');
      return;
    }

    if (targetLanguages.length === 0) {
      toast.error('Please select at least one target language');
      return;
    }

    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: 'Preparing batch processing...',
      results: null,
      currentBatch: 0,
      totalBatches: 0,
      processedCount: 0,
      totalCount: selectedDefinitions.length,
    });

    const definitionIds = selectedDefinitions.map((def) => def.id);

    // Implement chunking for large batches (max 50 definitions per batch)
    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < definitionIds.length; i += CHUNK_SIZE) {
      chunks.push(definitionIds.slice(i, i + CHUNK_SIZE));
    }

    setProcessingState((prev) => ({
      ...prev,
      totalBatches: chunks.length,
      currentStep: `Processing ${chunks.length} batch(es)...`,
    }));

    let totalResults: Array<{
      definitionId: number;
      targetLanguage: string;
      word: string | null;
      confidence: number;
      connected: boolean;
      error?: string;
    }> = [];
    let totalTokensUsed = 0;
    let totalCost = 0;

    try {
      // Process each chunk sequentially
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];

        if (!chunk) {
          throw new Error(`Chunk ${chunkIndex + 1} is undefined`);
        }

        setProcessingState((prev) => ({
          ...prev,
          currentBatch: chunkIndex + 1,
          currentStep: `Processing batch ${chunkIndex + 1} of ${chunks.length}...`,
          progress: Math.round((chunkIndex / chunks.length) * 100),
        }));

        const chunkFormData = new FormData();
        chunkFormData.append('definitionIds', JSON.stringify(chunk));
        chunkFormData.append(
          'targetLanguages',
          JSON.stringify(targetLanguages),
        );
        chunkFormData.append('sourceLanguage', sourceLanguage);
        chunkFormData.append(
          'onlyShortDefinitions',
          JSON.stringify(onlyShortDefinitions),
        );

        const result = await extractWordsFromDefinitionsBatch(
          { success: false },
          chunkFormData,
        );

        if (result.success && result.data) {
          totalResults = [...totalResults, ...result.data.results];
          totalTokensUsed += result.data.totalTokensUsed;
          totalCost += result.data.totalCost;

          setProcessingState((prev) => ({
            ...prev,
            processedCount: prev.processedCount + chunk.length,
          }));

          // Small delay between chunks to avoid overwhelming the API
          if (chunkIndex < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          throw new Error(
            result.error || `Failed to process chunk ${chunkIndex + 1}`,
          );
        }
      }

      // All chunks processed successfully
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        currentStep: 'Processing completed',
      }));

      toast.success(
        `Successfully processed ${totalResults.length} definitions across ${chunks.length} batch(es). Tokens used: ${totalTokensUsed}, Cost: $${totalCost.toFixed(4)}`,
      );
      onSuccess();
    } catch (error) {
      console.error('Error during batch extraction:', error);
      setProcessingState((prev) => ({
        ...prev,
        isProcessing: false,
        currentStep: 'Error occurred',
      }));
      toast.error(
        error instanceof Error
          ? `Processing failed: ${error.message}`
          : 'An unexpected error occurred during processing',
      );
    }
  };

  // Reset dialog state when closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
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
            {/* Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Target Languages Multi-Select */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Target Languages * ({targetLanguages.length} selected)
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {targetLanguages.map((lang) => {
                        const langOption = LANGUAGE_OPTIONS.find(
                          (opt) => opt.value === lang,
                        );
                        return (
                          <Badge
                            key={lang}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Languages className="h-3 w-3" />
                            {langOption?.label}
                            <button
                              type="button"
                              onClick={() =>
                                setTargetLanguages((prev) =>
                                  prev.filter((l) => l !== lang),
                                )
                              }
                              className="ml-1 hover:text-error-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !targetLanguages.includes(value)) {
                          setTargetLanguages((prev) => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.filter(
                          (lang) => !targetLanguages.includes(lang.value),
                        ).map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              {lang.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Source Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Source Language (Auto-detected)
                    </Label>
                    <Select
                      value={sourceLanguage}
                      onValueChange={setSourceLanguage}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Short Definitions Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onlyShortDefinitions"
                      checked={onlyShortDefinitions}
                      onCheckedChange={(checked) =>
                        setOnlyShortDefinitions(!!checked)
                      }
                    />
                    <Label
                      htmlFor="onlyShortDefinitions"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Only short definitions (isInShortDef)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, only processes definitions marked as
                    &ldquo;most important&rdquo; in the database.{' '}
                    <span className="text-info-foreground font-medium">
                      Definitions will reload automatically when toggled.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

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
                  <div className="flex items-center gap-2">
                    {isLoadingDefinitions && (
                      <Loader2 className="h-4 w-4 animate-spin text-info-foreground" />
                    )}
                    {onlyShortDefinitions && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-info-subtle text-info-foreground border-info-border"
                      >
                        Short Definitions Only
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDefinitions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading definitions...</span>
                  </div>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {wordDetailsWithDefinitions.map((wordDetail) => {
                        const selectedCount = wordDetail.definitions.filter(
                          (d) => d.selected,
                        ).length;
                        const totalCount = wordDetail.definitions.length;
                        const allSelected = selectedCount === totalCount;
                        const someSelected =
                          selectedCount > 0 && selectedCount < totalCount;

                        return (
                          <div
                            key={wordDetail.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={allSelected}
                                  ref={(el) => {
                                    if (el) {
                                      const input = el.querySelector('input');
                                      if (input)
                                        input.indeterminate = someSelected;
                                    }
                                  }}
                                  onCheckedChange={(checked) =>
                                    toggleWordDetailSelection(
                                      wordDetail.id,
                                      !!checked,
                                    )
                                  }
                                />
                                <div>
                                  <h4 className="font-medium">
                                    {wordDetail.wordText}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {wordDetail.partOfSpeech}
                                    </Badge>
                                    {wordDetail.variant && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {wordDetail.variant}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {selectedCount}/{totalCount} selected
                              </Badge>
                            </div>

                            <div className="space-y-2 ml-6">
                              {wordDetail.definitions.map(
                                (definition, index) => (
                                  <div
                                    key={definition.id}
                                    className="flex items-start gap-3 p-2 rounded border-l-2 border-l-transparent hover:border-l-info-border hover:bg-content-subtle"
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
                                      <p className="text-sm text-content-secondary leading-relaxed">
                                        <span className="font-medium text-content-tertiary mr-2">
                                          {index + 1}.
                                        </span>
                                        {definition.definition}
                                        {definition.isInShortDef && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs bg-info-subtle text-info-foreground border-info-border"
                                          >
                                            Short Def
                                          </Badge>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ),
                              )}
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
                    {targetLanguages.length} languages (avg 25 input + 2 output
                    tokens per definition)
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
                        {processingState.results.error || 'Extraction failed'}
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
              targetLanguages.length === 0 ||
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
