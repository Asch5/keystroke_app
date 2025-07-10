import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from '../utils/statusUtils';
import { StatusCellProps } from '../types';

/**
 * Status cell component for displaying learning status
 * Shows colored badge with status label
 */
export function StatusCell({ status }: StatusCellProps) {
  return (
    <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
  );
}
