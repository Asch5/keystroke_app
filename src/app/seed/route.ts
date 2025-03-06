// import bcryptjs from 'bcryptjs';
// import { db } from '@vercel/postgres';
// import {
//     users,
//     languages,
//     audio,
//     words,
//     oneWordDefinitions,
//     mainDictionary,
//     dictionaryExamples,
//     synonyms,
//     dictionarySynonyms,
//     userDictionary,
//     lists,
//     listWords,
//     userLists,
//     userListWords,
//     userDictionaryExamples,
//     userDictionarySynonyms,
//     userSynonyms,
// } from '../../lib/placeholder-data';
// import { User } from '@/types/databaseTypes';
// const client = await db.connect();

// // Create enum types
// async function createEnumTypes() {
//     // Create difficulty_level enum
//     await client.sql`
//         DO $$
//         BEGIN
//             IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
//                 CREATE TYPE difficulty_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
//             END IF;
//         END$$;
//     `;

//     // Create part_of_speech enum
//     await client.sql`
//         DO $$
//         BEGIN
//             IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'part_of_speech') THEN
//                 CREATE TYPE part_of_speech AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'preposition');
//             END IF;
//         END$$;
//     `;

//     // Create source_type enum
//     await client.sql`
//         DO $$
//         BEGIN
//             IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
//                 CREATE TYPE source_type AS ENUM ('user', 'import', 'ai-generated');
//             END IF;
//         END$$;
//     `;
// }

// // Languages Table
// async function seedLanguages() {
//     await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS languages (
//             id UUID PRIMARY KEY,
//             code VARCHAR(5) UNIQUE NOT NULL,
//             name VARCHAR(50) NOT NULL,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//     `;

//     const insertedLanguages = await Promise.all(
//         languages.map(
//             (language) => client.sql`
//             INSERT INTO languages (id, code, name, created_at)
//             VALUES (${language.id}, ${language.code}, ${
//                 language.name
//             }, ${language.created_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedLanguages;
// }

// // Users Table
// async function seedUsers() {
//     await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
//     await client.sql`
//     CREATE TABLE IF NOT EXISTS users (
//       id UUID PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       email VARCHAR(255) NOT NULL,
//       password VARCHAR(255) NOT NULL,
//       base_language_id UUID REFERENCES languages(id),
//       target_language_id UUID REFERENCES languages(id),
//       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       lastLogin TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       role VARCHAR(255) NOT NULL,
//       isVerified BOOLEAN NOT NULL DEFAULT FALSE,
//       verificationToken VARCHAR(255),
//       profilePictureUrl VARCHAR(255),
//       status VARCHAR(255) NOT NULL,
//       settings JSONB NOT NULL,
//       study_preferences JSONB NOT NULL,
//       deleted_at TIMESTAMP
//     );
//   `;

//     // Create index for user activity tracking
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_last_login ON users(lastLogin);
//     `;

//     const insertedUsers = await Promise.all(
//         users.map(async (user: User) => {
//             const hashedPassword = await bcryptjs.hash(user.password, 10);
//             return client.sql`
//         INSERT INTO users (id, name, email, password, base_language_id, target_language_id, role, isVerified, verificationToken, profilePictureUrl, status, settings, study_preferences)
//                 VALUES (${user.id}, ${user.name}, ${
//                 user.email
//             }, ${hashedPassword}, ${user.base_language_id}, ${
//                 user.target_language_id
//             }, ${user.role}, ${user.isVerified}, ${user.verificationToken}, ${
//                 user.profilePictureUrl
//             }, ${user.status}, ${JSON.stringify(
//                 user.settings
//             )}::jsonb, ${JSON.stringify(user.study_preferences)}::jsonb)
//         ON CONFLICT (id) DO NOTHING;
//       `;
//         })
//     );

//     return insertedUsers;
// }

// // Audio Table
// async function seedAudio() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS audios (
//             id UUID PRIMARY KEY,
//             audio VARCHAR(255) NOT NULL,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//     `;

//     // Create index for audio management
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_audio_language ON audios(language_id);
//     `;

//     const insertedAudio = await Promise.all(
//         audio.map(
//             (a) => client.sql`
//             INSERT INTO audios (id, audio, language_id, created_at)
//             VALUES (${a.id}, ${a.audio}, ${
//                 a.language_id
//             }, ${a.created_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedAudio;
// }

// // Word Table
// async function seedWords() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS words (
//             id UUID PRIMARY KEY,
//             word VARCHAR(255) NOT NULL,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//     `;

