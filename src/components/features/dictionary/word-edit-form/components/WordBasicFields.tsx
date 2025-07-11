'use client';

import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WordFormValues } from '../index';

interface WordBasicFieldsProps {
  form: UseFormReturn<WordFormValues>;
  isLoading: boolean;
}

export const WordBasicFields = memo(function WordBasicFields({
  form,
  isLoading,
}: WordBasicFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Word Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word */}
          <div className="space-y-2">
            <Label htmlFor="word">Word *</Label>
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Enter the word"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Phonetic */}
          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic Transcription</Label>
            <FormField
              control={form.control}
              name="phonetic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string) || ''}
                      placeholder="e.g., /wɜːrd/"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Etymology */}
        <div className="space-y-2">
          <Label htmlFor="etymology">Etymology</Label>
          <FormField
            control={form.control}
            name="etymology"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    value={(field.value as string) || ''}
                    placeholder="Origin and history of the word"
                    disabled={isLoading}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
});
