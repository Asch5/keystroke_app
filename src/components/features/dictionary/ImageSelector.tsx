'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, SearchIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageData {
  id: number;
  url: string;
  description?: string | null;
  sizes: {
    thumbnail: string;
    medium: string;
    large: string;
  };
  alt: string;
  photographer?: string;
  photographerUrl?: string;
}

interface ImageSelectorProps {
  onImageSelect: (imageUrl: string) => void;
  selectedImageUrl?: string;
  searchPlaceholder?: string;
  triggerButtonText?: string;
  dialogTitle?: string;
}

export function ImageSelector({
  onImageSelect,
  selectedImageUrl,
  searchPlaceholder = 'Search for images...',
  triggerButtonText = 'Select Image',
  dialogTitle = 'Choose Cover Image',
}: ImageSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/images/search?query=${encodeURIComponent(searchQuery)}`,
      );

      if (!response.ok) {
        const text = await response.text();
        if (
          text.trim().startsWith('<!DOCTYPE') ||
          text.trim().startsWith('<html')
        ) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response: Expected JSON content type');
      }

      const data = await response.json();

      if (!data.images || !Array.isArray(data.images)) {
        throw new Error('Invalid response format');
      }

      setSearchResults(data.images);

      if (data.images.length === 0) {
        setError('No images found for this search term');
      }
    } catch (error) {
      console.error('Error searching images:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to search images',
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to search images',
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (image: ImageData) => {
    onImageSelect(image.url);
    setIsDialogOpen(false);
    toast.success('Image selected successfully');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              {triggerButtonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search Section */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  className="min-w-[100px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer"
                        onClick={() => handleImageSelect(image)}
                      >
                        <div className="aspect-square relative bg-content-soft rounded-lg overflow-hidden hover:ring-2 hover:ring-info-border transition-all">
                          <Image
                            src={image.sizes.medium || image.url}
                            alt={image.alt || 'Search result'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Button
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                        {image.photographer && (
                          <p className="text-xs text-content-tertiary mt-1 truncate">
                            by {image.photographer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {searchQuery &&
                searchResults.length === 0 &&
                !isLoading &&
                !error && (
                  <div className="text-center py-8 text-content-secondary">
                    <p>No images found. Try a different search term.</p>
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual URL Input */}
        <span className="text-sm text-content-secondary">or</span>
        <Label htmlFor="manual-url" className="text-sm">
          Paste URL directly
        </Label>
      </div>

      {/* Preview Selected Image */}
      {selectedImageUrl && (
        <div className="mt-3">
          <Label className="text-sm font-medium">Selected Cover Image:</Label>
          <div className="mt-2 relative w-full h-32 bg-content-subtle rounded-lg overflow-hidden">
            <Image
              src={selectedImageUrl}
              alt="Selected cover image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
