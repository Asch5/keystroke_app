'use client';

import { Keyboard, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  getUserLists,
  getAvailablePublicLists,
  type UserListWithDetails,
  type PublicListSummary,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { useTranslation } from '@/core/shared/hooks/useTranslation';
import { useUser } from '@/core/shared/hooks/useUser';
import { PracticeTypeCard, VocabularyListSelector } from './overview';
import type { PracticeType } from './overview';
import { VocabularyPracticeSettingsDialog } from './settings';

const PRACTICE_TYPES: PracticeType[] = [
  {
    id: 'unified-practice',
    name: 'Vocabulary Practice',
    description:
      'Comprehensive practice with all 5 exercise types, automatically alternating based on word progress',
    icon: <Target className="h-6 w-6" />,
    status: 'available',
    features: [
      'All 5 exercise types combined',
      'Automatic exercise selection',
      'Progressive difficulty system',
      'Smart word progression algorithm',
      'Alternates between all difficulty levels',
    ],
  },
  {
    id: 'typing',
    name: 'Typing Practice (Legacy)',
    description: 'Classic typing practice with character-by-character feedback',
    icon: <Keyboard className="h-6 w-6" />,
    status: 'available',
    features: [
      'Character-by-character input',
      'Real-time feedback',
      'Progress tracking',
      'Original system',
    ],
  },
];

/**
 * Practice overview component that allows users to choose practice types and lists
 */
export function PracticeOverviewContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();

  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [publicLists, setPublicLists] = useState<PublicListSummary[]>([]);
  const [selectedList, setSelectedList] = useState<string>('all');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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
   * Handle opening settings for practice types
   */
  const handleOpenSettings = (practiceTypeId: string) => {
    if (practiceTypeId === 'unified-practice') {
      setSettingsDialogOpen(true);
    }
  };

  /**
   * Start practice with selected list
   */
  const startPractice = (practiceType: string) => {
    const params = new URLSearchParams();

    // Add list selection
    if (selectedList !== 'all') {
      // Check if it's a user list or public list
      const userList = userLists.find((list) => list.id === selectedList);
      if (userList) {
        params.set('userListId', selectedList);
      } else {
        params.set('listId', selectedList);
      }
    }

    // Route based on practice type
    if (practiceType === 'typing') {
      // Legacy typing practice
      router.push(`/dashboard/practice/typing?${params.toString()}`);
    } else if (practiceType === 'unified-practice') {
      // Vocabulary practice - route to new vocabulary practice page with mode selection
      router.push(`/dashboard/practice/vocabulary?${params.toString()}`);
    } else {
      // Other practice types (shouldn't happen with current setup)
      params.set('type', practiceType);
      router.push(`/dashboard/practice/enhanced?${params.toString()}`);
    }
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
        <h1 className="text-3xl font-bold">{t('practice.practiceOverview')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('practice.selectVocabularySource')}
        </p>
      </div>

      {/* List Selection */}
      <VocabularyListSelector
        selectedList={selectedList}
        userLists={userLists}
        publicLists={publicLists}
        onListChange={setSelectedList}
      />

      {/* Vocabulary Practice Settings Dialog */}
      <VocabularyPracticeSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />

      {/* Practice Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRACTICE_TYPES.map((practiceType) => (
          <PracticeTypeCard
            key={practiceType.id}
            practiceType={practiceType}
            onStartPractice={startPractice}
            onOpenSettings={handleOpenSettings}
          />
        ))}
      </div>
    </div>
  );
}
