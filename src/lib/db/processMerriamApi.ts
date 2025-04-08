'use server';

import { prisma } from '@/lib/prisma';
import { ProcessedWordData } from '@/types/dictionary';
import { saveJson } from '@/utils/saveJson';
import {
  LanguageCode,
  PartOfSpeech,
  Prisma,
  RelationshipType,
  SourceType,
  Word,
} from '@prisma/client';
import { getWordDetails } from '../actions/dictionaryActions';

// Define a more accurate type for the API response, especially for 'prs' and 'ins'
export interface MerriamWebsterPronunciation {
  mw?: string;
  sound?: { audio: string };
  ipa?: string;
}

export interface MerriamWebsterInflection {
  il?: string;
  if?: string;
  prs?: MerriamWebsterPronunciation[];
}

export interface MerriamWebsterDefinitionSense {
  sn?: string;
  sgram?: string;
  dt: Array<[string, unknown]>;
  sdsense?: MerriamWebsterDefinitionSense;
  phrasev?: Array<{ pva?: string }>;
  sls?: string[];
  lbs?: string[];
  gram?: string;
  shortdef?: string | string[];
}

export interface MerriamWebsterDefinitionEntry {
  vd?: string;
  sseq: Array<Array<[string, MerriamWebsterDefinitionSense]>>;
}

export interface MerriamWebsterResponse {
  meta: {
    id: string;
    uuid: string;
    src: string;
    section: string;
    stems: string[];
    offensive: boolean;
    syns?: string[][];
    ants?: string[][];
  };
  hwi: {
    hw: string;
    prs?: MerriamWebsterPronunciation[];
    altprs?: MerriamWebsterPronunciation[];
  };
  fl?: string;
  ins?: MerriamWebsterInflection[];
  def?: MerriamWebsterDefinitionEntry[];
  et?: Array<[string, string]>;
  dros?: Array<{
    drp: string;
    def: MerriamWebsterDefinitionEntry[];
  }>;
  gram?: string;
  lbs?: string[];
  shortdef?: string[] | string;
}

export type StateMerriamWebster =
  | {
      message: string;
      errors: Record<string, never>;
      data: MerriamWebsterResponse[];
    }
  | {
      message: null;
      errors: {
        word: string[];
      };
      data?: never;
    };

