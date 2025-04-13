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

/**Defenitions:
 * generalLabels "lbs" - a property that stores general labels (like capitalization indicators, usage notes, etc.)
 *
 * subjectStatusLabels "sls" - a property that stores subject status labels (like plural, singular, etc.)
 *
 * grammaticalNote "gram" - a property that stores grammatical notes (like phrasal verb, irregular verb, count, etc.)
 *
 * phonetic "ipa" - a property that stores the International Phonetic Alphabet (IPA) representation of the word's pronunciation.
 *
 * audio "sound" - a property that stores the URL or reference to the audio file for the word's pronunciation.
 *
 * etymology "et" - a property that stores the historical origin and development of the word.
 *
 * variants "vrs" - a property that stores alternative forms or spellings of the word.
 *
 * stems "stems" - a property that stores the base forms or root words from which the word is derived.
 *
 * synonyms "syns" - a property that stores words with similar meanings.
 * antonyms "ants" - a property that stores words with opposite meanings.
 *
 * inflections "ins" - a property that stores different grammatical forms of the word (e.g., plural, past tense).
 *
 * cross-references "cxs" - a property that stores references to related words or forms (e.g., past tense, past participle).
 *
 * definitions "def" - a property that stores the meanings and explanations of the word.
 *
 * examples "vis" - a property that stores usage examples or verbal illustrations of the word.
 *
 * phrasalVerbs "phrasev" - a property that stores phrasal verb forms and their meanings.
 *
 * usageNotes "uns" - a property that stores additional notes on how the word is used in context.
 *
 * shortDefinitions "shortdef" - a property that stores concise definitions of the word.
 *
 * partOfSpeech "fl" - a property that stores the grammatical category of the word (e.g., noun, verb).
 * source "src" - a property that stores the origin or dictionary source of the word's definition.
 * target "tsrc" - a property that stores the target language or dictionary for translations.
 * offensive "offensive" - a property that indicates if the word is considered offensive or sensitive.
 * artwork "art" - a property that stores references to images or illustrations related to the word.
 * tables "table" - a property that stores tabular data or structured information related to the word.
 * quotations "quotes" - a property that stores notable quotes or citations using the word.
 * verbalIllustrations "vis" - a property that stores examples of the word used in sentences or phrases.
 * attributions "aq" - a property that stores the source or author of a quote or example.
 * runIns "ri" - a property that stores inline or run-in text elements within the definition.
 * biographicalNotes "bios" - a property that stores biographical information related to the word.
 * geographicalDirection "g" - a property that stores geographical or directional information related to the word.
 * verbConjugations "cjts" - a property that stores the different conjugated forms of a verb.
 * genderLabels "gl" - a property that stores gender-specific forms or labels for the word.
 * relatedWords "rel_list" - a property that stores a list of words related in meaning or usage.
 * synonymLists "syn_list" - a property that stores lists of synonyms for the word.
 * antonymLists "ant_list" - a property that stores lists of antonyms for the word.
 * nearAntonymLists "near_list" - a property that stores lists of near antonyms for the word.
 * selfExplanatoryList "list" - a property that stores a list of self-explanatory terms or phrases.
 * synonymCrossReferences "srefs" - a property that stores cross-references to synonyms.
 * usageCrossReferences "urefs" - a property that stores cross-references to usage notes.
 * tokens "tokens" - a property that stores formatting or grammatical tokens used in the definition text.
 *
 *
 *
 *
 */

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

export interface MerriamWebsterVariant {
  vl: string; // variant label (e.g., "or less commonly", "or")
  va: string; // variant form
}

export interface MerriamWebsterDefinitionSense {
  sn?: string;
  sgram?: string;
  dt: Array<[string, unknown]>;
  sdsense?: MerriamWebsterDefinitionSense;
  phrasev?: Array<{ pva?: string }>;
  sphrasev?: {
    phrs: Array<{ pva?: string }>;
    phsls?: string[];
  };
  sls?: string[];
  lbs?: string[];
  gram?: string;
  shortdef?: string | string[];
}

