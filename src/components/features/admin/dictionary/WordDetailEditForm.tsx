'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Trash2,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  fetchWordDetailById,
  updateWordDetailById,
  updateWordDetailDefinitions,
  updateWordDetailAudioFiles,
  updateWordDetailRelationships,
  updateWordDetailImages,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions/word-details-actions';
import { RelationshipManager } from '@/components/features/dictionary/RelationshipManager';

// Type definitions for the form components
interface WordDetailEditFormProps {
  wordDetailId: number;
}

// Extract exact types from WordDetailEditData to ensure compatibility
type DefinitionData = WordDetailEditData['definitions'][0];
type ExampleData = DefinitionData['examples'][0];
type AudioFileData = WordDetailEditData['audioFiles'][0];

export default function WordDetailEditForm({
  wordDetailId,
}: WordDetailEditFormProps) {
  const [formData, setFormData] = useState<WordDetailEditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Separate loading states for each section
  const [isSavingDefinitions, setIsSavingDefinitions] = useState(false);
  const [isSavingAudioFiles, setIsSavingAudioFiles] = useState(false);
  const [isSavingRelationships, setIsSavingRelationships] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);

  useEffect(() => {
    loadWordDetail();
  }, [wordDetailId]);

  const loadWordDetail = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWordDetailById(wordDetailId);
      setFormData(data);
    } catch (error) {
      console.error('Error loading word detail:', error);
      toast.error('Failed to load word detail');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save only definitions section
   */
  const handleSaveDefinitions = async () => {
    if (!formData) return;

    try {
      setIsSavingDefinitions(true);
      const result = await updateWordDetailDefinitions(
        wordDetailId,
        formData.definitions,
      );

      if (result.success) {
        toast.success('Definitions saved successfully!', {
          icon: <CheckCircle className="h-4 w-4" />,
        });
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save definitions', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Error saving definitions:', error);
      toast.error('Failed to save definitions');
    } finally {
      setIsSavingDefinitions(false);
    }
  };

  /**
   * Save only audio files section
   */
  const handleSaveAudioFiles = async () => {
    if (!formData) return;

    try {
      setIsSavingAudioFiles(true);
      const result = await updateWordDetailAudioFiles(
        wordDetailId,
        formData.audioFiles,
      );

      if (result.success) {
        toast.success('Audio files saved successfully!', {
          icon: <CheckCircle className="h-4 w-4" />,
        });
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save audio files', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Error saving audio files:', error);
      toast.error('Failed to save audio files');
    } finally {
      setIsSavingAudioFiles(false);
    }
  };

  /**
   * Save only images section (within definitions)
   */
  const handleSaveImages = async () => {
    if (!formData) return;

    try {
      setIsSavingImages(true);
      const result = await updateWordDetailImages(
        wordDetailId,
        formData.definitions,
      );

      if (result.success) {
        toast.success('Images saved successfully!', {
          icon: <CheckCircle className="h-4 w-4" />,
        });
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save images', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Error saving images:', error);
      toast.error('Failed to save images');
    } finally {
      setIsSavingImages(false);
    }
  };

  /**
   * Save only relationships section
   */
  const handleSaveRelationships = async () => {
    if (!formData) return;

    try {
      setIsSavingRelationships(true);
      const result = await updateWordDetailRelationships(
        wordDetailId,
        formData.wordDetailRelationships,
        formData.wordRelationships,
      );

      if (result.success) {
        toast.success('Relationships saved successfully!', {
          icon: <CheckCircle className="h-4 w-4" />,
        });
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save relationships', {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Error saving relationships:', error);
      toast.error('Failed to save relationships');
    } finally {
      setIsSavingRelationships(false);
    }
  };

  const handleSaveAll = async () => {
    if (!formData) return;

    try {
      setIsSaving(true);
      const result = await updateWordDetailById(wordDetailId, formData);

      if (result.success) {
        toast.success('All changes saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Definition management handlers
  const addDefinition = () => {
    if (!formData) return;

    const newDefinition = {
      id: null,
      definition: '',
      languageCode: 'en' as const,
      source: 'admin' as const,
      subjectStatusLabels: null,
      generalLabels: null,
      grammaticalNote: null,
      usageNote: null,
      isInShortDef: false,
      imageId: null,
      imageUrl: null,
      examples: [],
    };

    setFormData((prev: WordDetailEditData | null) =>
      prev
        ? {
            ...prev,
            definitions: [...prev.definitions, newDefinition],
          }
        : null,
    );
  };

  const removeDefinition = (index: number) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedDefinitions = [...prev.definitions];
      if (index < 0 || index >= updatedDefinitions.length) return prev;

      const definition = updatedDefinitions[index];
      if (!definition) return prev;

      if (definition.id) {
        // Mark existing definition for deletion
        updatedDefinitions[index] = {
          id: definition.id,
          definition: definition.definition,
          languageCode: definition.languageCode,
          source: definition.source,
          subjectStatusLabels: definition.subjectStatusLabels,
          generalLabels: definition.generalLabels,
          grammaticalNote: definition.grammaticalNote,
          usageNote: definition.usageNote,
          isInShortDef: definition.isInShortDef,
          imageId: definition.imageId,
          imageUrl: definition.imageUrl,
          examples: definition.examples,
          _toDelete: true,
        };
      } else {
        // Remove new definition entirely
        updatedDefinitions.splice(index, 1);
      }
      return { ...prev, definitions: updatedDefinitions };
    });
  };

  const updateDefinition = (
    index: number,
    field: string,
    value: string | boolean | null,
  ) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedDefinitions = [...prev.definitions];
      if (index < 0 || index >= updatedDefinitions.length) return prev;

      const definition = updatedDefinitions[index];
      if (!definition) return prev;

      updatedDefinitions[index] = {
        id: definition.id,
        definition:
          field === 'definition' ? (value as string) : definition.definition,
        languageCode:
          field === 'languageCode'
            ? (value as DefinitionData['languageCode'])
            : definition.languageCode,
        source:
          field === 'source'
            ? (value as DefinitionData['source'])
            : definition.source,
        subjectStatusLabels:
          field === 'subjectStatusLabels'
            ? (value as string | null)
            : definition.subjectStatusLabels,
        generalLabels:
          field === 'generalLabels'
            ? (value as string | null)
            : definition.generalLabels,
        grammaticalNote:
          field === 'grammaticalNote'
            ? (value as string | null)
            : definition.grammaticalNote,
        usageNote:
          field === 'usageNote'
            ? (value as string | null)
            : definition.usageNote,
        isInShortDef:
          field === 'isInShortDef'
            ? (value as boolean)
            : definition.isInShortDef,
        imageId:
          field === 'imageId' ? (value as number | null) : definition.imageId,
        imageUrl:
          field === 'imageUrl' ? (value as string | null) : definition.imageUrl,
        examples: definition.examples,
        ...(definition._toDelete && { _toDelete: definition._toDelete }),
      };
      return { ...prev, definitions: updatedDefinitions };
    });
  };

  // Example management handlers
  const addExample = (definitionIndex: number) => {
    if (!formData) return;

    const newExample = {
      id: null,
      example: '',
      grammaticalNote: null,
      sourceOfExample: null,
    };

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedDefinitions = [...prev.definitions];
      if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
        return prev;

      const definition = updatedDefinitions[definitionIndex];
      if (!definition) return prev;

      updatedDefinitions[definitionIndex] = {
        id: definition.id,
        definition: definition.definition,
        languageCode: definition.languageCode,
        source: definition.source,
        subjectStatusLabels: definition.subjectStatusLabels,
        generalLabels: definition.generalLabels,
        grammaticalNote: definition.grammaticalNote,
        usageNote: definition.usageNote,
        isInShortDef: definition.isInShortDef,
        imageId: definition.imageId,
        imageUrl: definition.imageUrl,
        examples: [...(definition.examples || []), newExample],
        ...(definition._toDelete && { _toDelete: definition._toDelete }),
      };
      return { ...prev, definitions: updatedDefinitions };
    });
  };

  const removeExample = (definitionIndex: number, exampleIndex: number) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedDefinitions = [...prev.definitions];
      if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
        return prev;

      const definition = updatedDefinitions[definitionIndex];
      if (!definition) return prev;

      const updatedExamples = [...(definition.examples || [])];
      if (exampleIndex < 0 || exampleIndex >= updatedExamples.length)
        return prev;

      updatedExamples.splice(exampleIndex, 1);
      updatedDefinitions[definitionIndex] = {
        id: definition.id,
        definition: definition.definition,
        languageCode: definition.languageCode,
        source: definition.source,
        subjectStatusLabels: definition.subjectStatusLabels,
        generalLabels: definition.generalLabels,
        grammaticalNote: definition.grammaticalNote,
        usageNote: definition.usageNote,
        isInShortDef: definition.isInShortDef,
        imageId: definition.imageId,
        imageUrl: definition.imageUrl,
        examples: updatedExamples,
        _toDelete: definition._toDelete || false,
      };
      return { ...prev, definitions: updatedDefinitions };
    });
  };

  const updateExample = (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedDefinitions = [...prev.definitions];
      if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
        return prev;

      const definition = updatedDefinitions[definitionIndex];
      if (!definition) return prev;

      const updatedExamples = [...(definition.examples || [])];
      if (exampleIndex < 0 || exampleIndex >= updatedExamples.length)
        return prev;

      const example = updatedExamples[exampleIndex];
      if (!example) return prev;

      updatedExamples[exampleIndex] = {
        id: example.id,
        example: field === 'example' ? (value as string) : example.example,
        grammaticalNote:
          field === 'grammaticalNote' ? value : example.grammaticalNote,
        sourceOfExample:
          field === 'sourceOfExample' ? value : example.sourceOfExample,
      };
      updatedDefinitions[definitionIndex] = {
        id: definition.id,
        definition: definition.definition,
        languageCode: definition.languageCode,
        source: definition.source,
        subjectStatusLabels: definition.subjectStatusLabels,
        generalLabels: definition.generalLabels,
        grammaticalNote: definition.grammaticalNote,
        usageNote: definition.usageNote,
        isInShortDef: definition.isInShortDef,
        imageId: definition.imageId,
        imageUrl: definition.imageUrl,
        examples: updatedExamples,
        _toDelete: definition._toDelete || false,
      };
      return { ...prev, definitions: updatedDefinitions };
    });
  };

  // Audio file management handlers
  const addAudioFile = () => {
    if (!formData) return;

    const newAudioFile: AudioFileData = {
      id: null,
      url: '',
      languageCode: 'da',
      source: 'admin',
      note: null,
      isPrimary: formData.audioFiles.filter((a) => !a._toDelete).length === 0, // First audio file is primary by default
    };

    setFormData((prev: WordDetailEditData | null) =>
      prev
        ? {
            ...prev,
            audioFiles: [...prev.audioFiles, newAudioFile],
          }
        : null,
    );
  };

  const removeAudioFile = (index: number) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedAudioFiles = [...prev.audioFiles];
      if (index < 0 || index >= updatedAudioFiles.length) return prev;

      const audioFile = updatedAudioFiles[index];
      if (!audioFile) return prev;

      if (audioFile.id) {
        // Mark existing audio file for deletion
        updatedAudioFiles[index] = {
          id: audioFile.id,
          url: audioFile.url,
          isPrimary: audioFile.isPrimary,
          languageCode: audioFile.languageCode,
          source: audioFile.source,
          note: audioFile.note,
          _toDelete: true,
        };
      } else {
        // Remove new audio file entirely
        updatedAudioFiles.splice(index, 1);
      }
      return { ...prev, audioFiles: updatedAudioFiles };
    });
  };

  const updateAudioFile = (
    index: number,
    field: keyof AudioFileData,
    value: string | boolean | null,
  ) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedAudioFiles = [...prev.audioFiles];
      if (index < 0 || index >= updatedAudioFiles.length) return prev;

      const audioFile = updatedAudioFiles[index];
      if (!audioFile) return prev;

      updatedAudioFiles[index] = {
        id: audioFile.id,
        url: field === 'url' ? (value as string) : audioFile.url,
        isPrimary:
          field === 'isPrimary' ? (value as boolean) : audioFile.isPrimary,
        languageCode:
          field === 'languageCode'
            ? (value as AudioFileData['languageCode'])
            : audioFile.languageCode,
        source:
          field === 'source'
            ? (value as AudioFileData['source'])
            : audioFile.source,
        note: field === 'note' ? (value as string | null) : audioFile.note,
        _toDelete: audioFile._toDelete || false,
      };
      return { ...prev, audioFiles: updatedAudioFiles };
    });
  };

  const togglePrimaryAudio = (index: number) => {
    if (!formData) return;

    setFormData((prev: WordDetailEditData | null) => {
      if (!prev) return null;
      const updatedAudioFiles = prev.audioFiles.map(
        (audio: AudioFileData, i: number) => ({
          ...audio,
          isPrimary: i === index, // Only the selected audio is primary
        }),
      );
      return { ...prev, audioFiles: updatedAudioFiles };
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading word detail...</span>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Word detail not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Word Detail</h1>
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving All...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Accordion
        type="multiple"
        defaultValue={['definitions', 'audio', 'relationships']}
        className="space-y-4"
      >
        {/* Definitions Section */}
        <AccordionItem value="definitions">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-2">
              <span>Definitions</span>
              <Badge variant="secondary">
                {
                  formData.definitions.filter(
                    (def: DefinitionData) => !def._toDelete,
                  ).length
                }
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Manage Definitions</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveDefinitions}
                    disabled={isSavingDefinitions}
                    variant="outline"
                    size="sm"
                  >
                    {isSavingDefinitions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Definitions
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveImages}
                    disabled={isSavingImages}
                    variant="outline"
                    size="sm"
                  >
                    {isSavingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Images
                      </>
                    )}
                  </Button>
                  <Button onClick={addDefinition} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Definition
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.definitions.filter(
                  (def: DefinitionData) => !def._toDelete,
                ).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No definitions added yet. Click &quot;Add Definition&quot;
                    to get started.
                  </p>
                ) : (
                  formData.definitions.map(
                    (def: DefinitionData, defIndex: number) => {
                      if (def._toDelete) return null;
                      return (
                        <Card
                          key={def.id || `new-${defIndex}`}
                          className="relative"
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg">
                              Definition {defIndex + 1}
                            </CardTitle>
                            <Button
                              onClick={() => removeDefinition(defIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Definition content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <Label htmlFor={`definition-${defIndex}`}>
                                  Definition *
                                </Label>
                                <Textarea
                                  id={`definition-${defIndex}`}
                                  value={def.definition}
                                  onChange={(e) =>
                                    updateDefinition(
                                      defIndex,
                                      'definition',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter the definition..."
                                  className="min-h-[100px]"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor={`source-${defIndex}`}>
                                  Source
                                </Label>
                                <Select
                                  value={def.source}
                                  onValueChange={(value) =>
                                    updateDefinition(defIndex, 'source', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="DDO">
                                      Danish Dictionary Online
                                    </SelectItem>
                                    <SelectItem value="Wiktionary">
                                      Wiktionary
                                    </SelectItem>
                                    <SelectItem value="AI Generated">
                                      AI Generated
                                    </SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`language-${defIndex}`}>
                                  Language
                                </Label>
                                <Select
                                  value={def.languageCode}
                                  onValueChange={(value) =>
                                    updateDefinition(
                                      defIndex,
                                      'languageCode',
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="da">Danish</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`subject-labels-${defIndex}`}>
                                  Subject/Status Labels
                                </Label>
                                <Input
                                  id={`subject-labels-${defIndex}`}
                                  value={def.subjectStatusLabels || ''}
                                  onChange={(e) =>
                                    updateDefinition(
                                      defIndex,
                                      'subjectStatusLabels',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., formal, technical, archaic"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`general-labels-${defIndex}`}>
                                  General Labels
                                </Label>
                                <Input
                                  id={`general-labels-${defIndex}`}
                                  value={def.generalLabels || ''}
                                  onChange={(e) =>
                                    updateDefinition(
                                      defIndex,
                                      'generalLabels',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., noun, verb, adjective"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`grammatical-note-${defIndex}`}>
                                  Grammatical Note
                                </Label>
                                <Input
                                  id={`grammatical-note-${defIndex}`}
                                  value={def.grammaticalNote || ''}
                                  onChange={(e) =>
                                    updateDefinition(
                                      defIndex,
                                      'grammaticalNote',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Grammar-specific notes"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`usage-note-${defIndex}`}>
                                  Usage Note
                                </Label>
                                <Input
                                  id={`usage-note-${defIndex}`}
                                  value={def.usageNote || ''}
                                  onChange={(e) =>
                                    updateDefinition(
                                      defIndex,
                                      'usageNote',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Usage context or notes"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`is-short-def-${defIndex}`}
                                  checked={def.isInShortDef}
                                  onCheckedChange={(checked) =>
                                    updateDefinition(
                                      defIndex,
                                      'isInShortDef',
                                      checked as boolean,
                                    )
                                  }
                                />
                                <Label htmlFor={`is-short-def-${defIndex}`}>
                                  Include in short definition
                                </Label>
                              </div>
                            </div>

                            {/* Examples Section */}
                            <Separator />
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-medium">
                                  Examples
                                </h4>
                                <Button
                                  onClick={() => addExample(defIndex)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Example
                                </Button>
                              </div>

                              {!def.examples || def.examples.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                  No examples added yet.
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {def.examples.map(
                                    (
                                      example: ExampleData,
                                      exampleIndex: number,
                                    ) => (
                                      <Card
                                        key={
                                          example.id ||
                                          `new-example-${exampleIndex}`
                                        }
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                              <div className="md:col-span-2">
                                                <Label
                                                  htmlFor={`example-${defIndex}-${exampleIndex}`}
                                                >
                                                  Example Text
                                                </Label>
                                                <Textarea
                                                  id={`example-${defIndex}-${exampleIndex}`}
                                                  value={example.example}
                                                  onChange={(e) =>
                                                    updateExample(
                                                      defIndex,
                                                      exampleIndex,
                                                      'example',
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Enter example sentence or phrase..."
                                                  rows={2}
                                                />
                                              </div>
                                              <div>
                                                <Label
                                                  htmlFor={`example-grammar-${defIndex}-${exampleIndex}`}
                                                >
                                                  Grammatical Note
                                                </Label>
                                                <Input
                                                  id={`example-grammar-${defIndex}-${exampleIndex}`}
                                                  value={
                                                    example.grammaticalNote ||
                                                    ''
                                                  }
                                                  onChange={(e) =>
                                                    updateExample(
                                                      defIndex,
                                                      exampleIndex,
                                                      'grammaticalNote',
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Grammar notes for this example"
                                                />
                                              </div>
                                              <div>
                                                <Label
                                                  htmlFor={`example-source-${defIndex}-${exampleIndex}`}
                                                >
                                                  Source
                                                </Label>
                                                <Input
                                                  id={`example-source-${defIndex}-${exampleIndex}`}
                                                  value={
                                                    example.sourceOfExample ||
                                                    ''
                                                  }
                                                  onChange={(e) =>
                                                    updateExample(
                                                      defIndex,
                                                      exampleIndex,
                                                      'sourceOfExample',
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Source of this example"
                                                />
                                              </div>
                                            </div>
                                            <Button
                                              onClick={() =>
                                                removeExample(
                                                  defIndex,
                                                  exampleIndex,
                                                )
                                              }
                                              variant="ghost"
                                              size="sm"
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
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
                      );
                    },
                  )
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Audio Files Section */}
        <AccordionItem value="audio">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-2">
              <span>Audio Files</span>
              <Badge variant="secondary">
                {
                  formData.audioFiles.filter(
                    (audio: AudioFileData) => !audio._toDelete,
                  ).length
                }
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Manage Audio Files</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAudioFiles}
                    disabled={isSavingAudioFiles}
                    variant="outline"
                    size="sm"
                  >
                    {isSavingAudioFiles ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Audio Files
                      </>
                    )}
                  </Button>
                  <Button onClick={addAudioFile} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Audio File
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.audioFiles.filter(
                  (audio: AudioFileData) => !audio._toDelete,
                ).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No audio files added yet. Click &quot;Add Audio File&quot;
                    to get started.
                  </p>
                ) : (
                  formData.audioFiles.map(
                    (audio: AudioFileData, audioIndex: number) => {
                      if (audio._toDelete) return null;
                      return (
                        <Card key={audio.id || `new-audio-${audioIndex}`}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">
                                Audio {audioIndex + 1}
                              </CardTitle>
                              {audio.isPrimary && (
                                <Badge variant="default">Primary</Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => removeAudioFile(audioIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <Label htmlFor={`audio-url-${audioIndex}`}>
                                  Audio URL *
                                </Label>
                                <Input
                                  id={`audio-url-${audioIndex}`}
                                  value={audio.url}
                                  onChange={(e) =>
                                    updateAudioFile(
                                      audioIndex,
                                      'url',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="https://example.com/audio.mp3"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor={`audio-source-${audioIndex}`}>
                                  Source
                                </Label>
                                <Select
                                  value={audio.source}
                                  onValueChange={(value) =>
                                    updateAudioFile(audioIndex, 'source', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AI Generated">
                                      AI Generated
                                    </SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="ForvoApi">
                                      Forvo API
                                    </SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor={`audio-language-${audioIndex}`}>
                                  Language
                                </Label>
                                <Select
                                  value={audio.languageCode}
                                  onValueChange={(value) =>
                                    updateAudioFile(
                                      audioIndex,
                                      'languageCode',
                                      value,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="da">Danish</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2">
                                <Label htmlFor={`audio-note-${audioIndex}`}>
                                  Note
                                </Label>
                                <Input
                                  id={`audio-note-${audioIndex}`}
                                  value={audio.note || ''}
                                  onChange={(e) =>
                                    updateAudioFile(
                                      audioIndex,
                                      'note',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Optional note about this audio file"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`is-primary-${audioIndex}`}
                                  checked={audio.isPrimary}
                                  onCheckedChange={() =>
                                    togglePrimaryAudio(audioIndex)
                                  }
                                />
                                <Label htmlFor={`is-primary-${audioIndex}`}>
                                  Primary Audio
                                </Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    },
                  )
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Relationships Section */}
        <AccordionItem value="relationships">
          <AccordionTrigger className="text-xl font-semibold">
            <div className="flex items-center gap-2">
              <span>Relationships</span>
              <Badge variant="secondary">
                {formData.wordDetailRelationships.filter(
                  (rel) => !rel._toDelete,
                ).length +
                  formData.wordRelationships.filter((rel) => !rel._toDelete)
                    .length}{' '}
                total
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Manage Relationships</CardTitle>
                <Button
                  onClick={handleSaveRelationships}
                  disabled={isSavingRelationships}
                  variant="outline"
                  size="sm"
                >
                  {isSavingRelationships ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Relationships
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <RelationshipManager
                  formData={formData}
                  onUpdateFormData={(updates) =>
                    setFormData((prev: WordDetailEditData | null) =>
                      prev ? { ...prev, ...updates } : null,
                    )
                  }
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Global Save Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSaveAll}
          disabled={
            isSaving ||
            isSavingDefinitions ||
            isSavingAudioFiles ||
            isSavingRelationships ||
            isSavingImages
          }
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving All Changes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
