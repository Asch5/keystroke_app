/**
 * Image processing utilities for profile picture uploads and optimization
 * Handles automatic compression, resizing, and aspect ratio preservation
 */

export interface ImageCompressionOptions {
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Compress an image file to meet size requirements while maintaining aspect ratio
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<File> {
  const {
    maxSizeKB = 50, // Default to 50KB as requested
    maxWidth = 400, // Reasonable size for profile pictures
    maxHeight = 400,
    quality = 0.8,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while preserving aspect ratio
        const dimensions = calculateOptimalDimensions(
          { width: img.width, height: img.height },
          { width: maxWidth, height: maxHeight },
        );

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Draw and compress the image
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Start with the specified quality and reduce if needed
        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 10;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If size is acceptable or we've tried enough times, use this result
              if (sizeKB <= maxSizeKB || attempts >= maxAttempts) {
                const compressedFile = new File([blob], file.name, {
                  type: `image/${format}`,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                attempts++;
                currentQuality = Math.max(0.1, currentQuality - 0.1);
                tryCompress();
              }
            },
            `image/${format}`,
            currentQuality,
          );
        };

        tryCompress();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions for an image while preserving aspect ratio
 * @param original - Original image dimensions
 * @param max - Maximum allowed dimensions
 * @returns ImageDimensions - Optimal dimensions
 */
export function calculateOptimalDimensions(
  original: ImageDimensions,
  max: ImageDimensions,
): ImageDimensions {
  const { width: originalWidth, height: originalHeight } = original;
  const { width: maxWidth, height: maxHeight } = max;

  // If image is already smaller than max dimensions, keep original size
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  let newWidth: number;
  let newHeight: number;

  // Determine which dimension is the limiting factor
  if (originalWidth / maxWidth > originalHeight / maxHeight) {
    // Width is the limiting factor
    newWidth = maxWidth;
    newHeight = maxWidth / aspectRatio;
  } else {
    // Height is the limiting factor
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }

  // Ensure dimensions are integers
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Validate image file type and basic properties
 * @param file - File to validate
 * @returns Promise<boolean> - Whether the file is valid
 */
export async function validateImageFile(file: File): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image (JPG, PNG, or WebP).',
    };
  }

  // Check supported formats
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (!supportedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please use JPG, PNG, or WebP.',
    };
  }

  // Check if file can be loaded as an image
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      // Additional validation can be added here (min dimensions, etc.)
      resolve({ isValid: true });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'Invalid image file or corrupted data.',
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns string - Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a square crop of an image (useful for profile pictures)
 * @param file - Original image file
 * @param size - Size of the square crop
 * @returns Promise<File> - Cropped image file
 */
export async function createSquareCrop(
  file: File,
  size: number = 400,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        const { width: imgWidth, height: imgHeight } = img;
        const minDimension = Math.min(imgWidth, imgHeight);

        // Set canvas to square
        canvas.width = size;
        canvas.height = size;

        // Calculate crop coordinates (center crop)
        const cropX = (imgWidth - minDimension) / 2;
        const cropY = (imgHeight - minDimension) / 2;

        // Draw cropped and resized image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          minDimension,
          minDimension, // Source crop
          0,
          0,
          size,
          size, // Destination size
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create cropped image'));
              return;
            }

            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          },
          'image/jpeg',
          0.9,
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Combine compression and square cropping for profile pictures
 * @param file - Original image file
 * @param options - Processing options
 * @returns Promise<File> - Processed image file
 */
export async function processProfilePicture(
  file: File,
  options: ImageCompressionOptions & { cropToSquare?: boolean } = {},
): Promise<File> {
  const { cropToSquare = true, ...compressionOptions } = options;

  try {
    // Validate the image first
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let processedFile = file;

    // Create square crop if requested
    if (cropToSquare) {
      processedFile = await createSquareCrop(processedFile);
    }

    // Compress the image
    processedFile = await compressImage(processedFile, compressionOptions);

    return processedFile;
  } catch (error) {
    throw new Error(
      `Failed to process profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
