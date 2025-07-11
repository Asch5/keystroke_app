'use client';

import { AlertCircleIcon, FileJsonIcon } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { importFrequencyJson } from '@/core/domains/dictionary/actions';
import { LanguageCode } from '@/core/types';

type FrequencyWord = {
  word: string;
  orderIndexGeneralWord: number;
  freauencyGeneral?: number | null;
  isPartOfSpeech: boolean;
  partOfSpeech?: Record<
    string,
    {
      orderIndexPartOfspeech: number;
      freauencyGeneral: number;
    }
  >;
};

export default function FrequencyPage() {
  const [jsonData, setJsonData] = useState<FrequencyWord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('import');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    LanguageCode.en,
  );
  const [results, setResults] = useState<{
    added: number;
    updated: number;
    skipped: number;
    errors: string[];
    total: number;
    progress: number;
  }>({
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    total: 0,
    progress: 0,
  });

  // Handle importing word frequencies
  const handleImport = async () => {
    if (!jsonData.length) return;

    setIsLoading(true);
    setResults({
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      total: 0,
      progress: 0,
    });

    try {
      // Call the server action to import JSON data
      const result = await importFrequencyJson(jsonData, selectedLanguage);
      setResults(result);
      setSelectedTab('results'); // This line is removed as per the edit hint
    } catch (error) {
      console.error('Error importing words:', error);
      setResults((prev) => ({
        ...prev,
        errors: [
          ...prev.errors,
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept JSON files
    if (!file.name.endsWith('.json')) {
      alert('Please upload a JSON file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        try {
          const data = JSON.parse(event.target.result as string);
          setJsonData(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Failed to parse JSON file. Please check the file format.');
          setJsonData([]);
        }
      }
    };
    reader.readAsText(file);
  };

  // Clear the uploaded file
  const handleClearFile = () => {
    setJsonData([]);
    setFileName('');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Word Frequency Management</h1>

      <Tabs
        defaultValue="import"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Words</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Word Frequencies</CardTitle>
              <CardDescription>
                Upload a JSON file containing word frequency data in the
                combinedArrayWordsWithFrwquency format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(value) =>
                      setSelectedLanguage(value as LanguageCode)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LanguageCode.en}>English</SelectItem>
                      <SelectItem value={LanguageCode.ru}>Russian</SelectItem>
                      <SelectItem value={LanguageCode.da}>Danish</SelectItem>
                      <SelectItem value={LanguageCode.es}>Spanish</SelectItem>
                      <SelectItem value={LanguageCode.fr}>French</SelectItem>
                      <SelectItem value={LanguageCode.de}>German</SelectItem>
                      <SelectItem value={LanguageCode.it}>Italian</SelectItem>
                      <SelectItem value={LanguageCode.pt}>
                        Portuguese
                      </SelectItem>
                      <SelectItem value={LanguageCode.zh}>Chinese</SelectItem>
                      <SelectItem value={LanguageCode.ja}>Japanese</SelectItem>
                      <SelectItem value={LanguageCode.ko}>Korean</SelectItem>
                      <SelectItem value={LanguageCode.ar}>Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
                  <div className="text-center">
                    {!fileName ? (
                      <>
                        <FileJsonIcon className="mx-auto h-12 w-12 text-content-tertiary" />
                        <div className="mt-4">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer font-medium text-info-foreground hover:text-info"
                          >
                            Upload a JSON file
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".json"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <p className="mt-1 text-sm text-content-secondary">
                            Supported format:
                            combinedArrayWordsWithFrwquency.json
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="py-4">
                        <div className="flex items-center justify-center mb-2">
                          <FileJsonIcon className="h-8 w-8 text-success-foreground mr-2" />
                          <span className="font-medium">{fileName}</span>
                        </div>
                        <p className="text-sm text-content-secondary mb-4">
                          {jsonData.length} words loaded successfully
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFile}
                        >
                          Change File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {jsonData.length > 0 && (
                  <div className="bg-content-soft p-4 rounded-md">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Preview ({Math.min(5, jsonData.length)} of{' '}
                      {jsonData.length} words)
                    </h3>
                    <ul className="text-xs text-content-secondary space-y-1">
                      {jsonData.slice(0, 5).map((item, index) => (
                        <li
                          key={index}
                          className="overflow-hidden text-ellipsis"
                        >
                          {item.word} (rank: {item.orderIndexGeneralWord})
                          {item.isPartOfSpeech && item.partOfSpeech && (
                            <span className="text-content-tertiary ml-1">
                              - {Object.keys(item.partOfSpeech).join(', ')}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleClearFile}
                disabled={!fileName}
              >
                Clear
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || jsonData.length === 0}
              >
                {isLoading ? 'Processing...' : 'Import Words'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                Summary of the word frequency import operation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.total > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <span>Progress</span>
                      <span>{Math.round(results.progress * 100)}%</span>
                    </div>
                    <Progress value={results.progress * 100} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="bg-content-soft p-4 rounded-lg">
                      <div className="text-sm text-content-secondary">
                        Total Words
                      </div>
                      <div className="text-2xl font-bold">{results.total}</div>
                    </div>
                    <div className="bg-success-subtle p-4 rounded-lg">
                      <div className="text-sm text-content-secondary">
                        Added
                      </div>
                      <div className="text-2xl font-bold">{results.added}</div>
                    </div>
                    <div className="bg-info-subtle p-4 rounded-lg">
                      <div className="text-sm text-content-secondary">
                        Updated
                      </div>
                      <div className="text-2xl font-bold">
                        {results.updated}
                      </div>
                    </div>
                    <div className="bg-warning-subtle p-4 rounded-lg">
                      <div className="text-sm text-content-secondary">
                        Skipped
                      </div>
                      <div className="text-2xl font-bold">
                        {results.skipped}
                      </div>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircleIcon className="h-4 w-4" />
                      <AlertTitle>Errors occurred during import</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 mt-2">
                          {results.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-content-secondary">
                    No import results to show. Import some words first.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedTab('import')}
                className="w-full"
              >
                Back to Import
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
