'use client';

import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Headphones } from 'lucide-react';

interface WriteBySoundHeaderProps {
  maxReplays: number;
}

/**
 * Header component for Write by Sound game with instructions
 */
export function WriteBySoundHeader({ maxReplays }: WriteBySoundHeaderProps) {
  return (
    <CardHeader className="text-center pb-4">
      <div className="flex items-center justify-center gap-4 mb-4">
        <CardTitle className="text-xl">Write the Word by Sound</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Difficulty 4+
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            Audio Only
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-info-subtle border border-info-border rounded-lg">
        <div className="flex items-center gap-2 text-info-foreground mb-2">
          <Headphones className="h-4 w-4" />
          <span className="font-medium">
            Listen carefully and type what you hear
          </span>
        </div>
        <p className="text-sm text-info-foreground">
          You can replay the audio up to {maxReplays} times. Use your keyboard
          or the replay button below.
        </p>
      </div>
    </CardHeader>
  );
}
