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
import { LearningStatus } from '@/core/types';

/**
 * Get color and icon for learning status
 */
export function getStatusIndicator(status: LearningStatus) {
  switch (status) {
    case LearningStatus.learned:
      return { color: 'bg-green-500', icon: CheckCircle, label: 'Learned' };
    case LearningStatus.inProgress:
      return { color: 'bg-blue-500', icon: Clock, label: 'In Progress' };
    case LearningStatus.difficult:
      return { color: 'bg-red-500', icon: AlertTriangle, label: 'Difficult' };
    case LearningStatus.needsReview:
      return { color: 'bg-orange-500', icon: RefreshCw, label: 'Needs Review' };
    default:
      return { color: 'bg-gray-500', icon: BookOpen, label: 'Not Started' };
  }
}

/**
 * Get trend indicator based on improvement trend
 */
export function getTrendIndicator(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return { icon: TrendingUp, color: 'text-green-600', label: 'Improving' };
    case 'declining':
      return { icon: TrendingDown, color: 'text-red-600', label: 'Declining' };
    default:
      return { icon: Target, color: 'text-gray-600', label: 'Stable' };
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
  if (value >= threshold + 20) return 'text-green-600';
  if (value >= threshold) return 'text-blue-600';
  if (value >= threshold - 20) return 'text-orange-600';
  return 'text-red-600';
}