//     const insertedWords = await Promise.all(
//         words.map(
//             (word) => client.sql`
//             INSERT INTO words (id, word, language_id, created_at)
//             VALUES (${word.id}, ${word.word}, ${
//                 word.language_id
//             }, ${word.created_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedWords;
// }

// // One Word Definition Table
// async function seedOneWordDefinitions() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS one_word_definition (
//             id UUID PRIMARY KEY,
//             definition TEXT NOT NULL,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//     `;

//     const insertedDefinitions = await Promise.all(
//         oneWordDefinitions.map(
//             (def) => client.sql`
//             INSERT INTO one_word_definition (id, definition, language_id, created_at)
//             VALUES (${def.id}, ${def.definition}, ${
//                 def.language_id
//             }, ${def.created_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedDefinitions;
// }

// // Main Dictionary Table
// async function seedMainDictionary() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS main_dictionary (
//             id UUID PRIMARY KEY,
//             word_id UUID NOT NULL REFERENCES words(id),
//             one_word_definition_id UUID NOT NULL REFERENCES one_word_definition(id),
//             base_language_id UUID REFERENCES languages(id),
//             target_language_id UUID REFERENCES languages(id),
//             description_base TEXT,
//             description_target TEXT,
//             audio_id UUID REFERENCES audios(id),
//             frequency INTEGER,
//             part_of_speech part_of_speech,
//             phonetic VARCHAR(100),
//             difficulty_level difficulty_level,
//             etymology TEXT,
//             source source_type,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP,
//             UNIQUE(word_id, one_word_definition_id, base_language_id, target_language_id)
//         );
//     `;

//     // Create indexes
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_main_dict_languages
//         ON main_dictionary(base_language_id, target_language_id);
//     `;

//     // Create extension for fuzzy search
//     await client.sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;

//     // Create index for fuzzy search
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_main_dict_word_search
//         ON main_dictionary USING gin((word_id::text) gin_trgm_ops);
//     `;

//     // Create covering index for frequent lookups
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_word_lookup
//         ON main_dictionary(word_id, base_language_id, target_language_id)
//         INCLUDE (one_word_definition_id);
//     `;

//     const insertedDictionary = await Promise.all(
//         mainDictionary.map(
//             (dict) => client.sql`
//             INSERT INTO main_dictionary (
//                 id, word_id, one_word_definition_id, base_language_id, target_language_id,
//                 description_base, description_target, audio_id, frequency, part_of_speech,
//                 phonetic, difficulty_level, etymology, source, created_at, updated_at
//             )
//             VALUES (
//                 ${dict.id}, ${dict.word_id}, ${dict.one_word_definition_id},
//                 ${dict.base_language_id}, ${dict.target_language_id},
//                 ${dict.description_base}, ${dict.description_target},
//                 ${dict.audio_id}, ${dict.frequency}, ${
//                 dict.part_of_speech
//             }::part_of_speech,
//                 ${dict.phonetic}, ${dict.difficulty_level}::difficulty_level,
//                 ${dict.etymology}, ${dict.source}::source_type,
//                 ${dict.created_at.toISOString()}, ${dict.updated_at.toISOString()}
//             )
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedDictionary;
// }

// // Dictionary Examples Table
// async function seedDictionaryExamples() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS dictionary_examples (
//             id UUID PRIMARY KEY,
//             dictionary_id UUID NOT NULL REFERENCES main_dictionary(id),
//             example TEXT NOT NULL,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP
//         );
//     `;

//     const insertedExamples = await Promise.all(
//         dictionaryExamples.map(
//             (example) => client.sql`
//             INSERT INTO dictionary_examples (id, dictionary_id, example, language_id, created_at, updated_at)
//             VALUES (${example.id}, ${example.dictionary_id}, ${
//                 example.example
//             }, ${
//                 example.language_id
//             }, ${example.created_at.toISOString()}, ${example.updated_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedExamples;
// }

// // Synonyms Table
// async function seedSynonyms() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS synonyms (
//             id UUID PRIMARY KEY,
//             synonym TEXT NOT NULL UNIQUE,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP
//         );
//     `;

//     const insertedSynonyms = await Promise.all(
//         synonyms.map(
//             (synonym) => client.sql`
//             INSERT INTO synonyms (id, synonym, language_id, created_at, updated_at)
//             VALUES (${synonym.id}, ${synonym.synonym}, ${
//                 synonym.language_id
//             }, ${synonym.created_at.toISOString()}, ${synonym.updated_at.toISOString()})
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedSynonyms;
// }

