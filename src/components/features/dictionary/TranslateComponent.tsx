'use client';

import { useState } from 'react';
import { TranslationSynonym, Definition } from 'extended-google-translate-api';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

// Types
interface TranslationResponse {
  word: string;
  translation: string;
  wordTranscription?: string;
  translationTranscription?: string;
  translations?: Record<string, (string | TranslationSynonym)[]>;
  definitions?: Record<string, (string | Definition)[]>;
  examples?: string[];
}

// Language options for source and destination
const languageOptions = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ar', label: 'Arabic' },
];

export default function TranslateComponent() {
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [destLang, setDestLang] = useState('en');

  // Options state
  const [options, setOptions] = useState({
    returnRawResponse: false,
    detailedTranslations: true,
    definitionSynonyms: false,
    detailedTranslationsSynonyms: false,
    definitions: true,
    definitionExamples: false,
    examples: true,
    removeStyles: true,
  });

  // Handle option change
  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({
      ...prev,
      [option]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text) {
      toast({
        title: 'Error',
        description: 'Please enter text to translate',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call our API route
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          destLang,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation request failed');
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: 'Translation complete',
        description: 'Translation has been successfully completed.',
      });
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast({
        title: 'Translation failed',
        description:
          err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Translation API Tester</CardTitle>
          <CardDescription>
            Test the extended-google-translate-api package with various options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text to translate</Label>
              <Input
                id="text"
                placeholder="Enter text to translate..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                Enter a word or phrase to translate and get detailed information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceLang">Source Language</Label>
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destLang">Destination Language</Label>
                <Select value={destLang} onValueChange={setDestLang}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h3 className="text-lg font-medium">API Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(options).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        handleOptionChange(
                          key as keyof typeof options,
                          checked === true,
                        )
                      }
                    />
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Translating...' : 'Translate'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600 pt-4">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
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

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Original</h3>
                    <p className="text-xl">{result.word}</p>
                    {result.wordTranscription && (
                      <p className="text-sm text-gray-500 mt-1">
                        /{result.wordTranscription}/
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Translation</h3>
                    <p className="text-xl">{result.translation}</p>
                    {result.translationTranscription && (
                      <p className="text-sm text-gray-500 mt-1">
                        /{result.translationTranscription}/
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="translations">
                {result.translations &&
                Object.keys(result.translations).length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(result.translations).map(
                      ([type, translations]: [
                        string,
                        (string | TranslationSynonym)[],
                      ]) => (
                        <AccordionItem key={type} value={type}>
                          <AccordionTrigger className="capitalize">
                            {type}
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-6 space-y-1">
                              {Array.isArray(translations) &&
                                translations.map(
                                  (
                                    translation: string | TranslationSynonym,
                                    idx: number,
                                  ) => {
                                    if (typeof translation === 'string') {
                                      return <li key={idx}>{translation}</li>;
                                    } else if (translation.translation) {
                                      return (
                                        <li key={idx}>
                                          <div>
                                            <span className="font-medium">
                                              {translation.translation}
                                            </span>
                                            {translation.synonyms &&
                                              translation.synonyms.length >
                                                0 && (
                                                <span className="text-gray-500 ml-2">
                                                  (Synonyms:{' '}
                                                  {translation.synonyms.join(
                                                    ', ',
                                                  )}
                                                  )
                                                </span>
                                              )}
                                          </div>
                                        </li>
                                      );
                                    }
                                    return null;
                                  },
                                )}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ),
                    )}
                  </Accordion>
                ) : (
                  <p className="text-gray-500">
                    No detailed translations available
                  </p>
                )}
              </TabsContent>

              <TabsContent value="definitions">
                {result.definitions &&
                Object.keys(result.definitions).length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(result.definitions).map(
                      ([type, definitions]: [
                        string,
                        (string | Definition)[],
                      ]) => (
                        <AccordionItem key={type} value={type}>
                          <AccordionTrigger className="capitalize">
                            {type}
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-6 space-y-2">
                              {Array.isArray(definitions) &&
                                definitions.map(
                                  (def: string | Definition, idx: number) => {
                                    if (typeof def === 'string') {
                                      return <li key={idx}>{def}</li>;
                                    } else if (def.definition) {
                                      return (
                                        <li key={idx}>
                                          <div className="mb-1">
                                            {def.definition}
                                          </div>
                                          {def.example && (
                                            <div className="text-gray-600 text-sm ml-2 italic">
                                              Example: {def.example}
                                            </div>
                                          )}
                                          {def.synonyms &&
                                            Object.keys(def.synonyms).length >
                                              0 && (
                                              <div className="text-gray-600 text-sm ml-2">
                                                <span className="font-medium">
                                                  Synonyms:{' '}
                                                </span>
                                                {Object.entries(
                                                  def.synonyms,
                                                ).map(
                                                  ([type, words]: [
                                                    string,
                                                    string[],
                                                  ]) => (
                                                    <span
                                                      key={type}
                                                      className="mr-2"
                                                    >
                                                      {type !== 'normal' && (
                                                        <span className="italic">
                                                          ({type})
                                                        </span>
                                                      )}
                                                      {Array.isArray(words) &&
                                                        words.join(', ')}
                                                    </span>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                        </li>
                                      );
                                    }
                                    return null;
                                  },
                                )}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ),
                    )}
                  </Accordion>
                ) : (
                  <p className="text-gray-500">No definitions available</p>
                )}
              </TabsContent>

              <TabsContent value="examples">
                {result.examples && result.examples.length > 0 ? (
                  <ul className="list-disc pl-6 space-y-1">
                    {result.examples.map((example: string, idx: number) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No examples available</p>
                )}
              </TabsContent>

              <TabsContent value="raw">
                <div className="bg-gray-100 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[500px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
