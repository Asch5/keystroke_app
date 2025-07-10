import React from 'react';
import { RawJsonTabProps } from '../types';

/**
 * Raw JSON tab component for displaying raw translation response
 * Shows formatted JSON output for debugging
 */
export function RawJsonTab({ result }: RawJsonTabProps) {
  return (
    <div className="bg-content-subtle p-4 rounded-md">
      <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[500px]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
