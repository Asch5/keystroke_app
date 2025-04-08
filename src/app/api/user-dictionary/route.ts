import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * API route handler for fetching user dictionary items
 *
 * @param request - The incoming request object
 * @returns JSON response with user dictionary items or error
 */
async function handler(request: Request) {
  console.log('=== API ROUTE HANDLER CALLED ===', new Date().toISOString());
  try {
    console.log('Request URL:', request.url);
    console.log(
      'Request headers:',
      Object.fromEntries([...request.headers.entries()]),
    );

    // Get the authenticated session
    const session = await auth();
    // Log session for debugging
    console.log('Session in API route:', JSON.stringify(session?.user || null));

    // Check if user is authenticated
    if (!session?.user) {
      console.log('Authentication required - no session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Parse the URL search parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Requested user ID:', userId);
    console.log('Session user ID:', session.user.id);

    // Verify user is accessing their own dictionary (security check)
    if (userId !== session.user.id) {
      console.log('Unauthorized access - user ID mismatch');
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 },
      );
    }

    console.log('Fetching dictionary for user:', userId);

    // Fetch user dictionary items from database with relations
    const userDictionary = await prisma.userDictionary.findMany({
      where: {
        userId: userId as string,
        deletedAt: null, // Only include non-deleted items
      },
      include: {
        mainDictionary: {
          include: {
            word: true,
            oneWordDefinition: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${userDictionary.length} dictionary entries`);

    console.log('userDictionary', userDictionary);

    // Transform database models to match frontend interface
    const transformedData = userDictionary.map((item) => ({
      id: item.id,
      word: item.mainDictionary?.word.word || '',
      translation: item.mainDictionary?.descriptionBase || '',
      category: item.mainDictionary?.partOfSpeech || '',
      difficulty: item.mainDictionary?.difficultyLevel || '',
      progress: item.progress,
      isLearned: item.isLearned,
      isNeedsReview: item.isNeedsReview,
      isDifficultToLearn: item.isDifficultToLearn,
      reviewCount: item.reviewCount,
      lastReviewedAt: item.lastReviewedAt?.toISOString() || null,
      timeWordWasStartedToLearn:
        item.timeWordWasStartedToLearn?.toISOString() || null,
    }));

    // Return successful response with transformed data
    return NextResponse.json(transformedData);
  } catch (error) {
    // Log error and return error response
    console.error('Error in user dictionary API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user dictionary',
        details: String(error),
      },
      { status: 500 },
    );
  }
}

// Export named handlers for the Route Handler in Next.js 15
export const GET = handler;
export const POST = handler;
