import { PrismaClient } from '@prisma/client';
// fs import will be needed when file deletion is enabled
// import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Marks audio records as orphaned if they're not referenced by any junction table
 */
export async function markOrphanedAudioRecords() {
  // Find all audio records that are not referenced in any junction table
  await prisma.$executeRaw`
    UPDATE audio
    SET is_orphaned = true
    WHERE id NOT IN (
      SELECT DISTINCT audio_id FROM word_audio
      UNION
      SELECT DISTINCT audio_id FROM definition_example_audio
      UNION
      SELECT DISTINCT audio_id FROM phrase_example_audio
      UNION
      SELECT DISTINCT audio_id FROM phrase_audio
    )
    AND is_orphaned = false;
  `;
}

/**
 * Deletes all audio records that are marked as orphaned
 * @returns The number of deleted records
 */
export async function deleteOrphanedAudioRecords(): Promise<number> {
  // When you need to delete physical files, uncomment this section
  // const orphanedAudios = await prisma.$queryRaw<Array<{ id: number, url: string }>>`
  //   SELECT id, url FROM audio WHERE is_orphaned = true
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

  // Delete the database records using raw query to use the is_orphaned column
  const result = await prisma.$executeRaw`
    DELETE FROM audio WHERE is_orphaned = true
  `;

  return result;
}

/**
 * Performs a complete cleanup of orphaned audio records
 * @returns The number of deleted records
 */
export async function cleanupAudio(): Promise<number> {
  await markOrphanedAudioRecords();
  return await deleteOrphanedAudioRecords();
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
