<!-- _Draft_
• User wants to learn to type new words
• User wants to type on a keyboard fast
• User wants to learn new words
• User wants to add his words to his dictionary
• User wants to create different lists of words
• User wants to listen to pronunciation of word
• Each word has to have its card
• Each card has sections:
a. Short definition
b. Thorough definition
c. Pronunciation
d. 3 examples - sentences of using the word
e. Synonyms of this word
• User can add words by .xls file or using something similar
• User can add word through a user interface by using a special input
• All words are keeping in the general dictionary
• When user add some word the system check this word if the word already exists in the dictionary the word just is added to the user dictionary for learning. If the word does not exist in this case the new word is handled by system (1. a new card is created 2. The card is filled up by AI agent by using API request to the AI system. 3. Then the card is saved in the general dictionary and this card connects to the user's dictionary as well)
• User can learn word from his dictionary directly of from special lists that are created from the user's dictionary
• User has his profile and a dashboard where comprise information about his dictionary, lists and statistics
======================================

_User Story: User gets to a greeting page at the first time
Acceptance Criteria:_

1. The app has a greeting page
2. The greeting page has a description of the app and a button to start the registration
3. The button to start the registration is visible only if the user is not logged in
4. If the user is logged in the greeting page is not visible and the user is redirected to the dashboard

======================================

_User Story: User while registstration or in his profile has to choose a native language and a language that he wants to learn
Acceptance Criteria:_

1. The app has a registration page
2. The registration page has a form with fields for name, email, password, list of native language and list of language to learn
3. The form has a submit button
4. When the form is submitted, the app validates the form data
5. If the form is valid, the app creates a new user in the database
6. If the form is invalid, the app displays an error message

Database (actions on the database):

======================================

_User Story: User can change his native language and language to learn in his profile
Acceptance Criteria:_

1. The app has a profile page
2. The profile page has a form with options for native language and language to learn
3. The form has a submit button
4. When the form is submitted, the app validates the form data
5. If the form is valid, the app updates the user's native language and language to learn in the database
6. If the form is invalid, the app displays an error message

======================================

_User Story: User can add words by .xls file or using something similar
Acceptance Criteria:_

1. The app provides an "Import Words" button on the Dictionary page
2. Clicking "Import Words" opens a file selection dialog
3. The file selection dialog filters for .xls, .xlsx, and .csv file types
4. Upon selecting a file, the app validates the file format and structure
   - The file must be a valid Excel or CSV file
   - The file must contain a header row with "Word" and "Definition" columns
   - Additional columns like "Examples" and "Synonyms" are optional
     VALIDATION:
   - The file must contain a header row with "Word" and "Definition" columns
   - Additional columns like "Examples" and "Synonyms" are optional
   - The file must be a valid Excel or CSV file
   - The first word in the word column must be a language to learn
   - The first definition in the definition column must be a native language
5. If validation fails, the app displays an error message specifying the issue
6. If validation succeeds, the app creates a array of objects with the following fields: {word: string, definition: string, examples: string[], synonyms: string[], nativeLanguage: string, languageToLearn: string}
   then the app checks if the word && definition already exists in the main dictionary these wards are sent to the user's dictionary then the remaining objects (without word && definition) are handled by the AI agent to create a new card for the word before handling the next word-object the AI agent checks the consistentcy of the paire word && definition
   if the pair is consistent the AI agent creates a new card for the word and
   if the pair is inconsistent the AI agent skips the word-object and goes to the next word-object
   if the array is empty the app displays a message that the file is empty
   after the AI agent handles all word-objects the app sent new words to the main dictionary and the user's dictionary
7. After import, the app displays a success message with the number of words added and the list of words that were added
8. The user is redirected to their updated Dictionary page

======================================

_User Story: User can add words by using a user interface
Acceptance Criteria:_

1. The app has a "Add Word" button on the Dictionary page
2. Clicking "Add Word" opens a modal
3. The modal has a form with fields for word, definition, examples and synonyms
4. The form has a submit button
5. When the form is submitted, the app validates the form data
6. If the form is valid, the app creates a new word entry in the main dictionary and the user's dictionary
7. If the form is invalid, the app displays an error message

======================================

_User Story: User can learn word from his dictionary directly or from special lists
Acceptance Criteria:_

1. The Dictionary page has a "Practice" button
   Clicking "Practice" starts a flashcard session with all words from the dictionary
   Each flashcard shows the word on the front and definition on the back
   User can flip the card to see the definition
   User can mark the word as "Learned" or "Needs Review" after each card
   The flashcard session ends when all cards have been reviewed
2. Learned/Needs Review status for each word is saved
   The Word Lists page shows all custom lists created by the user
   Each list has a "Practice" button to start a flashcard session with those words
   Flashcard functionality for list sessions matches the dictionary sessions
   Completing a list session updates the Learned/Needs Review status on the words
   User Story: User has his profile and a dashboard
   Acceptance Criteria:
   The app has a Profile page accessible from the main navigation
   The Profile page displays the user's name, email, and profile picture
   The Profile page has fields to update name, email, and password
   Updating profile details requires the user to enter their current password
   The app has a Dashboard page accessible from the main navigation
   The Dashboard shows key stats:
   Total words in dictionary
   Number of words Learned vs Needs Review
   Flashcard practice sessions completed
   Typing practice WPM (words per minute) high score
   The Dashboard has quick links to:
   Add New Word
   Start Dictionary Flashcards
   Start Typing Practice
   The Dashboard shows a list of Recently Added Words
3. The Dashboard shows suggestions for Words to Review

======================================

1. Core Dictionary System:

   - Word input form + AI card generation
   - Basic dictionary display
   - Excel import/export

2. Practice Modules:

   - Typing interface
   - Pronunciation player
   - Flashcard system

3. Advanced Features:
   - Word lists management
   - User progress tracking
   - Social sharing features

// ... existing user stories and core features ...

### Technical Architecture

**Frontend:**

- Next.js 14 (App Router)
- **State Management:** Redux Toolkit with these key stores:
  - `userSlice`: Manages authentication, user preferences, and progress
  - `dictionarySlice`: Handles word cards, AI generation status, and dictionary operations
  - `wordListsSlice`: Controls custom lists and practice sessions
  - `practiceSlice`: Tracks typing exercises and pronunciation progress
  - `uiSlice`: Manages modals and loading states

**Redux Middleware:**

- `redux-thunk` for async operations (API calls, AI processing)
- `redux-persist` for local storage of user data
- Custom middleware for API error handling

// ... existing backend and AI sections ...

### Implementation Strategy

1. **Redux Store Configuration:**
   - Create a `store.ts` file to configure the Redux store

Backend: Next.js API routes + PostgreSQL
// ... existing technical architecture ...

**AI System:**

- DeepSeek API for:
  - Word card generation (definitions/examples/synonyms)
  - Context-aware word explanations
  - Sentence generation
- Text-to-speech service for pronunciation
- Rate limiting strategy for API calls
- Fallback mechanism for API failures

### AI Integration Strategy

1. **DeepSeek Service Module:**
   Testing: Cypress for E2E, Jest for unit tests

APIs:

- DeepSeek API for word card generation
- Text-to-speech service for pronunciation
- Rate limiting strategy for API calls
- Fallback mechanism for API failures

as example:

1. https://api.dictionaryapi.dev/api/v2/entries/en/<word>
2. https://www.dictionaryapi.com/products/index

API for images:

1. https://api.pexels.com/v1/search?query=nature&orientation=portrait&size=small&locale=en-US

===================================

Tables:

one audio can be used in many main_dictionary records

one main_dictionary record can have many synonyms
one synonym can be used in many main_dictionary records

one main_dictionary record can have many examples
one word can be used in many main_dictionary records
one one_word_definition can be used in many main_dictionary records

psql $DATABASE_URL

# Database Tables

# Database Tables

## Languages Table

| Column     | Type        | Constraints               |
| ---------- | ----------- | ------------------------- |
| id         | UUID        | PRIMARY KEY               |
| code       | VARCHAR(5)  | UNIQUE NOT NULL           |
| name       | VARCHAR(50) | NOT NULL                  |
| created_at | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- None

---

## Users Table

| Column             | Type         | Constraints                        |
| ------------------ | ------------ | ---------------------------------- |
| id                 | UUID         | PRIMARY KEY                        |
| name               | VARCHAR(255) | NOT NULL                           |
| email              | VARCHAR(255) | NOT NULL                           |
| password           | VARCHAR(255) | NOT NULL                           |
| base_language_id   | UUID         | REFERENCES languages(id)           |
| target_language_id | UUID         | REFERENCES languages(id)           |
| created_at         | TIMESTAMP    | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| updated_at         | TIMESTAMP    | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| lastLogin          | TIMESTAMP    | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| role               | VARCHAR(255) | NOT NULL                           |
| isVerified         | BOOLEAN      | NOT NULL DEFAULT FALSE             |
| verificationToken  | VARCHAR(255) |                                    |
| profilePictureUrl  | VARCHAR(255) |                                    |
| status             | VARCHAR(255) | NOT NULL                           |
| settings           | JSONB        | NOT NULL                           |
| study_preferences  | JSONB        | NOT NULL                           |
| deleted_at         | TIMESTAMP    |                                    |

### Indexes

- `idx_user_last_login` on `lastLogin`

---

## Audios Table

| Column      | Type         | Constraints               |
| ----------- | ------------ | ------------------------- |
| id          | UUID         | PRIMARY KEY               |
| audio       | VARCHAR(255) | NOT NULL                  |
| language_id | UUID         | REFERENCES languages(id)  |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- `idx_audio_language` on `language_id`

---

## Words Table

| Column      | Type         | Constraints               |
| ----------- | ------------ | ------------------------- |
| id          | UUID         | PRIMARY KEY               |
| word        | VARCHAR(255) | NOT NULL                  |
| language_id | UUID         | REFERENCES languages(id)  |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- None

---

## One Word Definition Table

| Column      | Type      | Constraints               |
| ----------- | --------- | ------------------------- |
| id          | UUID      | PRIMARY KEY               |
| definition  | TEXT      | NOT NULL                  |
| language_id | UUID      | REFERENCES languages(id)  |
| created_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Indexes

- None

---

## Main Dictionary Table

| Column                                                                        | Type             | Constraints                                 |
| ----------------------------------------------------------------------------- | ---------------- | ------------------------------------------- |
| id                                                                            | UUID             | PRIMARY KEY                                 |
| word_id                                                                       | UUID             | NOT NULL REFERENCES words(id)               |
| one_word_definition_id                                                        | UUID             | NOT NULL REFERENCES one_word_definition(id) |
| base_language_id                                                              | UUID             | REFERENCES languages(id)                    |
| target_language_id                                                            | UUID             | REFERENCES languages(id)                    |
| description_base                                                              | TEXT             |                                             |
| description_target                                                            | TEXT             |                                             |
| audio_id                                                                      | UUID             | REFERENCES audios(id)                       |
| frequency                                                                     | INTEGER          |                                             |
| part_of_speech                                                                | part_of_speech   |                                             |
| phonetic                                                                      | VARCHAR(100)     |                                             |
| difficulty_level                                                              | difficulty_level |                                             |
| etymology                                                                     | TEXT             |                                             |
| source                                                                        | source_type      |                                             |
| created_at                                                                    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP                   |
| updated_at                                                                    | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP                   |
| deleted_at                                                                    | TIMESTAMP        |                                             |
| UNIQUE(word_id, one_word_definition_id, base_language_id, target_language_id) |                  |                                             |

### Indexes

- `idx_main_dict_languages` on `(base_language_id, target_language_id)`
- `idx_main_dict_word_search` on `USING gin((word_id::text) gin_trgm_ops)`
- `idx_word_lookup` on `(word_id, base_language_id, target_language_id) INCLUDE (one_word_definition_id)`

---

## Dictionary Examples Table

| Column        | Type      | Constraints                             |
| ------------- | --------- | --------------------------------------- |
| id            | UUID      | PRIMARY KEY                             |
| dictionary_id | UUID      | NOT NULL REFERENCES main_dictionary(id) |
| example       | TEXT      | NOT NULL                                |
| language_id   | UUID      | REFERENCES languages(id)                |
| created_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP               |
| updated_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP               |
| deleted_at    | TIMESTAMP |                                         |

### Indexes

- None

---

## Synonyms Table

| Column      | Type      | Constraints               |
| ----------- | --------- | ------------------------- |
| id          | UUID      | PRIMARY KEY               |
| synonym     | TEXT      | NOT NULL UNIQUE           |
| language_id | UUID      | REFERENCES languages(id)  |
| created_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at  | TIMESTAMP |                           |

### Indexes

- None

---

## Dictionary Synonyms Table

| Column                                  | Type      | Constraints                             |
| --------------------------------------- | --------- | --------------------------------------- |
| dictionary_id                           | UUID      | NOT NULL REFERENCES main_dictionary(id) |
| synonym_id                              | UUID      | NOT NULL REFERENCES synonyms(id)        |
| created_at                              | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP               |
| updated_at                              | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP               |
| deleted_at                              | TIMESTAMP |                                         |
| PRIMARY KEY (dictionary_id, synonym_id) |           |                                         |

### Indexes

- None

---

## User Dictionary Table

| Column                               | Type      | Constraints                    |
| ------------------------------------ | --------- | ------------------------------ |
| id                                   | UUID      | PRIMARY KEY                    |
| user_id                              | UUID      | REFERENCES users(id)           |
| main_dictionary_id                   | UUID      | REFERENCES main_dictionary(id) |
| base_language_id                     | UUID      | REFERENCES languages(id)       |
| target_language_id                   | UUID      | REFERENCES languages(id)       |
| custom_definition_baseLanguage       | TEXT      |                                |
| custom_definition_targetLanguage     | TEXT      |                                |
| is_learned                           | BOOLEAN   | NOT NULL DEFAULT FALSE         |
| is_needs_review                      | BOOLEAN   | NOT NULL DEFAULT FALSE         |
| is_difficult_to_learn                | BOOLEAN   | NOT NULL DEFAULT FALSE         |
| is_modified                          | BOOLEAN   | NOT NULL DEFAULT FALSE         |
| last_reviewed_at                     | TIMESTAMP |                                |
| review_count                         | INTEGER   | DEFAULT 0                      |
| time_word_was_started_to_learn       | TIMESTAMP |                                |
| time_word_was_learned                | TIMESTAMP |                                |
| progress                             | FLOAT     | DEFAULT 0                      |
| created_at                           | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP      |
| updated_at                           | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP      |
| deleted_at                           | TIMESTAMP |                                |
| UNIQUE (user_id, main_dictionary_id) |           |                                |

### Indexes

- `idx_user_dict_learning` on `(user_id, is_learned, last_reviewed_at)`
- `idx_user_dict_review` on `(user_id, is_needs_review)`
- `idx_user_dict_difficult` on `(user_id, is_difficult_to_learn)`
- `idx_active_words` on `last_reviewed_at WHERE is_learned = false`

---

## User Dictionary Examples Table

| Column                                                          | Type      | Constraints               |
| --------------------------------------------------------------- | --------- | ------------------------- |
| id                                                              | UUID      | PRIMARY KEY               |
| user_dictionary_id                                              | UUID      |                           |
| example                                                         | TEXT      | NOT NULL                  |
| language_id                                                     | UUID      | REFERENCES languages(id)  |
| created_at                                                      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at                                                      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at                                                      | TIMESTAMP |                           |
| UNIQUE (user_dictionary_id, example)                            |           |                           |
| FOREIGN KEY (user_dictionary_id) REFERENCES user_dictionary(id) |           |                           |

### Indexes

- None

---

## User Synonyms Table

| Column      | Type      | Constraints               |
| ----------- | --------- | ------------------------- |
| id          | UUID      | PRIMARY KEY               |
| synonym     | TEXT      | NOT NULL UNIQUE           |
| language_id | UUID      | REFERENCES languages(id)  |
| created_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at  | TIMESTAMP |                           |

### Indexes

- None

---

## User Dictionary Synonyms Table

| Column                                                          | Type      | Constraints               |
| --------------------------------------------------------------- | --------- | ------------------------- |
| user_dictionary_id                                              | UUID      |                           |
| user_synonym_id                                                 | UUID      |                           |
| created_at                                                      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at                                                      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| deleted_at                                                      | TIMESTAMP |                           |
| PRIMARY KEY (user_dictionary_id, user_synonym_id)               |           |                           |
| FOREIGN KEY (user_dictionary_id) REFERENCES user_dictionary(id) |           |                           |
| FOREIGN KEY (user_synonym_id) REFERENCES user_synonyms(id)      |           |                           |

### Indexes

- None

---

## Lists Table

| Column             | Type             | Constraints               |
| ------------------ | ---------------- | ------------------------- |
| id                 | UUID             | PRIMARY KEY               |
| name               | VARCHAR(255)     | NOT NULL                  |
| description        | TEXT             |                           |
| base_language_id   | UUID             | REFERENCES languages(id)  |
| target_language_id | UUID             | REFERENCES languages(id)  |
| is_public          | BOOLEAN          | NOT NULL DEFAULT FALSE    |
| created_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP |
| updated_at         | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP |
| tags               | TEXT[]           |                           |
| coverImageUrl      | VARCHAR(255)     |                           |
| difficultyLevel    | difficulty_level |                           |
| wordCount          | INTEGER          | DEFAULT 0                 |
| last_modified      | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP |
| jsonb_data         | JSONB            | DEFAULT '{}'::jsonb       |
| owner_id           | UUID             | REFERENCES users(id)      |
| deleted_at         | TIMESTAMP        |                           |

### Indexes

- `idx_lists_language` on `(base_language_id, target_language_id)`

---

## List Words Table

| Column                               | Type    | Constraints                    |
| ------------------------------------ | ------- | ------------------------------ |
| list_id                              | UUID    | REFERENCES lists(id)           |
| dictionary_id                        | UUID    | REFERENCES main_dictionary(id) |
| order_index                          | INTEGER |                                |
| PRIMARY KEY (list_id, dictionary_id) |         |                                |

### Indexes

- `idx_list_words_order` on `(list_id, order_index)`

---

## User Lists Table

| Column                     | Type             | Constraints               |
| -------------------------- | ---------------- | ------------------------- |
| id                         | UUID             | PRIMARY KEY               |
| user_id                    | UUID             | REFERENCES users(id)      |
| lists_id                   | UUID             | REFERENCES lists(id)      |
| base_language_id           | UUID             | REFERENCES languages(id)  |
| target_language_id         | UUID             | REFERENCES languages(id)  |
| is_modified                | BOOLEAN          | DEFAULT FALSE             |
| custom_name_of_list        | VARCHAR(255)     |                           |
| custom_description_of_list | TEXT             |                           |
| created_at                 | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP |
| updated_at                 | TIMESTAMP        | DEFAULT CURRENT_TIMESTAMP |
| custom_difficulty          | difficulty_level |                           |
| progress                   | FLOAT            | DEFAULT 0                 |
| jsonb_data                 | JSONB            | DEFAULT '{}'::jsonb       |
| deleted_at                 | TIMESTAMP        |                           |
| UNIQUE (user_id, lists_id) |                  |                           |

### Indexes

- `idx_user_lists_progress` on `(user_id, progress)`
- `idx_user_lists_modified` on `(user_id, is_modified)`

---

## User List Words Table

| Column                                    | Type    | Constraints                    |
| ----------------------------------------- | ------- | ------------------------------ |
| user_list_id                              | UUID    | REFERENCES user_lists(id)      |
| dictionary_id                             | UUID    | REFERENCES main_dictionary(id) |
| order_index                               | INTEGER |                                |
| PRIMARY KEY (user_list_id, dictionary_id) |         |                                |

### Indexes

- None -->
