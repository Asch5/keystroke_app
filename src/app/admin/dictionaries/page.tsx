'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchDictionaryWords } from '@/core/lib/actions/dictionaryActions';
import { ColumnDef } from '@tanstack/react-table';
import { Word } from '@/core/types/word';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, Edit, Search, Plus } from 'lucide-react';
import { LanguageCode } from '@prisma/client';

// Map for display names of language codes
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
};

export default function DictionariesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    LanguageCode.en,
  );
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      setIsLoading(true);
      try {
        const fetchedWords = await fetchDictionaryWords(selectedLanguage);
        setWords(fetchedWords);
      } catch (error) {
        console.error('Error loading words:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWords();
  }, [selectedLanguage]);

  const columns: ColumnDef<Word>[] = [
    {
      accessorKey: 'text',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Word
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'translation',
      header: 'Translation',
    },
    {
      accessorKey: 'category',
      header: 'Part of Speech',
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }) => {
        const difficulty = row.getValue('difficulty') as string;
        return (
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${
                difficulty === 'easy'
                  ? 'bg-green-500'
                  : difficulty === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="capitalize">{difficulty || 'unknown'}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const word = row.original;

        return (
          <div className="flex space-x-2">
            <Link href={`/admin/dictionaries/edit-word/${word.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link
              href={`/admin/dictionaries/check-word?word=${word.text}&language=${selectedLanguage}`}
            >
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-1" />
                Check
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dictionary Words</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Language:</span>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as LanguageCode)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languageDisplayNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link
              href={`/admin/dictionaries/add-new-word?language=${selectedLanguage}`}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Word
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={words}
              searchColumn="text"
              searchPlaceholder="Search words..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
