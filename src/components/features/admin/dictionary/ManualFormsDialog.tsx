'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { RelationshipType } from '@prisma/client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { DictionaryWordDetails } from '@/core/domains/dictionary/actions';
import { addManualWordForms } from '@/core/domains/dictionary/actions/manual-forms-actions';
import { getDanishFormDefinition } from '@/core/lib/utils/danishDictionary/getDanishFormDefinition';

// Danish-specific relationship types for forms
const danishFormTypes = [
  {
    value: RelationshipType.definite_form_da,
    label: 'Definite Form (bestemt form)',
  },
  { value: RelationshipType.plural_da, label: 'Plural (flertal)' },
  {
    value: RelationshipType.plural_definite_da,
    label: 'Plural Definite (bestemt flertal)',
  },
  { value: RelationshipType.present_tense_da, label: 'Present Tense (nutid)' },
  { value: RelationshipType.past_tense_da, label: 'Past Tense (datid)' },
  {
    value: RelationshipType.past_participle_da,
    label: 'Past Participle (tillægsform)',
  },
  { value: RelationshipType.imperative_da, label: 'Imperative (bydeform)' },
  { value: RelationshipType.comparative_da, label: 'Comparative (komparativ)' },
  { value: RelationshipType.superlative_da, label: 'Superlative (superlativ)' },
  { value: RelationshipType.neuter_form_da, label: 'Neuter Form (intetkøn)' },
  { value: RelationshipType.adverbial_form_da, label: 'Adverbial Form' },
  { value: RelationshipType.genitive_form_da, label: 'Genitive Form' },
  {
    value: RelationshipType.common_gender_da,
    label: 'Common Gender (fælleskøn)',
  },
  {
    value: RelationshipType.neuter_gender_da,
    label: 'Neuter Gender (intetkøn)',
  },
  { value: RelationshipType.contextual_usage_da, label: 'Contextual Usage' },
];

const manualFormSchema = z.object({
  forms: z
    .array(
      z.object({
        wordText: z.string().min(1, 'Word text is required'),
        relationshipType: z.nativeEnum(RelationshipType, {
          required_error: 'Please select a relationship type',
        }),
        phonetic: z.string().optional(),
        usageNote: z.string().optional(),
        definition: z.string().optional(),
      }),
    )
    .min(1, 'At least one form is required'),
});

type ManualFormData = z.infer<typeof manualFormSchema>;

interface ManualFormsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wordDetail: DictionaryWordDetails | null;
  onSuccess?: () => void;
}

export function ManualFormsDialog({
  isOpen,
  onOpenChange,
  wordDetail,
  onSuccess,
}: ManualFormsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManualFormData>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      forms: [
        {
          wordText: '',
          relationshipType: RelationshipType.definite_form_da,
          phonetic: '',
          usageNote: '',
          definition: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'forms',
  });

  const handleAddForm = () => {
    append({
      wordText: '',
      relationshipType: RelationshipType.definite_form_da,
      phonetic: '',
      usageNote: '',
      definition: '',
    });
  };

  // Helper function to auto-generate definition based on relationship type
  const generateStandardDefinition = (
    baseWordText: string,
    relatedWordText: string,
    relationshipType: RelationshipType,
  ): string => {
    if (!relatedWordText || !baseWordText) return '';

    const definition = getDanishFormDefinition(
      baseWordText,
      relatedWordText,
      relationshipType,
    );

    // Clean up the definition by removing formatting markers
    return definition.replace(/\{it\}/g, '').replace(/\{\/it\}/g, '');
  };

  const handleRemoveForm = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: ManualFormData) => {
    if (!wordDetail) return;

    setIsSubmitting(true);
    try {
      const result = await addManualWordForms({
        baseWordDetailId: wordDetail.id,
        baseWordText: wordDetail.wordText,
        forms: data.forms,
      });

      if (result.success) {
        toast.success(`Successfully added ${result.formsAdded} manual forms`);
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to add manual forms');
      }
    } catch (error) {
      console.error('Error adding manual forms:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!wordDetail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Manual Forms for &ldquo;{wordDetail.wordText}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Add word forms that were not automatically detected by the Danish
            forms processor. These forms will be linked to the base word with
            the specified relationship types.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Word Forms</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddForm}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Form
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Form #{index + 1}</Badge>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveForm(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`forms.${index}.wordText`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Word Text *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., størst, større, store"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The actual word form (e.g., comparative,
                            superlative, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`forms.${index}.relationshipType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select form type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {danishFormTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The grammatical relationship to the base word
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`forms.${index}.phonetic`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phonetic (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ˈsdɶɐ̯sd" {...field} />
                          </FormControl>
                          <FormDescription>
                            IPA phonetic transcription
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`forms.${index}.usageNote`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Note (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., formal context, archaic"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional usage information
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`forms.${index}.definition`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          Definition (Optional)
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentForm = form.getValues(
                                `forms.${index}`,
                              );
                              if (
                                currentForm.wordText &&
                                wordDetail?.wordText
                              ) {
                                const standardDefinition =
                                  generateStandardDefinition(
                                    wordDetail.wordText,
                                    currentForm.wordText,
                                    currentForm.relationshipType,
                                  );
                                if (standardDefinition) {
                                  form.setValue(
                                    `forms.${index}.definition`,
                                    standardDefinition,
                                  );
                                }
                              }
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Auto-fill
                          </Button>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Superlative form of stor (large)"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Definition or description of this word form. Click
                          &ldquo;Auto-fill&rdquo; to generate a standard
                          definition.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {index < fields.length - 1 && <Separator />}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Forms...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Add Forms
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
