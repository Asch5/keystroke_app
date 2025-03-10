'use server';

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
}

export async function getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
}

//do not use this function
export async function createUser(user: User) {
    const { email, password } = user;
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    try {
        await prisma.user.create({
            data: {
                email,
                password, // Note: In a real app, you should hash this password
                name: email.split('@')[0], // Default name from email
                role: 'USER',
                status: 'ACTIVE',
                isVerified: false,
                settings: {},
                studyPreferences: {},
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw error;
    }
}

export async function updateUser(user: User) {
    const {
        id,
        createdAt,
        updatedAt,
        deletedAt,
        settings,
        studyPreferences,
        ...userData
    } = user;
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            ...userData,
            settings: settings ?? {},
            studyPreferences: studyPreferences ?? {},
        },
    });
    return updatedUser;
}

export async function getLanguages() {
    const languages = await prisma.language.findMany();
    return languages;
}
