import { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { ProcessedWord } from '../types';

/**
 * Hook for processing file uploads and batch word processing
 */
export function useFileProcessor() {
  const processFileContent = async (
    content: string,
    processWord: (word: string) => Promise<ProcessedWord[] | null>,
    onFileUploading: (uploading: boolean) => void,
    onFileNameChange: (fileName: string) => void,
  ): Promise<ProcessedWord[]> => {
    onFileUploading(true);
    const allProcessedWords: ProcessedWord[] = [];

    try {
      const words = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (words.length === 0) {
        toast.error('The file appears to be empty or contains no valid words.');
        return [];
      }

      let processedCount = 0;
      for (const word of words) {
        try {
          const results = await processWord(word);
          if (results) {
            allProcessedWords.push(...results);
          }
          processedCount++;

          // Show progress for large files
          if (words.length > 10 && processedCount % 5 === 0) {
            toast.info(`Processed ${processedCount}/${words.length} words...`);
          }
        } catch (error) {
          console.error(`Error processing word "${word}":`, error);
          toast.error(`Failed to process word: ${word}`);
        }
      }

      toast.success(
        `Successfully processed ${processedCount} words from file.`,
      );
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please try again.');
    } finally {
      onFileUploading(false);
      onFileNameChange('');
    }

    return allProcessedWords;
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    processWord: (word: string) => Promise<ProcessedWord[] | null>,
    onFileUploading: (uploading: boolean) => void,
    onFileNameChange: (fileName: string) => void,
    onWordsProcessed: (words: ProcessedWord[]) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error('Please select a .txt file');
      return;
    }

    if (file.size > 1024 * 1024) {
      // 1MB limit
      toast.error('File too large. Please select a file smaller than 1MB.');
      return;
    }

    onFileNameChange(file.name);

    try {
      const content = await file.text();
      const processedWords = await processFileContent(
        content,
        processWord,
        onFileUploading,
        onFileNameChange,
      );

      onWordsProcessed(processedWords);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file. Please try again.');
      onFileUploading(false);
      onFileNameChange('');
    }

    // Reset file input
    e.target.value = '';
  };

  return {
    handleFileChange,
    processFileContent,
  };
}
