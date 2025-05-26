import { PrismaClient } from '@prisma/client';
// fs import will be needed when file deletion is enabled
// import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Gets IDs of audio records that are orphaned (not referenced by any junction table)
 * Note: user_word_audio table stores URLs directly and doesn't reference the audio table
 */
export async function getOrphanedAudioRecords(): Promise<number[]> {
  const result = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM audio
    WHERE id NOT IN (
      SELECT DISTINCT audio_id FROM word_details_audio
      UNION
      SELECT DISTINCT audio_id FROM definition_audio
      UNION
      SELECT DISTINCT audio_id FROM example_audio
    );
  `;
  return result.map((record) => record.id);
}

/**
 * Deletes orphaned audio records by their IDs
 * @param orphanedIds Array of audio IDs to delete
 * @returns The number of deleted records
 */
export async function deleteOrphanedAudioRecords(
  orphanedIds: number[],
): Promise<number> {
  if (orphanedIds.length === 0) {
    return 0;
  }

  // When you need to delete physical files, uncomment this section
  // const orphanedAudios = await prisma.$queryRaw<Array<{ id: number, url: string }>>`
  //   SELECT id, url FROM audio WHERE id = ANY(${orphanedIds})
  // `;

  // To delete files, uncomment and implement:
  // import fs from 'fs';
  // orphanedAudios.forEach(audio => {
  //   try {
  //     if (fs.existsSync(audio.url)) {
  //       fs.unlinkSync(audio.url);
  //     }
  //   } catch (error) {
  //     console.error(`Failed to delete audio file: ${audio.url}`, error);
  //   }
  // });

  // Delete the database records by ID
  const result = await prisma.audio.deleteMany({
    where: {
      id: {
        in: orphanedIds,
      },
    },
  });

  return result.count;
}

/**
 * Performs a complete cleanup of orphaned audio records
 * @returns The number of deleted records
 */
export async function cleanupAudio(): Promise<number> {
  const orphanedIds = await getOrphanedAudioRecords();
  return await deleteOrphanedAudioRecords(orphanedIds);
}

/**
 * Helper to schedule regular cleanup of orphaned audio records
 * @param intervalMs Interval in milliseconds (default: once per day)
 */
export function scheduleAudioCleanup(intervalMs = 24 * 60 * 60 * 1000) {
  // Initial cleanup
  cleanupAudio();

  // Schedule regular cleanup
  setInterval(cleanupAudio, intervalMs);
}
