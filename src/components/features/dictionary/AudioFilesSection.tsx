'use client';

import { Trash2, Plus } from 'lucide-react';
import { memo } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';
import { SourceType, LanguageCode } from '@/core/types';

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

interface AudioFilesSectionProps {
  formData: WordDetailEditData;
  onAudioChange: (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => void;
  onAddAudioFile: () => void;
  onRemoveAudioFile: (index: number) => void;
  onTogglePrimaryAudio: (index: number) => void;
}

/**
 * AudioFilesSection component for managing audio files
 * Memoized to prevent unnecessary re-renders
 */
const AudioFilesSection = memo(function AudioFilesSection({
  formData,
  onAudioChange,
  onAddAudioFile,
  onRemoveAudioFile,
  onTogglePrimaryAudio,
}: AudioFilesSectionProps) {
  return (
    <AccordionItem value="audio">
      <Card>
        <CardHeader>
          <AccordionTrigger className="flex items-center justify-between w-full text-left">
            <CardTitle>Audio Files ({formData.audioFiles.length})</CardTitle>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddAudioFile}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Audio File
              </Button>
            </div>

            {formData.audioFiles.map((audio, index) => (
              <Card key={audio.id ?? `new-audio-${index}`} className="border-2">
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
                        onClick={() => onRemoveAudioFile(index)}
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
                        onAudioChange(index, 'url', e.target.value)
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
                          onAudioChange(index, 'source', value as SourceType)
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
                          onAudioChange(
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
                      value={audio.note ?? ''}
                      onChange={(e) =>
                        onAudioChange(index, 'note', e.target.value ?? null)
                      }
                      placeholder="Optional note about this audio file"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={audio.isPrimary}
                      onCheckedChange={() => onTogglePrimaryAudio(index)}
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
                  onClick={onAddAudioFile}
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
  );
});

export default AudioFilesSection;
