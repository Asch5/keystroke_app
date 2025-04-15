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

/**Definitions:
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

  enum SOURCE_OF_WORD {
    VRS = 'vrs',
    CXS = 'cxs',
    INS = 'ins',
    NONE = 'none',
    SYN = 'syn',
    ANT = 'ant',
    DRO = 'dro',
    URO = 'uro',
  }

  interface SubWordData {
    word: string;
    languageCode: string;
    phonetic?: string | null;
    audio?: string | null;
    audioFiles?: string[] | null;
    etymology?: string | null;
    definitions: {
      partOfSpeech: PartOfSpeech;
      source: string;
      languageCode: string;
      isPlural: boolean;
      definition: string;
      subjectStatusLabels?: string | null;
      generalLabels?: string | null;
      grammaticalNote?: string | null;
      usageNote?: string | null;
      isInShortDef?: boolean;
      examples: {
        example: string;
        languageCode: string;
        grammaticalNote?: string | null;
      }[];
    }[];
    relationship: {
      fromWord: string;
      toWord: string;
      type: RelationshipType;
    }[];
    sourceData: SOURCE_OF_WORD[];
  }

  interface SubPhraseData {
    word: string;
    languageCode: string;
    definition: string;
    subjectStatusLabels: string | null;
    relationship: {
      fromWord: string;
      toWord: string;
      type: RelationshipType;
    }[];
    examples: {
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
    }[];
    sourceData: SOURCE_OF_WORD[];
  }

  const subWordsArray: SubWordData[] = [];
  const subPhrasesArray: SubPhraseData[] = [];
  //!VRS Subwords handler for nouns
  if (apiResponse.vrs && Array.isArray(apiResponse.vrs)) {
    apiResponse.vrs.forEach((variantItem) => {
      // Clean the variant form by removing asterisks
      const cleanedVariant = variantItem.va.replaceAll('*', '');
      const variantTypeDefinition = `Variant form of "${sourceWordText} + ${variantItem.vl}"`;
      // Skip if the variant is the same as the main word
      if (cleanedVariant !== sourceWordText) {
        subWordsArray.push({
          word: cleanedVariant,
          languageCode: language,
          phonetic: null,
          audio: null,
          etymology: variantTypeDefinition,
          definitions: [],
          relationship: [
            {
              fromWord: sourceWordText,
              toWord: cleanedVariant,
              type: RelationshipType.related,
            },
          ],
          sourceData: [SOURCE_OF_WORD.VRS],
        });
      }
    });
  }

  //!INS Subwords handler for verbs
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

      // Create an array of audio files
      const audioFiles: string[] = [];
      if (formAudio) {
        audioFiles.push(formAudio);
      }

      // Process all pronunciations if there are multiple
      if (inflection.prs && inflection.prs.length > 0) {
        inflection.prs.forEach((pronunciation, index) => {
          if (index === 0) return; // Skip the first one as it's already processed
          if (pronunciation.sound?.audio) {
            const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
            audioFiles.push(audioUrl);
          }
        });
      }

      // Extract phonetic spelling if available
      const formPhonetic =
        inflection.prs?.[0]?.ipa || inflection.prs?.[0]?.mw || null;

      subWordsArray.push({
        word: cleanedForm,
        languageCode: language,
        phonetic: formPhonetic,
        audio: formAudio, // Keep this for backward compatibility
        audioFiles: audioFiles.length > 0 ? audioFiles : null, // Add audioFiles array
        etymology: null,
        definitions: [],
        relationship: [
          {
            fromWord: sourceWordText,
            toWord: cleanedForm,
            type: RelationshipType.related,
          },
        ],
        sourceData: [SOURCE_OF_WORD.INS],
      });
    }
  }

  //!INS Subwords handler for nouns Plural Form
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

      // Create an array of audio files
      const audioFiles: string[] = [];
      if (formAudio) {
        audioFiles.push(formAudio);
      }

      // Process all pronunciations if there are multiple
      if (inflection.prs && inflection.prs.length > 0) {
        inflection.prs.forEach((pronunciation, index) => {
          if (index === 0) return; // Skip the first one as it's already processed
          if (pronunciation.sound?.audio) {
            const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
            audioFiles.push(audioUrl);
          }
        });
      }

      // Extract phonetic spelling if available
      const formPhonetic =
        inflection.prs?.[0]?.ipa || inflection.prs?.[0]?.mw || null;

      let pluralForm: RelationshipType | null = null;
      if (inflection.il === 'plural') {
        pluralForm = RelationshipType.plural_en;
      }

      subWordsArray.push({
        word: cleanedForm,
        languageCode: language,
        phonetic: formPhonetic,
        audio: formAudio, // Keep this for backward compatibility
        audioFiles: audioFiles.length > 0 ? audioFiles : null, // Add audioFiles array
        etymology: null,
        definitions: [],
        relationship: [
          {
            fromWord: sourceWordText,
            toWord: cleanedForm,
            type: RelationshipType.related,
          },
          ...(pluralForm
            ? [
                {
                  fromWord: sourceWordText,
                  toWord: cleanedForm,
                  type: pluralForm,
                },
              ]
            : []),
        ],
        sourceData: [SOURCE_OF_WORD.INS],
      });
    }
  }

  //!SYN & ANT subwords handler for synonyms & antonyms
  if (apiResponse.meta?.syns) {
    for (const synArray of apiResponse.meta.syns) {
      for (const synonym of synArray) {
        if (!synonym) continue;

        subWordsArray.push({
          word: synonym,
          languageCode: language,
          definitions: [],
          relationship: [
            {
              fromWord: sourceWordText,
              toWord: synonym,
              type: RelationshipType.synonym,
            },
          ],
          sourceData: [SOURCE_OF_WORD.SYN],
        });
      }
    }
  }
  if (apiResponse.meta?.ants) {
    for (const antArray of apiResponse.meta.ants) {
      for (const antonym of antArray) {
        if (!antonym) continue;

        subWordsArray.push({
          word: antonym,
          languageCode: language,
          definitions: [],
          relationship: [
            {
              fromWord: sourceWordText,
              toWord: antonym,
              type: RelationshipType.antonym,
            },
          ],
          sourceData: [SOURCE_OF_WORD.ANT],
        });
      }
    }
  }

  //!DRO Phrases handler
  if (apiResponse.dros) {
    for (const dro of apiResponse.dros as MerriamWebsterDro[]) {
      const cleanDrp = dro.drp.replace(/\*$/, '');
      if (!cleanDrp) {
        continue;
      }

      if (dro.gram === 'phrasal verb') {
        const subWordPhrasalVerb: SubWordData = {
          word: cleanDrp,
          languageCode: language,
          definitions: [],
          relationship: [
            {
              fromWord: sourceWordText,
              toWord: cleanDrp,
              type: RelationshipType.related,
            },
            {
              fromWord: sourceWordText,
              toWord: cleanDrp,
              type: RelationshipType.phrasal_verb,
            },
          ],
          sourceData: [SOURCE_OF_WORD.DRO],
        };
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
                        typeof definitionText === 'string' &&
                        definitionText.startsWith('{dx}')
                      ) {
                        continue;
                      }
                      if (
                        definitionText &&
                        typeof definitionText === 'string'
                      ) {
                        const cleanedDefinition =
                          cleanupDefinitionText(definitionText);

                        // Get phrasal verb examples and usage notes
                        const phrasalVerbData = extractExamples(dt, language);
                        const getPhrasalVerbExamples = phrasalVerbData.examples;
                        const phrasalVerbUsage = phrasalVerbData.usageNote;

                        // Create definition for the main phrasal verb
                        const definitionData = {
                          definition: cleanedDefinition,
                          partOfSpeech: PartOfSpeech.phrasal_verb,
                          source: source,
                          languageCode: language,
                          isPlural: false,
                          subjectStatusLabels:
                            senseData.sphrasev?.phsls?.join(', ') ||
                            senseData.sls?.join(', ') ||
                            null,
                          generalLabels: null,
                          grammaticalNote: null,
                          usageNote: phrasalVerbUsage,
                          isInShortDef: false,
                          examples: getPhrasalVerbExamples || [],
                        };

                        subWordPhrasalVerb.definitions.push(definitionData);

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
                              .map((p: { pva?: string }) => p.pva as string),
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
                              .map((p: { pva?: string }) => p.pva as string),
                          );
                        }

                        // Process each phrasal verb variant
                        for (const pva of pvas) {
                          const cleanPva = pva.replace(/\*$/, '');
                          subWordsArray.push({
                            word: cleanPva,
                            languageCode: language,
                            definitions: [definitionData],
                            relationship: [
                              {
                                fromWord: sourceWordText,
                                toWord: pva,
                                type: RelationshipType.related,
                              },
                              {
                                fromWord: cleanDrp,
                                toWord: pva,
                                type: RelationshipType.variant_form_phrasal_verb_en,
                              },
                            ],
                            sourceData: [SOURCE_OF_WORD.DRO],
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
        subWordsArray.push(subWordPhrasalVerb);
      } else if (dro.drp) {
        // Handle regular phrases
        const phraseEntityData: SubPhraseData = {
          word: cleanDrp,
          languageCode: language,
          definition: '',
          subjectStatusLabels: null,
          examples: [],
          relationship: [
            {
              fromWord: sourceWordText,
              toWord: cleanDrp,
              type: RelationshipType.related,
            },
          ],
          sourceData: [SOURCE_OF_WORD.DRO],
        };

        // Process all definitions and examples from the phrase
        let hasValidDefinition = false; // Flag to track if we have at least one valid definition
        for (const defEntry of dro.def || []) {
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

                  // Skip if the definition text is invalid
                  if (
                    definitionText &&
                    typeof definitionText === 'string' &&
                    definitionText.startsWith('{dx}')
                  ) {
                    continue; // Skip this definition
                  }

                  if (definitionText && typeof definitionText === 'string') {
                    const cleanedDef = cleanupDefinitionText(definitionText);

                    if (cleanedDef) {
                      // Add sense number if available
                      const sensePrefix = senseData.sn
                        ? `${senseData.sn}. `
                        : '';
                      phraseEntityData.definition = phraseEntityData.definition
                        ? phraseEntityData.definition +
                          ' ' +
                          sensePrefix +
                          cleanedDef
                        : sensePrefix + cleanedDef;

                      hasValidDefinition = true; // Mark that we have a valid definition
                    }
                  }
                  phraseEntityData.subjectStatusLabels =
                    senseData.sphrasev?.phsls?.join(', ') ||
                    senseData.sls?.join(', ') ||
                    null;

                  // Get examples
                  const examplesData = extractExamples(dt, language);
                  if (examplesData.examples.length > 0) {
                    phraseEntityData.examples.push(...examplesData.examples);
                  }
                }
              }
            }
          }
        }

        // Push the phraseEntityData only if there is at least one valid definition
        if (hasValidDefinition) {
          subPhrasesArray.push(phraseEntityData);
        }
      }
    }
  }
  //! Process Undefined Run-Ons (uros)
  if (apiResponse.uros) {
    for (const uro of apiResponse.uros) {
      // Skip if no valid word form
      if (!uro.ure) continue;

      const cleanUro = uro.ure.replace(/\*/g, '');

      // Skip if the variant is the same as the main word
      if (cleanUro === sourceWordText) continue;

      // Extract audio URL if available
      const audioUrl = uro.prs?.[0]?.sound?.audio
        ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${uro.prs[0].sound.audio.charAt(0)}/${uro.prs[0].sound.audio}.mp3`
        : null;

      // Extract examples from utxt
      const examples =
        uro.utxt?.reduce(
          (
            acc: Array<{
              example: string;
              languageCode: LanguageCode;
            }>,
            [type, content],
          ) => {
            if (type === 'vis' && Array.isArray(content)) {
              content.forEach((vis) => {
                if (vis.t) {
                  acc.push({
                    example: cleanupExampleText(vis.t),
                    languageCode: language,
                  });
                }
              });
            }
            return acc;
          },
          [],
        ) || [];

      // Create SubWordData for the run-on word
      const uroSubWord: SubWordData = {
        word: cleanUro,
        languageCode: language,
        phonetic: uro.prs?.[0]?.ipa || uro.prs?.[0]?.mw || null,
        audio: audioUrl,
        etymology: `Form of "${sourceWordText}"`,
        definitions: [
          {
            partOfSpeech: mapPartOfSpeech(uro.fl),
            source: source,
            languageCode: language,
            isPlural: false,
            definition: `Form of "${sourceWordText}"`,
            subjectStatusLabels: null,
            generalLabels: null,
            grammaticalNote: null,
            isInShortDef: false,
            examples: examples,
          },
        ],
        relationship: [
          {
            fromWord: sourceWordText,
            toWord: cleanUro,
            type: RelationshipType.related,
          },
        ],
        sourceData: [SOURCE_OF_WORD.URO],
      };

      subWordsArray.push(uroSubWord);
    }
  }

  /*
/
/
/
/
sourceWordText processing
/
/
/
/

*/
  //!shortdef Short Definitions handler
  const shortDefTexts = new Set<string>();
  if (apiResponse.shortdef && Array.isArray(apiResponse.shortdef)) {
    apiResponse.shortdef.forEach((shortDef) => {
      if (typeof shortDef === 'string') {
        shortDefTexts.add(normalize(shortDef));
      }
    });
  }

  //!CXS Cross References handler Verbs
  if (apiResponse.cxs && apiResponse.cxs.length > 0) {
    for (const cx of apiResponse.cxs) {
      if (cx.cxtis?.length > 0 && cx.cxtis[0]?.cxt) {
        const baseWord = cx.cxtis[0].cxt;
        const relationship = cx.cxl.toLowerCase();

        // Create a definition based on the cross-reference
        let definitionText = '';
        let relationshipType: RelationshipType | null = null;

        if (apiResponse.fl === 'verb') {
          if (relationship.includes('past tense and past participle')) {
            definitionText = `Past tense and past participle of "${baseWord}"`;
            relationshipType = RelationshipType.past_tense_en; // Primary relationship type
          } else if (relationship.includes('past participle')) {
            definitionText = `Past participle of "${baseWord}"`;
            relationshipType = RelationshipType.past_participle_en;
          } else if (relationship.includes('past tense')) {
            definitionText = `Past tense of "${baseWord}"`;
            relationshipType = RelationshipType.past_tense_en;
          } else if (relationship.includes('present participle')) {
            definitionText = `Present participle of "${baseWord}"`;
            relationshipType = RelationshipType.present_participle_en;
          } else if (relationship.includes('third person singular')) {
            definitionText = `Third person singular of "${baseWord}"`;
            relationshipType = RelationshipType.third_person_en;
          }

          if (definitionText && relationshipType) {
            // Add definition for the current word
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

            // Set etymology
            processedData.word.etymology = definitionText;

            // Add to subWordsArray to establish relationship
            subWordsArray.push({
              word: baseWord, // The base word e.g., "get" for "got"
              languageCode: language,
              phonetic: null,
              audio: null,
              audioFiles: null,
              etymology: null,
              definitions: [],
              relationship: [
                {
                  fromWord: baseWord, // Reversed relationship
                  toWord: sourceWordText,
                  type: relationshipType,
                },
                {
                  fromWord: sourceWordText,
                  toWord: baseWord,
                  type: RelationshipType.related,
                },
              ],
              sourceData: [SOURCE_OF_WORD.CXS],
            });
          }
        } else if (apiResponse.fl === 'noun') {
          if (relationship.includes('less common spelling')) {
            definitionText = `Less common spelling of "${baseWord}"`;
            relationshipType = RelationshipType.alternative_spelling;

            // Set etymology
            processedData.word.etymology = definitionText;

            // Add to subWordsArray to establish relationship
            subWordsArray.push({
              word: baseWord,
              languageCode: language,
              phonetic: null,
              audio: null,
              audioFiles: null,
              etymology: null,
              definitions: [],
              relationship: [
                {
                  fromWord: sourceWordText,
                  toWord: baseWord,
                  type: relationshipType,
                },
                {
                  fromWord: baseWord,
                  toWord: sourceWordText,
                  type: RelationshipType.related,
                },
              ],
              sourceData: [SOURCE_OF_WORD.CXS],
            });
          }
        }
      }
    }
  }
  //!DEF Definitions handler
  if (apiResponse.def) {
    const processedDefinitions = new Set<string>(); // Track processed definitions to avoid duplicates

    for (const defEntry of apiResponse.def) {
      const currentPartOfSpeech = defEntry.vd
        ? mapPartOfSpeech(defEntry.vd)
        : partOfSpeech;

      if (defEntry.sseq) {
        for (const sseqItem of defEntry.sseq) {
          for (const [senseType, senseData] of sseqItem) {
            if (senseType === 'sense' || senseType === 'sdsense') {
              const dt = senseData.dt;
              if (!dt) continue;

              // Extract definition text
              const definitionText = dt?.find(
                ([type, content]) =>
                  type === 'text' &&
                  typeof content === 'string' &&
                  !content.startsWith('{dx}'),
              )?.[1];

              const cleanDefinitionText = cleanupDefinitionText(definitionText);

              if (
                !cleanDefinitionText ||
                typeof cleanDefinitionText !== 'string' ||
                cleanDefinitionText.trim() === ''
              )
                continue;

              // Process grammatical notes
              const grammaticalNote = senseData.sgram;

              const generalLabels = senseData.lbs?.join(', ') || null;

              // Process subject status labels
              const subjectStatusLabels =
                senseData.sphrasev?.phsls?.join(', ') ||
                senseData.sls?.join(', ') ||
                null;

              // Clean and normalize definition text
              const normalizedDefinition = normalize(cleanDefinitionText);

              // Skip if we've already processed this definition
              if (processedDefinitions.has(normalizedDefinition)) continue;
              processedDefinitions.add(normalizedDefinition);

              // Extract examples and usage notes
              const { examples, usageNote } = extractExamples(dt, language);

              // Create definition object
              processedData.definitions.push({
                partOfSpeech: currentPartOfSpeech,
                source: source,
                languageCode: language,
                isPlural: false,
                definition: cleanDefinitionText,
                subjectStatusLabels,
                generalLabels: generalLabels || null,
                grammaticalNote: grammaticalNote || null,
                usageNote: usageNote,
                isInShortDef: shortDefTexts.has(normalizedDefinition),
                examples,
              });
            }
          }
        }
      }
    }
  }

  try {
    // Add a transaction to save the data to the database
    await prisma.$transaction(
      async (tx) => {
        // 1. Create or update the main Word
        const mainWord = await upsertWord(
          tx,
          source as SourceType,
          sourceWordText,
          language as LanguageCode,
          {
            phonetic: processedData.word.phonetic || null,
            audio: processedData.word.audio || null,
            audioFiles: processedData.word.audioFiles || null,
            etymology: processedData.word.etymology || null,
            difficultyLevel: DifficultyLevel.B1, // Default difficulty level
          },
        );

        // 2. Process and save definitions
        for (const definitionData of processedData.definitions) {
          try {
            // Create the definition - using findFirst followed by create to avoid type issues
            const existingDefinition = await tx.definition.findFirst({
              where: {
                definition: definitionData.definition,
                partOfSpeech: definitionData.partOfSpeech as PartOfSpeech,
                languageCode: definitionData.languageCode as LanguageCode,
                source: definitionData.source as SourceType,
                subjectStatusLabels: definitionData.subjectStatusLabels || null,
                generalLabels: definitionData.generalLabels || null,
                grammaticalNote: definitionData.grammaticalNote || null,
                usageNote: definitionData.usageNote || null,
                isInShortDef: definitionData.isInShortDef || false,
                plural: definitionData.isPlural || false,
              },
            });

            const definition =
              existingDefinition ||
              (await tx.definition.create({
                data: {
                  definition: definitionData.definition,
                  partOfSpeech: definitionData.partOfSpeech as PartOfSpeech,
                  languageCode: definitionData.languageCode as LanguageCode,
                  source: definitionData.source as SourceType,
                  subjectStatusLabels:
                    definitionData.subjectStatusLabels || null,
                  generalLabels: definitionData.generalLabels || null,
                  grammaticalNote: definitionData.grammaticalNote || null,
                  usageNote: definitionData.usageNote || null,
                  isInShortDef: definitionData.isInShortDef || false,
                  plural: definitionData.isPlural || false,
                  frequencyUsing: 0,
                },
              }));

            // Link definition to word
            await tx.wordDefinition.upsert({
              where: {
                wordId_definitionId: {
                  wordId: mainWord.id,
                  definitionId: definition.id,
                },
              },
              create: {
                wordId: mainWord.id,
                definitionId: definition.id,
                isPrimary: true,
              },
              update: {},
            });

            // Create examples for the definition
            if (definitionData.examples && definitionData.examples.length > 0) {
              // Process examples in smaller batches to avoid timeouts
              const batchSize = 10;
              const exampleBatches = [];

              // Split examples into batches
              for (
                let i = 0;
                i < definitionData.examples.length;
                i += batchSize
              ) {
                exampleBatches.push(
                  definitionData.examples.slice(i, i + batchSize),
                );
              }

              // Process each batch
              for (const batch of exampleBatches) {
                // Use Promise.all for parallel processing within each batch
                await Promise.all(
                  batch.map(async (example) => {
                    return tx.definitionExample.upsert({
                      where: {
                        definitionId_example: {
                          definitionId: definition.id,
                          example: example.example,
                        },
                      },
                      create: {
                        example: example.example,
                        languageCode: example.languageCode as LanguageCode,
                        definitionId: definition.id,
                        grammaticalNote: example.grammaticalNote || null,
                      },
                      update: {
                        grammaticalNote: example.grammaticalNote || null,
                      },
                    });
                  }),
                );
              }
            }
          } catch (error) {
            console.error('Error processing definition:', error);
            throw error;
          }
        }

        // 3. Process sub-words
        for (const subWord of subWordsArray) {
          // Create or update the sub-word
          const subWordEntity = await upsertWord(
            tx,
            source as SourceType,
            subWord.word,
            subWord.languageCode as LanguageCode,
            {
              phonetic: subWord.phonetic || null,
              audio: subWord.audio || null,
              audioFiles: subWord.audioFiles || null,
              etymology: subWord.etymology || null,
              difficultyLevel: DifficultyLevel.B1, // Default difficulty level
            },
          );

          // Create relationships between words
          if (subWord.relationship.length > 0) {
            // Process relationships in batches
            const batchSize = 20;
            const relationBatches = [];

            // Split relationships into batches
            for (let i = 0; i < subWord.relationship.length; i += batchSize) {
              relationBatches.push(
                subWord.relationship.slice(i, i + batchSize),
              );
            }

            // Process each batch
            for (const batch of relationBatches) {
              await Promise.all(
                batch.map(async (relation) => {
                  return tx.wordRelationship.upsert({
                    where: {
                      fromWordId_toWordId_type: {
                        fromWordId: mainWord.id,
                        toWordId: subWordEntity.id,
                        type: relation.type,
                      },
                    },
                    create: {
                      fromWordId: mainWord.id,
                      toWordId: subWordEntity.id,
                      type: relation.type,
                    },
                    update: {},
                  });
                }),
              );
            }
          }

          // Process definitions for subword
          for (const defData of subWord.definitions) {
            // Find or create definition using findFirst + create approach
            const existingSubDef = await tx.definition.findFirst({
              where: {
                definition: defData.definition,
                partOfSpeech: defData.partOfSpeech as PartOfSpeech,
                languageCode: defData.languageCode as LanguageCode,
                source: defData.source as SourceType,
                subjectStatusLabels: defData.subjectStatusLabels || null,
                generalLabels: defData.generalLabels || null,
                grammaticalNote: defData.grammaticalNote || null,
                usageNote: defData.usageNote || null,
                isInShortDef: defData.isInShortDef || false,
                plural: defData.isPlural || false,
              },
            });

            const subWordDef =
              existingSubDef ||
              (await tx.definition.create({
                data: {
                  definition: defData.definition,
                  partOfSpeech: defData.partOfSpeech as PartOfSpeech,
                  languageCode: defData.languageCode as LanguageCode,
                  source: defData.source as SourceType,
                  subjectStatusLabels: defData.subjectStatusLabels || null,
                  generalLabels: defData.generalLabels || null,
                  grammaticalNote: defData.grammaticalNote || null,
                  usageNote: defData.usageNote || null,
                  isInShortDef: defData.isInShortDef || false,
                  plural: defData.isPlural || false,
                  frequencyUsing: 0,
                },
              }));

            // Link definition to word
            await tx.wordDefinition.upsert({
              where: {
                wordId_definitionId: {
                  wordId: subWordEntity.id,
                  definitionId: subWordDef.id,
                },
              },
              create: {
                wordId: subWordEntity.id,
                definitionId: subWordDef.id,
                isPrimary: true,
              },
              update: {},
            });

            // Create examples for the sub-word definition
            if (defData.examples.length > 0) {
              // Process examples in smaller batches to avoid timeouts
              const batchSize = 10;
              const exampleBatches = [];

              // Split examples into batches
              for (let i = 0; i < defData.examples.length; i += batchSize) {
                exampleBatches.push(defData.examples.slice(i, i + batchSize));
              }

              // Process each batch
              for (const batch of exampleBatches) {
                // Use Promise.all for parallel processing within each batch
                await Promise.all(
                  batch.map(async (example) => {
                    return tx.definitionExample.upsert({
                      where: {
                        definitionId_example: {
                          definitionId: subWordDef.id,
                          example: example.example,
                        },
                      },
                      create: {
                        example: example.example,
                        languageCode: example.languageCode as LanguageCode,
                        definitionId: subWordDef.id,
                        grammaticalNote: example.grammaticalNote || null,
                      },
                      update: {
                        grammaticalNote: example.grammaticalNote || null,
                      },
                    });
                  }),
                );
              }
            }
          }
        }

        // 4. Process phrases
        for (const phraseData of subPhrasesArray) {
          // Create the phrase
          const phrase = await tx.phrase.upsert({
            where: {
              phrase_languageCode: {
                phrase: phraseData.word,
                languageCode: phraseData.languageCode as LanguageCode,
              },
            },
            create: {
              phrase: phraseData.word,
              definition: phraseData.definition,
              languageCode: phraseData.languageCode as LanguageCode,
              subjectStatusLabels: phraseData.subjectStatusLabels,
              words: {
                connect: { id: mainWord.id },
              },
            },
            update: {
              definition: phraseData.definition,
              subjectStatusLabels: phraseData.subjectStatusLabels,
            },
          });

          // Create examples for the phrase
          if (phraseData.examples.length > 0) {
            // Process examples in smaller batches to avoid timeouts
            const batchSize = 10;
            const exampleBatches = [];

            // Split examples into batches
            for (let i = 0; i < phraseData.examples.length; i += batchSize) {
              exampleBatches.push(phraseData.examples.slice(i, i + batchSize));
            }

            // Process each batch
            for (const batch of exampleBatches) {
              // Use Promise.all for parallel processing within each batch
              await Promise.all(
                batch.map(async (example) => {
                  return tx.phraseExample.upsert({
                    where: {
                      phraseId_example: {
                        phraseId: phrase.id,
                        example: example.example,
                      },
                    },
                    create: {
                      example: example.example,
                      languageCode: example.languageCode as LanguageCode,
                      phraseId: phrase.id,
                      grammaticalNote: example.grammaticalNote || null,
                    },
                    update: {
                      grammaticalNote: example.grammaticalNote || null,
                    },
                  });
                }),
              );
            }
          }
        }
      },
      {
        maxWait: 60000, // 60 seconds max wait time (increased from 10 seconds)
        timeout: 120000, // 120 seconds timeout (increased from 30 seconds)
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Less strict than RepeatableRead for better performance
      },
    );

    return processedData;
  } catch (error) {
    console.error('Error saving word data for:', apiResponse?.meta?.id, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
      // Add specific error handling based on error codes
      if (error.code === 'P2028') {
        throw new Error(
          'Transaction timed out or was invalidated. Please try again.',
        );
      }
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
 * Utility function to extract examples from definition data
 * @param dt Definition data array
 * @param language Language code for examples
 * @returns Array of unique examples with their associated grammatical notes and the extracted usage notes string
 */
function extractExamples(
  dt: Array<[string, unknown]> | undefined,
  language: LanguageCode,
): {
  examples: Array<{
    example: string;
    languageCode: LanguageCode;
    grammaticalNote?: string | null;
  }>;
  usageNote: string | null;
} {
  if (!dt || !Array.isArray(dt)) return { examples: [], usageNote: null };

  const examples: Array<{
    example: string;
    languageCode: LanguageCode;
    grammaticalNote?: string | null;
  }> = [];

  // Track usage notes
  const usages: Array<{ text: string; examples: string[] }> = [];

  // Process the dt array sequentially to associate wsgram with the following vis
  let currentWsgram: string | null = null;

  for (let i = 0; i < dt.length; i++) {
    const item = dt[i];
    if (!Array.isArray(item) || item.length < 2) continue;

    const [type, content] = item;

    // If we encounter a wsgram, update the current grammatical note
    if (type === 'wsgram' && typeof content === 'string') {
      currentWsgram = content;
    }
    // If we encounter examples, use the current grammatical note
    else if (type === 'vis' && Array.isArray(content)) {
      const visExamples = content as VerbalIllustration[];

      visExamples.forEach((ex) => {
        const cleanedText = cleanupExampleText(ex.t);
        examples.push({
          example: cleanedText,
          languageCode: language,
          grammaticalNote: currentWsgram,
        });
      });
    }
    // If we encounter uns (usage notes), process nested examples with current grammatical note
    else if (type === 'uns' && Array.isArray(content)) {
      const result = processNestedExamples(content, language, currentWsgram);

      // Add the examples with usage note info
      result.examples.forEach((ex) => {
        examples.push({
          example: ex.example,
          languageCode: ex.languageCode,
          grammaticalNote: ex.grammaticalNote,
        });
      });

      // Store usage notes
      if (result.usageTexts.length > 0) {
        usages.push(
          ...result.usageTexts.map((text, i) => ({
            text,
            examples: result.usageToExamples[i] || [],
          })),
        );
      }
    }
  }

  // Remove duplicates while preserving grammatical notes
  const uniqueExamples = new Map();
  examples.forEach((ex) => {
    // If example already exists with no grammatical note but this one has a note, prefer this one
    const existing = uniqueExamples.get(ex.example);
    if (!existing || (!existing.grammaticalNote && ex.grammaticalNote)) {
      uniqueExamples.set(ex.example, ex);
    }
  });

  // Format usage notes
  let formattedUsageNote = null;
  if (usages.length > 0) {
    formattedUsageNote = usages
      .map((usage, index) => `Usage #${index + 1}: ${usage.text}`)
      .join('; ');
  }

  return {
    examples: Array.from(uniqueExamples.values()),
    usageNote: formattedUsageNote,
  };
}

