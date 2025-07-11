import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusCellProps } from '../types';
import { getStatusColor, getStatusLabel } from '../utils/statusUtils';

/**
 * Status cell component for displaying learning status
 * Shows colored badge with status label
 */
export function StatusCell({ status }: StatusCellProps) {
  return (
    <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
  );
}
