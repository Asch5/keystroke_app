'use server';

import { prisma } from '@/core/lib/prisma';
import {
  WordUpdateData,
  UpdateWordResult,
  DefinitionUpdateData,
  ExampleUpdateData,
  AudioUpdateData,
} from '@/core/types/dictionary';

export async function updateWord(
  wordId: string,
  data: WordUpdateData,
): Promise<UpdateWordResult> {
  try {
    await prisma.word.update({
      where: { id: parseInt(wordId) },
      data: {
        word: data.word,
        phoneticGeneral: data.phonetic,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating word:', error);
    throw new Error('Failed to update word');
  }
}

export async function updateDefinition(
  definitionId: string,
  data: DefinitionUpdateData,
) {
  try {
    await prisma.definition.update({
      where: { id: parseInt(definitionId) },
      data: {
        definition: data.definition,
        subjectStatusLabels: data.subjectStatusLabels,
        generalLabels: data.generalLabels,
        grammaticalNote: data.grammaticalNote,
        usageNote: data.usageNote,
        isInShortDef: data.isInShortDef,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating definition:', error);
    throw new Error('Failed to update definition');
  }
}

export async function updateExample(
  exampleId: string,
  data: ExampleUpdateData,
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

    const updated = await prisma.definitionExample.update({
      where: { id },
      data: {
        example: data.example,
        grammaticalNote: data.grammaticalNote,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating example:', error);
    throw new Error(
      `Failed to update example: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function updateAudio(audioId: string, data: AudioUpdateData) {
  try {
    const id = parseInt(audioId);
    if (isNaN(id)) {
      throw new Error('Invalid audio ID');
    }

    const audio = await prisma.audio.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    const updated = await prisma.audio.update({
      where: { id },
      data: {
        url: data.url,
        source: data.source,
        languageCode: data.languageCode,
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating audio:', error);
    throw new Error(
      `Failed to update audio: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
