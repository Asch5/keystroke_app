'use client';

import { Target, BookOpen, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type {
  UserListWithDetails,
  PublicListSummary,
} from '@/core/domains/dictionary/actions/user-list-actions';

interface VocabularyListSelectorProps {
  selectedList: string;
  userLists: UserListWithDetails[];
  publicLists: PublicListSummary[];
  onListChange: (listId: string) => void;
}

/**
 * Get difficulty badge color based on difficulty level
 */
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground';
    case 'elementary':
      return 'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground';
    case 'intermediate':
      return 'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground';
    case 'advanced':
      return 'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground';
    case 'proficient':
      return 'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground';
    default:
      return 'bg-content-subtle text-content-secondary';
  }
};

/**
 * Get difficulty label
 */
const getDifficultyLabel = (difficulty: string) => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

/**
 * Component for selecting vocabulary lists to practice
 */
export function VocabularyListSelector({
  selectedList,
  userLists,
  publicLists,
  onListChange,
}: VocabularyListSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Choose Your Vocabulary
        </CardTitle>
        <CardDescription>
          Select which words you want to practice from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vocabulary Source</label>
            <Select value={selectedList} onValueChange={onListChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select vocabulary to practice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    All My Vocabulary
                  </div>
                </SelectItem>

                {userLists.length > 0 && (
                  <>
                    <Separator />
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      My Lists
                    </div>
                    {userLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {list.displayName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getDifficultyColor(
                                list.displayDifficulty,
                              )}
                            >
                              {getDifficultyLabel(list.displayDifficulty)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {list.wordCount} words
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected List Details */}
          {selectedList !== 'all' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              {(() => {
                const selectedListInfo = userLists.find(
                  (list) => list.id === selectedList,
                );
                const selectedPublicList = publicLists.find(
                  (list) => list.id === selectedList,
                );

                if (selectedListInfo) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {selectedListInfo.displayName}
                        </h4>
                        <Badge
                          className={getDifficultyColor(
                            selectedListInfo.displayDifficulty,
                          )}
                        >
                          {getDifficultyLabel(
                            selectedListInfo.displayDifficulty,
                          )}
                        </Badge>
                      </div>
                      {selectedListInfo.displayDescription && (
                        <p className="text-sm text-muted-foreground">
                          {selectedListInfo.displayDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{selectedListInfo.wordCount} words</span>
                        <span>
                          {selectedListInfo.listId
                            ? 'Public List'
                            : 'Custom List'}
                        </span>
                      </div>
                    </div>
                  );
                } else if (selectedPublicList) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {selectedPublicList.name}
                        </h4>
                        <Badge
                          className={getDifficultyColor(
                            selectedPublicList.difficultyLevel,
                          )}
                        >
                          {getDifficultyLabel(
                            selectedPublicList.difficultyLevel,
                          )}
                        </Badge>
                      </div>
                      {selectedPublicList.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedPublicList.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{selectedPublicList.wordCount} words</span>
                        <span>Public List</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
