'use client';

import React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowUpDown, Edit, Search, Play, Pause, Trash2 } from 'lucide-react';
import { LanguageCode, PartOfSpeech, SourceType } from '@prisma/client';
import Image from 'next/image';
import type { DictionaryWordDetails } from '@/core/domains/dictionary/actions';
import {
  partOfSpeechDisplayNames,
  sourceTypeDisplayNames,
} from './AdminDictionaryConstants';
import { useAudioPlayback } from './useAudioPlayback';

interface AdminDictionaryTableProps {
  data: DictionaryWordDetails[];
  selectedWords: Set<string>;
  onWordSelectionToggle: (wordDetailId: string) => void;
  onSelectAllWords: () => void;
  onClearSelection: () => void;
  onDeleteAudio: (wordId: number) => void;
  selectedLanguage: LanguageCode;
}

/**
 * Data table component for displaying dictionary word details in admin page
 * Includes selection, audio playback, and action columns
 */
export function AdminDictionaryTable({
  data,
  selectedWords,
  onWordSelectionToggle,
  onSelectAllWords,
  onClearSelection,
  onDeleteAudio,
  selectedLanguage,
}: AdminDictionaryTableProps) {
  const { playAudio, isPlaying } = useAudioPlayback();

  const columns: ColumnDef<DictionaryWordDetails>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                onSelectAllWords();
              } else {
                onClearSelection();
              }
            }}
            aria-label="Select all"
          />
          <span className="text-sm">Select</span>
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedWords.has(row.original.id.toString())}
          onCheckedChange={() =>
            onWordSelectionToggle(row.original.id.toString())
          }
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'wordText',
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
      accessorKey: 'partOfSpeech',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          POS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const pos = row.getValue('partOfSpeech') as PartOfSpeech;
        return (
          <span className="capitalize">
            {partOfSpeechDisplayNames[pos] || pos}
          </span>
        );
      },
    },
    {
      accessorKey: 'variant',
      header: 'Variant',
      cell: ({ row }) => {
        const variant = row.getValue('variant') as string | null;
        return variant ? (
          <span className="text-muted-foreground italic">{variant}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'frequencyGeneral',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          F.G.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const freq = row.getValue('frequencyGeneral') as number | null;
        return freq ? (
          <span className="tabular-nums">{freq.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'frequency',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Freq.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const freq = row.getValue('frequency') as number | null;
        return freq ? (
          <span className="tabular-nums">{freq.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'source',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Source
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const source = row.getValue('source') as SourceType;
        return (
          <span className="text-sm">
            {sourceTypeDisplayNames[source] || source}
          </span>
        );
      },
    },
    {
      accessorKey: 'definition',
      header: 'Definition of the word',
      cell: ({ row }) => {
        const definition = row.getValue('definition') as string;
        const fullDefinition = row.original.definitionFull;

        if (!definition) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-sm">{definition}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <p className="text-sm">{fullDefinition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'audioUrl',
      header: 'Audio',
      cell: ({ row }) => {
        const audioUrl = row.getValue('audioUrl') as string | null;
        const wordDetail = row.original;

        if (!audioUrl) {
          return <span className="text-muted-foreground">—</span>;
        }

        const isVercelBlob = audioUrl.includes(
          'public.blob.vercel-storage.com',
        );

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => playAudio(audioUrl)}
              className="h-8 w-8 p-0"
            >
              {isPlaying(audioUrl) ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-xs px-1 py-0.5 rounded ${
                      isVercelBlob
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isVercelBlob ? 'Blob' : 'B64'}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-sm">
                    {isVercelBlob
                      ? 'Stored in Vercel Blob Storage'
                      : 'Base64 encoded audio'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {audioUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteAudio(wordDetail.wordId)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'hasImage',
      header: 'Image',
      cell: ({ row }) => {
        const hasImage = row.getValue('hasImage') as boolean;
        const imageUrl = row.original.imageUrl;

        if (!hasImage || !imageUrl) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-green-600 font-medium">
                  ✓
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="max-w-xs">
                  <Image
                    src={imageUrl}
                    alt="Word illustration"
                    width={100}
                    height={100}
                    className="max-w-full h-auto rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const wordDetail = row.original;

        return (
          <div className="flex space-x-2">
            <Link href={`/admin/dictionaries/edit-word/${wordDetail.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link
              href={`/admin/dictionaries/word-details/${encodeURIComponent(wordDetail.wordText)}?lang=${selectedLanguage}`}
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
    <DataTable
      columns={columns}
      data={data}
      searchColumn="wordText"
      searchPlaceholder="Search words..."
    />
  );
}
