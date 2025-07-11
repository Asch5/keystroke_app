'use server';

import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { auth } from '@/auth';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { getUserByEmail } from '@/core/lib/db/user';
import { prisma } from '@/core/lib/prisma';
import { LanguageCode } from '@/core/types';

const profileSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .optional(),
  baseLanguageCode: z
    .string()
    .refine(
      (value) => {
        // Validate that the language code is a valid LanguageCode
        const validLanguageCodes: LanguageCode[] = [
          'en',
          'ru',
          'da',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'zh',
          'ja',
          'ko',
          'ar',
        ];
        return validLanguageCodes.includes(value as LanguageCode);
      },
      { message: 'Please select a valid native language.' },
    )
    .optional(),
  targetLanguageCode: z
    .string()
    .refine(
      (value) => {
        // Validate that the language code is a valid LanguageCode
        const validLanguageCodes: LanguageCode[] = [
          'en',
          'ru',
          'da',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'zh',
          'ja',
          'ko',
          'ar',
        ];
        return validLanguageCodes.includes(value as LanguageCode);
      },
      { message: 'Please select a valid language to learn.' },
    )
    .optional(),
  theme: z
    .enum(['light', 'dark'], {
      message: 'Please select a theme.',
    })
    .optional(),
  photo: z.instanceof(File).optional(),
});

type State = {
  errors?: {
    name?: string[];
    baseLanguageCode?: string[];
    targetLanguageCode?: string[];
    theme?: string[];
    photo?: string[];
  };
  message?: string | null;
  success?: boolean;
};

interface UserSettings {
  [key: string]: string | undefined; // Add index signature
  theme?: 'light' | 'dark';
}

export async function updateUserProfile(
  prevState: State,
  formData: FormData,
): Promise<State> {
  // Get the current user from the session
  const session = await auth();

  void serverLog('User profile update request received', 'info', {
    formDataKeys: Array.from(formData.keys()),
  });

  if (!session || !session.user || !session.user.email) {
    redirect('/login');
  }

  // Validate the form data
  const validatedFields = profileSchema.safeParse({
    name: formData.get('name') || undefined,
    baseLanguageCode: formData.get('baseLanguageCode') || undefined,
    targetLanguageCode: formData.get('targetLanguageCode') || undefined,
    theme: formData.get('theme') || undefined,
    photo:
      formData.get('photo') instanceof File &&
      (formData.get('photo') as File).size > 0
        ? formData.get('photo')
        : undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    // Get the current user
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return { message: 'User not found.' };
    }

    // Get current settings to merge with new ones
    const currentSettings = user.settings as UserSettings;

    // Prepare update data object - let TypeScript infer the type
    const updateData: Record<string, unknown> = {};

    // Only add fields that are present in the validated data and have values
    if (validatedFields.data.name !== undefined) {
      updateData.name = validatedFields.data.name;
    }

    if (validatedFields.data.baseLanguageCode !== undefined) {
      updateData.baseLanguageCode = validatedFields.data
        .baseLanguageCode as LanguageCode;
    }

    if (validatedFields.data.targetLanguageCode !== undefined) {
      updateData.targetLanguageCode = validatedFields.data
        .targetLanguageCode as LanguageCode;
    }

    if (validatedFields.data.theme !== undefined) {
      updateData.settings = {
        ...currentSettings,
        theme: validatedFields.data.theme,
      };
    }

    // Handle photo upload if provided
    if (validatedFields.data.photo) {
      const photo = validatedFields.data.photo;

      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return { message: 'Please upload an image file.' };
      }

      // Validate file size (max 1MB)
      if (photo.size > 0.5 * 1024 * 1024) {
        return { message: 'Photo size should be less than 500KB.' };
      }

      try {
        // Generate a unique filename
        const fileExtension = photo.name.split('.').pop();
        const fileName = `${user.id}-${uuidv4()}.${fileExtension}`;

        // Upload to Vercel Blob
        const blob = await put(fileName, photo, {
          access: 'public',
          contentType: photo.type,
        });

        updateData.profilePictureUrl = blob.url;
      } catch (uploadError) {
        void serverLog('Error uploading photo', 'error', {
          error: uploadError,
          userId: user.id,
        });
        return { message: 'Failed to upload photo. Please try again.' };
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Revalidate the settings page
      revalidatePath('/dashboard/settings');
      return { message: 'Profile updated successfully.', success: true };
    } else {
      return { message: 'No changes to update.' };
    }
  } catch (error) {
    void serverLog('Error updating profile', 'error', {
      error,
      userId: session.user.email,
    });
    if (error instanceof Error) {
      return { message: error.message };
    }
    return { message: 'An unexpected error occurred.' };
  }
}
