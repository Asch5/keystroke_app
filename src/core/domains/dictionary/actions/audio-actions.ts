'use server';

import { prisma } from '@/core/lib/prisma';
import { AudioUpdateData } from '@/core/types/dictionary';

//create audio for example
export async function createAudioForExample(
  exampleId: string,
  data: AudioUpdateData,
) {
  try {
    const id = parseInt(exampleId);
    if (isNaN(id)) {
      throw new Error('Invalid example ID');
    }

    const example = await prisma.definitionExample.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!example) {
      throw new Error('Example not found');
    }

    const createdAudio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    return createdAudio;
  } catch (error) {
    console.error('Error creating audio for example:', error);
    throw new Error(
      `Failed to create audio for example: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

//create audio for word
export async function createAudioForWord(
  wordId: string,
  data: AudioUpdateData,
) {
  try {
    const wordDetails = await prisma.wordDetails.findFirst({
      where: { wordId: parseInt(wordId) },
    });

    if (!wordDetails) {
      throw new Error('Word details not found');
    }

    const audio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    await prisma.wordDetailsAudio.create({
      data: {
        wordDetailsId: wordDetails.id,
        audioId: audio.id,
        isPrimary: data.isPrimary ?? false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating audio for word:', error);
    throw new Error('Failed to create audio for word');
  }
}

//create audio for definition
export async function createAudioForDefinition(
  definitionId: string,
  data: AudioUpdateData,
) {
  try {
    const id = parseInt(definitionId);
    if (isNaN(id)) {
      throw new Error('Invalid definition ID');
    }

    const definition = await prisma.definition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!definition) {
      throw new Error('Definition not found');
    }

    const createdAudio = await prisma.audio.create({
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    return createdAudio;
  } catch (error) {
    console.error('Error creating audio for definition:', error);
    throw new Error(
      `Failed to create audio for definition: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
