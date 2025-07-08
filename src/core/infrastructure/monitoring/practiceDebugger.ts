/**
 * Practice Debugging Utility
 *
 * Provides organized debugging capabilities for practice sessions using the existing
 * clientLogger infrastructure. Eliminates the need to manually copy debug information
 * from the developer console.
 */

import {
  infoLog,
  warnLog,
  errorLog,
  debugLog,
  DebugUtils,
} from './clientLogger';
import type { PracticeWord } from '@/core/domains/user/actions/practice-actions';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';

// Types for better organization
interface WordCardDebugData {
  currentWord: PracticeWord;
  settings: VocabularyPracticeSettings;
  conditionalLogic: {
    shouldShowPhonetic: boolean;
    shouldShowPartOfSpeech: boolean;
    shouldShowAudio: boolean;
    shouldShowImage: boolean;
    imageData: {
      hasImageId: boolean;
      hasImageUrl: boolean;
      imageId?: number;
      imageUrl?: string;
    };
    audioData: {
      hasAudioUrl: boolean;
      audioUrl?: string;
    };
  };
  finalProps: Record<string, unknown>;
}

interface PracticeSessionDebugData {
  sessionType: string;
  practiceMode?: string | null;
  practiceModeStatuses?: string[];
  enabledExerciseTypes: string[];
  settings: {
    difficultyLevel: number;
    wordsCount: number;
    autoPlayAudio: boolean;
    showImages: boolean;
  };
  sessionResult: {
    success: boolean;
    hasSession: boolean;
    sessionWordsCount?: number;
    firstWordData?: {
      wordText: string;
      hasAudio: boolean;
      hasImage: boolean;
      definition: string;
    } | null;
  };
}

interface PracticeDebugReport {
  timestamp: string;
  sessionId: string;
  session: PracticeSessionDebugData;
  currentWord: WordCardDebugData;
  issues: {
    missingAudio: boolean;
    missingImage: boolean;
    settingsIssues: string[];
    renderingIssues: string[];
  };
  recommendations: string[];
}

export class PracticeDebugger {
  private static sessionId = '';
  private static currentReport: Partial<PracticeDebugReport> = {};

  /**
   * Initialize debugging for a new practice session
   */
  static async initializeSession(
    sessionData: PracticeSessionDebugData,
  ): Promise<void> {
    this.sessionId = `practice_${Date.now()}`;
    this.currentReport = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      session: sessionData,
      issues: {
        missingAudio: false,
        missingImage: false,
        settingsIssues: [],
        renderingIssues: [],
      },
      recommendations: [],
    };

    await infoLog(`🚀 Practice Session Debug Started`, {
      sessionId: this.sessionId,
      sessionType: sessionData.sessionType,
      practiceMode: sessionData.practiceMode,
      wordsCount: sessionData.settings.wordsCount,
      difficultyLevel: sessionData.settings.difficultyLevel,
    });

