'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/core/lib/prisma';
import { getUserByEmail } from '@/core/lib/db/user';
import { Prisma, LanguageCode } from '@prisma/client';
import type {
  UserSettingsState,
  UserProfileState,
} from '@/core/domains/user/types/user-settings';

// Validation schemas
const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(100, { message: 'Name must be less than 100 characters.' })
    .optional(),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional(),
  baseLanguageCode: z
    .enum([
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
    ])
    .optional(),
  targetLanguageCode: z
    .enum([
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
    ])
    .optional(),
  profilePicture: z.instanceof(File).optional(),
});

const userSettingsSchema = z.object({
  dailyGoal: z
    .number()
    .min(1, { message: 'Daily goal must be at least 1.' })
    .max(100, { message: 'Daily goal cannot exceed 100.' })
    .optional(),
  notificationsEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  autoPlayAudio: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  sessionDuration: z
    .number()
    .min(5, { message: 'Session duration must be at least 5 minutes.' })
    .max(120, { message: 'Session duration cannot exceed 120 minutes.' })
    .optional(),
  reviewInterval: z
    .number()
    .min(1, { message: 'Review interval must be at least 1 day.' })
    .max(30, { message: 'Review interval cannot exceed 30 days.' })
    .optional(),
  difficultyPreference: z
    .number()
    .min(1, { message: 'Difficulty preference must be between 1 and 5.' })
    .max(5, { message: 'Difficulty preference must be between 1 and 5.' })
    .optional(),
  learningReminders: z.record(z.unknown()).optional(),
});

const appSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  autoSave: z.boolean().optional(),
});

// Helper function to get current user
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Update user profile information (name, email, languages, profile picture)
 */
export async function updateUserProfile(
  prevState: UserProfileState,
  formData: FormData,
): Promise<UserProfileState> {
  try {
    const user = await getCurrentUser();

    // Parse form data
    const formDataObj = {
      name: formData.get('name') as string | null,
      email: formData.get('email') as string | null,
      baseLanguageCode: formData.get('baseLanguageCode') as string | null,
      targetLanguageCode: formData.get('targetLanguageCode') as string | null,
      profilePicture: formData.get('profilePicture') as File | null,
    };

    // Filter undefined values
    const cleanData = Object.fromEntries(
      Object.entries(formDataObj).filter(
        ([, value]) => value !== null && value !== '',
      ),
    );

    // Handle file separately
    if (
      cleanData.profilePicture &&
      (cleanData.profilePicture as File).size > 0
    ) {
      cleanData.profilePicture = cleanData.profilePicture as File;
    } else {
      delete cleanData.profilePicture;
    }

    // Validate the data
    const validatedFields = profileUpdateSchema.safeParse(cleanData);

    if (!validatedFields.success) {
      return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const updateData: Partial<typeof user> = {};

    // Add validated fields to update data
    if (validatedFields.data.name) {
      updateData.name = validatedFields.data.name;
    }

    if (
      validatedFields.data.email &&
      validatedFields.data.email !== user.email
    ) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedFields.data.email },
      });

      if (existingUser) {
        return { message: 'Email already exists.' };
      }

      updateData.email = validatedFields.data.email;
    }

    if (validatedFields.data.baseLanguageCode) {
      updateData.baseLanguageCode = validatedFields.data
        .baseLanguageCode as LanguageCode;
    }

    if (validatedFields.data.targetLanguageCode) {
      updateData.targetLanguageCode = validatedFields.data
        .targetLanguageCode as LanguageCode;
    }

    // Handle profile picture upload
    if (validatedFields.data.profilePicture) {
      const photo = validatedFields.data.profilePicture;

      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return { message: 'Please upload an image file.' };
      }

      // Validate file size (max 2MB)
      if (photo.size > 2 * 1024 * 1024) {
        return { message: 'Photo size should be less than 2MB.' };
      }

      try {
        // Generate a unique filename
        const fileExtension = photo.name.split('.').pop();
        const fileName = `profile/${user.id}-${uuidv4()}.${fileExtension}`;

        // Upload to Vercel Blob
        const blob = await put(fileName, photo, {
          access: 'public',
          contentType: photo.type,
        });

        updateData.profilePictureUrl = blob.url;
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return { message: 'Failed to upload photo. Please try again.' };
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData as Prisma.UserUpdateInput,
      });

      revalidatePath('/dashboard/settings');

      // Return updated user data for Redux sync
      return {
        message: 'Profile updated successfully.',
        success: true,
        updatedUser: updateData as {
          name?: string;
          email?: string;
          baseLanguageCode?: LanguageCode;
          targetLanguageCode?: LanguageCode;
          profilePictureUrl?: string;
        },
      };
    }

    return { message: 'No changes to update.' };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { message: 'An unexpected error occurred.' };
  }
}

/**
 * Update user learning settings (daily goal, notifications, session preferences)
 */
