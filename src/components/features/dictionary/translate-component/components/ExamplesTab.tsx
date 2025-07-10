import React from 'react';
import { ExamplesTabProps } from '../types';

/**
 * Examples tab component for translation examples
 * Shows list of usage examples
 */
export function ExamplesTab({ examples }: ExamplesTabProps) {
  if (!examples || examples.length === 0) {
    return <p className="text-content-secondary">No examples available</p>;
  }

  return (
    <ul className="list-disc pl-6 space-y-1">
      {examples.map((example: string, idx: number) => (
        <li key={idx}>{example}</li>
      ))}
    </ul>
  );
}
