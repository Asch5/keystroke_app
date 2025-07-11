'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
import { processTranslationsForWord } from '@/core/lib/db/wordTranslationProcessor';
import { prisma } from '@/core/lib/prisma';
import { ImageService } from '@/core/lib/services/imageService';
import { clientLog } from '@/core/lib/utils/logUtils';
import { saveJson } from '@/core/lib/utils/saveJson';
import { audioDownloadService } from '@/core/shared/services/external-apis/audioDownloadService';
import { FrequencyManager } from '@/core/shared/services/FrequencyManager';
import { WordService } from '@/core/shared/services/WordService';
import {
  LanguageCode,
  PartOfSpeech,
  RelationshipType,
  SourceType,
  Word,
  DifficultyLevel,
  Definition,
  Gender,
} from '@/core/types';
import {
  DatabaseTransactionClient,
  DatabaseKnownRequestError,
  DatabaseTransactionIsolationLevel,
} from '@/core/types/database';
import {
  DefinitionExampleOfProcessWordData,
  ProcessedWordData,
  RelationshipFromTo,
  AudioFile,
} from '@/core/types/dictionary'; // Extended interface to include ID for database trackinginterface DefinitionExampleWithId extends DefinitionExampleOfProcessWordData {  id?: number | null;}
import { env } from '@/env.mjs';

/**Definitions:
 * generalLabels "lbs" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs. (like capitalization indicators, usage notes, etc.)
 *
 * subjectStatusLabels "sls" - A subject/status label describes the subject area (eg, "computing") or regional/usage status (eg, "British", "formal", "slang") of a headword or a particular sense of a headword. A set of one or more subject/status labels is contained in an sls.
 *
 * grammaticalNote "gram" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs.
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

export interface MerriamWebsterDefinitionSen {
  sn?: string;
  sgram?: string;
  lbs?: string[];
  sls?: string[];
  gram?: string;
  bnote?: string;
  phrasev?: Array<{ pva?: string }>;
}

export interface MerriamWebsterDefinitionSense {
  sn?: string;
  sgram?: string;
  bnote?: string;
  dt: Array<[string, unknown]>;
  sen?: MerriamWebsterDefinitionSen;
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
    highlight: string;
    src: string;
    section: string;
    target: {
      tsrc?: string;
    };
    stems: string[];
    offensive: boolean;
    syns?: string[][];
    ants?: string[][];
    'app-shortdef'?: {
      hw: string;
      fl: string;
      def: string[];
    };
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
    gram?: string;
    ins?: Array<{
      il?: string;
      if?: string;
      ifc?: string;
      prs?: MerriamWebsterPronunciation[];
    }>;
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

/**
 * Helper function to determine the appropriate part of speech for a synonym
 * based on the part of speech of the related word and the structure of the synonym
 * @param synonymText The synonym text to analyze
 * @param relatedPartOfSpeech The part of speech of the related word
 * @returns The appropriate PartOfSpeech for the synonym
 */
