'use client';

import { Languages, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfigurationState } from '../types';
import { LANGUAGE_OPTIONS } from '../utils/constants';

interface ConfigurationSectionProps {
  configuration: ConfigurationState;
  onTargetLanguagesChange: (languages: string[]) => void;
  onSourceLanguageChange: (language: string) => void;
  onOnlyShortDefinitionsChange: (value: boolean) => void;
}

export function ConfigurationSection({
  configuration,
  onTargetLanguagesChange,
  onSourceLanguageChange,
  onOnlyShortDefinitionsChange,
}: ConfigurationSectionProps) {
  const { targetLanguages, sourceLanguage, onlyShortDefinitions } =
    configuration;

  const handleAddTargetLanguage = (language: string) => {
    if (language && !targetLanguages.includes(language)) {
      onTargetLanguagesChange([...targetLanguages, language]);
    }
  };

  const handleRemoveTargetLanguage = (language: string) => {
    onTargetLanguagesChange(targetLanguages.filter((l) => l !== language));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Target Languages Multi-Select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Target Languages * ({targetLanguages.length} selected)
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {targetLanguages.map((lang) => {
                const langOption = LANGUAGE_OPTIONS.find(
                  (opt) => opt.value === lang,
                );
                return (
                  <Badge
                    key={lang}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Languages className="h-3 w-3" />
                    {langOption?.label}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTargetLanguage(lang)}
                      className="h-auto p-0 ml-1 hover:text-error-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
            <Select value="" onValueChange={handleAddTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Add target language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.filter(
                  (lang) => !targetLanguages.includes(lang.value),
                ).map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {lang.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Language */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Source Language (Auto-detected)
            </Label>
            <Select
              value={sourceLanguage}
              onValueChange={onSourceLanguageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Short Definitions Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onlyShortDefinitions"
              checked={onlyShortDefinitions}
              onCheckedChange={(checked) =>
                onOnlyShortDefinitionsChange(!!checked)
              }
            />
            <Label
              htmlFor="onlyShortDefinitions"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Only short definitions (isInShortDef)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, only processes definitions marked as &ldquo;most
            important&rdquo; in the database.{' '}
            <span className="text-info-foreground font-medium">
              Definitions will reload automatically when toggled.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
