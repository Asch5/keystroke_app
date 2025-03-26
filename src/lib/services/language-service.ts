import { prisma } from '@/lib/prisma';
import { Language, Prisma } from '@prisma/client';

/**
 * Service for language-related operations using Prisma
 */
//list of services for language-related operations using Prisma:
//1. Get all languages
//2. Get a language by code
//3. Get a language by ID
//4. Create a new language
//5. Update a language
//6. Delete a language
//7. Get words for a language

export class LanguageService {
    /**
     * Get all languages
     */
    static async getAllLanguages(): Promise<Language[]> {
        return prisma.language.findMany({
            orderBy: {
                name: 'asc',
            },
        });
    }

    /**
     * Get a language by code
     */
    static async getLanguageByCode(code: string): Promise<Language | null> {
        return prisma.language.findUnique({
            where: { code },
        });
    }

    /**
     * Get a language by ID
     */
    static async getLanguageById(id: string): Promise<Language | null> {
        return prisma.language.findUnique({
            where: { id },
        });
    }

    /**
     * Create a new language
     */
    static async createLanguage(
        data: Prisma.LanguageCreateInput,
    ): Promise<Language> {
        return prisma.language.create({
            data,
        });
    }

    /**
     * Update a language
     */
    static async updateLanguage(
        id: string,
        data: Prisma.LanguageUpdateInput,
    ): Promise<Language> {
        return prisma.language.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete a language
     */
    static async deleteLanguage(id: string): Promise<Language> {
        return prisma.language.delete({
            where: { id },
        });
    }

    /**
     * Get words for a language
     */
    static async getLanguageWords(languageId: string, page = 1, pageSize = 50) {
        return prisma.word.findMany({
            where: { languageId },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                word: 'asc',
            },
        });
    }

    /**
     * Get dictionary entries for a language pair
     */
    static async getDictionaryEntries(
        baseLanguageId: string,
        targetLanguageId: string,
        page = 1,
        pageSize = 20,
    ) {
        return prisma.mainDictionary.findMany({
            where: {
                baseLanguageId,
                targetLanguageId,
            },
            include: {
                word: true,
                oneWordDefinition: true,
                examples: true,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Search for words in a language
     */
    static async searchWords(
        languageId: string,
        searchTerm: string,
        limit = 10,
    ) {
        return prisma.word.findMany({
            where: {
                languageId,
                word: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            take: limit,
            orderBy: {
                word: 'asc',
            },
        });
    }
}