/**
 * Helper function to process nested examples from usage notes
 * @returns Object with examples, usageTexts array, and mapping of usage to examples
 */
function processNestedExamples(
  content: Array<unknown>,
  language: LanguageCode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parentGramNote: string | null,
): {
  examples: Array<{
    example: string;
    languageCode: LanguageCode;
    grammaticalNote: string | null;
  }>;
  usageTexts: string[];
  usageToExamples: Record<number, string[]>;
  usageIndex: number;
} {
  const examples: Array<{
    example: string;
    languageCode: LanguageCode;
    grammaticalNote: string | null;
  }> = [];

  const usageTexts: string[] = [];
  const usageToExamples: Record<number, string[]> = {};
  let usageIndex = 0;

  // Handle nested arrays in usage notes
  if (Array.isArray(content)) {
    content.forEach((item) => {
      if (Array.isArray(item)) {
        let usageText = '';
        const currentExamples: string[] = [];

        item.forEach((subItem) => {
          if (Array.isArray(subItem) && subItem.length >= 2) {
            const [subType, subContent] = subItem as [string, unknown];

            // Extract usage text
            if (subType === 'text' && typeof subContent === 'string') {
              usageText = cleanupDefinitionText(subContent);
            }

            // Process vis examples in the nested structure
            if (subType === 'vis' && Array.isArray(subContent)) {
              const visExamples = subContent as VerbalIllustration[];

              visExamples.forEach((ex) => {
                const cleanedText = cleanupExampleText(ex.t);
                examples.push({
                  example: cleanedText,
                  languageCode: language,
                  grammaticalNote: `usage #${usageIndex + 1}`,
                });
                currentExamples.push(cleanedText);
              });
            } else if (Array.isArray(subContent)) {
              // Recurse if there are more nested arrays
              const recursiveResult = processNestedExamples(
                subContent,
                language,
                `usage #${usageIndex + 1}`,
              );

              examples.push(...recursiveResult.examples);

              if (recursiveResult.usageTexts.length > 0) {
                // Add nested usage texts with proper indexing
                usageTexts.push(...recursiveResult.usageTexts);

                // Add nested examples to current examples collection
                Object.values(recursiveResult.usageToExamples).forEach(
                  (exs) => {
                    currentExamples.push(...exs);
                  },
                );

                usageIndex += recursiveResult.usageTexts.length;
              }
            }
          }
        });

        // If we found a usage text, add it
        if (usageText) {
          usageTexts.push(usageText);
          usageToExamples[usageIndex] = currentExamples;
          usageIndex++;
        }
      }
    });
  }

  return {
    examples,
    usageTexts,
    usageToExamples,
    usageIndex: usageIndex - usageTexts.length,
  };
}

