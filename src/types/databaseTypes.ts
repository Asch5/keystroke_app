// Enums
export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PartOfSpeech =
    | 'noun'
    | 'verb'
    | 'adjective'
    | 'adverb'
    | 'preposition';
export type SourceType = 'user' | 'import' | 'ai-generated';
export type UserRole = 'guest' | 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    base_language_id: string;
    target_language_id: string;
    created_at?: Date;
    updated_at?: Date;
    lastLogin?: Date;
    role: UserRole;
    isVerified: boolean;
    verificationToken: string;
    profilePictureUrl: string;
    status: UserStatus;
    settings: Record<string, unknown>;
    study_preferences: Record<string, unknown>;
    deleted_at?: Date;
};

export type Language = {
    id: string;
    code: string;
    name: string;
    created_at: Date;
};

export type Audio = {
    id: string;
    audio: string;
    language_id: string;
    created_at: Date;
};

export type OneWordDefinition = {
    id: string;
    definition: string;
    language_id: string;
    created_at: Date;
};

export type Word = {
    id: string;
    word: string;
    language_id: string;
    created_at: Date;
};

export type MainDictionary = {
    id: string;
    word_id: string;
    one_word_definition_id: string;
    base_language_id: string;
    target_language_id: string;
    description_base: string;
    description_target: string;
    audio_id?: string;
    frequency?: number;
    part_of_speech: PartOfSpeech;
    phonetic: string;
    difficulty_level: DifficultyLevel;
    etymology?: string;
    source: SourceType;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type DictionaryExample = {
    id: string;
    dictionary_id: string;
    language_id: string;
    example: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type Synonym = {
    id: string;
    synonym: string;
    language_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type DictionarySynonym = {
    dictionary_id: string;
    synonym_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type UserDictionary = {
    id: string;
    user_id: string;
    main_dictionary_id: string;
    base_language_id: string;
    target_language_id: string;
    custom_definition_baseLanguage?: string;
    custom_definition_targetLanguage?: string;
    is_learned: boolean;
    is_needs_review: boolean;
    is_difficult_to_learn: boolean;
    is_modified: boolean;
    last_reviewed_at?: Date;
    review_count: number;
    time_word_was_started_to_learn: Date;
    time_word_was_learned?: Date;
    progress: number;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    jsonb_data: Record<string, unknown>;
};

export type UserDictionaryExample = {
    id: string;
    user_dictionary_id: string;
    example: string;
    language_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type UserSynonym = {
    id: string;
    synonym: string;
    language_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type UserDictionarySynonym = {
    user_dictionary_id: string;
    user_synonym_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
};

export type List = {
    id: string;
    name: string;
    description: string;
    base_language_id: string;
    target_language_id: string;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
    tags: string[];
    coverImageUrl: string;
    difficultyLevel: DifficultyLevel;
    wordCount: number;
    last_modified: Date;
    jsonb_data: Record<string, unknown>;
    owner_id: string;
    deleted_at?: Date;
};

export type ListWords = {
    list_id: string;
    dictionary_id: string;
    order_index: number;
};

export type UserList = {
    id: string;
    user_id: string;
    lists_id: string;
    base_language_id: string;
    target_language_id: string;
    is_modified: boolean;
    custom_name_of_list?: string;
    custom_description_of_list?: string;
    created_at: Date;
    updated_at: Date;
    custom_difficulty?: DifficultyLevel;
    progress: number;
    jsonb_data: Record<string, unknown>;
    deleted_at?: Date;
};

export type UserListWords = {
    user_list_id: string;
    dictionary_id: string;
    order_index: number;
};
