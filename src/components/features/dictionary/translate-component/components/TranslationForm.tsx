import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { languageOptions } from '../constants';
import { TranslationFormProps } from '../types';

/**
 * Translation form component for input and options
 * Handles text input, language selection, and API options
 */
export function TranslationForm({
  text,
  sourceLang,
  destLang,
  options,
  isLoading,
  onTextChange,
  onSourceLangChange,
  onDestLangChange,
  onOptionChange,
  onSubmit,
}: TranslationFormProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Translation API Tester</CardTitle>
        <CardDescription>
          Test the extended-google-translate-api package with various options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text to translate</Label>
            <Input
              id="text"
              placeholder="Enter text to translate..."
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              required
            />
            <p className="text-sm text-content-secondary">
              Enter a word or phrase to translate and get detailed information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceLang">Source Language</Label>
              <Select value={sourceLang} onValueChange={onSourceLangChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destLang">Destination Language</Label>
              <Select value={destLang} onValueChange={onDestLangChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-lg font-medium">API Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(options).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      onOptionChange(
                        key as keyof typeof options,
                        checked === true,
                      )
                    }
                  />
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Translating...' : 'Translate'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
