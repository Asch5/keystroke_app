import {
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react';
import { LearningStatus, DifficultyLevel } from '@/core/types';

/**
 * Get color and icon for learning status
 */
export function getStatusIndicator(status: LearningStatus) {
  switch (status) {
    case LearningStatus.learned:
      return {
        color: 'bg-success text-success-foreground',
        icon: CheckCircle,
        label: 'Learned',
      };
    case LearningStatus.inProgress:
      return {
        color: 'bg-info text-info-foreground',
        icon: Clock,
        label: 'In Progress',
      };
    case LearningStatus.difficult:
      return {
        color: 'bg-error text-error-foreground',
        icon: AlertTriangle,
        label: 'Difficult',
      };
    case LearningStatus.needsReview:
      return {
        color: 'bg-warning text-warning-foreground',
        icon: RefreshCw,
        label: 'Needs Review',
      };
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        icon: BookOpen,
        label: 'Not Started',
      };
  }
}

/**
 * Get trend indicator based on improvement trend
 */
export function getTrendIndicator(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return {
        icon: TrendingUp,
        color: 'text-success-foreground',
        label: 'Improving',
      };
    case 'declining':
      return {
        icon: TrendingDown,
        color: 'text-error-foreground',
        label: 'Declining',
      };
    default:
      return { icon: Target, color: 'text-muted-foreground', label: 'Stable' };
  }
}

/**
 * Format time in seconds to readable format
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

/**
 * Format percentage with color coding
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get color for percentage values
 */
export function getPercentageColor(
  value: number,
  threshold: number = 70,
): string {
  if (value >= threshold + 20) return 'text-success-foreground';
  if (value >= threshold) return 'text-info-foreground';
  if (value >= threshold - 20) return 'text-warning-foreground';
  return 'text-error-foreground';
}

export const getDifficultyColor = (level: DifficultyLevel): string => {
  switch (level) {
    case DifficultyLevel.beginner:
      return 'bg-success text-success-foreground';
    case DifficultyLevel.elementary:
      return 'bg-success-subtle text-success-foreground';
    case DifficultyLevel.intermediate:
      return 'bg-warning text-warning-foreground';
    case DifficultyLevel.advanced:
      return 'bg-warning-subtle text-warning-foreground';
    case DifficultyLevel.proficient:
      return 'bg-error text-error-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPerformanceColor = (score: number): string => {
  if (score >= 90) return 'text-success-foreground';
  if (score >= 70) return 'text-warning-foreground';
  return 'text-error-foreground';
};

export const formatConfidenceLevel = (
  level: number,
): { text: string; color: string } => {
  if (level >= 0.8) {
    return { text: 'High', color: 'text-success-foreground' };
  } else if (level >= 0.6) {
    return { text: 'Medium', color: 'text-warning-foreground' };
  } else {
    return { text: 'Low', color: 'text-error-foreground' };
  }
};
