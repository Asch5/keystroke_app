'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PartOfSpeech, SourceType, Gender } from '@prisma/client';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';

// Display name mappings
const partOfSpeechDisplayNames: Record<PartOfSpeech, string> = {
  first_part: 'First Part',
  noun: 'Noun',
  verb: 'Verb',
  phrasal_verb: 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  numeral: 'Numeral',
  article: 'Article',
  exclamation: 'Exclamation',
  abbreviation: 'Abbreviation',
  suffix: 'Suffix',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

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

const genderDisplayNames: Record<Gender, string> = {
  masculine: 'Masculine',
  feminine: 'Feminine',
  neuter: 'Neuter',
  common: 'Common',
  common_neuter: 'Common/Neuter',
};

interface WordDetailFieldsSectionProps {
  formData: WordDetailEditData;
  onInputChange: (
    field: keyof WordDetailEditData,
    value: string | number | boolean | null,
  ) => void;
}

/**
 * WordDetailFieldsSection component for editing WordDetail-specific fields
 * Memoized to prevent unnecessary re-renders
 */
const WordDetailFieldsSection = memo(function WordDetailFieldsSection({
  formData,
  onInputChange,
}: WordDetailFieldsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>WordDetail Fields</span>
          <Badge variant="default">Specific to this variant</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part of Speech */}
          <div className="space-y-2">
            <Label htmlFor="part-of-speech">Part of Speech</Label>
            <Select
              value={formData.partOfSpeech || ''}
              onValueChange={(value) =>
                onInputChange('partOfSpeech', value as PartOfSpeech)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select part of speech" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(partOfSpeechDisplayNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <Label htmlFor="variant">Variant</Label>
            <Input
              id="variant"
              value={formData.variant || ''}
              onChange={(e) => onInputChange('variant', e.target.value || null)}
              placeholder="Enter variant"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender || ''}
              onValueChange={(value) =>
                onInputChange('gender', value as Gender)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(genderDisplayNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phonetic */}
          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic</Label>
            <Input
              id="phonetic"
              value={formData.phonetic || ''}
              onChange={(e) =>
                onInputChange('phonetic', e.target.value || null)
              }
              placeholder="Phonetic for this variant"
            />
          </div>

          {/* Forms */}
          <div className="space-y-2">
            <Label htmlFor="forms">Forms</Label>
            <Input
              id="forms"
              value={formData.forms || ''}
              onChange={(e) => onInputChange('forms', e.target.value || null)}
              placeholder="Enter forms"
            />
          </div>

          {/* Etymology */}
          <div className="space-y-2">
            <Label htmlFor="etymology">Etymology</Label>
            <Input
              id="etymology"
              value={formData.etymology || ''}
              onChange={(e) =>
                onInputChange('etymology', e.target.value || null)
              }
              placeholder="Enter etymology"
            />
          </div>

          {/* Frequency General */}
          <div className="space-y-2">
            <Label htmlFor="frequency-general">Frequency General</Label>
            <Input
              id="frequency-general"
              type="number"
              value={formData.frequencyGeneral || ''}
              onChange={(e) =>
                onInputChange(
                  'frequencyGeneral',
                  Number(e.target.value) || null,
                )
              }
              placeholder="General frequency rank"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Input
              id="frequency"
              type="number"
              value={formData.frequency || ''}
              onChange={(e) =>
                onInputChange('frequency', Number(e.target.value) || null)
              }
              placeholder="Specific frequency rank"
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={formData.source || ''}
              onValueChange={(value) =>
                onInputChange('source', value as SourceType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceTypeDisplayNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default WordDetailFieldsSection;
