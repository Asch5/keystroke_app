'use client';

import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { WordFormValues } from '../index';

interface AudioFilesSectionProps {
  form: UseFormReturn<WordFormValues>;
  isLoading: boolean;
  addAudioFile: () => void;
  removeAudioFile: (index: number) => void;
}

export const AudioFilesSection = memo(function AudioFilesSection({
  form,
  isLoading,
  addAudioFile,
  removeAudioFile,
}: AudioFilesSectionProps) {
  const audioFiles = form.watch('audioFiles') as WordFormValues['audioFiles'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Audio Files
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAudioFile}
            disabled={isLoading}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Audio File
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioFiles.map((audio, audioIndex) => (
          <div key={audioIndex} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Audio File {audioIndex + 1}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAudioFile(audioIndex)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audio URL */}
              <div className="space-y-2">
                <Label htmlFor={`audio-url-${audioIndex}`}>Audio URL</Label>
                <FormField
                  control={form.control}
                  name={`audioFiles.${audioIndex}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter audio URL"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Primary Audio */}
              <div className="space-y-2">
                <Label>Audio Settings</Label>
                <FormField
                  control={form.control}
                  name={`audioFiles.${audioIndex}.isPrimary`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Label>Set as Primary Audio</Label>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        ))}

        {audioFiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No audio files added yet.</p>
            <p className="text-sm">
              Click &ldquo;Add Audio File&rdquo; to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
