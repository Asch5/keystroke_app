import { prisma } from '@/lib/prisma';
import { PexelsPhoto } from './pexelsService';

export interface ImageMetadata {
  id: number;
  url: string;
  description?: string | null;
  sizes: {
    thumbnail: string; // 150x150
    medium: string; // 300x300
    large: string; // 800x800
  };
  alt: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageUploadMetadata {
  description?: string;
  alt: string;
  definitionId?: number;
}

/**
 * Service for handling image operations
 */
export class ImageService {
  /**
   * Create a new image record from a Pexels photo
   */
  async createFromPexels(
    photo: PexelsPhoto,
    definitionId?: number,
  ): Promise<ImageMetadata> {
    const imageData = {
      url: photo.src.original,
      description: photo.alt,
      alt: photo.alt,
      sizes: {
        thumbnail: photo.src.small,
        medium: photo.src.medium,
        large: photo.src.large,
      },
      mimeType: 'image/jpeg', // Pexels images are typically JPEG
      fileSize: 0, // We don't have this information from Pexels
    };

    const image = await prisma.image.create({
      data: {
        url: imageData.url,
        description: imageData.description,
        ...(definitionId
          ? {
              definitions: {
                connect: { id: definitionId },
              },
            }
          : {}),
      },
    });

    return {
      ...imageData,
      id: image.id,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  /**
   * Get images associated with a definition
   */
  async getImagesByDefinition(definitionId: number): Promise<ImageMetadata[]> {
    const images = await prisma.image.findMany({
      where: {
        definitions: {
          some: {
            id: definitionId,
          },
        },
      },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      description: image.description,
      sizes: {
        thumbnail: image.url, // In this case, we're using the same URL for all sizes
        medium: image.url,
        large: image.url,
      },
      alt: image.description || '',
      mimeType: 'image/jpeg',
      fileSize: 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    }));
  }

  /**
   * Delete an image and its associations
   */
  async deleteImage(imageId: number): Promise<boolean> {
    try {
      await prisma.image.delete({
        where: { id: imageId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Update image metadata
   */
  async updateImageMetadata(
    imageId: number,
    metadata: Partial<ImageMetadata>,
  ): Promise<ImageMetadata> {
    const image = await prisma.image.update({
      where: { id: imageId },
      data: {
        ...(metadata.description !== undefined && {
          description: metadata.description,
        }),
        ...(metadata.url !== undefined && { url: metadata.url }),
      },
    });

    return {
      id: image.id,
      url: image.url,
      description: image.description,
      sizes: {
        thumbnail: image.url,
        medium: image.url,
        large: image.url,
      },
      alt: image.description || '',
      mimeType: 'image/jpeg',
      fileSize: 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
}