    // Analyze session setup
    await this.analyzeSessionSetup(sessionData);
  }

  /**
   * Log word card debug information
   */
  static async logWordCardDebug(wordData: WordCardDebugData): Promise<void> {
    if (!this.currentReport.sessionId) {
      await warnLog('WordCard debug called without initialized session');
      return;
    }

    this.currentReport.currentWord = wordData;

    // Analyze word-specific issues
    await this.analyzeWordIssues(wordData);

    await debugLog(`🃏 WordCard Debug Data Captured`, {
      sessionId: this.sessionId,
      wordText: wordData.currentWord.wordText,
      hasAudio: wordData.conditionalLogic.audioData.hasAudioUrl,
      hasImage:
        wordData.conditionalLogic.imageData.hasImageId ||
        wordData.conditionalLogic.imageData.hasImageUrl,
      issues: this.currentReport.issues,
    });
  }

  /**
   * Log word completion event
   */
  static async logWordCompletion(completionData: {
    userDictionaryId: string;
    userInput: string;
    isCorrect: boolean;
    attempts: number;
    practiceType: string;
  }): Promise<void> {
    await infoLog(`✅ Word Completed`, {
      sessionId: this.sessionId,
      ...completionData,
    });
  }

  /**
   * Generate comprehensive debug report
   */
  static async generateDebugReport(): Promise<PracticeDebugReport | null> {
    if (!this.currentReport.sessionId) {
      await warnLog('Cannot generate report - no active session');
      return null;
    }

    const report = this.currentReport as PracticeDebugReport;

    // Generate final recommendations
    report.recommendations = this.generateRecommendations(report);

    await infoLog(`📊 Practice Debug Report Generated`, {
      sessionId: this.sessionId,
      totalIssues: Object.values(report.issues).flat().length,
      recommendations: report.recommendations.length,
    });

    return report;
  }

  /**
   * Export debug data for external analysis
   */
  static exportDebugData(): string {
    const allLogs = DebugUtils.searchLogs(this.sessionId);
    const report = this.currentReport;

    return JSON.stringify(
      {
        sessionId: this.sessionId,
        report,
        logs: allLogs,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Get quick debug summary for console
   */
  static getDebugSummary(): {
    sessionId: string;
    issues: number;
    recommendations: string[];
    quickFixes: string[];
  } {
    const issues = this.currentReport.issues;
    const totalIssues = issues
      ? (issues.missingAudio ? 1 : 0) +
        (issues.missingImage ? 1 : 0) +
        issues.settingsIssues.length +
        issues.renderingIssues.length
      : 0;

    return {
      sessionId: this.sessionId,
      issues: totalIssues,
      recommendations: this.currentReport.recommendations || [],
      quickFixes: this.generateQuickFixes(),
    };
  }

  /**
   * Clear debug session data
   */
  static clearSession(): void {
    this.sessionId = '';
    this.currentReport = {};
  }

  // Private helper methods
  private static async analyzeSessionSetup(
    sessionData: PracticeSessionDebugData,
  ): Promise<void> {
    const issues = this.currentReport.issues!;

    // Check for session setup issues
    if (!sessionData.sessionResult.success) {
      issues.settingsIssues.push('Practice session creation failed');
      await errorLog('Practice session creation failed', { sessionData });
    }

    if (sessionData.sessionResult.sessionWordsCount === 0) {
      issues.settingsIssues.push('No words available for practice');
      await warnLog('No words found for practice session');
    }

    if (
      !sessionData.enabledExerciseTypes ||
      sessionData.enabledExerciseTypes.length === 0
    ) {
      issues.settingsIssues.push('No exercise types enabled');
      await warnLog('No exercise types enabled in settings');
    }
  }

  private static async analyzeWordIssues(
    wordData: WordCardDebugData,
  ): Promise<void> {
    const issues = this.currentReport.issues!;

    // Check audio issues
    if (!wordData.conditionalLogic.audioData.hasAudioUrl) {
      issues.missingAudio = true;
      await warnLog(
        `No audio available for word: ${wordData.currentWord.wordText}`,
        {
          userDictionaryId: wordData.currentWord.userDictionaryId,
          audioUrl: wordData.conditionalLogic.audioData.audioUrl,
        },
      );
    }

    // Check image issues
    const imageData = wordData.conditionalLogic.imageData;
    if (
      wordData.settings.showDefinitionImages &&
      !imageData.hasImageId &&
      !imageData.hasImageUrl
    ) {
      issues.missingImage = true;
      await warnLog(
        `No image available for word: ${wordData.currentWord.wordText}`,
        {
          userDictionaryId: wordData.currentWord.userDictionaryId,
          imageId: imageData.imageId,
          imageUrl: imageData.imageUrl,
        },
      );
    }

    // Check for rendering issues
    if (
      wordData.settings.showDefinitionImages &&
      (imageData.hasImageId || imageData.hasImageUrl)
    ) {
      // Image should be showing but might not be due to rendering issues
      if (!wordData.conditionalLogic.shouldShowImage) {
        issues.renderingIssues.push(
          `Image rendering logic inconsistent for ${wordData.currentWord.wordText}`,
        );
        await errorLog('Image rendering issue detected', {
          wordText: wordData.currentWord.wordText,
          settingEnabled: wordData.settings.showDefinitionImages,
          hasImageData: imageData.hasImageId || imageData.hasImageUrl,
          shouldShow: wordData.conditionalLogic.shouldShowImage,
        });
      }
    }
  }

  private static generateRecommendations(
    report: PracticeDebugReport,
  ): string[] {
    const recommendations: string[] = [];

    if (report.issues.missingAudio) {
      recommendations.push(
        'Add audio files to the database for better user experience',
      );
    }

    if (report.issues.missingImage) {
      recommendations.push(
        'Add images to words or disable image display in settings',
      );
    }

    if (report.issues.settingsIssues.length > 0) {
      recommendations.push('Review practice settings configuration');
    }

    if (report.issues.renderingIssues.length > 0) {
      recommendations.push(
        'Investigate rendering logic for consistent display',
      );
    }

    return recommendations;
  }

  private static generateQuickFixes(): string[] {
    const fixes: string[] = [];
    const issues = this.currentReport.issues;

    if (!issues) return fixes;

    if (issues.missingAudio) {
      fixes.push('Turn off autoPlayAudioOnWordCard in settings');
    }

    if (issues.missingImage) {
      fixes.push('Turn off showDefinitionImages in settings');
    }

    if (issues.renderingIssues.length > 0) {
      fixes.push('Check conditional rendering logic in WordCard component');
    }

    return fixes;
  }
}

// Global access for development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).PracticeDebugger =
    PracticeDebugger;
}

export default PracticeDebugger;
