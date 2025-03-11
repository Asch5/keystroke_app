import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import {
    users,
    languages,
    audio,
    words,
    oneWordDefinitions,
    mainDictionary,
    dictionaryExamples,
    synonyms,
    dictionarySynonyms,
    userDictionary,
    lists,
    listWords,
    userLists,
    userListWords,
    userDictionaryExamples,
    userDictionarySynonyms,
    userSynonyms,
} from '../src/lib/placeholder-data';

const prisma = new PrismaClient();

// If you need SourceType, define it directly in the seed file:
enum SourceType {
    IMPORT = 'import',
    USER = 'user',
    SYSTEM = 'system',
}

async function main() {
    console.log('🌱 Starting seeding...');

    // Seed languages
    console.log('Seeding languages...');
    for (const language of languages) {
        await prisma.language.upsert({
            where: { id: language.id },
            update: {},
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
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
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
    }

    // Seed audio
    console.log('Seeding audio...');
    for (const a of audio) {
        await prisma.audio.upsert({
            where: { id: a.id },
            update: {},
            create: {
                id: a.id,
                audio: a.audio,
                languageId: a.languageId,
                createdAt: a.createdAt,
            },
        });
    }

    // Seed words
    console.log('Seeding words...');
    for (const word of words) {
        await prisma.word.upsert({
            where: { id: word.id },
            update: {},
            create: {
                id: word.id,
                word: word.word,
                languageId: word.languageId,
                createdAt: word.createdAt,
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
        // Convert source type to match Prisma's enum format
        const sourceType =
            dict.source === SourceType.IMPORT ? SourceType.IMPORT : dict.source;

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
                audioId: dict.audioId,
                frequency: dict.frequency,
                partOfSpeech: dict.partOfSpeech,
                phonetic: dict.phonetic,
                difficultyLevel: dict.difficultyLevel,
                etymology: dict.etymology,
                source: sourceType,
                createdAt: dict.createdAt,
                updatedAt: dict.updatedAt,
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
                languageId: example.languageId,
                createdAt: example.createdAt,
                updatedAt: example.updatedAt,
            },
        });
    }

    // Seed synonyms
    console.log('Seeding synonyms...');
    for (const synonym of synonyms) {
        await prisma.synonym.upsert({
            where: { id: synonym.id },
            update: {},
            create: {
                id: synonym.id,
                synonym: synonym.synonym,
                languageId: synonym.languageId,
                createdAt: synonym.createdAt,
                updatedAt: synonym.updatedAt,
            },
        });
    }

    // Seed dictionary synonyms
    console.log('Seeding dictionary synonyms...');
    for (const ds of dictionarySynonyms) {
        await prisma.dictionarySynonym.upsert({
            where: {
                dictionaryId_synonymId: {
                    dictionaryId: ds.dictionaryId,
                    synonymId: ds.synonymId,
                },
            },
            update: {},
            create: {
                dictionaryId: ds.dictionaryId,
                synonymId: ds.synonymId,
                createdAt: ds.createdAt,
                updatedAt: ds.updatedAt,
            },
        });
    }

    // Seed user dictionary
    console.log('Seeding user dictionary...');
    for (const ud of userDictionary) {
        await prisma.userDictionary.upsert({
            where: { id: ud.id },
            update: {},
            create: {
                id: ud.id,
                userId: ud.userId,
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
                createdAt: ud.createdAt,
                updatedAt: ud.updatedAt,
                jsonbData: ud.jsonbData as Record<string, string>,
            },
        });
    }

    // Continue with other entities...
    // Lists
    console.log('Seeding lists...');
    for (const list of lists) {
        await prisma.list.upsert({
            where: { id: list.id },
            update: {},
            create: {
                id: list.id,
                name: list.name,
                description: list.description,
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
                ownerId: list.ownerId,
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
        await prisma.userList.upsert({
            where: { id: ul.id },
            update: {},
            create: {
                id: ul.id,
                userId: ul.userId,
                listsId: ul.listsId,
                baseLanguageId: ul.baseLanguageId,
                targetLanguageId: ul.targetLanguageId,
                isModified: ul.isModified,
                customNameOfList: ul.customNameOfList,
                customDescriptionOfList: ul.customDescriptionOfList,
                createdAt: ul.createdAt,
                updatedAt: ul.updatedAt,
                customDifficulty: ul.customDifficulty,
                progress: ul.progress,
                jsonbData: ul.jsonbData as Record<string, string>,
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

    // User Dictionary Examples
    console.log('Seeding user dictionary examples...');
    for (const ude of userDictionaryExamples) {
        await prisma.userDictionaryExample.upsert({
            where: { id: ude.id },
            update: {},
            create: {
                id: ude.id,
                userDictionaryId: ude.userDictionaryId,
                example: ude.example,
                languageId: ude.languageId,
                createdAt: ude.createdAt,
                updatedAt: ude.updatedAt,
            },
        });
    }

    // User Synonyms
    console.log('Seeding user synonyms...');
    for (const us of userSynonyms) {
        await prisma.userSynonym.upsert({
            where: { id: us.id },
            update: {},
            create: {
                id: us.id,
                synonym: us.synonym,
                languageId: us.languageId,
                createdAt: us.createdAt,
                updatedAt: us.updatedAt,
            },
        });
    }

    // User Dictionary Synonyms
    console.log('Seeding user dictionary synonyms...');
    for (const uds of userDictionarySynonyms) {
        await prisma.userDictionarySynonym.upsert({
            where: {
                userDictionaryId_userSynonymId: {
                    userDictionaryId: uds.userDictionaryId,
                    userSynonymId: uds.userSynonymId,
                },
            },
            update: {},
            create: {
                userDictionaryId: uds.userDictionaryId,
                userSynonymId: uds.userSynonymId,
                createdAt: uds.createdAt,
                updatedAt: uds.updatedAt,
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
