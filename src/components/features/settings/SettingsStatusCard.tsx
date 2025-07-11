'use client';

import {
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  useSettings,
  useSettingsPersistence,
} from '@/core/shared/hooks/useSettings';

/**
 * Settings Status Card - Shows sync status and provides controls
 *
 * Features:
 * - Real-time sync status
 * - Manual sync trigger
 * - Settings export/import
 * - Sync error display
 * - Last sync time
 */
export function SettingsStatusCard() {
  const {
    forceSyncNow,
    exportSettings,
    importSettings,
    isLoaded,
    isInitialized,
  } = useSettings();
  const {
    hasPendingChanges,
    isSyncing,
    lastSyncedAt,
    lastError,
    formatLastSyncTime,
    isUserAuthenticated,
  } = useSettingsPersistence();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleManualSync = async () => {
    try {
      const success = await forceSyncNow();
      if (success) {
        toast.success('Settings synchronized successfully');
      } else {
        toast.error('Failed to sync settings');
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      toast.error('An error occurred during sync');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const settingsJson = exportSettings();

      // Create and download file
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `keystroke-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Settings exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export settings');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();

      const success = await importSettings(text);
      if (success) {
        toast.success('Settings imported and synchronized successfully');
      } else {
        toast.error('Failed to import settings');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import settings - invalid file format');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (!isUserAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="h-5 w-5" />
            Settings Sync
          </CardTitle>
          <CardDescription>
            Sign in to sync your settings across devices
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSyncStatusInfo = () => {
    if (isSyncing) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: 'Syncing...',
        variant: 'secondary' as const,
        description: 'Synchronizing settings with server',
      };
    }

    if (lastError) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Sync Error',
        variant: 'destructive' as const,
        description: lastError,
      };
    }

    if (hasPendingChanges) {
      return {
        icon: <Clock className="h-4 w-4" />,
        label: 'Pending Changes',
        variant: 'outline' as const,
        description: 'Changes will be synced automatically',
      };
    }

    return {
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'Synced',
      variant: 'default' as const,
      description: 'All settings are up to date',
    };
  };

  const statusInfo = getSyncStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Settings Sync
        </CardTitle>
        <CardDescription>
          Manage your settings synchronization and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={statusInfo.variant}
                className="flex items-center gap-1"
              >
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing || !isLoaded}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
            />
            Sync Now
          </Button>
        </div>

        {/* Last Sync Time */}
        {lastSyncedAt && (
          <div className="text-sm text-muted-foreground">
            Last synced: {formatLastSyncTime()}
          </div>
        )}

        {/* Loading Progress */}
        {!isInitialized && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Loading settings...
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Error Alert */}
        {lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Export/Import Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Data Management</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || !isLoaded}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                disabled={isImporting || !isLoaded}
                asChild
              >
                <label htmlFor="settings-import" className="cursor-pointer">
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import
                </label>
              </Button>
              <input
                id="settings-import"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isImporting || !isLoaded}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Export your settings as a backup or import from a previous backup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
