import React, { FormEvent, ChangeEvent, RefObject } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SingleWordForm } from './SingleWordForm';
import { FileUploadForm } from './FileUploadForm';
import {
  LanguageType,
  DictionaryType,
  WordProcessorState,
  FileProcessorState,
} from '../types';

interface AddWordFormTabsProps {
  wordState: WordProcessorState;
  fileState: FileProcessorState;
  fileInputRef: RefObject<HTMLInputElement>;
  onWordChange: (word: string) => void;
  onLanguageChange: (language: LanguageType) => void;
  onDictionaryTypeChange: (type: DictionaryType) => void;
  onProcessOneWordOnlyChange: (checked: boolean) => void;
  onSingleWordSubmit: (e: FormEvent) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileUpload: () => void;
}

/**
 * Tabs component organizing single word and file upload forms
 * Provides consistent interface for both processing modes
 */
export function AddWordFormTabs({
  wordState,
  fileState,
  fileInputRef,
  onWordChange,
  onLanguageChange,
  onDictionaryTypeChange,
  onProcessOneWordOnlyChange,
  onSingleWordSubmit,
  onFileChange,
  onTriggerFileUpload,
}: AddWordFormTabsProps) {
  return (
    <Tabs defaultValue="single">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="single">Single Word</TabsTrigger>
        <TabsTrigger value="file">Upload File</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <SingleWordForm
          state={wordState}
          onWordChange={onWordChange}
          onLanguageChange={onLanguageChange}
          onDictionaryTypeChange={onDictionaryTypeChange}
          onProcessOneWordOnlyChange={onProcessOneWordOnlyChange}
          onSubmit={onSingleWordSubmit}
        />
      </TabsContent>

      <TabsContent value="file">
        <FileUploadForm
          language={wordState.language}
          dictionaryType={wordState.dictionaryType as DictionaryType}
          processOneWordOnly={wordState.processOneWordOnly}
          fileState={fileState}
          fileInputRef={fileInputRef}
          onLanguageChange={onLanguageChange}
          onDictionaryTypeChange={onDictionaryTypeChange}
          onProcessOneWordOnlyChange={onProcessOneWordOnlyChange}
          onFileChange={onFileChange}
          onTriggerFileUpload={onTriggerFileUpload}
        />
      </TabsContent>
    </Tabs>
  );
}
