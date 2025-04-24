'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageMetadata } from '@/lib/services/imageService';
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
import { cn } from '@/lib/utils';
import { ImageIcon, SearchIcon, Loader2 } from 'lucide-react';

interface WordImageProps {
  imageId?: number;
  definitionId: number;
  onImageSelect?: (imageId: number) => void;
  className?: string;
}

export function WordImage({
  imageId,
  definitionId,
  onImageSelect,
  className,
}: WordImageProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageMetadata[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/images/search?query=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      setSearchResults(data.images);
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (image: ImageMetadata) => {
    try {
      const response = await fetch('/api/images/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: image.id,
          definitionId,
        }),
      });

      if (response.ok) {
        onImageSelect?.(image.id);
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error('Error assigning image:', error);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {imageId ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={`/api/images/${imageId}`}
            alt="Word illustration"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-32">
              <ImageIcon className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Search Images</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="flex gap-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="search">Search term</Label>
                  <Input
                    id="search"
                    placeholder="Enter search term..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button
                  className="self-end"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {searchResults.map((image) => (
                  <button
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                    onClick={() => handleImageSelect(image)}
                  >
                    <Image
                      src={image.sizes.thumbnail}
                      alt={image.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
