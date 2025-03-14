import {
    User,
    Language,
    MainDictionary,
    DictionaryExample,
    Synonym,
    DictionarySynonym,
    UserDictionary,
    List,
    UserList,
    ListWord,
    UserListWord,
    UserDictionaryExample,
    UserDictionarySynonym,
    UserSynonym,
    Audio,
    OneWordDefinition,
    Word,
} from '@prisma/client';

import { v4 as uuidv4 } from 'uuid';

const audio_Id_1 = uuidv4();
const audio_Id_2 = uuidv4();
const audio_Id_3 = uuidv4();
const language_Id_1 = uuidv4();
const language_Id_2 = uuidv4();
const language_Id_3 = uuidv4();
const word_Id_1 = uuidv4();
const word_Id_2 = uuidv4();
const word_Id_3 = uuidv4();
const oneWordDefinition_Id_1 = uuidv4();
const oneWordDefinition_Id_2 = uuidv4();
const oneWordDefinition_Id_3 = uuidv4();
const mainDictionary_Id_1 = uuidv4();
const mainDictionary_Id_2 = uuidv4();
const mainDictionary_Id_3 = uuidv4();
const dictionaryExample_Id_1 = uuidv4();
const dictionaryExample_Id_2 = uuidv4();
const dictionaryExample_Id_3 = uuidv4();
const dictionaryExample_Id_4 = uuidv4();
const dictionaryExample_Id_5 = uuidv4();
const dictionaryExample_Id_6 = uuidv4();
const synonym_Id_1 = uuidv4();
const synonym_Id_2 = uuidv4();
const synonym_Id_3 = uuidv4();
const synonym_Id_4 = uuidv4();
const user_Id_1 = uuidv4();
const user_Id_2 = uuidv4();
const userDictionary_Id_1 = uuidv4();
const userDictionary_Id_2 = uuidv4();
const userDictionaryExample_Id_1 = uuidv4();
const userDictionaryExample_Id_2 = uuidv4();
const userSynonym_Id_1 = uuidv4();
const userSynonym_Id_2 = uuidv4();
const list_Id_1 = uuidv4();
const userList_Id_1 = uuidv4();

export const audio: Audio[] = [
    {
        id: audio_Id_1,
        audio: 'hello.mp3',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: audio_Id_2,
        audio: 'world.mp3',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: audio_Id_3,
        audio: 'кукуруза.mp3',
        languageId: language_Id_2,
        createdAt: new Date(),
    },
];

export const languages: Language[] = [
    {
        id: language_Id_1,
        code: 'en-US',
        name: 'English (US)',
        createdAt: new Date(),
    },
    {
        id: language_Id_2,
        code: 'ru-RU',
        name: 'Russian (Russia)',
        createdAt: new Date(),
    },
    {
        id: language_Id_3,
        code: 'es-ES',
        name: 'Spanish (Spain)',
        createdAt: new Date(),
    },
];

export const words: Word[] = [
    {
        id: word_Id_1,
        word: 'hello',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: word_Id_2,
        word: 'world',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: word_Id_3,
        word: 'кукуруза',
        languageId: language_Id_2,
        createdAt: new Date(),
    },
];

export const oneWordDefinitions: OneWordDefinition[] = [
    {
        id: oneWordDefinition_Id_1,
        definition: 'A greeting',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: oneWordDefinition_Id_2,
        definition: 'The planet Earth',
        languageId: language_Id_1,
        createdAt: new Date(),
    },
    {
        id: oneWordDefinition_Id_3,
        definition: 'A type of corn',
        languageId: language_Id_2,
        createdAt: new Date(),
    },
];

