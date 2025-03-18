-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('user', 'import', 'ai-generated');

-- CreateTable
CREATE TABLE "languages" (
    "id" UUID NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "base_language_id" UUID,
    "target_language_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" VARCHAR(255) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" VARCHAR(255),
    "profilePictureUrl" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL,
    "settings" JSONB NOT NULL,
    "study_preferences" JSONB NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audios" (
    "id" UUID NOT NULL,
    "audio" VARCHAR(255) NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" UUID NOT NULL,
    "word" VARCHAR(255) NOT NULL,
    "phonetic" VARCHAR(100),
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_word_definition" (
    "id" UUID NOT NULL,
    "definition" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_word_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_dictionary" (
    "id" UUID NOT NULL,
    "word_id" UUID NOT NULL,
    "one_word_definition_id" UUID NOT NULL,
    "base_language_id" UUID NOT NULL,
    "target_language_id" UUID NOT NULL,
    "description_base" TEXT,
    "description_target" TEXT,
    "audio_id" UUID,
    "frequency" INTEGER,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "etymology" TEXT,
    "source" "SourceType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "main_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_examples" (
    "id" UUID NOT NULL,
    "dictionary_id" UUID NOT NULL,
    "example" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dictionary_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synonyms" (
    "id" UUID NOT NULL,
    "synonym" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_synonyms" (
    "dictionary_id" UUID NOT NULL,
    "synonym_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dictionary_synonyms_pkey" PRIMARY KEY ("dictionary_id","synonym_id")
);

-- CreateTable
CREATE TABLE "user_dictionary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "main_dictionary_id" UUID NOT NULL,
    "base_language_id" UUID NOT NULL,
    "target_language_id" UUID NOT NULL,
    "custom_definition_baseLanguage" TEXT,
    "custom_definition_targetLanguage" TEXT,
    "is_learned" BOOLEAN NOT NULL DEFAULT false,
    "is_needs_review" BOOLEAN NOT NULL DEFAULT false,
    "is_difficult_to_learn" BOOLEAN NOT NULL DEFAULT false,
    "is_modified" BOOLEAN NOT NULL DEFAULT false,
    "last_reviewed_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "time_word_was_started_to_learn" TIMESTAMP(3),
    "time_word_was_learned" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dictionary_examples" (
    "id" UUID NOT NULL,
    "user_dictionary_id" UUID NOT NULL,
    "example" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_dictionary_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_synonyms" (
    "id" UUID NOT NULL,
    "synonym" TEXT NOT NULL,
    "language_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dictionary_synonyms" (
    "user_dictionary_id" UUID NOT NULL,
    "user_synonym_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_dictionary_synonyms_pkey" PRIMARY KEY ("user_dictionary_id","user_synonym_id")
);

-- CreateTable
CREATE TABLE "lists" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "base_language_id" UUID NOT NULL,
    "target_language_id" UUID NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "coverImageUrl" VARCHAR(255),
    "difficultyLevel" "DifficultyLevel" NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "last_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jsonb_data" JSONB NOT NULL DEFAULT '{}',
    "owner_id" UUID NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_words" (
    "list_id" UUID NOT NULL,
    "dictionary_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "list_words_pkey" PRIMARY KEY ("list_id","dictionary_id")
);

-- CreateTable
CREATE TABLE "user_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lists_id" UUID NOT NULL,
    "base_language_id" UUID NOT NULL,
    "target_language_id" UUID NOT NULL,
    "is_modified" BOOLEAN NOT NULL DEFAULT false,
    "custom_name_of_list" VARCHAR(255),
    "custom_description_of_list" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE INDEX "audios_language_id_idx" ON "audios"("language_id");

-- CreateIndex
CREATE UNIQUE INDEX "words_word_language_id_key" ON "words"("word", "language_id");

-- CreateIndex
CREATE INDEX "idx_main_dict_languages" ON "main_dictionary"("base_language_id", "target_language_id");

-- CreateIndex
CREATE INDEX "idx_word_lookup" ON "main_dictionary"("word_id", "base_language_id", "target_language_id");

