// import {
//     User,
//     Language,
//     MainDictionary,
//     DictionaryExample,
//     UserDictionary,
//     List,
//     UserList,
//     ListWord,
//     UserListWord,
//     OneWordDefinition,
//     Word,
//     WordComposition,
//     WordSynonym,
// } from '@prisma/client';

// import { v4 as uuidv4 } from 'uuid';

// const language_Id_1 = uuidv4();
// const language_Id_2 = uuidv4();
// const language_Id_3 = uuidv4();
// const word_Id_1 = uuidv4();
// const word_Id_2 = uuidv4();
// const word_Id_3 = uuidv4();
// const oneWordDefinition_Id_1 = uuidv4();
// const oneWordDefinition_Id_2 = uuidv4();
// const oneWordDefinition_Id_3 = uuidv4();
// const mainDictionary_Id_1 = uuidv4();
// const mainDictionary_Id_2 = uuidv4();
// const mainDictionary_Id_3 = uuidv4();
// const dictionaryExample_Id_1 = uuidv4();
// const dictionaryExample_Id_2 = uuidv4();
// const dictionaryExample_Id_3 = uuidv4();
// const dictionaryExample_Id_4 = uuidv4();
// const dictionaryExample_Id_5 = uuidv4();
// const dictionaryExample_Id_6 = uuidv4();
// export const user_Id_1 = uuidv4();
// export const user_Id_2 = uuidv4();
// const userDictionary_Id_1 = uuidv4();
// const userDictionary_Id_2 = uuidv4();
// const list_Id_1 = uuidv4();
// const userList_Id_1 = uuidv4();
// const category_Id_1 = uuidv4();
// const customOneWordDefinition_Id_1 = uuidv4();
// const customOneWordDefinition_Id_2 = uuidv4();

// export const languages: Language[] = [
//     {
//         id: language_Id_1,
//         code: 'en-US',
//         name: 'English (US)',
//         createdAt: new Date(),
//     },
//     {
//         id: language_Id_2,
//         code: 'ru-RU',
//         name: 'Russian (Russia)',
//         createdAt: new Date(),
//     },
//     {
//         id: language_Id_3,
//         code: 'es-ES',
//         name: 'Spanish (Spain)',
//         createdAt: new Date(),
//     },
// ];

// export const words: Word[] = [
//     {
//         id: word_Id_1,
//         word: 'hello',
//         phonetic: 'həˈləʊ',
//         audio: 'hello.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     },
//     {
//         id: word_Id_2,
//         word: 'world',
//         phonetic: 'ˈwɜːld',
//         audio: 'world.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     },
//     {
//         id: word_Id_3,
//         word: 'кукуруза',
//         phonetic: 'ˈkʊkʊˈrʊzə',
//         audio: 'кукуруза.mp3',
//         languageId: language_Id_2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     },
//     {
//         id: uuidv4(),
//         word: 'goodbye',
//         phonetic: 'ɡʊdˈbaɪ',
//         audio: 'goodbye.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     },
// ];

// export const oneWordDefinitions: OneWordDefinition[] = [
//     {
//         id: oneWordDefinition_Id_1,
//         definition: 'Приветствие',
//         languageId: language_Id_2,
//         createdAt: new Date(),
//     },
//     {
//         id: oneWordDefinition_Id_2,
//         definition: 'Планета Земля',
//         languageId: language_Id_2,
//         createdAt: new Date(),
//     },
//     {
//         id: oneWordDefinition_Id_3,
//         definition: 'corn',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//     },
// ];

