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
import { LogLevel, clientLog } from '@/core/lib/utils/logUtils';
import {
  fetchWordFrequency,
  getGeneralFrequency,
  getPartOfSpeechFrequency,
} from '@/core/lib/services/frequencyService';
import { TranslationService } from '@/core/lib/services/translationService';
import { validateDanishDictionary } from '@/core/lib/utils/validations/danishDictionaryValidator';
import { mapDanishPosToEnum } from '@/core/lib/utils/danishDictionary/mapDaEng';
import { transformDanishForms } from '@/core/lib/utils/danishDictionary/transformDanishForms';
import {
  WordVariant,
  PartOfSpeechDanish,
  DetailCategoryDanish,
} from '@/core/types/translationDanishTypes';
import { serverLog } from '@/core/lib/server/serverLogger';
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
      clientLog(
        `No translation data returned for word: ${mainWordText}`,
        LogLevel.WARN,
      );
      return;
    }

    const { english_word_data, translation_word_for_danish_dictionary } =
      translationResponse;
    const danish_word_data = translation_word_for_danish_dictionary;

    // Validate the Danish dictionary data to catch any unknown entities
    const validationResult = validateDanishDictionary(
      danish_word_data,
      `word: ${mainWordText}`,
    );

    // Log validation results if issues found
    if (validationResult.totalIssues > 0) {
      serverLog(
        `Validation issues for "${mainWordText}": ${validationResult.totalIssues} total issues`,
        LogLevel.INFO,
      );

      // Log enum suggestions for development
      const enumSuggestions = Object.entries(
        validationResult.suggestedEnumAdditions,
      );
      if (enumSuggestions.length > 0) {
        enumSuggestions.forEach(([category, suggestions]) => {
          serverLog(
            `${category} enum needs these additions: ${suggestions.join(' ')}`,
            LogLevel.INFO,
          );
        });
      }

      // Stop processing if structural errors found (optional - you might want to continue)
      if (!validationResult.isValid) {
        serverLog(
          `Structural errors found in Danish dictionary data for "${mainWordText}". Skipping processing.`,
          LogLevel.ERROR,
        );
        return;
      }
    }

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
  isPrimaryArg: boolean = false,
  languageCode: LanguageCode = LanguageCode.en,
  source: SourceType = SourceType.merriam_learners,
): Promise<void> {
  if (!audioFiles || audioFiles.length === 0) {
    return;
  }

  // Determine which audio file will be primary, if any
  let primaryAudioCandidate: AudioFile | null = null;
  if (isPrimaryArg && audioFiles.length > 0) {
    primaryAudioCandidate = audioFiles[0] || null;
  }

  // Determine which audio file will be non-primary, if any
  // It must be different from the primary candidate and we only take one.
  let nonPrimaryAudioCandidate: AudioFile | null = null;
  for (let i = 0; i < audioFiles.length; i++) {
    // If isPrimaryArg is true and i is 0, this is the primary candidate.
    // So, a non-primary candidate must not be this one.
    if (isPrimaryArg && i === 0) {
      continue;
    }
    nonPrimaryAudioCandidate = audioFiles[i] || null;
    break; // Take the first available non-primary
  }

  // 1. Handle Primary Audio
  if (primaryAudioCandidate) {
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: { url: primaryAudioCandidate.url, languageCode },
      },
      create: {
        url: primaryAudioCandidate.url,
        languageCode: languageCode,
        source: source,
        note: primaryAudioCandidate.note || primaryAudioCandidate.word || null,
      },
      update: {
        source: source,
        note: primaryAudioCandidate.note || primaryAudioCandidate.word || null,
      },
    });

    // Demote any existing primary audio for this wordDetailsId that is not the current audio.
    await tx.wordDetailsAudio.updateMany({
      where: {
        wordDetailsId: wordDetailsId,
        isPrimary: true,
        NOT: { audioId: audio.id },
      },
      data: { isPrimary: false },
    });

    // Upsert the designated primary audio.
    // This ensures it's correctly linked and marked as primary.
    // If it was previously non-primary, its status will be updated.
    await tx.wordDetailsAudio.upsert({
      where: { wordDetailsId_audioId: { wordDetailsId, audioId: audio.id } },
      update: { isPrimary: true },
      create: { wordDetailsId, audioId: audio.id, isPrimary: true },
    });
  }

  // 2. Handle Non-Primary Audio
  if (nonPrimaryAudioCandidate) {
    // Ensure it's not the same audio file that was just processed as primary
    if (
      primaryAudioCandidate &&
      primaryAudioCandidate.url === nonPrimaryAudioCandidate.url
    ) {
      // This audio was already processed as primary, so nothing to do here.
    } else {
      const audio = await tx.audio.upsert({
        where: {
          url_languageCode: { url: nonPrimaryAudioCandidate.url, languageCode },
        },
        create: {
          url: nonPrimaryAudioCandidate.url,
          languageCode: languageCode,
          source: source,
          note:
            nonPrimaryAudioCandidate.note ||
            nonPrimaryAudioCandidate.word ||
            null,
        },
        update: {
          source: source,
          note:
            nonPrimaryAudioCandidate.note ||
            nonPrimaryAudioCandidate.word ||
            null,
        },
      });

      // Check if a different non-primary audio already exists for this wordDetailsId.
      const existingOtherNonPrimary = await tx.wordDetailsAudio.findFirst({
        where: {
          wordDetailsId: wordDetailsId,
          isPrimary: false,
          NOT: { audioId: audio.id }, // Exclude the current audio itself
        },
      });

      if (existingOtherNonPrimary) {
        // If a different non-primary audio exists, remove its link to make way for the new one.
        await tx.wordDetailsAudio.delete({
          where: {
            wordDetailsId_audioId: {
              wordDetailsId: existingOtherNonPrimary.wordDetailsId,
              audioId: existingOtherNonPrimary.audioId,
            },
          },
        });
      }

      // Upsert the designated non-primary audio.
      // If this audio was previously primary, this will update it to non-primary.
      await tx.wordDetailsAudio.upsert({
        where: { wordDetailsId_audioId: { wordDetailsId, audioId: audio.id } },
        update: { isPrimary: false },
        create: { wordDetailsId, audioId: audio.id, isPrimary: false },
      });
    }
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
      clientLog(
        `Fetched frequency data in upsertWord for "${wordText}": ${frequencyGeneral}`,
        LogLevel.INFO,
      );
    } catch (error) {
      clientLog(
        `Error fetching frequency data in upsertWord for "${wordText}": ${error}`,
        LogLevel.ERROR,
      );
      frequencyGeneral = null;
    }
  }

  // Create word record (etymology removed from here)
  const word = await tx.word.upsert({
    where: {
      word_languageCode: {
        word: wordText,
        languageCode,
      },
    },
    update: {
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
    null, // frequency will be fetched in upsertWordDetails
    null, // gender
    null, // forms
    options?.etymology ?? null, // Pass etymology to WordDetails
  );
  clientLog(
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
  partOfSpeech: PartOfSpeech | null, // Input can be null or a specific PoS
  source: SourceType = SourceType.user,
  isPlural: boolean = false,
  variant: string = '',
  phonetic: string | null = null,
  frequency: number | null = null,
  gender: Gender | null = null,
  forms: string | null = null,
  etymology: string | null = null,
): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
  // Determine the definitive PartOfSpeech to be persisted in the DB for this operation.
  // If the input `partOfSpeech` is null, PartOfSpeech.undefined is used.
  const dbPoSToPersist: PartOfSpeech = partOfSpeech || PartOfSpeech.undefined;

  // Fetch frequency data using dbPoSToPersist for an accurate lookup.
  let posFrequency = frequency;
  if (posFrequency === null || posFrequency === undefined) {
    try {
      const wordRecord = await tx.word.findUnique({
        where: { id: wordId },
        select: { word: true, languageCode: true },
      });

      if (wordRecord) {
        const frequencyData = await fetchWordFrequency(
          wordRecord.word,
          wordRecord.languageCode as LanguageCode,
        );
        posFrequency = getPartOfSpeechFrequency(frequencyData, dbPoSToPersist);
        clientLog(
          `Fetched POS frequency data in upsertWordDetails for word ID ${wordId}, POS ${dbPoSToPersist}: ${posFrequency}`,
          LogLevel.INFO,
        );
      }
    } catch (error) {
      clientLog(
        `Error fetching POS frequency data in upsertWordDetails for word ID ${wordId}: ${error}`,
        LogLevel.ERROR,
      );
      posFrequency = null;
    }
  }

  // Upsert the WordDetails record with the definitive dbPoSToPersist.
  const wordDetails = await tx.wordDetails.upsert({
    where: {
      wordId_partOfSpeech_variant: {
        wordId,
        partOfSpeech: dbPoSToPersist,
        variant: variant || '',
      },
    },
    create: {
      wordId,
      partOfSpeech: dbPoSToPersist,
      phonetic: phonetic,
      variant: variant,
      isPlural,
      source: source,
      frequency: posFrequency,
      gender: gender,
      forms: forms,
      etymology: etymology,
    },
    update: {
      // Update all relevant non-key fields.
      // PoS is part of the where clause, so it matches the target state or creates it.
      isPlural: isPlural,
      phonetic: phonetic !== null ? phonetic : null, // Explicitly set, even if null, to clear existing values if needed
      source: source !== 'user' ? source : SourceType.user,
      frequency: posFrequency !== null ? posFrequency : null,
      gender: gender !== null ? gender : null,
      forms: forms !== null ? forms : null,
      etymology: etymology !== null ? etymology : null,
    },
  });

  // After ensuring the target PoS record exists and is up-to-date,
  // clean up any alternative PoS state for the same wordId and variant.
  if (dbPoSToPersist !== PartOfSpeech.undefined) {
    // A specific PoS was persisted, so remove any lingering Undefined PoS record.
    await tx.wordDetails.deleteMany({
      where: {
        wordId: wordId,
        variant: variant || '',
        partOfSpeech: PartOfSpeech.undefined,
      },
    });
  }

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
      clientLog(
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
  const sourceEntityId = `${source}-${mainWordText}-${partOfSpeech}-(${variant})-(${danishWordData.word.forms.join(',')})`;
  let frequencyGeneral = null;
  let frequency = null;
  try {
    const frequencyData = await fetchWordFrequency(mainWordText, language);
    frequencyGeneral = getGeneralFrequency(frequencyData);
    frequency = getPartOfSpeechFrequency(frequencyData, partOfSpeech);
  } catch (error) {
    clientLog(
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
          const eligibleAudioSourceEntries: typeof audioFiles = [];
          let foundGrundform = false;
          const allowedChainWords = ['', 'i sammensætning'];

          for (let i = 0; i < audioFiles.length; i++) {
            const currentSourceEntry = audioFiles[i];
            if (!currentSourceEntry) continue; // Skip if entry is undefined

            if (i === 0 && currentSourceEntry.word === 'grundform') {
              eligibleAudioSourceEntries.push(currentSourceEntry);
              foundGrundform = true;
            } else if (
              foundGrundform &&
              currentSourceEntry.word !== null &&
              allowedChainWords.includes(currentSourceEntry.word)
            ) {
              eligibleAudioSourceEntries.push(currentSourceEntry);
            } else if (foundGrundform) {
              // If grundform was found, but the current word is not in the allowed chain, stop.
              break;
            } else if (currentSourceEntry.word === 'grundform') {
              // If grundform is found later in the list, start the chain from here.
              eligibleAudioSourceEntries.length = 0; // Clear previous non-grundform entries
              eligibleAudioSourceEntries.push(currentSourceEntry);
              foundGrundform = true;
            } else {
              // Logic for cases where grundform is not yet found or chain is broken.
              // If strict about starting only with the absolute first entry as grundform,
              // and it wasn't, we might break or simply not populate eligibleAudioSourceEntries.
              // The current setup allows finding a grundform later in the list and starting from there.
            }
          }

          const mappedAudioFiles = eligibleAudioSourceEntries.map((entry) => ({
            url: entry.audio_url,
            word: entry.word || '',
            audio_type: entry.audio_type || null,
            phonetic_audio: entry.phonetic_audio || null,
            note: entry.word || null,
          }));
          files.push(...mappedAudioFiles);
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

  //! forms
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
      audio:
        danishWordData.word.audio && Array.isArray(danishWordData.word.audio)
          ? danishWordData.word.audio.map((a) => ({
              audio_url: a.audio_url,
              audio_type: a.audio_type,
              word: a.word || '',
              phonetic_audio: a.phonetic_audio,
            }))
          : [],
    };
    const formsData = transformDanishForms(danishEntry);

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
              note: a.word || null,
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

  //! stems
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
            fromWord: 'mainWord' as const,
            toWord: 'subWord' as const,
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

  //! Process synonyms from labels of definitions
  // Iterate over each definition of the main word
  if (danishWordData.definition && danishWordData.definition.length > 0) {
    for (const currentMainDef of danishWordData.definition) {
      const synonymsFromLabels: string[] = [];
      if (currentMainDef.labels) {
        // Check 'Synonym' label
        if (currentMainDef.labels.Synonym) {
          if (typeof currentMainDef.labels.Synonym === 'string') {
            synonymsFromLabels.push(currentMainDef.labels.Synonym);
          } else if (Array.isArray(currentMainDef.labels.Synonym)) {
            synonymsFromLabels.push(
              ...currentMainDef.labels.Synonym.filter(
                (s): s is string => typeof s === 'string',
              ),
            );
          }
        }

        // Check 'Synonymer' label
        if (currentMainDef.labels.Synonymer) {
          if (typeof currentMainDef.labels.Synonymer === 'string') {
            synonymsFromLabels.push(currentMainDef.labels.Synonymer);
          } else if (Array.isArray(currentMainDef.labels.Synonymer)) {
            synonymsFromLabels.push(
              ...currentMainDef.labels.Synonymer.filter(
                (s): s is string => typeof s === 'string',
              ),
            );
          }
        }
      }

      for (const synonym of synonymsFromLabels) {
        if (synonym !== mainWordText) {
          // Compare with the main word's text
          subWordsArray.push({
            word: synonym,
            languageCode: language,
            source,
            partOfSpeech: null, // Use the main word's partOfSpeech
            definitions: [], // Synonyms from labels typically don't have their own new definitions here
            relationship: [
              {
                fromWord: 'mainWordDetails' as const, // Relate to the main word
                toWord: 'subWordDetails' as const,
                type: RelationshipType.synonym,
              },
            ],
            sourceData: ['definition_label_synonym'], // Updated sourceData
          });
        }
      }

      //! Check 'Se også' label (Danish for "See also")
      if (currentMainDef.labels['Se også']) {
        const seOgsaValues: string[] = [];
        if (typeof currentMainDef.labels['Se også'] === 'string') {
          seOgsaValues.push(currentMainDef.labels['Se også'] as string);
        } else if (Array.isArray(currentMainDef.labels['Se også'])) {
          // If it's an array, filter for string values just in case, though typically expect string[]
          seOgsaValues.push(
            ...(currentMainDef.labels['Se også'] as string[]).filter(
              (s): s is string => typeof s === 'string',
            ),
          );
        }

        for (const seOgsaWord of seOgsaValues) {
          if (seOgsaWord !== mainWordText) {
            subWordsArray.push({
              word: seOgsaWord,
              languageCode: language,
              source,
              partOfSpeech: null, // "Se også" can refer to various PoS, safer to set null or determine later
              definitions: [],
              relationship: [
                {
                  fromWord: 'mainWordDetails' as const,
                  toWord: 'subWordDetails' as const,
                  type: RelationshipType.synonym, // Treating "Se også" as a type of synonymy or close relation
                },
              ],
              sourceData: ['definition_label_se_ogsa'],
            });
          }
        }
      }
    }
  }

  //! Process antonyms from labels of definitions
  // Iterate over each definition of the main word
  if (danishWordData.definition && danishWordData.definition.length > 0) {
    for (const currentMainDef of danishWordData.definition) {
      const antonymsFromLabels: string[] = [];
      if (currentMainDef.labels) {
        // Check 'Antonym' label
        if (currentMainDef.labels.Antonym) {
          if (typeof currentMainDef.labels.Antonym === 'string') {
            antonymsFromLabels.push(currentMainDef.labels.Antonym);
          } else if (Array.isArray(currentMainDef.labels.Antonym)) {
            antonymsFromLabels.push(
              ...currentMainDef.labels.Antonym.filter(
                (s): s is string => typeof s === 'string',
              ),
            );
          }
        }

        // Check 'Antonymer' label
        if (currentMainDef.labels.Antonym) {
          if (typeof currentMainDef.labels.Antonym === 'string') {
            antonymsFromLabels.push(currentMainDef.labels.Antonym);
          } else if (Array.isArray(currentMainDef.labels.Antonym)) {
            antonymsFromLabels.push(
              ...currentMainDef.labels.Antonym.filter(
                (s): s is string => typeof s === 'string',
              ),
            );
          }
        }
      }

      for (const antonym of antonymsFromLabels) {
        if (antonym !== mainWordText) {
          // Compare with the main word's text
          subWordsArray.push({
            word: antonym,
            languageCode: language,
            source,
            partOfSpeech: null, // Use the main word's partOfSpeech
            definitions: [], // Antonyms from labels typically don't have their own new definitions here
            relationship: [
              {
                fromWord: 'mainWordDetails' as const, // Relate to the main word
                toWord: 'subWordDetails' as const,
                type: RelationshipType.antonym,
              },
            ],
            sourceData: ['definition_label_antonym'], // Updated sourceData
          });
        }
      }
    }
  }

  //! composition of main word
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
            definitions: [],
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
            definitions: [],
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
          clientLog(
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
            definitions: [],
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
          definitions: [],
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

  //! variant of main word
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

        //! Process synonyms from labels of fixed expressions
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

        for (const synonym of synonymsFromLabels) {
          if (synonym !== expression.expression) {
            // Skip self-reference
            subWordsArray.push({
              word: synonym,
              languageCode: language,
              source,
              partOfSpeech: null,
              definitions: [],
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

        //! Process antonyms from labels of fixed expressions
        const antonymsFromLabels: string[] = [];
        if (defItem.labels) {
          // Check 'Synonym' label which can be a string or array
          if (defItem.labels.Synonym) {
            if (typeof defItem.labels.Antonym === 'string') {
              antonymsFromLabels.push(defItem.labels.Antonym);
            } else if (Array.isArray(defItem.labels.Antonym)) {
              antonymsFromLabels.push(
                ...defItem.labels.Antonym.filter((s) => typeof s === 'string'),
              );
            }
          }

          // Check 'Antonymer' label which can be a string or array
          if (defItem.labels.Antonym) {
            if (typeof defItem.labels.Antonym === 'string') {
              antonymsFromLabels.push(defItem.labels.Antonym);
            } else if (Array.isArray(defItem.labels.Antonym)) {
              antonymsFromLabels.push(
                ...defItem.labels.Antonym.filter((s) => typeof s === 'string'),
              );
            }
          }
        }

        for (const antonym of antonymsFromLabels) {
          if (antonym !== expression.expression) {
            // Skip self-reference
            subWordsArray.push({
              word: antonym,
              languageCode: language,
              source,
              partOfSpeech: null,
              definitions: [],
              relationship: [
                {
                  fromWord: expression.expression as RelationshipFromTo,
                  toWord: 'subWordDetails' as const,
                  type: RelationshipType.antonym,
                },
              ],
              sourceData: ['expression_antonym'],
            });
          }
        }

        //! Check 'Se også' label (Danish for "See also") for fixed expressions
        if (defItem.labels && defItem.labels['Se også']) {
          const seOgsaValues: string[] = [];
          if (typeof defItem.labels['Se også'] === 'string') {
            seOgsaValues.push(defItem.labels['Se også'] as string);
          } else if (Array.isArray(defItem.labels['Se også'])) {
            // If it's an array, filter for string values
            seOgsaValues.push(
              ...(defItem.labels['Se også'] as string[]).filter(
                (s): s is string => typeof s === 'string',
              ),
            );
          }

          for (const seOgsaWord of seOgsaValues) {
            if (seOgsaWord !== expression.expression) {
              // Compare with the expression text
              subWordsArray.push({
                word: seOgsaWord,
                languageCode: language,
                source,
                partOfSpeech: null, // "Se også" can refer to various PoS
                definitions: [],
                relationship: [
                  {
                    fromWord: expression.expression as RelationshipFromTo, // Relate to the current expression
                    toWord: 'subWordDetails' as const,
                    type: RelationshipType.synonym,
                  },
                ],
                sourceData: ['expression_label_se_ogsa'], // Distinct sourceData
              });
            }
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
      processedData.word.etymology,
    );

    for (const definitionData of processedData.definitions) {
      if (
        definitionData.definition.split(' ').length === 1 &&
        definitionData.definition.startsWith('se')
      ) {
        continue;
      }
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
        if (
          defData.definition.split(' ').length === 1 &&
          defData.definition.startsWith('se')
        ) {
          continue;
        }
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
          false,
          subWord.variant || '',
          subWord.phonetic || null,
          null,
          subWord.gender || null,
          subWord.forms || null,
          subWord.etymology || null,
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
            clientLog(
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
            let resolvedFromWordDetailsId: number;
            let resolvedToWordDetailsId: number;

            // These are needed for sub-word details creation if not main word
            const isFromPlural =
              relation.type === RelationshipType.plural_da &&
              fromWordId !== mainWord.id && // Only for actual sub-words
              fromWordPartOfSpeech === PartOfSpeech.noun;
            const isToPlural =
              relation.type === RelationshipType.plural_da &&
              toWordId !== mainWord.id && // Only for actual sub-words
              toWordPartOfSpeech === PartOfSpeech.noun;

            // Resolve fromWordDetailsId
            if (
              fromWordId === mainWord.id &&
              fromWordPartOfSpeech === partOfSpeech
            ) {
              // This refers to the main word's canonical WordDetails entry
              resolvedFromWordDetailsId = mainWordDetails.id;
            } else {
              // This refers to a sub-word or another word. Upsert its details.
              // Assume empty variant for sub-words in this relationship context for now.
              const subFromDetails = await upsertWordDetails(
                tx,
                fromWordId!,
                fromWordPartOfSpeech,
                source,
                isFromPlural, // Use here
                '', // Default empty variant for sub-words here
                null, // phonetic
                null, // frequency
                null, // gender
                null, // forms
                null, // etymology
              );
              resolvedFromWordDetailsId = subFromDetails.id;
            }

            // Resolve toWordDetailsId
            if (
              toWordId === mainWord.id &&
              toWordPartOfSpeech === partOfSpeech
            ) {
              // This refers to the main word's canonical WordDetails entry
              resolvedToWordDetailsId = mainWordDetails.id;
            } else {
              // This refers to a sub-word or another word. Upsert its details.
              // Assume empty variant for sub-words in this relationship context for now.
              const subToDetails = await upsertWordDetails(
                tx,
                toWordId!,
                toWordPartOfSpeech,
                source,
                isToPlural, // Use here
                '', // Default empty variant for sub-words here
                null, // phonetic
                null, // frequency
                null, // gender
                null, // forms
                null, // etymology
              );
              resolvedToWordDetailsId = subToDetails.id;
            }

            await tx.wordDetailsRelationship.upsert({
              where: {
                fromWordDetailsId_toWordDetailsId_type: {
                  fromWordDetailsId: resolvedFromWordDetailsId,
                  toWordDetailsId: resolvedToWordDetailsId,
                  type: relation.type,
                },
              },
              create: {
                fromWordDetailsId: resolvedFromWordDetailsId,
                toWordDetailsId: resolvedToWordDetailsId,
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
    'ASTROLOGI',
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
