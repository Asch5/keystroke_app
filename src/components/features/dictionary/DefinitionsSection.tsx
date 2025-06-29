'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import ExamplesSubSection from './ExamplesSubSection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';
import { SourceType, LanguageCode } from '@prisma/client';

// Display name mappings
const sourceTypeDisplayNames: Record<SourceType, string> = {
  ai_generated: 'AI Generated',
  merriam_learners: 'Merriam Learners',
  merriam_intermediate: 'Merriam Intermediate',
  helsinki_nlp: 'Helsinki NLP',
  danish_dictionary: 'Danish Dictionary',
  user: 'User',
  admin: 'Admin',
  frequency_import: 'Frequency Import',
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
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
};

interface DefinitionsSectionProps {
  formData: WordDetailEditData;
  onDefinitionChange: (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => void;
  onExampleChange: (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => void;
  onAddDefinition: () => void;
  onRemoveDefinition: (index: number) => void;
  onAddExample: (definitionIndex: number) => void;
  onRemoveExample: (definitionIndex: number, exampleIndex: number) => void;
}

/**
 * DefinitionsSection component for managing definitions and examples
 * Memoized to prevent unnecessary re-renders
 */
const DefinitionsSection = memo(function DefinitionsSection({
  formData,
  onDefinitionChange,
  onExampleChange,
  onAddDefinition,
  onRemoveDefinition,
  onAddExample,
  onRemoveExample,
}: DefinitionsSectionProps) {
  return (
    <AccordionItem value="definitions">
      <Card>
        <CardHeader>
          <AccordionTrigger className="flex items-center justify-between w-full text-left">
            <CardTitle>Definitions ({formData.definitions.length})</CardTitle>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddDefinition}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Definition
              </Button>
            </div>

            {formData.definitions.map((def, defIndex) => (
              <Card
                key={def.id || `new-definition-${defIndex}`}
                className="border-2"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Definition {defIndex + 1}</span>
                    <div className="flex items-center space-x-2">
                      {def.id && (
                        <Badge variant="outline" className="text-xs">
                          ID: {def.id}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveDefinition(defIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Definition Text */}
                  <div className="space-y-2">
                    <Label>Definition *</Label>
                    <Textarea
                      value={def.definition}
                      onChange={(e) =>
                        onDefinitionChange(
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Source */}
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Select
                        value={def.source}
                        onValueChange={(value) =>
                          onDefinitionChange(defIndex, 'source', value)
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

                    {/* Language */}
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={def.languageCode}
                        onValueChange={(value) =>
                          onDefinitionChange(defIndex, 'languageCode', value)
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

                    {/* Subject/Status Labels */}
                    <div className="space-y-2">
                      <Label>Subject/Status Labels</Label>
                      <Input
                        value={def.subjectStatusLabels || ''}
                        onChange={(e) =>
                          onDefinitionChange(
                            defIndex,
                            'subjectStatusLabels',
                            e.target.value,
                          )
                        }
                        placeholder="e.g., formal, technical"
                      />
                    </div>

                    {/* General Labels */}
                    <div className="space-y-2">
                      <Label>General Labels</Label>
                      <Input
                        value={def.generalLabels || ''}
                        onChange={(e) =>
                          onDefinitionChange(
                            defIndex,
                            'generalLabels',
                            e.target.value,
                          )
                        }
                        placeholder="e.g., noun, verb"
                      />
                    </div>

                    {/* Grammatical Note */}
                    <div className="space-y-2">
                      <Label>Grammatical Note</Label>
                      <Input
                        value={def.grammaticalNote || ''}
                        onChange={(e) =>
                          onDefinitionChange(
                            defIndex,
                            'grammaticalNote',
                            e.target.value,
                          )
                        }
                        placeholder="Grammar notes"
                      />
                    </div>

                    {/* Usage Note */}
                    <div className="space-y-2">
                      <Label>Usage Note</Label>
                      <Input
                        value={def.usageNote || ''}
                        onChange={(e) =>
                          onDefinitionChange(
                            defIndex,
                            'usageNote',
                            e.target.value,
                          )
                        }
                        placeholder="Usage notes"
                      />
                    </div>
                  </div>

                  {/* Short Definition Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={def.isInShortDef}
                      onCheckedChange={(checked) =>
                        onDefinitionChange(defIndex, 'isInShortDef', checked)
                      }
                    />
                    <Label>Include in short definition</Label>
                  </div>

                  {/* Examples Section */}
                  <ExamplesSubSection
                    examples={def.examples}
                    definitionIndex={defIndex}
                    onAddExample={onAddExample}
                    onRemoveExample={onRemoveExample}
                    onExampleChange={onExampleChange}
                  />
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
                  onClick={onAddDefinition}
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
  );
});

export default DefinitionsSection;
