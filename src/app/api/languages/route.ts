import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all languages
export async function GET() {
    try {
        // Check if languages exist
        const languageCount = await prisma.language.count();

        // If no languages exist, create some test languages
        if (languageCount === 0) {
            await prisma.language.createMany({
                data: [
                    { name: 'English', code: 'en' },
                    { name: 'Spanish', code: 'es' },
                    { name: 'French', code: 'fr' },
                    { name: 'German', code: 'de' },
                    { name: 'Chinese', code: 'zh' },
                    { name: 'Japanese', code: 'ja' },
                    { name: 'Russian', code: 'ru' },
                ],
            });
        }

        const languages = await prisma.language.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch languages' },
            { status: 500 }
        );
    }
}

// POST a new language
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json(
                { error: 'Name and code are required' },
                { status: 400 }
            );
        }

        const language = await prisma.language.create({
            data: {
                name,
                code,
            },
        });

        return NextResponse.json(language);
    } catch (error) {
        console.error('Error creating language:', error);
        return NextResponse.json(
            { error: 'Failed to create language' },
            { status: 500 }
        );
    }
}
