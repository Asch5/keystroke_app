import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ListItemProps,
  difficultyDisplayNames,
  difficultyColors,
} from '../types';

/**
 * Individual list item component for displaying list information
 * Shows list name, description, difficulty, and word count
 */
export function ListItem({ list, isSelected, onSelect }: ListItemProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
      }`}
      onClick={() => onSelect(list.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{list.displayName}</h4>
              {!list.listId && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
            {list.displayDescription && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {list.displayDescription}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`text-xs ${difficultyColors[list.displayDifficulty]}`}
              >
                {difficultyDisplayNames[list.displayDifficulty]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {list.wordCount} words
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
