'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';

interface PracticeType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon';
  features: string[];
}

interface PracticeTypeCardProps {
  practiceType: PracticeType;
  onStartPractice: (practiceTypeId: string) => void;
}

/**
 * Component for displaying a practice type card with features and start button
 */
export function PracticeTypeCard({
  practiceType,
  onStartPractice,
}: PracticeTypeCardProps) {
  return (
    <Card
      className={
        practiceType.status === 'available'
          ? 'cursor-pointer hover:shadow-md transition-shadow'
          : 'opacity-60'
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {practiceType.icon}
            <div>
              <CardTitle className="text-lg">{practiceType.name}</CardTitle>
              <CardDescription>{practiceType.description}</CardDescription>
            </div>
          </div>
          {practiceType.status === 'coming-soon' && (
            <Badge variant="secondary">Coming Soon</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {practiceType.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => onStartPractice(practiceType.id)}
            disabled={practiceType.status === 'coming-soon'}
            className="w-full"
          >
            {practiceType.status === 'available' ? (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Start Practice
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export type { PracticeType };
