import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TTSControls } from './TTSControls';
import { Plus, List, Trash2, Settings, Download, Upload } from 'lucide-react';
import { LanguageCode } from '@prisma/client';
import type { DictionaryWordDetails } from '@/core/domains/dictionary/actions';

interface ActionButtonsToolbarProps {
  selectedLanguage: LanguageCode;
  selectedWords: Set<string>;
  filteredWordDetails: DictionaryWordDetails[];
  onCreateWordList: () => void;
  onDeleteSelected: () => void;
  onAudioGenerated: () => void;
}

/**
 * Action buttons toolbar for the admin dictionaries page
 * Organized into logical groups for better UX and future extensibility
 */
export function ActionButtonsToolbar({
  selectedLanguage,
  selectedWords,
  filteredWordDetails,
  onCreateWordList,
  onDeleteSelected,
  onAudioGenerated,
}: ActionButtonsToolbarProps) {
  const hasSelectedWords = selectedWords.size > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {/* Content Management Group */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/admin/dictionaries/add-new-word?language=${selectedLanguage}`}
              >
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Word
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new word to the dictionary</p>
            </TooltipContent>
          </Tooltip>

          {/* Future buttons can be added here: Import, Export, etc. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import words from file (Coming soon)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export selected words (Coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Audio Management Group */}
        <div className="flex items-center gap-2">
          <TTSControls
            selectedWords={selectedWords}
            selectedLanguage={selectedLanguage}
            wordDetails={filteredWordDetails}
            onAudioGenerated={onAudioGenerated}
          />
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Selection Actions Group */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCreateWordList}
                disabled={!hasSelectedWords}
                variant="default"
                size="sm"
                className="min-w-[140px]"
              >
                <List className="h-4 w-4 mr-2" />
                Create List ({selectedWords.size})
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a word list from selected words</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onDeleteSelected}
                disabled={!hasSelectedWords}
                variant="destructive"
                size="sm"
                className="min-w-[140px]"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedWords.size})
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete selected words permanently</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Settings & Tools Group */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dictionary settings (Coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