function determineSynonymPartOfSpeech(
  synonymText: string,
  relatedPartOfSpeech: PartOfSpeech | null,
): PartOfSpeech {
  // If we don't have a related part of speech, default to undefined
  if (!relatedPartOfSpeech || relatedPartOfSpeech === PartOfSpeech.undefined) {
    return PartOfSpeech.undefined;
  }

  // Count words in the synonym (split by spaces and filter out empty strings)
  const wordCount = synonymText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Special handling for verbs, phrases, and phrasal verbs
  if (relatedPartOfSpeech === PartOfSpeech.verb) {
    if (wordCount === 1) {
      return PartOfSpeech.verb;
    } else {
      return PartOfSpeech.phrasal_verb;
    }
  }

  if (relatedPartOfSpeech === PartOfSpeech.phrasal_verb) {
    if (wordCount === 1) {
      return PartOfSpeech.verb;
    } else {
      return PartOfSpeech.phrasal_verb;
    }
  }

  // For all other cases, use the same part of speech as the related word
  return relatedPartOfSpeech;
}

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
        ? env.DICTIONARY_INTERMEDIATE_API_KEY
        : env.DICTIONARY_LEARNERS_API_KEY;

    // Log API key availability for debugging
    if (!API_KEY) {
      await serverLog('API key missing for dictionary type', 'error', {
        dictionaryType,
      });
    }

    if (!API_KEY) {
      await serverLog('API key not configured for dictionary type', 'error', {
        dictionaryType,
      });
      return {
        message: null,
        errors: {
          word: [`API key not configured for ${dictionaryType} dictionary`],
        },
      };
    }

    const dictionaryPath =
      dictionaryType === 'intermediate' ? 'sd3' : 'learners';

    const apiUrl = `https://www.dictionaryapi.com/api/v3/references/${dictionaryPath}/json/${encodeURIComponent(word)}?key=${API_KEY}`;

    const response = await fetch(apiUrl);

    // Log errors only
    if (!response.ok) {
      await serverLog('API Response Status error', 'error', {
        status: response.status,
        statusText: response.statusText,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      await serverLog('API request failed', 'error', {
        status: response.status,
        errorText,
      });
      return {
        message: null,
        errors: {
          word: [
            `API request failed (${response.status}): ${response.statusText ?? 'Unknown error'}. Error: ${errorText}`,
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
    await serverLog('Error fetching word from Merriam-Webster', 'error', error);
    await serverLog('Error details', 'error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      dictionaryType,
      word,
    });

    return {
      message: null,
      errors: {
        word: [
          `Failed to fetch word definition: ${
            error instanceof Error ? error.message : 'Unknown error'
          }. Please try again.`,
        ],
      },
    };
  }
}

export async function processAndSaveWord(
  apiResponse: MerriamWebsterResponse,
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  // Clean headword: remove all asterisks and any potential trailing ones (though replaceAll should handle it)
  const mainWordText = apiResponse.hwi.hw.replaceAll('*', '');

  const checkedWordDetails = await getWordDetails(mainWordText);

  const language = LanguageCode.en; // Hardcoded because we are using the English dictionary API
  const variant = apiResponse.meta.id.split(':')[1] || '';
  const source = mapSourceType(apiResponse.meta.src);
  const sourceEntityId = apiResponse.meta.id;
  const isHighlighted = apiResponse.meta.highlight === 'yes';
  // Get part of speech from API response, ensuring it's properly mapped to our enum
  const partOfSpeech = apiResponse.fl
    ? mapPartOfSpeech(apiResponse.fl)
    : PartOfSpeech.undefined;

  const sourceEntityUuid = apiResponse.meta.uuid;

  clientLog(
    `FROM processMerriamApi.ts: Processing word: ${mainWordText}`,
    'info',
  );
  //const section = apiResponse.meta.section;
  //const entrySource = apiResponse.meta.target.tsrc;

  // Extract primary audio
  //?do we need this file if we have audioFiles?
  // const audio = apiResponse.hwi.prs?.[0]?.sound?.audio
  //   ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${apiResponse.hwi.prs[0].sound.audio.charAt(0)}/${apiResponse.hwi.prs[0].sound.audio}.mp3`
  //   : null;

  // Extract all audio files (including alternate pronunciations)
  const audioFiles: AudioFile[] = [];

  // Process main pronunciations from hwi.prs
  if (apiResponse.hwi.prs && apiResponse.hwi.prs.length > 0) {
    apiResponse.hwi.prs.forEach((pronunciation) => {
      if (pronunciation.sound?.audio) {
        const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
        audioFiles.push({ url: audioUrl });
      }
    });
  }

  // Process alternate pronunciations from hwi.altprs if available
  if (apiResponse.hwi.altprs && apiResponse.hwi.altprs.length > 0) {
    apiResponse.hwi.altprs.forEach((pronunciation) => {
      if (pronunciation.sound?.audio) {
        const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
        audioFiles.push({ url: audioUrl });
      }
    });
  }

  // Frequency data will be fetched by upsertWord and upsertWordDetails directly;
  // Process etymology data from the API response
  const etymology = processEtymology(apiResponse.et);

  const processedData: ProcessedWordData = {
    word: {
      word: mainWordText,
      variant: variant,
      isHighlighted: isHighlighted,
      frequencyGeneral: null, // Will be fetched by upsertWord
      frequency: null, // Will be fetched by upsertWordDetails
      languageCode: language,
      source: source,
      partOfSpeech: partOfSpeech,
      phonetic:
        apiResponse.hwi.prs?.[0]?.ipa ||
        apiResponse.hwi.prs?.[0]?.mw ||
        apiResponse.hwi.altprs?.[0]?.ipa ||
        apiResponse.hwi.altprs?.[0]?.mw ||
        null, // checkedWordDetails?.word?.phonetic ?? null,
      audioFiles:
        audioFiles.length > 0
          ? audioFiles
          : (checkedWordDetails?.details?.[0]?.audioFiles ?? null),
      etymology:
        (etymology || checkedWordDetails?.details?.[0]?.etymology) ?? null, // Now from details
      relatedWords: [],
      sourceEntityId: `${source}-${sourceEntityId}-${sourceEntityUuid}`,
    },
    definitions: [],
    phrases: [],
    stems: apiResponse.meta.stems ?? [],
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
    STEM = 'stem',
    PVA = 'pva',
    DRO_PHRASE = 'dro_phrase',
    DEF_SYN = 'def_syn', // For synonyms found in definition patterns
  }

  interface SubWordDefinition {
    id?: number | null;
    source: string;
    languageCode: string;
    definition: string;
    subjectStatusLabels?: string | null;
    generalLabels?: string | null;
    grammaticalNote?: string | null;
    usageNote?: string | null;
    isInShortDef?: boolean;
    image?: {
      id: number;
      url: string;
      description: string | null;
    } | null;
    examples: {
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
    }[];
  }

  interface SubWordData {
    id?: number | null;
    word: string;
    languageCode: string;
    phoneticGeneral?: string | null;
    frequencyGeneral?: string | null;
    etymology?: string | null;
    source: SourceType;
    //WordDetails section
    partOfSpeech: PartOfSpeech | null;
    phonetic?: string | null;
    variant?: string | null;
    gender?: Gender | null;
    audioFiles?: AudioFile[] | null;
    definitions: SubWordDefinition[];
    relationship: {
      fromWord: RelationshipFromTo;
      toWord: RelationshipFromTo;
      type: RelationshipType;
    }[];
    sourceData: SOURCE_OF_WORD[];
  }

  let subWordsArray: SubWordData[] = [];

  //!VRS Subwords handler for nouns
  if (apiResponse.vrs && Array.isArray(apiResponse.vrs)) {
    apiResponse.vrs.forEach(async (variantItem) => {
      // Clean the variant form by removing asterisks
      const cleanedVariant = variantItem.va.replaceAll('*', '');

      const variantTypeDefinition = `Variant form of "${mainWordText} + ${variantItem.vl}"`;
      // Skip if the variant is the same as the main word
      if (cleanedVariant !== mainWordText) {
        subWordsArray.push({
          word: cleanedVariant,
          etymology: mainWordText,
          languageCode: language,
          phonetic: null,
          audioFiles: null,
          partOfSpeech: partOfSpeech,
          source: source,
          definitions: [
            {
              source: source,
              languageCode: language,
              definition: variantTypeDefinition,
              examples: [],
            },
          ],
          relationship: [
            {
              fromWord: 'mainWord',
              toWord: 'subWord',
              type: RelationshipType.related,
            },
            {
              fromWord: 'mainWord',
              toWord: 'subWord',
              type: RelationshipType.alternative_spelling,
            },
          ],
          sourceData: [SOURCE_OF_WORD.VRS],
        });
      }
    });
  }

  // //!CXS Cross References handler Verbs
  if (apiResponse.cxs && apiResponse.cxs.length > 0) {
    for (const cx of apiResponse.cxs) {
      if (cx.cxtis?.length > 0 && cx.cxtis[0]?.cxt) {
        const baseWord = cx.cxtis[0].cxt.replaceAll(/:\d+$/, '').trim();
        const relationship = cx.cxl.toLowerCase();

        // Create a definition based on the cross-reference
        let definitionText = '';
        let relationshipType: RelationshipType | null = null;
        //VERB
        if (relationship.includes('past tense and past participle')) {
          definitionText = `Past tense and past participle of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.past_tense_en; // Primary relationship type
        } else if (relationship.includes('past participle')) {
          definitionText = `Past participle of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.past_participle_en;
        } else if (relationship.includes('past tense')) {
          definitionText = `Past tense of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.past_tense_en;
        } else if (relationship.includes('present participle')) {
          definitionText = `Present participle of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.present_participle_en;
        } else if (relationship.includes('third person singular')) {
          definitionText = `Third person singular of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.third_person_en;
        } else if (relationship.includes('less common spelling of')) {
          definitionText = `Less common spelling of {it}${baseWord}{/it}`;
          relationshipType = RelationshipType.alternative_spelling;
        }

        if (definitionText && relationshipType) {
          // Add definition for the current word
          processedData.definitions.push({
            source: source,
            languageCode: language,
            definition: definitionText,
            isInShortDef: false,
            examples: [],
          });

          // Set etymology
          processedData.word.etymology = baseWord;

          // Extract audio information from the API response
          const audioUrl = apiResponse.hwi.prs?.[0]?.sound?.audio
            ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${apiResponse.hwi.prs[0].sound.audio.charAt(0)}/${apiResponse.hwi.prs[0].sound.audio}.mp3`
            : null;

          // Create an array of audio files
          const audioFiles: AudioFile[] = [];
          if (audioUrl) {
            audioFiles.push({ url: audioUrl });
          }

          // Process all pronunciations if there are multiple
          if (apiResponse.hwi.prs && apiResponse.hwi.prs.length > 0) {
            apiResponse.hwi.prs.forEach((pronunciation, index) => {
              if (index === 0) return; // Skip the first one as it's already processed
              if (pronunciation.sound?.audio) {
                const additionalAudioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
                audioFiles.push({ url: additionalAudioUrl });
              }
            });
          }

          // Extract phonetic spelling if available
          const phonetic =
            (apiResponse.hwi.prs?.[0]?.ipa || apiResponse.hwi.prs?.[0]?.mw) ??
            null;

          //           "hom":1,
          // "hwi":{
          //   "hw":"ba*lo*ney",
          //   "prs":[
          //     {
          //       "mw":"b\u0259-\u02c8l\u014d-n\u0113",
          //       "sound":{"audio":"bologn01","ref":"c","stat":"1"}
          //     }
          //   ]
          // },
          // "fl":"noun",
          // "cxs":[
          //   {
          //     "cxl":"less common spelling of",
          //     "cxtis":[
          //       {"cxt":"bologna"}
          //     ]
          //   }
          // ],
          // "def":[

          // Add to subWordsArray to establish relationship
          subWordsArray.push({
            word: baseWord, // The base word e.g., "get" for "got"
            languageCode: language,
            source: source,
            partOfSpeech: partOfSpeech,
            phonetic: phonetic,
            audioFiles: audioFiles.length > 0 ? audioFiles : null,
            etymology: null,
            definitions: [],
            relationship: [
              {
                fromWord: 'subWordDetails', // Reversed relationship
                toWord: 'mainWordDetails',
                type: relationshipType,
              },
              {
                fromWord: 'subWord',
                toWord: 'mainWord',
                type: RelationshipType.related,
              },
            ],
            sourceData: [SOURCE_OF_WORD.CXS],
          });
        }
      }
    }
  }

  //!INS Subwords handler for verbs
  if (apiResponse.ins && apiResponse.fl === 'verb') {
    for (const inflection of apiResponse.ins) {
      if (!inflection.if) continue;

      const subjectStatusLabels = inflection.il ?? null;

      // Clean the inflection form
      const cleanedForm = inflection.if.replace(/\*/g, '');

      // Skip if identical to base word
      if (cleanedForm === mainWordText) continue;

      // Extract audio URL if available
      const formAudio = inflection.prs?.[0]?.sound?.audio
        ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${inflection.prs[0].sound.audio.charAt(0)}/${inflection.prs[0].sound.audio}.mp3`
        : null;

      // Create an array of audio files
      const audioFiles: AudioFile[] = [];
      if (formAudio) {
        audioFiles.push({ url: formAudio });
      }

      // Process all pronunciations if there are multiple
      if (inflection.prs && inflection.prs.length > 0) {
        inflection.prs.forEach((pronunciation, index) => {
          if (index === 0) return; // Skip the first one as it's already processed
          if (pronunciation.sound?.audio) {
            const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
            audioFiles.push({ url: audioUrl });
          }
        });
      }

      // Extract phonetic spelling if available
      const formPhonetic =
        (inflection.prs?.[0]?.ipa || inflection.prs?.[0]?.mw) ?? null;

      // Determine the verb form type and set appropriate relationships
      let verbFormType;
      let definition: string | null = null;

      // Check for third person singular (ends with 's' or 'es')
      if (cleanedForm.endsWith('s') || cleanedForm.endsWith('es')) {
        verbFormType = RelationshipType.third_person_en;
        definition = `Third person singular form of the verb {it}${mainWordText}{/it}`;
      }
      // Check for present participle (ends with 'ing')
      else if (cleanedForm.endsWith('ing')) {
        verbFormType = RelationshipType.present_participle_en;
        definition = `Present participle form of the verb {it}${mainWordText}{/it}`;
      }
      // Check for past tense and past participle
      else if (cleanedForm.endsWith('ed')) {
        // For regular verbs, past tense and past participle are the same
        verbFormType = RelationshipType.past_tense_en;
        definition = `Past tense and past participle form of the verb {it}${mainWordText}{/it}`;
      }
      // Handle irregular past tense forms (if not caught by above rules)
      else if (inflection.il === 'past' || inflection.il === 'past tense') {
        verbFormType = RelationshipType.past_tense_en;
        definition = `Past tense form of the verb {it}${mainWordText}{/it}`;
      }
      // Handle irregular past participle forms
      else if (inflection.il === 'past participle') {
        verbFormType = RelationshipType.past_participle_en;
        definition = `Past participle form of the verb {it}${mainWordText}{/it}`;
      } else {
        verbFormType = RelationshipType.related;
        definition = `Undefined form of the verb {it}${mainWordText}{/it}`;
      }

      subWordsArray.push({
        word: cleanedForm,
        languageCode: language,
        phonetic: formPhonetic,
        source: source,
        partOfSpeech: partOfSpeech,
        audioFiles: audioFiles.length > 0 ? audioFiles : null,
        etymology: mainWordText,
        definitions: definition
          ? [
              {
                source: source,
                languageCode: language,
                subjectStatusLabels: subjectStatusLabels,
                definition: definition,
                examples: [],
              },
            ]
          : [],
        relationship: [
          ...(verbFormType
            ? [
                {
                  fromWord: 'mainWordDetails' as const,
                  toWord: 'subWordDetails' as const,
                  type: verbFormType,
                },
              ]
            : []),

          {
            fromWord: 'mainWord',
            toWord: 'subWord',
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
      if (cleanedForm === mainWordText) continue;

      // Extract audio URL if available
      const formAudio = inflection.prs?.[0]?.sound?.audio
        ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${inflection.prs[0].sound.audio.charAt(0)}/${inflection.prs[0].sound.audio}.mp3`
        : null;

      // Create an array of audio files
      const audioFiles: AudioFile[] = [];
      if (formAudio) {
        audioFiles.push({ url: formAudio });
      }

      // Process all pronunciations if there are multiple
      if (inflection.prs && inflection.prs.length > 0) {
        inflection.prs.forEach((pronunciation, index) => {
          if (index === 0) return; // Skip the first one as it's already processed
          if (pronunciation.sound?.audio) {
            const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
            audioFiles.push({ url: audioUrl });
          }
        });
      }

      // Extract phonetic spelling if available
      const formPhonetic =
        (inflection.prs?.[0]?.ipa || inflection.prs?.[0]?.mw) ?? null;

      let pluralForm: RelationshipType | null = null;
      let etymologySubWord: string | null = null;
      if (inflection.il === 'plural') {
        pluralForm = RelationshipType.plural_en;
        etymologySubWord = `Plural form of {it}${mainWordText}{/it}`;
      }

      subWordsArray.push({
        word: cleanedForm,
        languageCode: language,
        phonetic: formPhonetic,
        source: source,
        partOfSpeech: partOfSpeech,
        audioFiles: audioFiles.length > 0 ? audioFiles : null, // Add audioFiles array
        etymology: mainWordText,
        definitions: [
          {
            source: source,
            languageCode: language,
            definition: etymologySubWord ?? '',
            examples: [],
          },
        ],
        relationship: [
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.related,
          },
          ...(pluralForm
            ? [
                {
                  fromWord: 'mainWordDetails' as const,
                  toWord: 'subWordDetails' as const,
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
          source: source,
          partOfSpeech: determineSynonymPartOfSpeech(synonym, partOfSpeech),
          definitions: [],
          relationship: [
            {
              fromWord: 'mainWordDetails',
              toWord: 'subWordDetails',
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
          source: source,
          partOfSpeech: determineSynonymPartOfSpeech(antonym, partOfSpeech),
          definitions: [],
          relationship: [
            {
              fromWord: 'mainWordDetails',
              toWord: 'subWordDetails',
              type: RelationshipType.antonym,
            },
          ],
          sourceData: [SOURCE_OF_WORD.ANT],
        });
      }
    }
  }

  //!DRO Phrasal Verbs handler
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
          source: source,
          partOfSpeech: PartOfSpeech.phrasal_verb, // Explicitly set appropriate part of speech
          definitions: [],
          relationship: [
            {
              fromWord: 'mainWord',
              toWord: 'subWord',
              type: RelationshipType.related,
            },
            {
              fromWord: 'mainWordDetails',
              toWord: 'subWordDetails',
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
                let currentSenData: MerriamWebsterDefinitionSen | null = null;
                // Extract sen data (either from the preceding 'sen' item or from within the sense itself)
                let senGramaticalNote = null;
                let senBnote = null;
                let senLbs = null;
                let senSubjectStatusLabels = null;

                for (const [senseType, senseData] of sseqItem) {
                  if (senseType === 'sen') {
                    // Store the sen data to apply to subsequent sense objects
                    currentSenData = senseData as MerriamWebsterDefinitionSen;
                    continue; // Skip processing until we find a sense to apply this to
                  }

                  if (senseType === 'sense' || senseType === 'sdsense') {
                    // First, process the main phrasal verb definition
                    const dt = senseData.dt;
                    if (!dt) continue;

                    if (currentSenData) {
                      senGramaticalNote = currentSenData.sgram ?? null;
                      senBnote = currentSenData.bnote ?? null;
                      senLbs = currentSenData.lbs?.join(', ') || null;
                      senSubjectStatusLabels =
                        currentSenData.sls?.join(', ') || null;
                    }
                    // Then check if there's sen data attached to this sense directly
                    else if (senseData.sen) {
                      senGramaticalNote = senseData.sen.sgram ?? null;
                      senBnote = senseData.sen.bnote ?? null;
                      senLbs = senseData.sen.lbs?.join(', ') || null;
                      senSubjectStatusLabels =
                        senseData.sen.sls?.join(', ') || null;
                    }

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
                          cleanupExampleText(definitionText);

                        // Get phrasal verb examples and usage notes
                        const phrasalVerbData = extractExamples(dt, language);
                        const getPhrasalVerbExamples = phrasalVerbData.examples;
                        const phrasalVerbUsage = phrasalVerbData.usageNote;

                        // Extract synonyms from phrasal verb definition patterns
                        const phrasalVerbSynonyms =
                          extractSynonymsFromDefinitionPatterns(dt);

                        // Add extracted synonyms to subWordsArray
                        for (const synonym of phrasalVerbSynonyms) {
                          // Skip if synonym is the same as the main word or phrasal verb
                          if (synonym === mainWordText || synonym === cleanDrp)
                            continue;

                          // Check if this synonym is already in the subWordsArray
                          const existingSynonym = subWordsArray.find(
                            (sw) =>
                              sw.word === synonym &&
                              sw.sourceData.includes(SOURCE_OF_WORD.DEF_SYN),
                          );

                          if (!existingSynonym) {
                            clientLog(
                              `FROM processMerriamApi.ts: Found synonym "${synonym}" in phrasal verb definition pattern for "${cleanDrp}"`,
                              'info',
                            );
                            subWordsArray.push({
                              word: synonym,
                              languageCode: language,
                              source: source,
                              partOfSpeech: determineSynonymPartOfSpeech(
                                synonym,
                                PartOfSpeech.phrasal_verb,
                              ),
                              definitions: [],
                              relationship: [
                                {
                                  fromWord: cleanDrp as RelationshipFromTo,
                                  toWord: 'subWordDetails',
                                  type: RelationshipType.synonym,
                                },
                              ],
                              sourceData: [SOURCE_OF_WORD.DEF_SYN],
                            });
                          }
                        }

                        // Process grammatical notes
                        const grammaticalNote = senseData.sgram ?? null;
                        const bnote = senseData.bnote ?? null;
                        const mainGramNote = apiResponse.gram ?? null;

                        const generalLabels = senseData.lbs?.join(', ') || null;

                        // Process subject status labels
                        const mainSubjectStatusLabels =
                          senseData.sphrasev?.phsls?.join(', ') ||
                          senseData.sls?.join(', ') ||
                          null;

                        // Create definition for the main phrasal verb
                        const definitionData = {
                          definition: cleanedDefinition,
                          source: source,
                          languageCode: language,
                          subjectStatusLabels:
                            getStringFromArray([
                              senSubjectStatusLabels,
                              mainSubjectStatusLabels,
                              null,
                            ]) || null,
                          generalLabels:
                            getStringFromArray([generalLabels, senLbs]) || null,
                          grammaticalNote:
                            getStringFromArray([
                              mainGramNote,
                              grammaticalNote,
                              bnote,
                              senBnote,
                              senGramaticalNote,
                            ]) || null,
                          frequencyPartOfSpeech: null,
                          usageNote: phrasalVerbUsage,
                          isInShortDef: false,
                          examples: getPhrasalVerbExamples ?? [],
                        };

                        subWordPhrasalVerb.definitions.push(definitionData);

                        // Now process phrasal verb variants (pva)
                        const pvas: string[] = [];

                        if (
                          currentSenData?.phrasev &&
                          Array.isArray(currentSenData.phrasev)
                        ) {
                          pvas.push(
                            ...currentSenData.phrasev
                              .filter((p: { pva?: string }) => p.pva)
                              .map((p: { pva?: string }) => p.pva as string),
                          );
                        }
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
                            partOfSpeech: PartOfSpeech.phrasal_verb,
                            source: source,
                            definitions: [definitionData],
                            relationship: [
                              {
                                fromWord: 'mainWord',
                                toWord: 'subWord',
                                type: RelationshipType.related,
                              },
                              {
                                fromWord: cleanDrp as RelationshipFromTo,
                                toWord: 'subWordDetails',
                                type: RelationshipType.variant_form_phrasal_verb_en,
                              },
                            ],
                            sourceData: [SOURCE_OF_WORD.PVA],
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
        //!DRO Phrases handler
      } else if (dro.gram !== 'phrasal verb' && dro.drp) {
        // Handle regular phrases
        const subWordPhrase: SubWordData = {
          word: cleanDrp,
          languageCode: language,
          source: source,
          partOfSpeech: PartOfSpeech.phrase, // Explicitly set appropriate part of speech
          definitions: [],
          relationship: [
            {
              fromWord: 'mainWord',
              toWord: 'subWord',
              type: RelationshipType.related,
            },
            {
              fromWord: 'mainWordDetails',
              toWord: 'subWordDetails',
              type: RelationshipType.phrase,
            },
          ],
          sourceData: [SOURCE_OF_WORD.DRO_PHRASE],
        };

        // Process all definitions and examples from the phrase
        if (dro.def) {
          for (const defEntry of dro.def) {
            if (defEntry.sseq) {
              for (const sseqItem of defEntry.sseq) {
                let currentSenData: MerriamWebsterDefinitionSen | null = null;
                // Extract sen data (either from the preceding 'sen' item or from within the sense itself)
                let senGramaticalNote = null;
                let senBnote = null;
                let senLbs = null;
                let senSubjectStatusLabels = null;
                for (const [senseType, senseData] of sseqItem) {
                  // Store any 'sen' data that appears before a 'sense' within the same sseq item

                  if (senseType === 'sen') {
                    // Store the sen data to apply to subsequent sense objects
                    currentSenData = senseData as MerriamWebsterDefinitionSen;
                    continue; // Skip processing until we find a sense to apply this to
                  }

                  if (senseType === 'sense' || senseType === 'sdsense') {
                    // First, process the main phrasal verb definition
                    const dt = senseData.dt;
                    if (!dt) continue;

                    // First check if we have sen data from a previous item in the sequence
                    if (currentSenData) {
                      senGramaticalNote = currentSenData.sgram ?? null;
                      senBnote = currentSenData.bnote ?? null;
                      senLbs = currentSenData.lbs?.join(', ') || null;
                      senSubjectStatusLabels =
                        currentSenData.sls?.join(', ') || null;
                    }
                    // Then check if there's sen data attached to this sense directly
                    else if (senseData.sen) {
                      senGramaticalNote = senseData.sen.sgram ?? null;
                      senBnote = senseData.sen.bnote ?? null;
                      senLbs = senseData.sen.lbs?.join(', ') || null;
                      senSubjectStatusLabels =
                        senseData.sen.sls?.join(', ') || null;
                    }

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
                          cleanupExampleText(definitionText);

                        // Get phrase examples and usage notes
                        const phraseData = extractExamples(dt, language);
                        const getPhraseExamples = phraseData.examples;
                        const phraseUsage = phraseData.usageNote;

                        // Extract synonyms from phrase definition patterns
                        const phraseSynonyms =
                          extractSynonymsFromDefinitionPatterns(dt);

                        // Add extracted synonyms to subWordsArray
                        for (const synonym of phraseSynonyms) {
                          // Skip if synonym is the same as the main word or phrase
                          if (synonym === mainWordText || synonym === cleanDrp)
                            continue;

                          // Check if this synonym is already in the subWordsArray
                          const existingSynonym = subWordsArray.find(
                            (sw) =>
                              sw.word === synonym &&
                              sw.sourceData.includes(SOURCE_OF_WORD.DEF_SYN),
                          );

                          if (!existingSynonym) {
                            clientLog(
                              `FROM processMerriamApi.ts: Found synonym "${synonym}" in phrase definition pattern for "${cleanDrp}"`,
                              'info',
                            );
                            subWordsArray.push({
                              word: synonym,
                              languageCode: language,
                              source: source,
                              partOfSpeech: determineSynonymPartOfSpeech(
                                synonym,
                                PartOfSpeech.phrase,
                              ),
                              definitions: [],
                              relationship: [
                                {
                                  fromWord: cleanDrp as RelationshipFromTo,
                                  toWord: 'subWordDetails',
                                  type: RelationshipType.synonym,
                                },
                              ],
                              sourceData: [SOURCE_OF_WORD.DEF_SYN],
                            });
                          }
                        }

                        // Process grammatical notes
                        const grammaticalNote = senseData.sgram ?? null;
                        const bnote = senseData.bnote ?? null;
                        const mainGramNote = apiResponse.gram ?? null;

                        const generalLabels = senseData.lbs?.join(', ') || null;

                        // Process subject status labels
                        const mainSubjectStatusLabels =
                          senseData.sphrasev?.phsls?.join(', ') ||
                          senseData.sls?.join(', ') ||
                          null;

                        // Create definition for the phrase (NOT a noun)
                        const definitionData = {
                          definition: cleanedDefinition,
                          source: source,
                          languageCode: language,
                          frequencyPartOfSpeech: null,
                          subjectStatusLabels:
                            getStringFromArray([
                              senSubjectStatusLabels,
                              mainSubjectStatusLabels,
                              null,
                            ]) || null,
                          generalLabels:
                            getStringFromArray([generalLabels, senLbs]) || null,
                          grammaticalNote:
                            getStringFromArray([
                              mainGramNote,
                              grammaticalNote,
                              bnote,
                              senBnote,
                              senGramaticalNote,
                            ]) || null,
                          usageNote: phraseUsage,
                          isInShortDef: false,
                          examples: getPhraseExamples ?? [],
                        };

                        subWordPhrase.definitions.push(definitionData);

                        // Check for sphrasev (object with phrs array format)

                        // Process each phrase variant (if any - currently none expected)
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Push the phraseEntityData only if there is at least one valid definition
        subWordsArray.push(subWordPhrase);
      }
    }
  }

  //! Process Undefined Run-Ons (uros)
  if (apiResponse.uros) {
    for (const uro of apiResponse.uros as Array<{
      ure: string;
      fl: string;
      prs?: MerriamWebsterPronunciation[];
      utxt?: Array<[string, unknown]>;
      gram?: string;
      ins?: Array<{
        il?: string;
        if?: string;
        ifc?: string;
        prs?: MerriamWebsterPronunciation[];
      }>;
    }>) {
      // Skip if no valid word form
      if (!uro.ure) continue;

      const cleanUro = uro.ure.replace(/\*/g, '');

      // Skip if the variant is the same as the main word
      if (cleanUro === mainWordText) continue;

      // Extract audio URL if available
      const audioUrl = uro.prs?.[0]?.sound?.audio
        ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${uro.prs[0].sound.audio.charAt(0)}/${uro.prs[0].sound.audio}.mp3`
        : null;

      // Create an array of audio files
      const audioFiles: AudioFile[] = [];
      if (audioUrl) {
        audioFiles.push({ url: audioUrl });
      }

      // Process all pronunciations if there are multiple
      if (uro.prs && uro.prs.length > 0) {
        uro.prs.forEach((pronunciation, index) => {
          if (index === 0) return; // Skip the first one as it's already processed
          if (pronunciation.sound?.audio) {
            const additionalAudioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pronunciation.sound.audio.charAt(0)}/${pronunciation.sound.audio}.mp3`;
            audioFiles.push({ url: additionalAudioUrl });
          }
        });
      }

      // Extract examples from utxt
      const examples =
        uro.utxt?.reduce(
          (
            acc: Array<{
              example: string;
              languageCode: LanguageCode;
              grammaticalNote?: string | null;
            }>,
            [type, content],
          ) => {
            if (type === 'vis' && Array.isArray(content)) {
              content.forEach((vis) => {
                if (vis.t) {
                  acc.push({
                    example: cleanupExampleText(vis.t),
                    languageCode: language,
                    grammaticalNote: uro.gram ?? null,
                  });
                }
              });
            }
            return acc;
          },
          [],
        ) || [];

      // Process inflections if present
      const inflections: Array<{
        form: string;
        type: RelationshipType;
        category?: string | undefined;
      }> = [];

      if (uro.ins && Array.isArray(uro.ins)) {
        for (const inflection of uro.ins) {
          if (!inflection.if) continue;

          const cleanedForm = inflection.if.replace(/\*/g, '');
          let inflectionType: RelationshipType = RelationshipType.related;

          // Determine inflection type based on il (inflection label)
          if (inflection.il === 'plural') {
            inflectionType = RelationshipType.plural_en;
          }

          inflections.push({
            form: cleanedForm,
            type: inflectionType,
            category: inflection.ifc ?? undefined,
          });
        }
      }

      // Create SubWordData for the run-on word
      const uroSubWord: SubWordData = {
        word: cleanUro,
        languageCode: language,
        partOfSpeech: mapPartOfSpeech(uro.fl),
        source: source,
        phonetic: (uro.prs?.[0]?.ipa || uro.prs?.[0]?.mw) ?? null,
        audioFiles: audioFiles.length > 0 ? audioFiles : null,
        etymology: mainWordText,
        definitions: [
          {
            source: source,
            languageCode: language,
            definition: `Form of {it}${mainWordText}{/it}`,
            subjectStatusLabels: null,
            generalLabels: null,
            grammaticalNote: uro.gram ?? null,
            isInShortDef: false,
            examples: examples,
          },
        ],
        relationship: [
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.related,
          },
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.stem,
          },
        ],
        sourceData: [SOURCE_OF_WORD.URO],
      };

      // Add the main URO subword
      subWordsArray.push(uroSubWord);

      // Process and add inflected forms
      for (const inflection of inflections) {
        // Skip if the inflected form is the same as the main word
        if (inflection.form === mainWordText) continue;

        const inflectedSubWord: SubWordData = {
          word: inflection.form,
          partOfSpeech: mapPartOfSpeech(uro.fl),
          source: source,
          languageCode: language,
          phonetic: null, // Inflected forms might have their own pronunciations in some cases
          audioFiles: null,
          etymology: `${inflection.type === RelationshipType.plural_en ? mainWordText : cleanUro}`,
          definitions: [
            {
              source: source,
              languageCode: language,
              definition: `${inflection.type === RelationshipType.plural_en ? 'Plural' : 'Inflected'} form of {it}${cleanUro}{/it}`,
              subjectStatusLabels: null,
              generalLabels: null,
              grammaticalNote: inflection.category
                ? `Inflection category: ${inflection.category}`
                : null,
              isInShortDef: false,
              examples: [],
            },
          ],
          relationship: [
            {
              fromWord: cleanUro as RelationshipFromTo,
              toWord: 'subWordDetails',
              type: inflection.type,
            },
            {
              fromWord: 'mainWord',
              toWord: 'subWord',
              type: RelationshipType.related,
            },
          ],
          sourceData: [SOURCE_OF_WORD.URO],
        };

        subWordsArray.push(inflectedSubWord);
      }
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

  const artShortDefTexts = new Set<string>();
  // First check app-shortdef (from Advanced English Learner's Dictionary)
  if (
    apiResponse.meta['app-shortdef']?.def &&
    Array.isArray(apiResponse.meta['app-shortdef'].def)
  ) {
    apiResponse.meta['app-shortdef'].def.forEach((shortDef) => {
      if (typeof shortDef === 'string') {
        artShortDefTexts.add(cleanupDefinitionText(shortDef));
      }
    });
  }
  // Fall back to regular shortdef property if app-shortdef is not available
  else if (apiResponse.shortdef && Array.isArray(apiResponse.shortdef)) {
    apiResponse.shortdef.forEach((shortDef) => {
      if (typeof shortDef === 'string') {
        artShortDefTexts.add(cleanupDefinitionText(formatWithBC(shortDef)));
      }
    });
  }

  //!DEF Definitions handler
  if (apiResponse.def) {
    const processedDefinitions = new Set<string>(); // Track processed definitions to avoid duplicates
    const mainLbs = apiResponse.lbs?.join(', ') ?? '';
    for (const defEntry of apiResponse.def) {
      if (defEntry.sseq) {
        for (const sseqItem of defEntry.sseq) {
          // Store any 'sen' data that appears before a 'sense' within the same sseq item
          let currentSenData: MerriamWebsterDefinitionSen | null = null;
          // Extract sen data (either from the preceding 'sen' item or from within the sense itself)
          let senGramaticalNote = null;
          let senBnote = null;
          let senLbs = null;
          let senSubjectStatusLabels = null;
          for (const [senseType, senseData] of sseqItem) {
            if (senseType === 'sen') {
              // Store the sen data to apply to subsequent sense objects
              currentSenData = senseData as MerriamWebsterDefinitionSen;
              continue; // Skip processing until we find a sense to apply this to
            }

            if (senseType === 'sense' || senseType === 'sdsense') {
              const dt = senseData.dt;
              if (!dt) continue;

              // First check if we have sen data from a previous item in the sequence
              if (currentSenData) {
                senGramaticalNote = currentSenData.sgram ?? null;
                senBnote = currentSenData.bnote ?? null;
                senLbs = currentSenData.lbs?.join(', ') || null;
                senSubjectStatusLabels = currentSenData.sls?.join(', ') || null;
              }
              // Then check if there's sen data attached to this sense directly
              else if (senseData.sen) {
                senGramaticalNote = senseData.sen.sgram ?? null;
                senBnote = senseData.sen.bnote ?? null;
                senLbs = senseData.sen.lbs?.join(', ') || null;
                senSubjectStatusLabels = senseData.sen.sls?.join(', ') || null;
              }

              // Extract definition text
              const definitionText = dt?.find(
                ([type, content]) =>
                  type === 'text' &&
                  typeof content === 'string' &&
                  !content.startsWith('{dx}'),
              )?.[1];

              const isUnsArray = dt?.find(
                ([type, content]) => type === 'uns' && Array.isArray(content),
              );
              const isSnoteArray = dt?.find(
                ([type, content]) => type === 'snote' && Array.isArray(content),
              );

              const unsArray = isUnsArray?.[1] as
                | Array<[string, unknown]>
                | undefined;

              const unsNoteText = unsArray?.find(
                ([type, content]) =>
                  type === 'text' && typeof content === 'string',
              )?.[1] as string | undefined;

              const cleanDefinitionText = cleanupExampleText(definitionText);
              if (
                !cleanDefinitionText ||
                typeof cleanDefinitionText !== 'string' ||
                cleanDefinitionText.trim() === ''
              ) {
                // If we have an unsNoteText but no definition, we can still proceed
                // as the unsNoteText will be used as a usage note, not as the definition
                if (!unsNoteText && !isSnoteArray && !isUnsArray) {
                  continue;
                }
              }

              // Process grammatical notes
              const grammaticalNote = senseData.sgram ?? null;
              const bnote = senseData.bnote ?? null;
              const mainGramNote = apiResponse.gram ?? null;

              const generalLabels = senseData.lbs?.join(', ') || null;

              // Process subject status labels
              const mainSubjectStatusLabels =
                senseData.sphrasev?.phsls?.join(', ') ||
                senseData.sls?.join(', ') ||
                null;

              // Clean and normalize definition text
              //const normalizedDefinition = normalize(cleanDefinitionText);

              // Skip if we've already processed this definition
              if (processedDefinitions.has(cleanDefinitionText)) continue;
              processedDefinitions.add(cleanDefinitionText);

              // Extract examples and usage notes
              const { examples, usageNote: extractedUsageNote } =
                extractExamples(dt, language);

              // Extract synonyms from definition patterns
              const definitionSynonyms =
                extractSynonymsFromDefinitionPatterns(dt);

              // Add extracted synonyms to subWordsArray
              for (const synonym of definitionSynonyms) {
                // Skip if synonym is the same as the main word
                if (synonym === mainWordText) continue;

                // Check if this synonym is already in the subWordsArray
                const existingSynonym = subWordsArray.find(
                  (sw) =>
                    sw.word === synonym &&
                    sw.sourceData.includes(SOURCE_OF_WORD.DEF_SYN),
                );

                if (!existingSynonym) {
                  clientLog(
                    `FROM processMerriamApi.ts: Found synonym "${synonym}" in definition pattern for word "${mainWordText}"`,
                    'info',
                  );
                  subWordsArray.push({
                    word: synonym,
                    languageCode: language,
                    source: source,
                    partOfSpeech: determineSynonymPartOfSpeech(
                      synonym,
                      partOfSpeech,
                    ),
                    definitions: [],
                    relationship: [
                      {
                        fromWord: 'mainWordDetails',
                        toWord: 'subWordDetails',
                        type: RelationshipType.synonym,
                      },
                    ],
                    sourceData: [SOURCE_OF_WORD.DEF_SYN],
                  });
                }
              }

              // Create definition object
              processedData.definitions.push({
                source: source,
                languageCode: language,
                definition: (cleanDefinitionText || unsNoteText) ?? '',
                subjectStatusLabels:
                  getStringFromArray([
                    senSubjectStatusLabels,
                    mainSubjectStatusLabels,
                  ]) || null,
                generalLabels:
                  getStringFromArray([senLbs, mainLbs, generalLabels]) || null,
                grammaticalNote:
                  getStringFromArray([
                    mainGramNote,
                    senBnote,
                    senGramaticalNote,
                    grammaticalNote,
                    bnote,
                  ]) || null,
                usageNote: (extractedUsageNote || unsNoteText) ?? null,
                isInShortDef: artShortDefTexts.has(
                  cleanupDefinitionText(cleanDefinitionText),
                ),
                examples: examples, // Using already extracted examples with proper structure
              });
              clientLog(
                `Process in processMerriamApi.ts (definition section): cleanDefinitionText: ${cleanDefinitionText}`,
                'info',
              );
              // Reset currentSenData after applying it to a sense
              // This ensures sen data only applies to the next sense, not all subsequent ones
              currentSenData = null;
            }
          }
        }
      }
    }
  }

  // Initialize frequency manager for this processing session
  const frequencyManager = new FrequencyManager();

  let mainWordEntityId: number; // Declare mainWordEntityId here, outside the transaction

  try {
    // Add a transaction to save the data to the database
    await prisma.$transaction(
      async (tx) => {
        // Helper function to get Word ID and associated details for relationship processing
        async function getWordEntityInfo(
          relationSide: RelationshipFromTo,
          mainWordEntity: Word,
          processedMainWordData: ProcessedWordData['word'],
          currentSubWordInLoop: SubWordData, // The subWord whose relationships are being processed
          allSubWords: SubWordData[], // All subwords with their IDs populated
          relationTypeForPosFallback: RelationshipType,
          apiSource: SourceType, // Source from the API meta, as a default
        ): Promise<{
          wordId: number | null;
          partOfSpeech: PartOfSpeech | null;
          variant: string;
          phonetic: string | null;
          isDetailsLevel: boolean;
          source: SourceType; // The determined source for the WordDetails
        }> {
          let wordId: number | null = null;
          let partOfSpeech: PartOfSpeech | null = null;
          let variant: string = '';
          let phonetic: string | null = null;
          const isDetailsLevel =
            typeof relationSide === 'string' &&
            relationSide.endsWith('Details');
          let entitySource: SourceType = apiSource; // Default to the main API source

          if (
            relationSide === 'mainWord' ||
            relationSide === 'mainWordDetails'
          ) {
            wordId = mainWordEntity.id;
            partOfSpeech = processedMainWordData.partOfSpeech;
            variant = processedMainWordData.variant ?? '';
            phonetic = processedMainWordData.phonetic ?? null;
            // Use main word's own source if available, otherwise default API source
            entitySource = processedMainWordData.source || apiSource;
          } else if (
            relationSide === 'subWord' ||
            relationSide === 'subWordDetails'
          ) {
            // This refers to the 'currentSubWordInLoop' for context
            if (!currentSubWordInLoop.id) {
              void serverLog(
                `Error: currentSubWordInLoop '${currentSubWordInLoop.word}' has no ID. RelationSide: ${relationSide}`,
                'error',
              );
              // Attempt to find it in allSubWords as a fallback
              const foundSubWord = allSubWords.find(
                (sw) =>
                  sw.word === currentSubWordInLoop.word &&
                  sw.partOfSpeech === currentSubWordInLoop.partOfSpeech &&
                  sw.id,
              );
              if (foundSubWord?.id) {
                wordId = foundSubWord.id;
                partOfSpeech = foundSubWord.partOfSpeech;
                variant = foundSubWord.variant ?? '';
                phonetic = foundSubWord.phonetic ?? null;
                entitySource = foundSubWord.source || apiSource;
              } else {
                return {
                  wordId: null,
                  partOfSpeech: null,
                  variant: '',
                  phonetic: null,
                  isDetailsLevel,
                  source: entitySource,
                };
              }
            } else {
              wordId = currentSubWordInLoop.id;
              partOfSpeech = currentSubWordInLoop.partOfSpeech;
              variant = currentSubWordInLoop.variant ?? '';
              phonetic = currentSubWordInLoop.phonetic ?? null;
              entitySource = currentSubWordInLoop.source || apiSource;
            }
          } else if (typeof relationSide === 'string') {
            // This is a specific sub-word string like 'cleanDrp'
            const targetSubWord = allSubWords.find(
              (sw) => sw.word === relationSide && sw.id, // ensure ID is present
            );
            if (targetSubWord?.id) {
              wordId = targetSubWord.id;
              partOfSpeech = targetSubWord.partOfSpeech;
              variant = targetSubWord.variant ?? '';
              phonetic = targetSubWord.phonetic ?? null;
              entitySource = targetSubWord.source || apiSource;
            } else {
              clientLog(
                `Could not find subWord or its ID for relationSide string: '${relationSide}'`,
                'warn',
              );
              return {
                wordId: null,
                partOfSpeech: null,
                variant: '',
                phonetic: null,
                isDetailsLevel,
                source: entitySource,
              };
            }
          } else {
            clientLog(`Unknown relationSide type: ${relationSide}`, 'warn');
            return {
              wordId: null,
              partOfSpeech: null,
              variant: '',
              phonetic: null,
              isDetailsLevel,
              source: entitySource,
            };
          }

          // If partOfSpeech is still null or undefined from direct data, and it's a details level relationship,
          // try to infer it using the relation type (e.g., for inflections).
          if (
            isDetailsLevel &&
            (!partOfSpeech || partOfSpeech === PartOfSpeech.undefined)
          ) {
            const inferredPos = getPosForRelation(relationTypeForPosFallback);
            if (inferredPos !== PartOfSpeech.undefined) {
              partOfSpeech = inferredPos;
            }
          }

          // Normalize PartOfSpeech.undefined to null for cleaner PoS data for upsertWordDetails
          if (partOfSpeech === PartOfSpeech.undefined) {
            partOfSpeech = null;
          }

          return {
            wordId,
            partOfSpeech,
            variant,
            phonetic,
            isDetailsLevel,
            source: entitySource,
          };
        }

        //! 1. Create or update the main Word
        const mainWord = await upsertWord(
          tx,
          source, // Ensure source is defined from initial processing
          mainWordText,
          language as LanguageCode, // Ensure language is defined
          {
            phonetic: processedData.word.phonetic ?? null,
            audioFiles: processedData.word.audioFiles ?? null,
            etymology: processedData.word.etymology ?? null,
            sourceEntityId: processedData.word.sourceEntityId ?? null,
            partOfSpeech: processedData.word.partOfSpeech, // Ensure partOfSpeech from initial processing
            variant: processedData.word.variant ?? '',
            isHighlighted: processedData.word.isHighlighted, // Ensure isHighlighted is defined
            frequencyManager: frequencyManager,
          },
        );
        mainWordEntityId = mainWord.id; // Assign the ID here

        // Create WordDetails for the main word
        const mainWordDetails = await upsertWordDetails(
          tx,
          mainWord.id,
          processedData.word.partOfSpeech, // Use partOfSpeech from initial processing
          source,
          false, // isPlural
          processedData.word.variant ?? '',
          processedData.word.phonetic,
          processedData.word.frequency,
          processedData.word.etymology ?? null, // Add etymology parameter
          frequencyManager,
        );
        //postion 1
        clientLog(
          `Position 1: From upsertWord in processMerriamApi.ts (upsertWord section): mainWordDetails: ${JSON.stringify(mainWordDetails)}`,
          'info',
        );

        //! 2. Process and save definitions
        for (const definitionData of processedData.definitions) {
          try {
            // Robustly upsert the definition with proper handling of unique constraints
            const definition: Definition = await tx.definition.upsert({
              where: {
                // Use unique constraint fields
                definition_languageCode_source: {
                  definition: definitionData.definition,
                  languageCode: definitionData.languageCode as LanguageCode,
                  source: definitionData.source as SourceType,
                },
              },
              update: {
                // Update any fields that might have changed
                subjectStatusLabels: definitionData.subjectStatusLabels ?? null,
                generalLabels: definitionData.generalLabels ?? null,
                grammaticalNote: definitionData.grammaticalNote ?? null,
                usageNote: definitionData.usageNote ?? null,
                isInShortDef: definitionData.isInShortDef ?? false,
              },
              create: {
                definition: definitionData.definition,
                source: definitionData.source as SourceType,
                languageCode: definitionData.languageCode as LanguageCode,
                subjectStatusLabels: definitionData.subjectStatusLabels ?? null,
                generalLabels: definitionData.generalLabels ?? null,
                grammaticalNote: definitionData.grammaticalNote ?? null,
                usageNote: definitionData.usageNote ?? null,
                isInShortDef: definitionData.isInShortDef ?? false,
              },
            });

            // Update processed data with definition ID
            processedData.definitions = processedData.definitions.map((def) => {
              if (def.definition === definitionData.definition) {
                return { ...def, id: definition.id };
              }
              return def;
            });

            //! Link definition to word details
            await tx.wordDefinition.upsert({
              where: {
                wordDetailsId_definitionId: {
                  wordDetailsId: mainWordDetails.id,
                  definitionId: definition.id,
                },
              },
              create: {
                wordDetailsId: mainWordDetails.id,
                definitionId: definition.id,
                isPrimary: false,
              },
              update: {},
            });

            // Create examples for the definition
            if (definitionData.examples && definitionData.examples.length > 0) {
              // Process examples in smaller batches to avoid timeouts
              const batchSize = 10;
              // Safe type assertion to avoid 'any' warning
              const exampleBatches =
                [] as DefinitionExampleOfProcessWordData[][];

              // Create a map to store created example IDs by their text
              const exampleIdsMap: Map<string, number> = new Map();

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
                const createdExamples = await Promise.all(
                  batch.map(async (example) => {
                    const createdExample = await tx.definitionExample.upsert({
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
                        grammaticalNote: example.grammaticalNote ?? null,
                      },
                      update: {
                        grammaticalNote: example.grammaticalNote ?? null,
                      },
                    });
                    return {
                      originalExample: example.example,
                      created: createdExample,
                    };
                  }),
                );

                // Store the created example IDs in the map
                for (const { originalExample, created } of createdExamples) {
                  exampleIdsMap.set(originalExample, created.id);
                }
              }

              // Update the processedData with example IDs
              const currentDefinitionIndex =
                processedData.definitions.findIndex(
                  (def) => def.definition === definitionData.definition,
                );

              if (
                currentDefinitionIndex !== -1 &&
                processedData.definitions[currentDefinitionIndex]
              ) {
                const def = processedData.definitions[currentDefinitionIndex];
                def.examples = def.examples.map((example) => ({
                  ...example,
                  id: exampleIdsMap.get(example.example) || null,
                }));
              }
            }
          } catch (error) {
            void serverLog(
              `Process in processMerriamApi.ts (definition section): Error processing definition: ${error}`,
              'error',
            );
            throw error;
          }
        }

        clientLog(
          `+++++++++++++++Process in processMerriamApi.ts (definition section): subWordsArray: ${JSON.stringify(subWordsArray)}`,
          'info',
        );

        //! 3. Process sub-words
        for (const subWord of subWordsArray) {
          // CRITICAL FIX: Skip upsertWord if this sub-word has the same text as the main word
          // This prevents the main word from being overwritten with sub-word etymology data
          let subWordEntity: Word;

          if (
            subWord.word === mainWordText &&
            subWord.languageCode === language
          ) {
            // This is actually the main word, don't call upsertWord - use existing main word
            subWordEntity = mainWord;
            void serverLog(
              `Skipping upsertWord for sub-word "${subWord.word}" because it matches main word - using existing main word entity`,
              'info',
            );
          } else {
            //
            // This is a genuine sub-word, safe to call upsertWord
            subWordEntity = await upsertWord(
              tx,
              source,
              subWord.word,
              subWord.languageCode as LanguageCode,
              {
                phonetic: subWord.phonetic ?? null,
                audioFiles: subWord.audioFiles ?? null,
                etymology: subWord.etymology ?? null,
                partOfSpeech: subWord.partOfSpeech,
                frequencyManager: frequencyManager,
              },
            );
          }

          // Update the ID in the subWordsArray
          subWordsArray = subWordsArray.map((word) => {
            if (word.word === subWord.word) {
              return {
                ...word,
                id: subWordEntity.id,
              };
            }
            return word;
          });

          //! Process definitions for subword
          for (const defData of subWord.definitions) {
            // Robustly upsert subword definition with proper handling of unique constraints
            const subWordDef = await tx.definition.upsert({
              where: {
                // Use unique constraint fields
                definition_languageCode_source: {
                  definition: defData.definition,
                  languageCode: defData.languageCode as LanguageCode,
                  source: defData.source as SourceType,
                },
              },
              update: {
                // Update any fields that might have changed
                subjectStatusLabels: defData.subjectStatusLabels ?? null,
                generalLabels: defData.generalLabels ?? null,
                grammaticalNote: defData.grammaticalNote ?? null,
                usageNote: defData.usageNote ?? null,
                isInShortDef: defData.isInShortDef ?? false,
              },
              create: {
                definition: defData.definition,
                source: defData.source as SourceType,
                languageCode: defData.languageCode as LanguageCode,
                subjectStatusLabels: defData.subjectStatusLabels ?? null,
                generalLabels: defData.generalLabels ?? null,
                grammaticalNote: defData.grammaticalNote ?? null,
                usageNote: defData.usageNote ?? null,
                isInShortDef: defData.isInShortDef ?? false,
              },
            });

            // Update subword definitions with the returned ID
            subWord.definitions = subWord.definitions.map((def) => {
              if (def.definition === defData.definition) {
                return { ...def, id: subWordDef.id };
              }
              return def;
            });

            // Create WordDetails for the subword based on part of speech
            // Prioritize the subword's overall partOfSpeech if available
            clientLog(
              `Position 5: From upsertWordDetails in processMerriamApi.ts (upsertWordDetails section): subWord.partOfSpeech: ${subWord.partOfSpeech}`,
              'info',
            );
            const subWordDetails = await upsertWordDetails(
              tx,
              subWordEntity.id,
              subWord.partOfSpeech ?? null,
              source,
              false, // isPlural
              subWord.variant ?? '',
              subWord.phonetic ?? null,
              null, // frequency will be fetched in upsertWordDetails
              subWord.etymology ?? null, // Add etymology parameter
              frequencyManager,
            );

            // Link definition to word details
            await tx.wordDefinition.upsert({
              where: {
                wordDetailsId_definitionId: {
                  wordDetailsId: subWordDetails.id,
                  definitionId: subWordDef.id,
                },
              },
              create: {
                wordDetailsId: subWordDetails.id,
                definitionId: subWordDef.id,
                isPrimary: false,
              },
              update: {},
            });

            //! Create examples for the sub-word definition
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
                        grammaticalNote: example.grammaticalNote ?? null,
                      },
                      update: {
                        grammaticalNote: example.grammaticalNote ?? null,
                      },
                    });
                  }),
                );
              }
            }
          }
        }

        //! Create relationships between words - REFACTORED BLOCK
        const allPopulatedSubWords = [...subWordsArray]; // Use a stable copy with IDs

        for (const currentProcessingSubWord of allPopulatedSubWords) {
          if (!currentProcessingSubWord.id) {
            void serverLog(
              `Skipping relationships for subWord '${currentProcessingSubWord.word}' as it has no ID. This should not happen.`,
              'error',
            );
            continue;
          }

          if (
            currentProcessingSubWord.relationship &&
            currentProcessingSubWord.relationship.length > 0
          ) {
            const batchSize = 20; // Keep batching for performance
            for (
              let i = 0;
              i < currentProcessingSubWord.relationship.length;
              i += batchSize
            ) {
              const batch = currentProcessingSubWord.relationship.slice(
                i,
                i + batchSize,
              );
              await Promise.all(
                batch.map(async (relation) => {
                  if (!relation.type) {
                    clientLog(
                      `Missing type for relationship on subWord ${currentProcessingSubWord.word} (ID: ${currentProcessingSubWord.id})`,
                      'warn',
                    );
                    return;
                  }
                  const relationType = relation.type;

                  // Use the newly added getWordEntityInfo function
                  const fromInfo = await getWordEntityInfo(
                    relation.fromWord,
                    mainWord, // Main word entity
                    processedData.word, // Main word's processed data
                    currentProcessingSubWord, // Current sub-word in loop context
                    allPopulatedSubWords, // All sub-words (with IDs)
                    relationType, // Relation type for PoS fallback
                    source, // API source as default
                  );
                  const toInfo = await getWordEntityInfo(
                    relation.toWord,
                    mainWord,
                    processedData.word,
                    currentProcessingSubWord,
                    allPopulatedSubWords,
                    relationType,
                    source,
                  );

                  if (!fromInfo.wordId || !toInfo.wordId) {
                    clientLog(
                      `Missing wordId for relationship: from='${relation.fromWord}'(id:${fromInfo.wordId}) to='${relation.toWord}'(id:${toInfo.wordId}), for subWord '${currentProcessingSubWord.word}' (ID: ${currentProcessingSubWord.id}). Skipping.`,
                      'warn',
                    );
                    return;
                  }

                  // Determine if it's a WordDetailsRelationship based on the schema or explicit naming
                  const createDetailsRelation =
                    fromInfo.isDetailsLevel ||
                    toInfo.isDetailsLevel ||
                    (typeof relation.fromWord === 'string' &&
                      relation.fromWord.endsWith('Details')) ||
                    (typeof relation.toWord === 'string' &&
                      relation.toWord.endsWith('Details'));

                  if (createDetailsRelation) {
                    /**
                     * IMPROVEMENT: Pass actual data instead of null values when upserting WordDetails
                     *
                     * Previously, we were passing null for etymology when creating WordDetails relationships.
                     * Now we find the actual sub-word data and use its etymology value, ensuring that
                     * WordDetails records contain the proper etymology information instead of null values.
                     */

                    // Helper function to find sub-word data by word ID
                    const findSubWordDataById = (wordId: number) => {
                      return allPopulatedSubWords.find(
                        (sw) => sw.id === wordId,
                      );
                    };

                    // Helper function to find sub-word data by word text
                    const findSubWordDataByText = (wordText: string) => {
                      return allPopulatedSubWords.find(
                        (sw) => sw.word === wordText,
                      );
                    };

                    // For plural_en, isPlural is true if the WordDetail IS the plural noun form
                    const isFromPlural =
                      relationType === RelationshipType.plural_en &&
                      fromInfo.partOfSpeech === PartOfSpeech.noun;
                    const isToPlural =
                      relationType === RelationshipType.plural_en &&
                      toInfo.partOfSpeech === PartOfSpeech.noun;

                    // Find the actual sub-word data to get real values instead of nulls
                    let fromSubWordData = findSubWordDataById(fromInfo.wordId);

                    // If not found by ID, try to find by relation.fromWord text
                    if (
                      !fromSubWordData &&
                      typeof relation.fromWord === 'string'
                    ) {
                      fromSubWordData = findSubWordDataByText(
                        relation.fromWord,
                      );
                    }

                    // Use actual data from sub-word if available, otherwise use defaults
                    const fromEtymology = fromSubWordData?.etymology ?? null;

                    clientLog(
                      `FROM processMerriamApi.ts: Found fromSubWordData for wordId ${fromInfo.wordId}: ${fromSubWordData ? 'YES' : 'NO'}, etymology: ${fromEtymology}`,
                      'info',
                    );

                    // Find the actual sub-word data to get real values instead of nulls
                    let toSubWordData = findSubWordDataById(toInfo.wordId);

                    // If not found by ID, try to find by relation.toWord text
                    if (!toSubWordData && typeof relation.toWord === 'string') {
                      toSubWordData = findSubWordDataByText(relation.toWord);
                    }

                    // Use actual data from sub-word if available, otherwise use defaults
                    const toEtymology = toSubWordData?.etymology ?? null;

                    clientLog(
                      `FROM processMerriamApi.ts: Found toSubWordData for wordId ${toInfo.wordId}: ${toSubWordData ? 'YES' : 'NO'}, etymology: ${toEtymology}`,
                      'info',
                    );

                    const fromWordDetails = await upsertWordDetails(
                      tx,
                      fromInfo.wordId,
                      fromInfo.partOfSpeech,
                      fromInfo.source,
                      isFromPlural,
                      fromInfo.variant,
                      fromInfo.phonetic,
                      null, // frequency
                      fromEtymology, // Use actual etymology data
                      frequencyManager,
                    );
                    const toWordDetails = await upsertWordDetails(
                      tx,
                      toInfo.wordId,
                      toInfo.partOfSpeech,
                      toInfo.source,
                      isToPlural,
                      toInfo.variant,
                      toInfo.phonetic,
                      null, // frequency
                      toEtymology, // Use actual etymology data
                      frequencyManager,
                    );

                    await tx.wordDetailsRelationship.upsert({
                      where: {
                        fromWordDetailsId_toWordDetailsId_type: {
                          fromWordDetailsId: fromWordDetails.id,
                          toWordDetailsId: toWordDetails.id,
                          type: relationType,
                        },
                      },
                      create: {
                        fromWordDetailsId: fromWordDetails.id,
                        toWordDetailsId: toWordDetails.id,
                        type: relationType,
                        description: getRelationshipDescription(relationType),
                      },
                      update: {},
                    });
                  } else {
                    // Create WordToWordRelationship
                    await tx.wordToWordRelationship.upsert({
                      where: {
                        fromWordId_toWordId_type: {
                          fromWordId: fromInfo.wordId,
                          toWordId: toInfo.wordId,
                          type: relationType,
                        },
                      },
                      create: {
                        fromWordId: fromInfo.wordId,
                        toWordId: toInfo.wordId,
                        type: relationType,
                        description: getRelationshipDescription(relationType),
                      },
                      update: {},
                    });
                  }
                }),
              );
            }
          }
        }
        //! End of refactored relationship block

        // ... (Rest of transaction, e.g., final clientLog, saveJson) ...

        // The following call to processTranslationsForWord has been moved outside this transaction.
        // mainWord.id is captured in mainWordEntityId earlier in this transaction.
      },
      {
        maxWait: 120000,
        timeout: 800000,
        isolationLevel: DatabaseTransactionIsolationLevel.ReadCommitted,
      },
    );

    // Call processTranslationsForWord AFTER the main transaction has committed
    if (mainWordEntityId!) {
      // Check if mainWordEntityId was assigned
      await processTranslationsForWord(
        // No 'tx' argument here
        mainWordEntityId,
        mainWordText,
        {
          phonetic: processedData.word.phonetic,
          stems: processedData.stems,
          definitions: processedData.definitions
            .filter((def): def is typeof def & { id: number } => def.id != null)
            .map((def) => ({
              id: def.id,
              partOfSpeech: processedData.word.partOfSpeech ?? 'undefined',
              definition: def.definition,
              examples: (def.examples ?? [])
                .filter((ex): ex is typeof ex & { id: number } => ex.id != null)
                .map((ex) => ({
                  id: ex.id,
                  example: ex.example,
                })),
            })),
        },
      );
    }

    // Fetch all definitions from the database for the main word and related words
    // This ensures we have the correct IDs assigned by the database
    const allWordIds = [mainWordText, ...subWordsArray.map((sw) => sw.word)];

    // First get all the word IDs from the database
    const dbWords = await prisma.word.findMany({
      where: {
        word: {
          in: allWordIds,
        },
      },
      select: {
        id: true,
      },
    });

    const wordIds = dbWords.map((w) => w.id);

    // Then get all definitions linked to those words through WordDetails and WordDefinition
    const wordDetailsDefinitions = await prisma.wordDetails.findMany({
      where: {
        wordId: {
          in: wordIds,
        },
      },
      select: {
        definitions: {
          select: {
            definition: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    });

    // Extract unique definitions from the nested structure
    const definitionsMap = new Map();
    wordDetailsDefinitions.forEach((wd) => {
      wd.definitions.forEach((d) => {
        const def = d.definition;
        if (def && !definitionsMap.has(def.id)) {
          definitionsMap.set(def.id, def);
        }
      });
    });

    const dbDefinitions = Array.from(definitionsMap.values());

    clientLog(
      `Process in processMerriamApi.ts: Found ${dbDefinitions.length} unique definitions in database for word "${mainWordText}" and related words`,
      'info',
    );

    // Process images outside the transaction to avoid long-running transactions
    if (dbDefinitions.length > 0) {
      // Filter out only definitions with valid IDs that need images
      const definitionsToProcess = dbDefinitions
        .filter((def) => !def.imageId)
        .map((def) => ({ id: def.id }));

      clientLog(
        `Process in processMerriamApi.ts: Found ${definitionsToProcess.length} definitions that need images of ${dbDefinitions.length} total definitions`,
        'info',
      );

      if (definitionsToProcess.length > 0) {
        await processImagesForDefinitions(definitionsToProcess, mainWordText);
      }
    }

    // Update processedData with database definitions for consistent return value
    const dbDefinitionMap = new Map(dbDefinitions.map((def) => [def.id, def]));

    // Update the main definitions with data from DB
    processedData.definitions = processedData.definitions.map((def) => {
      if (def.id && dbDefinitionMap.has(def.id)) {
        const dbDef = dbDefinitionMap.get(def.id);
        return {
          ...def,
          image: dbDef?.image
            ? {
                id: dbDef.image.id,
                url: dbDef.image.url,
                description: dbDef.image.description,
              }
            : null,
        };
      }
      return def;
    });

    return processedData;
  } catch (error) {
    await serverLog('Error saving word data', 'error', {
      wordId: apiResponse?.meta?.id,
      error,
    });
    if (error instanceof DatabaseKnownRequestError) {
      await serverLog('Prisma Error Code', 'error', { code: error.code });
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

/**
 * Process images for definitions outside the transaction
 * @param definitions The definitions needing images
 * @param wordText The main word text
 */
async function processImagesForDefinitions(
  definitions: Array<{ id: number }>,
  wordText: string,
): Promise<void> {
  if (!definitions.length) return;

  const imageService = new ImageService();

  // Process in batches of 5 to limit concurrent requests
  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < definitions.length; i += batchSize) {
    batches.push(definitions.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (definition) => {
        try {
          clientLog(
            `FROM processImagesForDefinitions: Processing image for definition ${definition.id} of word "${wordText}"`,
            'info',
          );

          const image = await imageService.getOrCreateDefinitionImage(
            wordText,
            definition.id,
          );

          if (image) {
            await prisma.definition.update({
              where: { id: definition.id },
              data: { imageId: image.id },
            });
          } else {
            clientLog(
              `FROM processImagesForDefinitions: No image found for definition ${definition.id}`,
              'warn',
            );
          }
        } catch (error) {
          void serverLog(
            `FROM processImagesForDefinitions: Error processing image for definition ${definition.id}: ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
        }
      }),
    );

    // Small delay between batches to avoid rate limiting
    if (batches.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

function cleanupDefinitionText(text: unknown): string {
  if (typeof text !== 'string') {
    void serverLog('Non-string definition text encountered', 'warn', text);
    return String(text ?? '')
      .replace(/{[^}]+}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Skip if it's a cross-reference
  // if (text.startsWith('{dx}')) {
  //   return '';
  // }

  return text
    .replace(/{[^}]+}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupExampleText(text: unknown): string {
  if (typeof text !== 'string') {
    void serverLog('Non-string example text encountered', 'warn', text);
    return (
      String(text ?? '')
        // .replace(/{(?!it}|\/it})([^}]+)}/g, '') // Keep {it} and {/it} tags but remove others
        // .replace(/\s+/g, ' ')
        .trim()
    );
  }

  // Skip if it's a cross-reference
  // if (
  //   text.startsWith('{dx}') ||
  //   text.startsWith('{bc}{sx|') ||
  //   text.startsWith('{sx|')
  // ) {
  //   return '';
  // }

  return (
    text
      // .replace(/{(?!it}|\/it})([^}]+)}/g, '') // Keep {it} and {/it} tags but remove others
      // .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Map the part of speech from the API response to a PartOfSpeech enum value
 * @param apiFl The part of speech from the API response
 * @returns The mapped PartOfSpeech value
 */
function mapPartOfSpeech(apiFl: string | undefined | null): PartOfSpeech {
  if (!apiFl) {
    void serverLog('Missing functional label (fl) in API response', 'warn');
    return PartOfSpeech.undefined;
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
      void serverLog('Mapping potentially unhandled part of speech', 'warn', {
        apiFl,
        action: 'Using undefined',
      });
      return PartOfSpeech.undefined;
    default:
      void serverLog('Unknown part of speech encountered', 'warn', {
        apiFl,
        action: 'Using undefined',
      });
      return PartOfSpeech.undefined;
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
      void serverLog('Unknown source type, defaulting to user', 'warn', {
        apiSrc,
      });
      return SourceType.user;
  }
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
      await serverLog('Error processing word', 'error', {
        wordId: response.meta?.id,
        error,
      });
      // Continue processing other words even if one fails
    }
  }

  return results;
}

export async function processOneWord(word: MerriamWebsterResponse) {
  const result = await processAndSaveWord(word);
  return result;
}

interface VerbalIllustration {
  t: string; // Assuming 't' is the text field for the example
  // Add other fields if necessary (e.g., aq for attribution)
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
  if (!dt || !Array.isArray(dt)) {
    return { examples: [], usageNote: null };
  }

  const examples: Array<{
    example: string;
    languageCode: LanguageCode;
    grammaticalNote?: string | null;
  }> = [];

  // Track usage notes with their examples
  const usages: Array<{ text: string; examples: string[] }> = [];

  // Track current grammatical note
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
            examples: result.usageToExamples[i] ?? [],
          })),
        );
      }
    }
    // Handle snote (supplementary notes), which contain text and examples
    else if (type === 'snote' && Array.isArray(content)) {
      // Extract the note text and examples
      let snoteText: string | null = null;
      const snoteExamples: string[] = [];

      // Process the snote content
      content.forEach((subItem) => {
        if (Array.isArray(subItem) && subItem.length >= 2) {
          const [snoteItemType, snoteItemContent] = subItem;

          // Extract text from the note
          if (snoteItemType === 't' && typeof snoteItemContent === 'string') {
            snoteText = cleanupExampleText(snoteItemContent);

            // Add this as a usage text
            if (snoteText) {
              usages.push({
                text: snoteText,
                examples: snoteExamples,
              });
            }
          }

          // Extract examples from the vis array
          if (snoteItemType === 'vis' && Array.isArray(snoteItemContent)) {
            const visExamples = snoteItemContent as VerbalIllustration[];

            visExamples.forEach((ex) => {
              const cleanedExample = cleanupExampleText(ex.t);
              examples.push({
                example: cleanedExample,
                languageCode: language,
                grammaticalNote: getStringFromArray([
                  currentWsgram ?? '',
                  snoteText ?? '',
                ]),
              });

              snoteExamples.push(cleanedExample);
            });
          }
        }
      });
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
      .map((usage, index) => `${index + 1}: ${usage.text}`)
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

        // Process the array item to extract usage text and examples
        item.forEach((subItem) => {
          if (Array.isArray(subItem) && subItem.length >= 2) {
            const [subType, subContent] = subItem as [string, unknown];

            // Extract usage text
            if (subType === 'text' && typeof subContent === 'string') {
              usageText = cleanupExampleText(subContent);
            }

            // Process vis examples in the nested structure
            if (subType === 'vis' && Array.isArray(subContent)) {
              const visExamples = subContent as VerbalIllustration[];

              visExamples.forEach((ex) => {
                const cleanedText = cleanupExampleText(ex.t);
                examples.push({
                  example: cleanedText,
                  languageCode: language,
                  grammaticalNote: `${usageText}${parentGramNote ? ` (${parentGramNote})` : ''}`,
                });
                currentExamples.push(cleanedText);
              });
            } else if (Array.isArray(subContent)) {
              // Recurse if there are more nested arrays
              const nestedPrefix = `${usageText}${parentGramNote ? ` (${parentGramNote})` : ''}`;
              const recursiveResult = processNestedExamples(
                subContent,
                language,
                nestedPrefix,
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
    usageIndex,
  };
}

/**
 * Processes and links audio files for a word
 * @param tx Transaction client
 * @param wordDetailsId Word details ID to link audio to
 * @param audioFiles Array of audio file URLs
 * @param isPrimary Whether this is the primary audio for the word
 */
async function processAudioForWord(
  tx: DatabaseTransactionClient,
  wordDetailsId: number,
  audioFiles: AudioFile[],
  wordText: string,
  isPrimary: boolean = false,
  languageCode: LanguageCode = LanguageCode.en,
  source: SourceType = SourceType.merriam_learners,
): Promise<void> {
  // Convert AudioFile[] to ExternalAudioFile[] format
  const externalAudioFiles = audioFiles.map((file) => ({
    url: file.url,
    word: wordText,
  }));

  // Base metadata for all audio files
  const baseMetadata = {
    languageCode: languageCode.toString(),
    qualityLevel: 'standard',
    voiceGender: 'unknown',
  };

  // Download and store audio files in blob storage before database operations
  const downloadResults = await audioDownloadService.downloadAndStoreBatchAudio(
    externalAudioFiles,
    baseMetadata,
  );

  // Categorize results
  const successful = downloadResults.filter((r) => r.success && !r.skipped);
  const failed = downloadResults.filter((r) => !r.success && !r.skipped);
  const skipped = downloadResults.filter((r) => r.skipped);

  void serverLog(
    `🎵 Audio download results for word "${wordText}": ${successful.length} successful, ${failed.length} failed, ${skipped.length} skipped`,
    'info',
  );

  // Log detailed results for failures
  if (failed.length > 0) {
    void serverLog(
      `❌ Failed audio downloads for "${wordText}": ${failed.map((f) => `${f.originalUrl} (${f.error})`).join(', ')}`,
      'warn',
    );
  }

  // Process successful downloads and create database records
  for (const [index, result] of successful.entries()) {
    // Use the blob storage URL instead of the original external URL
    const audioUrl = result.localUrl!;

    // Use upsert instead of create to handle duplicate audio URLs
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: {
          url: audioUrl,
          languageCode: languageCode,
        },
      },
      update: {}, // No updates needed if it already exists
      create: {
        url: audioUrl,
        source: source,
        languageCode: languageCode,
      },
    });

    // Link audio to word details
    await tx.wordDetailsAudio.upsert({
      where: {
        wordDetailsId_audioId: {
          wordDetailsId,
          audioId: audio.id,
        },
      },
      update: {
        isPrimary: isPrimary && index === 0, // Update primary status if it exists
      },
      create: {
        wordDetailsId,
        audioId: audio.id,
        isPrimary: isPrimary && index === 0, // Only first audio file is primary if isPrimary is true
      },
    });
  }

  // Also process skipped files (already in blob storage)
  for (const [index, result] of skipped.entries()) {
    const audioUrl = result.localUrl!;

    // Use upsert instead of create to handle duplicate audio URLs
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: {
          url: audioUrl,
          languageCode: languageCode,
        },
      },
      update: {}, // No updates needed if it already exists
      create: {
        url: audioUrl,
        source: source,
        languageCode: languageCode,
      },
    });

    // Link audio to word details
    await tx.wordDetailsAudio.upsert({
      where: {
        wordDetailsId_audioId: {
          wordDetailsId,
          audioId: audio.id,
        },
      },
      update: {
        isPrimary: isPrimary && successful.length + index === 0, // Update primary status if it exists
      },
      create: {
        wordDetailsId,
        audioId: audio.id,
        isPrimary: isPrimary && successful.length + index === 0, // Only first audio file is primary if isPrimary is true
      },
    });
  }
}

// Update the upsertWord function to use the new audio processing
async function upsertWord(
  tx: DatabaseTransactionClient,
  source: SourceType,
  wordText: string,
  languageCode: LanguageCode,
  options?: {
    phonetic?: string | null;
    audio?: string | null;
    audioFiles?: AudioFile[] | null;
    etymology?: string | null; // Keep this for passing to WordDetails
    difficultyLevel?: DifficultyLevel;
    sourceEntityId?: string | null;
    partOfSpeech?: PartOfSpeech | null; // This can be PartOfSpeech, null, or undefined if not in options
    variant?: string;
    isHighlighted?: boolean;
    frequencyGeneral?: number | null;
    frequencyManager?: FrequencyManager;
  },
): Promise<Word> {
  // Use shared WordService for word creation
  const word = await WordService.upsertWord(
    tx,
    source,
    wordText,
    languageCode,
    options,
  );

  // Ensure that partOfSpeech passed to upsertWordDetails is PartOfSpeech | null
  const partOfSpeechForDetails: PartOfSpeech | null =
    options?.partOfSpeech === undefined
      ? null
      : (options?.partOfSpeech ?? null);

  // Get PoS-specific frequency using the frequency manager
  let posSpecificFrequency: number | null = null;
  if (partOfSpeechForDetails && options?.frequencyManager) {
    const posFreqData = await options.frequencyManager.getFrequencyData(
      wordText,
      languageCode,
      partOfSpeechForDetails,
    );
    posSpecificFrequency = posFreqData.posSpecific;
  }

  const wordDetails = await upsertWordDetails(
    tx,
    word.id,
    partOfSpeechForDetails, // Explicitly PartOfSpeech | null
    source,
    false,
    options?.variant ?? '', // Ensure this is an empty string for the variant argument
    options?.phonetic ?? null,
    posSpecificFrequency, // Pass the pre-fetched frequency
    options?.etymology ?? null, // Pass etymology to WordDetails
    options?.frequencyManager, // Pass the frequency manager to avoid duplicate calls
  );
  clientLog(
    `From upsertWord in processMerriamApi.ts (upsertWord section): wordDetails: ${JSON.stringify(wordDetails)} for word "${wordText}" with PoS option: ${options?.partOfSpeech}, passed to details: ${partOfSpeechForDetails}`,
    'info',
  );

  // Process audio files if present
  if (options?.audioFiles?.length) {
    await processAudioForWord(
      tx,
      wordDetails.id,
      options.audioFiles,
      wordText,
      true,
      languageCode,
      source,
    );
  }

  return word;
}

/**
 * Create or update a WordDetails record using shared WordService
 * This is needed to establish relationships between words based on part of speech
 */
async function upsertWordDetails(
  tx: DatabaseTransactionClient,
  wordId: number,
  partOfSpeech: PartOfSpeech | null,
  source: SourceType = SourceType.user,
  isPlural: boolean = false,
  variant: string = '',
  phonetic: string | null = null,
  frequency: number | null = null,
  etymology: string | null = null, // Add etymology parameter
  frequencyManager?: FrequencyManager,
): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
  return WordService.upsertWordDetailsMerriam(
    tx,
    wordId,
    partOfSpeech,
    source,
    isPlural,
    variant,
    phonetic,
    frequency,
    etymology,
    frequencyManager,
  );
}

function getStringFromArray(
  array: (string | null | undefined)[] | null,
): string | null {
  if (!array) return null;
  const filteredArray = array.filter(
    (val) => val !== null && val !== undefined && val.trim() !== '',
  );

  if (filteredArray.length > 1) {
    return filteredArray.join(' | '); // No need to trim here
  } else if (filteredArray.length === 1) {
    return filteredArray[0] ?? null; // No need to trim here
  } else {
    return null; // Return an empty string if no valid entries
  }
}

function formatWithBC(text: unknown): string {
  if (typeof text !== 'string') {
    void serverLog('Input is not a string', 'warn', text);
    return '';
  }

  return text
    .split(':') // Split the sentence by colon
    .map((part) => `{bc}${part.trim()}`) // Add {bc} to each part
    .join(' '); // Join the parts back with a space
}

/**
 * Helper function to determine the appropriate part of speech for a relationship
 */
function getPosForRelation(relationType: RelationshipType): PartOfSpeech {
  switch (relationType) {
    case RelationshipType.past_tense_en:
    case RelationshipType.past_participle_en:
    case RelationshipType.present_participle_en:
    case RelationshipType.third_person_en:
      return PartOfSpeech.verb;
    case RelationshipType.plural_en:
      return PartOfSpeech.noun;
    case RelationshipType.phrasal_verb:
    case RelationshipType.variant_form_phrasal_verb_en:
      return PartOfSpeech.phrasal_verb;
    case RelationshipType.phrase:
      return PartOfSpeech.phrase; // Always ensure phrases have phrase part of speech
    case RelationshipType.synonym:
    case RelationshipType.antonym:
    case RelationshipType.related:
      return PartOfSpeech.undefined; // For semantic relationships, use the original part of speech
    default:
      return PartOfSpeech.undefined;
  }
}

/**
 * Helper function to generate a human-readable description for a relationship type
 */
function getRelationshipDescription(
  relationType: RelationshipType,
): string | null {
  switch (relationType) {
    case RelationshipType.synonym:
      return 'Synonym relationship';
    case RelationshipType.antonym:
      return 'Antonym relationship';
    case RelationshipType.related:
      return 'Related term';
    case RelationshipType.past_tense_en:
      return 'Past tense form';
    case RelationshipType.past_participle_en:
      return 'Past participle form';
    case RelationshipType.present_participle_en:
      return 'Present participle form';
    case RelationshipType.third_person_en:
      return 'Third person singular form';
    case RelationshipType.plural_en:
      return 'Plural form';
    case RelationshipType.stem:
      return 'Stem relationship';
    case RelationshipType.phrasal_verb:
      return 'Phrasal verb';
    case RelationshipType.phrase:
      return 'Phrase';
    case RelationshipType.variant_form_phrasal_verb_en:
      return 'Variant form of phrasal verb';
    default:
      return null;
  }
}

/**
 * Helper function to extract synonyms from definition text patterns
 * Detects patterns like {dx}see also {dxt|must-have||}{/dx} and {sx|photograph:1||}
 * @param dt Definition data array
 * @returns Array of extracted synonym words
 */
function extractSynonymsFromDefinitionPatterns(
  dt: Array<[string, unknown]> | undefined,
): string[] {
  if (!dt || !Array.isArray(dt)) {
    return [];
  }

  const synonyms: string[] = [];

  for (const item of dt) {
    if (!Array.isArray(item) || item.length < 2) continue;

    const [type, content] = item;

    // Process text content for synonym patterns
    if (type === 'text' && typeof content === 'string') {
      // Pattern 1: {dx}see also {dxt|WORD||}{/dx} or {dx}see also {dxt|WORD:NUMBER||}{/dx}
      const dxtMatches = content.match(
        /\{dx\}.*?\{dxt\|([^|:]+)(?::[^|]*)?(?:\|\|)?\}/g,
      );
      if (dxtMatches) {
        for (const match of dxtMatches) {
          const wordMatch = match.match(/\{dxt\|([^|:]+)/);
          if (wordMatch?.[1]) {
            const cleanWord = wordMatch[1].trim();
            if (cleanWord && !synonyms.includes(cleanWord)) {
              synonyms.push(cleanWord);
            }
          }
        }
      }

      // Pattern 2: {sx|WORD||} or {sx|WORD:NUMBER||}
      const sxMatches = content.match(/\{sx\|([^|:]+)(?::[^|]*)?(?:\|\|)?\}/g);
      if (sxMatches) {
        for (const match of sxMatches) {
          const wordMatch = match.match(/\{sx\|([^|:]+)/);
          if (wordMatch?.[1]) {
            const cleanWord = wordMatch[1].trim();
            if (cleanWord && !synonyms.includes(cleanWord)) {
              synonyms.push(cleanWord);
            }
          }
        }
      }
    }
  }

  return synonyms;
}
