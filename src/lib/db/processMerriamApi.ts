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
  DifficultyLevel,
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
  uros?: Array<{
    ure: string;
    fl: string;
    prs?: MerriamWebsterPronunciation[];
    utxt?: Array<[string, unknown]>;
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

  // Process inflections from the API
  let pluralForm: string | null = null;
  const verbForms: Array<{
    form: string;
    type: string;
    phonetic?: string | null;
    audio?: string | null;
  }> = [];

  if (apiResponse.ins) {
    for (const inflection of apiResponse.ins) {
      if (!inflection.if) continue;

      // Clean the inflection form
      const cleanedForm = inflection.if.replace(/\*/g, '');

      // Skip if identical to base word
      if (cleanedForm === sourceWordText) continue;

      // Extract audio URL if available
      const formAudio = inflection.prs?.[0]?.sound?.audio
        ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${inflection.prs[0].sound.audio.charAt(0)}/${inflection.prs[0].sound.audio}.mp3`
        : null;

      // Extract phonetic spelling if available
      const formPhonetic =
        inflection.prs?.[0]?.ipa || inflection.prs?.[0]?.mw || null;

      // Handle special case for plurals
      if (inflection.il === 'plural') {
        pluralForm = cleanedForm;
      }

      // Save all forms for processing relationships later
      verbForms.push({
        form: cleanedForm,
        type: inflection.il || '',
        phonetic: formPhonetic,
        audio: formAudio,
      });
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
              const definitionText = dt?.find(
                ([type, content]) =>
                  type === 'text' &&
                  typeof content === 'string' &&
                  !content.startsWith('{dx}'),
              )?.[1];

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
              const isInShortDef = shortDefTexts.some((shortDef) =>
                isDefinitionMatch(
                  cleanedDefinition,
                  shortDef,
                  usageNotesText.length,
                ),
              );

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
                      languageCode: ex.languageCode as LanguageCode,
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
        const sourceWord = await upsertWord(
          tx,
          processedData.word.word,
          language,
          {
            phonetic: processedData.word.phonetic,
            audio: processedData.word.audio,
            etymology: processedData.word.etymology,
          },
        );

        const relatedWordEntities: Array<{
          wordEntity: Word;
          type: RelationshipType;
        }> = [];

        // Initialize set to track processed words/stems/phrases within this transaction
        const processedWords = new Set<string>([sourceWordText]);

        //! --- 4b. Handle Plural Form ---
        let pluralWordEntity = null;
        if (pluralForm && pluralForm !== sourceWord.word) {
          pluralWordEntity = await upsertWord(tx, pluralForm, language);

          // Instead of creating relationship immediately, add to array for later processing
          relatedWordEntities.push({
            wordEntity: pluralWordEntity,
            type: RelationshipType.plural_en,
          });

          processedWords.add(pluralForm); // Add plural form to processed set
        }

        //! --- 4b2. Process Verb Forms ---
        if (partOfSpeech === PartOfSpeech.verb && verbForms.length > 0) {
          for (const verbForm of verbForms) {
            // Skip if we've already processed this form (e.g., if it was a plural)
            if (processedWords.has(verbForm.form)) continue;

            // Determine the relationship type
            let relationType = mapInflectionLabelToRelationshipType(
              verbForm.type,
            );

            // If we couldn't determine the type from the label, infer from the word form
            if (!relationType) {
              relationType = inferRelationshipType(
                sourceWordText,
                verbForm.form,
              );
              if (!relationType) continue; // Skip if we still can't determine
            }

            // Create the verb form entity with pronunciation if available
            const verbFormEntity = await upsertWord(
              tx,
              verbForm.form,
              language,
              {
                phonetic: verbForm.phonetic || null,
                audio: verbForm.audio || null,
              },
            );

            // Create bidirectional relationships
            // From base verb to its form (e.g., take -> took)
            await createWordRelationship(
              tx,
              sourceWord.id,
              verbFormEntity.id,
              relationType,
              false, // No bidirectionality with the same type
            );

            // Create a reciprocal link from form back to base verb with proper descriptive type
            // This allows navigation from the inflection back to its base verb
            const reverseRelationship =
              determineReverseRelationship(relationType);
            if (reverseRelationship) {
              await createWordRelationship(
                tx,
                verbFormEntity.id,
                sourceWord.id,
                reverseRelationship,
                false,
              );
            }

            // Create a definition explaining this is a verb form
            const formDescription = getVerbFormDescription(
              verbForm.type,
              sourceWordText,
            );
            await createDefinitionWithExamples(
              tx,
              {
                definition: formDescription,
                partOfSpeech: PartOfSpeech.verb,
                source: source,
                languageCode: language,
                plural: false,
                subjectStatusLabels: null,
                generalLabels: null,
                grammaticalNote: `Verb form: ${verbForm.type}`,
                isInShortDef: false,
                examples: [],
              },
              verbFormEntity.id,
            );

            processedWords.add(verbForm.form);
          }
        }

        //! --- 4c. Process Synonyms & Antonyms from API ---
        //* Check for synonyms in the Merriam-Webster response
        if (apiResponse.meta?.syns) {
          for (const synArray of apiResponse.meta.syns) {
            for (const synonym of synArray) {
              if (!synonym || processedWords.has(synonym)) continue;

              const synonymEntity = await upsertWord(tx, synonym, language);

              relatedWordEntities.push({
                wordEntity: synonymEntity,
                type: RelationshipType.synonym,
              });

              processedWords.add(synonym);
            }
          }
        }

        //* Check for antonyms in the Merriam-Webster response
        if (apiResponse.meta?.ants) {
          for (const antArray of apiResponse.meta.ants) {
            for (const antonym of antArray) {
              if (!antonym || processedWords.has(antonym)) continue;

              const antonymEntity = await upsertWord(tx, antonym, language);

              relatedWordEntities.push({
                wordEntity: antonymEntity,
                type: RelationshipType.antonym,
              });

              processedWords.add(antonym);
            }
          }
        }

        //! --- 4c2. Process Undefined Run-Ons (uros) ---
        if (apiResponse.uros) {
          for (const uro of apiResponse.uros) {
            // Skip if no valid word form
            if (!uro.ure) continue;

            // Clean the run-on word form
            const cleanUro = uro.ure.replace(/\*/g, '');

            // Skip if we've already processed this word
            if (processedWords.has(cleanUro)) continue;

            // Create the run-on word entity with pronunciation if available
            const uroEntity = await upsertWord(tx, cleanUro, language, {
              phonetic: uro.prs?.[0]?.ipa || null,
              audio: uro.prs?.[0]?.sound?.audio
                ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${uro.prs[0].sound.audio.charAt(0)}/${uro.prs[0].sound.audio}.mp3`
                : null,
            });

            // Create relationship to base word
            await createWordRelationship(
              tx,
              sourceWord.id,
              uroEntity.id,
              RelationshipType.related,
              false,
            );

            // Process examples from utxt if available
            if (uro.utxt) {
              const examples: Array<{
                example: string;
                languageCode: LanguageCode;
              }> = [];

              for (const [type, content] of uro.utxt) {
                if (type === 'vis' && Array.isArray(content)) {
                  content.forEach((vis) => {
                    if (vis.t) {
                      examples.push({
                        example: cleanupExampleText(vis.t),
                        languageCode: language,
                      });
                    }
                  });
                }
              }

              // Create a definition for the run-on word
              await createDefinitionWithExamples(
                tx,
                {
                  definition: `Form of "${sourceWord.word}"`, // Basic definition showing relationship
                  partOfSpeech: mapPartOfSpeech(uro.fl),
                  source: source,
                  languageCode: language,
                  plural: false,
                  subjectStatusLabels: null,
                  generalLabels: null,
                  grammaticalNote: null,
                  isInShortDef: false,
                  examples: examples,
                },
                uroEntity.id,
              );
            }

            processedWords.add(cleanUro);
          }
        }

        //! --- 4d. Create Definitions and Examples ---
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

          if (!existingDef) {
            const definitionEntity = await createDefinitionWithExamples(
              tx,
              {
                definition: def.definition,
                partOfSpeech: mapPartOfSpeech(def.partOfSpeech),
                source: source,
                languageCode: LanguageCode.en,
                plural: def.isPlural,
                subjectStatusLabels: def.subjectStatusLabels || null,
                generalLabels: def.generalLabels || null,
                grammaticalNote: def.grammaticalNote || null,
                isInShortDef: def.isInShortDef || false,
                examples:
                  def.examples.map((ex) => ({
                    example: ex.example,
                    languageCode: ex.languageCode as LanguageCode,
                  })) || [],
              },
              sourceWord.id,
            );
            createdDefinitionIds.add(definitionEntity?.id || 0);
          } else {
            createdDefinitionIds.add(existingDef.id);
          }
        }

        //! --- 4e. Process Dros (Phrases/Phrasal Verbs) ---
        const processedPhrases = new Set<string>();
        if (apiResponse.dros) {
          for (const dro of apiResponse.dros as MerriamWebsterDro[]) {
            const cleanDrp = dro.drp.replace(/\*$/, '');
            // Only check if it's already in the processedPhrases set, don't check processedWords
            // which would filter out phrases we've previously added
            if (!cleanDrp || processedPhrases.has(cleanDrp)) {
              continue;
            }

            //* Extract all definitions and examples from the dro's def section
            if (dro.gram === 'phrasal verb') {
              // Create the phrasal verb entity
              const phrasalVerbEntity = await upsertWord(
                tx,
                cleanDrp,
                language,
              );

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
                              extractExamples(dt, language) || [];

                            // Combine both examples arrays
                            const allExamplesArray = [
                              ...examplesArray,
                              ...unsExamplesArray.map((ex) => ({
                                example: cleanupExampleText(ex.t),
                                languageCode: language,
                              })),
                            ];

                            // Deduplicate examples by their text
                            const uniqueExamples = new Map();
                            allExamplesArray.forEach((ex) => {
                              uniqueExamples.set(ex.example, ex);
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
                              finalDefinition = processUsageNotes(
                                finalDefinition,
                                pvUsageNotesText,
                              );
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
                              pvIsInShortDef = shortDefTexts.some((shortDef) =>
                                isDefinitionMatch(
                                  finalDefinition,
                                  shortDef,
                                  shortDefTexts.length,
                                ),
                              );
                            }

                            // Only proceed if definition is valid (not a cross-ref)
                            if (finalDefinition) {
                              // Create Definition with phrasal_verb part of speech
                              await createDefinitionWithExamples(
                                tx,
                                {
                                  definition: finalDefinition,
                                  partOfSpeech: PartOfSpeech.phrasal_verb,
                                  source: source,
                                  languageCode: language,
                                  plural: false,
                                  subjectStatusLabels: pvSubjectStatusLabels,
                                  generalLabels: pvGeneralLabels,
                                  grammaticalNote: pvGrammaticalNote,
                                  isInShortDef: pvIsInShortDef,
                                  examples: Array.from(uniqueExamples.values()),
                                },
                                phrasalVerbEntity.id,
                              );
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }

              processedPhrases.add(cleanDrp);
            } else if (dro.def) {
              // Handle non-phrasal verb dros
              let droDefinitionText: string | null = null;
              let droExamples: VerbalIllustration[] = [];

              const firstDroDef = dro.def?.[0];
              if (firstDroDef?.sseq) {
                // Process all senses and combine them into one definition
                const definitionParts: string[] = [];
                const allExamples: VerbalIllustration[] = [];

                // Iterate through all senses to combine them
                for (const sseqItem of firstDroDef.sseq) {
                  for (const [senseType, senseData] of sseqItem) {
                    if (senseType === 'sense' || senseType === 'sdsense') {
                      // Get the sense number if available
                      const senseNumber = senseData.sn
                        ? `${senseData.sn}. `
                        : '';

                      const dt = senseData.dt;
                      if (!dt) continue;

                      // First try to get text from 'uns' entries (usage notes)
                      const unsEntries = dt.filter(([type]) => type === 'uns');
                      for (const [, unsData] of unsEntries) {
                        if (Array.isArray(unsData)) {
                          for (const block of unsData) {
                            if (Array.isArray(block)) {
                              // Get text entries
                              const textEntries = block
                                .filter(([type]) => type === 'text')
                                .map(([, text]) => text as string);
                              if (textEntries.length > 0) {
                                const cleanedText = textEntries
                                  .map((text) => cleanupDefinitionText(text))
                                  .join(' ');
                                definitionParts.push(
                                  `${senseNumber}${cleanedText}`,
                                );
                              }

                              // Get examples
                              const visEntries = block
                                .filter(([type]) => type === 'vis')
                                .flatMap(
                                  ([, visData]) =>
                                    visData as VerbalIllustration[],
                                );
                              allExamples.push(...visEntries);
                            }
                          }
                        }
                      }

                      // Then try to get text from 'snote' entries
                      const snoteDt = dt.find(([type]) => type === 'snote');
                      if (snoteDt && Array.isArray(snoteDt[1])) {
                        for (const snoteItem of snoteDt[1]) {
                          if (Array.isArray(snoteItem)) {
                            const [type, content] = snoteItem;
                            if (type === 't') {
                              const cleanedText =
                                cleanupDefinitionText(content);
                              definitionParts.push(
                                `${senseNumber}${cleanedText}`,
                              );
                            } else if (type === 'vis') {
                              // Extract examples from snote section
                              const visExamples = content;
                              if (Array.isArray(visExamples)) {
                                allExamples.push(...visExamples);
                              }
                            }
                          }
                        }
                      }

                      // Finally try to get text from regular 'text' entries
                      const textDt = dt.find(([type]) => type === 'text');
                      if (
                        textDt &&
                        typeof textDt[1] === 'string' &&
                        !textDt[1].startsWith('{dx')
                      ) {
                        const cleanedText = cleanupDefinitionText(textDt[1]);
                        definitionParts.push(`${senseNumber}${cleanedText}`);
                      }

                      // Extract examples from 'vis' entries
                      const visExamples = dt
                        .filter(([type]) => type === 'vis')
                        .flatMap(
                          ([, visData]) => visData as VerbalIllustration[],
                        );
                      allExamples.push(...visExamples);
                    }
                  }
                }

                // Combine all parts into a single definition
                //!corrected ';' to ' '
                if (definitionParts.length > 0) {
                  droDefinitionText = definitionParts.join('; ');
                }

                // Process examples
                if (allExamples.length > 0) {
                  // Deduplicate examples
                  const uniqueExamples = new Map();
                  allExamples.forEach((ex) => {
                    const cleanedText = cleanupExampleText(ex.t);
                    uniqueExamples.set(cleanedText, {
                      t: cleanedText,
                    });
                  });

                  droExamples = Array.from(uniqueExamples.values());
                }
              }

              // Only proceed if we have a valid definition text
              if (droDefinitionText) {
                // Handle as a Phrase entity
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
            }
          }
        }

        //! After all processing is complete, create relationships for all accumulated words
        for (const { wordEntity, type } of relatedWordEntities) {
          // Create relationship from source word to related word
          await createWordRelationship(
            tx,
            sourceWord.id,
            wordEntity.id,
            type,
            type === RelationshipType.synonym ||
              type === RelationshipType.antonym,
          );
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
            // Skip the source word itself
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
              !isPhrasalVerb(stem, phrasalVerbSet) &&
              !isSourceMultiWord
            ) {
              continue;
            }

            // Additional check: if source is multi-word, ensure the stem is related
            if (isSourceMultiWord && isMultiWord) {
              // Skip if there's no significant overlap between source and stem
              if (!areWordsRelated(sourceWord.word, stem)) {
                continue;
              }
            }

            // Create the stem word entity
            const stemEntity = await upsertWord(tx, stem, language);

            // Create a related relationship
            await createWordRelationship(
              tx,
              sourceWord.id,
              stemEntity.id,
              RelationshipType.related,
            );

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

  // Skip if it's a cross-reference
  if (text.startsWith('{dx}')) {
    return '';
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

/**
 * Compare a definition with a short definition to determine if they match
 * Handles special cases like "Usage:" prefixes and different formatting
 */
function isDefinitionMatch(
  definition: string,
  shortDef: string,
  usageNotesTextArrayLength: number,
  similarityThreshold: number = 50,
): boolean {
  let countOfUsageNotes = 0;
  // Normalize both definitions with more comprehensive replacements
  const normalize = (text: string): string => {
    return (
      text
        .replace(/\s*[:;—–-]\s*/g, ' ')
        // Convert all separators to spaces
        .replace(/\s*\.\s*Usage:\s*/g, ' ')
        .replace(/^\d+\)\s*/g, '')
        .replace(/^only\s+/i, '') // Remove "only" prefix
        .replace(/\s+/g, ' ')
        .replace(/\s*\.\s*$/, '')
        .toLowerCase()
        .trim()
    );
  };

  const normalizedDef = normalize(definition);
  const normalizedShortDef = normalize(shortDef);

  // Split into main definition and usage parts
  const [mainDef, ...defUsageParts] = normalizedDef.split(/\s*:\s*/);
  const [mainShortDef, ...shortDefUsageParts] =
    normalizedShortDef.split(/\s*:\s*/);

  // Check main definition parts
  if (
    mainDef === mainShortDef ||
    (mainDef &&
      mainShortDef &&
      (mainDef.includes(mainShortDef) || mainShortDef.includes(mainDef)))
  ) {
    countOfUsageNotes++;
    return true;
  }

  // Check if full normalized strings match
  if (normalizedDef === normalizedShortDef) {
    countOfUsageNotes++;
    return true;
  }

  // Check usage parts if present
  if (defUsageParts.length > 0 && shortDefUsageParts.length > 0) {
    const defUsage = defUsageParts.join(' ');
    const shortDefUsage = shortDefUsageParts.join(' ');
    if (
      defUsage === shortDefUsage ||
      defUsage.includes(shortDefUsage) ||
      shortDefUsage.includes(defUsage)
    ) {
      countOfUsageNotes++;
      return true;
    }
  }

  // Fall back to fuzzy matching if we have usage notes
  if (
    usageNotesTextArrayLength > 0 &&
    countOfUsageNotes < usageNotesTextArrayLength
  ) {
    if (areSentencesSimilar(definition, shortDef, similarityThreshold)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if two sentences are similar based on word similarity
 * @param sentence1 The first sentence
 * @param sentence2 The second sentence
 * @param thresholdPercent The similarity threshold percentage
 * @returns True if the sentences are similar, false otherwise
 */
function areSentencesSimilar(
  sentence1: string,
  sentence2: string,
  thresholdPercent: number,
) {
  // Helper function to clean and split a sentence into words
  const getWords = (sentence: string) => {
    return sentence
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter((word) => word.length > 0); // Remove empty strings
  };

  const words1 = getWords(sentence1);
  const words2 = getWords(sentence2);

  // If both sentences are empty, consider them identical
  if (words1.length === 0 && words2.length === 0) return true;

  // Create sets of unique words
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Count common words
  let commonCount = 0;
  set1.forEach((word) => {
    if (set2.has(word)) commonCount++;
  });

  // Calculate similarity percentage (Jaccard index)
  const totalUniqueWords = set1.size + set2.size - commonCount;
  const similarityPercent = (commonCount / totalUniqueWords) * 100;

  return similarityPercent >= thresholdPercent;
}

/**
 * Map the part of speech from the API response to a PartOfSpeech enum value
 * @param apiFl The part of speech from the API response
 * @returns The mapped PartOfSpeech value
 */
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

/**
 * Map the source type from the API response to a SourceType enum value
 * @param apiSrc The source type from the API response
 * @returns The mapped SourceType value
 */
function mapSourceType(apiSrc: string | undefined | null): SourceType {
  if (!apiSrc) return SourceType.user;

  switch (apiSrc.toLowerCase()) {
    case 'learners':
      return SourceType.merriam_learners;
    case 'int_dict':
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

/**
 * Utility function to create or update a word entity
 * @param tx Prisma transaction
 * @param wordText The word text
 * @param language Language code
 * @param options Additional options for word creation
 * @returns The created or updated word entity
 */
async function upsertWord(
  tx: Prisma.TransactionClient,
  wordText: string,
  language: LanguageCode,
  options: {
    phonetic?: string | null;
    audio?: string | null;
    etymology?: string | null;
    difficultyLevel?: DifficultyLevel;
  } = {},
): Promise<Word> {
  // First create or update the word
  const word = await tx.word.upsert({
    where: {
      word_languageCode: {
        word: wordText,
        languageCode: language,
      },
    },
    create: {
      word: wordText,
      languageCode: language,
      phonetic: options.phonetic || null,
      etymology: options.etymology || null,
      difficultyLevel: options.difficultyLevel || DifficultyLevel.B1,
    },
    update: {
      ...(options.phonetic !== undefined && { phonetic: options.phonetic }),
      ...(options.etymology !== undefined && { etymology: options.etymology }),
    },
  });

  // If audio URL is provided, create audio entry and link it to the word
  if (options.audio) {
    // First find if audio with this URL exists
    const existingAudio = await tx.audio.findFirst({
      where: {
        url: options.audio,
      },
    });

    // Create or get the audio entry
    const audio =
      existingAudio ||
      (await tx.audio.create({
        data: {
          url: options.audio,
          source: SourceType.merriam_learners,
          languageCode: language,
        },
      }));

    // Create the word-audio relationship with isPrimary set to true
    await tx.wordAudio.upsert({
      where: {
        wordId_audioId: {
          wordId: word.id,
          audioId: audio.id,
        },
      },
      create: {
        wordId: word.id,
        audioId: audio.id,
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
    });
  }

  return word;
}

/**
 * Utility function to create a word relationship
 * @param tx Prisma transaction
 * @param fromWordId Source word ID
 * @param toWordId Target word ID
 * @param type Relationship type
 * @param isBidirectional Whether to create a bidirectional relationship
 */
async function createWordRelationship(
  tx: Prisma.TransactionClient,
  fromWordId: number,
  toWordId: number,
  type: RelationshipType,
  isBidirectional: boolean = false,
): Promise<void> {
  // Create relationship from source word to related word
  await tx.wordRelationship.upsert({
    where: {
      fromWordId_toWordId_type: {
        fromWordId,
        toWordId,
        type,
      },
    },
    create: {
      fromWordId,
      toWordId,
      type,
    },
    update: {},
  });

  // Create bidirectional relationship if specified
  if (isBidirectional) {
    await tx.wordRelationship.upsert({
      where: {
        fromWordId_toWordId_type: {
          fromWordId: toWordId,
          toWordId: fromWordId,
          type,
        },
      },
      create: {
        fromWordId: toWordId,
        toWordId: fromWordId,
        type,
      },
      update: {},
    });
  }
}

/**
 * Utility function to create a definition with examples
 * @param tx Prisma transaction
 * @param definitionData Definition data
 * @param wordId Word ID to associate with the definition
 * @returns The created definition entity
 */
async function createDefinitionWithExamples(
  tx: Prisma.TransactionClient,
  definitionData: {
    definition: string;
    partOfSpeech: PartOfSpeech;
    source: SourceType;
    languageCode: LanguageCode;
    plural: boolean;
    subjectStatusLabels: string | null;
    generalLabels: string | null;
    grammaticalNote: string | null;
    isInShortDef: boolean;
    examples: Array<{
      example: string;
      languageCode: LanguageCode;
    }>;
  },
  wordId: number,
) {
  // Check for similar definitions before creating
  const similarExists = await isSimilarDefinitionExists(tx, definitionData);
  if (similarExists) {
    console.log(`Skipping similar definition: ${definitionData.definition}`);
    return null;
  }

  // Create the definition
  const definitionEntity = await tx.definition.create({
    data: {
      definition: definitionData.definition,
      partOfSpeech: definitionData.partOfSpeech,
      source: definitionData.source,
      languageCode: definitionData.languageCode,
      plural: definitionData.plural,
      subjectStatusLabels: definitionData.subjectStatusLabels,
      generalLabels: definitionData.generalLabels,
      grammaticalNote: definitionData.grammaticalNote,
      isInShortDef: definitionData.isInShortDef,
      words: {
        create: {
          wordId,
          isPrimary: true,
        },
      },
    },
  });

  // Create examples for the definition
  for (const example of definitionData.examples) {
    await tx.definitionExample.create({
      data: {
        example: example.example,
        languageCode: example.languageCode,
        definitionId: definitionEntity.id,
      },
    });
  }

  return definitionEntity;
}

/**
 * Utility function to process usage notes and append them to a definition
 * @param definition Base definition text
 * @param usageNotes Array of usage notes
 * @returns Combined definition with usage notes
 */
function processUsageNotes(definition: string, usageNotes: string[]): string {
  if (usageNotes.length === 0) {
    return definition;
  }

  const cleanedUsageNotes = usageNotes
    .map((note, index) => `${index + 1}) ${cleanupDefinitionText(note)}`)
    .filter((note) => note && note.trim() !== '')
    .join(' ');

  if (cleanedUsageNotes) {
    return `${definition}. Usage: ${cleanedUsageNotes}`;
  }

  return definition;
}

/**
 * Utility function to extract examples from definition data
 * @param dt Definition data array
 * @param language Language code for examples
 * @returns Array of unique examples
 */
function extractExamples(
  dt: Array<[string, unknown]> | undefined,
  language: LanguageCode,
): Array<{ example: string; languageCode: LanguageCode }> {
  if (!dt) return [];

  const examplesArray = dt
    .filter(([type]) => type === 'vis')
    .flatMap(([, visData]) => visData as VerbalIllustration[]);

  const uniqueExamples = new Map();
  examplesArray.forEach((ex) => {
    const cleanedText = cleanupExampleText(ex.t);
    uniqueExamples.set(cleanedText, {
      example: cleanedText,
      languageCode: language,
    });
  });

  return Array.from(uniqueExamples.values());
}

/**
 * Utility function to check if a word is a phrasal verb
 * @param wordText Word text to check
 * @param phrasalVerbSet Set of known phrasal verbs
 * @returns Whether the word is a phrasal verb
 */
function isPhrasalVerb(wordText: string, phrasalVerbSet: Set<string>): boolean {
  return wordText.includes(' ') && phrasalVerbSet.has(wordText);
}

/**
 * Utility function to check if two words are related
 * @param sourceWord Source word text
 * @param targetWord Target word text
 * @returns Whether the words are related
 */
function areWordsRelated(sourceWord: string, targetWord: string): boolean {
  const sourceBase = sourceWord.toLowerCase();
  const targetBase = targetWord.toLowerCase();

  return (
    sourceBase.includes(targetBase) ||
    targetBase.includes(sourceBase) ||
    sourceBase === targetBase
  );
}

/**
 * Maps inflection labels to our available RelationshipType values
 * @param inflectionLabel The 'il' value from the API
 * @returns The appropriate RelationshipType or null if no match
 */
function mapInflectionLabelToRelationshipType(
  inflectionLabel: string | undefined,
): RelationshipType | null {
  if (!inflectionLabel) return null;

  // Normalize the label to lowercase for consistent matching
  const label = inflectionLabel.toLowerCase();

  // Map to our schema's relationship types
  if (label === 'plural') {
    return RelationshipType.plural_en;
  }

  if (['past', 'pa tense', 'past tense'].includes(label)) {
    return RelationshipType.past_tense_en;
  }

  if (['past part', 'pa part', 'past participle', 'pp'].includes(label)) {
    return RelationshipType.past_participle_en;
  }

  if (
    [
      'present part',
      'pres part',
      'present participle',
      'ing',
      'ing form',
    ].includes(label)
  ) {
    return RelationshipType.present_participle_en;
  }

  if (
    [
      '3rd sing',
      'third singular',
      'third person',
      'third person singular',
      's form',
      'singular',
    ].includes(label)
  ) {
    return RelationshipType.third_person_en;
  }

  return null;
}

/**
 * Determine relationship type using heuristics when explicit label is missing
 * @param baseWord Base form of the verb
 * @param inflectedForm Inflected form to analyze
 * @returns Best guess of relationship type or null if can't determine
 */
function inferRelationshipType(
  baseWord: string,
  inflectedForm: string,
): RelationshipType | null {
  // Remove any asterisks that might be in the inflection string
  const cleanInflection = inflectedForm.replace(/\*/g, '');
  const cleanBase = baseWord.toLowerCase();

  // Skip if they're the same word
  if (cleanInflection.toLowerCase() === cleanBase) {
    return null;
  }

  // Check for common patterns and map to proper relationship types
  if (cleanInflection.endsWith('ing')) {
    return RelationshipType.present_participle_en;
  }

  if (
    cleanInflection.endsWith('s') &&
    !cleanBase.endsWith('s') &&
    cleanInflection.length === cleanBase.length + 1
  ) {
    return RelationshipType.third_person_en;
  }

  // Check for past participle patterns
  if (cleanInflection.endsWith('ed') || cleanInflection.endsWith('en')) {
    return RelationshipType.past_participle_en;
  }

  // Check for common irregular past tense forms ending with 't'
  if (
    cleanInflection.endsWith('t') &&
    (cleanBase.endsWith('d') ||
      cleanBase.endsWith('y') ||
      cleanBase.endsWith('e'))
  ) {
    // Examples: send->sent, sleep->slept, etc.
    return RelationshipType.past_tense_en;
  }

  // If we can't determine, fall back to "related"
  return RelationshipType.related;
}

/**
 * Get a human-readable description of the verb form
 * @param formType Form type label from the API
 * @param baseWord Base word
 * @returns Human-readable description
 */
function getVerbFormDescription(formType: string, baseWord: string): string {
  const typeLC = formType.toLowerCase();

  if (['past', 'pa tense', 'past tense'].includes(typeLC)) {
    return `Past tense of "${baseWord}"`;
  }

  if (['past part', 'pa part', 'past participle', 'pp'].includes(typeLC)) {
    return `Past participle of "${baseWord}"`;
  }

  if (
    [
      'present part',
      'pres part',
      'present participle',
      'ing',
      'ing form',
    ].includes(typeLC)
  ) {
    return `Present participle of "${baseWord}"`;
  }

  if (
    [
      '3rd sing',
      'third singular',
      'third person',
      'third person singular',
      's form',
      'singular',
    ].includes(typeLC)
  ) {
    return `Third-person singular present of "${baseWord}"`;
  }

  if (typeLC === 'plural') {
    return `Plural form of "${baseWord}"`;
  }

  return `Form of "${baseWord}"`;
}

/**
 * Determines the appropriate reverse relationship type for verb inflections
 * @param forwardType The relationship type from base verb to inflection
 * @returns The relationship type from inflection back to base verb, or null if not applicable
 */
function determineReverseRelationship(
  forwardType: RelationshipType,
): RelationshipType | null {
  // For most verb forms, we use the "related" type for the reverse relationship
  // This indicates that the inflected form is related to the base verb
  // But doesn't specify a precise grammatical relationship in the reverse direction

  switch (forwardType) {
    case RelationshipType.past_tense_en:
    case RelationshipType.past_participle_en:
    case RelationshipType.present_participle_en:
    case RelationshipType.third_person_en:
    case RelationshipType.plural_en:
      return RelationshipType.related;

    // For semantic relationships, use the same type in both directions
    case RelationshipType.synonym:
    case RelationshipType.antonym:
      return forwardType;

    // For other types, don't create a reverse relationship
    default:
      return null;
  }
}

async function isSimilarDefinitionExists(
  tx: Prisma.TransactionClient,
  newDefinition: {
    definition: string;
    partOfSpeech: PartOfSpeech;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
    generalLabels: string | null;
    grammaticalNote: string | null;
    isInShortDef: boolean;
    plural: boolean;
  },
): Promise<boolean> {
  // First, check for exact matches using the unique constraint
  const exactMatch = await tx.definition.findFirst({
    where: {
      definition: newDefinition.definition,
      partOfSpeech: newDefinition.partOfSpeech,
      languageCode: newDefinition.languageCode,
      source: newDefinition.source,
      subjectStatusLabels: newDefinition.subjectStatusLabels,
      generalLabels: newDefinition.generalLabels,
      grammaticalNote: newDefinition.grammaticalNote,
      isInShortDef: newDefinition.isInShortDef,
      plural: newDefinition.plural,
    },
  });

  if (exactMatch) {
    console.log(
      `Exact match found for definition: "${newDefinition.definition}"`,
    );
    return true;
  }

  // Then, check for similar definitions with the same part of speech and language
  const similarDefinitions = await tx.definition.findMany({
    where: {
      partOfSpeech: newDefinition.partOfSpeech,
      languageCode: newDefinition.languageCode,
      source: newDefinition.source,
    },
  });

  // Use our existing similarity function with a higher threshold for database entries
  const normalizedNewDef = normalize(newDefinition.definition);
  for (const existingDef of similarDefinitions) {
    const normalizedExistingDef = normalize(existingDef.definition);

    // Check for high similarity (80% or more)
    if (areSentencesSimilar(normalizedNewDef, normalizedExistingDef, 90)) {
      console.log(`Similar definition found:
New: "${newDefinition.definition}"
Existing: "${existingDef.definition}"
Normalized New: "${normalizedNewDef}"
Normalized Existing: "${normalizedExistingDef}"`);
      return true;
    }
  }

  return false;
}

// Enhanced normalize function for better comparison
function normalize(text: string): string {
  return text
    .replace(/\s*[:;—–-]\s*/g, ' ') // Convert all separators to spaces
    .replace(/\s*\.\s*Usage:\s*/g, ' ')
    .replace(/^\d+\)\s*/g, '')
    .replace(/^only\s+/i, '') // Remove "only" prefix
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*$/, '')
    .replace(/[.,!?]/g, '') // Remove punctuation
    .replace(/["']/g, '') // Remove quotes
    .toLowerCase()
    .trim();
}
