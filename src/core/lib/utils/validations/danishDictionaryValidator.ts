import { clientLog } from '@/core/lib/utils/logUtils';
import {
  DanishDictionaryObject,
  DetailCategoryDanish,
  GenderTypeDanish,
  PartOfSpeechDanish,
  PartOfSpeechForStems,
  RelationshipTypeVerbsInAudio,
} from '@/core/types/translationDanishTypes';

// Enhanced validation result types
export type ValidationIssue = {
  category: string;
  value: string;
  path: string[];
  context: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string | undefined;
};

export type ValidationSummary = {
  isValid: boolean;
  totalIssues: number;
  unknownEntitiesCount: number;
  structuralIssuesCount: number;
  issues: ValidationIssue[];
  unknownEntitiesByCategory: Record<string, string[]>;
  suggestedEnumAdditions: Record<string, string[]>;
  contextInfo: {
    wordText?: string;
    source: string;
    timestamp: string;
  };
};

// Define strict types for tracking unknown entities
type UnknownEntitiesTracker = {
  labels: Set<string>;
  partOfSpeech: Set<string>;
  stemsPartOfSpeech: Set<string>;
  gender: Set<string>;
  audioRelationship: Set<string>;
  rootFields: Set<string>;
  structuralIssues: Set<string>;
  dataTypeIssues: Set<string>;
};

type ValidationPath = string[];

/**
 * Enhanced validation function for Danish dictionary data
 * @param data The raw data from the Danish dictionary
 * @param context Optional context information for the validation
 * @returns Detailed validation results with suggestions for type improvements
 */
