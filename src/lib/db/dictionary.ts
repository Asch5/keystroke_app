'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@prisma/client';

// Get all words from the user dictionary
export async function getAllUserWords(userId: string): Promise<Word[]> {
    try {
        const allUserWords = await prisma.userDictionary.findMany({
            where: {
                userId: userId,
            },
            include: {
                mainDictionary: {
                    include: {
                        word: true,
                    },
                },
            },
        });

        return allUserWords
            .map((entry) => entry.mainDictionary?.word)
            .filter((word): word is Word => word !== undefined);
    } catch (error) {
        console.error('Error fetching all user words:', error);
        throw error;
    }
}

// Get all words added by the user (not from lists)
export async function getWordsAddedByUser(userId: string): Promise<Word[]> {
    try {
        const wordsAddedByUser = await prisma.userDictionary.findMany({
            where: {
                userId: userId,
                userListWords: {
                    none: {}, // No associated list words means it was added directly by user
                },
            },
            include: {
                mainDictionary: {
                    include: {
                        word: true,
                    },
                },
            },
        });

        return wordsAddedByUser
            .map((entry) => entry.mainDictionary?.word)
            .filter((word): word is Word => word !== undefined);
    } catch (error) {
        console.error('Error fetching words added by user:', error);
        throw error;
    }
}

// Get all words added from lists
export async function getWordsAddedFromLists(userId: string): Promise<Word[]> {
    try {
        const wordsAddedFromLists = await prisma.userDictionary.findMany({
            where: {
                userId: userId,
                userListWords: {
                    some: {}, // Has associated list words means it was added from a list
                },
            },
            include: {
                mainDictionary: {
                    include: {
                        word: true,
                    },
                },
            },
        });

        return wordsAddedFromLists
            .map((entry) => entry.mainDictionary?.word)
            .filter((word): word is Word => word !== undefined);
    } catch (error) {
        console.error('Error fetching words added from lists:', error);
        throw error;
    }
}

// Get all words that the user started to learn (progress > 0)
export async function getWordsInProgress(userId: string): Promise<Word[]> {
    try {
        const wordsInProgress = await prisma.userDictionary.findMany({
            where: {
                userId: userId,
                progress: {
                    gt: 0,
                    lt: 100, // Not fully learned yet
                },
            },
            include: {
                mainDictionary: {
                    include: {
                        word: true,
                    },
                },
            },
        });

        return wordsInProgress
            .map((entry) => entry.mainDictionary?.word)
            .filter((word): word is Word => word !== undefined);
    } catch (error) {
        console.error('Error fetching words in progress:', error);
        throw error;
    }
}
