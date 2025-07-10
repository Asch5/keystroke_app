import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ListsCellProps } from '../types';

/**
 * Lists cell component for displaying word list memberships
 * Shows up to 2 list names with overflow indicator
 */
export function ListsCell({ lists }: ListsCellProps) {
  return (
    <div className="max-w-xs">
      {lists && lists.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {lists.slice(0, 2).map((listName, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {listName}
            </Badge>
          ))}
          {lists.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{lists.length - 2} more
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">No lists</span>
      )}
    </div>
  );
}
