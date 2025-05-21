'use server';

import { prisma } from '@/core/lib/prisma';
import {
  ProcessedWordData,
  SubWordData,
  RelationshipFromTo,
  AudioFile,
  DefinitionExampleOfProcessWordData,
} from '@/core/types/dictionary';
import {
  LanguageCode,
  PartOfSpeech,
  Prisma,
  RelationshipType,
  SourceType,
  Word,
  DifficultyLevel,
  Gender,
} from '@prisma/client';
import { LogLevel, serverLog } from '@/core/lib/utils/logUtils';
import {
  fetchWordFrequency,
  getGeneralFrequency,
  getPartOfSpeechFrequency,
} from '../services/frequencyService';
import { TranslationService } from '../services/translationService';
import { validateDanishDictionary } from '../utils/validations/danishDictionaryValidator';
import { mapDanishPosToEnum } from '../utils/danishDictionary/mapDaEng';
import { transformDanishForms } from '../utils/danishDictionary/transformDanishForms';
import {
  WordVariant,
  PartOfSpeechDanish,
  DetailCategoryDanish,
} from '@/core/types/translationDanishTypes';
//import { processTranslationsForWord } from '@/core/lib/db/wordTranslationProcessor';

/**Definitions:
 * generalLabels "lbs" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs. (like capitalization indicators, usage notes, etc.)
 *
 * subjectStatusLabels "sls" - A subject/status label describes the subject area (eg, "computing") or regional/usage status (eg, "British", "formal", "slang") of a headword or a particular sense of a headword. A set of one or more subject/status labels is contained in an sls.
 *
 * grammaticalNote "gram" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs.
 *
 
 *
 *
 */

/**
 * Process translations for a word and its related data
 * @param tx Prisma transaction client
 * @param mainWordId ID of the main word
 * @param mainWordText Text of the main word
 * @param wordData Word data including phonetics, stems and definitions
 * @param sourceType Source of the word
 */
