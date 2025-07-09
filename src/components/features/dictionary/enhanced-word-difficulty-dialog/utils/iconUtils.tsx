import {
  CheckCircle,
  Activity,
  RotateCcw,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { LearningStatus } from '@/core/types';
import { getStatusIconColor } from './colorUtils';

export const getStatusIcon = (status: LearningStatus) => {
  const colorClass = getStatusIconColor(status);

  switch (status) {
    case LearningStatus.learned:
      return <CheckCircle className={`h-4 w-4 ${colorClass}`} />;
    case LearningStatus.inProgress:
      return <Activity className={`h-4 w-4 ${colorClass}`} />;
    case LearningStatus.needsReview:
      return <RotateCcw className={`h-4 w-4 ${colorClass}`} />;
    case LearningStatus.difficult:
      return <AlertTriangle className={`h-4 w-4 ${colorClass}`} />;
    case LearningStatus.notStarted:
      return <XCircle className={`h-4 w-4 ${colorClass}`} />;
    default:
      return <XCircle className={`h-4 w-4 ${colorClass}`} />;
  }
};
