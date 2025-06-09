'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Keyboard,
  Target,
  BookOpen,
  Users,
  Clock,
  Trophy,
  Gamepad2,
  Brain,
} from 'lucide-react';
import { useUser } from '@/core/shared/hooks/useUser';
import {
  getUserLists,
  getAvailablePublicLists,
  type UserListWithDetails,
  type PublicListSummary,
} from '@/core/domains/dictionary/actions/user-list-actions';

interface PracticeType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon';
  features: string[];
}

const PRACTICE_TYPES: PracticeType[] = [
  {
    id: 'typing',
    name: 'Typing Practice',
    description: 'Practice typing words to improve spelling and muscle memory',
    icon: <Keyboard className="h-6 w-6" />,
    status: 'available',
    features: [
      'Character-by-character input',
      'Real-time feedback',
      'Progress tracking',
    ],
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Study vocabulary with interactive flashcards',
    icon: <BookOpen className="h-6 w-6" />,
    status: 'coming-soon',
    features: ['Spaced repetition', 'Audio pronunciation', 'Multiple choice'],
  },
  {
    id: 'quiz',
    name: 'Vocabulary Quiz',
    description: 'Test your knowledge with multiple choice questions',
    icon: <Brain className="h-6 w-6" />,
    status: 'coming-soon',
    features: ['Multiple formats', 'Timed challenges', 'Difficulty levels'],
  },
  {
    id: 'games',
    name: 'Word Games',
    description: 'Learn through fun and engaging word games',
    icon: <Gamepad2 className="h-6 w-6" />,
    status: 'coming-soon',
    features: ['Word matching', 'Crosswords', 'Word search'],
  },
];

/**
 * Practice overview component that allows users to choose practice types and lists
 */
export function PracticeOverviewContent() {
  const router = useRouter();
  const { user } = useUser();

  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [publicLists, setPublicLists] = useState<PublicListSummary[]>([]);
  const [selectedList, setSelectedList] = useState<string>('all');

  /**
   * Load user lists and public lists
   */
  useEffect(() => {
    async function loadLists() {
      if (!user) return;

      try {
        // Load user lists
        const userListsResponse = await getUserLists(user.id);
        if (userListsResponse.userLists) {
          setUserLists(userListsResponse.userLists);
        }

        // Load public lists (for reference)
        const publicListsResponse = await getAvailablePublicLists(user.id, {
          base: user.baseLanguageCode,
          target: user.targetLanguageCode,
        });
        if (publicListsResponse.publicLists) {
          setPublicLists(publicListsResponse.publicLists);
        }
      } catch (error) {
        console.error('Error loading lists:', error);
      }
    }

    loadLists();
  }, [user]);

  /**
   * Start practice with selected list
   */
  const startPractice = (practiceType: string) => {
    if (practiceType !== 'typing') {
      // For coming soon features, just show a message
      return;
    }

    const params = new URLSearchParams();

    if (selectedList !== 'all') {
      // Check if it's a user list or public list
      const userList = userLists.find((list) => list.id === selectedList);
      if (userList) {
        params.set('userListId', selectedList);
      } else {
        params.set('listId', selectedList);
      }
    }

    router.push(`/dashboard/practice/typing?${params.toString()}`);
  };

  /**
   * Get difficulty badge color based on difficulty level
   */
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'elementary':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'advanced':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
      case 'proficient':
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  /**
   * Get difficulty label
   */
  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access practice features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Practice Your Vocabulary</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose from different practice types and select which vocabulary list
          you want to focus on.
        </p>
      </div>

      {/* List Selection */}
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
              <Select value={selectedList} onValueChange={setSelectedList}>
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

      {/* Practice Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRACTICE_TYPES.map((practiceType) => (
          <Card
            key={practiceType.id}
            className={
              practiceType.status === 'available'
                ? 'cursor-pointer hover:shadow-md transition-shadow'
                : 'opacity-60'
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {practiceType.icon}
                  <div>
                    <CardTitle className="text-lg">
                      {practiceType.name}
                    </CardTitle>
                    <CardDescription>
                      {practiceType.description}
                    </CardDescription>
                  </div>
                </div>
                {practiceType.status === 'coming-soon' && (
                  <Badge variant="secondary">Coming Soon</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {practiceType.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => startPractice(practiceType.id)}
                  disabled={practiceType.status === 'coming-soon'}
                  className="w-full"
                >
                  {practiceType.status === 'available' ? (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Start Practice
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Coming Soon
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
