'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cleanupDatabase } from '@/core/lib/actions/databaseActions';

export function DatabaseCleanupDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await cleanupDatabase();

      if (result.success) {
        toast.success('Database tables cleaned successfully');
        setIsOpen(false);
      } else {
        setError(result.error ?? 'An unexpected error occurred');
        toast.error(result.error ?? 'Failed to clean database tables');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Clean Database Tables</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clean Database Tables</DialogTitle>
          <DialogDescription>
            This action will delete all data from all tables except the User
            table. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              'Confirm Cleanup'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
