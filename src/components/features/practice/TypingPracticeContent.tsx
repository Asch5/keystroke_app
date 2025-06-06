'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/core/shared/hooks/useUser';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Volume2,
  Play,
  SkipForward,
  Target,
  Trophy,
  Clock,
  BookOpen,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/core/shared/utils/common/cn';
import {
  createTypingPracticeSession,
  validateTypingInput,
  completePracticeSession,
  type PracticeWord,
  type CreatePracticeSessionRequest,
  type DifficultyConfig,
} from '@/core/domains/user/actions/practice-actions';
import { LearningStatus } from '@prisma/client';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

interface TypingPracticeContentProps {
  userListId?: string;
  listId?: string;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: LearningStatus[];
}

interface SessionState {
  sessionId: string | null;
  words: PracticeWord[];
  currentWordIndex: number;
  currentWord: PracticeWord | null;
  userInput: string;
  timeLimit: number;
  difficultyConfig: DifficultyConfig | null;
  isActive: boolean;
  timeRemaining: number;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: Date | null;
}

interface WordResult {
  isCorrect: boolean;
  accuracy: number;
  partialCredit: boolean;
  pointsEarned: number;
  feedback: string;
  responseTime: number;
  userInput: string;
  correctWord: string;
  mistakes: Array<{
    position: number;
    expected: string;
    actual: string;
  }>;
}

const INITIAL_SESSION_STATE: SessionState = {
  sessionId: null,
  words: [],
  currentWordIndex: 0,
  currentWord: null,
  userInput: '',
  timeLimit: 30,
  difficultyConfig: null,
  isActive: false,
  timeRemaining: 0,
  score: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  startTime: null,
};

