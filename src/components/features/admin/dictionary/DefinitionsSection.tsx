'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Plus, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ExamplesManager from './ExamplesManager';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Extract exact types from WordDetailEditData to ensure compatibility
type DefinitionData = WordDetailEditData['definitions'][0];

interface DefinitionsSectionProps {
  formData: WordDetailEditData;
  isSavingDefinitions: boolean;
  isSavingImages: boolean;
  onSaveDefinitions: () => Promise<void>;
  onSaveImages: () => Promise<void>;
  onAddDefinition: () => void;
  onRemoveDefinition: (index: number) => void;
  onUpdateDefinition: (
    index: number,
    field: string,
    value: string | boolean | null,
  ) => void;
  onAddExample: (definitionIndex: number) => void;
  onRemoveExample: (definitionIndex: number, exampleIndex: number) => void;
  onUpdateExample: (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => void;
}

/**
 * DefinitionsSection component for managing definitions and examples
 * Memoized to prevent unnecessary re-renders when parent updates but props remain same
 */
const DefinitionsSection = memo(function DefinitionsSection({
  formData,
  isSavingDefinitions,
  isSavingImages,
  onSaveDefinitions,
  onSaveImages,
  onAddDefinition,
  onRemoveDefinition,
  onUpdateDefinition,
  onAddExample,
  onRemoveExample,
  onUpdateExample,
}: DefinitionsSectionProps) {
  return (
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
                onClick={onSaveDefinitions}
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
                onClick={onSaveImages}
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
              <Button onClick={onAddDefinition} variant="outline" size="sm">
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
                No definitions added yet. Click &quot;Add Definition&quot; to
                get started.
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
                          onClick={() => onRemoveDefinition(defIndex)}
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
                                onUpdateDefinition(
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
                            <Label htmlFor={`source-${defIndex}`}>Source</Label>
                            <Select
                              value={def.source}
                              onValueChange={(value) =>
                                onUpdateDefinition(defIndex, 'source', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="danish_dictionary">
                                  Danish Dictionary Online
                                </SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="ai_generated">
                                  AI Generated
                                </SelectItem>
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
                                onUpdateDefinition(
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
                                onUpdateDefinition(
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
                                onUpdateDefinition(
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
                                onUpdateDefinition(
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
                                onUpdateDefinition(
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
                                onUpdateDefinition(
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
                        <ExamplesManager
                          definition={def}
                          definitionIndex={defIndex}
                          onAddExample={onAddExample}
                          onRemoveExample={onRemoveExample}
                          onUpdateExample={onUpdateExample}
                        />
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
  );
});

export default DefinitionsSection;