export async function getWordFromMerriamWebster(
  _prevState: StateMerriamWebster,
  formData: FormData,
): Promise<StateMerriamWebster> {
  const word = formData.get('word');
  const dictionaryType = formData.get('dictionaryType');

  if (!word || typeof word !== 'string') {
    return {
      message: null,
      errors: {
        word: ['Word is required'],
      },
    };
  }

  try {
    const API_KEY =
      dictionaryType === 'intermediate'
        ? process.env.DICTIONARY_INTERMEDIATE_API_KEY
        : process.env.DICTIONARY_LEARNERS_API_KEY;

    if (!API_KEY) {
      throw new Error('API key is not configured');
    }

    const dictionaryPath =
      dictionaryType === 'intermediate' ? 'sd3' : 'learners';
    const response = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/${dictionaryPath}/json/${encodeURIComponent(word)}?key=${API_KEY}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed (${response.status}): ${errorText}`);
      return {
        message: null,
        errors: {
          word: [
            `API request failed: ${response.statusText || 'Unknown error'}`,
          ],
        },
      };
    }

    const data = await response.json();

    await saveJson(data, word);

    if (!data || data.length === 0) {
      return { message: null, errors: { word: ['No results found.'] } };
    }

    if (typeof data[0] === 'string') {
      return {
        message: null,
        errors: {
          word: [
            'Word not found. Did you mean: ' +
              data.slice(0, 3).join(', ') +
              '?',
          ],
        },
      };
    }

    return {
      message: 'Success',
      data: data.filter((item: unknown) => typeof item === 'object'),
      errors: {},
    };
  } catch (error) {
    console.error('Error fetching word from Merriam-Webster:', error);
    return {
      message: null,
      errors: {
        word: ['Failed to fetch word definition. Please try again.'],
      },
    };
  }
}

// Update the type for dros to include gram property
type MerriamWebsterDro = {
  drp: string;
  def?: MerriamWebsterDefinitionEntry[];
  gram?: string;
};

export async function processAndSaveWord(
  apiResponse: MerriamWebsterResponse,
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  // Clean headword: remove all asterisks and any potential trailing ones (though replaceAll should handle it)
  const sourceWordText = apiResponse.hwi.hw.replaceAll('*', '');

  const checkedWordDetails = await getWordDetails(sourceWordText);

  const language = LanguageCode.en; // Hardcoded as per workflow
  const source = mapSourceType(apiResponse.meta.src);
  const partOfSpeech = mapPartOfSpeech(apiResponse.fl);

  const audio = apiResponse.hwi.prs?.[0]?.sound?.audio
    ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${apiResponse.hwi.prs[0].sound.audio.charAt(0)}/${apiResponse.hwi.prs[0].sound.audio}.mp3`
    : null;

  // Process etymology data from the API response
  const etymology = processEtymology(apiResponse.et);

  // Extract and clean short definitions for later matching
  const shortDefTexts: string[] = [];
  if (apiResponse.shortdef && Array.isArray(apiResponse.shortdef)) {
    apiResponse.shortdef.forEach((shortDef) => {
      if (typeof shortDef === 'string') {
        shortDefTexts.push(cleanupDefinitionText(shortDef));
      }
    });
  }

  const processedData: ProcessedWordData = {
    word: {
      word: sourceWordText,
      languageCode: language,
      phonetic:
        apiResponse.hwi.prs?.[0]?.ipa ||
        apiResponse.hwi.prs?.[0]?.mw ||
        apiResponse.hwi.altprs?.[0]?.ipa ||
        apiResponse.hwi.altprs?.[0]?.mw ||
        checkedWordDetails?.word?.phonetic ||
        null,
      audio: audio || checkedWordDetails?.word?.audio || null,
      etymology: etymology || checkedWordDetails?.word?.etymology || null,
      relatedWords: [],
    },
    definitions: [],
    phrases: [],
    stems: apiResponse.meta.stems || [],
  };

  let pluralForm: string | null = null;
  if (apiResponse.ins) {
    for (const inflection of apiResponse.ins) {
      if (inflection.il === 'plural' && inflection.if) {
        pluralForm = inflection.if.replace(/\*/g, '');
        break;
      }
    }
  }

  if (apiResponse.def) {
    for (const defEntry of apiResponse.def) {
      const currentPartOfSpeech = defEntry.vd
        ? mapPartOfSpeech(defEntry.vd)
        : partOfSpeech;

      if (defEntry.sseq) {
        for (const sseqItem of defEntry.sseq) {
          for (const [senseType, senseData] of sseqItem) {
            if (senseType === 'sense' || senseType === 'sdsense') {
              const dt = senseData.dt;
              const definitionText = dt?.find(([type]) => type === 'text')?.[1];

              //checking definition in the existing definitions
              let isDuplicate = false;
              for (const def of processedData.definitions) {
                if (def.definition === cleanupDefinitionText(definitionText)) {
                  isDuplicate = true;
                  break;
                }
              }

              // Skip this definition if it's a duplicate
              if (isDuplicate) {
                continue;
              }

              // Extract examples from 'vis' entries
              const visExamplesArray = dt
                ?.filter(([type]) => type === 'vis')
                .flatMap(([, visData]) => visData as VerbalIllustration[]);

              // Extract usage notes and examples from 'uns' entries
              const usageNotesText: string[] = [];
              const unsExamplesArray =
                dt
                  ?.filter(([type]) => type === 'uns')
                  .flatMap(([, unsData]) => {
                    // uns structure can be complex with nested arrays
                    // Each uns entry can contain multiple note blocks
                    if (!Array.isArray(unsData)) return [];

                    return unsData.flatMap(
                      (noteBlock: Array<[string, unknown]>) => {
                        // Each note block is an array of [type, data] pairs
                        if (!Array.isArray(noteBlock)) return [];

                        // Extract usage note text from 'text' entries within the note block
                        const textEntries = noteBlock
                          .filter(([noteType]) => noteType === 'text')
                          .map(([, textData]) => textData as string);

                        if (textEntries.length > 0) {
                          usageNotesText.push(...textEntries);
                        }

                        // Find 'vis' entries within the note block
                        return noteBlock
                          .filter(([noteType]) => noteType === 'vis')
                          .flatMap(
                            ([, visData]) => visData as VerbalIllustration[],
                          );
                      },
                    );
                  }) || [];

              // Combine both examples arrays
              const allExamplesArray = [
                ...(visExamplesArray || []),
                ...unsExamplesArray,
              ];

              // Deduplicate examples by their text
              const uniqueExamples = new Map();
              allExamplesArray.forEach((ex) => {
                const cleanedText = cleanupExampleText(ex.t);
                uniqueExamples.set(cleanedText, {
                  example: cleanedText,
                  languageCode: LanguageCode.en,
                });
              });

              // Clean the main definition text
              let cleanedDefinition = cleanupDefinitionText(definitionText);

              // Process usage notes and append to the definition
              if (usageNotesText.length > 0) {
                const cleanedUsageNotes = usageNotesText
                  .map(
                    (note, index) =>
                      `${index + 1}) ${cleanupDefinitionText(note)}`,
                  )
                  .filter((note) => note && note.trim() !== '') // Remove empty notes
                  .join(' ');

                if (cleanedUsageNotes) {
                  cleanedDefinition = cleanedDefinition
                    ? `${cleanedDefinition}. Usage: ${cleanedUsageNotes}`
                    : `Usage: ${cleanedUsageNotes}`;
                }
              }

              // Extract additional metadata fields
              let subjectStatusLabels = null;
              if (senseData.sls && Array.isArray(senseData.sls)) {
                subjectStatusLabels = senseData.sls.join(',');
              }

              let generalLabels = null;
              if (senseData.lbs && Array.isArray(senseData.lbs)) {
                generalLabels = senseData.lbs.join(',');
              } else if (apiResponse.lbs && Array.isArray(apiResponse.lbs)) {
                generalLabels = apiResponse.lbs.join(',');
              }

              const grammaticalNote =
                senseData.gram || senseData.sgram || apiResponse.gram || null;

              // Determine if this definition is in the shortdef array
              const isInShortDef = shortDefTexts.some((shortDef) => {
                // Normalize both definitions by removing special characters and extra spaces
                const normalizedDef = cleanedDefinition
                  .replace(/\s*:\s*/g, ': ') // Normalize colons
                  .replace(/\s*—\s*/g, ': ') // Convert em dashes to colons
                  .replace(/\s*\.\s*Usage:\s*/g, ': ') // Convert "Usage:" to colon
                  .replace(/^\d+\)\s*/g, '') // Remove numbering
                  .replace(/\s+/g, ' ') // Normalize spaces
                  .trim();

                const normalizedShortDef = shortDef
                  .replace(/\s*:\s*/g, ': ')
                  .replace(/\s*—\s*/g, ': ')
                  .replace(/\s*\.\s*Usage:\s*/g, ': ')
                  .replace(/^\d+\)\s*/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();

                // Use this
                const mainDef = normalizedDef.split(': ')[0];
                const mainShortDef = normalizedShortDef.split(': ')[0];

                // If main parts match exactly
                if (mainDef === mainShortDef) {
                  return true;
                }

                // If one is contained within the other (for cases where one is more detailed)
                if (
                  mainDef &&
                  mainShortDef &&
                  (mainDef.includes(mainShortDef) ||
                    mainShortDef.includes(mainDef))
                ) {
                  return true;
                }

                // Compare full strings if previous checks fail
                return normalizedDef === normalizedShortDef;
              });

              // Only proceed if the cleaned definition is not empty
              if (cleanedDefinition) {
                processedData.definitions.push({
                  partOfSpeech: currentPartOfSpeech,
                  source: source,
                  languageCode: language,
                  isPlural: !!(
                    pluralForm && currentPartOfSpeech === partOfSpeech
                  ),
                  definition: cleanedDefinition,
                  subjectStatusLabels,
                  generalLabels,
                  grammaticalNote,
                  isInShortDef,
                  examples:
                    Array.from(uniqueExamples.values()).map((ex) => ({
                      example: ex.example,
                      languageCode: ex.languageCode,
                    })) || [],
                });
              }
            }
          }
        }
      }
    }
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const sourceWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: processedData.word.word,
              languageCode: language,
            },
          },
          create: {
            word: processedData.word.word,
            languageCode: language,
            phonetic: processedData.word.phonetic,
            audio: processedData.word.audio,
            etymology: processedData.word.etymology,
            difficultyLevel: 'B1',
          },
          update: {
            phonetic: processedData.word.phonetic,
            audio: processedData.word.audio,
            etymology: processedData.word.etymology,
          },
        });

        const relatedWordEntities: Array<{
          wordEntity: Word;
          type: RelationshipType;
        }> = [];

        // Initialize set to track processed words/stems/phrases within this transaction
        const processedWords = new Set<string>([sourceWordText]);

        // Array to store all successfully processed word entities for relationship creation

        // --- 4b. Handle Plural Form ---
        let pluralWordEntity = null;
        if (pluralForm && pluralForm !== sourceWord.word) {
          pluralWordEntity = await tx.word.upsert({
            where: {
              word_languageCode: {
                word: pluralForm,
                languageCode: language,
              },
            },
            create: {
              word: pluralForm,
              languageCode: language,
              difficultyLevel: 'B1',
            },
            update: {},
          });

          // Instead of creating relationship immediately, add to array for later processing
          relatedWordEntities.push({
            wordEntity: pluralWordEntity,
            type: RelationshipType.plural_en,
          });

          processedWords.add(pluralForm); // Add plural form to processed set
        }

        // --- 4c. Process Synonyms & Antonyms from API ---
        // Check for synonyms in the Merriam-Webster response
        if (apiResponse.meta?.syns) {
          for (const synArray of apiResponse.meta.syns) {
            for (const synonym of synArray) {
              if (!synonym || processedWords.has(synonym)) continue;

              const synonymEntity = await tx.word.upsert({
                where: {
                  word_languageCode: {
                    word: synonym,
                    languageCode: language,
                  },
                },
                create: {
                  word: synonym,
                  languageCode: language,
                  difficultyLevel: 'B1',
                },
                update: {},
              });

              relatedWordEntities.push({
                wordEntity: synonymEntity,
                type: RelationshipType.synonym,
              });

              processedWords.add(synonym);
            }
          }
        }

        // Check for antonyms in the Merriam-Webster response
        if (apiResponse.meta?.ants) {
          for (const antArray of apiResponse.meta.ants) {
            for (const antonym of antArray) {
              if (!antonym || processedWords.has(antonym)) continue;

              const antonymEntity = await tx.word.upsert({
                where: {
                  word_languageCode: {
                    word: antonym,
                    languageCode: language,
                  },
                },
                create: {
                  word: antonym,
                  languageCode: language,
                  difficultyLevel: 'B1',
                },
                update: {},
              });

              relatedWordEntities.push({
                wordEntity: antonymEntity,
                type: RelationshipType.antonym,
              });

              processedWords.add(antonym);
            }
          }
        }

        // --- 4d. Create Definitions and Examples ---
        const createdDefinitionIds = new Set<number>();
        for (const def of processedData.definitions) {
          // Check if definition text is actually present after cleaning
          if (!def.definition || def.definition.trim() === '') {
            console.warn(
              `Skipping definition creation for word '${sourceWord.word}' because definition text is empty.`,
            );
            continue;
          }

          const existingDef = await tx.definition.findFirst({
            where: {
              definition: def.definition,
              partOfSpeech: mapPartOfSpeech(def.partOfSpeech),
              languageCode: LanguageCode.en,
              source: source,
              words: { some: { wordId: sourceWord.id } },
            },
          });

          if (existingDef && createdDefinitionIds.has(existingDef.id)) continue;

          const definitionEntity =
            existingDef ||
            (await tx.definition.create({
              data: {
                definition: def.definition,
                partOfSpeech: mapPartOfSpeech(def.partOfSpeech),
                source: source,
                languageCode: LanguageCode.en,
                plural: def.isPlural,
                subjectStatusLabels: def.subjectStatusLabels || null,
                generalLabels: def.generalLabels || null,
                grammaticalNote: def.grammaticalNote || null,
                isInShortDef: def.isInShortDef || false,
                words: {
                  create: {
                    wordId: sourceWord.id,
                    isPrimary: true,
                  },
                },
              },
            }));
          createdDefinitionIds.add(definitionEntity.id);

          if (!existingDef) {
            for (const example of def.examples) {
              await tx.definitionExample.create({
                data: {
                  example: example.example,
                  languageCode: example.languageCode as LanguageCode,
                  definitionId: definitionEntity.id,
                },
              });
            }
          }
        }

        // --- 4e. Process Dros (Phrases/Phrasal Verbs) ---
        const processedPhrases = new Set<string>();
        if (apiResponse.dros) {
          for (const dro of apiResponse.dros as MerriamWebsterDro[]) {
            const cleanDrp = dro.drp.replace(/\*$/, '');
            // Use the main processedWords set here
            if (
              !cleanDrp ||
              processedWords.has(cleanDrp) ||
              processedPhrases.has(cleanDrp)
            ) {
              continue;
            }

            // Extract all definitions and examples from the dro's def section
            if (dro.gram === 'phrasal verb') {
              // Create the phrasal verb entity
              const phrasalVerbEntity = await tx.word.upsert({
                where: {
                  word_languageCode: {
                    word: cleanDrp,
                    languageCode: language,
                  },
                },
                create: {
                  word: cleanDrp,
                  languageCode: language,
                  difficultyLevel: 'B1',
                },
                update: {},
              });

              // Instead of creating relationship immediately, add to array for later processing

              relatedWordEntities.push({
                wordEntity: phrasalVerbEntity,
                type: RelationshipType.phrasal_verb,
              });

              // Process all definitions from the phrasal verb
              if (dro.def) {
                // Track phrasal verb definitions to avoid duplicates
                const phrasalVerbDefinitions = new Set<string>();

                for (const defEntry of dro.def) {
                  if (defEntry.sseq) {
                    for (const sseqItem of defEntry.sseq) {
                      for (const [senseType, senseData] of sseqItem) {
                        if (senseType === 'sense' || senseType === 'sdsense') {
                          const dt = senseData.dt;
                          const definitionText = dt?.find(
                            ([type]) => type === 'text',
                          )?.[1];

                          // Extract the phrasal verb annotation if present
                          let phrasalVerbAnnotation = '';
                          if (
                            senseData.phrasev &&
                            Array.isArray(senseData.phrasev)
                          ) {
                            const pva = senseData.phrasev.find(
                              (p: { pva?: string }) => p.pva,
                            )?.pva;
                            if (pva) {
                              phrasalVerbAnnotation = `${pva}: `;
                            }
                          }

                          // First, check for usage notes - do this regardless of text definition
                          const pvUsageNotesText: string[] = [];
                          const unsExamplesArray =
                            dt
                              ?.filter(([type]) => type === 'uns')
                              .flatMap(([, unsData]) => {
                                // uns structure can be complex with nested arrays
                                if (!Array.isArray(unsData)) return [];

                                return unsData.flatMap(
                                  (noteBlock: Array<[string, unknown]>) => {
                                    // Each note block is an array of [type, data] pairs
                                    if (!Array.isArray(noteBlock)) return [];

                                    // Extract usage note text from 'text' entries within the note block
                                    const textEntries = noteBlock
                                      .filter(
                                        ([noteType]) => noteType === 'text',
                                      )
                                      .map(
                                        ([, textData]) => textData as string,
                                      );

                                    if (textEntries.length > 0) {
                                      pvUsageNotesText.push(...textEntries);
                                    }

                                    // Find 'vis' entries within the note block
                                    return noteBlock
                                      .filter(
                                        ([noteType]) => noteType === 'vis',
                                      )
                                      .flatMap(
                                        ([, visData]) =>
                                          visData as VerbalIllustration[],
                                      );
                                  },
                                );
                              }) || [];

                          // Define cleaned definition text variable outside the if block
                          let cleanedDefinition: string | null = null;

                          // If we have a regular definition, use it
                          if (
                            definitionText &&
                            typeof definitionText === 'string' &&
                            !definitionText.startsWith('{dx')
                          ) {
                            // Add the phrasal verb annotation to the definition
                            cleanedDefinition =
                              phrasalVerbAnnotation +
                              cleanupDefinitionText(definitionText);
                          }
                          // If we don't have a regular definition but have usage notes, use those
                          else if (pvUsageNotesText.length > 0) {
                            cleanedDefinition =
                              phrasalVerbAnnotation +
                              pvUsageNotesText.join(' ');
                          }

                          // Only proceed if we have a definition from either source
                          if (cleanedDefinition) {
                            // Skip if we've already processed this definition
                            if (phrasalVerbDefinitions.has(cleanedDefinition)) {
                              continue;
                            }

                            // Add to our set of processed definitions
                            phrasalVerbDefinitions.add(cleanedDefinition);

                            // Extract examples from 'vis' entries
                            const examplesArray =
                              dt
                                ?.filter(([type]) => type === 'vis')
                                .flatMap(
                                  ([, visData]) =>
                                    visData as VerbalIllustration[],
                                ) || [];

                            // Combine both examples arrays
                            const allExamplesArray = [
                              ...examplesArray,
                              ...unsExamplesArray,
                            ];

                            // Deduplicate examples by their text
                            const uniqueExamples = new Map();
                            allExamplesArray.forEach((ex) => {
                              const cleanedText = cleanupExampleText(ex.t);
                              uniqueExamples.set(cleanedText, {
                                example: cleanedText,
                                languageCode: language,
                              });
                            });

                            // Process usage notes and prepare final definition
                            let finalDefinition = cleanedDefinition;
                            // Only append usage notes if they're not already the entire definition
                            if (
                              pvUsageNotesText.length > 0 &&
                              cleanedDefinition !==
                                phrasalVerbAnnotation +
                                  pvUsageNotesText.join(' ')
                            ) {
                              const cleanedUsageNotes = pvUsageNotesText
                                .map(
                                  (note, index) =>
                                    `${index + 1}) ${cleanupDefinitionText(note)};`,
                                )
                                .filter((note) => note && note.trim() !== '') // Remove empty notes
                                .join(' ');

                              if (cleanedUsageNotes) {
                                finalDefinition = `${finalDefinition}. Usage: ${cleanedUsageNotes}`;
                              }
                            }

                            // Extract additional metadata fields for phrasal verb
                            let pvSubjectStatusLabels = null;
                            if (senseData.sls && Array.isArray(senseData.sls)) {
                              pvSubjectStatusLabels = senseData.sls.join(',');
                            }

                            let pvGeneralLabels = null;
                            if (senseData.lbs && Array.isArray(senseData.lbs)) {
                              pvGeneralLabels = senseData.lbs.join(',');
                            }

                            const pvGrammaticalNote =
                              senseData.gram || senseData.sgram || null;

                            let pvIsInShortDef = false;
                            // Check if this phrasal verb definition appears in shortdef array
                            if (shortDefTexts.length > 0) {
                              pvIsInShortDef = shortDefTexts.some(
                                (shortDef) =>
                                  finalDefinition.includes(shortDef) ||
                                  shortDef.includes(finalDefinition),
                              );
                            }

                            // Only proceed if definition is valid (not a cross-ref)
                            if (finalDefinition) {
                              // Create Definition with phrasal_verb part of speech
                              const phrasalVerbDef = await tx.definition.create(
                                {
                                  data: {
                                    definition: finalDefinition,
                                    partOfSpeech: PartOfSpeech.phrasal_verb,
                                    source: source,
                                    languageCode: language,
                                    plural: false,
                                    subjectStatusLabels: pvSubjectStatusLabels,
                                    generalLabels: pvGeneralLabels,
                                    grammaticalNote: pvGrammaticalNote,
                                    isInShortDef: pvIsInShortDef,
                                    words: {
                                      create: {
                                        wordId: phrasalVerbEntity.id,
                                        isPrimary: true,
                                      },
                                    },
                                  },
                                },
                              );

                              // Create examples for the phrasal verb definition
                              for (const example of Array.from(
                                uniqueExamples.values(),
                              )) {
                                await tx.definitionExample.create({
                                  data: {
                                    example: example.example,
                                    languageCode: example.languageCode,
                                    definitionId: phrasalVerbDef.id,
                                  },
                                });
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }

              processedPhrases.add(cleanDrp);
              processedWords.add(cleanDrp);
            } else {
              // Handle non-phrasal verb dros (existing behavior)
              let droDefinitionText: string | null = null;
              let droExamples: VerbalIllustration[] = [];

              const firstDroDef = dro.def?.[0];
              if (firstDroDef?.sseq?.[0]?.[0]?.[1]) {
                // Navigate carefully
                const senseData = firstDroDef.sseq[0][0][1];

                // Extract text definition if it exists
                const textDt = senseData.dt?.find(([type]) => type === 'text');
                if (
                  textDt &&
                  typeof textDt[1] === 'string' &&
                  !textDt[1].startsWith('{dx')
                ) {
                  droDefinitionText = cleanupDefinitionText(textDt[1]);
                }

                // Extract examples from 'vis' entries - do this regardless of whether we have a text definition
                const examplesVis =
                  senseData.dt
                    ?.filter(([type]) => type === 'vis')
                    .flatMap(
                      ([, visData]) => visData as VerbalIllustration[],
                    ) || [];

                // Extract usage notes and examples from 'uns' entries - always do this
                const droUsageNotesText: string[] = [];
                const unsExamplesArray =
                  senseData.dt
                    ?.filter(([type]) => type === 'uns')
                    .flatMap(([, unsData]) => {
                      // uns structure can be complex with nested arrays
                      if (!Array.isArray(unsData)) return [];

                      return unsData.flatMap(
                        (noteBlock: Array<[string, unknown]>) => {
                          // Each note block is an array of [type, data] pairs
                          if (!Array.isArray(noteBlock)) return [];

                          // Extract usage note text from 'text' entries within the note block
                          const textEntries = noteBlock
                            .filter(([noteType]) => noteType === 'text')
                            .map(([, textData]) => textData as string);

                          if (textEntries.length > 0) {
                            droUsageNotesText.push(...textEntries);
                          }

                          // Find 'vis' entries within the note block
                          return noteBlock
                            .filter(([noteType]) => noteType === 'vis')
                            .flatMap(
                              ([, visData]) => visData as VerbalIllustration[],
                            );
                        },
                      );
                    }) || [];

                // Important: If we have no text definition but have usage notes,
                // use the usage notes as the definition
                if (!droDefinitionText && droUsageNotesText.length > 0) {
                  // Create a definition from the usage notes
                  droDefinitionText = droUsageNotesText.join(' ');
                }

                // Only continue if we have a definition from either source
                if (droDefinitionText) {
                  // Combine examples from both sources
                  const allExamplesArray = [
                    ...examplesVis,
                    ...unsExamplesArray,
                  ];

                  if (allExamplesArray.length > 0) {
                    // Deduplicate examples
                    const uniqueExamples = new Map();
                    allExamplesArray.forEach((ex) => {
                      const cleanedText = cleanupExampleText(ex.t);
                      uniqueExamples.set(cleanedText, cleanedText);
                    });

                    droExamples = Array.from(uniqueExamples.values()).map(
                      (value) => ({
                        t: value,
                      }),
                    );
                  }

                  // Format usage notes and append to the definition (only if the definition is not already just the usage notes)
                  if (
                    droUsageNotesText.length > 0 &&
                    droDefinitionText !== droUsageNotesText.join(' ')
                  ) {
                    const cleanedUsageNotes = droUsageNotesText
                      .map(
                        (note, index) =>
                          `${index + 1}) ${cleanupDefinitionText(note)};`,
                      )
                      .filter((note) => note && note.trim() !== '') // Remove empty notes
                      .join(' ');

                    if (cleanedUsageNotes) {
                      droDefinitionText = `${droDefinitionText}. Usage: ${cleanedUsageNotes}`;
                    }
                  }
                }
              }

              // Only proceed if we have a valid definition text (not a cross-ref)
              if (droDefinitionText) {
                // Handle as a Phrase entity (existing behavior)
                // Check if phrase exists
                let phraseEntity = await tx.phrase.findFirst({
                  where: {
                    phrase: cleanDrp,
                    languageCode: language,
                  },
                });

                if (phraseEntity) {
                  // Update existing phrase and ensure connection
                  await tx.phrase.update({
                    where: { id: phraseEntity.id },
                    data: {
                      definition: droDefinitionText,
                      words: {
                        connect: { id: sourceWord.id },
                      },
                    },
                  });
                } else {
                  // Create new phrase and connect
                  phraseEntity = await tx.phrase.create({
                    data: {
                      phrase: cleanDrp,
                      languageCode: language,
                      definition: droDefinitionText,
                      words: {
                        connect: { id: sourceWord.id },
                      },
                    },
                  });
                }

                // Add examples for the phrase
                for (const example of droExamples) {
                  // Check if this exact example already exists for this phrase
                  const existingExample = await tx.phraseExample.findFirst({
                    where: {
                      phraseId: phraseEntity.id,
                      example: example.t,
                    },
                  });
                  if (!existingExample) {
                    await tx.phraseExample.create({
                      data: {
                        phraseId: phraseEntity.id,
                        example: example.t,
                        languageCode: language,
                      },
                    });
                  }
                }
              }

              processedPhrases.add(cleanDrp);
              processedWords.add(cleanDrp);
            }
          }
        }

        // After all processing is complete, create relationships for all accumulated words
        for (const { wordEntity, type } of relatedWordEntities) {
          // Create relationship from source word to related word
          await tx.wordRelationship.upsert({
            where: {
              fromWordId_toWordId_type: {
                fromWordId: sourceWord.id,
                toWordId: wordEntity.id,
                type: type,
              },
            },
            create: {
              fromWordId: sourceWord.id,
              toWordId: wordEntity.id,
              type: type,
            },
            update: {},
          });

          // Create bidirectional relationship for synonyms and antonyms
          if (
            type === RelationshipType.synonym ||
            type === RelationshipType.antonym
          ) {
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: wordEntity.id,
                  toWordId: sourceWord.id,
                  type: type,
                },
              },
              create: {
                fromWordId: wordEntity.id,
                toWordId: sourceWord.id,
                type: type,
              },
              update: {},
            });
          }
        }

        // Process word stems as related words if they're not already processed
        if (apiResponse.meta.stems) {
          // Create a set of phrasal verbs for quick lookup
          const phrasalVerbSet = new Set(
            relatedWordEntities
              .filter(({ type }) => type === RelationshipType.phrasal_verb)
              .map(({ wordEntity }) => wordEntity.word),
          );

          for (const stem of apiResponse.meta.stems) {
            // Skip the source word itself and already processed words
            // if (stem === sourceWord.word || processedWords.has(stem)) {
            //   continue;
            // }
            if (stem === sourceWord.word) {
              continue;
            }
            // Check if the source word is multi-word
            const isSourceMultiWord = sourceWord.word.includes(' ');
            // Check if the stem contains spaces (multi-word)
            const isMultiWord = stem.includes(' ');

            // Skip if it's a multi-word stem but not a phrasal verb AND not related to a multi-word source
            if (
              isMultiWord &&
              !phrasalVerbSet.has(stem) &&
              !isSourceMultiWord
            ) {
              continue;
            }

            // Additional check: if source is multi-word, ensure the stem is related
            if (isSourceMultiWord && isMultiWord) {
              // Check if the stem shares a common base with the source word
              const sourceBase = sourceWord.word.toLowerCase();
              const stemBase = stem.toLowerCase();

              // Skip if there's no significant overlap between source and stem
              if (
                !sourceBase.includes(stemBase) &&
                !stemBase.includes(sourceBase)
              ) {
                continue;
              }
            }

            // Create the stem word entity
            const stemEntity = await tx.word.upsert({
              where: {
                word_languageCode: {
                  word: stem,
                  languageCode: language,
                },
              },
              create: {
                word: stem,
                languageCode: language,
                difficultyLevel: 'B1',
              },
              update: {},
            });

            // Create a related relationship
            await tx.wordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: sourceWord.id,
                  toWordId: stemEntity.id,
                  type: RelationshipType.related,
                },
              },
              create: {
                fromWordId: sourceWord.id,
                toWordId: stemEntity.id,
                type: RelationshipType.related,
              },
              update: {},
            });

            processedWords.add(stem);
          }
        }
      },
      { timeout: 120000 },
    );

    return processedData;
  } catch (error) {
    console.error('Error saving word data for:', apiResponse?.meta?.id, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
    }
    throw new Error(
      `Failed to save word data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function cleanupDefinitionText(text: unknown): string {
  if (typeof text !== 'string') {
    console.warn('Non-string definition text encountered:', text);
    return String(text || '')
      .replace(/{[^}]+}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return text
    .replace(/{[^}]+}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupExampleText(text: unknown): string {
  if (typeof text !== 'string') {
    console.warn('Non-string example text encountered:', text);
    return String(text || '')
      .replace(/{[^}]+}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return text
    .replace(/{[^}]+}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapPartOfSpeech(apiFl: string | undefined | null): PartOfSpeech {
  if (!apiFl) {
    console.warn('Missing functional label (fl) in API response.');
    return PartOfSpeech.noun;
  }
  switch (apiFl.toLowerCase()) {
    case 'noun':
      return PartOfSpeech.noun;
    case 'verb':
      return PartOfSpeech.verb;
    case 'phrasal verb':
      return PartOfSpeech.phrasal_verb;
    case 'adjective':
      return PartOfSpeech.adjective;
    case 'adverb':
      return PartOfSpeech.adverb;
    case 'pronoun':
      return PartOfSpeech.pronoun;
    case 'preposition':
      return PartOfSpeech.preposition;
    case 'conjunction':
      return PartOfSpeech.conjunction;
    case 'interjection':
      return PartOfSpeech.interjection;
    case 'abbreviation':
    case 'symbol':
      console.warn(
        `Mapping potentially unhandled part of speech: ${apiFl}. Defaulting to noun.`,
      );
      return PartOfSpeech.noun;
    default:
      console.warn(
        `Unknown part of speech encountered: ${apiFl}. Defaulting to noun.`,
      );
      return PartOfSpeech.noun;
  }
}

function mapSourceType(apiSrc: string | undefined | null): SourceType {
  if (!apiSrc) return SourceType.user;

  switch (apiSrc.toLowerCase()) {
    case 'learners':
      return SourceType.merriam_learners;
    case 'sd3':
      return SourceType.merriam_intermediate;
    case 'collegiate':

    default:
      console.warn(`Unknown source type: ${apiSrc}, defaulting to user`);
      return SourceType.user;
  }
}

// Define a type for the verbal illustration object based on API structure
interface VerbalIllustration {
  t: string; // Assuming 't' is the text field for the example
  // Add other fields if necessary (e.g., aq for attribution)
}

/**
 * Process etymology data from the Merriam-Webster API response
 * Format: [type, text] arrays like ["text", "Middle English..."], ["it", "Latin..."]
 * @param etymologyData Etymology data from the API response
 * @returns Formatted etymology string or null if no data is provided
 */
function processEtymology(
  etymologyData?: Array<[string, string]>,
): string | null {
  if (!etymologyData || etymologyData.length === 0) {
    return null;
  }

  // Extract text from etymology entries and join them
  const parts = etymologyData.map(([type, text]) => {
    // Handle different entry types
    if (type === 'text') {
      return text;
    } else if (type === 'it') {
      // Italicized text, we could format this differently if needed
      return text;
    } else {
      // For any other types, just return the text
      return text;
    }
  });

  // Clean up the text similarly to other text cleaning functions
  return parts
    .join(' ')
    .replace(/{[^}]+}/g, '') // Remove formatting tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Process and save multiple word objects from the Merriam-Webster API
 * @param apiResponses Array of MerriamWebsterResponse objects to process
 * @returns Array of processed word data
 */
export async function processAllWords(
  apiResponses: MerriamWebsterResponse[],
): Promise<ProcessedWordData[]> {
  const results: ProcessedWordData[] = [];

  for (const response of apiResponses) {
    try {
      const result = await processAndSaveWord(response);
      results.push(result);
    } catch (error) {
      console.error(`Error processing word ${response.meta?.id}:`, error);
      // Continue processing other words even if one fails
    }
  }

  return results;
}
