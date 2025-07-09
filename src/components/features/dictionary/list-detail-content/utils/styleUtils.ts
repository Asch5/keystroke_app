/**
 * Get learning status badge color classes
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'learned':
      return 'bg-status-learned-subtle text-status-learned-foreground';
    case 'inProgress':
      return 'bg-status-in-progress-subtle text-status-in-progress-foreground';
    case 'needsReview':
      return 'bg-status-needs-review-subtle text-status-needs-review-foreground';
    case 'difficult':
      return 'bg-status-difficult-subtle text-status-difficult-foreground';
    default:
      return 'bg-status-not-started-subtle text-status-not-started-foreground';
  }
};

/**
 * Get icon color classes for different types
 */
export const getIconColor = (
  type: 'info' | 'success' | 'modern' | 'warning',
): string => {
  switch (type) {
    case 'info':
      return 'text-info-foreground';
    case 'success':
      return 'text-success-foreground';
    case 'modern':
      return 'text-modern-slate-foreground';
    case 'warning':
      return 'text-warning-foreground';
    default:
      return 'text-foreground';
  }
};
