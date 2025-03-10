'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createUser, getUserByEmail } from '../db/user';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { UserBasicData } from '@/types/user';

const formSchemaLogin = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' }),
});

export type StateAuth = {
    errors?: {
        email?: string[];
        password?: string[];
    };
    message?: string | null;
    user?: UserBasicData;
};

export async function authenticate(
    prevState: StateAuth,
    formData: FormData
): Promise<StateAuth> {
    try {
        const validatedFields = formSchemaLogin.safeParse({
            email: formData.get('email'),
            password: formData.get('password'),
        });

        if (!validatedFields.success) {
            return { errors: validatedFields.error.flatten().fieldErrors };
        }

        const { email, password } = validatedFields.data;

        try {
            await signIn('credentials', {
                email,
                password,
                redirect: false,
            });
        } catch (error) {
            if (error instanceof AuthError) {
                return { message: 'Invalid credentials.' };
            }
            throw error;
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { message: 'Invalid credentials.' };
                default:
                    return { message: 'Something went wrong.' };
            }
        }
        throw error;
    }

    // Check if the user needs to complete their profile
    const user = await getUserByEmail(formData.get('email') as string);
    const userBasicData: UserBasicData = {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        status: user!.status,
        baseLanguageId: user!.baseLanguageId,
        targetLanguageId: user!.targetLanguageId,
        profilePictureUrl: user!.profilePictureUrl,
    };

    return { user: userBasicData };
}

const formSchemaSignup = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' }),
    repeatPassword: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' }),
    baseLanguageId: z.string(),
    targetLanguageId: z.string(),
});

export type StateSignup = {
    errors?: {
        email?: string[];
        password?: string[];
        repeatPassword?: string[];
        baseLanguageId?: string[];
        targetLanguageId?: string[];
    };
    message?: string | null;
};

export async function signUp(
    prevState: StateSignup,
    formData: FormData
): Promise<StateSignup> {
    const validatedFields = formSchemaSignup.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        repeatPassword: formData.get('repeatPassword'),
        baseLanguageId: formData.get('baseLanguageId'),
        targetLanguageId: formData.get('targetLanguageId'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    if (validatedFields.data.password !== validatedFields.data.repeatPassword) {
        return { message: 'Passwords do not match' };
    }

    const { email, password, baseLanguageId, targetLanguageId } =
        validatedFields.data;

    try {
        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return { message: 'User with this email already exists' };
        }

        // Hash the password
        const hashedPassword = await hash(password, 10);

        // Create a new user with required fields
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: email.split('@')[0], // Default name from email
                role: 'user',
                status: 'active',
                isVerified: false,
                settings: { theme: 'light' },
                studyPreferences: {},
                baseLanguageId,
                targetLanguageId,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            return { message: error.message };
        }
        throw error;
    }

    redirect('/login?registered=true');
}
