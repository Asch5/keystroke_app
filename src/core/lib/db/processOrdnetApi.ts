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
import { clientLog } from '@/core/lib/utils/logUtils';
// Frequency services are now handled by FrequencyManager and WordService
import { TranslationService } from '@/core/lib/services/translationService';
import { validateDanishDictionary } from '@/core/lib/utils/validations/danishDictionaryValidator';
import { mapDanishPosToEnum } from '@/core/lib/utils/danishDictionary/mapDaEng';
import { transformDanishForms } from '@/core/lib/utils/danishDictionary/transformDanishForms';
import {
  WordVariant,
  PartOfSpeechDanish,
  DetailCategoryDanish,
} from '@/core/types/translationDanishTypes';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { FrequencyManager } from '@/core/shared/services/FrequencyManager';
import { WordService } from '@/core/shared/services/WordService';
import { audioDownloadService } from '@/core/shared/services/external-apis/audioDownloadService';
import { type AudioMetadata } from '@/core/shared/services/external-apis/blobStorageService';
import { getDanishFormDefinition as getDanishFormDefinitionUtil } from '@/core/lib/utils/danishDictionary/getDanishFormDefinition';
//import { processTranslationsForWord } from '@/core/lib/db/wordTranslationProcessor';

/**
 * Helper function to determine if a definition ID represents a main definition
 * Main definitions have simple numeric IDs like "1", "2", "3"
 * Sub-definitions have IDs like "1.a", "1.b", "2.a", etc.
 * @param definitionId The definition ID to check (can be undefined/null for single definitions)
 * @param isFirstDefinition Whether this is the first definition in the array
 * @returns true if this is a main definition, false if it's a sub-definition
 */