export async function processTranslationsForWord(
  tx: Prisma.TransactionClient,
  mainWordId: number,
  mainWordText: string,
  wordData: {
    phonetic: string | null;
    stems: string[];
    definitions: Array<{
      id: number;
      partOfSpeech: string;
      definition: string;
      examples: Array<{
        id: number;
        example: string;
      }>;
    }>;
  },
): Promise<void> {
  try {
    // Initialize translation service
    const translationService = new TranslationService();

    // Prepare the data for translation
    const translationResponse = await translationService.translateWordData(
      mainWordId,
      mainWordText,
      wordData.phonetic,
      wordData.definitions,
      wordData.stems,
      [], // No related words for now, we'll handle them separately if needed
    );

    if (!translationResponse) {
      serverLog(
        `No translation data returned for word: ${mainWordText}`,
        LogLevel.WARN,
      );
      return;
    }

    const { english_word_data, translation_word_for_danish_dictionary } =
      translationResponse;
    const danish_word_data = translation_word_for_danish_dictionary;

    // Validate the Danish dictionary data to catch any unknown entities
    validateDanishDictionary(danish_word_data, `word: ${mainWordText}`);

    if (!english_word_data) {
      serverLog(
        `No translation data returned for word: ${mainWordText}`,
        LogLevel.WARN,
      );
      return;
    }

    //!Process danish word data

    if (danish_word_data && Object.keys(danish_word_data).length > 0) {
      if (danish_word_data.variants && danish_word_data.variants.length > 0) {
        for (const variant of danish_word_data.variants) {
          if (variant) {
            await processAndSaveDanishWord(variant);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in processOrdnetApi.ts:', error);
    throw error;
  }
}

/**
 * Processes and links audio files for a word
 * @param tx Transaction client
 * @param wordDetailsId Word details ID to link audio to
 * @param audioFiles Array of audio file URLs
 * @param isPrimary Whether this is the primary audio for the word
 */
async function processAudioForWord(
  tx: Prisma.TransactionClient,
  wordDetailsId: number,
  audioFiles: AudioFile[],
  isPrimary: boolean = false,
  languageCode: LanguageCode = LanguageCode.en,
  source: SourceType = SourceType.merriam_learners,
): Promise<void> {
  for (const [index, audioFile] of audioFiles.entries()) {
    // Use upsert instead of create to handle duplicate audio URLs
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: {
          url: audioFile.url,
          languageCode: languageCode,
        },
      },
      update: {}, // No updates needed if it already exists
      create: {
        url: audioFile.url,
        source: source,
        languageCode: languageCode,
        note: audioFile.note || null,
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
}

// Update the upsertWord function to use the new audio processing
async function upsertWord(
  tx: Prisma.TransactionClient,
  source: SourceType,
  wordText: string,
  languageCode: LanguageCode,
  options?: {
    phonetic?: string | null;
    audio?: string | null;
    audioFiles?: AudioFile[] | null;
    etymology?: string | null;
    difficultyLevel?: DifficultyLevel;
    sourceEntityId?: string | null;
    partOfSpeech?: PartOfSpeech | null; // This can be PartOfSpeech, null, or undefined if not in options
    variant?: string;
    isHighlighted?: boolean;
    frequencyGeneral?: number | null;
  },
): Promise<Word> {
  // Fetch frequency data if not provided
  let frequencyGeneral = options?.frequencyGeneral;
  if (frequencyGeneral === undefined) {
    try {
      const frequencyData = await fetchWordFrequency(wordText, languageCode);
      frequencyGeneral = getGeneralFrequency(frequencyData);
      serverLog(
        `Fetched frequency data in upsertWord for "${wordText}": ${frequencyGeneral}`,
        LogLevel.INFO,
      );
    } catch (error) {
      serverLog(
        `Error fetching frequency data in upsertWord for "${wordText}": ${error}`,
        LogLevel.ERROR,
      );
      frequencyGeneral = null;
    }
  }

  // Create word record
  const word = await tx.word.upsert({
    where: {
      word_languageCode: {
        word: wordText,
        languageCode,
      },
    },
    update: {
      etymology: options?.etymology ?? null,
      sourceEntityId: options?.sourceEntityId ?? null,
      updatedAt: new Date(),
      isHighlighted: options?.isHighlighted ?? false,
      phoneticGeneral: options?.phonetic ?? null,
      frequencyGeneral: frequencyGeneral ?? null,
    },
    create: {
      word: wordText,
      phoneticGeneral: options?.phonetic ?? null,
      languageCode,
      etymology: options?.etymology ?? null,
      sourceEntityId: options?.sourceEntityId ?? null,
      isHighlighted: options?.isHighlighted ?? false,
      frequencyGeneral: frequencyGeneral ?? null,
    },
  });

  // Ensure that partOfSpeech passed to upsertWordDetails is PartOfSpeech | null
  const partOfSpeechForDetails: PartOfSpeech | null =
    options?.partOfSpeech === undefined ? null : options?.partOfSpeech || null;

  const wordDetails = await upsertWordDetails(
    tx,
    word.id,
    partOfSpeechForDetails, // Explicitly PartOfSpeech | null
    source,
    false,
    options?.variant ?? '', // Ensure this is an empty string for the variant argument
    options?.phonetic ?? null,
  );
  serverLog(
    `From upsertWord in processMerriamApi.ts (upsertWord section): wordDetails: ${JSON.stringify(wordDetails)} for word "${wordText}" with PoS option: ${options?.partOfSpeech}, passed to details: ${partOfSpeechForDetails}`,
    LogLevel.INFO,
  );

  // Process audio files if present
  if (options?.audioFiles?.length) {
    await processAudioForWord(
      tx,
      wordDetails.id,
      options.audioFiles,
      true,
      languageCode,
      source,
    );
  }

  return word;
}

/**
 * Create or update a WordDetails record
 * This is needed to establish relationships between words based on part of speech
 */
async function upsertWordDetails(
  tx: Prisma.TransactionClient,
  wordId: number,
  partOfSpeech: PartOfSpeech | null,
  source: SourceType = SourceType.user,
  isPlural: boolean = false,
  variant: string = '',
  phonetic: string | null = null,
  frequency: number | null = null,
  gender: Gender | null = null,
  forms: string | null = null,
): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
  // Ensure we have a valid part of speech, using the API's part of speech if available
  const pos: PartOfSpeech = partOfSpeech || PartOfSpeech.undefined;

  // Fetch the word text for frequency lookup if frequency is not provided
  let posFrequency = frequency;
  if (posFrequency === null || posFrequency === undefined) {
    try {
      // Get the word text from the database
      const wordRecord = await tx.word.findUnique({
        where: { id: wordId },
        select: { word: true, languageCode: true },
      });

      if (wordRecord) {
        const frequencyData = await fetchWordFrequency(
          wordRecord.word,
          wordRecord.languageCode as LanguageCode,
        );

        posFrequency = getPartOfSpeechFrequency(frequencyData, pos);

        serverLog(
          `Fetched POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${pos}: ${posFrequency}`,
          LogLevel.INFO,
        );
      }
    } catch (error) {
      serverLog(
        `Error fetching POS frequency data in upsertWordDetails for word ID ${wordId}: ${error}`,
        LogLevel.ERROR,
      );
      posFrequency = null;
    }
  }

  // Create or find the WordDetails record
  const wordDetails = await tx.wordDetails.upsert({
    where: {
      wordId_partOfSpeech_variant: {
        wordId,
        partOfSpeech: pos,
        variant: variant || '',
      },
    },
    create: {
      wordId,
      partOfSpeech: pos,
      phonetic: phonetic,
      variant: variant,
      isPlural,
      source: source,
      frequency: posFrequency,
      gender: gender,
      forms: forms,
    },
    update: {
      isPlural: isPlural ?? undefined,
      ...(phonetic !== null && { phonetic: phonetic }),
      ...(source !== null && { source: source }),
      ...(posFrequency !== null && { frequency: posFrequency }),
      ...(gender !== null && { gender: gender }),
      ...(forms !== null && { forms: forms }),
    },
  });

  return wordDetails;
}

/**
 * Generates a descriptive definition for a Danish word form.
 * @param baseWordText The text of the base word.
 * @param relatedWordText The text of the related word form.
 * @param relationshipType The type of relationship between the base and related word.
 * @returns A string describing the word form, or an empty string if no specific description is generated.
 */
function getDanishFormDefinition(
  baseWordText: string,
  relatedWordText: string,
  relationshipType: RelationshipType | string, // Allow string for custom Danish types
): string {
  switch (relationshipType) {
    case 'definite_form_da' as const:
    case RelationshipType.definite_form_da:
      return `Definite form (bestemt form) of {it}${baseWordText}{/it}.`;
    case 'plural_da' as const:
    case RelationshipType.plural_da:
      return `Plural form (flertal) of {it}${baseWordText}{/it}.`;
    case 'plural_definite_da' as const:
    case RelationshipType.plural_definite_da:
      return `Plural definite form (bestemt form flertal) of {it}${baseWordText}{/it}.`;
    case 'present_tense_da' as const:
    case RelationshipType.present_tense_da:
      return `Present tense (nutid) of {it}${baseWordText}{/it}.`;
    case 'past_tense_da' as const:
    case RelationshipType.past_tense_da:
      return `Past tense (datid) of {it}${baseWordText}{/it}.`;
    case 'past_participle_da' as const:
    case RelationshipType.past_participle_da:
      return `Past participle (førnutid) of {it}${baseWordText}{/it}.`;
    case 'imperative_da' as const:
    case RelationshipType.imperative_da:
      return `Imperative form (bydeform) of {it}${baseWordText}{/it}.`;
    case 'comparative_da' as const:
    case RelationshipType.comparative_da:
      return `Comparative form (komparativ) of {it}${baseWordText}{/it}.`;
    case 'superlative_da' as const:
    case RelationshipType.superlative_da:
      return `Superlative form (superlativ) of {it}${baseWordText}{/it}.`;
    case 'common_gender_da' as const:
      return `Common gender form (fælleskøn) of {it}${baseWordText}{/it}.`;
    case 'neuter_gender_da' as const:
      return `Neuter gender form (intetkøn) of {it}${baseWordText}{/it}.`;
    case 'neuter_form_da' as const: // Typically for adjectives
      return `Neuter form (intetkønsform) of {it}${baseWordText}{/it}.`;
    case 'adverbial_form_da' as const:
      return `Adverbial form of {it}${baseWordText}{/it}.`;
    case 'contextual_usage_da' as const:
      return `Contextual usage of {it}${baseWordText}{/it}.`; // Usage note should provide more detail
    case 'neuter_pronoun_da' as const:
      return `Neuter form of the pronoun {it}${baseWordText}{/it}.`;
    case 'plural_pronoun_da' as const:
      return `Plural form of the pronoun {it}${baseWordText}{/it}.`;
    // Add other relevant Danish form types if needed
    default:
      // For other relationship types (synonym, antonym, stem, related, composition, phrase),
      // the definition is usually more complex or comes from the API directly,
      // so we don't generate a simple form description here.
      // Check if it's a valid RelationshipType enum member before returning empty
      if (
        Object.values(RelationshipType).includes(
          relationshipType as RelationshipType,
        )
      ) {
        return ''; // It's a valid enum but not handled above
      }
      // If it's a string not matching any case and not in enum, it's an unknown/custom type
      serverLog(
        `Unknown relationship type in getDanishFormDefinition: ${relationshipType}`,
        LogLevel.WARN,
      );
      return ''; // Return empty or a generic placeholder if preferred
  }
}

export async function processAndSaveDanishWord(
  danishWordData: WordVariant,
  pTx?: Prisma.TransactionClient, // Optional transaction client parameter
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  const mainWordText = danishWordData.word.word;
  const language = LanguageCode.da;
  const source = SourceType.danish_dictionary;
  const partOfSpeech = mapDanishPosToEnum(danishWordData.word.partOfSpeech[0]);
  const mainWordPartOfSpeechInfo = danishWordData.word.partOfSpeech;
  let determinedGender: Gender | null = null;
  if (mainWordPartOfSpeechInfo.includes('fælleskøn' as PartOfSpeechDanish)) {
    determinedGender = Gender.common;
  } else if (
    mainWordPartOfSpeechInfo.includes('intetkøn' as PartOfSpeechDanish)
  ) {
    determinedGender = Gender.neuter;
  } else if (
    mainWordPartOfSpeechInfo.includes(
      'fælleskønellerintetkøn' as PartOfSpeechDanish,
    )
  ) {
    determinedGender = Gender.common_neuter;
  } else {
    determinedGender = null;
  }
  const gender: Gender | null = determinedGender;
  const audioFiles = danishWordData.word.audio || [];
  const etymology = danishWordData.word.etymology;
  const variant = danishWordData.word.variant || '';
  const sourceEntityId = `${source}-${mainWordText}-${partOfSpeech}-${variant}`;
  let frequencyGeneral = null;
  let frequency = null;
  try {
    const frequencyData = await fetchWordFrequency(mainWordText, language);
    frequencyGeneral = getGeneralFrequency(frequencyData);
    frequency = getPartOfSpeechFrequency(frequencyData, partOfSpeech);
  } catch (error) {
    serverLog(
      `Error fetching frequency data for "${mainWordText}": ${error}`,
      LogLevel.ERROR,
    );
  }

  const processedData: ProcessedWordData = {
    word: {
      // id will be set after saving the mainWord entity
      word: mainWordText,
      variant: variant,
      isHighlighted: false,
      gender: gender,
      forms:
        danishWordData.word.forms && danishWordData.word.forms.length > 0
          ? danishWordData.word.forms.join(', ')
          : null,
      frequencyGeneral: frequencyGeneral,
      frequency: frequency,
      languageCode: language,
      source: source,
      partOfSpeech: partOfSpeech,
      phonetic: danishWordData.word.phonetic,
      audioFiles: (() => {
        const files: AudioFile[] = [];
        if (source === SourceType.danish_dictionary && audioFiles.length > 0) {
          files.push(
            ...audioFiles
              .filter((a) => a.word === 'grundform')
              .map((a) => ({ url: a.audio_url })),
          );
        }
        return files.length > 0 ? files : null;
      })(),
      etymology: etymology,
      relatedWords: [],
      sourceEntityId: sourceEntityId,
    },
    definitions: [],
    phrases: [],
    stems: [],
  };

  if (danishWordData.definition && danishWordData.definition.length > 0) {
    for (const def of danishWordData.definition) {
      const combinedExamples: DefinitionExampleOfProcessWordData[] = [];

      if (def.labels?.Eksempler && Array.isArray(def.labels.Eksempler)) {
        def.labels.Eksempler.forEach((exampleText: string) => {
          combinedExamples.push({
            example: exampleText,
            languageCode: language,
            grammaticalNote: null,
            sourceOfExample: null, //Eksempler don't have sources in the same way
          });
        });
      }

      if (def.examples && Array.isArray(def.examples)) {
        def.examples.forEach((example, index) => {
          let sourceExampleText = null;
          if (def.sources && def.sources[index]) {
            const src = def.sources[index];
            sourceExampleText = `{bc}short {it}${src.short}{/it} {bc}full {it}${src.full}{/it}`;
          }
          combinedExamples.push({
            example,
            languageCode: language,
            grammaticalNote: null, // Assuming no grammatical note for these initially
            sourceOfExample: sourceExampleText,
          });
        });
      }

      processedData.definitions.push({
        id: null, // id will be populated after saving
        source: source.toString(),
        languageCode: language,
        definition: def.definition,
        subjectStatusLabels: extractSubjectLabels(def.labels),
        generalLabels: extractGeneralLabels(def.labels),
        grammaticalNote: extractGrammaticalNote(def.labels),
        usageNote: extractUsageNote(def.labels),
        isInShortDef: false,
        examples: combinedExamples, // Use the combined and ordered list
      });
    }
  }

  let subWordsArray: SubWordData[] = [];
  if (danishWordData.word) {
    const danishEntry = {
      word: mainWordText,
      word_variants: [],
      variant: danishWordData.word.variant || '',
      variant_pos: '',
      phonetic: danishWordData.word.phonetic,
      partOfSpeech: Array.isArray(danishWordData.word.partOfSpeech)
        ? danishWordData.word.partOfSpeech.filter(
            (p: PartOfSpeechDanish) => typeof p === 'string',
          )
        : [],
      forms: danishWordData.word.forms || [],
      contextual_forms:
        (danishWordData.word.contextual_forms as {
          [key: string]: string[];
        } | null) || {},
      audio: danishWordData.word.audio.map((a) => ({
        audio_url: a.audio_url,
        audio_type: a.audio_type,
        word: a.word || '',
        phonetic_audio: a.phonetic_audio,
      })),
    };
    const formsData = transformDanishForms(danishEntry);
    processedData.word.audioFiles = formsData.audio
      ? formsData.audio.map((a) => ({
          url: a.audio_url,
          note: a.note || null,
        }))
      : null;
    subWordsArray = formsData.relatedWords.map((relatedWord) => {
      const formRelationshipType = relatedWord.relationships.find(
        (rel) =>
          rel.relationshipType !== RelationshipType.related &&
          rel.relationshipType !== RelationshipType.stem,
      )?.relationshipType;
      const definitionText = formRelationshipType
        ? getDanishFormDefinition(
            mainWordText,
            relatedWord.word,
            formRelationshipType,
          )
        : '';
      return {
        word: relatedWord.word,
        languageCode: language,
        source: SourceType.danish_dictionary,
        partOfSpeech: mapDanishPosToEnum(relatedWord.partOfSpeech),
        phonetic: relatedWord.phonetic || null,
        audioFiles: relatedWord.audio
          ? relatedWord.audio.map((a) => ({
              url: a.audio_url,
              note: a.note || null,
            }))
          : null,
        usageNote:
          relatedWord.relationships.find((rel) => rel.usageNote)?.usageNote ||
          null,
        etymology: mainWordText,
        definitions: [
          {
            source: SourceType.danish_dictionary,
            languageCode: language,
            definition: definitionText,
            examples: [],
            subjectStatusLabels: null,
            generalLabels: null,
            grammaticalNote: null,
            usageNote:
              relatedWord.relationships.find((rel) => rel.usageNote)
                ?.usageNote || null,
            isInShortDef: false,
          },
        ],
        relationship: [
          ...relatedWord.relationships.map((rel) => ({
            fromWord: 'mainWordDetails' as const,
            toWord: 'subWordDetails' as const,
            type: rel.relationshipType,
          })),
          {
            fromWord: 'mainWord',
            toWord: 'subWord',
            type: RelationshipType.related,
          },
        ],
        sourceData: ['form'],
      };
    });
  }

  if (danishWordData.stems && danishWordData.stems.length > 0) {
    for (const stem of danishWordData.stems) {
      subWordsArray.push({
        word: stem.stem,
        languageCode: language,
        source,
        etymology: mainWordText,
        partOfSpeech: mapStemPosToEnum(stem.partOfSpeech),
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWordDetails' as const,
            toWord: 'subWordDetails' as const,
            type: RelationshipType.stem,
          },
          {
            fromWord: 'mainWord' as const,
            toWord: 'subWord' as const,
            type: RelationshipType.related,
          },
        ],
        sourceData: ['stem'],
      });
    }
  }

  if (danishWordData.synonyms && danishWordData.synonyms.length > 0) {
    for (const synonym of danishWordData.synonyms) {
      subWordsArray.push({
        word: synonym,
        languageCode: language,
        source,
        partOfSpeech: partOfSpeech,
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWordDetails' as const,
            toWord: 'subWordDetails' as const,
            type: RelationshipType.synonym,
          },
        ],
        sourceData: ['synonym'],
      });
    }
  }

  if (danishWordData.antonyms && danishWordData.antonyms.length > 0) {
    for (const antonym of danishWordData.antonyms) {
      subWordsArray.push({
        word: antonym,
        languageCode: language,
        source,
        partOfSpeech: partOfSpeech,
        definitions: [],
        relationship: [
          {
            fromWord: 'mainWordDetails' as const,
            toWord: 'subWordDetails' as const,
            type: RelationshipType.antonym,
          },
        ],
        sourceData: ['antonym'],
      });
    }
  }

  if (danishWordData.compositions && danishWordData.compositions.length > 0) {
    const S_PATTERN = /^(.*)\(s\)(.*)$/;
    for (const composition of danishWordData.compositions) {
      const match = composition.composition.match(S_PATTERN);
      if (match) {
        const prefix = match[1];
        const suffix = match[2];
        if (typeof prefix === 'string' && typeof suffix === 'string') {
          const compA_text = prefix + suffix;
          const compB_text = prefix + 's' + suffix;
          subWordsArray.push({
            word: compA_text,
            languageCode: language,
            source,
            partOfSpeech: partOfSpeech,
            phonetic: null,
            audioFiles: null,
            etymology: mainWordText,
            definitions: [
              {
                source: source,
                languageCode: language,
                definition: `Compound form related to {it}${mainWordText}{/it}.`,
                examples: [],
                subjectStatusLabels: null,
                generalLabels: null,
                grammaticalNote: null,
                usageNote: null,
                isInShortDef: false,
              },
            ],
            relationship: [
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.composition,
              },
              {
                fromWord: 'subWordDetails' as const,
                toWord: compB_text as RelationshipFromTo,
                type: RelationshipType.alternative_spelling,
              },
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.related,
              },
            ],
            sourceData: ['composition_expanded_A'],
          });
          subWordsArray.push({
            word: compB_text,
            languageCode: language,
            source,
            partOfSpeech: partOfSpeech,
            phonetic: null,
            audioFiles: null,
            etymology: mainWordText,
            definitions: [
              {
                source: source,
                languageCode: language,
                definition: `Compound form related to {it}${mainWordText}{/it}.`,
                examples: [],
                subjectStatusLabels: null,
                generalLabels: null,
                grammaticalNote: null,
                usageNote: null,
                isInShortDef: false,
              },
            ],
            relationship: [
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.composition,
              },
              {
                fromWord: 'subWordDetails' as const,
                toWord: compA_text as RelationshipFromTo,
                type: RelationshipType.alternative_spelling,
              },
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.related,
              },
            ],
            sourceData: ['composition_expanded_B'],
          });
        } else {
          serverLog(
            `Could not parse composition with (s) pattern: ${composition.composition}`,
            LogLevel.WARN,
          );
          subWordsArray.push({
            word: composition.composition,
            languageCode: language,
            source,
            partOfSpeech: partOfSpeech,
            phonetic: null,
            audioFiles: null,
            etymology: mainWordText,
            definitions: [
              {
                source: source,
                languageCode: language,
                definition: `Compound form related to {it}${mainWordText}{/it}.`,
                examples: [],
                subjectStatusLabels: null,
                generalLabels: null,
                grammaticalNote: null,
                usageNote: null,
                isInShortDef: false,
              },
            ],
            relationship: [
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.composition,
              },
              {
                fromWord: 'mainWord' as const,
                toWord: 'subWord' as const,
                type: RelationshipType.related,
              },
            ],
            sourceData: ['composition_malformed_match'],
          });
        }
      } else {
        subWordsArray.push({
          word: composition.composition,
          languageCode: language,
          source,
          partOfSpeech: partOfSpeech,
          phonetic: null,
          audioFiles: null,
          etymology: mainWordText,
          definitions: [
            {
              source: source,
              languageCode: language,
              definition: `Compound form related to {it}${mainWordText}{/it}.`,
              examples: [],
              subjectStatusLabels: null,
              generalLabels: null,
              grammaticalNote: null,
              usageNote: null,
              isInShortDef: false,
            },
          ],
          relationship: [
            {
              fromWord: 'mainWord' as const,
              toWord: 'subWord' as const,
              type: RelationshipType.composition,
            },
            {
              fromWord: 'mainWord' as const,
              toWord: 'subWord' as const,
              type: RelationshipType.related,
            },
          ],
          sourceData: ['composition'],
        });
      }
    }
  }

  if (
    danishWordData.word.word_variants &&
    danishWordData.word.word_variants.length > 1
  ) {
    for (const variantText of danishWordData.word.word_variants.slice(1)) {
      if (variantText !== mainWordText) {
        subWordsArray.push({
          word: variantText,
          languageCode: language,
          source,
          partOfSpeech: partOfSpeech,
          phonetic: null,
          audioFiles: null,
          etymology: mainWordText,
          definitions: [
            {
              source: source,
              languageCode: language,
              definition: `Variant of {it}${mainWordText}{/it}.`,
              examples: [],
              subjectStatusLabels: null,
              generalLabels: null,
              grammaticalNote: null,
              usageNote: null,
              isInShortDef: false,
            },
          ],
          relationship: [
            {
              fromWord: 'mainWord' as const,
              toWord: 'subWord' as const,
              type: RelationshipType.related,
            },
            {
              fromWord: 'mainWordDetails' as const,
              toWord: 'subWordDetails' as const,
              type: RelationshipType.alternative_spelling,
            },
          ],
          sourceData: ['variant'],
        });
      }
    }
  }

  //! Fixed expressions
  if (
    danishWordData.fixed_expressions &&
    danishWordData.fixed_expressions.length > 0
  ) {
    for (const expression of danishWordData.fixed_expressions) {
      // Process each definition object within the expression.definition array
      for (const defItem of expression.definition) {
        // Combine examples from labels.Eksempler and regular examples, just like for definitions
        const combinedExpressionExamples: DefinitionExampleOfProcessWordData[] =
          [];

        // Add examples from labels.Eksempler if they exist
        if (
          defItem.labels?.Eksempler &&
          Array.isArray(defItem.labels.Eksempler)
        ) {
          defItem.labels.Eksempler.forEach((exampleText: string) => {
            combinedExpressionExamples.push({
              example: exampleText,
              languageCode: language,
              grammaticalNote: null,
              sourceOfExample: null, // Eksempler don't have sources
            });
          });
        }

        // Add examples from the main examples array if they exist
        if (defItem.examples && Array.isArray(defItem.examples)) {
          defItem.examples.forEach((example, index) => {
            let sourceExampleText = null;
            if (defItem.sources && defItem.sources[index]) {
              const srcExpr = defItem.sources[index];
              sourceExampleText = `{bc}short {it}${srcExpr.short}{/it} {bc}full {it}${srcExpr.full}{/it}`;
            }
            combinedExpressionExamples.push({
              example,
              languageCode: language,
              grammaticalNote: null,
              sourceOfExample: sourceExampleText,
            });
          });
        }

        // Each definition becomes a phrase entry with combined examples
        processedData.phrases.push({
          phrase: expression.expression,
          definition: defItem.definition,
          examples: combinedExpressionExamples,
        });

        // Add as a subWord too, with all the metadata
        subWordsArray.push({
          word: expression.expression,
          languageCode: language,
          source,
          partOfSpeech: PartOfSpeech.phrase,
          definitions: [
            {
              source: source.toString(),
              languageCode: language,
              definition: defItem.definition,
              examples: combinedExpressionExamples,
              subjectStatusLabels: defItem.labels
                ? extractSubjectLabels(defItem.labels)
                : null,
              generalLabels: defItem.labels
                ? extractGeneralLabels(defItem.labels)
                : null,
              grammaticalNote: defItem.labels
                ? extractGrammaticalNote(defItem.labels)
                : null,
              usageNote: defItem.labels
                ? extractUsageNote(defItem.labels)
                : null,
              isInShortDef: false,
            },
          ],
          relationship: [
            {
              fromWord: 'mainWordDetails' as const,
              toWord: 'subWordDetails' as const,
              type: RelationshipType.phrase,
            },
            {
              fromWord: 'mainWord' as const,
              toWord: 'subWord' as const,
              type: RelationshipType.related,
            },
          ],
          sourceData: ['expression'],
        });

        // Get any synonyms from the labels if they exist
        const synonymsFromLabels: string[] = [];
        if (defItem.labels) {
          // Check 'Synonym' label which can be a string or array
          if (defItem.labels.Synonym) {
            if (typeof defItem.labels.Synonym === 'string') {
              synonymsFromLabels.push(defItem.labels.Synonym);
            } else if (Array.isArray(defItem.labels.Synonym)) {
              synonymsFromLabels.push(
                ...defItem.labels.Synonym.filter((s) => typeof s === 'string'),
              );
            }
          }

          // Check 'Synonymer' label which can be a string or array
          if (defItem.labels.Synonymer) {
            if (typeof defItem.labels.Synonymer === 'string') {
              synonymsFromLabels.push(defItem.labels.Synonymer);
            } else if (Array.isArray(defItem.labels.Synonymer)) {
              synonymsFromLabels.push(
                ...defItem.labels.Synonymer.filter(
                  (s) => typeof s === 'string',
                ),
              );
            }
          }
        }

        // Process variants (alternative forms) of the expression
        if (
          expression.expression_variants &&
          expression.expression_variants.length > 0
        ) {
          for (const variant of expression.expression_variants) {
            if (variant !== expression.expression) {
              // Skip self-reference
              subWordsArray.push({
                word: variant,
                languageCode: language,
                source,
                partOfSpeech: PartOfSpeech.phrase,
                definitions: [
                  {
                    source: source.toString(),
                    languageCode: language,
                    definition: `Variant of the phrase {it}${expression.expression}{/it}: ${defItem.definition}`,
                    examples: [],
                    subjectStatusLabels: null,
                    generalLabels: null,
                    grammaticalNote: null,
                    usageNote: null,
                    isInShortDef: false,
                  },
                ],
                relationship: [
                  {
                    fromWord: expression.expression as RelationshipFromTo,
                    toWord: 'subWordDetails' as const,
                    type: RelationshipType.alternative_spelling,
                  },
                  {
                    fromWord: 'mainWordDetails' as const,
                    toWord: 'subWordDetails' as const,
                    type: RelationshipType.phrase,
                  },
                  {
                    fromWord: 'mainWord' as const,
                    toWord: 'subWord' as const,
                    type: RelationshipType.related,
                  },
                ],
                sourceData: ['expression_variant'],
              });
            }
          }
        }

        // Process synonyms from labels
        for (const synonym of synonymsFromLabels) {
          if (synonym !== expression.expression) {
            // Skip self-reference
            subWordsArray.push({
              word: synonym,
              languageCode: language,
              source,
              partOfSpeech: PartOfSpeech.phrase,
              definitions: [
                {
                  source: source.toString(),
                  languageCode: language,
                  definition: `Synonym of the phrase {it}${expression.expression}{/it}: ${defItem.definition}`,
                  examples: [],
                  subjectStatusLabels: null,
                  generalLabels: null,
                  grammaticalNote: null,
                  usageNote: null,
                  isInShortDef: false,
                },
              ],
              relationship: [
                {
                  fromWord: expression.expression as RelationshipFromTo,
                  toWord: 'subWordDetails' as const,
                  type: RelationshipType.synonym,
                },
              ],
              sourceData: ['expression_synonym'],
            });
          }
        }
      }
    }
  }

  const performDbOperations = async (tx: Prisma.TransactionClient) => {
    const mainWord = await upsertWord(tx, source, mainWordText, language, {
      phonetic: processedData.word.phonetic || null,
      audioFiles: processedData.word.audioFiles || null,
      etymology: processedData.word.etymology || null,
      sourceEntityId: processedData.word.sourceEntityId || null,
      partOfSpeech,
      variant: processedData.word.variant || '',
      isHighlighted: false,
      frequencyGeneral: frequencyGeneral,
    });
    processedData.word.id = mainWord.id; // Set the ID of the main word

    const mainWordDetails = await upsertWordDetails(
      tx,
      mainWord.id,
      partOfSpeech,
      source,
      false,
      processedData.word.variant || '',
      processedData.word.phonetic,
      frequency,
      gender,
      processedData.word.forms,
    );

    for (const definitionData of processedData.definitions) {
      const definition = await tx.definition.upsert({
        where: {
          definition_languageCode_source: {
            definition: definitionData.definition,
            languageCode: definitionData.languageCode as LanguageCode,
            source: definitionData.source as SourceType,
          },
        },
        update: {
          subjectStatusLabels: definitionData.subjectStatusLabels || null,
          generalLabels: definitionData.generalLabels || null,
          grammaticalNote: definitionData.grammaticalNote || null,
          usageNote: definitionData.usageNote || null,
          isInShortDef: definitionData.isInShortDef || false,
        },
        create: {
          definition: definitionData.definition,
          source: definitionData.source as SourceType,
          languageCode: definitionData.languageCode as LanguageCode,
          subjectStatusLabels: definitionData.subjectStatusLabels || null,
          generalLabels: definitionData.generalLabels || null,
          grammaticalNote: definitionData.grammaticalNote || null,
          usageNote: definitionData.usageNote || null,
          isInShortDef: definitionData.isInShortDef || false,
        },
      });
      // Update definitionData with the ID from the database
      const defIndex = processedData.definitions.findIndex(
        (d) =>
          d.definition === definitionData.definition &&
          d.languageCode === definitionData.languageCode,
      );
      if (defIndex !== -1 && processedData.definitions[defIndex]) {
        processedData.definitions[defIndex].id = definition.id;
      }

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

      if (definitionData.examples && definitionData.examples.length > 0) {
        for (const [exIndex, example] of definitionData.examples.entries()) {
          const dbExample = await tx.definitionExample.upsert({
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
              sourceOfExample: example.sourceOfExample || null,
            },
            update: {
              grammaticalNote: example.grammaticalNote || null,
              sourceOfExample: example.sourceOfExample || null,
            },
          });
          // Update example with ID from the database
          if (
            defIndex !== -1 &&
            processedData.definitions[defIndex] &&
            processedData.definitions[defIndex].examples &&
            processedData.definitions[defIndex].examples[exIndex]
          ) {
            processedData.definitions[defIndex].examples[exIndex].id =
              dbExample.id;
          }
        }
      }
    }

    for (const subWord of subWordsArray) {
      const subWordEntity = await upsertWord(
        tx,
        source,
        subWord.word,
        subWord.languageCode as LanguageCode,
        {
          phonetic: subWord.phonetic || null,
          audioFiles: subWord.audioFiles || null,
          etymology: subWord.etymology || null,
          partOfSpeech: subWord.partOfSpeech,
        },
      );
      const subWordIndex = subWordsArray.findIndex(
        (sw) =>
          sw.word === subWord.word && sw.languageCode === subWord.languageCode,
      );
      if (subWordIndex !== -1 && subWordsArray[subWordIndex]) {
        subWordsArray[subWordIndex].id = subWordEntity.id;
      }

      for (const [defDataIndex, defData] of subWord.definitions.entries()) {
        const subWordDef = await tx.definition.upsert({
          where: {
            definition_languageCode_source: {
              definition: defData.definition,
              languageCode: defData.languageCode as LanguageCode,
              source: defData.source as SourceType,
            },
          },
          update: {
            subjectStatusLabels: defData.subjectStatusLabels || null,
            generalLabels: defData.generalLabels || null,
            grammaticalNote: defData.grammaticalNote || null,
            usageNote: defData.usageNote || null,
            isInShortDef: defData.isInShortDef || false,
          },
          create: {
            definition: defData.definition,
            source: defData.source as SourceType,
            languageCode: defData.languageCode as LanguageCode,
            subjectStatusLabels: defData.subjectStatusLabels || null,
            generalLabels: defData.generalLabels || null,
            grammaticalNote: defData.grammaticalNote || null,
            usageNote: defData.usageNote || null,
            isInShortDef: defData.isInShortDef || false,
          },
        });
        if (
          subWordIndex !== -1 &&
          subWordsArray[subWordIndex] &&
          subWordsArray[subWordIndex].definitions &&
          subWordsArray[subWordIndex].definitions[defDataIndex]
        ) {
          subWordsArray[subWordIndex].definitions[defDataIndex].id =
            subWordDef.id;
        }

        const subWordDetails = await upsertWordDetails(
          tx,
          subWordEntity.id,
          subWord.partOfSpeech || null,
          source,
        );
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

        if (defData.examples && defData.examples.length > 0) {
          for (const [exIndex, example] of defData.examples.entries()) {
            const dbExample = await tx.definitionExample.upsert({
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
                sourceOfExample: example.sourceOfExample || null,
              },
              update: {
                grammaticalNote: example.grammaticalNote || null,
                sourceOfExample: example.sourceOfExample || null,
              },
            });
            if (
              subWordIndex !== -1 &&
              subWordsArray[subWordIndex] &&
              subWordsArray[subWordIndex].definitions &&
              subWordsArray[subWordIndex].definitions[defDataIndex] &&
              subWordsArray[subWordIndex].definitions[defDataIndex].examples &&
              subWordsArray[subWordIndex].definitions[defDataIndex].examples[
                exIndex
              ]
            ) {
              subWordsArray[subWordIndex].definitions[defDataIndex].examples[
                exIndex
              ].id = dbExample.id;
            }
          }
        }
      }
    }

    const allPopulatedSubWords = subWordsArray.filter((sw) => sw.id);

    for (const currentSubWord of allPopulatedSubWords) {
      if (!currentSubWord.id) continue; // Should be filtered out, but as a safeguard

      if (
        currentSubWord.relationship &&
        currentSubWord.relationship.length > 0
      ) {
        for (const relation of currentSubWord.relationship) {
          let fromWordId: number | null = null;
          let toWordId: number | null = null;
          let fromWordPartOfSpeech: PartOfSpeech | null = null;
          let toWordPartOfSpeech: PartOfSpeech | null = null;

          if (
            relation.fromWord === 'mainWord' ||
            relation.fromWord === 'mainWordDetails'
          ) {
            fromWordId = mainWord.id;
            fromWordPartOfSpeech = partOfSpeech;
          } else if (
            relation.fromWord === 'subWord' ||
            relation.fromWord === 'subWordDetails'
          ) {
            fromWordId = currentSubWord.id;
            fromWordPartOfSpeech = currentSubWord.partOfSpeech;
          } else {
            // Direct word string, e.g. for compA_text / compB_text
            const targetSubWord = allPopulatedSubWords.find(
              (sw) => sw.word === relation.fromWord,
            );
            if (targetSubWord && targetSubWord.id) {
              fromWordId = targetSubWord.id;
              fromWordPartOfSpeech = targetSubWord.partOfSpeech;
            }
          }

          if (
            relation.toWord === 'mainWord' ||
            relation.toWord === 'mainWordDetails'
          ) {
            toWordId = mainWord.id;
            toWordPartOfSpeech = partOfSpeech;
          } else if (
            relation.toWord === 'subWord' ||
            relation.toWord === 'subWordDetails'
          ) {
            toWordId = currentSubWord.id;
            toWordPartOfSpeech = currentSubWord.partOfSpeech;
          } else {
            // Direct word string
            const targetSubWord = allPopulatedSubWords.find(
              (sw) => sw.word === relation.toWord,
            );
            if (targetSubWord && targetSubWord.id) {
              toWordId = targetSubWord.id;
              toWordPartOfSpeech = targetSubWord.partOfSpeech;
            }
          }

          if (!fromWordId || !toWordId) {
            serverLog(
              `Missing wordId for relationship: from='${relation.fromWord}'(id:${fromWordId}) to='${relation.toWord}'(id:${toWordId}), for subWord '${currentSubWord.word}'. Skipping.`,
              LogLevel.WARN,
            );
            continue;
          }

          const createDetailsRelation =
            (typeof relation.fromWord === 'string' &&
              relation.fromWord.endsWith('Details')) ||
            (typeof relation.toWord === 'string' &&
              relation.toWord.endsWith('Details')) ||
            relation.type === RelationshipType.alternative_spelling; // Treat alt_spelling as details level

          if (createDetailsRelation) {
            const isFromPlural =
              relation.type === RelationshipType.plural_da &&
              fromWordPartOfSpeech === PartOfSpeech.noun;
            const isToPlural =
              relation.type === RelationshipType.plural_da &&
              toWordPartOfSpeech === PartOfSpeech.noun;

            const fromWordDetails = await upsertWordDetails(
              tx,
              fromWordId,
              fromWordPartOfSpeech,
              source,
              isFromPlural,
            );
            const toWordDetails = await upsertWordDetails(
              tx,
              toWordId,
              toWordPartOfSpeech,
              source,
              isToPlural,
            );

            await tx.wordDetailsRelationship.upsert({
              where: {
                fromWordDetailsId_toWordDetailsId_type: {
                  fromWordDetailsId: fromWordDetails.id,
                  toWordDetailsId: toWordDetails.id,
                  type: relation.type,
                },
              },
              create: {
                fromWordDetailsId: fromWordDetails.id,
                toWordDetailsId: toWordDetails.id,
                type: relation.type,
                description: getRelationshipDescription(relation.type),
              },
              update: {},
            });
          } else {
            await tx.wordToWordRelationship.upsert({
              where: {
                fromWordId_toWordId_type: {
                  fromWordId: fromWordId,
                  toWordId: toWordId,
                  type: relation.type,
                },
              },
              create: {
                fromWordId: fromWordId,
                toWordId: toWordId,
                type: relation.type,
                description: getRelationshipDescription(relation.type),
              },
              update: {},
            });
          }
        }
      }
    }
  };

  try {
    if (pTx) {
      await performDbOperations(pTx);
    } else {
      await prisma.$transaction(performDbOperations, {
        maxWait: 60000,
        timeout: 200000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    }
    return processedData;
  } catch (error) {
    console.error('Error saving Danish word data for:', mainWordText, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
    }
    throw new Error(
      `Failed to save Danish word data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Helper functions for extracting data from labels
function extractSubjectLabels(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  const subjectLabels = [
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
    'slang',
  ];

  const found = Object.keys(labels).filter((key) =>
    subjectLabels.includes(key),
  );

  return found.length > 0 ? found.join(', ') : null;
}

function extractGeneralLabels(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  if (labels['talemåde']) {
    return 'talemåde (idiom/proverb)';
  }

  return null;
}

function extractGrammaticalNote(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels || !labels['grammatik']) return null;

  return typeof labels['grammatik'] === 'string'
    ? labels['grammatik']
    : 'grammatik';
}

function extractUsageNote(
  labels?: Partial<
    Record<DetailCategoryDanish | string, string | boolean | string[]>
  >,
): string | null {
  if (!labels) return null;

  if (labels['SPROGBRUG']) {
    return typeof labels['SPROGBRUG'] === 'string'
      ? labels['SPROGBRUG']
      : 'SPROGBRUG';
  }

  if (labels['overført']) {
    return 'overført (figurative/metaphorical usage)';
  }

  return null;
}

function mapStemPosToEnum(stemPos: string): PartOfSpeech {
  switch (stemPos.toLowerCase()) {
    case 'sb.':
      return PartOfSpeech.noun;
    case 'vb.':
      return PartOfSpeech.verb;
    case 'adj.':
      return PartOfSpeech.adjective;
    case 'adv.':
      return PartOfSpeech.adverb;
    case 'præp.':
      return PartOfSpeech.preposition;
    case 'konj.':
      return PartOfSpeech.conjunction;
    case 'pron.':
      return PartOfSpeech.pronoun;
    case 'interj.':
      return PartOfSpeech.interjection;
    case 'num.':
      return PartOfSpeech.numeral;
    default:
      return PartOfSpeech.undefined;
  }
}

function getRelationshipDescription(
  relationType: RelationshipType,
): string | null {
  // Danish-specific relationships
  switch (relationType) {
    case RelationshipType.definite_form_da:
      return 'Definite form (bestemt form)';
    case RelationshipType.plural_da:
      return 'Plural form (flertal)';
    case RelationshipType.plural_definite_da:
      return 'Plural definite form (bestemt form flertal)';
    case RelationshipType.present_tense_da:
      return 'Present tense form (nutid)';
    case RelationshipType.past_tense_da:
      return 'Past tense form (datid)';
    case RelationshipType.past_participle_da:
      return 'Past participle form (tillægsform)';
    case RelationshipType.imperative_da:
      return 'Imperative form (bydeform)';
    case RelationshipType.comparative_da:
      return 'Comparative form (komparativ)';
    case RelationshipType.superlative_da:
      return 'Superlative form (superlativ)';
    // General relationships
    case RelationshipType.synonym:
      return 'Synonym relationship';
    case RelationshipType.antonym:
      return 'Antonym relationship';
    case RelationshipType.stem:
      return 'Stem relationship';
    case RelationshipType.phrase:
      return 'Phrase';
    default:
      return null;
  }
}
