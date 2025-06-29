'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Extract exact types from WordDetailEditData to ensure compatibility
type DefinitionData = WordDetailEditData['definitions'][0];
type ExampleData = DefinitionData['examples'][0];

// Extended example type with deletion flag
type ExampleWithDeleteFlag = ExampleData & { _toDelete?: boolean };

interface ExamplesManagerProps {
  definition: DefinitionData;
  definitionIndex: number;
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
 * ExamplesManager component for managing examples within a definition
 * Memoized to prevent unnecessary re-renders
 */
const ExamplesManager = memo(function ExamplesManager({
  definition,
  definitionIndex,
  onAddExample,
  onRemoveExample,
  onUpdateExample,
}: ExamplesManagerProps) {
  return (
    <>
      {/* Examples Section */}
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">Examples</h4>
          <Button
            onClick={() => onAddExample(definitionIndex)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Example
          </Button>
        </div>

        {definition.examples.filter(
          (ex) => !(ex as ExampleWithDeleteFlag)._toDelete,
        ).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No examples added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {definition.examples.map(
              (example: ExampleData, exIndex: number) => {
                if ((example as ExampleWithDeleteFlag)._toDelete) return null;
                return (
                  <Card
                    key={example.id || `new-ex-${exIndex}`}
                    className="bg-muted/30"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label
                              htmlFor={`example-${definitionIndex}-${exIndex}`}
                            >
                              Example Text *
                            </Label>
                            <Textarea
                              id={`example-${definitionIndex}-${exIndex}`}
                              value={example.example}
                              onChange={(e) =>
                                onUpdateExample(
                                  definitionIndex,
                                  exIndex,
                                  'example',
                                  e.target.value,
                                )
                              }
                              placeholder="Enter example sentence..."
                              rows={2}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label
                                htmlFor={`ex-grammatical-${definitionIndex}-${exIndex}`}
                              >
                                Grammatical Note
                              </Label>
                              <Input
                                id={`ex-grammatical-${definitionIndex}-${exIndex}`}
                                value={example.grammaticalNote || ''}
                                onChange={(e) =>
                                  onUpdateExample(
                                    definitionIndex,
                                    exIndex,
                                    'grammaticalNote',
                                    e.target.value,
                                  )
                                }
                                placeholder="Grammar notes for this example"
                              />
                            </div>

                            <div>
                              <Label
                                htmlFor={`ex-source-${definitionIndex}-${exIndex}`}
                              >
                                Source
                              </Label>
                              <Input
                                id={`ex-source-${definitionIndex}-${exIndex}`}
                                value={example.sourceOfExample || ''}
                                onChange={(e) =>
                                  onUpdateExample(
                                    definitionIndex,
                                    exIndex,
                                    'sourceOfExample',
                                    e.target.value,
                                  )
                                }
                                placeholder="Source of this example"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() =>
                            onRemoveExample(definitionIndex, exIndex)
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
                );
              },
            )}
          </div>
        )}
      </div>
    </>
  );
});

export default ExamplesManager;