function isMainDefinition(
  definitionId: string | undefined | null,
  isFirstDefinition: boolean = false,
): boolean {
  // If there's no ID (single definition), treat the first one as main
  if (!definitionId) {
    serverLog(
      `Definition has no ID, treating as ${isFirstDefinition ? 'MAIN' : 'SUB'} definition (first: ${isFirstDefinition})`,
      'info',
    );
    return isFirstDefinition;
  }

  // A main definition ID should be a simple number (possibly with leading/trailing whitespace)
  const trimmedId = definitionId.trim();

  // Check if it's a pure integer (digits only)
  const isInteger = /^\d+$/.test(trimmedId);

  // Log the determination for debugging
  serverLog(
    `Definition ID "${definitionId}" (trimmed: "${trimmedId}") is ${isInteger ? 'MAIN' : 'SUB'} definition`,
    'info',
  );

  return isInteger;
}

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
 * Helper function to determine the appropriate part of speech for a synonym or antonym
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

  if (wordCount === 1) {
    if (relatedPartOfSpeech === PartOfSpeech.phrase) {
      return PartOfSpeech.undefined;
    }
    return relatedPartOfSpeech;
  } else {
    return PartOfSpeech.phrase;
  }
}

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
        'warn',
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
        'info',
      );

      // Log enum suggestions for development
      const enumSuggestions = Object.entries(
        validationResult.suggestedEnumAdditions,
      );
      if (enumSuggestions.length > 0) {
        enumSuggestions.forEach(([category, suggestions]) => {
          serverLog(
            `${category} enum needs these additions: ${suggestions.join(' ')}`,
            'info',
          );
        });
      }

      // Stop processing if structural errors found (optional - you might want to continue)
      if (!validationResult.isValid) {
        serverLog(
          `Structural errors found in Danish dictionary data for "${mainWordText}". Skipping processing.`,
          'error',
        );
        return;
      }
    }

    if (!english_word_data) {
      serverLog(
        `No translation data returned for word: ${mainWordText}`,
        'warn',
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
 * Downloads external audio files and stores them in blob storage before saving to database
 * @param tx Transaction client
 * @param wordDetailsId Word details ID to link audio to
 * @param audioFiles Array of audio file URLs
 * @param isPrimary Whether this is the primary audio for the word
 * @param wordText Word text for metadata (optional)
 */
async function processAudioForWord(
  tx: Prisma.TransactionClient,
  wordDetailsId: number,
  audioFiles: AudioFile[],
  isPrimaryArg: boolean = false,
  languageCode: LanguageCode = LanguageCode.en,
  source: SourceType = SourceType.merriam_learners,
  wordText?: string,
): Promise<void> {
  if (!audioFiles || audioFiles.length === 0) {
    return;
  }

  serverLog(
    `Processing ${audioFiles.length} audio files for wordDetailsId: ${wordDetailsId}`,
    'info',
  );

  // First, download all external audio files and get their blob storage URLs
  const downloadPromises = audioFiles.map(async (audioFile) => {
    // Prepare metadata for this audio file
    const audioMetadata: AudioMetadata = {
      languageCode: languageCode,
      qualityLevel: 'standard', // External audio files are typically standard quality
      voiceGender: 'FEMALE', // Default for Danish sources
      characterCount: wordText?.length || audioFile.word?.length || 0,
    };

    // Download and store the audio
    const downloadResult = await audioDownloadService.downloadAndStoreAudio(
      audioFile.url,
      audioMetadata,
    );

    return {
      originalAudioFile: audioFile,
      downloadResult,
      localUrl:
        downloadResult.success && downloadResult.localUrl
          ? downloadResult.localUrl
          : audioFile.url,
    };
  });

  // Wait for all downloads to complete
  const downloadResults = await Promise.all(downloadPromises);

  // Log download results
  const successful = downloadResults.filter(
    (r) => r.downloadResult.success,
  ).length;
  const failed = downloadResults.filter(
    (r) => !r.downloadResult.success,
  ).length;
  const skipped = downloadResults.filter(
    (r) => r.downloadResult.skipped,
  ).length;

  serverLog(
    `Audio download results: ${successful} successful, ${skipped} skipped, ${failed} failed`,
    'info',
  );

  // If any downloads failed, log the errors
  downloadResults.forEach((result, index) => {
    if (!result.downloadResult.success && !result.downloadResult.skipped) {
      serverLog(
        `Failed to download audio ${index + 1}: ${result.downloadResult.error}`,
        'warn',
      );
    }
  });

  // Determine which audio file will be primary, if any
  let primaryAudioCandidate: {
    localUrl: string;
    originalAudioFile: AudioFile;
  } | null = null;
  if (isPrimaryArg && downloadResults.length > 0) {
    primaryAudioCandidate = downloadResults[0] || null;
  }

  // Determine which audio file will be non-primary, if any
  let nonPrimaryAudioCandidate: {
    localUrl: string;
    originalAudioFile: AudioFile;
  } | null = null;
  for (let i = 0; i < downloadResults.length; i++) {
    if (isPrimaryArg && i === 0) {
      continue;
    }
    nonPrimaryAudioCandidate = downloadResults[i] || null;
    break;
  }

  // 1. Handle Primary Audio
  if (primaryAudioCandidate) {
    const audio = await tx.audio.upsert({
      where: {
        url_languageCode: { url: primaryAudioCandidate.localUrl, languageCode },
      },
      create: {
        url: primaryAudioCandidate.localUrl,
        languageCode: languageCode,
        source: source,
        note:
          primaryAudioCandidate.originalAudioFile.note ||
          primaryAudioCandidate.originalAudioFile.word ||
          'Downloaded from external source',
      },
      update: {
        source: source,
        note:
          primaryAudioCandidate.originalAudioFile.note ||
          primaryAudioCandidate.originalAudioFile.word ||
          'Downloaded from external source',
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
    await tx.wordDetailsAudio.upsert({
      where: { wordDetailsId_audioId: { wordDetailsId, audioId: audio.id } },
      update: { isPrimary: true },
      create: { wordDetailsId, audioId: audio.id, isPrimary: true },
    });

    serverLog(
      `Processed primary audio for wordDetailsId ${wordDetailsId}: ${primaryAudioCandidate.localUrl}`,
      'info',
    );
  }

  // 2. Handle Non-Primary Audio
  if (nonPrimaryAudioCandidate) {
    // Ensure it's not the same audio file that was just processed as primary
    if (
      primaryAudioCandidate &&
      primaryAudioCandidate.localUrl === nonPrimaryAudioCandidate.localUrl
    ) {
      // This audio was already processed as primary, so nothing to do here.
    } else {
      const audio = await tx.audio.upsert({
        where: {
          url_languageCode: {
            url: nonPrimaryAudioCandidate.localUrl,
            languageCode,
          },
        },
        create: {
          url: nonPrimaryAudioCandidate.localUrl,
          languageCode: languageCode,
          source: source,
          note:
            nonPrimaryAudioCandidate.originalAudioFile.note ||
            nonPrimaryAudioCandidate.originalAudioFile.word ||
            'Downloaded from external source',
        },
        update: {
          source: source,
          note:
            nonPrimaryAudioCandidate.originalAudioFile.note ||
            nonPrimaryAudioCandidate.originalAudioFile.word ||
            'Downloaded from external source',
        },
      });

      // Check if a different non-primary audio already exists for this wordDetailsId.
      const existingOtherNonPrimary = await tx.wordDetailsAudio.findFirst({
        where: {
          wordDetailsId: wordDetailsId,
          isPrimary: false,
          NOT: { audioId: audio.id },
        },
      });

      if (existingOtherNonPrimary) {
        await tx.wordDetailsAudio.delete({
          where: {
            wordDetailsId_audioId: {
              wordDetailsId: existingOtherNonPrimary.wordDetailsId,
              audioId: existingOtherNonPrimary.audioId,
            },
          },
        });
      }

      await tx.wordDetailsAudio.upsert({
        where: { wordDetailsId_audioId: { wordDetailsId, audioId: audio.id } },
        update: { isPrimary: false },
        create: { wordDetailsId, audioId: audio.id, isPrimary: false },
      });

      serverLog(
        `Processed non-primary audio for wordDetailsId ${wordDetailsId}: ${nonPrimaryAudioCandidate.localUrl}`,
        'info',
      );
    }
  }
}

// Update the upsertWord function to use the shared WordService
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
    options?.partOfSpeech === undefined ? null : options?.partOfSpeech || null;

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
    null, // gender
    null, // forms
    options?.etymology ?? null, // Pass etymology to WordDetails
    options?.frequencyManager, // Pass the frequency manager to avoid duplicate calls
  );

  serverLog(
    `From upsertWord in processOrdnetApi.ts (upsertWord section): wordDetails: ${JSON.stringify(wordDetails)} for word "${wordText}" with PoS option: ${options?.partOfSpeech}, passed to details: ${partOfSpeechForDetails}`,
    'info',
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
      wordText,
    );
  }

  return word;
}

/**
 * Create or update a WordDetails record using shared WordService
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
  frequencyManager?: FrequencyManager,
): Promise<{ id: number; wordId: number; partOfSpeech: PartOfSpeech }> {
  return WordService.upsertWordDetailsDanish(
    tx,
    wordId,
    partOfSpeech,
    source,
    isPlural,
    variant,
    phonetic,
    frequency,
    gender,
    forms,
    etymology,
    frequencyManager,
  );
}

export async function processAndSaveDanishWord(
  danishWordData: WordVariant,
  pTx?: Prisma.TransactionClient, // Optional transaction client parameter
): Promise<ProcessedWordData> {
  // --- 1. Initial Word Processing ---
  const mainWordText = danishWordData.word.word;
  const language = LanguageCode.da;
  const source = SourceType.danish_dictionary;

  /**
   * CRITICAL ETYMOLOGY PRESERVATION FIX:
   *
   * This function implements multiple layers of protection to prevent the main word's
   * etymology from being overwritten during sub-word and relationship processing:
   *
   * 1. Skip upsertWord calls for sub-words that match the main word text
   * 2. Prevent WordDetails updates for main word during relationship processing
   * 3. Only update sub-word WordDetails, never main word WordDetails
   *
   * This ensures the main word's full etymology is preserved throughout processing.
   */
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
  serverLog(`etymology: ${etymology} `, 'info');
  const variant = danishWordData.word.variant || '';
  const sourceEntityId = `${source}- word: ${mainWordText} - pos: ${partOfSpeech} - variant: ${variant} - forms: ${danishWordData.word.forms.join(',')}`;
  // Initialize frequency manager for this processing session
  const frequencyManager = new FrequencyManager();

  let frequencyGeneral = null;
  let frequency = null;

  // Fetch frequency data using the frequency manager
  const frequencyData = await frequencyManager.getFrequencyData(
    mainWordText,
    language,
    partOfSpeech,
  );
  frequencyGeneral = frequencyData.general;
  frequency = frequencyData.posSpecific;

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
    for (const [defIndex, def] of danishWordData.definition.entries()) {
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

      // Determine if this is a main definition based on the ID and position
      const isFirstDefinition = defIndex === 0;
      const isMainDef = isMainDefinition(def.id, isFirstDefinition);

      processedData.definitions.push({
        id: null, // id will be populated after saving
        source: source.toString(),
        languageCode: language,
        definition: def.definition,
        subjectStatusLabels: extractSubjectLabels(def.labels),
        generalLabels: extractGeneralLabels(def.labels),
        grammaticalNote: extractGrammaticalNote(def.labels),
        usageNote: extractUsageNote(def.labels),
        isInShortDef: isMainDef, // Mark main definitions as important
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
        ? getDanishFormDefinitionUtil(
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
            partOfSpeech: determineSynonymPartOfSpeech(synonym, partOfSpeech),
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
              partOfSpeech: determineSynonymPartOfSpeech(
                seOgsaWord,
                partOfSpeech,
              ),
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
            partOfSpeech: determineSynonymPartOfSpeech(antonym, partOfSpeech),
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
            'warn',
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
      for (const [defIndex, defItem] of expression.definition.entries()) {
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
        // Determine if this is a main expression definition based on the ID and position
        const isFirstExpressionDefinition = defIndex === 0;
        const isMainExpressionDef = isMainDefinition(
          defItem.id,
          isFirstExpressionDefinition,
        );

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
              isInShortDef: isMainExpressionDef, // Mark main expression definitions as important
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
                partOfSpeech: determineSynonymPartOfSpeech(
                  variant,
                  PartOfSpeech.phrase,
                ),
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
              partOfSpeech: determineSynonymPartOfSpeech(synonym, partOfSpeech),
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
          if (defItem.labels.Antonym) {
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
              partOfSpeech: determineSynonymPartOfSpeech(antonym, partOfSpeech),
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
                partOfSpeech: determineSynonymPartOfSpeech(
                  seOgsaWord,
                  partOfSpeech,
                ),
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
      frequencyManager: frequencyManager,
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
      frequencyManager,
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
      // CRITICAL FIX: Skip upsertWord if this sub-word has the same text as the main word
      // This prevents the main word from being overwritten with sub-word etymology data
      let subWordEntity: Word;

      if (subWord.word === mainWordText && subWord.languageCode === language) {
        // This is actually the main word, don't call upsertWord - use existing main word
        subWordEntity = mainWord;
        serverLog(
          `Skipping upsertWord for sub-word "${subWord.word}" because it matches main word - using existing main word entity`,
          'info',
        );
      } else {
        // This is a genuine sub-word, safe to call upsertWord
        subWordEntity = await upsertWord(
          tx,
          source,
          subWord.word,
          subWord.languageCode as LanguageCode,
          {
            phonetic: subWord.phonetic || null,
            audioFiles: subWord.audioFiles || null,
            etymology: subWord.etymology || null,
            partOfSpeech: subWord.partOfSpeech,
            frequencyManager: frequencyManager,
          },
        );
      }
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

        // Debug: Log etymology before creating WordDetails
        serverLog(
          `Creating WordDetails for sub-word "${subWord.word}" with etymology: "${subWord.etymology}"`,
          'info',
        );

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
          frequencyManager,
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
        /**
         * IMPROVEMENT: Order relationships processing for logical sequence
         *
         * Process relationships in order of importance:
         * 1. Forms (plural, definite, tense, etc.) - Priority 1
         * 2. Stem relationships - Priority 2
         * 3. Related, synonym, antonym - Priority 3
         * 4. Other relationships - Priority 4
         */

        // Helper function to determine relationship processing priority
        const getRelationshipPriority = (
          relationType: RelationshipType,
        ): number => {
          // Use switch statement for proper TypeScript type checking
          switch (relationType) {
            // Priority 1: Form relationships (Danish grammatical forms)
            case RelationshipType.plural_da:
            case RelationshipType.definite_form_da:
            case RelationshipType.plural_definite_da:
            case RelationshipType.present_tense_da:
            case RelationshipType.past_tense_da:
            case RelationshipType.past_participle_da:
            case RelationshipType.imperative_da:
            case RelationshipType.comparative_da:
            case RelationshipType.superlative_da:
            case RelationshipType.alternative_spelling:
              return 1;

            // Priority 2: Stem relationships
            case RelationshipType.stem:
              return 2;

            // Priority 3: Semantic relationships
            case RelationshipType.related:
            case RelationshipType.synonym:
            case RelationshipType.antonym:
              return 3;

            // Priority 4: Other relationships (phrase, composition, etc.)
            default:
              return 4;
          }
        };

        // Sort relationships by priority before processing
        const sortedRelationships = [...currentSubWord.relationship].sort(
          (a, b) => {
            const priorityA = getRelationshipPriority(a.type);
            const priorityB = getRelationshipPriority(b.type);

            if (priorityA !== priorityB) {
              return priorityA - priorityB; // Lower number = higher priority
            }

            // If same priority, maintain original order
            return 0;
          },
        );

        serverLog(
          `Processing ${sortedRelationships.length} relationships for "${currentSubWord.word}" in priority order`,
          'info',
        );

        // Log the relationship processing order for debugging
        const relationshipOrder = sortedRelationships
          .map(
            (rel, index) =>
              `${index + 1}. ${rel.type} (priority ${getRelationshipPriority(rel.type)})`,
          )
          .join(', ');

        if (sortedRelationships.length > 1) {
          serverLog(
            `Relationship processing order for "${currentSubWord.word}": ${relationshipOrder}`,
            'info',
          );
        }

        for (const relation of sortedRelationships) {
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
              'warn',
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
            /**
             * RELATIONSHIP PROCESSING IMPROVEMENTS SUMMARY:
             *
             * 1. Skip WordDetails creation if they already exist for word+PoS combination
             *    - Prevents duplicate WordDetails for the same word and part of speech
             *    - Reuses existing records when found
             *    - CRITICAL: Preserves main word data, only updates sub-words
             *
             * 2. Pass actual data instead of null values when upserting WordDetails
             *    - Preserves original etymology, forms, phonetic, gender, and variant values
             *    - Finds sub-word data by ID or text to retrieve actual values
             *    - Prevents overwriting existing data with null placeholders
             *
             * 3. Protect main word etymology from being overwritten
             *    - Main word WordDetails are NEVER updated during relationship processing
             *    - Only sub-word WordDetails are updated with actual data when found
             *    - Fixes critical bug where main word lost its etymology data
             *
             * 4. Update existing sub-word WordDetails with actual data
             *    - When reusing existing sub-word WordDetails, update them with actual etymology, phonetic, forms, etc.
             *    - Ensures that previously created minimal records get enriched with full data
             *    - Only updates fields if new data is available (non-null)
             *
             * These improvements prevent data duplication, preserve original word information,
             * and ensure existing records are enriched with complete data during relationship processing.
             */
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

            /**
             * Helper functions to find actual sub-word data to preserve original values
             * instead of overwriting with null values during relationship creation.
             *
             * This fixes the bug where WordDetails were being overwritten with null values
             * for forms, etymology, phonetic, gender, and variant fields.
             */
            // Helper function to find sub-word data by word ID
            const findSubWordDataById = (wordId: number) => {
              const found = allPopulatedSubWords.find((sw) => sw.id === wordId);
              if (found) {
                serverLog(
                  `Found sub-word data by ID ${wordId}: "${found.word}" with etymology: "${found.etymology}"`,
                  'info',
                );
              } else {
                serverLog(
                  `No sub-word data found for wordId: ${wordId}`,
                  'warn',
                );
              }
              return found;
            };

            // Helper function to find sub-word data by word text
            const findSubWordDataByText = (wordText: string) => {
              const found = allPopulatedSubWords.find(
                (sw) => sw.word === wordText,
              );
              if (found) {
                serverLog(
                  `Found sub-word data by text "${wordText}": etymology="${found.etymology}"`,
                  'info',
                );
              } else {
                serverLog(
                  `No sub-word data found for word text: "${wordText}"`,
                  'warn',
                );
              }
              return found;
            };

            // Resolve fromWordDetailsId
            if (
              fromWordId === mainWord.id &&
              fromWordPartOfSpeech === partOfSpeech
            ) {
              // This refers to the main word's canonical WordDetails entry
              resolvedFromWordDetailsId = mainWordDetails.id;
            } else {
              /**
               * IMPROVEMENT: Skip WordDetails creation if they already exist for that word+PoS combination
               *
               * Check if WordDetails already exist for this word+PoS combination before creating new ones.
               * This prevents creating duplicate WordDetails for the same word and part of speech.
               */
              const existingFromWordDetails = await tx.wordDetails.findFirst({
                where: {
                  wordId: fromWordId!,
                  partOfSpeech: fromWordPartOfSpeech || PartOfSpeech.undefined,
                },
                orderBy: {
                  id: 'asc', // Get the earliest created one by ID
                },
              });

              if (existingFromWordDetails) {
                // CRITICAL: Don't update main word's WordDetails - they already have correct data
                if (
                  fromWordId === mainWord.id &&
                  fromWordPartOfSpeech === partOfSpeech
                ) {
                  serverLog(
                    `Reusing existing main word WordDetails ${existingFromWordDetails.id} for main word ID ${fromWordId}, preserving original data`,
                    'info',
                  );
                  resolvedFromWordDetailsId = existingFromWordDetails.id;
                } else {
                  // WordDetails exist for sub-word, update them with actual data if available
                  let fromSubWordData = findSubWordDataById(fromWordId!);

                  // If not found by ID, try to find by relation.fromWord text
                  if (
                    !fromSubWordData &&
                    typeof relation.fromWord === 'string'
                  ) {
                    fromSubWordData = findSubWordDataByText(relation.fromWord);
                  }

                  if (fromSubWordData) {
                    // Update existing WordDetails with actual data from sub-word
                    const fromVariant = fromSubWordData?.variant || '';
                    const fromPhonetic = fromSubWordData?.phonetic || null;
                    const fromGender = fromSubWordData?.gender || null;
                    const fromForms = fromSubWordData?.forms || null;
                    const fromEtymology = fromSubWordData?.etymology || null;

                    serverLog(
                      `Updating existing sub-word WordDetails ${existingFromWordDetails.id} for fromWord ID ${fromWordId} with actual data: etymology="${fromEtymology}", phonetic="${fromPhonetic}", forms="${fromForms}"`,
                      'info',
                    );

                    await tx.wordDetails.update({
                      where: { id: existingFromWordDetails.id },
                      data: {
                        variant: fromVariant,
                        phonetic:
                          fromPhonetic !== null
                            ? fromPhonetic
                            : existingFromWordDetails.phonetic,
                        gender:
                          fromGender !== null
                            ? fromGender
                            : existingFromWordDetails.gender,
                        forms:
                          fromForms !== null
                            ? fromForms
                            : existingFromWordDetails.forms,
                        etymology:
                          fromEtymology !== null
                            ? fromEtymology
                            : existingFromWordDetails.etymology,
                        isPlural: isFromPlural,
                      },
                    });
                  } else {
                    serverLog(
                      `Reusing existing WordDetails ${existingFromWordDetails.id} for fromWord ID ${fromWordId}, PoS ${fromWordPartOfSpeech} (no additional data to update)`,
                      'info',
                    );
                  }

                  resolvedFromWordDetailsId = existingFromWordDetails.id;
                }
              } else {
                // WordDetails don't exist, create new ones with actual data
                // Find the actual sub-word data to get real values instead of nulls
                let fromSubWordData = findSubWordDataById(fromWordId!);

                // If not found by ID, try to find by relation.fromWord text
                if (!fromSubWordData && typeof relation.fromWord === 'string') {
                  fromSubWordData = findSubWordDataByText(relation.fromWord);
                }

                // Use actual data from sub-word if available, otherwise use defaults
                const fromVariant = fromSubWordData?.variant || '';
                const fromPhonetic = fromSubWordData?.phonetic || null;
                const fromGender = fromSubWordData?.gender || null;
                const fromForms = fromSubWordData?.forms || null;
                const fromEtymology = fromSubWordData?.etymology || null;

                // Debug: Log the etymology value being used
                if (fromEtymology) {
                  serverLog(
                    `Using etymology "${fromEtymology}" for fromWord with ID ${fromWordId}, etymology: ${fromEtymology}`,
                    'info',
                  );
                } else {
                  serverLog(
                    `No etymology available for fromWord with ID ${fromWordId} - this might be the issue!`,
                    'warn',
                  );
                }

                // Log when we're preserving actual data vs using defaults
                if (fromSubWordData) {
                  serverLog(
                    `Preserving actual data for fromWord "${fromSubWordData.word}": variant="${fromVariant}", phonetic="${fromPhonetic}", forms="${fromForms}", etymology="${fromEtymology}"`,
                    'info',
                  );
                } else {
                  serverLog(
                    `No sub-word data found for fromWordId ${fromWordId}, using defaults`,
                    'warn',
                  );
                }

                const subFromDetails = await upsertWordDetails(
                  tx,
                  fromWordId!,
                  fromWordPartOfSpeech,
                  source,
                  isFromPlural,
                  fromVariant,
                  fromPhonetic,
                  null, // frequency - keep null as it's calculated separately
                  fromGender,
                  fromForms,
                  fromEtymology,
                  frequencyManager,
                );
                resolvedFromWordDetailsId = subFromDetails.id;
              }
            }

            // Resolve toWordDetailsId
            if (
              toWordId === mainWord.id &&
              toWordPartOfSpeech === partOfSpeech
            ) {
              // This refers to the main word's canonical WordDetails entry
              resolvedToWordDetailsId = mainWordDetails.id;
            } else {
              /**
               * IMPROVEMENT: Skip WordDetails creation if they already exist for that word+PoS combination
               *
               * Check if WordDetails already exist for this word+PoS combination before creating new ones.
               * This prevents creating duplicate WordDetails for the same word and part of speech.
               */
              const existingToWordDetails = await tx.wordDetails.findFirst({
                where: {
                  wordId: toWordId!,
                  partOfSpeech: toWordPartOfSpeech || PartOfSpeech.undefined,
                },
                orderBy: {
                  id: 'asc', // Get the earliest created one by ID
                },
              });

              if (existingToWordDetails) {
                // CRITICAL: Don't update main word's WordDetails - they already have correct data
                if (
                  toWordId === mainWord.id &&
                  toWordPartOfSpeech === partOfSpeech
                ) {
                  serverLog(
                    `Reusing existing main word WordDetails ${existingToWordDetails.id} for main word ID ${toWordId}, preserving original data`,
                    'info',
                  );
                  resolvedToWordDetailsId = existingToWordDetails.id;
                } else {
                  // WordDetails exist for sub-word, update them with actual data if available
                  let toSubWordData = findSubWordDataById(toWordId!);

                  // If not found by ID, try to find by relation.toWord text
                  if (!toSubWordData && typeof relation.toWord === 'string') {
                    toSubWordData = findSubWordDataByText(relation.toWord);
                  }

                  if (toSubWordData) {
                    // Update existing WordDetails with actual data from sub-word
                    const toVariant = toSubWordData?.variant || '';
                    const toPhonetic = toSubWordData?.phonetic || null;
                    const toGender = toSubWordData?.gender || null;
                    const toForms = toSubWordData?.forms || null;
                    const toEtymology = toSubWordData?.etymology || null;

                    serverLog(
                      `Updating existing sub-word WordDetails ${existingToWordDetails.id} for toWord ID ${toWordId} with actual data: etymology="${toEtymology}", phonetic="${toPhonetic}", forms="${toForms}"`,
                      'info',
                    );

                    await tx.wordDetails.update({
                      where: { id: existingToWordDetails.id },
                      data: {
                        variant: toVariant,
                        phonetic:
                          toPhonetic !== null
                            ? toPhonetic
                            : existingToWordDetails.phonetic,
                        gender:
                          toGender !== null
                            ? toGender
                            : existingToWordDetails.gender,
                        forms:
                          toForms !== null
                            ? toForms
                            : existingToWordDetails.forms,
                        etymology:
                          toEtymology !== null
                            ? toEtymology
                            : existingToWordDetails.etymology,
                        isPlural: isToPlural,
                      },
                    });
                  } else {
                    serverLog(
                      `Reusing existing WordDetails ${existingToWordDetails.id} for toWord ID ${toWordId}, PoS ${toWordPartOfSpeech} (no additional data to update)`,
                      'info',
                    );
                  }

                  resolvedToWordDetailsId = existingToWordDetails.id;
                }
              } else {
                // WordDetails don't exist, create new ones with actual data
                // Find the actual sub-word data to get real values instead of nulls
                let toSubWordData = findSubWordDataById(toWordId!);

                // If not found by ID, try to find by relation.toWord text
                if (!toSubWordData && typeof relation.toWord === 'string') {
                  toSubWordData = findSubWordDataByText(relation.toWord);
                }

                // Use actual data from sub-word if available, otherwise use defaults
                const toVariant = toSubWordData?.variant || '';
                const toPhonetic = toSubWordData?.phonetic || null;
                const toGender = toSubWordData?.gender || null;
                const toForms = toSubWordData?.forms || null;
                const toEtymology = toSubWordData?.etymology || null;

                // Debug: Log the etymology value being used
                if (toEtymology) {
                  serverLog(
                    `Using etymology "${toEtymology}" for toWord with ID ${toWordId}, etymology: ${toEtymology}`,
                    'info',
                  );
                } else {
                  serverLog(
                    `No etymology available for toWord with ID ${toWordId} - this might be the issue!`,
                    'warn',
                  );
                }

                // Log when we're preserving actual data vs using defaults
                if (toSubWordData) {
                  serverLog(
                    `Preserving actual data for toWord "${toSubWordData.word}": variant="${toVariant}", phonetic="${toPhonetic}", forms="${toForms}", etymology="${toEtymology}"`,
                    'info',
                  );
                } else {
                  serverLog(
                    `No sub-word data found for toWordId ${toWordId}, using defaults`,
                    'warn',
                  );
                }

                const subToDetails = await upsertWordDetails(
                  tx,
                  toWordId!,
                  toWordPartOfSpeech,
                  source,
                  isToPlural,
                  toVariant,
                  toPhonetic,
                  null, // frequency - keep null as it's calculated separately
                  toGender,
                  toForms,
                  toEtymology,
                  frequencyManager,
                );
                resolvedToWordDetailsId = subToDetails.id;
              }
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
    case 'udråbsord':
      return PartOfSpeech.exclamation;
    case 'førsteled':
      return PartOfSpeech.first_part;
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
