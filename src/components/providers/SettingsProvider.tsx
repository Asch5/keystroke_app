'use client';

import { useEffect, ReactNode } from 'react';
import { useSettings } from '@/core/shared/hooks/useSettings';
import {
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Settings Provider - Initializes and manages user settings throughout the app
 *
 * This provider:
 * - Initializes settings from database when user logs in
 * - Starts periodic sync service
 * - Handles settings persistence
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user, isInitialized, syncStatus } = useSettings();

  // Log settings initialization status for debugging
  useEffect(() => {
    if (user?.id && isInitialized) {
      infoLog('Settings Provider: Settings initialized for user', {
        userId: user.id,
        userName: user.name,
        hasSettings: isInitialized,
        syncStatus: syncStatus.lastSyncedAt ? 'synced' : 'not_synced',
      });
    }
  }, [user?.id, user?.name, isInitialized, syncStatus.lastSyncedAt]);

  // Log sync errors for debugging
  useEffect(() => {
    if (syncStatus.lastError) {
      errorLog('Settings Provider: Sync error detected', {
        error: syncStatus.lastError,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [syncStatus.lastError, user?.id]);

  // Monitor settings sync status changes
  useEffect(() => {
    if (syncStatus.pendingChanges && !syncStatus.syncInProgress) {
      infoLog('Settings Provider: Pending changes detected', {
        userId: user?.id,
        pendingChanges: syncStatus.pendingChanges,
        lastSyncedAt: syncStatus.lastSyncedAt,
      });
    }
  }, [
    syncStatus.pendingChanges,
    syncStatus.syncInProgress,
    syncStatus.lastSyncedAt,
    user?.id,
  ]);

  return <>{children}</>;
}

export default SettingsProvider;
