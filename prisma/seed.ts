import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import {
    users,
    languages,
    words,
    oneWordDefinitions,
    mainDictionary,
    dictionaryExamples,
    userDictionary,
    lists,
    listWords,
    userLists,
    userListWords,
    wordCompositions,
    wordSynonyms,
    categories,
    user_Id_1,
} from '../src/lib/placeholder-data';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // Store created user IDs
    const createdUserIds: { [key: string]: string } = {};

    // Seed languages
    console.log('Seeding languages...');
    for (const language of languages) {
        await prisma.language.upsert({
            where: { code: language.code },
            update: {
                name: language.name,
                id: language.id,
                createdAt: language.createdAt,
            },
            create: {
                id: language.id,
                code: language.code,
                name: language.name,
                createdAt: language.createdAt,
            },
        });
    }

    // Seed users
    console.log('Seeding users...');
    for (const user of users) {
        try {
            const hashedPassword = await bcryptjs.hash(user.password, 10);
            console.log(`Creating user with email: ${user.email}`);
            const createdUser = await prisma.user.upsert({
                where: { email: user.email },
                update: {
                    name: user.name,
                    password: hashedPassword,
                    baseLanguageId: user.baseLanguageId,
                    targetLanguageId: user.targetLanguageId,
                    role: user.role,
                    isVerified: user.isVerified,
                    verificationToken: user.verificationToken,
                    profilePictureUrl: user.profilePictureUrl,
                    status: user.status,
                    settings: user.settings as Record<string, string>,
                    studyPreferences: user.studyPreferences as Record<
                        string,
                        string
                    >,
                },
                create: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    baseLanguageId: user.baseLanguageId,
                    targetLanguageId: user.targetLanguageId,
                    role: user.role,
                    isVerified: user.isVerified,
                    verificationToken: user.verificationToken,
                    profilePictureUrl: user.profilePictureUrl,
                    status: user.status,
                    settings: user.settings as Record<string, string>,
                    studyPreferences: user.studyPreferences as Record<
                        string,
                        string
                    >,
                },
            });
            console.log(`Successfully created user: ${createdUser.id}`);
            // Store the created user ID
            if (user.email === 'anton.doe@example.com') {
                createdUserIds['user_Id_1'] = createdUser.id;
            } else if (user.email === 'max.mustermann@example.com') {
                createdUserIds['user_Id_2'] = createdUser.id;
            }
        } catch (error) {
            console.error(
                `Failed to create user with email ${user.email}:`,
                error,
            );
            throw error;
        }
    }

    // Seed words
    console.log('Seeding words...');
    for (const word of words) {
        await prisma.word.upsert({
            where: {
                word_languageId: {
                    word: word.word,
                    languageId: word.languageId,
                },
            },
            update: {
                id: word.id,
                phonetic: word.phonetic,
                audio: word.audio,
                createdAt: word.createdAt,
                updatedAt: word.updatedAt,
            },
            create: {
                id: word.id,
                word: word.word,
                phonetic: word.phonetic,
                audio: word.audio,
                languageId: word.languageId,
                createdAt: word.createdAt,
                updatedAt: word.updatedAt,
            },
        });
    }

    // Seed one word definitions
    console.log('Seeding one word definitions...');
    for (const def of oneWordDefinitions) {
        await prisma.oneWordDefinition.upsert({
            where: { id: def.id },
            update: {},
            create: {
                id: def.id,
                definition: def.definition,
                languageId: def.languageId,
                createdAt: def.createdAt,
            },
        });
    }

    // Seed main dictionary
    console.log('Seeding main dictionary...');
    for (const dict of mainDictionary) {
        await prisma.mainDictionary.upsert({
            where: { id: dict.id },
            update: {},
            create: {
                id: dict.id,
                wordId: dict.wordId,
                oneWordDefinitionId: dict.oneWordDefinitionId,
                baseLanguageId: dict.baseLanguageId,
                targetLanguageId: dict.targetLanguageId,
                descriptionBase: dict.descriptionBase,
                descriptionTarget: dict.descriptionTarget,
                partOfSpeech: dict.partOfSpeech,
                difficultyLevel: dict.difficultyLevel,
                etymology: dict.etymology,
                source: dict.source,
                createdAt: dict.createdAt,
                updatedAt: dict.updatedAt,
                deletedAt: dict.deletedAt,
            },
        });
    }

    // Seed dictionary examples
    console.log('Seeding dictionary examples...');
    for (const example of dictionaryExamples) {
        await prisma.dictionaryExample.upsert({
            where: { id: example.id },
            update: {},
            create: {
                id: example.id,
                dictionaryId: example.dictionaryId,
                example: example.example,
                audio: example.audio,
                languageId: example.languageId,
                createdAt: example.createdAt,
                updatedAt: example.updatedAt,
                deletedAt: example.deletedAt,
            },
        });
    }

    // Seed word compositions
    console.log('Seeding word compositions...');
    for (const composition of wordCompositions) {
        await prisma.wordComposition.upsert({
            where: {
                dictionaryId_wordId: {
                    dictionaryId: composition.dictionaryId,
                    wordId: composition.wordId,
                },
            },
            update: {},
            create: {
                dictionaryId: composition.dictionaryId,
                wordId: composition.wordId,
                orderIndex: composition.orderIndex,
                createdAt: composition.createdAt,
            },
        });
    }

    // Seed word synonyms
    console.log('Seeding word synonyms...');
    for (const synonym of wordSynonyms) {
        await prisma.wordSynonym.upsert({
            where: {
                dictionaryId_wordId: {
                    dictionaryId: synonym.dictionaryId,
                    wordId: synonym.wordId,
                },
            },
            update: {},
            create: {
                dictionaryId: synonym.dictionaryId,
                wordId: synonym.wordId,
                createdAt: synonym.createdAt,
            },
        });
    }

    // Seed user dictionary
    console.log('Seeding user dictionary...');
    for (const ud of userDictionary) {
        const mappedUserId =
            createdUserIds[ud.userId === user_Id_1 ? 'user_Id_1' : 'user_Id_2'];
        if (!mappedUserId) {
            console.error(`Could not find mapped ID for user ${ud.userId}`);
            continue;
        }
        await prisma.userDictionary.upsert({
            where: { id: ud.id },
            update: {},
            create: {
                id: ud.id,
                userId: mappedUserId,
                mainDictionaryId: ud.mainDictionaryId,
                baseLanguageId: ud.baseLanguageId,
                targetLanguageId: ud.targetLanguageId,
                isLearned: ud.isLearned,
                isNeedsReview: ud.isNeedsReview,
                isDifficultToLearn: ud.isDifficultToLearn,
                isModified: ud.isModified,
                reviewCount: ud.reviewCount,
                timeWordWasStartedToLearn: ud.timeWordWasStartedToLearn,
                progress: ud.progress,
                amountOfMistakes: ud.amountOfMistakes,
                createdAt: ud.createdAt,
                updatedAt: ud.updatedAt,
                jsonbData: ud.jsonbData as Record<string, string>,
                deletedAt: ud.deletedAt,
                customOneWordDefinition: ud.customOneWordDefinition,
                customDifficultyLevel: ud.customDifficultyLevel,
                customEtymology: ud.customEtymology,
                learningStatus: ud.learningStatus,
                lastReviewedAt: ud.lastReviewedAt,
                timeWordWasLearned: ud.timeWordWasLearned,
                customDefinitionBase: ud.customDefinitionBase,
                customDefinitionTarget: ud.customDefinitionTarget,
                nextReviewDue: ud.nextReviewDue,
                correctStreak: ud.correctStreak,
            },
        });
    }

    // Seed categories
    console.log('Seeding categories...');
    for (const category of categories) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: {},
            create: {
                id: category.id,
                name: category.name,
                description: category.description,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    }

    // Seed lists
    console.log('Seeding lists...');
    for (const list of lists) {
        await prisma.list.upsert({
            where: { id: list.id },
            update: {},
            create: {
                id: list.id,
                name: list.name,
                description: list.description,
                categoryId: list.categoryId,
                baseLanguageId: list.baseLanguageId,
                targetLanguageId: list.targetLanguageId,
                isPublic: list.isPublic,
                createdAt: list.createdAt,
                updatedAt: list.updatedAt,
                tags: list.tags,
                coverImageUrl: list.coverImageUrl,
                difficultyLevel: list.difficultyLevel,
                wordCount: list.wordCount,
                lastModified: list.lastModified,
                jsonbData: list.jsonbData as Record<string, string>,
                deletedAt: list.deletedAt,
            },
        });
    }

    // List Words
    console.log('Seeding list words...');
    for (const lw of listWords) {
        await prisma.listWord.upsert({
            where: {
                listId_dictionaryId: {
                    listId: lw.listId,
                    dictionaryId: lw.dictionaryId,
                },
            },
            update: {},
            create: {
                listId: lw.listId,
                dictionaryId: lw.dictionaryId,
                orderIndex: lw.orderIndex,
            },
        });
    }

    // User Lists
    console.log('Seeding user lists...');
    for (const ul of userLists) {
        const mappedUserId =
            createdUserIds[ul.userId === user_Id_1 ? 'user_Id_1' : 'user_Id_2'];
        if (!mappedUserId) {
            console.error(`Could not find mapped ID for user ${ul.userId}`);
            continue;
        }
        await prisma.userList.upsert({
            where: { id: ul.id },
            update: {},
            create: {
                id: ul.id,
                userId: mappedUserId,
                listId: ul.listId,
                baseLanguageId: ul.baseLanguageId,
                targetLanguageId: ul.targetLanguageId,
                isModified: ul.isModified,
                customNameOfList: ul.customNameOfList,
                customDescriptionOfList: ul.customDescriptionOfList,
                customCoverImageUrl: ul.customCoverImageUrl,
                createdAt: ul.createdAt,
                updatedAt: ul.updatedAt,
                customDifficulty: ul.customDifficulty,
                progress: ul.progress,
                jsonbData: ul.jsonbData as Record<string, string>,
                deletedAt: ul.deletedAt,
            },
        });
    }

    // User List Words
    console.log('Seeding user list words...');
    for (const ulw of userListWords) {
        await prisma.userListWord.upsert({
            where: {
                userListId_userDictionaryId: {
                    userListId: ulw.userListId,
                    userDictionaryId: ulw.userDictionaryId,
                },
            },
            update: {},
            create: {
                userListId: ulw.userListId,
                userDictionaryId: ulw.userDictionaryId,
                orderIndex: ulw.orderIndex,
            },
        });
    }

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
