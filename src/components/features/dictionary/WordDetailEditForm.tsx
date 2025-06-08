'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  ArrowLeft,
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  updateWordDetailById,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions';
import { PartOfSpeech, SourceType, LanguageCode, Gender } from '@prisma/client';
import { RelationshipManager } from './RelationshipManager';

// Display name mappings
const partOfSpeechDisplayNames: Record<PartOfSpeech, string> = {
  first_part: 'First Part',
  noun: 'Noun',
  verb: 'Verb',
  phrasal_verb: 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  numeral: 'Numeral',
  article: 'Article',
  exclamation: 'Exclamation',
  abbreviation: 'Abbreviation',
  suffix: 'Suffix',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

const sourceTypeDisplayNames: Record<SourceType, string> = {
  ai_generated: 'AI Generated',
  merriam_learners: 'Merriam Learners',
  merriam_intermediate: 'Merriam Intermediate',
  helsinki_nlp: 'Helsinki NLP',
  danish_dictionary: 'Danish Dictionary',
  user: 'User',
  admin: 'Admin',
};

const genderDisplayNames: Record<Gender, string> = {
  masculine: 'Masculine',
  feminine: 'Feminine',
  neuter: 'Neuter',
  common: 'Common',
  common_neuter: 'Common/Neuter',
};

const languageDisplayNames: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

interface WordDetailEditFormProps {
  wordDetailId: number;
  initialData: WordDetailEditData;
}

export function WordDetailEditForm({
  wordDetailId,
  initialData,
}: WordDetailEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WordDetailEditData>(initialData);

  // Handle form field changes
  const handleInputChange = (
    field: keyof WordDetailEditData,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle definition changes
  const handleDefinitionChange = (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === index ? { ...def, [field]: value } : def,
      ),
    }));
  };

  // Handle audio file changes
  const handleAudioChange = (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      audioFiles: prev.audioFiles.map((audio, i) =>
        i === index ? { ...audio, [field]: value } : audio,
      ),
    }));
  };

  // Add new definition
  const addDefinition = () => {
    const newDefinition = {
      id: null, // Will be created on server
      definition: '',
      languageCode: formData.languageCode,
      source: 'admin' as SourceType,
      subjectStatusLabels: null,
      generalLabels: null,
      grammaticalNote: null,
      usageNote: null,
      isInShortDef: false,
      imageId: null,
      imageUrl: null,
      examples: [],
      _isNew: true,
    };

    setFormData((prev) => ({
      ...prev,
      definitions: [...prev.definitions, newDefinition],
    }));
  };

  // Remove definition
  const removeDefinition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.filter((_, i) => i !== index),
    }));
  };

  // Add example to definition
  const addExample = (definitionIndex: number) => {
    const newExample = {
      id: null,
      example: '',
      grammaticalNote: null,
      sourceOfExample: null,
      _isNew: true,
    };

    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === definitionIndex
          ? { ...def, examples: [...def.examples, newExample] }
          : def,
      ),
    }));
  };

  // Remove example from definition
  const removeExample = (definitionIndex: number, exampleIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === definitionIndex
          ? {
              ...def,
              examples: def.examples.filter((_, j) => j !== exampleIndex),
            }
          : def,
      ),
    }));
  };

  // Handle example changes
  const handleExampleChange = (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === definitionIndex
          ? {
              ...def,
              examples: def.examples.map((ex, j) =>
                j === exampleIndex ? { ...ex, [field]: value } : ex,
              ),
            }
          : def,
      ),
    }));
  };

  // Audio file management functions
  const addAudioFile = () => {
    const newAudio = {
      id: null, // Will be created on server
      url: '',
      isPrimary: formData.audioFiles.length === 0, // First audio is primary by default
      languageCode: formData.languageCode,
      source: 'admin' as SourceType,
      note: null,
    };

    setFormData((prev) => ({
      ...prev,
      audioFiles: [...prev.audioFiles, newAudio],
    }));
  };

  const removeAudioFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      audioFiles: prev.audioFiles.filter((_, i) => i !== index),
    }));
  };

  const togglePrimaryAudio = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      audioFiles: prev.audioFiles.map((audio, i) => ({
        ...audio,
        isPrimary: i === index, // Only the selected one is primary
      })),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateWordDetailById(wordDetailId, formData);

      if (result.success) {
        toast.success('WordDetail updated successfully');
        router.push('/admin/dictionaries');
      } else {
        toast.error(result.error || 'Failed to update WordDetail');
      }
    } catch (error) {
      console.error('Error updating WordDetail:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dictionaries')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dictionary
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit WordDetail</h1>
            <p className="text-sm text-muted-foreground">
              WordDetail ID: {wordDetailId} • Word: &ldquo;{formData.wordText}
              &rdquo;
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {partOfSpeechDisplayNames[formData.partOfSpeech]}
        </Badge>
      </div>

      {/* Warning about Word fields */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Word Fields Impact
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Changes to Word fields (word text, general phonetic, general
                frequency) will affect ALL WordDetails that belong to this word,
                not just this specific WordDetail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Word Fields Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Word Fields</span>
              <Badge variant="secondary" className="text-xs">
                Shared across all WordDetails
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wordText">Word Text</Label>
                <Input
                  id="wordText"
                  value={formData.wordText}
                  onChange={(e) =>
                    handleInputChange('wordText', e.target.value)
                  }
                  placeholder="Enter word text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneticGeneral">General Phonetic</Label>
                <Input
                  id="phoneticGeneral"
                  value={formData.phoneticGeneral || ''}
                  onChange={(e) =>
                    handleInputChange('phoneticGeneral', e.target.value || null)
                  }
                  placeholder="Enter general phonetic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencyGeneral">General Frequency</Label>
                <Input
                  id="frequencyGeneral"
                  type="number"
                  value={formData.frequencyGeneral || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'frequencyGeneral',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  placeholder="Enter frequency"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="languageCode">Language</Label>
              <Select
                value={formData.languageCode}
                onValueChange={(value) =>
                  handleInputChange('languageCode', value as LanguageCode)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageDisplayNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* WordDetail Fields Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>WordDetail Fields</span>
              <Badge variant="outline" className="text-xs">
                Specific to this WordDetail only
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partOfSpeech">Part of Speech</Label>
                <Select
                  value={formData.partOfSpeech}
                  onValueChange={(value) =>
                    handleInputChange('partOfSpeech', value as PartOfSpeech)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(partOfSpeechDisplayNames).map(
                      ([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Input
                  id="variant"
                  value={formData.variant || ''}
                  onChange={(e) =>
                    handleInputChange('variant', e.target.value || null)
                  }
                  placeholder="Enter variant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || 'none'}
                  onValueChange={(value) =>
                    handleInputChange(
                      'gender',
                      value === 'none' ? null : (value as Gender),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(genderDisplayNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phonetic">Phonetic (specific)</Label>
                <Input
                  id="phonetic"
                  value={formData.phonetic || ''}
                  onChange={(e) =>
                    handleInputChange('phonetic', e.target.value || null)
                  }
                  placeholder="Enter specific phonetic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forms">Forms</Label>
                <Input
                  id="forms"
                  value={formData.forms || ''}
                  onChange={(e) =>
                    handleInputChange('forms', e.target.value || null)
                  }
                  placeholder="Enter forms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency (specific)</Label>
                <Input
                  id="frequency"
                  type="number"
                  value={formData.frequency || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'frequency',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  placeholder="Enter specific frequency"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    handleInputChange('source', value as SourceType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceTypeDisplayNames).map(
                      ([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="isPlural"
                  checked={formData.isPlural}
                  onCheckedChange={(checked) =>
                    handleInputChange('isPlural', checked)
                  }
                />
                <Label htmlFor="isPlural">Is Plural</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="etymology">Etymology</Label>
              <Textarea
                id="etymology"
                value={formData.etymology || ''}
                onChange={(e) =>
                  handleInputChange('etymology', e.target.value || null)
                }
                placeholder="Enter etymology"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Sections */}
        <Accordion
          type="multiple"
          defaultValue={['definitions', 'audio', 'relationships']}
          className="space-y-4"
        >
          {/* Enhanced Definitions Section */}
          <AccordionItem value="definitions">
            <Card>
              <CardHeader>
                <AccordionTrigger className="flex items-center justify-between w-full text-left">
                  <CardTitle>
                    Definitions ({formData.definitions.length})
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDefinition}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Definition
                    </Button>
                  </div>
                  {formData.definitions.map((definition, index) => (
                    <Card
                      key={definition.id || `new-${index}`}
                      className="border-2"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Definition {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            {definition.id && (
                              <Badge variant="outline" className="text-xs">
                                ID: {definition.id}
                              </Badge>
                            )}
                            {formData.definitions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDefinition(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Definition Text</Label>
                          <Textarea
                            value={definition.definition}
                            onChange={(e) =>
                              handleDefinitionChange(
                                index,
                                'definition',
                                e.target.value,
                              )
                            }
                            rows={3}
                            placeholder="Enter definition..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Source</Label>
                            <Select
                              value={definition.source}
                              onValueChange={(value) =>
                                handleDefinitionChange(
                                  index,
                                  'source',
                                  value as SourceType,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(sourceTypeDisplayNames).map(
                                  ([key, name]) => (
                                    <SelectItem key={key} value={key}>
                                      {name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                              value={definition.languageCode}
                              onValueChange={(value) =>
                                handleDefinitionChange(
                                  index,
                                  'languageCode',
                                  value as LanguageCode,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(languageDisplayNames).map(
                                  ([code, name]) => (
                                    <SelectItem key={code} value={code}>
                                      {name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Subject Status Labels</Label>
                            <Input
                              value={definition.subjectStatusLabels || ''}
                              onChange={(e) =>
                                handleDefinitionChange(
                                  index,
                                  'subjectStatusLabels',
                                  e.target.value || null,
                                )
                              }
                              placeholder="e.g., formal, medical"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>General Labels</Label>
                            <Input
                              value={definition.generalLabels || ''}
                              onChange={(e) =>
                                handleDefinitionChange(
                                  index,
                                  'generalLabels',
                                  e.target.value || null,
                                )
                              }
                              placeholder="e.g., archaic, slang"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Grammatical Note</Label>
                            <Input
                              value={definition.grammaticalNote || ''}
                              onChange={(e) =>
                                handleDefinitionChange(
                                  index,
                                  'grammaticalNote',
                                  e.target.value || null,
                                )
                              }
                              placeholder="e.g., countable, transitive"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Usage Note</Label>
                            <Input
                              value={definition.usageNote || ''}
                              onChange={(e) =>
                                handleDefinitionChange(
                                  index,
                                  'usageNote',
                                  e.target.value || null,
                                )
                              }
                              placeholder="e.g., often used with 'to'"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={definition.isInShortDef}
                            onCheckedChange={(checked) =>
                              handleDefinitionChange(
                                index,
                                'isInShortDef',
                                checked,
                              )
                            }
                          />
                          <Label>Include in Short Definition</Label>
                        </div>

                        {definition.imageUrl && (
                          <div className="space-y-2">
                            <Label>Image</Label>
                            <div className="text-sm text-muted-foreground">
                              <a
                                href={definition.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Image
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Examples Section */}
                        <Separator />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Examples ({definition.examples?.length || 0})
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addExample(index)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Example
                            </Button>
                          </div>

                          {definition.examples &&
                            definition.examples.length > 0 && (
                              <div className="space-y-3">
                                {definition.examples.map(
                                  (example, exampleIndex) => (
                                    <Card
                                      key={
                                        example.id || `new-ex-${exampleIndex}`
                                      }
                                      className="border border-dashed"
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                          <Label className="text-xs font-medium">
                                            Example {exampleIndex + 1}
                                          </Label>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeExample(index, exampleIndex)
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <div className="space-y-3">
                                          <div className="space-y-2">
                                            <Label>Example Text</Label>
                                            <Textarea
                                              value={example.example}
                                              onChange={(e) =>
                                                handleExampleChange(
                                                  index,
                                                  exampleIndex,
                                                  'example',
                                                  e.target.value,
                                                )
                                              }
                                              rows={2}
                                              placeholder="Enter example sentence..."
                                            />
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                              <Label>Grammatical Note</Label>
                                              <Input
                                                value={
                                                  example.grammaticalNote || ''
                                                }
                                                onChange={(e) =>
                                                  handleExampleChange(
                                                    index,
                                                    exampleIndex,
                                                    'grammaticalNote',
                                                    e.target.value || null,
                                                  )
                                                }
                                                placeholder="e.g., past tense"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Source</Label>
                                              <Input
                                                value={
                                                  example.sourceOfExample || ''
                                                }
                                                onChange={(e) =>
                                                  handleExampleChange(
                                                    index,
                                                    exampleIndex,
                                                    'sourceOfExample',
                                                    e.target.value || null,
                                                  )
                                                }
                                                placeholder="e.g., Shakespeare, news article"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.definitions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No definitions yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={addDefinition}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Definition
                      </Button>
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Enhanced Audio Files Section */}
          <AccordionItem value="audio">
            <Card>
              <CardHeader>
                <AccordionTrigger className="flex items-center justify-between w-full text-left">
                  <CardTitle>
                    Audio Files ({formData.audioFiles.length})
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAudioFile}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Audio File
                    </Button>
                  </div>

                  {formData.audioFiles.map((audio, index) => (
                    <Card
                      key={audio.id || `new-audio-${index}`}
                      className="border-2"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Audio {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            {audio.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                Primary
                              </Badge>
                            )}
                            {audio.id && (
                              <Badge variant="outline" className="text-xs">
                                ID: {audio.id}
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAudioFile(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Audio URL</Label>
                          <Input
                            value={audio.url}
                            onChange={(e) =>
                              handleAudioChange(index, 'url', e.target.value)
                            }
                            placeholder="Enter audio file URL or path"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Source</Label>
                            <Select
                              value={audio.source}
                              onValueChange={(value) =>
                                handleAudioChange(
                                  index,
                                  'source',
                                  value as SourceType,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(sourceTypeDisplayNames).map(
                                  ([key, name]) => (
                                    <SelectItem key={key} value={key}>
                                      {name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                              value={audio.languageCode}
                              onValueChange={(value) =>
                                handleAudioChange(
                                  index,
                                  'languageCode',
                                  value as LanguageCode,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(languageDisplayNames).map(
                                  ([code, name]) => (
                                    <SelectItem key={code} value={code}>
                                      {name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Note</Label>
                          <Input
                            value={audio.note || ''}
                            onChange={(e) =>
                              handleAudioChange(
                                index,
                                'note',
                                e.target.value || null,
                              )
                            }
                            placeholder="Optional note about this audio file"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={audio.isPrimary}
                            onCheckedChange={() => togglePrimaryAudio(index)}
                          />
                          <Label>Primary Audio</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.audioFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No audio files yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={addAudioFile}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Audio File
                      </Button>
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Relationships Section */}
          <AccordionItem value="relationships">
            <RelationshipManager
              formData={formData}
              onUpdateFormData={(updates) =>
                setFormData((prev) => ({ ...prev, ...updates }))
              }
            />
          </AccordionItem>
        </Accordion>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dictionaries')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
