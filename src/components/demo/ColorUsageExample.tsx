import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example component demonstrating proper usage of the enhanced 2025 color system.
 * This shows how to use semantic tokens for consistent, accessible, and modern UI.
 */
export default function ColorUsageExample() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Enhanced Color System Usage Examples
        </h1>
        <p className="text-content-secondary">
          Practical examples of using the 2025-optimized semantic color tokens
        </p>
      </div>

      {/* Status Messages */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Status & Feedback Messages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="bg-success-subtle border-success-border">
            <AlertDescription className="text-success-foreground">
              ✅ Perfect! Your typing speed has improved to 45 WPM.
            </AlertDescription>
          </Alert>

          <Alert className="bg-warning-subtle border-warning-border">
            <AlertDescription className="text-warning-foreground">
              ⚠️ Your accuracy dropped below 90%. Practice more slowly.
            </AlertDescription>
          </Alert>

          <Alert className="bg-error-subtle border-error-border">
            <AlertDescription className="text-error-foreground">
              ❌ Lesson incomplete. Please finish all exercises.
            </AlertDescription>
          </Alert>

          <Alert className="bg-info-subtle border-info-border">
            <AlertDescription className="text-info-foreground">
              💡 Tip: Focus on accuracy before increasing speed.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* 2025 Trending Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-4">2025 Trending Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-teal-subtle border-teal-border hover-lift">
            <CardHeader>
              <CardTitle className="text-teal-foreground">
                🌊 Progress Tracking (Teal - 2025 Trend)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-teal-foreground text-sm">
                Modern teal creates a fresh, approachable feel for progress
                indicators and elementary difficulty levels.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-modern-sage-subtle border-modern-sage-subtle">
            <CardHeader>
              <CardTitle className="text-modern-sage-foreground">
                🌿 Wellness Features (Sage)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-modern-sage-foreground text-sm">
                Sophisticated sage green for calm, wellness-focused features and
                nature-themed content.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Difficulty Level Badges */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Difficulty Level Indicators
        </h2>
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-difficulty-beginner-subtle text-difficulty-beginner-foreground border-difficulty-beginner-subtle px-4 py-2">
            🟢 Beginner
          </Badge>
          <Badge className="bg-difficulty-elementary-subtle text-difficulty-elementary-foreground border-difficulty-elementary-subtle px-4 py-2">
            🔵 Elementary (Teal!)
          </Badge>
          <Badge className="bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground border-difficulty-intermediate-subtle px-4 py-2">
            🟡 Intermediate
          </Badge>
          <Badge className="bg-difficulty-advanced-subtle text-difficulty-advanced-foreground border-difficulty-advanced-subtle px-4 py-2">
            🟠 Advanced
          </Badge>
          <Badge className="bg-difficulty-proficient-subtle text-difficulty-proficient-foreground border-difficulty-proficient-subtle px-4 py-2">
            🔴 Proficient
          </Badge>
        </div>
        <p className="text-content-secondary text-sm mt-2">
          Notice how elementary now uses the trendy teal color while maintaining
          excellent contrast ratios.
        </p>
      </section>

      {/* Practice Game Types */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Practice Game Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-practice-typing-subtle border-practice-typing-subtle text-center">
            <CardContent className="p-4">
              <div className="text-2xl mb-2">⌨️</div>
              <h3 className="text-practice-typing-foreground font-medium">
                Typing
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-practice-multiple-choice-subtle border-practice-multiple-choice-subtle text-center">
            <CardContent className="p-4">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="text-practice-multiple-choice-foreground font-medium">
                Quiz
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-practice-flashcard-subtle border-practice-flashcard-subtle text-center">
            <CardContent className="p-4">
              <div className="text-2xl mb-2">🃏</div>
              <h3 className="text-practice-flashcard-foreground font-medium">
                Flashcards
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-practice-audio-subtle border-practice-audio-subtle text-center">
            <CardContent className="p-4">
              <div className="text-2xl mb-2">🎧</div>
              <h3 className="text-practice-audio-foreground font-medium">
                Audio
              </h3>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Learning Status Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Learning Progress Status</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-status-not-started-subtle text-status-not-started-foreground">
              Not Started
            </Badge>
            <span className="text-content-secondary">
              Lessons you haven&apos;t begun yet
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-status-in-progress-subtle text-status-in-progress-foreground">
              In Progress (Teal!)
            </Badge>
            <span className="text-content-secondary">
              Currently learning - uses trending 2025 teal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-status-learned-subtle text-status-learned-foreground">
              Learned
            </Badge>
            <span className="text-content-secondary">
              Successfully completed content
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-status-needs-review-subtle text-status-needs-review-foreground">
              Needs Review
            </Badge>
            <span className="text-content-secondary">
              Content requiring additional practice
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-status-difficult-subtle text-status-difficult-foreground">
              Difficult
            </Badge>
            <span className="text-content-secondary">
              Challenging content needing focused attention
            </span>
          </div>
        </div>
      </section>

      {/* Content Hierarchy */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Content Hierarchy with Enhanced Grays
        </h2>
        <Card className="bg-content-subtle border-content-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Primary Content (Foreground)
            </h3>
            <p className="text-content-secondary mb-3">
              Secondary information with improved contrast ratios for better
              readability.
            </p>
            <p className="text-content-tertiary text-sm">
              Tertiary details with enhanced lightness values for clear
              hierarchy.
            </p>
            <div className="mt-4 p-3 bg-content-soft rounded border border-content-border">
              <span className="text-sm text-content-secondary">
                Card backgrounds use the refined content-soft token for better
                visual separation.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Best Practices */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Best Practices Demonstrated
        </h2>
        <div className="bg-content-subtle border border-content-border rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-success-foreground">
            ✅ What We&apos;re Doing Right:
          </h3>
          <ul className="space-y-2 text-sm text-content-secondary">
            <li>• Using semantic tokens instead of hard-coded colors</li>
            <li>
              • Incorporating 2025 trend color (teal) in appropriate contexts
            </li>
            <li>• Maintaining 15.2:1 contrast ratios (exceeds WCAG AAA)</li>
            <li>• Providing clear visual hierarchy with enhanced grays</li>
            <li>• Using OKLCH for future-proof, perceptually uniform colors</li>
            <li>• Creating consistent color-to-meaning relationships</li>
          </ul>

          <h3 className="font-semibold mb-3 mt-6 text-error-foreground">
            ❌ What We&apos;re Avoiding:
          </h3>
          <ul className="space-y-2 text-sm text-content-secondary">
            <li>• Hard-coded Tailwind colors (e.g., bg-green-500)</li>
            <li>• Manual dark mode variants (e.g., dark:bg-green-800)</li>
            <li>• Inconsistent color usage across components</li>
            <li>• Poor contrast ratios that fail accessibility standards</li>
            <li>
              • Overly saturated colors that appear harsh or unprofessional
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
