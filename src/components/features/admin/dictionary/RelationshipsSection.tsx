'use client';

import { Loader2, Save } from 'lucide-react';
import { memo } from 'react';
import { RelationshipManager } from '@/components/features/dictionary/RelationshipManager';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

interface RelationshipsSectionProps {
  formData: WordDetailEditData;
  isSavingRelationships: boolean;
  onSaveRelationships: () => Promise<void>;
  onUpdateFormData: (updates: Partial<WordDetailEditData>) => void;
}

/**
 * RelationshipsSection component wrapper for relationship management
 * Memoized to prevent unnecessary re-renders when parent updates but props remain same
 */
const RelationshipsSection = memo(function RelationshipsSection({
  formData,
  isSavingRelationships,
  onSaveRelationships,
  onUpdateFormData,
}: RelationshipsSectionProps) {
  return (
    <AccordionItem value="relationships">
      <AccordionTrigger className="text-xl font-semibold">
        <div className="flex items-center gap-2">
          <span>Relationships</span>
          <Badge variant="secondary">
            {formData.wordDetailRelationships.filter((rel) => !rel._toDelete)
              .length +
              formData.wordRelationships.filter((rel) => !rel._toDelete)
                .length}{' '}
            total
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Manage Relationships</CardTitle>
            <Button
              onClick={onSaveRelationships}
              disabled={isSavingRelationships}
              variant="outline"
              size="sm"
            >
              {isSavingRelationships ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Relationships
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <RelationshipManager
              formData={formData}
              onUpdateFormData={onUpdateFormData}
            />
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
});

export default RelationshipsSection;