export const mainDictionary: MainDictionary[] = [
    {
        id: mainDictionary_Id_1,
        wordId: word_Id_1,
        oneWordDefinitionId: oneWordDefinition_Id_1,
        baseLanguageId: language_Id_2, // Russian
        targetLanguageId: language_Id_1, // English
        descriptionBase: 'Общепринятое приветствие при встрече с кем-либо',
        descriptionTarget: 'A common greeting used when meeting someone',
        audioId: audio_Id_1,
        frequency: 100,
        partOfSpeech: 'noun',
        phonetic: 'həˈləʊ',
        difficultyLevel: 'A1',
        etymology:
            'Это слово является заимствованием из английского языка и означает "приветствие"',
        source: 'import',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: mainDictionary_Id_2,
        oneWordDefinitionId: oneWordDefinition_Id_2,
        wordId: word_Id_2,
        baseLanguageId: language_Id_2,
        targetLanguageId: language_Id_1,
        descriptionBase: 'Планета Земля',
        descriptionTarget: 'The planet Earth',
        audioId: audio_Id_2,
        frequency: 50,
        partOfSpeech: 'noun',
        phonetic: 'ˈwɜːld',
        difficultyLevel: 'A1',
        etymology:
            'Это слово берет свое начало от древнеанглийского языка и означает "земля"',
        source: 'import',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: mainDictionary_Id_3,
        wordId: word_Id_3,
        oneWordDefinitionId: oneWordDefinition_Id_3,
        baseLanguageId: language_Id_1,
        targetLanguageId: language_Id_2,
        descriptionBase: 'A type of corn',
        descriptionTarget: 'Общепринятое приветствие при встрече с кем-либо',
        audioId: audio_Id_3,
        frequency: 100,
        partOfSpeech: 'noun',
        phonetic: '',
        difficultyLevel: 'A1',
        etymology: 'This word is a loanword from English and means "corn"', //in base language
        source: 'import',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const dictionaryExamples: DictionaryExample[] = [
    {
        id: dictionaryExample_Id_1,
        dictionaryId: mainDictionary_Id_1,
        example: 'Hello, how are you today?',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: dictionaryExample_Id_2,
        dictionaryId: mainDictionary_Id_1,
        example: 'I would like to say you hello!',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: dictionaryExample_Id_3,
        dictionaryId: mainDictionary_Id_2,
        example: 'The world is a big place!',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: dictionaryExample_Id_4,
        dictionaryId: mainDictionary_Id_2,
        example: 'I like to travel around the world!',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: dictionaryExample_Id_5,
        dictionaryId: mainDictionary_Id_3,
        example: 'Кукуруза - это полезное растение!',
        languageId: language_Id_2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: dictionaryExample_Id_6,
        dictionaryId: mainDictionary_Id_3,
        example: 'У меня есть кукуруза! ',
        languageId: language_Id_2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const synonyms: Synonym[] = [
    {
        id: synonym_Id_1,
        synonym: 'hi', //in target language
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: synonym_Id_2,
        synonym: 'planet',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },

    {
        id: synonym_Id_3,
        synonym: 'world',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },

    {
        id: synonym_Id_4,
        synonym: 'пачаток',
        languageId: language_Id_2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const dictionarySynonyms: DictionarySynonym[] = [
    {
        dictionaryId: mainDictionary_Id_1,
        synonymId: synonym_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },

    {
        dictionaryId: mainDictionary_Id_2,
        synonymId: synonym_Id_2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },

    {
        dictionaryId: mainDictionary_Id_2,
        synonymId: synonym_Id_3,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        dictionaryId: mainDictionary_Id_3,
        synonymId: synonym_Id_4,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const users: User[] = [
    {
        id: user_Id_1,
        name: 'Anton Doe',
        email: 'anton.doe@example.com',
        password: 'password123',
        baseLanguageId: language_Id_2,
        targetLanguageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        role: 'user',
        isVerified: true,
        verificationToken: '1234567890',
        profilePictureUrl: 'https://example.com/profile.jpg',
        status: 'active',
        settings: { theme: 'light', notifications: true },
        studyPreferences: { dailyGoal: 10, reminderTime: '09:00' },
        deletedAt: null,
    },
    {
        id: user_Id_2,
        name: 'Max Mustermann   ',
        email: 'max.mustermann@example.com',
        password: 'password123',
        baseLanguageId: language_Id_1,
        targetLanguageId: language_Id_2,
        role: 'user',
        isVerified: true,
        verificationToken: '1234567890',
        profilePictureUrl: 'https://example.com/profile.jpg',
        status: 'active',
        settings: { theme: 'dark', notifications: false }, // Example jsonb data
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastLogin: new Date(),
        studyPreferences: { dailyGoal: 15, reminderTime: '12:00' },
    },
];

export const userDictionary: UserDictionary[] = [
    {
        id: userDictionary_Id_1,
        userId: user_Id_1,
        mainDictionaryId: mainDictionary_Id_1,
        baseLanguageId: language_Id_2,
        targetLanguageId: language_Id_1,
        isLearned: false,
        isNeedsReview: true,
        isDifficultToLearn: false,
        isModified: false,
        reviewCount: 0,
        timeWordWasStartedToLearn: new Date(),
        progress: 0.3,
        createdAt: new Date(),
        updatedAt: new Date(),
        jsonbData: {},
        deletedAt: null,
        customDefinitionBase: null,
        customDefinitionTarget: null,
        lastReviewedAt: null,
        timeWordWasLearned: null,
    },
    {
        id: userDictionary_Id_2,
        userId: user_Id_1,
        mainDictionaryId: mainDictionary_Id_2,
        baseLanguageId: language_Id_1,
        targetLanguageId: language_Id_2,
        isLearned: false,
        isNeedsReview: true,
        isDifficultToLearn: false,
        isModified: false,
        reviewCount: 0,
        timeWordWasStartedToLearn: new Date(),
        progress: 0.3,
        createdAt: new Date(),
        updatedAt: new Date(),
        jsonbData: {},
        deletedAt: null,
        customDefinitionBase: null,
        customDefinitionTarget: null,
        lastReviewedAt: null,
        timeWordWasLearned: null,
    },
];

export const userDictionaryExamples: UserDictionaryExample[] = [
    {
        id: userDictionaryExample_Id_1,
        userDictionaryId: userDictionary_Id_1,
        example: 'Example from user 1: Hello, how are you today?',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: userDictionaryExample_Id_2,
        userDictionaryId: userDictionary_Id_1,
        example: 'Example from user 2: Hello, how are you today?',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];
export const userSynonyms: UserSynonym[] = [
    {
        id: userSynonym_Id_1,
        synonym: 'hi-synonym-1',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        id: userSynonym_Id_2,
        synonym: 'hello-synonym-2',
        languageId: language_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const userDictionarySynonyms: UserDictionarySynonym[] = [
    {
        userDictionaryId: userDictionary_Id_1,
        userSynonymId: userSynonym_Id_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
    {
        userDictionaryId: userDictionary_Id_1,
        userSynonymId: userSynonym_Id_2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    },
];

export const lists: List[] = [
    {
        id: list_Id_1,
        name: 'Basic Greetings',
        description: 'Common greeting words and phrases',
        baseLanguageId: language_Id_2,
        targetLanguageId: language_Id_1,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['beginner', 'greetings'],
        coverImageUrl: 'https://example.com/greetings.jpg',
        difficultyLevel: 'A1',
        wordCount: 1,
        lastModified: new Date(),
        jsonbData: {},
        ownerId: user_Id_1,
        deletedAt: null,
    },
];

export const userLists: UserList[] = [
    {
        id: userList_Id_1,
        userId: user_Id_1,
        listsId: list_Id_1,
        baseLanguageId: language_Id_2,
        targetLanguageId: language_Id_1,
        customNameOfList: 'Custom Name of List',
        customDescriptionOfList: 'Custom Description of List',
        customDifficulty: 'A1',
        isModified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0.0,
        jsonbData: {},
        deletedAt: null,
    },
];

//join table
export const listWords: ListWord[] = [
    {
        listId: list_Id_1,
        dictionaryId: mainDictionary_Id_1,
        orderIndex: 0,
    },
    {
        listId: list_Id_1,
        dictionaryId: mainDictionary_Id_2,
        orderIndex: 1,
    },
];

//join table
export const userListWords: UserListWord[] = [
    {
        userListId: userList_Id_1,
        userDictionaryId: userDictionary_Id_1,
        orderIndex: 0,
    },
];
