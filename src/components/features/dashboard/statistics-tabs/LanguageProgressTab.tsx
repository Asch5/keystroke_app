import { Globe, Users } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';

interface LanguageProgressTabProps {
  statistics: UserStatistics;
}

export const LanguageProgressTab: React.FC<LanguageProgressTabProps> = ({
  statistics,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Learning Path
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {statistics.languageProgress.baseLanguage.toUpperCase()}
                  </Badge>
                  <span>→</span>
                  <Badge variant="outline">
                    {statistics.languageProgress.targetLanguage.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Proficiency Level
                </span>
                <Badge
                  variant={
                    statistics.languageProgress.proficiencyLevel === 'beginner'
                      ? 'destructive'
                      : statistics.languageProgress.proficiencyLevel ===
                          'elementary'
                        ? 'secondary'
                        : statistics.languageProgress.proficiencyLevel ===
                            'intermediate'
                          ? 'default'
                          : statistics.languageProgress.proficiencyLevel ===
                              'advanced'
                            ? 'outline'
                            : 'default'
                  }
                >
                  {statistics.languageProgress.proficiencyLevel
                    .charAt(0)
                    .toUpperCase() +
                    statistics.languageProgress.proficiencyLevel.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Vocabulary Size
                </span>
                <span className="font-medium">
                  {statistics.languageProgress.estimatedVocabularySize.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Learning Community
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4">
              <div className="text-muted-foreground">
                Community features coming soon!
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Connect with other learners, join study groups, and compete in
                challenges.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
