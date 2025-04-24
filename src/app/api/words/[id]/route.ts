import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid word ID' }, { status: 400 });
    }

    const word = await prisma.word.findUnique({
      where: { id: parseInt(id) },
      select: { word: true },
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    return NextResponse.json({ word: word.word });
  } catch (error) {
    console.error('Error fetching word:', error);
    return NextResponse.json(
      { error: 'Failed to fetch word' },
      { status: 500 },
    );
  }
}
