import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';

interface AchievementsTabProps {
  statistics: UserStatistics;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({
  statistics,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievement Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {statistics.achievements.totalAchievements}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Achievements
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.achievements.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.achievements.recentAchievements.map(
                (achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <Award className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.description}
                      </div>
                    </div>
                    <Badge variant="secondary">{achievement.points} pts</Badge>
                  </div>
                ),
              )}
              {statistics.achievements.recentAchievements.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No achievements yet. Keep learning to unlock your first
                  achievement!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
