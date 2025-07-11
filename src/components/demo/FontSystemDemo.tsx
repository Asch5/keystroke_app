/**
 * Font System 2025 Demo Component
 * Showcases the new modern font system with practical examples
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FontSystemDemo() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Font System 2025
        </h1>
        <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Modern system font architecture with zero loading time, semantic
          classification, and optimized language learning typography.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-success-subtle text-success-foreground">
            Zero Loading
          </Badge>
          <Badge className="bg-info-subtle text-info-foreground">
            System Native
          </Badge>
          <Badge className="bg-info-subtle text-info-foreground">
            2025 Optimized
          </Badge>
        </div>
      </div>

      {/* Font Stack Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">System Font Stacks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Interface */}
            <div className="space-y-2">
              <h3 className="font-interface font-semibold text-foreground">
                Interface Font
              </h3>
              <p className="font-interface text-sm text-muted-foreground">
                Used for UI elements, navigation, buttons
              </p>
              <div className="font-interface p-3 bg-muted rounded-lg">
                <p className="text-sm">Navigation • Buttons • Forms</p>
                <p className="text-base font-medium">User Interface Text</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h3 className="font-heading font-semibold text-foreground">
                Heading Font
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Geometric humanist for titles and headings
              </p>
              <div className="font-heading p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">Large Headings</p>
                <p className="text-base font-semibold">Section Titles</p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <h3 className="font-body font-semibold text-foreground">
                Body Font
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Humanist design for readable content
              </p>
              <div className="font-body p-3 bg-muted rounded-lg leading-relaxed">
                <p className="text-sm">
                  Optimized for readability and comprehension in longer text
                  passages.
                </p>
              </div>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <h3 className="font-code font-semibold text-foreground">
                Code Font
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Monospace for technical content
              </p>
              <div className="font-code p-3 bg-muted rounded-lg">
                <p className="text-sm">const example = &quot;code&quot;;</p>
                <p className="text-sm">function demo() {}</p>
              </div>
            </div>

            {/* Reading */}
            <div className="space-y-2">
              <h3 className="font-reading font-semibold text-foreground">
                Reading Font
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Serif for long-form content
              </p>
              <div className="font-reading p-3 bg-muted rounded-lg leading-reading">
                <p className="text-sm">
                  Elegant serif typography designed for extended reading
                  sessions.
                </p>
              </div>
            </div>

            {/* Display */}
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-foreground">
                Display Font
              </h3>
              <p className="font-body text-sm text-muted-foreground">
                Rounded, friendly display text
              </p>
              <div className="font-display p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold">Friendly Headers</p>
                <p className="text-base">Approachable Design</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Learning Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Language Learning Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Danish Example */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="font-heading text-xl font-bold">
              Danish Word Example
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-foreign-word text-3xl font-medium text-foreground">
                  Kærlighed
                </h4>
                <p className="font-phonetic text-lg text-muted-foreground mt-1">
                  /ˈkʰæɐ̯liˌð/
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-definition text-base leading-relaxed">
                  <strong>Definition:</strong> Love; a deep romantic or sexual
                  attachment to someone
                </p>
                <p className="font-translation text-sm text-muted-foreground">
                  Translation: &quot;Love&quot; - one of the most fundamental
                  human emotions
                </p>
              </div>
            </div>
          </div>

          {/* Typography Purposes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-body font-semibold">Foreign Words</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-foreign-word text-xl font-medium">
                  Hej verden
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Serif font for better character recognition
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-body font-semibold">Phonetic Notation</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-phonetic text-lg">/hʌɪ ˈvɛɐn/</p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Monospace for consistent character spacing
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-body font-semibold">Definitions</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-definition leading-relaxed">
                  A greeting phrase meaning &quot;Hello world&quot; in Danish
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Optimized for comprehension and readability
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-body font-semibold">Translations</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-translation">
                  Common greeting used in Danish-speaking regions
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Clear translation typography
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Typography Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            Responsive Typography Scale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="font-heading text-5xl font-bold">5XL Heading</div>
            <div className="font-heading text-4xl font-bold">4XL Heading</div>
            <div className="font-heading text-3xl font-bold">3XL Heading</div>
            <div className="font-heading text-2xl font-bold">2XL Heading</div>
            <div className="font-heading text-xl font-bold">XL Heading</div>
            <div className="font-body text-lg">Large body text</div>
            <div className="font-body text-base">Base body text</div>
            <div className="font-body text-sm">Small body text</div>
            <div className="font-body text-xs">Extra small text</div>
          </div>
          <p className="font-body text-sm text-muted-foreground mt-4">
            All sizes use fluid scaling with clamp() for optimal responsiveness
            across devices.
          </p>
        </CardContent>
      </Card>

      {/* Font Weights Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Font Weight Variations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-body font-semibold">Light Weights</h4>
              <div className="space-y-1">
                <p className="font-body font-light text-lg">Light (300)</p>
                <p className="font-body font-normal text-lg">Normal (400)</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-body font-semibold">Medium Weights</h4>
              <div className="space-y-1">
                <p className="font-body font-medium text-lg">Medium (500)</p>
                <p className="font-body font-semibold text-lg">
                  Semibold (600)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-body font-semibold">Heavy Weights</h4>
              <div className="space-y-1">
                <p className="font-heading font-bold text-lg">Bold (700)</p>
                <p className="font-heading font-extrabold text-lg">
                  Extrabold (800)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Performance Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success-subtle rounded-lg">
              <div className="text-2xl font-bold text-success-foreground">
                0ms
              </div>
              <div className="text-sm text-success-foreground">
                Font Loading Time
              </div>
            </div>
            <div className="text-center p-4 bg-info-subtle rounded-lg">
              <div className="text-2xl font-bold text-info-foreground">0</div>
              <div className="text-sm text-info-foreground">
                Network Requests
              </div>
            </div>
            <div className="text-center p-4 bg-info-subtle rounded-lg">
              <div className="text-2xl font-bold text-info-foreground">0</div>
              <div className="text-sm text-info-foreground">Layout Shifts</div>
            </div>
            <div className="text-center p-4 bg-modern-sage-subtle rounded-lg">
              <div className="text-2xl font-bold text-modern-sage-foreground">
                100%
              </div>
              <div className="text-sm text-modern-sage-foreground">
                OS Native
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="text-center space-y-4">
        <p className="font-body text-muted-foreground">
          The font system is now active across your entire application
        </p>
        <div className="flex justify-center gap-4">
          <Button className="font-interface">Experience the App</Button>
          <Button variant="outline" className="font-interface">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FontSystemDemo;
