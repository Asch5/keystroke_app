import {
    User,
    Language,
    Audio,
    OneWordDefinition,
    Word,
    MainDictionary,
    DictionaryExample,
    Synonym,
    DictionarySynonym,
    UserDictionary,
    List,
    UserList,
    ListWords,
    UserListWords,
    UserDictionaryExample,
    UserDictionarySynonym,
    UserSynonym,
} from '@/types/databaseTypes';
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
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: audio_Id_2,
        audio: 'world.mp3',
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: audio_Id_3,
        audio: 'кукуруза.mp3',
        language_id: language_Id_2,
        created_at: new Date(),
    },
];

export const languages: Language[] = [
    {
        id: language_Id_1,
        code: 'en-US',
        name: 'English (US)',
        created_at: new Date(),
    },
    {
        id: language_Id_2,
        code: 'ru-RU',
        name: 'Russian (Russia)',
        created_at: new Date(),
    },
    {
        id: language_Id_3,
        code: 'es-ES',
        name: 'Spanish (Spain)',
        created_at: new Date(),
    },
];

export const words: Word[] = [
    {
        id: word_Id_1,
        word: 'hello',
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: word_Id_2,
        word: 'world',
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: word_Id_3,
        word: 'кукуруза',
        language_id: language_Id_2,
        created_at: new Date(),
    },
];

export const oneWordDefinitions: OneWordDefinition[] = [
    {
        id: oneWordDefinition_Id_1,
        definition: 'A greeting',
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: oneWordDefinition_Id_2,
        definition: 'The planet Earth',
        language_id: language_Id_1,
        created_at: new Date(),
    },
    {
        id: oneWordDefinition_Id_3,
        definition: 'A type of corn',
        language_id: language_Id_2,
        created_at: new Date(),
    },
];

