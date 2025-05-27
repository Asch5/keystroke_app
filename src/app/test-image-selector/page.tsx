'use client';

import React, { useState } from 'react';
import { ImageSelector } from '@/components/features/dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestImageSelectorPage() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Selector Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the new ImageSelector component with Pexels API integration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Select an Image</h3>
            <ImageSelector
              onImageSelect={(imageUrl) => setSelectedImageUrl(imageUrl)}
              selectedImageUrl={selectedImageUrl}
              searchPlaceholder="Search for any image..."
              triggerButtonText="Choose Image"
              dialogTitle="Select an Image"
            />
          </div>

          {selectedImageUrl && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Image URL:</h4>
              <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
                {selectedImageUrl}
              </p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Try searching for terms like:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>&ldquo;vocabulary&rdquo; - for education-related images</li>
              <li>&ldquo;books&rdquo; - for learning materials</li>
              <li>&ldquo;study&rdquo; - for academic themes</li>
              <li>&ldquo;language&rdquo; - for linguistics content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