// // Dictionary Synonyms Table
// async function seedDictionarySynonyms() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS dictionary_synonyms (
//             dictionary_id UUID NOT NULL REFERENCES main_dictionary(id),
//             synonym_id UUID NOT NULL REFERENCES synonyms(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP,
//             PRIMARY KEY (dictionary_id, synonym_id)
//         );
//     `;

//     const insertedDictionarySynonyms = await Promise.all(
//         dictionarySynonyms.map(
//             (ds) => client.sql`
//             INSERT INTO dictionary_synonyms (dictionary_id, synonym_id, created_at, updated_at)
//             VALUES (${ds.dictionary_id}, ${
//                 ds.synonym_id
//             }, ${ds.created_at.toISOString()}, ${ds.updated_at.toISOString()})
//             ON CONFLICT (dictionary_id, synonym_id) DO NOTHING;
//         `
//         )
//     );

//     return insertedDictionarySynonyms;
// }

// // User Dictionary Table
// async function seedUserDictionary() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_dictionary (
//             id UUID PRIMARY KEY,
//             user_id UUID REFERENCES users(id),
//             main_dictionary_id UUID REFERENCES main_dictionary(id),
//             base_language_id UUID REFERENCES languages(id),
//             target_language_id UUID REFERENCES languages(id),
//             custom_definition_baseLanguage TEXT,
//             custom_definition_targetLanguage TEXT,
//             is_learned BOOLEAN NOT NULL DEFAULT FALSE,
//             is_needs_review BOOLEAN NOT NULL DEFAULT FALSE,
//             is_difficult_to_learn BOOLEAN NOT NULL DEFAULT FALSE,
//             is_modified BOOLEAN NOT NULL DEFAULT FALSE,
//             last_reviewed_at TIMESTAMP,
//             review_count INTEGER DEFAULT 0,
//             time_word_was_started_to_learn TIMESTAMP,
//             time_word_was_learned TIMESTAMP,
//             progress FLOAT DEFAULT 0,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP,
//             jsonb_data JSONB DEFAULT '{}'::jsonb,
//             UNIQUE (user_id, main_dictionary_id)
//         );
//     `;

//     // Create indexes
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_dict_learning
//         ON user_dictionary(user_id, is_learned, last_reviewed_at);
//     `;

//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_dict_review
//         ON user_dictionary(user_id, is_needs_review);
//     `;

//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_dict_difficult
//         ON user_dictionary(user_id, is_difficult_to_learn);
//     `;

//     // Partial index for active words
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_active_words
//         ON user_dictionary(last_reviewed_at)
//         WHERE is_learned = false;
//     `;

//     const insertedUserDictionary = await Promise.all(
//         userDictionary.map(
//             (ud) => client.sql`
//             INSERT INTO user_dictionary (
//                 id, user_id, main_dictionary_id, base_language_id, target_language_id,
//                 is_learned, is_needs_review, is_difficult_to_learn, is_modified,
//                 review_count, time_word_was_started_to_learn, progress,
//                 created_at, updated_at, jsonb_data
//             )
//             VALUES (
//                 ${ud.id}, ${ud.user_id}, ${ud.main_dictionary_id}, ${
//                 ud.base_language_id
//             }, ${ud.target_language_id},
//                 ${ud.is_learned}, ${ud.is_needs_review}, ${
//                 ud.is_difficult_to_learn
//             }, ${ud.is_modified},
//                 ${
//                     ud.review_count
//                 }, ${ud.time_word_was_started_to_learn.toISOString()}, ${
//                 ud.progress
//             },
//                 ${ud.created_at.toISOString()}, ${ud.updated_at.toISOString()}, ${JSON.stringify(
//                 ud.jsonb_data
//             )}::jsonb
//             )
//             ON CONFLICT (user_id, main_dictionary_id) DO NOTHING;
//         `
//         )
//     );

//     return insertedUserDictionary;
// }

// // User Dictionary Examples Table
// async function seedUserDictionaryExamples() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_dictionary_examples (
//             id UUID PRIMARY KEY,
//             user_dictionary_id UUID,
//             example TEXT NOT NULL,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP,
//             UNIQUE (user_dictionary_id, example),
//             FOREIGN KEY (user_dictionary_id)
//             REFERENCES user_dictionary(id)
//         );
//     `;

