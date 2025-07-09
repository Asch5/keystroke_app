import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { RemoveDialogState, AddWordsDialogState } from '../types';

interface ListDetailDialogsProps {
  removeDialog: RemoveDialogState;
  addWordsDialog: AddWordsDialogState;
  onRemoveConfirm: () => Promise<void>;
  onRemoveCancel: () => void;
  onAddWordsCancel: () => void;
  onGoToDictionary: () => void;
}

/**
 * Dialogs component for list detail actions
 * Handles remove word confirmation and add words guidance
 */
export function ListDetailDialogs({
  removeDialog,
  addWordsDialog,
  onRemoveConfirm,
  onRemoveCancel,
  onAddWordsCancel,
  onGoToDictionary,
}: ListDetailDialogsProps) {
  return (
    <>
      {/* Remove Word Dialog */}
      <AlertDialog
        open={removeDialog.open}
        onOpenChange={(open) => !open && onRemoveCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Word from List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{removeDialog.wordText}
              &quot; from this list? This will not delete the word from your
              dictionary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onRemoveCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onRemoveConfirm}
              className="bg-error-background hover:bg-error-background/80 text-error-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Words Dialog */}
      <AlertDialog
        open={addWordsDialog.open}
        onOpenChange={(open) => !open && onAddWordsCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Words to List</AlertDialogTitle>
            <AlertDialogDescription>
              To add words to this list, go to your dictionary and use the
              &quot;Add to List&quot; option for each word you want to add. This
              allows you to select specific words from your personal vocabulary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onAddWordsCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onGoToDictionary}>
              Go to My Dictionary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
