import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

export async function GET() {
    try {
        // Get a test user
        const email = 'test2@example.com';
        const password = '11111111';

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Create test user if it doesn't exist
            const hashedPassword = await hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Test User',
                    role: 'user',
                    status: 'active',
                    isVerified: false,
                    settings: {},
                    studyPreferences: {},
                },
            });

            return NextResponse.json({
                message: 'Test user created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            });
        }

        // Test password verification
        const isPasswordValid = await compare(password, user.password);

        return NextResponse.json({
            message: 'Test user exists',
            passwordValid: isPasswordValid,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Error in test-auth endpoint:', error);
        return NextResponse.json(
            { error: 'Test auth failed', details: String(error) },
            { status: 500 },
        );
    }
}
