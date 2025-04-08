/**
 * This file demonstrates how to use Prisma-generated types in your application
 */

import { User, Language, MainDictionary, Prisma } from '@prisma/client';

// You can use the types directly
export type UserWithLanguages = User & {
  baseLanguage: Language | null;
  targetLanguage: Language | null;
};

// You can use Prisma's utility types for input data
export type CreateUserInput = Prisma.UserCreateInput;
export type UpdateUserInput = Prisma.UserUpdateInput;

// You can define types for complex queries with relations
export type DictionaryWithRelations = MainDictionary & {
  word: { word: string };
  oneWordDefinition: { definition: string };
  examples: { example: string }[];
};

// You can define types for nested operations
export type CreateUserWithDictionary = Prisma.UserCreateInput & {
  userDictionary?: Prisma.UserDictionaryCreateNestedManyWithoutUserInput;
};

// You can define types for specific select operations
export type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    baseLanguage: true;
    targetLanguage: true;
  };
}>;

// Example of using the types in a function
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  // This is just a type demonstration - in a real app, you would use prisma client
  console.log(`Fetching user profile for ID: ${userId}`);
  return null;
}

// Example of a function that uses the Prisma types for input validation
export function validateUserInput(input: CreateUserInput): boolean {
  // Simple validation example
  if (!input.email || !input.name || !input.password) {
    return false;
  }
  return true;
}