-- CreateIndex
CREATE UNIQUE INDEX "main_dictionary_word_id_one_word_definition_id_base_languag_key" ON "main_dictionary"("word_id", "one_word_definition_id", "base_language_id", "target_language_id");

-- CreateIndex
CREATE UNIQUE INDEX "synonyms_synonym_key" ON "synonyms"("synonym");

-- CreateIndex
CREATE INDEX "idx_user_dict_learning" ON "user_dictionary"("user_id", "is_learned", "last_reviewed_at");

-- CreateIndex
CREATE INDEX "idx_user_dict_review" ON "user_dictionary"("user_id", "is_needs_review");

-- CreateIndex
CREATE INDEX "idx_user_dict_difficult" ON "user_dictionary"("user_id", "is_difficult_to_learn");

-- CreateIndex
CREATE INDEX "idx_active_words" ON "user_dictionary"("last_reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_dictionary_user_id_main_dictionary_id_key" ON "user_dictionary"("user_id", "main_dictionary_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_dictionary_examples_user_dictionary_id_example_key" ON "user_dictionary_examples"("user_dictionary_id", "example");

-- CreateIndex
CREATE UNIQUE INDEX "user_synonyms_synonym_key" ON "user_synonyms"("synonym");

-- CreateIndex
CREATE INDEX "idx_lists_language" ON "lists"("base_language_id", "target_language_id");

-- CreateIndex
CREATE INDEX "idx_list_words_order" ON "list_words"("list_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_user_lists_progress" ON "user_lists"("user_id", "progress");

-- CreateIndex
CREATE INDEX "idx_user_lists_modified" ON "user_lists"("user_id", "is_modified");

-- CreateIndex
CREATE UNIQUE INDEX "user_lists_user_id_lists_id_key" ON "user_lists"("user_id", "lists_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_base_language_id_fkey" FOREIGN KEY ("base_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "audios_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_word_definition" ADD CONSTRAINT "one_word_definition_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_dictionary" ADD CONSTRAINT "main_dictionary_audio_id_fkey" FOREIGN KEY ("audio_id") REFERENCES "audios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_dictionary" ADD CONSTRAINT "main_dictionary_one_word_definition_id_fkey" FOREIGN KEY ("one_word_definition_id") REFERENCES "one_word_definition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_dictionary" ADD CONSTRAINT "main_dictionary_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_examples" ADD CONSTRAINT "dictionary_examples_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "main_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_examples" ADD CONSTRAINT "dictionary_examples_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synonyms" ADD CONSTRAINT "synonyms_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_synonyms" ADD CONSTRAINT "dictionary_synonyms_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "main_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionary_synonyms" ADD CONSTRAINT "dictionary_synonyms_synonym_id_fkey" FOREIGN KEY ("synonym_id") REFERENCES "synonyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_base_language_id_fkey" FOREIGN KEY ("base_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_main_dictionary_id_fkey" FOREIGN KEY ("main_dictionary_id") REFERENCES "main_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary" ADD CONSTRAINT "user_dictionary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary_examples" ADD CONSTRAINT "user_dictionary_examples_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary_examples" ADD CONSTRAINT "user_dictionary_examples_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_synonyms" ADD CONSTRAINT "user_synonyms_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary_synonyms" ADD CONSTRAINT "user_dictionary_synonyms_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dictionary_synonyms" ADD CONSTRAINT "user_dictionary_synonyms_user_synonym_id_fkey" FOREIGN KEY ("user_synonym_id") REFERENCES "user_synonyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_base_language_id_fkey" FOREIGN KEY ("base_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_dictionary_id_fkey" FOREIGN KEY ("dictionary_id") REFERENCES "main_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_words" ADD CONSTRAINT "list_words_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_base_language_id_fkey" FOREIGN KEY ("base_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_lists_id_fkey" FOREIGN KEY ("lists_id") REFERENCES "lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_target_language_id_fkey" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_list_id_fkey" FOREIGN KEY ("user_list_id") REFERENCES "user_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
