import { LearningStatus } from '@/core/types';
import {
  PerformanceColorType,
  LearningModalityType,
  SessionPositionType,
} from '../types';

export const getStatusIconColor = (status: LearningStatus) => {
  switch (status) {
    case LearningStatus.learned:
      return 'text-success-foreground';
    case LearningStatus.inProgress:
      return 'text-info-foreground';
    case LearningStatus.needsReview:
      return 'text-warning-foreground';
    case LearningStatus.difficult:
      return 'text-error-foreground';
    case LearningStatus.notStarted:
      return 'text-content-secondary';
    default:
      return 'text-content-secondary';
  }
};

export const getPerformanceColor = (type: PerformanceColorType) => {
  switch (type) {
    case 'success':
      return 'text-success-foreground';
    case 'info':
      return 'text-info-foreground';
    case 'warning':
      return 'text-warning-foreground';
    case 'error':
      return 'text-error-foreground';
    case 'modern':
      return 'text-modern-slate-foreground';
    default:
      return 'text-foreground';
  }
};

export const getLearningModalityColor = (type: LearningModalityType) => {
  switch (type) {
    case 'textual':
      return {
        bg: 'bg-info-subtle',
        text: 'text-info-foreground',
        icon: 'text-info-foreground',
      };
    case 'visual':
      return {
        bg: 'bg-success-subtle',
        text: 'text-success-foreground',
        icon: 'text-success-foreground',
      };
    case 'auditory':
      return {
        bg: 'bg-modern-slate-subtle',
        text: 'text-modern-slate-foreground',
        icon: 'text-modern-slate-foreground',
      };
    default:
      return {
        bg: 'bg-content-subtle',
        text: 'text-foreground',
        icon: 'text-foreground',
      };
  }
};

export const getSessionPositionColor = (position: SessionPositionType) => {
  switch (position) {
    case 'early':
      return {
        bg: 'bg-info-subtle',
        text: 'text-info-foreground',
      };
    case 'middle':
      return {
        bg: 'bg-warning-subtle',
        text: 'text-warning-foreground',
      };
    case 'late':
      return {
        bg: 'bg-error-subtle',
        text: 'text-error-foreground',
      };
    default:
      return {
        bg: 'bg-content-subtle',
        text: 'text-foreground',
      };
  }
};
