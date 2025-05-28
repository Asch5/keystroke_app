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
  type WordEntryData,
  type WordPartOfSpeechDetails,
  type DefinitionData,
  type AudioFileData,
  type DetailRelationForPOS,
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
  type CategoryData,
  type CreateListData,
  type ListWordData,
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
