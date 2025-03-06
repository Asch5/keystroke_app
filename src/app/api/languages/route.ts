import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all languages
export async function GET() {
    try {
        const languages = await prisma.language.findMany();
        return NextResponse.json({ success: true, data: languages });
    } catch (error) {
        console.error('Error fetching languages:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch languages',
                error: String(error),
            },
            { status: 500 }
        );
    }
}

// POST a new language
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, name } = body;

        // Validate input
        if (!code || !name) {
            return NextResponse.json(
                { success: false, message: 'Code and name are required' },
                { status: 400 }
            );
        }

        // Check if language with this code already exists
        const existingLanguage = await prisma.language.findUnique({
            where: { code },
        });

        if (existingLanguage) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Language with code ${code} already exists`,
                },
                { status: 409 }
            );
        }

        // Create new language
        const newLanguage = await prisma.language.create({
            data: {
                code,
                name,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Language created successfully',
                data: newLanguage,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating language:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create language',
                error: String(error),
            },
            { status: 500 }
        );
    }
}
