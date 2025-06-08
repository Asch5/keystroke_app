// Basic CRUD operations
export {
  fetchDictionaryWords,
  fetchDictionaryWordDetails,
  addWordToUserDictionary,
  checkWordExistsByUuid,
  fetchWordById,
  deleteWordDetails,
  deleteWords,
  deleteSelectedWords,
  type DictionaryWordDetails,
} from './word-crud-actions';

// Complex word details operations
export {
  getWordDetails,
  updateWordDetails,
  fetchWordDetailById,
  updateWordDetailById,
  searchWordsForRelationships,
  type WordEntryData,
  type WordPartOfSpeechDetails,
  type DefinitionData,
  type AudioFileData,
  type DetailRelationForPOS,
  type WordDetailEditData,
} from './word-details-actions';

// Update operations
export {
  updateWord,
  updateDefinition,
  updateExample,
  updateAudio,
} from './word-update-actions';

// Audio management
export {
  createAudioForExample,
  createAudioForWord,
  createAudioForDefinition,
} from './audio-actions';

// List management
export {
  fetchCategories,
  createListWithWords,
  createCategory,
  createListAction,
  addWordsToList,
  getListWords,
  removeWordsFromList,
  type CategoryData,
  type CreateListData,
  type ListWordData,
  type AdminListWordWithDetails,
} from './list-actions';

// Advanced list management
export {
  fetchAllLists,
  getListDetails,
  updateList,
  deleteList,
  restoreList,
  updateListAction,
  type ListWithDetails,
  type ListFilters,
  type ListsResponse,
} from './list-management-actions';

// Category seeding utility
export { seedDefaultCategories, seedCategoriesAction } from './seed-categories';

// Frequency operations
export {
  mapWordFrequency,
  mapFrequencyPartOfSpeech,
  importFrequencyJson,
} from './frequency-actions';

// Text-to-Speech operations
export {
  generateWordTTS,
  generateDefinitionTTS,
  generateExampleTTS,
  generateBatchWordTTS,
  getTTSUsageStats,
  resetTTSUsageStats,
  getTTSQualityLevels,
  deleteWordAudio,
  cleanupOrphanedAudio,
  validateWordIdsExist,
  getAvailableVoiceGenders,
  getDefaultVoiceGender,
  type GenerateTTSResult,
  type TTSBatchResult,
} from './tts-actions';

// Image operations
export {
  generateWordImages,
  generateBatchWordImages,
  deleteWordImages,
  getImageStats,
  type GenerateImageResult,
  type ImageBatchResult,
} from './image-actions';

// Word search operations
export {
  searchWords,
  searchWordsForUser,
  addDefinitionToUserDictionary,
  removeDefinitionFromUserDictionary,
  type WordSearchResult,
  type WordDefinitionResult,
} from './word-search-actions';

// User list management
export {
  getUserLists,
  getAvailablePublicLists,
  getPublicUserLists,
  getPublicListPreview,
  getPublicUserListPreview,
  addListToUserCollection,
  addPublicUserListToCollection,
  removeListFromUserCollection,
  createCustomUserList,
  updateUserList,
  addWordToUserList,
  removeWordFromUserList,
  populateInheritedListWithWords,
  type UserListWithDetails,
  type PublicListSummary,
  type PublicUserListSummary,
  type UserListFilters,
  type UserListWordWithDetails,
} from './user-list-actions';