//     const insertedUserDictionaryExamples = await Promise.all(
//         userDictionaryExamples.map(
//             (ud) => client.sql`
//             INSERT INTO user_dictionary_examples (id, user_dictionary_id, example, language_id, created_at, updated_at)
//             VALUES ( ${ud.id}, ${ud.user_dictionary_id}, ${ud.example}, ${
//                 ud.language_id
//             }, ${ud.created_at.toISOString()}, ${ud.updated_at.toISOString()})
//         `
//         )
//     );
//     return insertedUserDictionaryExamples;
// }

// // User Synonyms Table
// async function seedUserSynonyms() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_synonyms (
//             id UUID PRIMARY KEY,
//             synonym TEXT NOT NULL UNIQUE,
//             language_id UUID REFERENCES languages(id),
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP
//         );
//     `;

//     const insertedUserSynonyms = await Promise.all(
//         userSynonyms.map(
//             (us) => client.sql`
//             INSERT INTO user_synonyms (id, synonym, language_id, created_at, updated_at)
//             VALUES (${us.id}, ${us.synonym}, ${
//                 us.language_id
//             }, ${us.created_at.toISOString()}, ${us.updated_at.toISOString()})
//         `
//         )
//     );

//     return insertedUserSynonyms;
// }

// // User Dictionary Synonyms Table
// async function seedUserDictionarySynonyms() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_dictionary_synonyms (
//             user_dictionary_id UUID,
//             user_synonym_id UUID,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             deleted_at TIMESTAMP,
//             PRIMARY KEY (user_dictionary_id, user_synonym_id),
//             FOREIGN KEY (user_dictionary_id)
//             REFERENCES user_dictionary(id),
//             FOREIGN KEY (user_synonym_id)
//             REFERENCES user_synonyms(id)
//         );
//     `;

//     const insertedUserDictionarySynonyms = await Promise.all(
//         userDictionarySynonyms.map(
//             (ud) => client.sql`
//             INSERT INTO user_dictionary_synonyms (user_dictionary_id, user_synonym_id, created_at, updated_at)
//             VALUES (${ud.user_dictionary_id}, ${
//                 ud.user_synonym_id
//             }, ${ud.created_at.toISOString()}, ${ud.updated_at.toISOString()})
//         `
//         )
//     );

//     return insertedUserDictionarySynonyms;
// }

// // Lists Table
// async function seedLists() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS lists (
//             id UUID PRIMARY KEY,
//             name VARCHAR(255) NOT NULL,
//             description TEXT,
//             base_language_id UUID REFERENCES languages(id),
//             target_language_id UUID REFERENCES languages(id),
//             is_public BOOLEAN NOT NULL DEFAULT FALSE,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             tags TEXT[],
//             coverImageUrl VARCHAR(255),
//             difficultyLevel difficulty_level,
//             wordCount INTEGER DEFAULT 0,
//             last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             jsonb_data JSONB DEFAULT '{}'::jsonb,
//             owner_id UUID REFERENCES users(id),
//             deleted_at TIMESTAMP
//         );
//     `;

//     // Create indexes
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_lists_language
//         ON lists(base_language_id, target_language_id);
//     `;

//     const insertedLists = await Promise.all(
//         lists.map(
//             (list) => client.sql`
//             INSERT INTO lists (
//                 id, name, description, base_language_id, target_language_id,
//                 is_public, created_at, updated_at, tags, coverImageUrl,
//                 difficultyLevel, wordCount, last_modified, jsonb_data, owner_id
//             )
//             VALUES (
//                 ${list.id}, ${list.name}, ${list.description}, ${
//                 list.base_language_id
//             }, ${list.target_language_id},
//                 ${
//                     list.is_public
//                 }, ${list.created_at.toISOString()}, ${list.updated_at.toISOString()}, ARRAY[${list.tags
//                 .map((tag) => `'${tag}'`)
//                 .join(', ')}]::text[], ${list.coverImageUrl},
//                 ${list.difficultyLevel}::difficulty_level, ${
//                 list.wordCount
//             }, ${list.last_modified.toISOString()},
//                 ${JSON.stringify(list.jsonb_data)}::jsonb, ${list.owner_id}
//             )
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedLists;
// }

// // List Words Table
// async function seedListWords() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS list_words (
//             list_id UUID REFERENCES lists(id),
//             dictionary_id UUID REFERENCES main_dictionary(id),
//             order_index INTEGER,
//             PRIMARY KEY (list_id, dictionary_id)
//         );
//     `;

//     // Create indexes
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_list_words_order
//         ON list_words(list_id, order_index);
//     `;

