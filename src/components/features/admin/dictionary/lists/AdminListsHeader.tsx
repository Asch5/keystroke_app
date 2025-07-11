import { Download, List, Plus } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminListsHeaderProps {
  onCreateList: () => void;
}

export function AdminListsHeader({ onCreateList }: AdminListsHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <List className="h-5 w-5 mr-2" />
              Lists Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all vocabulary lists in the system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onCreateList}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
