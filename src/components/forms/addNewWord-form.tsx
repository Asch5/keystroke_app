'use client';

import { useState } from 'react';
import {
  getWordFromMerriamWebster,
  processAllWords,
} from '@/lib/db/processMerriamApi';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  dictionaryType: z.enum(['learners', 'intermediate']),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddNewWordForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: '',
      dictionaryType: 'learners',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    try {
      // Create FormData to match the existing function signature
      const formData = new FormData();
      formData.append('word', values.word);
      formData.append('dictionaryType', values.dictionaryType);

      const result = await getWordFromMerriamWebster(
        {
          message: null,
          errors: { word: [] },
        },
        formData,
      );

      if (result.data) {
        // Process all word objects returned from the API
        await processAllWords(result.data);
        form.reset();
      }
    } catch (error) {
      console.error('Error processing word:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10  w-full max-w-md mx-auto">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Add New Word
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="word"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Word</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter word" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dictionaryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dictionary Type</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <option value="learners">
                          Learner&apos;s Dictionary
                        </option>
                        <option value="intermediate">
                          Intermediate Dictionary
                        </option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Add Word'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
