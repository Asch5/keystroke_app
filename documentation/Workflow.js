//!Steps to add a new word:

//? 1. First of all, we try to find the word in the database looking for the word in the main dictionary.
//? 2. If the word is not found, we press the button "Add new word".
//? 3. We write the word in the input field and press the button "Add".
//? 4. The word is sent to the AI to be checked if it is correct and if it is a word in accordance with either the baselanguage or the target language.
//? 5. The AI starts to work on the word.
//? 6. The AI will return a object with the results.
//? 7. Properties of the object:
//?    item a - isCorrect: boolean
//?    item b - isWord: boolean
//?    item c - baseLanguage: string
//?    item d - targetLanguage: string
//?    item e - wordInBaseLanguage: string
//?    item f - wordInTargetLanguage: string
//?    item g - oneWordDefinitionInBaseLanguage: string (consists of 1 word if the wordInTargetLanguage is a word, otherwise if it is a phrase, it consists of 1-3 words as needed)
//?    item h - oneWordDefinitionInTargetLanguage: string (consists of 1 word if the wordInBaseLanguage is a word, otherwise if it is a phrase, it consists of 1-3 words as needed)
//?    item i - fillWordDescriptionInBaseLanguage: string (1-3 sentences)
//?    item j - fillWordDescriptionInTargetLanguage: string (1-3 sentences)
//?    item k - examplesInBaseLanguage: string[] (1-3 examples)
//?    item l - examplesInTargetLanguage: string[] (1-3 examples)
//?    item m - synonymsInBaseLanguage: string[] (1-6 synonyms the most appropriate)
//?    item n - synonymsInTargetLanguage: string[] (1-6 synonyms the most appropriate)
//?    item o - phoneticSpellingInBaseLanguage: string
//?    item p - phoneticSpellingInTargetLanguage: string
//?    item q - partOfSpeechInBaseLanguage: string
//?    item r - partOfSpeechInTargetLanguage: string
//?    item s - difficultyLevel: ( A1, A2, B1, B2, C1, C2)
//?    item t - source: ai_generated

//? 8. Then we allocate the parts of the object to the corresponding tables in the database:
//! We will create 2 MainDictionary rows to correspond to the wordInBaseLanguage and the wordInTargetLanguage. We call them MainDictionary1 and MainDictionary2.
//! MainDictionary1 were wordId will be corresponding to the wordInTargetLanguage (chair).
//! MainDictionary2 were wordId will be corresponding to the wordInBaseLanguage (с).
// Creates two MainDictionary entries for each word pair:
//? MainDictionary1 (Target Language Focus)
//? MainDictionary2 (Base Language Focus)

//? Allocation:
//?    item e - wordInBaseLanguage + baseLanguage + phoneticSpellingInBaseLanguage => Word table -> MainDictionary2.wordId
//?    item f - wordInTargetLanguage + targetLanguage + phoneticSpellingInTargetLanguage => Word table -> MainDictionary1.wordId
//?    item g - oneWordDefinitionInBaseLanguage + baseLanguage => WordDefinition table -> MainDictionary1.oneWordDefinitionId
//?    item h - oneWordDefinitionInTargetLanguage + targetLanguage => WordDefinition table -> MainDictionary2.oneWordDefinitionId
//?    item i - fillWordDescriptionInBaseLanguage => MainDictionary1.descriptionBase and MainDictionary2.descriptionTarget
//?    item j - fillWordDescriptionInTargetLanguage => MainDictionary1.descriptionTarget and MainDictionary2.descriptionBase

//?    item k - examplesInBaseLanguage => MainDictionary2.examples[]
//?    item l - examplesInTargetLanguage => MainDictionary1.examples[]

//?    item m - synonymsInBaseLanguage + baseLanguage => Synonym table -> MainDictionary2 (табурет)
//?    item n - synonymsInTargetLanguage + targetLanguage => Synonym table -> MainDictionary1 (armchair)

//?    item q - partOfSpeechInBaseLanguage => MainDictionary1.partOfSpeech
//?    item r - partOfSpeechInTargetLanguage => MainDictionary2.partOfSpeech

//?    item s - difficultyLevel => MainDictionary1.difficultyLevel and MainDictionary2.difficultyLevel

//?    item t - source => MainDictionary1.source and MainDictionary2.source

//? 9. Validation Steps
//?    - Validate language pair consistency
//?    - Check for existing similar words
//?    - Verify all required fields are present

//? 10. Transaction Handling
//?    - Begin database transaction
//?    - Create all related records
//?    - Commit or rollback based on success

//? 11. User Feedback
//?    - Progress indicators
//?    - Success/failure messages
//?    - Option to review before final save

//? 12. Post-Creation Tasks
//?    - Update user's dictionary
//?    - Update learning progress
//?    - Add to relevant lists if needed

//? 13. Connection between UserDictionary and MainDictionary (if user's base language is russian and target language is english):
//?    - UserDictionary.Id will be corresponding to MainDictionary1.Id (chair) were targetlanguage is english
