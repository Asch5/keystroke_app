import { serverLog, LogLevel } from '@/core/lib/utils/logUtils';
import {
  DanishDictionaryObject,
  DetailCategoryDanish,
  GenderTypeDanish,
  PartOfSpeechDanish,
  PartOfSpeechForStems,
  RelationshipTypeVerbsInAudio,
} from '@/core/types/translationDanishTypes';

// Define a strict type for our unknown entities tracking
type UnknownEntitiesTracker = {
  labels: Set<string>;
  partOfSpeech: Set<string>;
  stemsPartOfSpeech: Set<string>;
  gender: Set<string>;
  audioRelationship: Set<string>;
  rootFields: Set<string>;
};

/**
 * Validates Danish dictionary data and logs any unknown entities
 * @param data The raw data from the Danish dictionary
 * @param context Optional context information for the log
 */
export function validateDanishDictionary(
  data: unknown,
  context: string = '',
): void {
  try {
    // Define known values for each category
    const KNOWN_PARTS_OF_SPEECH: PartOfSpeechDanish[] = [
      'substantiv',
      'verbum',
      'adjektiv',
      'adverbium',
      'pronomen',
      'præposition',
      'konjunktion',
      'interjektion',
      'artikel',
      'talord',
      'talord (mængdetal)',
      'udråbsord',
      'forkortelse',
      'undefined',
    ];

    const KNOWN_GENDERS: GenderTypeDanish[] = ['fælleskøn', 'intetkøn'];

    const KNOWN_STEMS_POS: PartOfSpeechForStems[] = [
      'vb.',
      'adj.',
      'adv.',
      'sb.',
      'præp.',
      'konj.',
      'pron.',
      'num.',
      'interj.',
    ];

    const KNOWN_AUDIO_RELATIONSHIPS: RelationshipTypeVerbsInAudio[] = [
      'grundform',
      'præsens',
      'præteritum',
      'præteritum participium',
      'præteritum og præteritum participium',
      'i sammensætning',
      'pluralis',
      'præteritum, betød',
      'syntes',
      'betydning 1',
      'betydning 2',
      'betydning 3',
      'betydning 1 og 6',
      'betydning 2 og 6',
      'betydning 3 og 6',
      'betydning 1, 2 og 6',
      'betydning 1, 2, 3 og 6',
      '',
    ];

    const KNOWN_DETAIL_CATEGORIES: DetailCategoryDanish[] = [
      'SPROGBRUG',
      'overført',
      'grammatik',
      'talemåde',
      'Forkortelse',
      'slang',
      'MEDICIN',
      'JURA',
      'TEKNIK',
      'KEMI',
      'MATEMATIK',
      'MUSIK',
      'SPORT',
      'BOTANIK',
      'ZOOLOGI',
      'ØKONOMI',
      'POLITIK',
      'RELIGION',
      'MILITÆR',
      'LITTERATUR',
      'ASTRONOMI',
      'GASTRONOMI',
      'SØFART',
      'Eksempler',
      'Se også',
      'Synonym',
      'Synonymer',
      'Antonym',
      'som adverbium',
      'som adjektiv',
      'som substantiv',
      'som verbum',
      'som præposition',
      'som konjunktion',
      'som interjektion',
      'som talord',
      'som udråbsord',
      'som forkortelse',
    ];

    // Track unknown entities
    const unknownEntities: UnknownEntitiesTracker = {
      labels: new Set<string>(),
      partOfSpeech: new Set<string>(),
      stemsPartOfSpeech: new Set<string>(),
      gender: new Set<string>(),
      audioRelationship: new Set<string>(),
      rootFields: new Set<string>(),
    };

    // Check root level fields
    const expectedRootFields = [
      'metadata',
      'word',
      'definition',
      'fixed_expressions',
      'stems',
      'compositions',
      'synonyms',
      'synonyms_translation_en',
      'antonyms',
      'antonyms_translation_en',
      'variants',
      'related_words',
      'error',
    ];

    if (data && typeof data === 'object') {
      Object.keys(data as object).forEach((key) => {
        if (!expectedRootFields.includes(key)) {
          unknownEntities.rootFields.add(key);
        }
      });
    }

    // Helper type guard
    const isObject = (value: unknown): value is Record<string, unknown> => {
      return value !== null && typeof value === 'object';
    };

    // Check word part of speech
    const typedData = data as Partial<DanishDictionaryObject>;

    if (
      typedData?.word?.partOfSpeech &&
      Array.isArray(typedData.word.partOfSpeech)
    ) {
      typedData.word.partOfSpeech.forEach((pos: string, index: number) => {
        if (index === 0) {
          if (!KNOWN_PARTS_OF_SPEECH.includes(pos as PartOfSpeechDanish)) {
            unknownEntities.partOfSpeech.add(pos);
          }
        } else if (index === 1) {
          if (!KNOWN_GENDERS.includes(pos as GenderTypeDanish)) {
            unknownEntities.gender.add(pos);
          }
        }
      });
    }

    // Check audio relationship types
    if (typedData?.word?.audio && Array.isArray(typedData.word.audio)) {
      typedData.word.audio.forEach((audio) => {
        if (audio.word && typeof audio.word === 'string') {
          if (
            !KNOWN_AUDIO_RELATIONSHIPS.includes(
              audio.word as RelationshipTypeVerbsInAudio,
            )
          ) {
            unknownEntities.audioRelationship.add(audio.word);
          }
        }
      });
    }

    // Check definition labels
    if (typedData?.definition && Array.isArray(typedData.definition)) {
      typedData.definition.forEach((def) => {
        if (def.labels && isObject(def.labels)) {
          Object.keys(def.labels).forEach((label) => {
            if (
              !KNOWN_DETAIL_CATEGORIES.includes(label as DetailCategoryDanish)
            ) {
              unknownEntities.labels.add(label);
            }
          });
        }
      });
    }

    // Check fixed expressions labels
    if (
      typedData?.fixed_expressions &&
      Array.isArray(typedData.fixed_expressions)
    ) {
      typedData.fixed_expressions.forEach((expr) => {
        if (expr.labels && isObject(expr.labels)) {
          Object.keys(expr.labels).forEach((label) => {
            if (
              !KNOWN_DETAIL_CATEGORIES.includes(label as DetailCategoryDanish)
            ) {
              unknownEntities.labels.add(label);
            }
          });
        }
      });
    }

    // Check stems part of speech
    if (typedData?.stems && Array.isArray(typedData.stems)) {
      typedData.stems.forEach((stem) => {
        if (stem.partOfSpeech && typeof stem.partOfSpeech === 'string') {
          if (
            !KNOWN_STEMS_POS.includes(stem.partOfSpeech as PartOfSpeechForStems)
          ) {
            unknownEntities.stemsPartOfSpeech.add(stem.partOfSpeech);
          }
        }
      });
    }

    // Check variants
    if (typedData?.variants && Array.isArray(typedData.variants)) {
      typedData.variants.forEach((variant) => {
        // Check variant word part of speech
        if (
          variant.word?.partOfSpeech &&
          Array.isArray(variant.word.partOfSpeech)
        ) {
          variant.word.partOfSpeech.forEach((pos: string, index: number) => {
            if (index === 0) {
              if (!KNOWN_PARTS_OF_SPEECH.includes(pos as PartOfSpeechDanish)) {
                unknownEntities.partOfSpeech.add(pos);
              }
            } else if (index === 1) {
              if (!KNOWN_GENDERS.includes(pos as GenderTypeDanish)) {
                unknownEntities.gender.add(pos);
              }
            }
          });
        }

        // Check variant definition labels
        if (variant.definition && Array.isArray(variant.definition)) {
          variant.definition.forEach((def) => {
            if (def.labels && isObject(def.labels)) {
              Object.keys(def.labels).forEach((label) => {
                if (
                  !KNOWN_DETAIL_CATEGORIES.includes(
                    label as DetailCategoryDanish,
                  )
                ) {
                  unknownEntities.labels.add(label);
                }
              });
            }
          });
        }

        // Check variant fixed expressions labels
        if (
          variant.fixed_expressions &&
          Array.isArray(variant.fixed_expressions)
        ) {
          variant.fixed_expressions.forEach((expr) => {
            if (expr.labels && isObject(expr.labels)) {
              Object.keys(expr.labels).forEach((label) => {
                if (
                  !KNOWN_DETAIL_CATEGORIES.includes(
                    label as DetailCategoryDanish,
                  )
                ) {
                  unknownEntities.labels.add(label);
                }
              });
            }
          });
        }

        // Check variant stems part of speech
        if (variant.stems && Array.isArray(variant.stems)) {
          variant.stems.forEach((stem) => {
            if (stem.partOfSpeech && typeof stem.partOfSpeech === 'string') {
              if (
                !KNOWN_STEMS_POS.includes(
                  stem.partOfSpeech as PartOfSpeechForStems,
                )
              ) {
                unknownEntities.stemsPartOfSpeech.add(stem.partOfSpeech);
              }
            }
          });
        }
      });
    }

    // Log any unknown entities
    let hasUnknownEntities = false;
    for (const [category, entities] of Object.entries(unknownEntities)) {
      if (entities.size > 0) {
        hasUnknownEntities = true;
        const entitiesList = Array.from(entities).join(', ');
        serverLog(
          `Unknown ${category} in Danish dictionary${context ? ` for ${context}` : ''}: ${entitiesList}`,
          LogLevel.WARN,
        );
      }
    }

    if (hasUnknownEntities) {
      // Log full structure for debugging if needed
      serverLog(
        `Found unknown entities in Danish dictionary data${context ? ` for ${context}` : ''}. Please update types.`,
        LogLevel.WARN,
      );
    }
  } catch (error) {
    serverLog(
      `Error validating Danish dictionary data${context ? ` for ${context}` : ''}: ${error}`,
      LogLevel.ERROR,
    );
  }
}
