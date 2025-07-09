'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { deleteUserAccount } from '@/core/domains/user/actions/user-settings-actions';
import type { UserSettingsState } from '@/core/domains/user/types/user-settings';

export function DangerZoneForm() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const [state, formAction, isPending] = useActionState(deleteUserAccount, {
    errors: {},
    message: null,
    success: false,
  } as UserSettingsState);

  const isDeleteEnabled = confirmationText === 'DELETE';

  const handleDeleteSubmit = () => {
    if (isDeleteEnabled) {
      const formData = new FormData();
      formData.append('confirmationText', confirmationText);
      formAction(formData);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Message */}
        <Alert className="border-warning-border bg-warning-subtle">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            These actions are permanent and cannot be undone. Please proceed
            with caution.
          </AlertDescription>
        </Alert>

        {/* Account Deletion Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>

          <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
            <h4 className="font-medium text-destructive mb-2">
              What will be deleted:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your profile information and settings</li>
              <li>All learning progress and statistics</li>
              <li>Your personal dictionary and word lists</li>
              <li>Learning sessions and achievements</li>
              <li>Custom notes and examples</li>
              <li>All uploaded files and media</li>
            </ul>
          </div>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Warning:</strong> This action is irreversible!
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="confirmationText">
                    Type <strong>DELETE</strong> to confirm:
                  </Label>
                  <Input
                    id="confirmationText"
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="font-mono"
                  />
                </div>

                {state.message && !state.success && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      {state.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setConfirmationText('');
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmit}
                  disabled={!isDeleteEnabled || isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Data Export Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download a copy of your data before deleting your account.
            </p>
          </div>

          <Button variant="outline" className="w-full sm:w-auto" disabled>
            Export My Data
            <span className="ml-2 text-xs text-muted-foreground">
              (Coming Soon)
            </span>
          </Button>
        </div>

        {/* Account Recovery Information */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Account Recovery</h4>
          <p className="text-sm text-muted-foreground">
            Once your account is deleted, it cannot be recovered. You would need
            to create a new account to use our services again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
