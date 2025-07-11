import { Activity, Zap, Volume2 } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QualitySelectionProps } from '../types';

/**
 * Quality selection component for TTS voice quality settings
 * Displays quality options with pricing and quota information
 */
export function QualitySelection({
  qualityLevel,
  onQualityChange,
  qualityLevels,
  ttsStats,
}: QualitySelectionProps) {
  const getQualityInfo = () => {
    if (!qualityLevels[qualityLevel]) return null;

    const level = qualityLevels[qualityLevel];
    return {
      name: level.name,
      description: level.description,
      costPerChar: level.costPerCharacter,
      freeLimit: level.freeLimit,
      remaining: ttsStats?.remainingFreeQuota[qualityLevel] || 0,
    };
  };

  const qualityInfo = getQualityInfo();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Voice Quality</h3>
        {qualityInfo && (
          <Badge variant="outline">
            ${qualityInfo.costPerChar.toFixed(6)}/char
          </Badge>
        )}
      </div>

      <Select value={qualityLevel} onValueChange={onQualityChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Standard - Most Cost-Effective
            </div>
          </SelectItem>
          <SelectItem value="high">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              High Quality - Neural Voices (Recommended for Words)
            </div>
          </SelectItem>
          <SelectItem value="premium">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Premium - Studio Quality
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {qualityInfo && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="font-medium">{qualityInfo.description}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Free Quota Remaining:
                </span>
                <p className="font-medium text-success-foreground">
                  {qualityInfo.remaining.toLocaleString()} chars
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