// export const mainDictionary: MainDictionary[] = [
//     {
//         id: mainDictionary_Id_1,
//         wordId: word_Id_1,
//         oneWordDefinitionId: oneWordDefinition_Id_1,
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         imageId: null,
//         descriptionBase: 'Общепринятое приветствие при встрече с кем-либо',
//         descriptionTarget: 'A common greeting used when meeting someone',
//         partOfSpeech: 'noun',
//         difficultyLevel: 'A1',
//         etymology:
//             'Это слово является заимствованием из английского языка и означает "приветствие"',
//         source: 'import',
//         version: 1,
//         versionNotes: null,
//         lastVersionUpdate: null,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: mainDictionary_Id_2,
//         wordId: word_Id_2,
//         oneWordDefinitionId: oneWordDefinition_Id_2,
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         imageId: null,
//         descriptionBase: 'Планета Земля',
//         descriptionTarget: 'The planet Earth',
//         partOfSpeech: 'noun',
//         difficultyLevel: 'A1',
//         etymology:
//             'Это слово берет свое начало от древнеанглийского языка и означает "земля"',
//         source: 'import',
//         version: 1,
//         versionNotes: null,
//         lastVersionUpdate: null,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: mainDictionary_Id_3,
//         wordId: word_Id_3,
//         oneWordDefinitionId: oneWordDefinition_Id_3,
//         baseLanguageId: language_Id_1,
//         targetLanguageId: language_Id_2,
//         imageId: null,
//         descriptionBase: 'A type of corn',
//         descriptionTarget: 'Общепринятое приветствие при встрече с кем-либо',
//         partOfSpeech: 'noun',
//         difficultyLevel: 'A1',
//         etymology: 'This word is a loanword from English and means "corn"',
//         source: 'import',
//         version: 1,
//         versionNotes: null,
//         lastVersionUpdate: null,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
// ];

// export const dictionaryExamples: DictionaryExample[] = [
//     {
//         id: dictionaryExample_Id_1,
//         dictionaryId: mainDictionary_Id_1,
//         example: 'Hello, how are you today?',
//         audio: 'hello_example_1.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: dictionaryExample_Id_2,
//         dictionaryId: mainDictionary_Id_1,
//         example: 'I would like to say you hello!',
//         audio: 'hello_example_2.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: dictionaryExample_Id_3,
//         dictionaryId: mainDictionary_Id_2,
//         example: 'The world is a big place!',
//         audio: 'world_example_1.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: dictionaryExample_Id_4,
//         dictionaryId: mainDictionary_Id_2,
//         example: 'I like to travel around the world!',
//         audio: 'world_example_2.mp3',
//         languageId: language_Id_1,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: dictionaryExample_Id_5,
//         dictionaryId: mainDictionary_Id_3,
//         example: 'Кукуруза - это полезное растение!',
//         audio: 'кукуруза_example_1.mp3',
//         languageId: language_Id_2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
//     {
//         id: dictionaryExample_Id_6,
//         dictionaryId: mainDictionary_Id_3,
//         example: 'У меня есть кукуруза!',
//         audio: 'кукуруза_example_2.mp3',
//         languageId: language_Id_2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//     },
// ];

// export const users: User[] = [
//     {
//         id: user_Id_1,
//         name: 'Anton Doe',
//         email: 'anton.doe@example.com',
//         password: 'password123',
//         baseLanguageId: language_Id_1,
//         targetLanguageId: language_Id_2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lastLogin: new Date(),
//         role: 'user',
//         isVerified: true,
//         verificationToken: '1234567890',
//         profilePictureUrl: null,
//         status: 'active',
//         settings: { theme: 'light', notifications: true },
//         studyPreferences: { dailyGoal: 10, reminderTime: '09:00' },
//         deletedAt: null,
//     },
//     {
//         id: user_Id_2,
//         name: 'Max Mustermann',
//         email: 'max.mustermann@example.com',
//         password: 'password123',
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         role: 'user',
//         isVerified: true,
//         verificationToken: '1234567890',
//         profilePictureUrl: null,
//         status: 'active',
//         settings: { theme: 'dark', notifications: false },
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         deletedAt: null,
//         lastLogin: new Date(),
//         studyPreferences: { dailyGoal: 15, reminderTime: '12:00' },
//     },
// ];

