/**
 * WordTable modular components barrel export
 */

export { WordTable } from './WordTable';
export { useWordTableState } from './hooks/useWordTableState';
export { getStatusColor, getStatusLabel } from './utils/statusUtils';

// Component exports
export { WordCell } from './components/WordCell';
export { DefinitionCell } from './components/DefinitionCell';
export { ListsCell } from './components/ListsCell';
export { StatusCell } from './components/StatusCell';
export { ProgressCell } from './components/ProgressCell';
export { MasteryCell } from './components/MasteryCell';
export { LastReviewedCell } from './components/LastReviewedCell';
export { WordActions } from './components/WordActions';

// Type exports
export type {
  WordTableProps,
  WordCellProps,
  DefinitionCellProps,
  ListsCellProps,
  StatusCellProps,
  ProgressCellProps,
  MasteryCellProps,
  LastReviewedCellProps,
  WordActionsProps,
  DialogState,
} from './types';
