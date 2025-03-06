import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test connection by getting the count of languages
        const languageCount = await prisma.language.count();

        return NextResponse.json({
            success: true,
            message: 'Prisma connection successful',
            data: { languageCount },
        });
    } catch (error) {
        console.error('Prisma connection error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to connect to database',
                error: String(error),
            },
            { status: 500 }
        );
    }
}
