import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranslationResultProps } from '../types';
import { BasicTranslation } from './BasicTranslation';
import { DefinitionsTab } from './DefinitionsTab';
import { ExamplesTab } from './ExamplesTab';
import { RawJsonTab } from './RawJsonTab';
import { TranslationsTab } from './TranslationsTab';

/**
 * Translation result component that displays all translation data
 * Organizes results into tabs for different views
 */
export function TranslationResult({ result }: TranslationResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Translation Result</CardTitle>
        <CardDescription>
          Translation from {result.word} to {result.translation}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
            <TabsTrigger value="definitions">Definitions</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicTranslation result={result} />
          </TabsContent>

          <TabsContent value="translations">
            <TranslationsTab translations={result.translations} />
          </TabsContent>

          <TabsContent value="definitions">
            <DefinitionsTab definitions={result.definitions} />
          </TabsContent>

          <TabsContent value="examples">
            <ExamplesTab examples={result.examples} />
          </TabsContent>

          <TabsContent value="raw">
            <RawJsonTab result={result} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