export interface MerriamWebsterDefinitionEntry {
  vd?: string;
  sseq: Array<Array<[string, MerriamWebsterDefinitionSense]>>;
}

export interface MerriamWebsterDro {
  drp: string;
  def?: MerriamWebsterDefinitionEntry[];
  gram?: string;
}

export interface MerriamWebsterResponse {
  meta: {
    id: string;
    uuid: string;
    src: string;
    section: string;
    target: {
      tsrc?: string;
    };
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
  vrs?: MerriamWebsterVariant[]; // Add variants field
  dros?: Array<{
    drp: string;
    def?: MerriamWebsterDefinitionEntry[];
    gram?: string;
  }>;
  uros?: Array<{
    ure: string;
    fl: string;
    prs?: MerriamWebsterPronunciation[];
    utxt?: Array<[string, unknown]>;
  }>;
  cxs?: Array<{
    cxl: string;
    cxtis: Array<{
      cxt: string;
    }>;
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

export async function processAndSaveWord(
  apiResponse: MerriamWebsterResponse,
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  // Clean headword: remove all asterisks and any potential trailing ones (though replaceAll should handle it)
  const sourceWordText = apiResponse.hwi.hw.replaceAll('*', '');

  const checkedWordDetails = await getWordDetails(sourceWordText);

  const language = LanguageCode.en; // Hardcoded because we are using the English dictionary API
  const source = mapSourceType(apiResponse.meta.src);
  const partOfSpeech = mapPartOfSpeech(apiResponse.fl);
  //const section = apiResponse.meta.section;
  //const entrySource = apiResponse.meta.target.tsrc;

  // Extract primary audio
  //?do we need this file if we have audioFiles?
  const audio = apiResponse.hwi.prs?.[0]?.sound?.audio
    ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${apiResponse.hwi.prs[0].sound.audio.charAt(0)}/${apiResponse.hwi.prs[0].sound.audio}.mp3`
    : null;

  // Extract all audio files (including alternate pronunciations)
  const audioFiles: string[] = [];

  // Process main pronunciations from hwi.prs
  if (apiResponse.hwi.prs && apiResponse.hwi.prs.length > 0) {
    apiResponse.hwi.prs.forEach((pronunciation) => {
      if (pronunciation.sound?.audio) {
        const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
        audioFiles.push(audioUrl);
      }
    });
  }

  // Process alternate pronunciations from hwi.altprs if available
  if (apiResponse.hwi.altprs && apiResponse.hwi.altprs.length > 0) {
    apiResponse.hwi.altprs.forEach((pronunciation) => {
      if (pronunciation.sound?.audio) {
        const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
        audioFiles.push(audioUrl);
      }
    });
  }

  // Process etymology data from the API response
  const etymology = processEtymology(apiResponse.et);

  // Process variants if they exist

  // pack this into a function
  /*
variants = {
  variant: string;
  type: string;
  note: string;
}
  */

  const processVariantsFunction = (apiResponse: MerriamWebsterResponse) => {
    const variants: Array<{ variant: string; type: string; note: string }> = [];

    if (apiResponse.vrs && Array.isArray(apiResponse.vrs)) {
      apiResponse.vrs.forEach((variantItem) => {
        // Clean the variant form by removing asterisks
        const cleanedVariant = variantItem.va.replaceAll('*', '');
        // Skip if the variant is the same as the main word
        if (cleanedVariant !== sourceWordText) {
          variants.push({
            variant: cleanedVariant,
            type: 'spelling',
            note: variantItem.vl || '',
          });
        }
      });
    }
    return variants;
  };

  const variants = processVariantsFunction(apiResponse);

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
      audioFiles: audioFiles.length > 0 ? audioFiles : null,
      etymology: etymology || checkedWordDetails?.word?.etymology || null,
      relatedWords: [],
    },
    definitions: [],
    phrases: [],
    stems: apiResponse.meta.stems || [],
  };

  let generalLabels: string = '';
  /*
CXS section
*/
  // Handle cross-references (cxs) if present (for irregular verbs)
  if (apiResponse.cxs && apiResponse.cxs.length > 0) {
    for (const cx of apiResponse.cxs) {
      if (cx.cxtis?.length > 0 && cx.cxtis[0]?.cxt) {
        const baseWord = cx.cxtis[0].cxt;
        const relationship = cx.cxl.toLowerCase();

        // Create a definition based on the cross-reference
        let definitionText = '';

        if (apiResponse.fl === 'verb') {
          if (relationship.includes('past tense and past participle')) {
            definitionText = `Past tense and past participle of "${baseWord}"`;
          } else if (relationship.includes('past participle')) {
            definitionText = `Past participle of "${baseWord}"`;
          } else if (relationship.includes('past tense')) {
            definitionText = `Past tense of "${baseWord}"`;
          }

          if (definitionText) {
            processedData.definitions.push({
              partOfSpeech: PartOfSpeech.verb,
              source: source,
              languageCode: language,
              isPlural: false,
              definition: definitionText,
              subjectStatusLabels: null,
              generalLabels: null,
              grammaticalNote: relationship,
              isInShortDef: false,
              examples: [],
            });
          }
        }
        if (apiResponse.fl === 'noun') {
          if (relationship.includes('less common spelling')) {
            generalLabels = `Less common spelling of "${baseWord}"`;
          }
        }
      }
    }
  }
  console.log('generalLabels', generalLabels);

  // Process inflections from the API

  const verbForms: Array<{
    form: string;
    type: string;
    phonetic?: string | null;
    audio?: string | null;
  }> = [];

  let pluralForm: string | null = null;

  if (apiResponse.ins && apiResponse.fl === 'verb') {
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

      // Save all forms for processing relationships later
      verbForms.push({
        form: cleanedForm,
        type: inflection.il || '',
        phonetic: formPhonetic,
        audio: formAudio,
      });
    }
  }

  const nounForms: Array<{
    form: string;
    type: string;
    phonetic?: string | null;
    audio?: string | null;
  }> = [];

  if (apiResponse.ins && apiResponse.fl === 'noun') {
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

      pluralForm = inflection.il || null;
      // Save all forms for processing relationships later
      nounForms.push({
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
                ?.filter(([type]: [string, unknown]) => type === 'vis')
                .flatMap(
                  ([, visData]: [string, unknown]) =>
                    visData as VerbalIllustration[],
                );

              // Extract phrasal verb annotation if present
              let phrasalVerbAnnotation = '';

              // Track all phrasal verb annotations to create variants
              const phrasalVerbAnnotations = new Set<string>();

              // Check for phrasev (array-based format)
              if (senseData.phrasev && Array.isArray(senseData.phrasev)) {
                try {
                  // Change from find to map to get all pva values
                  const pvas = senseData.phrasev
                    .filter((p: { pva?: string }) => p.pva)
                    .map((p: { pva?: string }) => p.pva as string);

                  if (pvas.length > 0) {
                    // Use the first one for annotation in the definition
                    phrasalVerbAnnotation = `${pvas[0]}: `;

                    // Add all pva values to the set of annotations
                    pvas.forEach((pva) => phrasalVerbAnnotations.add(pva));
                  }
                } catch (error) {
                  console.warn('Error processing phrasev:', error);
                }
              }
              // Check for sphrasev (object with phrs array format)
              else if (
                senseData.sphrasev?.phrs &&
                Array.isArray(senseData.sphrasev.phrs)
              ) {
                try {
                  // Change from find to map to get all pva values
                  const pvas = senseData.sphrasev.phrs
                    .filter((p: { pva?: string }) => p.pva)
                    .map((p: { pva?: string }) => p.pva as string);

                  if (pvas.length > 0) {
                    // Use the first one for annotation in the definition
                    phrasalVerbAnnotation = `${pvas[0]}: `;

                    // Add all pva values to the set of annotations
                    pvas.forEach((pva) => phrasalVerbAnnotations.add(pva));
                  }
                } catch (error) {
                  console.warn('Error processing sphrasev:', error);
                }
              }

              // Extract usage notes and examples from 'uns' entries
              const usageNotesText: string[] = [];
              const unsExamplesArray =
                dt
                  ?.filter(([type]: [string, unknown]) => type === 'uns')
                  .flatMap(([, unsData]: [string, unknown]) => {
                    // uns structure can be complex with nested arrays
                    // Each uns entry can contain multiple note blocks
                    if (!Array.isArray(unsData)) return [];

                    return unsData.flatMap(
                      (noteBlock: Array<[string, unknown]>) => {
                        // Each note block is an array of [type, data] pairs
                        if (!Array.isArray(noteBlock)) return [];

                        // Extract usage note text from 'text' entries within the note block
                        const textEntries = noteBlock
                          .filter(
                            ([noteType]: [string, unknown]) =>
                              noteType === 'text',
                          )
                          .map(
                            ([, textData]: [string, unknown]) =>
                              textData as string,
                          );

                        if (textEntries.length > 0) {
                          usageNotesText.push(...textEntries);
                        }

                        // Find 'vis' entries within the note block
                        return noteBlock
                          .filter(
                            ([noteType]: [string, unknown]) =>
                              noteType === 'vis',
                          )
                          .flatMap(
                            ([, visData]: [string, unknown]) =>
                              visData as VerbalIllustration[],
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

              // Apply phrasal verb prefix if available
              if (phrasalVerbAnnotation && cleanedDefinition) {
                cleanedDefinition = phrasalVerbAnnotation + cleanedDefinition;
              }

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

                // If we have phrasal verb annotations, save them with the definition
                if (phrasalVerbAnnotations.size > 0) {
                  processedData.word.phrasalVerbAnnotations = Array.from(
                    phrasalVerbAnnotations,
                  );
                }
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
            audioFiles: processedData.word.audioFiles || null,
            etymology: processedData.word.etymology,
          },
        );

        // Process any phrasalVerbAnnotations
        if (processedData.word.phrasalVerbAnnotations?.length) {
          for (const pva of processedData.word.phrasalVerbAnnotations) {
            // Create a word entity for the phrasal verb annotation
            const pvaEntity = await upsertWord(tx, pva, language);

            // Create relationship instead of wordVariant
            await createWordRelationship(
              tx,
              sourceWord.id,
              pvaEntity.id,
              RelationshipType.variant_form_phrasal_verb_en,
              false,
            );
          }
        }

        // Process word variants
        if (variants.length > 0) {
          for (const variant of variants) {
            // Create word entity for the variant
            const variantEntity = await upsertWord(
              tx,
              variant.variant,
              language,
            );

            // Create relationship instead of wordVariant
            await createWordRelationship(
              tx,
              sourceWord.id,
              variantEntity.id,
              RelationshipType.alternative_spelling,
              false,
            );
          }
        }

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

            //! Create a definition explaining this is a verb form
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

        //! --- 4e. Process Variants (vrs) ---
        if (apiResponse.vrs) {
          for (const variant of apiResponse.vrs) {
            const cleanVariant = variant.va.replace(/\*/g, '');
            if (!cleanVariant || processedWords.has(cleanVariant)) {
              continue;
            }

            // Create the variant word entity
            const variantEntity = await upsertWord(tx, cleanVariant, language);

            // Create both alternative_spelling and related relationships
            await createWordRelationship(
              tx,
              sourceWord.id,
              variantEntity.id,
              RelationshipType.alternative_spelling,
              false,
            );

            await createWordRelationship(
              tx,
              sourceWord.id,
              variantEntity.id,
              RelationshipType.related,
              false,
            );

            // Add a definition indicating this is a variant
            const variantLabel = variant.vl || 'variant form';
            await createDefinitionWithExamples(
              tx,
              {
                definition: `${variantLabel} of "${sourceWord.word}"`,
                partOfSpeech: partOfSpeech,
                source: source,
                languageCode: language,
                plural: false,
                subjectStatusLabels: null,
                generalLabels: null,
                grammaticalNote: `Variant: ${variantLabel}`,
                isInShortDef: false,
                examples: [],
              },
              variantEntity.id,
            );

            processedWords.add(cleanVariant);
          }
        }

        //! --- 4f. Process Dros (Phrases/Phrasal Verbs) ---
        const processedPhrases = new Set<string>();
        if (apiResponse.dros) {
          for (const dro of apiResponse.dros as MerriamWebsterDro[]) {
            const cleanDrp = dro.drp.replace(/\*$/, '');
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

              // Create both phrasal_verb and related relationships
              await createWordRelationship(
                tx,
                sourceWord.id,
                phrasalVerbEntity.id,
                RelationshipType.phrasal_verb,
                false,
              );

              await createWordRelationship(
                tx,
                sourceWord.id,
                phrasalVerbEntity.id,
                RelationshipType.related,
                false,
              );

              // Process all definitions from the phrasal verb
              if (dro.def) {
                for (const defEntry of dro.def) {
                  if (defEntry.sseq) {
                    for (const sseqItem of defEntry.sseq) {
                      for (const [senseType, senseData] of sseqItem) {
                        if (senseType === 'sense' || senseType === 'sdsense') {
                          // First, process the main phrasal verb definition
                          const dt = senseData.dt;
                          if (dt) {
                            const definitionText = dt.find(
                              ([type]: [string, unknown]) => type === 'text',
                            )?.[1];

                            if (
                              definitionText &&
                              typeof definitionText === 'string'
                            ) {
                              const cleanedDefinition =
                                cleanupDefinitionText(definitionText);

                              // Create definition for the main phrasal verb
                              const definitionData = {
                                definition: cleanedDefinition,
                                partOfSpeech: PartOfSpeech.phrasal_verb,
                                source: source,
                                languageCode: language,
                                plural: false,
                                subjectStatusLabels:
                                  senseData.sphrasev?.phsls?.join(', ') ||
                                  senseData.sls?.join(', ') ||
                                  null,
                                generalLabels: null,
                                grammaticalNote: null,
                                isInShortDef: false,
                                examples: extractExamples(dt, language) || [],
                              };

                              await createDefinitionWithExamples(
                                tx,
                                definitionData,
                                phrasalVerbEntity.id,
                              );

                              // Now process phrasal verb variants (pva)
                              const pvas: string[] = [];

                              // Check for phrasev (array-based format)
                              if (
                                senseData.phrasev &&
                                Array.isArray(senseData.phrasev)
                              ) {
                                pvas.push(
                                  ...senseData.phrasev
                                    .filter((p: { pva?: string }) => p.pva)
                                    .map(
                                      (p: { pva?: string }) => p.pva as string,
                                    ),
                                );
                              }

                              // Check for sphrasev (object with phrs array format)
                              if (
                                senseData.sphrasev?.phrs &&
                                Array.isArray(senseData.sphrasev.phrs)
                              ) {
                                pvas.push(
                                  ...senseData.sphrasev.phrs
                                    .filter((p: { pva?: string }) => p.pva)
                                    .map(
                                      (p: { pva?: string }) => p.pva as string,
                                    ),
                                );
                              }

                              // Process each phrasal verb variant
                              for (const pva of pvas) {
                                if (!pva || processedPhrases.has(pva)) continue;

                                // Create the variant entity
                                const variantEntity = await upsertWord(
                                  tx,
                                  pva,
                                  language,
                                );

                                // Create variant_form_phrasal_verb_en relationship
                                await createWordRelationship(
                                  tx,
                                  phrasalVerbEntity.id,
                                  variantEntity.id,
                                  RelationshipType.variant_form_phrasal_verb_en,
                                  false,
                                );

                                // Share the same definition with the variant
                                await createDefinitionWithExamples(
                                  tx,
                                  {
                                    ...definitionData,
                                    grammaticalNote: 'Phrasal verb variant',
                                  },
                                  variantEntity.id,
                                );

                                processedPhrases.add(pva);
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
            } else if (dro.def) {
              // Handle regular phrases
              const phraseDefinitions: string[] = [];
              const phraseExamples: Array<{
                example: string;
                languageCode: LanguageCode;
              }> = [];

              // Process all definitions and examples from the phrase
              for (const defEntry of dro.def) {
                if (defEntry.sseq) {
                  for (const sseqItem of defEntry.sseq) {
                    for (const [senseType, senseData] of sseqItem) {
                      if (senseType === 'sense' || senseType === 'sdsense') {
                        const dt = senseData.dt;
                        if (!dt) continue;

                        // Get definition text
                        const definitionText = dt.find(
                          ([type]: [string, unknown]) => type === 'text',
                        )?.[1];

                        if (
                          definitionText &&
                          typeof definitionText === 'string'
                        ) {
                          const cleanedDef =
                            cleanupDefinitionText(definitionText);
                          if (cleanedDef) {
                            // Add sense number if available
                            const sensePrefix = senseData.sn
                              ? `${senseData.sn}. `
                              : '';
                            phraseDefinitions.push(sensePrefix + cleanedDef);
                          }
                        }

                        // Get examples
                        const examples = extractExamples(dt, language);
                        if (examples.length > 0) {
                          phraseExamples.push(...examples);
                        }
                      }
                    }
                  }
                }
              }

              if (phraseDefinitions.length > 0) {
                // Create or update the phrase
                let phraseEntity = await tx.phrase.findFirst({
                  where: {
                    phrase: cleanDrp,
                    languageCode: language,
                  },
                });

                const combinedDefinition = phraseDefinitions.join('; ');

                if (phraseEntity) {
                  // Update existing phrase
                  await tx.phrase.update({
                    where: { id: phraseEntity.id },
                    data: {
                      definition: combinedDefinition,
                      words: {
                        connect: { id: sourceWord.id },
                      },
                    },
                  });
                } else {
                  // Create new phrase
                  phraseEntity = await tx.phrase.create({
                    data: {
                      phrase: cleanDrp,
                      languageCode: language,
                      definition: combinedDefinition,
                      words: {
                        connect: { id: sourceWord.id },
                      },
                    },
                  });
                }

                // Add examples for the phrase
                for (const example of phraseExamples) {
                  // Check if this exact example already exists
                  const existingExample = await tx.phraseExample.findFirst({
                    where: {
                      phraseId: phraseEntity.id,
                      example: example.example,
                    },
                  });

                  if (!existingExample) {
                    await tx.phraseExample.create({
                      data: {
                        phraseId: phraseEntity.id,
                        example: example.example,
                        languageCode: example.languageCode,
                      },
                    });
                  }
                }
              }
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
    audioFiles?: string[] | null;
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

  // If single audio URL is provided, create audio entry and link it to the word
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

  // Process multiple audio files if provided
  if (options.audioFiles && options.audioFiles.length > 0) {
    // Process each audio URL
    for (let i = 0; i < options.audioFiles.length; i++) {
      const audioUrl = options.audioFiles[i];
      if (!audioUrl) continue;

      // Skip if it's the same as the primary audio we already processed
      if (audioUrl === options.audio) continue;

      // First find if audio with this URL exists
      const existingAudio = await tx.audio.findFirst({
        where: {
          url: audioUrl,
        },
      });

      // Create or get the audio entry
      const audio =
        existingAudio ||
        (await tx.audio.create({
          data: {
            url: audioUrl,
            source: SourceType.merriam_learners,
            languageCode: language,
          },
        }));

      // Create the word-audio relationship (not primary)
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
          isPrimary: i === 0 && !options.audio, // Only set as primary if it's the first one and no primary audio was set
        },
        update: {}, // Don't change isPrimary if it already exists
      });
    }
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
    .filter(([type]: [string, unknown]) => type === 'vis')
    .flatMap(
      ([, visData]: [string, unknown]) => visData as VerbalIllustration[],
    );

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
