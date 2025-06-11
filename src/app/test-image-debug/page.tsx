'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { AspectRatio } from '@/components/ui/aspect-ratio';

/**
 * Debug page to test image loading for different user roles
 * This helps identify differences between admin and regular user image access
 */
export default function TestImageDebugPage() {
  const { data: session } = useSession();
  const [imageId, setImageId] = useState('1'); // Default test image ID
  const [apiResponse, setApiResponse] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    timestamp?: string;
    success?: boolean;
    contentType?: string | null;
    message?: string;
    error?: { message: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const testImageAPI = async () => {
    setLoading(true);
    setApiResponse(null);

    try {
      const response = await fetch(`/api/images/${imageId}`);

      let result: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        timestamp: string;
        success?: boolean;
        contentType?: string | null;
        message?: string;
        error?: { message: string };
      } = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      };

      if (response.ok) {
        // If successful, we got image data
        result = {
          ...result,
          success: true,
          contentType: response.headers.get('content-type'),
          message: 'Image loaded successfully',
        };
      } else {
        // If failed, try to get error message
        try {
          const errorData = await response.json();
          result = {
            ...result,
            success: false,
            error: errorData,
          };
        } catch {
          result = {
            ...result,
            success: false,
            error: {
              message: `HTTP ${response.status} ${response.statusText}`,
            },
          };
        }
      }

      setApiResponse(result);
    } catch (error) {
      setApiResponse({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Loading Debug Test</CardTitle>
          <div className="flex items-center gap-2">
            <span>Current User:</span>
            <Badge
              variant={
                session?.user?.role === 'admin' ? 'default' : 'secondary'
              }
            >
              {session?.user?.role || 'Not logged in'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({session?.user?.email || 'No email'})
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              placeholder="Image ID"
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
              className="w-32"
            />
            <Button onClick={testImageAPI} disabled={loading}>
              {loading ? 'Testing...' : 'Test Image API'}
            </Button>
          </div>

          {apiResponse && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-background p-3 rounded border overflow-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Display Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test with ImageWithFallback component */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                Using ImageWithFallback Component
              </h3>
              <div className="border rounded-lg overflow-hidden max-w-xs">
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  <ImageWithFallback
                    src={`/api/images/${imageId}`}
                    alt={`Test image ${imageId}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                    onLoad={() =>
                      console.log(
                        '✅ ImageWithFallback: Image loaded successfully',
                      )
                    }
                    onError={(error) =>
                      console.error(
                        '❌ ImageWithFallback: Image failed to load',
                        error,
                      )
                    }
                  />
                </AspectRatio>
              </div>
            </div>

            {/* Test with direct Next.js Image */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                Using Direct Next.js Image
              </h3>
              <div className="border rounded-lg overflow-hidden max-w-xs">
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  <img
                    src={`/api/images/${imageId}`}
                    alt={`Test image ${imageId}`}
                    className="w-full h-full object-cover"
                    onLoad={() =>
                      console.log('✅ Direct img: Image loaded successfully')
                    }
                    onError={(e) => {
                      console.error('❌ Direct img: Image failed to load', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </AspectRatio>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>• Check the browser console for detailed loading logs</p>
            <p>
              • Check server logs at logs/server.log for API request details
            </p>
            <p>• Try different image IDs to test various scenarios</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
