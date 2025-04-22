_Draft_
• User wants to learn to type new words
• User wants to type on a keyboard fast
• User wants to learn new words
• All words are kept in a single table. (MainDictionary)
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

useful information:

//Codes for the Representation of Names of Languages
https://www.loc.gov/standards/iso639-2/php/code_list.php

Merriam-Webster's Learner's Dictionary with Audio
API Product Description
Designed to help advanced students master spoken and written English as it is actually used, this groundbreaking new dictionary provides in-depth and up-to-date coverage of basic English vocabulary, grammar, and usage. Outstanding features include nearly 100,000 words and phrases with 3,000 core vocabulary words identified. Includes more than 160,000 usage examples, more than 22,000 idioms, verbal collocations, and commonly used phrases. Perfect for ESL, EFL, ELL, and TEFL study and instruction.

corpus:
https://app.sketchengine.eu/#wordlist?corpname=preloaded%2Fententen21_tt31&tab=basic&lpos=-d&find=-d&wlattr=lempos_lc&include_nonwords=1&itemsPerPage=50&showresults=1&cols=%5B%22frq%22%5D&diaattr=&showtimelineabs=0&timelinesthreshold=5&corp_info=1
