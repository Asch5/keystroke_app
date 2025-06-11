import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingPracticeContent } from './TypingPracticeContent';
import { LearningStatus } from '@prisma/client';

/**
 * Demo test to verify testing infrastructure is working
 * This tests basic rendering functionality without complex dependencies
 */
describe('TypingPracticeContent - Demo Test', () => {
  it('should render getting started message when no session is active', () => {
    render(
      <TypingPracticeContent
        difficultyLevel={3}
        wordsCount={10}
        includeWordStatuses={[LearningStatus.notStarted]}
      />,
    );

    // Should show the getting started section
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('should show settings panel when not in active session', () => {
    render(
      <TypingPracticeContent
        difficultyLevel={3}
        wordsCount={10}
        includeWordStatuses={[LearningStatus.notStarted]}
      />,
    );

    // Should show practice settings
    expect(screen.getByText('Practice Settings')).toBeInTheDocument();
  });
});