export async function updateUserLearningSettings(
  prevState: UserSettingsState,
  formData: FormData,
): Promise<UserSettingsState> {
  try {
    const user = await getCurrentUser();

    // Parse form data
    const formDataObj = {
      dailyGoal: formData.get('dailyGoal')
        ? parseInt(formData.get('dailyGoal') as string)
        : undefined,
      notificationsEnabled: formData.get('notificationsEnabled') === 'true',
      soundEnabled: formData.get('soundEnabled') === 'true',
      autoPlayAudio: formData.get('autoPlayAudio') === 'true',
      darkMode: formData.get('darkMode') === 'true',
      sessionDuration: formData.get('sessionDuration')
        ? parseInt(formData.get('sessionDuration') as string)
        : undefined,
      reviewInterval: formData.get('reviewInterval')
        ? parseInt(formData.get('reviewInterval') as string)
        : undefined,
      difficultyPreference: formData.get('difficultyPreference')
        ? parseInt(formData.get('difficultyPreference') as string)
        : undefined,
      learningReminders: formData.get('learningReminders')
        ? JSON.parse(formData.get('learningReminders') as string)
        : undefined,
    };

    // Filter undefined values and create clean data object
    const cleanData = Object.fromEntries(
      Object.entries(formDataObj).filter(([, value]) => value !== undefined),
    );

    // Validate the data
    const validatedFields = userSettingsSchema.safeParse(cleanData);

    if (!validatedFields.success) {
      return { errors: validatedFields.error.flatten().fieldErrors };
    }

    // Create update data without undefined values
    const updateData: Prisma.UserSettingsUpdateInput = {};
    const createData: Prisma.UserSettingsUncheckedCreateInput = {
      userId: user.id,
    };

    // Only add defined fields to prevent undefined from overwriting existing data
    if (validatedFields.data.dailyGoal !== undefined) {
      updateData.dailyGoal = validatedFields.data.dailyGoal;
      createData.dailyGoal = validatedFields.data.dailyGoal;
    }
    if (validatedFields.data.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled =
        validatedFields.data.notificationsEnabled;
      createData.notificationsEnabled =
        validatedFields.data.notificationsEnabled;
    }
    if (validatedFields.data.soundEnabled !== undefined) {
      updateData.soundEnabled = validatedFields.data.soundEnabled;
      createData.soundEnabled = validatedFields.data.soundEnabled;
    }
    if (validatedFields.data.autoPlayAudio !== undefined) {
      updateData.autoPlayAudio = validatedFields.data.autoPlayAudio;
      createData.autoPlayAudio = validatedFields.data.autoPlayAudio;
    }
    if (validatedFields.data.darkMode !== undefined) {
      updateData.darkMode = validatedFields.data.darkMode;
      createData.darkMode = validatedFields.data.darkMode;
    }
    if (validatedFields.data.sessionDuration !== undefined) {
      updateData.sessionDuration = validatedFields.data.sessionDuration;
      createData.sessionDuration = validatedFields.data.sessionDuration;
    }
    if (validatedFields.data.reviewInterval !== undefined) {
      updateData.reviewInterval = validatedFields.data.reviewInterval;
      createData.reviewInterval = validatedFields.data.reviewInterval;
    }
    if (validatedFields.data.difficultyPreference !== undefined) {
      updateData.difficultyPreference =
        validatedFields.data.difficultyPreference;
      createData.difficultyPreference =
        validatedFields.data.difficultyPreference;
    }
    if (validatedFields.data.learningReminders !== undefined) {
      updateData.learningReminders = validatedFields.data
        .learningReminders as Prisma.InputJsonValue;
      createData.learningReminders = validatedFields.data
        .learningReminders as Prisma.InputJsonValue;
    }

    // Check if user settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (existingSettings) {
      // Update existing settings
      await prisma.userSettings.update({
        where: { userId: user.id },
        data: updateData,
      });
    } else {
      // Create new settings
      await prisma.userSettings.create({
        data: createData,
      });
    }

    revalidatePath('/dashboard/settings');
    return {
      message: 'Learning settings updated successfully.',
      success: true,
    };
  } catch (error) {
    console.error('Error updating learning settings:', error);
    return { message: 'An unexpected error occurred.' };
  }
}

/**
 * Update application settings (theme, language, notifications)
 */
export async function updateAppSettings(
  prevState: UserSettingsState,
  formData: FormData,
): Promise<UserSettingsState> {
  try {
    const user = await getCurrentUser();

    // Parse form data
    const formDataObj = {
      theme: formData.get('theme') as string,
      language: formData.get('language') as string,
      notifications: formData.get('notifications') === 'true',
      autoSave: formData.get('autoSave') === 'true',
    };

    // Filter undefined values
    const cleanData = Object.fromEntries(
      Object.entries(formDataObj).filter(
        ([, value]) => value !== null && value !== '',
      ),
    );

    // Validate the data
    const validatedFields = appSettingsSchema.safeParse(cleanData);

    if (!validatedFields.success) {
      return { errors: validatedFields.error.flatten().fieldErrors };
    }

    // Get current settings from User.settings JSON field
    const currentSettings = (user.settings as Record<string, unknown>) || {};

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...validatedFields.data,
    };

    // Update user settings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: updatedSettings,
      },
    });

    revalidatePath('/dashboard/settings');
    return { message: 'App settings updated successfully.', success: true };
  } catch (error) {
    console.error('Error updating app settings:', error);
    return { message: 'An unexpected error occurred.' };
  }
}

/**
 * Get user's complete settings
 */
export async function getUserSettings() {
  try {
    const user = await getCurrentUser();

    const userWithSettings = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userSettings: true,
      },
    });

    if (!userWithSettings) {
      throw new Error('User not found');
    }

    return {
      user: userWithSettings,
      settings: userWithSettings.userSettings,
      appSettings: userWithSettings.settings as Record<string, unknown>,
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
}

/**
 * Delete user account (soft delete)
 */
export async function deleteUserAccount(
  prevState: UserSettingsState,
  formData: FormData,
): Promise<UserSettingsState> {
  try {
    const user = await getCurrentUser();
    const confirmationText = formData.get('confirmationText') as string;

    if (confirmationText !== 'DELETE') {
      return { message: 'Please type "DELETE" to confirm account deletion.' };
    }

    // Soft delete the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        status: 'deleted',
      },
    });

    // Redirect to home page
    redirect('/');
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { message: 'An unexpected error occurred.' };
  }
}
