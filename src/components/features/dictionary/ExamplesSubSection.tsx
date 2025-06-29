'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';

// Extract example type from definitions
type DefinitionData = WordDetailEditData['definitions'][0];
type ExampleData = DefinitionData['examples'][0];

interface ExamplesSubSectionProps {
  examples: ExampleData[];
  definitionIndex: number;
  onAddExample: (definitionIndex: number) => void;
  onRemoveExample: (definitionIndex: number, exampleIndex: number) => void;
  onExampleChange: (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => void;
}

/**
 * ExamplesSubSection component for managing examples within definitions
 * Memoized to prevent unnecessary re-renders
 */
const ExamplesSubSection = memo(function ExamplesSubSection({
  examples,
  definitionIndex,
  onAddExample,
  onRemoveExample,
  onExampleChange,
}: ExamplesSubSectionProps) {
  return (
    <>
      {/* Examples Section */}
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">Examples</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddExample(definitionIndex)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Example
          </Button>
        </div>

        {examples.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No examples added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {examples.map((example, exIndex) => (
              <Card
                key={example.id || `new-example-${exIndex}`}
                className="bg-muted/30"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Example Text *</Label>
                        <Textarea
                          value={example.example}
                          onChange={(e) =>
                            onExampleChange(
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
                          <Label>Grammatical Note</Label>
                          <Input
                            value={example.grammaticalNote || ''}
                            onChange={(e) =>
                              onExampleChange(
                                definitionIndex,
                                exIndex,
                                'grammaticalNote',
                                e.target.value,
                              )
                            }
                            placeholder="Grammar notes"
                          />
                        </div>

                        <div>
                          <Label>Source</Label>
                          <Input
                            value={example.sourceOfExample || ''}
                            onChange={(e) =>
                              onExampleChange(
                                definitionIndex,
                                exIndex,
                                'sourceOfExample',
                                e.target.value,
                              )
                            }
                            placeholder="Source of example"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveExample(definitionIndex, exIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
});

export default ExamplesSubSection;