//     const insertedListWords = await Promise.all(
//         listWords.map(
//             (lw) => client.sql`
//             INSERT INTO list_words (list_id, dictionary_id, order_index)
//             VALUES (${lw.list_id}, ${lw.dictionary_id}, ${lw.order_index})
//             ON CONFLICT (list_id, dictionary_id) DO NOTHING;
//         `
//         )
//     );

//     return insertedListWords;
// }

// // User Lists Table
// async function seedUserLists() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_lists (
//             id UUID PRIMARY KEY,
//             user_id UUID REFERENCES users(id),
//             lists_id UUID REFERENCES lists(id),
//             base_language_id UUID REFERENCES languages(id),
//             target_language_id UUID REFERENCES languages(id),
//             is_modified BOOLEAN DEFAULT FALSE,
//             custom_name_of_list VARCHAR(255),
//             custom_description_of_list TEXT,
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//             custom_difficulty difficulty_level,
//             progress FLOAT DEFAULT 0,
//             jsonb_data JSONB DEFAULT '{}'::jsonb,
//             deleted_at TIMESTAMP,
//             UNIQUE (user_id, lists_id)
//         );
//     `;

//     // Create indexes
//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_lists_progress
//         ON user_lists(user_id, progress);
//     `;

//     await client.sql`
//         CREATE INDEX IF NOT EXISTS idx_user_lists_modified
//         ON user_lists(user_id, is_modified);
//     `;

//     const insertedUserLists = await Promise.all(
//         userLists.map(
//             (ul) => client.sql`
//             INSERT INTO user_lists (
//                 id, user_id, lists_id, base_language_id, target_language_id,
//                 is_modified, custom_name_of_list, custom_description_of_list,
//                 created_at, updated_at, custom_difficulty, progress, jsonb_data
//             )
//             VALUES (
//                 ${ul.id}, ${ul.user_id}, ${ul.lists_id}, ${
//                 ul.base_language_id
//             }, ${ul.target_language_id},
//                 ${ul.is_modified}, ${ul.custom_name_of_list}, ${
//                 ul.custom_description_of_list
//             },
//                 ${ul.created_at.toISOString()}, ${ul.updated_at.toISOString()}, ${
//                 ul.custom_difficulty
//             }::difficulty_level,
//                 ${ul.progress}, ${JSON.stringify(ul.jsonb_data)}::jsonb
//             )
//             ON CONFLICT (id) DO NOTHING;
//         `
//         )
//     );

//     return insertedUserLists;
// }

// // User List Words Table
// async function seedUserListWords() {
//     await client.sql`
//         CREATE TABLE IF NOT EXISTS user_list_words (
//             user_list_id UUID REFERENCES user_lists(id),
//             dictionary_id UUID REFERENCES main_dictionary(id),
//             order_index INTEGER,
//             PRIMARY KEY (user_list_id, dictionary_id)
//         );
//     `;

//     const insertedUserListWords = await Promise.all(
//         userListWords.map(
//             (ulw) => client.sql`
//             INSERT INTO user_list_words (user_list_id, dictionary_id, order_index)
//             VALUES (${ulw.user_list_id}, ${ulw.dictionary_id}, ${ulw.order_index})
//             ON CONFLICT (user_list_id, dictionary_id) DO NOTHING;
//         `
//         )
//     );

//     return insertedUserListWords;
// }

// export async function GET() {
//     return Response.json({
//         message:
//             'Uncomment this file and remove this line. You can delete this file when you are finished.',
//     });
//     try {
//         await client.sql`BEGIN`;

//         await createEnumTypes();
//         await seedLanguages();
//         await seedUsers();
//         await seedAudio();
//         await seedWords();
//         await seedOneWordDefinitions();
//         await seedMainDictionary();
//         await seedDictionaryExamples();
//         await seedSynonyms();
//         await seedDictionarySynonyms();
//         await seedUserDictionary();
//         await seedUserDictionaryExamples();
//         await seedUserSynonyms();
//         await seedUserDictionarySynonyms();
//         await seedLists();
//         await seedListWords();
//         await seedUserLists();
//         await seedUserListWords();

//         await client.sql`COMMIT`;
//         return Response.json({ message: 'Database seeded successfully' });
//     } catch (error) {
//         await client.sql`ROLLBACK`;
//         console.error('Error seeding database:', error);
//         return Response.json(
//             { error: (error as Error).message },
//             { status: 500 }
//         );
//     }
// }
