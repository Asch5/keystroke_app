import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ListBasicInfo } from '../types';

interface ListDetailHeaderProps {
  listInfo: ListBasicInfo;
  onBackClick: () => void;
  onAddWordsClick: () => void;
}

/**
 * Header component for list detail page
 * Shows list title, description, and main actions
 */
export function ListDetailHeader({
  listInfo,
  onBackClick,
  onAddWordsClick,
}: ListDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{listInfo.displayName}</h1>
          {listInfo.displayDescription && (
            <p className="text-content-secondary mt-1">
              {listInfo.displayDescription}
            </p>
          )}
        </div>
      </div>

      {/* Add Words Button */}
      <Button onClick={onAddWordsClick} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Words to List
      </Button>
    </div>
  );
}
