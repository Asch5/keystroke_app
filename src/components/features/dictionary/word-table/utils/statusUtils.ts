import { LearningStatus } from '@/core/types';

/**
 * Utility functions for learning status operations
 */

// Get status color
export const getStatusColor = (status: LearningStatus) => {
  switch (status) {
    case LearningStatus.learned:
      return 'bg-success text-success-foreground';
    case LearningStatus.inProgress:
      return 'bg-info text-info-foreground';
    case LearningStatus.needsReview:
      return 'bg-warning text-warning-foreground';
    case LearningStatus.difficult:
      return 'bg-error text-error-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Get status label
export const getStatusLabel = (status: LearningStatus) => {
  switch (status) {
    case LearningStatus.learned:
      return 'Learned';
    case LearningStatus.inProgress:
      return 'Learning';
    case LearningStatus.needsReview:
      return 'Review';
    case LearningStatus.difficult:
      return 'Difficult';
    case LearningStatus.notStarted:
      return 'Not Started';
    default:
      return status;
  }
};