async function upsertWord(
  tx: Prisma.TransactionClient,
  source: SourceType,
  wordText: string,
  languageCode: LanguageCode,
  options?: {
    phonetic?: string | null;
    audio?: string | null;
    audioFiles?: string[] | null;
    etymology?: string | null;
    difficultyLevel?: DifficultyLevel;
  },
): Promise<Word> {
  // Set default values
  const difficultyLevel = options?.difficultyLevel || DifficultyLevel.B1;

  // Create or update the word
  const word = await tx.word.upsert({
    where: {
      word_languageCode: {
        word: wordText,
        languageCode,
      },
    },
    create: {
      word: wordText,
      languageCode,
      phonetic: options?.phonetic || null,
      etymology: options?.etymology || null,
      difficultyLevel,
      additionalInfo: {},
    },
    update: {
      // Use proper field update operations for nullable fields
      ...(options?.phonetic !== undefined && {
        phonetic: { set: options.phonetic },
      }),
      ...(options?.etymology !== undefined && {
        etymology: { set: options.etymology },
      }),
      ...(options?.difficultyLevel !== undefined && {
        difficultyLevel: { set: options.difficultyLevel },
      }),
    },
  });

  // Handle audio files if provided
  if (options?.audioFiles && options.audioFiles.length > 0) {
    // Filter out any undefined or null audio URLs
    const validAudioFiles = options.audioFiles.filter((url) => url);

    if (validAudioFiles.length > 0) {
      // Process in batches of 10
      const batchSize = 10;
      const audioBatches = [];

      // Split into batches
      for (let i = 0; i < validAudioFiles.length; i += batchSize) {
        audioBatches.push(validAudioFiles.slice(i, i + batchSize));
      }

      // Process each batch
      for (let batchIndex = 0; batchIndex < audioBatches.length; batchIndex++) {
        const batch = audioBatches[batchIndex];

        // Skip if batch is undefined
        if (!batch) continue;

        // Create all audio records in parallel
        const audioRecords = await Promise.all(
          batch.map(async (audioUrl, index) => {
            // Determine if this is a primary audio (first in the first batch)
            const isPrimary = batchIndex === 0 && index === 0;

            // Ensure audioUrl is not undefined or null
            if (!audioUrl) {
              throw new Error('Audio URL cannot be null or undefined');
            }

            // Create or find the Audio record
            const audio = await tx.audio.upsert({
              where: {
                url: audioUrl,
              },
              create: {
                url: audioUrl,
                source: source,
                languageCode,
                isOrphaned: false,
              },
              update: {
                isOrphaned: false, // Mark as not orphaned if it exists
              },
            });

            return { audioId: audio.id, isPrimary };
          }),
        );

        // Create all word-audio relationships in parallel
        await Promise.all(
          audioRecords.map(async ({ audioId, isPrimary }) => {
            return tx.wordAudio.upsert({
              where: {
                wordId_audioId: {
                  wordId: word.id,
                  audioId,
                },
              },
              create: {
                wordId: word.id,
                audioId,
                isPrimary,
              },
              update: {
                isPrimary,
              },
            });
          }),
        );
      }
    }
  }

  return word;
}
