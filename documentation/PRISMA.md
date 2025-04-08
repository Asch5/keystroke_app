# Prisma Setup and Usage

This document provides information on how to use Prisma in this project.

## Setup

Prisma is already set up in this project with the following components:

1. **Prisma Schema**: Located at `prisma/schema.prisma`
2. **Prisma Client**: Generated from the schema and available for import
3. **Database Connection**: Configured via the `DATABASE_URL` in the `.env` file

## Database Schema

The database schema includes the following main models:

- `Language`: Languages supported by the application
- `User`: User accounts and profiles
- `Word`: Words in different languages
- `MainDictionary`: Main dictionary entries
- `UserDictionary`: User-specific dictionary entries
- `List`: Word lists
- `UserList`: User-specific word lists
- And many more related models

## Using Prisma in Your Code

### Import the Prisma Client

```typescript
import { prisma } from '@/lib/prisma';
```

### Query Examples

#### Find All Records

```typescript
const languages = await prisma.language.findMany();
```

#### Find a Specific Record

```typescript
const language = await prisma.language.findUnique({
  where: { code: 'en' },
});
```

#### Create a Record

```typescript
const newLanguage = await prisma.language.create({
  data: {
    code: 'fr',
    name: 'French',
  },
});
```

#### Update a Record

```typescript
const updatedLanguage = await prisma.language.update({
  where: { id: 'language-id' },
  data: {
    name: 'Updated Name',
  },
});
```

#### Delete a Record

```typescript
const deletedLanguage = await prisma.language.delete({
  where: { id: 'language-id' },
});
```

### Relationships

The schema includes many relationships between models. For example:

```typescript
// Get a user with their base and target languages
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    baseLanguage: true,
    targetLanguage: true,
  },
});

// Get a dictionary entry with related word and examples
const dictionaryEntry = await prisma.mainDictionary.findUnique({
  where: { id: 'entry-id' },
  include: {
    word: true,
    examples: true,
  },
});
```

## Using Prisma-Generated Types

Prisma automatically generates TypeScript types based on your schema. These types are available from the `@prisma/client` package.

### Basic Types

```typescript
import { User, Language, Prisma } from '@prisma/client';

// Use the model types directly
function processUser(user: User) {
  console.log(user.name);
}

// Use Prisma namespace types for inputs
function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}
```

### Complex Types with Relations

```typescript
// Define a type that includes relations
type UserWithLanguages = User & {
  baseLanguage: Language | null;
  targetLanguage: Language | null;
};

// Use Prisma's utility type for specific query payloads
type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    baseLanguage: true;
    targetLanguage: true;
  };
}>;
```

### Type-Safe Queries

```typescript
// The return type is fully typed based on your query
const result = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    baseLanguage: true,
    targetLanguage: true,
  },
});
// result has type: User & { baseLanguage: Language | null, targetLanguage: Language | null }
```

## Seeding the Database

This project includes a seed script to populate the database with initial data.

### Running the Seed Script

```bash
npm run seed
```

### Complete Database Setup

To set up the database from scratch (create schema, run migrations, and seed):

```bash
npm run setup-db
```

### Seed Script Structure

The seed script (`prisma/seed.ts`) uses the Prisma client to insert data from the placeholder data files. It follows this process:

1. Insert languages
2. Insert users
3. Insert words and definitions
4. Insert dictionary entries
5. Insert examples and synonyms
6. Insert user-specific data

## Prisma Commands

### Generate Prisma Client

After making changes to the schema, regenerate the client:

```bash
npx prisma generate
# or
npm run prisma:generate
```

### Create Migrations

To create a migration after schema changes:

```bash
npx prisma migrate dev --name descriptive_name
```

### Apply Migrations

To apply migrations to the database:

```bash
npx prisma migrate deploy
# or
npm run prisma:migrate
```

### Reset Database

To reset the database (caution: this deletes all data):

```bash
npx prisma migrate reset
```

### View Database in Prisma Studio

To view and edit your database with a GUI:

```bash
npx prisma studio
# or
npm run prisma:studio
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma with Next.js](https://www.prisma.io/nextjs)
- [Prisma TypeScript Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