// export const userDictionary: UserDictionary[] = [
//     {
//         id: userDictionary_Id_1,
//         userId: user_Id_1,
//         mainDictionaryId: mainDictionary_Id_1,
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         isLearned: false,
//         isNeedsReview: true,
//         isDifficultToLearn: false,
//         isModified: false,
//         reviewCount: 0,
//         timeWordWasStartedToLearn: new Date(),
//         progress: 0.3,
//         amountOfMistakes: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         jsonbData: {},
//         deletedAt: null,
//         customOneWordDefinition: customOneWordDefinition_Id_1,
//         customDifficultyLevel: 'A1',
//         customEtymology: '',
//         learningStatus: 'notStarted',
//         lastReviewedAt: null,
//         timeWordWasLearned: null,
//         customDefinitionBase: '',
//         customDefinitionTarget: '',
//         nextReviewDue: null,
//         correctStreak: 0,
//     },
//     {
//         id: userDictionary_Id_2,
//         userId: user_Id_1,
//         mainDictionaryId: mainDictionary_Id_2,
//         baseLanguageId: language_Id_1,
//         targetLanguageId: language_Id_2,
//         isLearned: false,
//         isNeedsReview: true,
//         isDifficultToLearn: false,
//         isModified: false,
//         reviewCount: 0,
//         timeWordWasStartedToLearn: new Date(),
//         progress: 0.3,
//         amountOfMistakes: 0,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         jsonbData: {},
//         deletedAt: null,
//         customOneWordDefinition: customOneWordDefinition_Id_2,
//         customDifficultyLevel: 'A1',
//         customEtymology: '',
//         learningStatus: 'notStarted',
//         lastReviewedAt: null,
//         timeWordWasLearned: null,
//         customDefinitionBase: '',
//         customDefinitionTarget: '',
//         nextReviewDue: null,
//         correctStreak: 0,
//     },
// ];

// export const categories = [
//     {
//         id: category_Id_1,
//         name: 'Basic Vocabulary',
//         description: 'Fundamental words and phrases',
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     },
// ];

// export const lists: List[] = [
//     {
//         id: list_Id_1,
//         name: 'Basic Greetings',
//         description: 'Common greeting words and phrases',
//         categoryId: category_Id_1,
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         isPublic: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         tags: ['beginner', 'greetings'],
//         coverImageUrl: 'https://example.com/greetings.jpg',
//         difficultyLevel: 'A1',
//         wordCount: 1,
//         learnedWordCount: 0,
//         lastModified: new Date(),
//         jsonbData: {},
//         deletedAt: null,
//     },
// ];

// export const userLists: UserList[] = [
//     {
//         id: userList_Id_1,
//         userId: user_Id_1,
//         listId: list_Id_1,
//         baseLanguageId: language_Id_2,
//         targetLanguageId: language_Id_1,
//         customNameOfList: 'Custom Name of List',
//         customDescriptionOfList: 'Custom Description of List',
//         customCoverImageUrl: 'https://example.com/custom-greetings.jpg',
//         customDifficulty: 'A1',
//         isModified: false,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         progress: 0.0,
//         jsonbData: {},
//         deletedAt: null,
//     },
// ];

// export const listWords: ListWord[] = [
//     {
//         listId: list_Id_1,
//         dictionaryId: mainDictionary_Id_1,
//         orderIndex: 0,
//     },
//     {
//         listId: list_Id_1,
//         dictionaryId: mainDictionary_Id_2,
//         orderIndex: 1,
//     },
// ];

// export const userListWords: UserListWord[] = [
//     {
//         userListId: userList_Id_1,
//         userDictionaryId: userDictionary_Id_1,
//         orderIndex: 0,
//     },
// ];

// export const wordCompositions: WordComposition[] = [
//     {
//         dictionaryId: mainDictionary_Id_1,
//         wordId: word_Id_1,
//         orderIndex: 0,
//         createdAt: new Date(),
//     },
//     {
//         dictionaryId: mainDictionary_Id_1,
//         wordId: word_Id_2,
//         orderIndex: 1,
//         createdAt: new Date(),
//     },
// ];

// export const wordSynonyms: WordSynonym[] = [
//     {
//         dictionaryId: mainDictionary_Id_1,
//         wordId: word_Id_2,
//         createdAt: new Date(),
//     },
//     {
//         dictionaryId: mainDictionary_Id_2,
//         wordId: word_Id_1,
//         createdAt: new Date(),
//     },
// ];