export function validateDanishDictionary(
  data: unknown,
  context: string = '',
): ValidationSummary {
  const validationResult: ValidationSummary = {
    isValid: true,
    totalIssues: 0,
    unknownEntitiesCount: 0,
    structuralIssuesCount: 0,
    issues: [],
    unknownEntitiesByCategory: {},
    suggestedEnumAdditions: {},
    contextInfo: {
      source: context,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    // Define known values for each category with comprehensive lists
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
      'suffiks',
      'førsteled',
      'sidsteled',
      'undefined',
    ];

    const KNOWN_GENDERS: GenderTypeDanish[] = [
      'fælleskøn',
      'intetkøn',
      'fælleskønellerintetkøn', // Added this based on usage in processOrdnetApi
    ];

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
      'udråbsord',
      'førsteled',
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
      'ASTROLOGI',
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
      'som førsteled',
    ];

    // Expected root level fields
    const EXPECTED_ROOT_FIELDS = [
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

    // Track unknown entities with detailed paths
    const unknownEntities: UnknownEntitiesTracker = {
      labels: new Set<string>(),
      partOfSpeech: new Set<string>(),
      stemsPartOfSpeech: new Set<string>(),
      gender: new Set<string>(),
      audioRelationship: new Set<string>(),
      rootFields: new Set<string>(),
      structuralIssues: new Set<string>(),
      dataTypeIssues: new Set<string>(),
    };

    // Helper functions
    const isObject = (value: unknown): value is Record<string, unknown> => {
      return (
        value !== null && typeof value === 'object' && !Array.isArray(value)
      );
    };

    const isArray = (value: unknown): value is unknown[] => {
      return Array.isArray(value);
    };

    const addIssue = (
      category: string,
      value: string,
      path: ValidationPath,
      severity: 'error' | 'warning' | 'info' = 'warning',
      suggestion?: string,
    ): void => {
      const issue: ValidationIssue = {
        category,
        value,
        path: [...path],
        context,
        severity,
        suggestion,
      };

      validationResult.issues.push(issue);
      validationResult.totalIssues++;

      if (severity === 'warning' || severity === 'error') {
        validationResult.unknownEntitiesCount++;
      }
      if (severity === 'error') {
        validationResult.structuralIssuesCount++;
        validationResult.isValid = false;
      }
    };

    const validateLabelsObject = (
      labels: Record<string, unknown>,
      path: ValidationPath,
    ): void => {
      Object.keys(labels).forEach((label) => {
        if (!KNOWN_DETAIL_CATEGORIES.includes(label as DetailCategoryDanish)) {
          unknownEntities.labels.add(label);
          addIssue(
            'labels',
            label,
            [...path, 'labels', label],
            'warning',
            `Consider adding '${label}' to DetailCategoryDanish enum`,
          );
        }

        // Validate label value types
        const labelValue = labels[label];
        if (labelValue !== null && labelValue !== undefined) {
          if (
            typeof labelValue !== 'string' &&
            !isArray(labelValue) &&
            typeof labelValue !== 'boolean'
          ) {
            addIssue(
              'dataType',
              `Unexpected type for label '${label}': ${typeof labelValue}`,
              [...path, 'labels', label],
              'error',
            );
          }
        }
      });
    };

    // Extract word text for context if available
    const typedData = data as Partial<DanishDictionaryObject>;
    if (typedData?.word?.word) {
      validationResult.contextInfo.wordText = typedData.word.word;
    }

    // Validate basic structure
    if (!data || typeof data !== 'object') {
      addIssue(
        'structure',
        'Data is not an object',
        [],
        'error',
        'Ensure data is a valid DanishDictionaryObject',
      );
      return validationResult;
    }

    // Check root level fields
    if (isObject(data)) {
      Object.keys(data).forEach((key) => {
        if (!EXPECTED_ROOT_FIELDS.includes(key)) {
          unknownEntities.rootFields.add(key);
          addIssue(
            'rootFields',
            key,
            [key],
            'info',
            `Consider adding '${key}' to expected root fields if it's a valid field`,
          );
        }
      });
    }

    // Validate word object
    if (typedData.word) {
      const wordPath: ValidationPath = ['word'];

      // Validate part of speech
      if (typedData.word.partOfSpeech) {
        if (isArray(typedData.word.partOfSpeech)) {
          typedData.word.partOfSpeech.forEach((pos: unknown, index: number) => {
            if (typeof pos === 'string') {
              if (index === 0) {
                if (
                  !KNOWN_PARTS_OF_SPEECH.includes(pos as PartOfSpeechDanish)
                ) {
                  unknownEntities.partOfSpeech.add(pos);
                  addIssue(
                    'partOfSpeech',
                    pos,
                    [...wordPath, 'partOfSpeech', index.toString()],
                    'warning',
                    `Consider adding '${pos}' to PartOfSpeechDanish enum`,
                  );
                }
              } else if (index === 1) {
                if (!KNOWN_GENDERS.includes(pos as GenderTypeDanish)) {
                  unknownEntities.gender.add(pos);
                  addIssue(
                    'gender',
                    pos,
                    [...wordPath, 'partOfSpeech', index.toString()],
                    'warning',
                    `Consider adding '${pos}' to GenderTypeDanish enum`,
                  );
                }
              }
            } else {
              addIssue(
                'dataType',
                `Part of speech at index ${index} is not a string: ${typeof pos}`,
                [...wordPath, 'partOfSpeech', index.toString()],
                'error',
              );
            }
          });
        } else {
          addIssue(
            'dataType',
            'partOfSpeech is not an array',
            [...wordPath, 'partOfSpeech'],
            'error',
          );
        }
      }

      // Validate audio relationships
      if (typedData.word.audio && isArray(typedData.word.audio)) {
        typedData.word.audio.forEach((audio, index) => {
          const audioPath = [...wordPath, 'audio', index.toString()];

          if (isObject(audio)) {
            if (audio.word && typeof audio.word === 'string') {
              if (
                !KNOWN_AUDIO_RELATIONSHIPS.includes(
                  audio.word as RelationshipTypeVerbsInAudio,
                )
              ) {
                unknownEntities.audioRelationship.add(audio.word);
                addIssue(
                  'audioRelationship',
                  audio.word,
                  [...audioPath, 'word'],
                  'warning',
                  `Consider adding '${audio.word}' to RelationshipTypeVerbsInAudio enum`,
                );
              }
            }

            // Validate required audio fields
            if (!audio.audio_url || typeof audio.audio_url !== 'string') {
              addIssue(
                'structure',
                'Missing or invalid audio_url',
                [...audioPath, 'audio_url'],
                'error',
              );
            }
          } else {
            addIssue(
              'dataType',
              'Audio item is not an object',
              audioPath,
              'error',
            );
          }
        });
      }
    }

    // Validate definitions
    if (typedData.definition && isArray(typedData.definition)) {
      typedData.definition.forEach((def, index) => {
        const defPath: ValidationPath = ['definition', index.toString()];

        if (isObject(def)) {
          // Validate definition text
          if (!def.definition || typeof def.definition !== 'string') {
            addIssue(
              'structure',
              'Missing or invalid definition text',
              [...defPath, 'definition'],
              'error',
            );
          }

          // Validate labels
          if (def.labels && isObject(def.labels)) {
            validateLabelsObject(def.labels, defPath);
          }

          // Validate examples array
          if (def.examples && isArray(def.examples)) {
            def.examples.forEach((example, exIndex) => {
              if (typeof example !== 'string') {
                addIssue(
                  'dataType',
                  `Example at index ${exIndex} is not a string`,
                  [...defPath, 'examples', exIndex.toString()],
                  'error',
                );
              }
            });
          }
        } else {
          addIssue(
            'dataType',
            'Definition item is not an object',
            defPath,
            'error',
          );
        }
      });
    }

    // Validate fixed expressions with enhanced error handling
    if (typedData.fixed_expressions && isArray(typedData.fixed_expressions)) {
      typedData.fixed_expressions.forEach((expr, index) => {
        const exprPath: ValidationPath = [
          'fixed_expressions',
          index.toString(),
        ];

        if (isObject(expr)) {
          // Validate expression text
          if (!expr.expression || typeof expr.expression !== 'string') {
            addIssue(
              'structure',
              'Missing or invalid expression text',
              [...exprPath, 'expression'],
              'error',
            );
          }

          // Validate definition array
          if (expr.definition && isArray(expr.definition)) {
            expr.definition.forEach((defItem, defIndex) => {
              const defItemPath = [
                ...exprPath,
                'definition',
                defIndex.toString(),
              ];

              if (isObject(defItem)) {
                // Fix the linter error by safely checking labels
                if (defItem.labels && isObject(defItem.labels)) {
                  validateLabelsObject(defItem.labels, defItemPath);
                }
              } else {
                addIssue(
                  'dataType',
                  'Definition item in fixed expression is not an object',
                  defItemPath,
                  'error',
                );
              }
            });
          }
        } else {
          addIssue(
            'dataType',
            'Fixed expression item is not an object',
            exprPath,
            'error',
          );
        }
      });
    }

    // Validate stems
    if (typedData.stems && isArray(typedData.stems)) {
      typedData.stems.forEach((stem, index) => {
        const stemPath: ValidationPath = ['stems', index.toString()];

        if (isObject(stem)) {
          if (stem.partOfSpeech && typeof stem.partOfSpeech === 'string') {
            if (!KNOWN_STEMS_POS.includes(stem.partOfSpeech)) {
              unknownEntities.stemsPartOfSpeech.add(stem.partOfSpeech);
              addIssue(
                'stemsPartOfSpeech',
                stem.partOfSpeech,
                [...stemPath, 'partOfSpeech'],
                'warning',
                `Consider adding '${stem.partOfSpeech}' to PartOfSpeechForStems enum`,
              );
            }
          }

          // Validate stem text
          if (!stem.stem || typeof stem.stem !== 'string') {
            addIssue(
              'structure',
              'Missing or invalid stem text',
              [...stemPath, 'stem'],
              'error',
            );
          }
        } else {
          addIssue('dataType', 'Stem item is not an object', stemPath, 'error');
        }
      });
    }

    // Validate variants with comprehensive checking
    if (typedData.variants && isArray(typedData.variants)) {
      typedData.variants.forEach((variant, index) => {
        const variantPath: ValidationPath = ['variants', index.toString()];

        if (isObject(variant)) {
          // Validate variant word
          if (variant.word && isObject(variant.word)) {
            const variantWordPath = [...variantPath, 'word'];

            // Check variant part of speech
            if (
              variant.word.partOfSpeech &&
              isArray(variant.word.partOfSpeech)
            ) {
              variant.word.partOfSpeech.forEach(
                (pos: unknown, posIndex: number) => {
                  if (typeof pos === 'string') {
                    if (posIndex === 0) {
                      if (
                        !KNOWN_PARTS_OF_SPEECH.includes(
                          pos as PartOfSpeechDanish,
                        )
                      ) {
                        unknownEntities.partOfSpeech.add(pos);
                        addIssue(
                          'partOfSpeech',
                          pos,
                          [
                            ...variantWordPath,
                            'partOfSpeech',
                            posIndex.toString(),
                          ],
                          'warning',
                        );
                      }
                    } else if (posIndex === 1) {
                      if (!KNOWN_GENDERS.includes(pos as GenderTypeDanish)) {
                        unknownEntities.gender.add(pos);
                        addIssue(
                          'gender',
                          pos,
                          [
                            ...variantWordPath,
                            'partOfSpeech',
                            posIndex.toString(),
                          ],
                          'warning',
                        );
                      }
                    }
                  }
                },
              );
            }
          }

          // Validate variant definitions
          if (variant.definition && isArray(variant.definition)) {
            variant.definition.forEach((def, defIndex) => {
              const defPath = [
                ...variantPath,
                'definition',
                defIndex.toString(),
              ];

              if (isObject(def) && def.labels && isObject(def.labels)) {
                validateLabelsObject(def.labels, defPath);
              }
            });
          }

          // Validate variant fixed expressions with proper error handling
          if (variant.fixed_expressions && isArray(variant.fixed_expressions)) {
            variant.fixed_expressions.forEach((expr, exprIndex) => {
              const exprPath = [
                ...variantPath,
                'fixed_expressions',
                exprIndex.toString(),
              ];

              if (
                isObject(expr) &&
                expr.definition &&
                isArray(expr.definition)
              ) {
                expr.definition.forEach((defItem, defIndex) => {
                  const defItemPath = [
                    ...exprPath,
                    'definition',
                    defIndex.toString(),
                  ];

                  if (
                    isObject(defItem) &&
                    defItem.labels &&
                    isObject(defItem.labels)
                  ) {
                    validateLabelsObject(defItem.labels, defItemPath);
                  }
                });
              }
            });
          }

          // Validate variant stems
          if (variant.stems && isArray(variant.stems)) {
            variant.stems.forEach((stem, stemIndex) => {
              const stemPath = [...variantPath, 'stems', stemIndex.toString()];

              if (
                isObject(stem) &&
                stem.partOfSpeech &&
                typeof stem.partOfSpeech === 'string'
              ) {
                if (!KNOWN_STEMS_POS.includes(stem.partOfSpeech)) {
                  unknownEntities.stemsPartOfSpeech.add(stem.partOfSpeech);
                  addIssue(
                    'stemsPartOfSpeech',
                    stem.partOfSpeech,
                    [...stemPath, 'partOfSpeech'],
                    'warning',
                  );
                }
              }
            });
          }
        } else {
          addIssue(
            'dataType',
            'Variant item is not an object',
            variantPath,
            'error',
          );
        }
      });
    }

    // Compile results
    for (const [category, entities] of Object.entries(unknownEntities)) {
      if (entities.size > 0) {
        const entitiesArray = Array.from(entities);
        validationResult.unknownEntitiesByCategory[category] = entitiesArray;

        // Generate suggestions for enum additions
        validationResult.suggestedEnumAdditions[category] = entitiesArray.map(
          (entity) => `'${entity}',`,
        );
      }
    }

    // Log summary if issues found
    if (validationResult.totalIssues > 0) {
      clientLog(
        `Danish dictionary validation completed${context ? ` for ${context}` : ''}: ` +
          `${validationResult.totalIssues} issues found ` +
          `(${validationResult.unknownEntitiesCount} unknown entities, ` +
          `${validationResult.structuralIssuesCount} structural issues)`,
        validationResult.isValid ? 'warn' : 'error',
      );

      // Log suggestions for enum updates
      Object.entries(validationResult.suggestedEnumAdditions).forEach(
        ([category, suggestions]) => {
          if (suggestions.length > 0) {
            clientLog(
              `Suggested ${category} enum additions: ${suggestions.join(' ')}`,
              'info',
            );
          }
        },
      );
    }
  } catch (error) {
    validationResult.isValid = false;
    validationResult.totalIssues++;
    validationResult.structuralIssuesCount++;

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Manually add the issue since addIssue might be out of scope here
    const issue: ValidationIssue = {
      category: 'validation_error',
      value: errorMessage,
      path: ['root'],
      context,
      severity: 'error',
      suggestion: 'Check data structure and validation logic',
    };

    validationResult.issues.push(issue);

    clientLog(
      `Error validating Danish dictionary data${context ? ` for ${context}` : ''}: ${errorMessage}`,
      'error',
    );
  }

  return validationResult;
}

