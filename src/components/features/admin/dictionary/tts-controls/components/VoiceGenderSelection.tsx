import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VoiceGenderSelectionProps } from '../types';

/**
 * Voice gender selection component for TTS voice gender settings
 * Displays available voice genders for the selected language
 */
export function VoiceGenderSelection({
  ssmlGender,
  onGenderChange,
  availableGenders,
}: VoiceGenderSelectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Voice Gender</h3>
      <Select value={ssmlGender} onValueChange={onGenderChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableGenders.map((gender) => (
            <SelectItem key={gender} value={gender}>
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
