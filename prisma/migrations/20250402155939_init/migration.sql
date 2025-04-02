-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'phrasal_verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ai-generated', 'merriam_learners', 'merriam_intermediate', 'user');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('notStarted', 'inProgress', 'learned', 'needsReview', 'difficult');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('review', 'newLearning', 'practice', 'test', 'spaced');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('en', 'ru', 'da', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('synonym', 'antonym', 'related', 'composition', 'plural_en');

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
    "role" VARCHAR(255) NOT NULL,
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
CREATE TABLE "words" (
    "id" SERIAL NOT NULL,
    "word" VARCHAR(255) NOT NULL,
    "phonetic" VARCHAR(100),
    "audio" VARCHAR(255),
    "etymology" TEXT,
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "additionalInfo" JSONB DEFAULT '{}',
    "language_code" "LanguageCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_definitions" (
    "word_id" INTEGER NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_definitions_pkey" PRIMARY KEY ("word_id","definition_id")
);

-- CreateTable
CREATE TABLE "word_relationships" (
    "from_word_id" INTEGER NOT NULL,
    "to_word_id" INTEGER NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_relationships_pkey" PRIMARY KEY ("from_word_id","to_word_id","relationship_type")
);

-- CreateTable
CREATE TABLE "definitions" (
    "id" SERIAL NOT NULL,
    "definition" TEXT NOT NULL,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "plural" BOOLEAN NOT NULL DEFAULT false,
    "frequency_using" SMALLINT NOT NULL DEFAULT 0,
    "image_id" INTEGER,
    "source" "SourceType" NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "definition_examples" (
    "id" SERIAL NOT NULL,
    "example" TEXT NOT NULL,
    "audio" VARCHAR(255),
    "language_code" "LanguageCode" NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "definition_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phrases" (
    "id" SERIAL NOT NULL,
    "phrase" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phrase_examples" (
    "id" SERIAL NOT NULL,
    "example" TEXT NOT NULL,
    "audio" VARCHAR(255),
    "language_code" "LanguageCode" NOT NULL,
    "phrase_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phrase_examples_pkey" PRIMARY KEY ("id")
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
    "difficultyLevel" "DifficultyLevel" NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "learned_word_count" INTEGER NOT NULL DEFAULT 0,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "list_words" (
    "list_id" UUID NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "list_words_pkey" PRIMARY KEY ("list_id","definition_id")
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
CREATE TABLE "user_list_words" (
    "user_list_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "user_dictionary_id" UUID NOT NULL,

    CONSTRAINT "user_list_words_pkey" PRIMARY KEY ("user_list_id","user_dictionary_id")
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
CREATE TABLE "user_dictionary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "definition_id" INTEGER NOT NULL,
    "base_language_code" "LanguageCode" NOT NULL,
    "target_language_code" "LanguageCode" NOT NULL,
    "custom_definition_base" TEXT,
    "custom_definition_target" TEXT,
    "custom_difficulty_level" "DifficultyLevel",
    "customEtymology" TEXT,
    "is_modified" BOOLEAN NOT NULL DEFAULT false,
    "learning_status" "LearningStatus" NOT NULL DEFAULT 'notStarted',
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "time_word_was_started_to_learn" TIMESTAMP(3),
    "time_word_was_learned" TIMESTAMP(3),
    "next_review_due" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_of_mistakes" INTEGER NOT NULL DEFAULT 0,
    "correct_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PhraseToWord" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PhraseToWord_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserToList" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_UserToList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE INDEX "idx_word_search" ON "words"("word");

-- CreateIndex
CREATE INDEX "idx_word_language" ON "words"("language_code");

-- CreateIndex
CREATE INDEX "idx_word_difficulty" ON "words"("difficulty_level");

-- CreateIndex
CREATE UNIQUE INDEX "words_word_language_code_key" ON "words"("word", "language_code");

-- CreateIndex
CREATE INDEX "idx_word_definition_word" ON "word_definitions"("word_id");

-- CreateIndex
CREATE INDEX "idx_word_definition_def" ON "word_definitions"("definition_id");

-- CreateIndex
CREATE INDEX "idx_word_relationship_from" ON "word_relationships"("from_word_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_word_relationship_to" ON "word_relationships"("to_word_id", "relationship_type");

-- CreateIndex
CREATE INDEX "idx_definition_pos" ON "definitions"("part_of_speech");

-- CreateIndex
CREATE INDEX "idx_definition_frequency" ON "definitions"("frequency_using");

-- CreateIndex
CREATE INDEX "idx_definition_example_def" ON "definition_examples"("definition_id");

-- CreateIndex
CREATE INDEX "idx_definition_example_lang" ON "definition_examples"("language_code");

-- CreateIndex
CREATE INDEX "idx_phrase_language" ON "phrases"("language_code");

-- CreateIndex
CREATE INDEX "idx_phrase_example_phrase" ON "phrase_examples"("phrase_id");

-- CreateIndex
CREATE INDEX "idx_phrase_example_lang" ON "phrase_examples"("language_code");

-- CreateIndex
CREATE INDEX "idx_lists_language" ON "lists"("base_language_code", "target_language_code");

-- CreateIndex
CREATE INDEX "idx_list_difficulty" ON "lists"("difficultyLevel");

-- CreateIndex
CREATE INDEX "idx_public_lists" ON "lists"("is_public", "base_language_code", "target_language_code");

-- CreateIndex
CREATE INDEX "idx_list_words_order" ON "list_words"("list_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_user_lists_progress" ON "user_lists"("user_id", "progress");

-- CreateIndex
CREATE INDEX "idx_user_lists_modified" ON "user_lists"("user_id", "is_modified");

-- CreateIndex
CREATE INDEX "idx_user_lists_created_at" ON "user_lists"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_lists_user_id_list_id_key" ON "user_lists"("user_id", "list_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_sessions_by_date" ON "user_learning_sessions"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_user_sessions_by_type" ON "user_learning_sessions"("user_id", "session_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_items_session_id_user_dictionary_id_key" ON "user_session_items"("session_id", "user_dictionary_id");

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
CREATE UNIQUE INDEX "user_dictionary_user_id_definition_id_key" ON "user_dictionary"("user_id", "definition_id");

-- CreateIndex
CREATE INDEX "_PhraseToWord_B_index" ON "_PhraseToWord"("B");

-- CreateIndex
CREATE INDEX "_UserToList_B_index" ON "_UserToList"("B");

-- AddForeignKey
ALTER TABLE "word_definitions" ADD CONSTRAINT "word_definitions_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_definitions" ADD CONSTRAINT "word_definitions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_relationships" ADD CONSTRAINT "word_relationships_from_word_id_fkey" FOREIGN KEY ("from_word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_relationships" ADD CONSTRAINT "word_relationships_to_word_id_fkey" FOREIGN KEY ("to_word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definitions" ADD CONSTRAINT "definitions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "definition_examples" ADD CONSTRAINT "definition_examples_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phrase_examples" ADD CONSTRAINT "phrase_examples_phrase_id_fkey" FOREIGN KEY ("phrase_id") REFERENCES "phrases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_list_id_fkey" FOREIGN KEY ("user_list_id") REFERENCES "user_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhraseToWord" ADD CONSTRAINT "_PhraseToWord_A_fkey" FOREIGN KEY ("A") REFERENCES "phrases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhraseToWord" ADD CONSTRAINT "_PhraseToWord_B_fkey" FOREIGN KEY ("B") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToList" ADD CONSTRAINT "_UserToList_A_fkey" FOREIGN KEY ("A") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToList" ADD CONSTRAINT "_UserToList_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