/**
 * Utility function to extract enum suggestions from validation results
 * @param validationResult The result from validateDanishDictionary
 * @returns Object with enum name and suggested additions
 */
export function extractEnumSuggestions(
  validationResult: ValidationSummary,
): Record<string, string[]> {
  const enumMappings: Record<string, string> = {
    labels: 'DetailCategoryDanish',
    partOfSpeech: 'PartOfSpeechDanish',
    stemsPartOfSpeech: 'PartOfSpeechForStems',
    gender: 'GenderTypeDanish',
    audioRelationship: 'RelationshipTypeVerbsInAudio',
  };

  const suggestions: Record<string, string[]> = {};

  Object.entries(validationResult.unknownEntitiesByCategory).forEach(
    ([category, entities]) => {
      const enumName = enumMappings[category];
      if (enumName && entities.length > 0) {
        suggestions[enumName] = entities;
      }
    },
  );

  return suggestions;
}

/**
 * Utility function to check if validation passed with only minor issues
 * @param validationResult The result from validateDanishDictionary
 * @returns True if validation passed with only warnings/info, false if errors found
 */
export function isValidationAcceptable(
  validationResult: ValidationSummary,
): boolean {
  return (
    validationResult.isValid && validationResult.structuralIssuesCount === 0
  );
}
