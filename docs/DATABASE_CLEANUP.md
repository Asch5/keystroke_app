# Database Cleanup Documentation

## Audio Records Cleanup

The application includes a mechanism to automatically clean up orphaned audio records in the database. This prevents the accumulation of unused audio records when their associated entities (words, phrases, examples) are deleted.

### How It Works

1. **Database Schema Change:** The Audio model now includes an `isOrphaned` flag to mark records for deletion.

2. **Relationship Changes:** The relationships between junction tables and Audio records now use `onDelete: Restrict` instead of `Cascade`, which prevents immediate deletion but allows for cleanup later.

3. **Cleanup Service:** The `DbCleanupService` runs periodically to:
   - Identify orphaned audio records (those not referenced by any junction table)
   - Mark them with `isOrphaned = true`
   - Delete these orphaned records

### Cleanup Process

The cleanup process happens in two steps:

1. **Marking Orphaned Records:**

   ```sql
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
   ```

2. **Deleting Orphaned Records:**
   ```sql
   DELETE FROM audio WHERE is_orphaned = true
   ```

### Running the Cleanup

The cleanup service runs automatically once per day in production environments. It is initialized during application startup in the Prisma client initialization.

#### Manual Cleanup

You can also trigger the cleanup manually using the API:

```bash
curl -X POST https://your-app.com/api/cleanup \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-secret-key"
```

To clean up only audio records:

```bash
curl -X POST https://your-app.com/api/cleanup?type=audio \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-secret-key"
```

### Configuration

The cleanup service can be configured in `src/lib/prisma.ts`:

```typescript
initializeServerServices({
  enableAudioCleanup: true, // Enable/disable audio cleanup
  audioCleanupIntervalMs: 86400000, // Default: 24 hours
});
```

### File Storage Cleanup

The current implementation only cleans up database records. If you're storing audio files in a file system or cloud storage, you'll need to:

1. Uncomment and configure the file deletion logic in `audioCleanup.ts`
2. Add the appropriate file system or cloud storage client
3. Ensure proper permissions for file deletion

## Adding More Cleanup Tasks

To add additional cleanup tasks:

1. Create a new cleanup module similar to `audioCleanup.ts`
2. Add the new task to the `runAllCleanupTasks` method in `DbCleanupService`
3. Update the documentation accordingly
