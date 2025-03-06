import { execSync } from 'child_process';

/**
 * Script to set up the database with Prisma
 *
 * This script will:
 * 1. Create the database schema (if it doesn't exist)
 * 2. Apply all migrations
 * 3. Seed the database with initial data
 */

console.log('🔄 Setting up database...');

try {
    // Create migrations from the schema if they don't exist
    console.log('📝 Creating migrations...');
    execSync('npx prisma migrate dev --name init --create-only', {
        stdio: 'inherit',
    });

    // Apply migrations
    console.log('🚀 Applying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Seed the database
    console.log('🌱 Seeding database...');
    execSync('npm run seed', { stdio: 'inherit' });

    console.log('✅ Database setup complete!');
} catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
}
