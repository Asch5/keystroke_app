// WordDetails component exports
export { WordDetailsHeader } from './WordDetailsHeader';
export { WordDetailsMetadata } from './WordDetailsMetadata';
export { WordDetailsPartOfSpeech } from './WordDetailsPartOfSpeech';
export { WordDetailsDefinitions } from './WordDetailsDefinitions';
export { WordDetailsRelatedWords } from './WordDetailsRelatedWords';

// Utility exports
export { renderTextWithEmphasis } from './utils/text-rendering';
export {
  findTranslation,
  formatRelationshipType,
} from './utils/translation-utils';

// Re-export existing components
export { default as WordDetails } from './WordDetails';
export { default as WordDetailEditForm } from './WordDetailEditForm';
