-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'moderator', 'learner', 'guest');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('STREAK', 'WORDS_LEARNED', 'PERFECT_SCORE', 'SPEED_LEARNING', 'CONSISTENT_PRACTICE');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('beginner', 'elementary', 'intermediate', 'advanced', 'proficient');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('notStarted', 'inProgress', 'learned', 'needsReview', 'difficult');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('review', 'newLearning', 'practice', 'test', 'spaced');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('en', 'ru', 'da', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'phrasal_verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'numeral', 'article', 'exclamation', 'abbreviation', 'suffix', 'phrase', 'sentence', 'undefined');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('synonym', 'antonym', 'related', 'stem', 'composition', 'phrasal_verb', 'phrase', 'alternative_spelling', 'abbreviation', 'derived_form', 'dialect_variant', 'translation', 'plural_en', 'past_tense_en', 'past_participle_en', 'present_participle_en', 'third_person_en', 'variant_form_phrasal_verb_en', 'definite_form_da', 'plural_da', 'plural_definite_da', 'present_tense_da', 'past_tense_da', 'past_participle_da', 'imperative_da', 'adjective_neuter_da', 'adjective_plural_da', 'comparative_da', 'superlative_da', 'adverb_comparative_da', 'adverb_superlative_da', 'pronoun_accusative_da', 'pronoun_genitive_da');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ai-generated', 'merriam_learners', 'merriam_intermediate', 'helsinki_nlp', 'danish_dictionary', 'user', 'admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('masculine', 'feminine', 'common', 'neuter');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "base_language_code" "LanguageCode" NOT NULL,
    "target_language_code" "LanguageCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" VARCHAR(255),
    "profilePictureUrl" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "study_preferences" JSONB NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "daily_goal" INTEGER NOT NULL DEFAULT 5,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_play_audio" BOOLEAN NOT NULL DEFAULT true,
    "dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "learning_reminders" JSONB NOT NULL DEFAULT '{}',
    "session_duration" INTEGER NOT NULL DEFAULT 15,
    "review_interval" INTEGER NOT NULL DEFAULT 3,
    "difficulty_preference" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" SERIAL NOT NULL,
    "word" VARCHAR(255) NOT NULL,
    "phoneticGeneral" VARCHAR(100),
    "frequency_general" INTEGER,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "etymology" TEXT,
    "additionalInfo" JSONB DEFAULT '{}',
    "language_code" "LanguageCode" NOT NULL,
    "sourceEntityId" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_details" (
    "id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "variant" VARCHAR(100),
    "gender" "Gender",
    "phonetic" VARCHAR(100),
    "forms" VARCHAR(100),
    "frequency" INTEGER,
    "isPlural" BOOLEAN NOT NULL DEFAULT false,
    "source_of_word_details" "SourceType" NOT NULL,

    CONSTRAINT "word_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "definitions" (
    "id" SERIAL NOT NULL,
    "definition" TEXT NOT NULL,
    "image_id" INTEGER,
    "source_of_definition" "SourceType" NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "subject_status_labels" VARCHAR(255),
    "general_labels" VARCHAR(255),
    "grammatical_note" VARCHAR(255),
    "usage_note" VARCHAR(255),
    "is_in_short_def" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "definition_examples" (
    "id" SERIAL NOT NULL,
    "example" TEXT NOT NULL,
    "grammatical_note" VARCHAR(255),
    "source_of_example" VARCHAR(255),
    "language_code" "LanguageCode" NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definition_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "source" "SourceType" NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" SERIAL NOT NULL,
    "languageCode" "LanguageCode" NOT NULL,
    "content" TEXT NOT NULL,
    "source" "SourceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dictionary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "base_language_code" "LanguageCode" NOT NULL,
    "target_language_code" "LanguageCode" NOT NULL,
    "custom_definition_base" TEXT,
    "custom_definition_target" TEXT,
    "custom_phonetic" VARCHAR(100),
    "customEtymology" TEXT,
    "customNotes" TEXT,
    "customTags" TEXT[],
    "customMnemonics" TEXT,
    "custom_difficulty_level" "DifficultyLevel",
    "customContext" JSONB DEFAULT '{}',
    "is_modified" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "learning_status" "LearningStatus" NOT NULL DEFAULT 'notStarted',
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "time_word_was_started_to_learn" TIMESTAMP(3),
    "time_word_was_learned" TIMESTAMP(3),
    "next_review_due" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_of_mistakes" INTEGER NOT NULL DEFAULT 0,
    "correct_streak" INTEGER NOT NULL DEFAULT 0,
    "srs_level" INTEGER NOT NULL DEFAULT 0,
    "srs_interval" INTEGER NOT NULL DEFAULT 0,
    "last_srs_success" BOOLEAN,
    "next_srs_review" TIMESTAMP(3),
    "last_used_in_context" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_words" (
    "list_id" UUID NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "list_words_pkey" PRIMARY KEY ("list_id","definition_id")
);

-- CreateTable
CREATE TABLE "user_list_words" (
    "user_list_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "user_dictionary_id" UUID NOT NULL,

    CONSTRAINT "user_list_words_pkey" PRIMARY KEY ("user_list_id","user_dictionary_id")
);

-- CreateTable
CREATE TABLE "lists" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "base_language_code" "LanguageCode" NOT NULL,
    "target_language_code" "LanguageCode" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "coverImageUrl" VARCHAR(255),
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "learned_word_count" INTEGER NOT NULL DEFAULT 0,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "list_id" UUID,
    "base_language_code" "LanguageCode" NOT NULL,
    "target_language_code" "LanguageCode" NOT NULL,
    "is_modified" BOOLEAN NOT NULL DEFAULT false,
    "custom_name_of_list" VARCHAR(255),
    "custom_description_of_list" VARCHAR(1000),
    "customCoverImageUrl" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "custom_difficulty" "DifficultyLevel",
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_word_audio" (
    "id" UUID NOT NULL,
    "user_dictionary_id" UUID NOT NULL,
    "audioUrl" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_word_audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_examples" (
    "id" UUID NOT NULL,
    "user_dictionary_id" UUID NOT NULL,
    "example" TEXT NOT NULL,
    "context" TEXT,
    "source" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_analytics" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timeSpentLearning" INTEGER NOT NULL,
    "learningPatterns" JSONB NOT NULL,
    "strengthAreas" JSONB NOT NULL,
    "weaknessAreas" JSONB NOT NULL,
    "learningStyle" JSONB NOT NULL,

    CONSTRAINT "learning_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minutesStudied" INTEGER NOT NULL,
    "wordsLearned" INTEGER NOT NULL,
    "streakDays" INTEGER NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_word_reminders" (
    "id" UUID NOT NULL,
    "user_dictionary_id" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL,
    "customSchedule" JSONB,
    "lastReminder" TIMESTAMP(3),
    "nextReminder" TIMESTAMP(3),

    CONSTRAINT "user_word_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_list_id" UUID,
    "list_id" UUID,
    "session_type" "SessionType" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "words_studied" INTEGER NOT NULL DEFAULT 0,
    "words_learned" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "incorrect_answers" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_dictionary_id" UUID NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "response_time" INTEGER,
    "attempts_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_mistakes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "word_id" INTEGER NOT NULL,
    "word_details_id" INTEGER,
    "definition_id" INTEGER,
    "user_dictionary_id" UUID,
    "type" TEXT NOT NULL,
    "incorrectValue" TEXT,
    "context" TEXT,
    "mistakeData" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" UUID NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_members" (
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_members_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "type" "AchievementType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "criteria" JSONB NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_contributions" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "contributorId" UUID NOT NULL,
    "reviewerId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_definitions" (
    "word_details_id" INTEGER NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_definitions_pkey" PRIMARY KEY ("word_details_id","definition_id")
);

-- CreateTable
CREATE TABLE "word_to_word_relationships" (
    "from_word_id" INTEGER NOT NULL,
    "to_word_id" INTEGER NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "word_to_word_relationships_pkey" PRIMARY KEY ("from_word_id","to_word_id","relationship_type")
);

-- CreateTable
CREATE TABLE "word_details_relationships" (
    "from_word_details_id" INTEGER NOT NULL,
    "to_word_details_id" INTEGER NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "word_details_relationships_pkey" PRIMARY KEY ("from_word_details_id","to_word_details_id","relationship_type")
);

-- CreateTable
CREATE TABLE "definition_to_word_relationships" (
    "from_definition_id" INTEGER NOT NULL,
    "to_word_id" INTEGER NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "definition_to_word_relationships_pkey" PRIMARY KEY ("from_definition_id","to_word_id","relationship_type")
);

-- CreateTable
CREATE TABLE "definition_relationships" (
    "from_definition_id" INTEGER NOT NULL,
    "to_definition_id" INTEGER NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "definition_relationships_pkey" PRIMARY KEY ("from_definition_id","to_definition_id","relationship_type")
);

-- CreateTable
CREATE TABLE "word_details_audio" (
    "word_details_id" INTEGER NOT NULL,
    "audio_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "word_details_audio_pkey" PRIMARY KEY ("word_details_id","audio_id")
);

-- CreateTable
CREATE TABLE "definition_audio" (
    "definition_id" INTEGER NOT NULL,
    "audio_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "definition_audio_pkey" PRIMARY KEY ("definition_id","audio_id")
);

-- CreateTable
CREATE TABLE "example_audio" (
    "example_id" INTEGER NOT NULL,
    "audio_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "example_audio_pkey" PRIMARY KEY ("example_id","audio_id")
);

-- CreateTable
CREATE TABLE "definition_translations" (
    "definition_id" INTEGER NOT NULL,
    "translation_id" INTEGER NOT NULL,

    CONSTRAINT "definition_translations_pkey" PRIMARY KEY ("definition_id","translation_id")
);

-- CreateTable
CREATE TABLE "example_translations" (
    "example_id" INTEGER NOT NULL,
    "translation_id" INTEGER NOT NULL,

    CONSTRAINT "example_translations_pkey" PRIMARY KEY ("example_id","translation_id")
);

-- CreateTable
CREATE TABLE "_UserToList" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_UserToList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ListToStudyGroup" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ListToStudyGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "idx_word_search" ON "words"("word");

-- CreateIndex
CREATE INDEX "idx_word_language" ON "words"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "words_word_language_code_key" ON "words"("word", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "word_details_word_id_part_of_speech_variant_key" ON "word_details"("word_id", "part_of_speech", "variant");

-- CreateIndex
CREATE UNIQUE INDEX "definitions_definition_language_code_source_of_definition_key" ON "definitions"("definition", "language_code", "source_of_definition");

-- CreateIndex
CREATE INDEX "idx_definition_example_def" ON "definition_examples"("definition_id");

-- CreateIndex
CREATE INDEX "idx_definition_example_lang" ON "definition_examples"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "definition_examples_definition_id_example_key" ON "definition_examples"("definition_id", "example");

-- CreateIndex
CREATE UNIQUE INDEX "audio_url_language_code_key" ON "audio"("url", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "images_url_key" ON "images"("url");

-- CreateIndex
CREATE INDEX "idx_learning_status" ON "user_dictionary"("user_id", "learning_status");

-- CreateIndex
CREATE INDEX "idx_next_review" ON "user_dictionary"("user_id", "next_review_due");

-- CreateIndex
CREATE INDEX "idx_progress" ON "user_dictionary"("user_id", "progress");

-- CreateIndex
CREATE INDEX "idx_streak" ON "user_dictionary"("user_id", "correct_streak");

-- CreateIndex
CREATE INDEX "idx_active_words" ON "user_dictionary"("last_reviewed_at");

-- CreateIndex
CREATE INDEX "idx_favorites" ON "user_dictionary"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "idx_srs_level" ON "user_dictionary"("user_id", "srs_level");

-- CreateIndex
CREATE UNIQUE INDEX "user_dictionary_user_id_definition_id_key" ON "user_dictionary"("user_id", "definition_id");

-- CreateIndex
CREATE INDEX "idx_list_words_order" ON "list_words"("list_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_lists_language" ON "lists"("base_language_code", "target_language_code");

-- CreateIndex
CREATE INDEX "idx_list_difficulty" ON "lists"("difficulty_level");

-- CreateIndex
CREATE INDEX "idx_public_lists" ON "lists"("is_public", "base_language_code", "target_language_code");

-- CreateIndex
CREATE UNIQUE INDEX "lists_name_category_id_key" ON "lists"("name", "category_id");

-- CreateIndex
CREATE INDEX "idx_user_lists_progress" ON "user_lists"("user_id", "progress");

-- CreateIndex
CREATE INDEX "idx_user_lists_modified" ON "user_lists"("user_id", "is_modified");

-- CreateIndex
CREATE INDEX "idx_user_lists_created_at" ON "user_lists"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_lists_user_id_list_id_key" ON "user_lists"("user_id", "list_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "user_word_audio_user_dictionary_id_idx" ON "user_word_audio"("user_dictionary_id");

-- CreateIndex
CREATE INDEX "user_examples_user_dictionary_id_idx" ON "user_examples"("user_dictionary_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_word_reminders_user_dictionary_id_key" ON "user_word_reminders"("user_dictionary_id");

-- CreateIndex
CREATE INDEX "idx_user_sessions_by_date" ON "user_learning_sessions"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_user_sessions_by_type" ON "user_learning_sessions"("user_id", "session_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_items_session_id_user_dictionary_id_key" ON "user_session_items"("session_id", "user_dictionary_id");

-- CreateIndex
CREATE INDEX "learning_mistakes_userId_idx" ON "learning_mistakes"("userId");

-- CreateIndex
CREATE INDEX "learning_mistakes_word_id_idx" ON "learning_mistakes"("word_id");

-- CreateIndex
CREATE INDEX "learning_mistakes_word_details_id_idx" ON "learning_mistakes"("word_details_id");

-- CreateIndex
CREATE INDEX "learning_mistakes_definition_id_idx" ON "learning_mistakes"("definition_id");

-- CreateIndex
CREATE INDEX "learning_mistakes_user_dictionary_id_idx" ON "learning_mistakes"("user_dictionary_id");

-- CreateIndex
CREATE INDEX "learning_mistakes_type_idx" ON "learning_mistakes"("type");

-- CreateIndex
CREATE INDEX "learning_mistakes_created_at_idx" ON "learning_mistakes"("created_at");

-- CreateIndex
CREATE INDEX "idx_word_definition_details" ON "word_definitions"("word_details_id");

-- CreateIndex
CREATE INDEX "idx_word_definition_def" ON "word_definitions"("definition_id");

-- CreateIndex
CREATE INDEX "idx_word_to_word_rel_from_word" ON "word_to_word_relationships"("from_word_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_word_to_word_rel_to_word" ON "word_to_word_relationships"("to_word_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_word_pair" ON "word_to_word_relationships"("from_word_id", "to_word_id");

-- CreateIndex
CREATE INDEX "idx_word_relationship_from" ON "word_details_relationships"("from_word_details_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_word_relationship_to" ON "word_details_relationships"("to_word_details_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_word_details_pair" ON "word_details_relationships"("from_word_details_id", "to_word_details_id");

-- CreateIndex
CREATE INDEX "idx_def_to_word_rel_from_def" ON "definition_to_word_relationships"("from_definition_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_def_to_word_rel_to_word" ON "definition_to_word_relationships"("to_word_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_def_word_pair" ON "definition_to_word_relationships"("from_definition_id", "to_word_id");

-- CreateIndex
CREATE INDEX "idx_def_relationship_from" ON "definition_relationships"("from_definition_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_def_relationship_to" ON "definition_relationships"("to_definition_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_def_pair" ON "definition_relationships"("from_definition_id", "to_definition_id");

-- CreateIndex
CREATE INDEX "word_details_audio_is_primary_idx" ON "word_details_audio"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "word_details_primary_audio_unique" ON "word_details_audio"("word_details_id", "is_primary");

-- CreateIndex
CREATE INDEX "definition_audio_is_primary_idx" ON "definition_audio"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "definition_primary_audio_unique" ON "definition_audio"("definition_id", "is_primary");

-- CreateIndex
CREATE INDEX "example_audio_is_primary_idx" ON "example_audio"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "example_primary_audio_unique" ON "example_audio"("example_id", "is_primary");

-- CreateIndex
CREATE INDEX "_UserToList_B_index" ON "_UserToList"("B");

-- CreateIndex
CREATE INDEX "_ListToStudyGroup_B_index" ON "_ListToStudyGroup"("B");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_details" ADD CONSTRAINT "word_details_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definitions" ADD CONSTRAINT "definitions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_examples" ADD CONSTRAINT "definition_examples_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_list_id_fkey" FOREIGN KEY ("user_list_id") REFERENCES "user_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_audio" ADD CONSTRAINT "user_word_audio_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_examples" ADD CONSTRAINT "user_examples_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_analytics" ADD CONSTRAINT "learning_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_reminders" ADD CONSTRAINT "user_word_reminders_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_sessions" ADD CONSTRAINT "user_learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_sessions" ADD CONSTRAINT "user_learning_sessions_user_list_id_fkey" FOREIGN KEY ("user_list_id") REFERENCES "user_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_learning_sessions" ADD CONSTRAINT "user_learning_sessions_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session_items" ADD CONSTRAINT "user_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "user_learning_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session_items" ADD CONSTRAINT "user_session_items_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_mistakes" ADD CONSTRAINT "learning_mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_mistakes" ADD CONSTRAINT "learning_mistakes_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_mistakes" ADD CONSTRAINT "learning_mistakes_word_details_id_fkey" FOREIGN KEY ("word_details_id") REFERENCES "word_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_mistakes" ADD CONSTRAINT "learning_mistakes_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_mistakes" ADD CONSTRAINT "learning_mistakes_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_contributions" ADD CONSTRAINT "content_contributions_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_contributions" ADD CONSTRAINT "content_contributions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_definitions" ADD CONSTRAINT "word_definitions_word_details_id_fkey" FOREIGN KEY ("word_details_id") REFERENCES "word_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_definitions" ADD CONSTRAINT "word_definitions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_to_word_relationships" ADD CONSTRAINT "word_to_word_relationships_from_word_id_fkey" FOREIGN KEY ("from_word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_to_word_relationships" ADD CONSTRAINT "word_to_word_relationships_to_word_id_fkey" FOREIGN KEY ("to_word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_details_relationships" ADD CONSTRAINT "word_details_relationships_from_word_details_id_fkey" FOREIGN KEY ("from_word_details_id") REFERENCES "word_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_details_relationships" ADD CONSTRAINT "word_details_relationships_to_word_details_id_fkey" FOREIGN KEY ("to_word_details_id") REFERENCES "word_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_to_word_relationships" ADD CONSTRAINT "definition_to_word_relationships_from_definition_id_fkey" FOREIGN KEY ("from_definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_to_word_relationships" ADD CONSTRAINT "definition_to_word_relationships_to_word_id_fkey" FOREIGN KEY ("to_word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_relationships" ADD CONSTRAINT "definition_relationships_from_definition_id_fkey" FOREIGN KEY ("from_definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_relationships" ADD CONSTRAINT "definition_relationships_to_definition_id_fkey" FOREIGN KEY ("to_definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_details_audio" ADD CONSTRAINT "word_details_audio_word_details_id_fkey" FOREIGN KEY ("word_details_id") REFERENCES "word_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_details_audio" ADD CONSTRAINT "word_details_audio_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_audio" ADD CONSTRAINT "definition_audio_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_audio" ADD CONSTRAINT "definition_audio_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example_audio" ADD CONSTRAINT "example_audio_example_id_fkey" FOREIGN KEY ("example_id") REFERENCES "definition_examples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example_audio" ADD CONSTRAINT "example_audio_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_translations" ADD CONSTRAINT "definition_translations_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_translations" ADD CONSTRAINT "definition_translations_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example_translations" ADD CONSTRAINT "example_translations_example_id_fkey" FOREIGN KEY ("example_id") REFERENCES "definition_examples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "example_translations" ADD CONSTRAINT "example_translations_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToList" ADD CONSTRAINT "_UserToList_A_fkey" FOREIGN KEY ("A") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToList" ADD CONSTRAINT "_UserToList_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ListToStudyGroup" ADD CONSTRAINT "_ListToStudyGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ListToStudyGroup" ADD CONSTRAINT "_ListToStudyGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
