// import { prisma } from '@/lib/prisma';
// import { analyzeWord } from './openai';
// import { DifficultyLevel, PartOfSpeech, SourceType } from '@prisma/client';

// /**
//  * Creates a new word entry in the database
//  * @param word - The word to create
//  * @param phonetic - The phonetic spelling of the word
//  * @param languageId - The ID of the language this word belongs to
//  * @returns The created word
//  */
// async function createWord(
//     word: string,
//     phonetic: string | null,
//     languageId: string,
// ) {
//     return prisma.word.create({
//         data: {
//             word,
//             phonetic,
//             languageId,
//         },
//     });
// }

// /**
//  * Creates a new one-word definition entry
//  * @param definition - The one-word definition
//  * @param languageId - The ID of the language this definition is in
//  * @returns The created definition
//  */
// async function createOneWordDefinition(definition: string, languageId: string) {
//     return prisma.oneWordDefinition.create({
//         data: {
//             definition,
//             languageId,
//         },
//     });
// }

// /**
//  * Creates new synonym entries for a word and links them to the dictionary
//  * @param synonyms - Array of synonym words
//  * @param languageId - The ID of the language these synonyms are in
//  * @param dictionaryId - The ID of the dictionary entry these synonyms belong to
//  * @returns Array of created dictionary synonyms
//  */
// async function createSynonyms(
//     synonyms: string[],
//     languageId: string,
//     dictionaryId: string,
// ) {
//     const createdSynonyms = await Promise.all(
//         synonyms.map((word) =>
//             prisma.synonym.create({
//                 data: {
//                     synonym: word,
//                     languageId,
//                 },
//             }),
//         ),
//     );

//     // Create dictionary synonym relationships
//     await Promise.all(
//         createdSynonyms.map((synonym) =>
//             prisma.dictionarySynonym.create({
//                 data: {
//                     dictionaryId,
//                     synonymId: synonym.id,
//                 },
//             }),
//         ),
//     );

//     return createdSynonyms;
// }

// /**
//  * Creates new example entries for a dictionary entry
//  * @param examples - Array of example sentences
//  * @param languageId - The ID of the language these examples are in
//  * @param dictionaryId - The ID of the dictionary entry these examples belong to
//  * @returns Array of created examples
//  */
// async function createExamples(
//     examples: string[],
//     languageId: string,
//     dictionaryId: string,
// ) {
//     return Promise.all(
//         examples.map((example) =>
//             prisma.dictionaryExample.create({
//                 data: {
//                     example,
//                     languageId,
//                     dictionaryId,
//                 },
//             }),
//         ),
//     );
// }

// /**
//  * Creates a new MainDictionary entry
//  * @param params - Parameters for creating the MainDictionary entry
//  */
// async function createMainDictionaryEntry({
//     wordId,
//     oneWordDefinitionId,
//     baseLanguageId,
//     targetLanguageId,
//     descriptionBase,
//     descriptionTarget,
//     partOfSpeech,
//     difficultyLevel,
//     source,
// }: {
//     wordId: string;
//     oneWordDefinitionId: string;
//     baseLanguageId: string;
//     targetLanguageId: string;
//     descriptionBase: string;
//     descriptionTarget: string;
//     partOfSpeech: PartOfSpeech;
//     difficultyLevel: DifficultyLevel;
//     source: SourceType;
// }) {
//     const dictionary = await prisma.mainDictionary.create({
//         data: {
//             wordId,
//             oneWordDefinitionId,
//             baseLanguageId,
//             targetLanguageId,
//             descriptionBase,
//             descriptionTarget,
//             partOfSpeech,
//             difficultyLevel,
//             source,
//         },
//     });
//     return dictionary;
// }

// /**
//  * Adds a new word to the dictionary system
//  * @param word - The word to add
//  * @param baseLanguageId - The ID of the base language
//  * @param targetLanguageId - The ID of the target language
//  */
// export async function addNewWord(
//     word: string,
//     baseLanguageId: string,
//     targetLanguageId: string,
// ) {
//     try {
//         // Get language codes for OpenAI
//         const [baseLanguage, targetLanguage] = await Promise.all([
//             prisma.language.findUnique({
//                 where: { id: baseLanguageId },
//                 select: { code: true },
//             }),
//             prisma.language.findUnique({
//                 where: { id: targetLanguageId },
//                 select: { code: true },
//             }),
//         ]);

//         if (!baseLanguage || !targetLanguage) {
//             throw new Error('Invalid language IDs');
//         }

//         // Analyze the word using OpenAI
//         const analysis = await analyzeWord(
//             word,
//             baseLanguage.code,
//             targetLanguage.code,
//         );

//         // Create words in both languages
//         const [baseWord, targetWord] = await Promise.all([
//             createWord(
//                 analysis.wordInBaseLanguage,
//                 analysis.phoneticSpellingInBaseLanguage,
//                 baseLanguageId,
//             ),
//             createWord(
//                 analysis.wordInTargetLanguage,
//                 analysis.phoneticSpellingInTargetLanguage,
//                 targetLanguageId,
//             ),
//         ]);

//         // Create one-word definitions
//         const [baseDefinition, targetDefinition] = await Promise.all([
//             createOneWordDefinition(
//                 analysis.oneWordDefinitionInBaseLanguage,
//                 baseLanguageId,
//             ),
//             createOneWordDefinition(
//                 analysis.oneWordDefinitionInTargetLanguage,
//                 targetLanguageId,
//             ),
//         ]);

//         // Create MainDictionary entries for both languages
//         const [mainDictionary1, mainDictionary2] = await Promise.all([
//             createMainDictionaryEntry({
//                 wordId: targetWord.id,
//                 oneWordDefinitionId: baseDefinition.id,
//                 baseLanguageId,
//                 targetLanguageId,
//                 descriptionBase: analysis.fullWordDescriptionInBaseLanguage,
//                 descriptionTarget: analysis.fullWordDescriptionInTargetLanguage,
//                 partOfSpeech: analysis.partOfSpeechInTargetLanguage,
//                 difficultyLevel: analysis.difficultyLevel,
//                 source: analysis.source,
//             }),
//             createMainDictionaryEntry({
//                 wordId: baseWord.id,
//                 oneWordDefinitionId: targetDefinition.id,
//                 baseLanguageId,
//                 targetLanguageId,
//                 descriptionBase: analysis.fullWordDescriptionInTargetLanguage,
//                 descriptionTarget: analysis.fullWordDescriptionInBaseLanguage,
//                 partOfSpeech: analysis.partOfSpeechInBaseLanguage,
//                 difficultyLevel: analysis.difficultyLevel,
//                 source: analysis.source,
//             }),
//         ]);

//         // Create examples and synonyms after main dictionary entries are created
//         await Promise.all([
//             createExamples(
//                 analysis.examplesInTargetLanguage,
//                 targetLanguageId,
//                 mainDictionary1.id,
//             ),
//             createExamples(
//                 analysis.examplesInBaseLanguage,
//                 baseLanguageId,
//                 mainDictionary2.id,
//             ),
//             createSynonyms(
//                 analysis.synonymsInTargetLanguage,
//                 targetLanguageId,
//                 mainDictionary1.id,
//             ),
//             createSynonyms(
//                 analysis.synonymsInBaseLanguage,
//                 baseLanguageId,
//                 mainDictionary2.id,
//             ),
//         ]);

//         return {
//             mainDictionary1,
//             mainDictionary2,
//             analysis,
//         };
//     } catch (error) {
//         console.error('Error adding new word:', error);
//         throw new Error('Failed to add new word to dictionary');
//     }
// }