export function TypingPracticeContent({
  userListId,
  listId,
  difficultyLevel = 3,
  wordsCount = 10,
  includeWordStatuses = [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ],
}: TypingPracticeContentProps) {
  const { user } = useUser();
  const [sessionState, setSessionState] = useState<SessionState>(
    INITIAL_SESSION_STATE,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<Date | null>(
    null,
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Timer effect for countdown
  useEffect(() => {
    let timerRef: NodeJS.Timeout | null = null;

    if (sessionState.isActive && sessionState.timeRemaining > 0) {
      timerRef = setInterval(() => {
        setSessionState((prev) => {
          if (prev.timeRemaining <= 1) {
            // Don't call handleTimeUp here to avoid closure issues
            return { ...prev, timeRemaining: 0, isActive: false };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef) {
        clearInterval(timerRef);
      }
    };
  }, [sessionState.isActive, sessionState.timeRemaining]);

  // Audio playback function using database audio only (no fallback)
  const playWordAudio = useCallback(
    async (word: string, audioUrl: string | undefined, isCorrect: boolean) => {
      // Check if audio is available in database
      if (!audioUrl) {
        toast.error('🔇 No audio available for this word', {
          description: 'Audio will be added to the database soon',
          duration: 3000,
        });
        return;
      }

      setIsPlayingAudio(true);
      try {
        // Only play from database - no fallback
        await AudioService.playAudioFromDatabase(audioUrl);

        // Add visual feedback with sound
        if (isCorrect) {
          toast.success('🔊 Perfect!', { duration: 2000 });
        } else {
          toast.success('🔊 Listen and learn', { duration: 2000 });
        }
      } catch (error) {
        console.error('Database audio playback failed:', error);
        toast.error('Failed to play audio from database', {
          description: 'Please try again or contact support',
          duration: 3000,
        });
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [],
  );

  // Analyze mistakes function
  const analyzeMistakes = useCallback(
    (userInput: string, correctWord: string) => {
      const mistakes = [];
      const maxLength = Math.max(userInput.length, correctWord.length);

      for (let i = 0; i < maxLength; i++) {
        const userChar = userInput[i] || '';
        const correctChar = correctWord[i] || '';

        if (userChar !== correctChar) {
          mistakes.push({
            position: i,
            expected: correctChar,
            actual: userChar,
          });
        }
      }

      return mistakes;
    },
    [],
  );

  // Complete session
  const handleSessionComplete = useCallback(async () => {
    if (!sessionState.sessionId) return;

    try {
      const response = await completePracticeSession(sessionState.sessionId);

      if (response.success && response.sessionSummary) {
        const summary = response.sessionSummary;

        toast.success(
          `Session completed! Accuracy: ${summary.accuracy}% | Score: ${summary.score}`,
          { duration: 5000 },
        );

        // Show achievements
        if (summary.achievements.length > 0) {
          summary.achievements.forEach((achievement) => {
            toast.success(`🏆 ${achievement}`, { duration: 3000 });
          });
        }
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }

    setSessionState((prev) => ({ ...prev, isActive: false }));
  }, [sessionState.sessionId]);

  // Handle time up
  useEffect(() => {
    if (sessionState.timeRemaining === 0 && sessionState.isActive) {
      toast.warning('Time is up!');
      handleSessionComplete();
    }
  }, [
    sessionState.timeRemaining,
    sessionState.isActive,
    handleSessionComplete,
  ]);

  // Start new practice session
  const startPracticeSession = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to start practice');
      return;
    }

    setIsLoading(true);
    try {
      const request: CreatePracticeSessionRequest = {
        userId: user.id,
        userListId: userListId ?? null,
        listId: listId ?? null,
        difficultyLevel,
        wordsCount,
        includeWordStatuses,
      };

      const response = await createTypingPracticeSession(request);

      if (response.success && response.session) {
        const { sessionId, words, timeLimit, difficultyConfig } =
          response.session;

        setSessionState({
          sessionId,
          words,
          currentWordIndex: 0,
          currentWord: words[0] || null,
          userInput: '',
          timeLimit,
          difficultyConfig,
          isActive: true,
          timeRemaining: timeLimit,
          score: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          startTime: new Date(),
        });

        setWordResults([]);
        setShowResult(false);
        setCurrentWordStartTime(new Date());

        toast.success(
          `Practice session started! ${words.length} words to practice.`,
        );
      } else {
        toast.error(response.error || 'Failed to start practice session');
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
      toast.error('Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    userListId,
    listId,
    difficultyLevel,
    wordsCount,
    includeWordStatuses,
  ]);

  // Submit current word for validation
  const handleWordSubmit = useCallback(
    async (inputValue?: string) => {
      if (
        !sessionState.sessionId ||
        !sessionState.currentWord ||
        !currentWordStartTime
      )
        return;

      const userInput = inputValue || sessionState.userInput;
      const responseTime = Date.now() - currentWordStartTime.getTime();

      try {
        const response = await validateTypingInput({
          sessionId: sessionState.sessionId,
          userDictionaryId: sessionState.currentWord.userDictionaryId,
          userInput,
          responseTime,
        });

        if (response.success && response.result) {
          const correctWord = sessionState.currentWord.wordText;
          const mistakes = analyzeMistakes(userInput, correctWord);

          const result: WordResult = {
            ...response.result,
            responseTime,
            userInput,
            correctWord,
            mistakes,
          };

          setWordResults((prev) => [...prev, result]);
          setShowResult(true);

          // Update session state
          setSessionState((prev) => ({
            ...prev,
            score: prev.score + result.pointsEarned,
            correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
            incorrectAnswers:
              prev.incorrectAnswers + (result.isCorrect ? 0 : 1),
          }));

          // Play audio for the word
          await playWordAudio(
            correctWord,
            sessionState.currentWord?.audioUrl,
            result.isCorrect,
          );

          // Show feedback toast (after audio starts)
          toast(result.feedback, {
            icon: result.isCorrect ? '✅' : result.partialCredit ? '⚠️' : '❌',
            duration: result.isCorrect ? 3000 : 4000, // Longer duration for incorrect to show mistakes
          });

          // Auto-advance after longer delay to allow audio playback
          setTimeout(
            () => {
              handleNextWord();
            },
            result.isCorrect ? 3000 : 4500,
          );
        } else {
          toast.error(response.error || 'Failed to validate input');
        }
      } catch (error) {
        console.error('Error validating input:', error);
        toast.error('Failed to validate input');
      }
    },
    [
      sessionState.sessionId,
      sessionState.currentWord,
      sessionState.userInput,
      currentWordStartTime,
      analyzeMistakes,
      playWordAudio,
    ],
  );

  // Handle word input change
  const handleInputChange = useCallback(
    (value: string) => {
      if (!sessionState.isActive || !sessionState.currentWord) return;

      setSessionState((prev) => ({ ...prev, userInput: value }));

      // Auto-submit when user types the complete word
      if (value.length === sessionState.currentWord.wordText.length) {
        // Using setTimeout to avoid circular dependency
        setTimeout(() => handleWordSubmit(value), 0);
      }
    },
    [sessionState.isActive, sessionState.currentWord],
  );

  // Move to next word
  const handleNextWord = useCallback(() => {
    setShowResult(false);
    setSessionState((prev) => {
      const nextIndex = prev.currentWordIndex + 1;

      if (nextIndex >= prev.words.length) {
        // Session completed
        handleSessionComplete();
        return { ...prev, isActive: false };
      }

      return {
        ...prev,
        currentWordIndex: nextIndex,
        currentWord: prev.words[nextIndex] ?? null,
        userInput: '',
      };
    });
    setCurrentWordStartTime(new Date());
  }, [handleSessionComplete]);

  // Skip current word
  const handleSkipWord = useCallback(async () => {
    if (sessionState.currentWord) {
      const correctWord = sessionState.currentWord.wordText;
      const userInput = sessionState.userInput;

      const result: WordResult = {
        isCorrect: false,
        accuracy: 0,
        partialCredit: false,
        pointsEarned: -2,
        feedback: 'Skipped',
        responseTime: 0,
        userInput,
        correctWord,
        mistakes: [], // No mistakes for skipped words
      };

      setWordResults((prev) => [...prev, result]);
      setSessionState((prev) => ({
        ...prev,
        incorrectAnswers: prev.incorrectAnswers + 1,
        score: prev.score - 2,
      }));

      // Play audio for the correct word when skipped
      await playWordAudio(
        correctWord,
        sessionState.currentWord?.audioUrl,
        false,
      );

      // Show the correct word
      toast.info(`Skipped. The word was: ${correctWord}`, {
        duration: 3000,
      });
    }

    // Delay before moving to next word to allow audio playback
    setTimeout(() => {
      handleNextWord();
    }, 3000);
  }, [
    sessionState.currentWord,
    sessionState.userInput,
    handleNextWord,
    playWordAudio,
  ]);

  // Handle time up - integrated into timer effect

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage =
    sessionState.words.length > 0
      ? (sessionState.currentWordIndex / sessionState.words.length) * 100
      : 0;

  // Render word input slots
  const renderWordInput = () => {
    if (!sessionState.currentWord) return null;

    const word = sessionState.currentWord.wordText;
    const wordLength = word.length;

    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Word length indicator */}
        <div className="text-sm text-muted-foreground">
          {wordLength} letters
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={wordLength}
            value={sessionState.userInput}
            onChange={handleInputChange}
            disabled={!sessionState.isActive || showResult}
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: wordLength }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={cn(
                    'w-12 h-12 text-lg font-semibold border-2 transition-all duration-200',
                    'focus:border-primary focus:ring-2 focus:ring-primary/20',
                    showResult
                      ? sessionState.userInput[index] === word[index]
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : sessionState.userInput[index]
                          ? 'bg-red-100 border-red-500 text-red-800'
                          : 'bg-gray-100 border-gray-300'
                      : index === sessionState.userInput.length
                        ? 'border-primary ring-2 ring-primary/20' // Active slot
                        : index < sessionState.userInput.length
                          ? 'border-blue-400 bg-blue-50' // Filled slots
                          : 'border-muted-foreground/30', // Empty slots
                  )}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {showResult && wordResults.length > 0 && (
          <div className="text-center space-y-4">
            {(() => {
              const lastResult = wordResults[wordResults.length - 1];
              const isCorrect = lastResult?.isCorrect;

              return (
                <>
                  {/* Result badge */}
                  <Badge
                    variant={isCorrect ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {lastResult?.feedback}
                    {isPlayingAudio && ' 🔊'}
                  </Badge>

                  {/* Word comparison for incorrect attempts */}
                  {!isCorrect && lastResult && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            You typed:
                          </p>
                          <div className="font-mono text-lg">
                            {lastResult.userInput
                              .split('')
                              .map((char, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    'px-1 py-0.5 rounded',
                                    lastResult.mistakes.some(
                                      (m) => m.position === index,
                                    )
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'bg-green-100 text-green-800',
                                  )}
                                >
                                  {char || '_'}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Correct word:
                          </p>
                          <div className="font-mono text-lg">
                            {lastResult.correctWord
                              .split('')
                              .map((char, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    'px-1 py-0.5 rounded',
                                    lastResult.mistakes.some(
                                      (m) => m.position === index,
                                    )
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-gray-100 text-gray-600',
                                  )}
                                >
                                  {char}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Mistake summary */}
                      {lastResult.mistakes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <p>
                            {lastResult.mistakes.length} mistake
                            {lastResult.mistakes.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Success message for correct attempts */}
                  {isCorrect && (
                    <p className="text-sm text-green-600 font-medium">
                      Perfect! The word was:{' '}
                      <span className="font-mono">{word}</span>
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access typing practice.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Typing Practice
              </CardTitle>
              <CardDescription>
                Practice typing words from your vocabulary
              </CardDescription>
            </div>
            {!sessionState.isActive && (
              <Button
                onClick={startPracticeSession}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isLoading ? 'Starting...' : 'Start Practice'}
              </Button>
            )}
          </div>
        </CardHeader>

        {sessionState.isActive && (
          <CardContent>
            {/* Progress and Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {sessionState.currentWordIndex + 1}
                </div>
                <div className="text-sm text-muted-foreground">
                  of {sessionState.words.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessionState.correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sessionState.incorrectAnswers}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionState.score}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock className="h-4 w-4" />
              <span
                className={cn(
                  'text-lg font-mono',
                  sessionState.timeRemaining < 60 && 'text-red-600',
                )}
              >
                {formatTime(sessionState.timeRemaining)}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Current Word Practice */}
      {sessionState.isActive && sessionState.currentWord && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 space-y-8">
            {/* Word Definition */}
            <div className="text-center space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Type the word:
              </h2>
              <p className="text-2xl font-semibold text-foreground">
                {sessionState.currentWord.definition}
              </p>
              <div className="flex items-center justify-center gap-4">
                {sessionState.currentWord.phonetic && (
                  <p className="text-sm text-muted-foreground font-mono">
                    /{sessionState.currentWord.phonetic}/
                  </p>
                )}
                {sessionState.currentWord.partOfSpeech && (
                  <Badge variant="outline" className="text-xs">
                    {sessionState.currentWord.partOfSpeech}
                  </Badge>
                )}
              </div>
            </div>

            {/* Typing Input */}
            {renderWordInput()}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleSkipWord}
                disabled={showResult}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>

              {sessionState.userInput && !showResult && (
                <Button
                  onClick={() => handleWordSubmit()}
                  className="flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Submit
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                title={
                  sessionState.currentWord.audioUrl
                    ? 'Play pronunciation'
                    : 'No audio available'
                }
                disabled={isPlayingAudio || !sessionState.currentWord.audioUrl}
                onClick={() => {
                  if (sessionState.currentWord) {
                    playWordAudio(
                      sessionState.currentWord.wordText,
                      sessionState.currentWord.audioUrl,
                      true,
                    );
                  }
                }}
                className={cn(
                  'transition-opacity',
                  !sessionState.currentWord.audioUrl &&
                    'opacity-50 cursor-not-allowed',
                )}
              >
                {sessionState.currentWord.audioUrl ? (
                  <Volume2
                    className={cn(
                      'h-4 w-4 text-blue-600',
                      isPlayingAudio && 'animate-pulse',
                    )}
                  />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary */}
      {!sessionState.isActive && wordResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{wordResults.length}</div>
                <div className="text-sm text-muted-foreground">
                  Words Practiced
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {wordResults.filter((r) => r.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    (wordResults.filter((r) => r.isCorrect).length /
                      wordResults.length) *
                      100,
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{sessionState.score}</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={startPracticeSession}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!sessionState.isActive && wordResults.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Ready to Practice?</h3>
              <p className="text-muted-foreground mb-4">
                Practice typing words from your vocabulary to improve your
                spelling and retention.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>• Real-time feedback</div>
                <div>• Adaptive difficulty</div>
                <div>• Progress tracking</div>
                <div>• Achievement system</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