export const mainDictionary: MainDictionary[] = [
    {
        id: mainDictionary_Id_1,
        word_id: word_Id_1,
        one_word_definition_id: oneWordDefinition_Id_1,
        base_language_id: language_Id_2, // Russian
        target_language_id: language_Id_1, // English
        description_base: 'A common greeting used when meeting someone',
        description_target: 'Общепринятое приветствие при встрече с кем-либо',
        audio_id: audio_Id_1,
        frequency: 100,
        part_of_speech: 'noun',
        phonetic: 'həˈləʊ',
        difficulty_level: 'A1',
        etymology:
            'Это слово является заимствованием из английского языка и означает "приветствие"',
        source: 'import',
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: mainDictionary_Id_2,
        one_word_definition_id: oneWordDefinition_Id_2,
        word_id: word_Id_2,
        base_language_id: language_Id_2,
        target_language_id: language_Id_1,
        description_base: 'The planet Earth',
        description_target: 'Планета Земля',
        audio_id: audio_Id_2,
        frequency: 50,
        part_of_speech: 'noun',
        phonetic: 'ˈwɜːld',
        difficulty_level: 'A1',
        etymology:
            'Это слово берет свое начало от древнеанглийского языка и означает "земля"',
        source: 'import',
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: mainDictionary_Id_3,
        word_id: word_Id_3,
        one_word_definition_id: oneWordDefinition_Id_3,
        base_language_id: language_Id_1,
        target_language_id: language_Id_2,
        description_base: 'A type of corn',
        description_target: 'Общепринятое приветствие при встрече с кем-либо',
        audio_id: audio_Id_3,
        frequency: 100,
        part_of_speech: 'noun',
        phonetic: '',
        difficulty_level: 'A1',
        etymology: 'This word is a loanword from English and means "corn"', //in base language
        source: 'import',
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const dictionaryExamples: DictionaryExample[] = [
    {
        id: dictionaryExample_Id_1,
        dictionary_id: mainDictionary_Id_1,
        example: 'Hello, how are you today?',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: dictionaryExample_Id_2,
        dictionary_id: mainDictionary_Id_1,
        example: 'I would like to say you hello!',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: dictionaryExample_Id_3,
        dictionary_id: mainDictionary_Id_2,
        example: 'The world is a big place!',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: dictionaryExample_Id_4,
        dictionary_id: mainDictionary_Id_2,
        example: 'I like to travel around the world!',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: dictionaryExample_Id_5,
        dictionary_id: mainDictionary_Id_3,
        example: 'Кукуруза - это полезное растение!',
        language_id: language_Id_2,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: dictionaryExample_Id_6,
        dictionary_id: mainDictionary_Id_3,
        example: 'У меня есть кукуруза! ',
        language_id: language_Id_2,
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const synonyms: Synonym[] = [
    {
        id: synonym_Id_1,
        synonym: 'hi', //in target language
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: synonym_Id_2,
        synonym: 'planet',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },

    {
        id: synonym_Id_3,
        synonym: 'world',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },

    {
        id: synonym_Id_4,
        synonym: 'пачаток',
        language_id: language_Id_2,
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const dictionarySynonyms: DictionarySynonym[] = [
    {
        dictionary_id: mainDictionary_Id_1,
        synonym_id: synonym_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },

    {
        dictionary_id: mainDictionary_Id_2,
        synonym_id: synonym_Id_2,
        created_at: new Date(),
        updated_at: new Date(),
    },

    {
        dictionary_id: mainDictionary_Id_2,
        synonym_id: synonym_Id_3,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        dictionary_id: mainDictionary_Id_3,
        synonym_id: synonym_Id_4,
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const users: User[] = [
    {
        id: user_Id_1,
        name: 'Anton Doe',
        email: 'anton.doe@example.com',
        password: 'password123',
        base_language_id: language_Id_2,
        target_language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
        lastLogin: new Date(),
        role: 'user',
        isVerified: true,
        verificationToken: '1234567890',
        profilePictureUrl: 'https://example.com/profile.jpg',
        status: 'active',
        settings: { theme: 'light', notifications: true },
        study_preferences: { dailyGoal: 10, reminderTime: '09:00' },
    },
    {
        id: user_Id_2,
        name: 'Max Mustermann   ',
        email: 'max.mustermann@example.com',
        password: 'password123',
        base_language_id: language_Id_1,
        target_language_id: language_Id_2,
        role: 'user',
        isVerified: true,
        verificationToken: '1234567890',
        profilePictureUrl: 'https://example.com/profile.jpg',
        status: 'active',
        settings: { theme: 'dark', notifications: false }, // Example jsonb data
        study_preferences: { dailyGoal: 15, reminderTime: '12:00' }, // Example jsonb data
    },
];

export const userDictionary: UserDictionary[] = [
    {
        id: userDictionary_Id_1,
        user_id: user_Id_1,
        main_dictionary_id: mainDictionary_Id_1,
        base_language_id: language_Id_2,
        target_language_id: language_Id_1,
        is_learned: false,
        is_needs_review: true,
        is_difficult_to_learn: false,
        is_modified: false,
        review_count: 0,
        time_word_was_started_to_learn: new Date(),
        progress: 0.3,
        created_at: new Date(),
        updated_at: new Date(),
        jsonb_data: {},
    },
    {
        id: userDictionary_Id_2,
        user_id: user_Id_1,
        main_dictionary_id: mainDictionary_Id_2,
        base_language_id: language_Id_1,
        target_language_id: language_Id_2,
        is_learned: false,
        is_needs_review: true,
        is_difficult_to_learn: false,
        is_modified: false,
        review_count: 0,
        time_word_was_started_to_learn: new Date(),
        progress: 0.3,
        created_at: new Date(),
        updated_at: new Date(),
        jsonb_data: {},
    },
];

export const userDictionaryExamples: UserDictionaryExample[] = [
    {
        id: userDictionaryExample_Id_1,
        user_dictionary_id: userDictionary_Id_1,
        example: 'Example from user 1: Hello, how are you today?',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: userDictionaryExample_Id_2,
        user_dictionary_id: userDictionary_Id_1,
        example: 'Example from user 2: Hello, how are you today?',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
];
export const userSynonyms: UserSynonym[] = [
    {
        id: userSynonym_Id_1,
        synonym: 'hi-synonym-1',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: userSynonym_Id_2,
        synonym: 'hello-synonym-2',
        language_id: language_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const userDictionarySynonyms: UserDictionarySynonym[] = [
    {
        user_dictionary_id: userDictionary_Id_1,
        user_synonym_id: userSynonym_Id_1,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        user_dictionary_id: userDictionary_Id_1,
        user_synonym_id: userSynonym_Id_2,
        created_at: new Date(),
        updated_at: new Date(),
    },
];

export const lists: List[] = [
    {
        id: list_Id_1,
        name: 'Basic Greetings',
        description: 'Common greeting words and phrases',
        base_language_id: language_Id_2,
        target_language_id: language_Id_1,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
        tags: ['beginner', 'greetings'],
        coverImageUrl: 'https://example.com/greetings.jpg',
        difficultyLevel: 'A1',
        wordCount: 1,
        last_modified: new Date(),
        jsonb_data: {},
        owner_id: user_Id_1,
    },
];

export const userLists: UserList[] = [
    {
        id: userList_Id_1,
        user_id: user_Id_1,
        lists_id: lists[0].id,
        base_language_id: language_Id_2,
        target_language_id: language_Id_1,
        custom_name_of_list: 'Custom Name of List',
        custom_description_of_list: 'Custom Description of List',
        custom_difficulty: 'A1',
        is_modified: false,
        created_at: new Date(),
        updated_at: new Date(),
        progress: 0.0,
        jsonb_data: {},
    },
];

export const listWords: ListWords[] = [
    {
        list_id: list_Id_1,
        dictionary_id: mainDictionary_Id_1,
        order_index: 0,
    },
    {
        list_id: list_Id_1,
        dictionary_id: mainDictionary_Id_2,
        order_index: 1,
    },
];

export const userListWords: UserListWords[] = [
    {
        user_list_id: userList_Id_1,
        dictionary_id: mainDictionary_Id_3,
        order_index: 0,
    },
];
