'use client';

import { ListDetailContentMain } from './list-detail-content';
import type { ListDetailContentProps } from './list-detail-content/types';

/**
 * List Detail Content Component
 *
 * This component has been refactored from 808 lines into a modular architecture
 * with focused, reusable components following single responsibility principle.
 *
 * The main functionality is now handled by ListDetailContentMain which orchestrates:
 * - ListDetailHeader: Navigation and title
 * - ListStatsCards: Word count metrics
 * - ProgressBarCard: Visual progress tracking
 * - SearchBar: Word filtering
 * - WordsTable: Word display with actions
 * - ListDetailDialogs: Confirmation dialogs
 * - Custom hooks for state and actions management
 *
 * This refactoring improves maintainability, testability, and follows Cursor Rules
 * for component modularity (each component under 400 lines).
 */
export function ListDetailContent(props: ListDetailContentProps) {
  return <ListDetailContentMain {...props} />;
}
