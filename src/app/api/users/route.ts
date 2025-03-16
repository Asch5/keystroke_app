import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handlePrismaError } from '@/lib/prisma-error-handler';

/**
 * GET /api/users
 * Retrieves all users with proper error handling
 */
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                baseLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                targetLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        const errorResponse = handlePrismaError(error);
        return NextResponse.json(errorResponse, {
            status: errorResponse.status,
        });
    }
}

/**
 * POST /api/users
 * Creates a new user with proper error handling
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, baseLanguageId, targetLanguageId } =
            body;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password, // Note: In a real application, ensure password is hashed
                baseLanguageId,
                targetLanguageId,
                role: 'USER',
                status: 'ACTIVE',
                settings: {},
                studyPreferences: {},
            },
            select: {
                id: true,
                name: true,
                email: true,
                baseLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                targetLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        const errorResponse = handlePrismaError(error);
        return NextResponse.json(errorResponse, {
            status: errorResponse.status,
        });
    }
}

/**
 * PATCH /api/users
 * Updates a user with proper error handling
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                baseLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                targetLanguage: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        const errorResponse = handlePrismaError(error);
        return NextResponse.json(errorResponse, {
            status: errorResponse.status,
        });
    }
}

/**
 * DELETE /api/users
 * Soft deletes a user with proper error handling
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                {
                    message: 'User ID is required',
                    code: 'VALIDATION_ERROR',
                    status: 400,
                },
                { status: 400 },
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        const errorResponse = handlePrismaError(error);
        return NextResponse.json(errorResponse, {
            status: errorResponse.status,
        });
    }
}
