// Basic CRUD operations
export {
  fetchDictionaryWords,
  fetchDictionaryWordDetails,
  addWordToUserDictionary,
  checkWordExistsByUuid,
  fetchWordById,
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

// Frequency operations
export {
  mapWordFrequency,
  mapFrequencyPartOfSpeech,
  importFrequencyJson,
} from './frequency-actions';
