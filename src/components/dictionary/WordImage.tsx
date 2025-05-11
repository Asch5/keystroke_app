'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageMetadata } from '@/core/lib/services/imageService';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
//import { Label } from '@/components/ui/label';
import { ImageIcon, SearchIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeText } from '@/core/lib/utils/wordsFormators';

interface WordImageProps {
  imageId?: number | undefined;
  mainWord?: string | undefined;
  definitionId: number;
  definitionText: string;
  definitionExamples: string[];
  onImageSelect?: (imageId: number) => void;
  className?: string;
}

export function WordImage({
  mainWord,
  definitionId,
  definitionText,
  definitionExamples,
  onImageSelect,
  //className,
}: WordImageProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/images/search?query=${encodeURIComponent(searchQuery)}`,
      );

      // Check if response is OK and has the expected content type
      const contentType = response.headers.get('content-type');
      if (
        !response.ok ||
        !contentType ||
        !contentType.includes('application/json')
      ) {
        // If not JSON, try to get the text to provide a better error message
        const text = await response.text();

        // Check if it's HTML (which would indicate a server-side error page)
        if (
          text.trim().startsWith('<!DOCTYPE') ||
          text.trim().startsWith('<html')
        ) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }

        throw new Error(
          `Invalid response: ${response.status} ${response.statusText}`,
        );
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

  const handleImageSelect = async (image: ImageMetadata) => {
    setIsLoading(true);
    setError(null);
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

      // Check for HTML or non-JSON responses
      const contentType = response.headers.get('content-type');
      if (
        !response.ok ||
        !contentType ||
        !contentType.includes('application/json')
      ) {
        // If not JSON, try to get the text to provide a better error message
        const text = await response.text();

        // Check if it's HTML (which would indicate a server-side error page)
        if (
          text.trim().startsWith('<!DOCTYPE') ||
          text.trim().startsWith('<html')
        ) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }

        throw new Error(
          `Invalid response: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.success && data.image) {
        onImageSelect?.(data.image.id);
        setIsSheetOpen(false);
        toast.success('Image successfully assigned to word');
      } else {
        throw new Error('Failed to assign image');
      }
    } catch (error) {
      console.error('Error assigning image:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to assign image',
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign image',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <ImageIcon className="h-4 w-4 mr-2" />
          Change Image
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Search Images</SheetTitle>
        </SheetHeader>
        {/* Search input and examples selection section */}
        <div className="space-y-4 mt-6">
          <Select onValueChange={(value) => setSearchQuery(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select appropriate description" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Examples</SelectLabel>
                {mainWord && (
                  <SelectItem value={mainWord}>{mainWord}</SelectItem>
                )}
                <SelectItem value={normalizeText(definitionText)}>
                  {normalizeText(definitionText)}
                </SelectItem>
                {definitionExamples.map((example) => (
                  <SelectItem key={example} value={normalizeText(example)}>
                    {normalizeText(example)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Search input with submit button */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter search term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Error message display */}
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Search results section */}
          {searchResults.length > 0 && (
            <div className="relative">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                <div className="grid grid-cols-2 gap-4">
                  {searchResults.map((image) => (
                    <Button
                      key={image.id}
                      variant="outline"
                      className="h-32 relative"
                      onClick={() => handleImageSelect(image)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleImageSelect(image);
                        }
                      }}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || 'Search result'}
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
