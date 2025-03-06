import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SourceType } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            word,
            definition,
            baseLanguageId,
            targetLanguageId,
            partOfSpeech,
            difficultyLevel,
            examples = [],
            userId,
        } = body;

        // Validate required fields
        if (
            !word ||
            !definition ||
            !baseLanguageId ||
            !targetLanguageId ||
            !partOfSpeech ||
            !difficultyLevel
        ) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Use a transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create or find the word
            const wordRecord = await tx.word.upsert({
                where: {
                    word_languageId: {
                        word: word,
                        languageId: baseLanguageId,
                    },
                },
                update: {},
                create: {
                    word: word,
                    languageId: baseLanguageId,
                },
            });

            // 2. Create the one-word definition
            const oneWordDef = await tx.oneWordDefinition.create({
                data: {
                    definition: definition,
                    languageId: targetLanguageId,
                },
            });

            // 3. Create the main dictionary entry
            const dictionaryEntry = await tx.mainDictionary.create({
                data: {
                    wordId: wordRecord.id,
                    oneWordDefinitionId: oneWordDef.id,
                    baseLanguageId,
                    targetLanguageId,
                    partOfSpeech,
                    difficultyLevel,
                    source: SourceType.user,
                },
            });

            // 4. Add examples if provided
            const createdExamples = [];
            if (examples.length > 0) {
                for (const example of examples) {
                    const createdExample = await tx.dictionaryExample.create({
                        data: {
                            dictionaryId: dictionaryEntry.id,
                            example,
                            languageId: baseLanguageId,
                        },
                    });
                    createdExamples.push(createdExample);
                }
            }

            // 5. If a user ID is provided, add to user dictionary
            let userDictionaryEntry = null;
            if (userId) {
                userDictionaryEntry = await tx.userDictionary.create({
                    data: {
                        userId,
                        mainDictionaryId: dictionaryEntry.id,
                        baseLanguageId,
                        targetLanguageId,
                        timeWordWasStartedToLearn: new Date(),
                    },
                });
            }

            return {
                word: wordRecord,
                definition: oneWordDef,
                dictionaryEntry,
                examples: createdExamples,
                userDictionaryEntry,
            };
        });

        return NextResponse.json(
            { success: true, message: 'Word added successfully', data: result },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding word to dictionary:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to add word',
                error: String(error),
            },
            { status: 500 }
        );
    }
}
