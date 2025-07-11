import { Upload } from 'lucide-react';
import React, { ChangeEvent, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/core/lib/utils';
import { LanguageType, DictionaryType, FileProcessorState } from '../types';
import { LanguageSettings } from './LanguageSettings';

interface FileUploadFormProps {
  language: LanguageType;
  dictionaryType: DictionaryType;
  processOneWordOnly: boolean;
  fileState: FileProcessorState;
  fileInputRef: RefObject<HTMLInputElement>;
  onLanguageChange: (language: LanguageType) => void;
  onDictionaryTypeChange: (type: DictionaryType) => void;
  onProcessOneWordOnlyChange: (checked: boolean) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileUpload: () => void;
}

/**
 * Form component for uploading and processing files containing multiple words
 * Includes drag-and-drop area and batch processing options
 */
export function FileUploadForm({
  language,
  dictionaryType,
  processOneWordOnly,
  fileState,
  fileInputRef,
  onLanguageChange,
  onDictionaryTypeChange,
  onProcessOneWordOnlyChange,
  onFileChange,
  onTriggerFileUpload,
}: FileUploadFormProps) {
  return (
    <div className="space-y-6">
      <LanguageSettings
        language={language}
        dictionaryType={dictionaryType}
        onLanguageChange={onLanguageChange}
        onDictionaryTypeChange={onDictionaryTypeChange}
      />

      <div className="flex items-start space-x-3 rounded-md border p-4">
        <Checkbox
          id="processOneWordOnlyFile"
          checked={processOneWordOnly}
          onCheckedChange={(checked) =>
            onProcessOneWordOnlyChange(checked === true)
          }
        />
        <div className="space-y-1 leading-none">
          <Label
            htmlFor="processOneWordOnlyFile"
            className="text-sm font-medium"
          >
            Process only one word
          </Label>
          <p className="text-sm text-muted-foreground">
            When enabled, only the first matching word will be processed
          </p>
        </div>
      </div>

      <div
        onClick={onTriggerFileUpload}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors',
          fileState.fileUploading && 'opacity-50 pointer-events-none',
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".txt"
          onChange={onFileChange}
          disabled={fileState.fileUploading}
        />
        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="font-medium">
          {fileState.uploadedFileName ?? 'Click to upload a .txt file'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Each line will be processed as a separate word
        </p>
      </div>

      <Button
        onClick={onTriggerFileUpload}
        className="w-full"
        disabled={fileState.fileUploading}
      >
        {fileState.fileUploading ? 'Processing...' : 'Upload and Process File'}
      </Button>
    </div>
  );
}
