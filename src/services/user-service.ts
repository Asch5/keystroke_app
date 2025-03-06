import { prisma } from '@/lib/prisma';
import { Prisma, User } from '@prisma/client';
import { UserWithLanguages } from '@/types/prisma-types';

/**
 * Service for user-related operations using Prisma
 */
export class UserService {
    /**
     * Get a user by ID with their base and target languages
     */
    static async getUserById(id: string): Promise<UserWithLanguages | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                baseLanguage: true,
                targetLanguage: true,
            },
        });
    }

    /**
     * Get all users with pagination
     */
    static async getUsers(page = 1, pageSize = 10): Promise<User[]> {
        return prisma.user.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Create a new user
     */
    static async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return prisma.user.create({
            data,
        });
    }

    /**
     * Update a user
     */
    static async updateUser(
        id: string,
        data: Prisma.UserUpdateInput
    ): Promise<User> {
        return prisma.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete a user
     */
    static async deleteUser(id: string): Promise<User> {
        return prisma.user.delete({
            where: { id },
        });
    }

    /**
     * Get a user's dictionary entries
     */
    static async getUserDictionary(userId: string, page = 1, pageSize = 20) {
        return prisma.userDictionary.findMany({
            where: { userId },
            include: {
                mainDictionary: {
                    include: {
                        word: true,
                        oneWordDefinition: true,
                    },
                },
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Get a user's lists
     */
    static async getUserLists(userId: string) {
        return prisma.userList.findMany({
            where: { userId },
            include: {
                list: true,
                baseLanguage: true,
                targetLanguage: true,
            },
        });
    }
}
