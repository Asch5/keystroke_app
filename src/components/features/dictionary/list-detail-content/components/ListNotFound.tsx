import { Button } from '@/components/ui/button';

interface ListNotFoundProps {
  onBackToLists: () => void;
}

/**
 * Not found component when list doesn't exist or user lacks access
 * Shows appropriate messaging and navigation back to lists
 */
export function ListNotFound({ onBackToLists }: ListNotFoundProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-medium text-foreground">List not found</h2>
      <p className="text-content-secondary mt-2">
        This list may have been deleted or you may not have access to it.
      </p>
      <Button onClick={onBackToLists} className="mt-4">
        Back to Lists
      </Button>
    </div>
  );
}
